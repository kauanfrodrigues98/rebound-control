<template>
  <section class="panel contract-terms">
    <div class="panel-heading">
      <div>
        <span>Contrato {{ contract.codigo }}</span>
        <h2>Condições comerciais</h2>
      </div>
      <button type="button" class="ghost-button" :disabled="busy" @click="load">
        Atualizar
      </button>
    </div>
    <div class="contract-content">
      <p class="muted-text">
        Preço e limites acordados são preservados por versão. Os dados originais
        do contrato permanecem no histórico; estas condições serão utilizadas
        pela nova recorrência.
      </p>

      <p v-if="loading" role="status">Carregando condições...</p>
      <div
        v-if="data?.current?.terms.billingMode === 'courtesy'"
        class="terms-summary"
        role="status"
      >
        <strong>Cortesia · sem novas faturas ou cobrança automática</strong>
        <p>
          {{
            data.current.terms.courtesyExpiresAt
              ? `Validade: ${dateTime(data.current.terms.courtesyExpiresAt)}`
              : "Sem prazo de expiração"
          }}
        </p>
        <p>{{ data.current.terms.reason }}</p>
        <p>
          Faturas anteriores permanecem no histórico. Ao encerrar, Cloud volta
          ao Free; self-hosted perde o acesso à licença. Nenhum plano pago será
          contratado automaticamente.
        </p>
        <form v-if="canWrite && editable" @submit.prevent="endCourtesy">
          <label
            >Motivo do encerramento<input
              v-model.trim="courtesyEndReason"
              required
              minlength="3"
              maxlength="1000"
              :disabled="busy"
          /></label>
          <button class="ghost-button" :disabled="busy">
            Encerrar cortesia
          </button>
        </form>
      </div>
      <div v-if="data?.current" class="terms-summary">
        <strong
          >Versão vigente {{ data.current.sourceVersion }}:
          {{
            billingMoney(data.current.terms.amount, data.current.terms.currency)
          }}
          a cada {{ data.current.terms.intervalMonths }} mês(es)</strong
        >
        <p>
          {{
            data.current.status === "synced"
              ? "Sincronizada com o Billing"
              : "Sincronização pendente — novas licenças aguardam confirmação"
          }}
        </p>
        <p>
          Plano {{ data.current.terms.planId }} · vencimento dia
          {{ data.current.terms.dueDay }} ·
          {{ methods(data.current.terms.allowedMethods) }}
        </p>
      </div>
      <p v-else-if="data">
        Nenhuma versão vigente. O contrato continua com seu fluxo anterior até a
        entrada em vigor das novas condições.
      </p>
      <details v-if="data?.versions.length" class="terms-history">
        <summary>
          Histórico das condições <span>Consultar versões e sincronização</span>
        </summary>
        <article v-for="revision in data.versions" :key="revision.id">
          <strong
            >Versão {{ revision.sourceVersion }} ·
            {{ billingMoney(revision.terms.amount, revision.terms.currency) }} /
            {{ revision.terms.intervalMonths }} mês(es)</strong
          >
          <span
            >Vigência {{ dateTime(revision.terms.effectiveAt) }} ·
            {{
              revision.status === "synced" ? "Sincronizada" : "Pendente"
            }}</span
          >
          <p>{{ revision.terms.reason }}</p>
          <p v-if="revision.terms.currencyChange">
            Troca de moeda: {{ revision.terms.currencyChange.from }} →
            {{ revision.terms.currency }}. Solicitante / chamado:
            {{ revision.terms.currencyChange.requestedBy }}
          </p>
          <p v-if="revision.cancelledAt">
            Revisão cancelada. A sincronização do cancelamento será repetida se
            necessário.
          </p>
          <form
            v-if="
              canWrite &&
              !revision.cancelledAt &&
              new Date(revision.terms.effectiveAt).getTime() > Date.now()
            "
            @submit.prevent="cancelRevision(revision.id)"
          >
            <label
              >Motivo do cancelamento<input
                v-model.trim="cancellationReasons[revision.id]"
                required
                minlength="3"
                maxlength="1000"
                :disabled="busy" /></label
            ><button class="ghost-button" :disabled="busy">
              Cancelar revisão futura
            </button>
          </form>
          <button
            v-if="
              canWrite && !revision.cancelledAt && revision.status === 'pending'
            "
            type="button"
            class="ghost-button"
            :disabled="busy"
            @click="sync(revision.id)"
          >
            Tentar sincronizar com Billing
          </button>
        </article>
        <div class="terms-pagination">
          <button
            type="button"
            class="ghost-button"
            :disabled="busy || page === 1"
            @click="changePage(-1)"
          >
            Anterior</button
          ><span>Página {{ page }}</span
          ><button
            type="button"
            class="ghost-button"
            :disabled="busy || !data.hasMore"
            @click="changePage(1)"
          >
            Próxima
          </button>
        </div>
      </details>
      <BillingContractCurrency
        v-if="canWrite && editable && data?.current"
        :customer-id="customerId"
        :contract-id="contract.id"
        :current="data.current"
        @refresh="load"
      />
      <BillingContractRecurrence
        :customer-id="customerId"
        :contract-id="contract.id"
        :active="
          contract.status === 'ativo' &&
          data?.current?.terms.billingMode !== 'courtesy'
        "
      />
      <BillingContractTermination
        :customer-id="customerId"
        :contract-id="contract.id"
        :active="contract.status === 'ativo'"
      />
      <details v-if="canWrite && editable && data" class="terms-editor">
        <summary>
          Registrar nova versão
          <span>Alterar preço, vigência ou limites do contrato</span>
        </summary>
        <form class="drawer-form" @submit.prevent="publish">
          <h3>Preço e vigência</h3>
          <label
            >Condição do contrato<select
              v-model="form.billingMode"
              :disabled="busy"
              @change="billingModeChanged"
            >
              <option
                value="standard"
                :disabled="data?.current?.terms.billingMode === 'courtesy'"
              >
                Cobrança normal
              </option>
              <option value="courtesy">Cortesia · acesso sem cobrança</option>
            </select></label
          >
          <p v-if="form.billingMode === 'courtesy'" class="muted-text">
            Escolha o plano e os limites abaixo. Ciclo e implantação serão zero;
            não haverá novas faturas, cobrança automática ou excedentes. Faturas
            anteriores continuam válidas.
          </p>
          <label v-if="form.billingMode === 'courtesy'"
            >Validade da cortesia (opcional)<input
              v-model="form.courtesyExpiresAt"
              type="datetime-local"
              :disabled="busy"
          /></label>
          <div class="terms-grid">
            <label
              >Moeda da conta financeira<select
                v-model="form.currency"
                :disabled="busy || !!data?.versions.length"
                @change="currencyChanged"
              >
                <option value="BRL">BRL · Real brasileiro</option>
                <option value="USD">USD · Dólar americano</option></select
              ><small
                >A moeda é preservada depois da primeira contratação.</small
              ></label
            >
            <label
              >Plano<select
                v-model="form.planId"
                required
                :disabled="busy"
                @change="planChanged"
              >
                <option value="" disabled>Selecione</option>
                <option
                  v-for="plan in activePlans"
                  :key="plan.id"
                  :value="plan.id"
                >
                  {{ plan.name }}
                </option>
              </select></label
            >
            <label
              >Preço<select
                v-model="form.pricing"
                :disabled="busy || form.billingMode === 'courtesy'"
              >
                <option value="custom">Negociado para este cliente</option>
                <option value="catalog">Versão do catálogo</option>
              </select></label
            >
            <label v-if="form.pricing === 'catalog'"
              >Versão do preço<select
                v-model="form.priceVersionId"
                required
                :disabled="busy || priceLoading"
              >
                <option value="" disabled>Selecione</option>
                <option
                  v-for="price in priceOptions"
                  :key="price.id"
                  :value="price.id"
                >
                  {{ billingMoney(price.amount, price.currency) }} /
                  {{ price.intervalMonths }} mês(es) ·
                  {{ dateTime(price.effectiveAt) }}
                </option>
              </select></label
            >
            <template v-else
              ><label
                >Valor total do ciclo ({{ form.currency }})<BillingMoneyInput
                  v-model="form.amount"
                  :currency="form.currency"
                  required
                  :disabled="busy || form.billingMode === 'courtesy'" /></label
              ><label
                >Periodicidade<select
                  v-model.number="form.intervalMonths"
                  :disabled="busy"
                >
                  <option :value="1">Mensal</option>
                  <option :value="3">Trimestral</option>
                  <option :value="6">Semestral</option>
                  <option :value="12">Anual</option>
                </select></label
              ></template
            >
            <label
              >Implantação ({{ form.currency }})<BillingMoneyInput
                v-model="form.setupAmount"
                :currency="form.currency"
                required
                :disabled="busy || form.billingMode === 'courtesy'"
            /></label>
            <label
              >Dia do vencimento<input
                v-model.number="form.dueDay"
                type="number"
                min="1"
                max="31"
                required
                :disabled="busy"
            /></label>
            <label
              >Início do contrato<input
                v-model="form.startsOn"
                type="date"
                required
                :disabled="busy"
            /></label>
            <label
              >Término do contrato<input
                v-model="form.endsOn"
                type="date"
                :disabled="busy"
            /></label>
            <label
              >Vigência desta versão<input
                v-model="form.effectiveAt"
                type="datetime-local"
                :required="form.billingMode !== 'courtesy'"
                :disabled="busy || form.billingMode === 'courtesy'"
            /></label>
          </div>
          <fieldset :disabled="busy">
            <legend>Meios permitidos</legend>
            <label class="method"
              ><input
                v-model="form.allowedMethods"
                type="checkbox"
                value="card"
              />Cartão</label
            ><label class="method"
              ><input
                v-model="form.allowedMethods"
                type="checkbox"
                value="boleto"
                :disabled="form.currency !== 'BRL'"
              />Boleto pela Stripe</label
            ><label class="method"
              ><input
                v-model="form.allowedMethods"
                type="checkbox"
                value="external"
              />Pagamento direto</label
            >
          </fieldset>
          <fieldset
            v-if="
              selectedPlan?.deployment === 'cloud' &&
              !['free', 'cloud-free'].includes(form.planId) &&
              form.billingMode !== 'courtesy'
            "
          >
            <legend>Excedentes autorizados no contrato</legend>
            <p class="muted-text">
              Informe o preço em {{ form.currency }} por unidade. Campos vazios
              bloqueiam excedentes. O cliente ainda precisa autorizar o consumo
              nas configurações do workspace. O fechamento é mensal em UTC, com
              fatura própria de excedentes e vencimento em 7 dias.
            </p>
            <div class="terms-grid">
              <label v-for="resource in overageResources" :key="resource.key"
                >{{ resource.label
                }}<input
                  v-model.trim="overageRates[resource.key]"
                  inputmode="decimal"
                  placeholder="Não permitir excedente"
                  :disabled="busy"
              /></label>
            </div>
          </fieldset>
          <h3>Limites personalizados</h3>
          <p class="muted-text">
            Campos vazios usam o plano selecionado. Nos limites máximos, digite
            “ilimitado” quando aplicável. Ao abrir uma versão existente, seus
            limites acordados são preenchidos para preservar a negociação.
          </p>
          <div class="terms-grid">
            <label v-for="field in limitFields" :key="field.key"
              >{{ field.label
              }}<input
                v-model.trim="overrides[field.key]"
                :placeholder="
                  String(selectedPlan?.entitlements[field.key] ?? 'Usar plano')
                "
                :disabled="busy"
            /></label>
            <label v-for="field in flagFields" :key="field.key"
              >{{ field.label
              }}<select v-model="overrides[field.key]" :disabled="busy">
                <option value="">Usar plano</option>
                <option value="true">Ativado</option>
                <option value="false">Desativado</option>
              </select></label
            >
          </div>
          <label
            >Motivo / referência do acordo<textarea
              v-model.trim="form.reason"
              required
              minlength="3"
              maxlength="1000"
              :disabled="busy"
            />
          </label>
          <p class="muted-text">
            A vigência usa o fuso do navegador e deve ser posterior à última
            versão. Registrar condições não gera cobrança. Licenças já emitidas
            mantêm sua versão até uma reemissão explícita.
          </p>
          <button class="submit-button" :disabled="busy || priceLoading">
            {{ saving ? "Salvando..." : "Salvar condições do contrato" }}
          </button>
        </form>
      </details>
    </div>
  </section>
</template>
<script setup lang="ts">
import { requestKey } from "~/utils/request-key";
import type { ContratoCliente } from "~/types/customers";
import type { LicensePlan, LicensePlansResponse } from "~/types/licensing";
import type {
  CommercialPriceCatalog,
  CommercialPriceVersion,
} from "~/types/commercial";
import type {
  ContractRevision,
  ContractRevisions,
} from "~/types/contract-commercial";
import { billingMoney, minorAmount } from "~/utils/billing";
const props = defineProps<{ customerId: string; contract: ContratoCliente }>();
const { user } = useControlAuth();
const canWrite = computed(() => user.value?.role === "admin");
const editable = computed(
  () => !["encerrado", "cancelado"].includes(props.contract.status),
);
const loading = ref(false),
  saving = ref(false),
  syncing = ref(false),
  priceLoading = ref(false);
const busy = computed(
  () => loading.value || saving.value || syncing.value || priceLoading.value,
);
const error = ref(""),
  message = ref(""),
  page = ref(1);
const data = ref<ContractRevisions | null>(null),
  plans = ref<LicensePlan[]>([]),
  prices = ref<CommercialPriceCatalog | null>(null);
const activePlans = computed(() => plans.value.filter((plan) => plan.active));
const selectedPlan = computed(() =>
  plans.value.find((plan) => plan.id === form.planId),
);
const path = computed(
  () =>
    `/api/billing/customers/${props.customerId}/contracts/${props.contract.id}/terms`,
);
const form = reactive({
  planId: props.contract.planId || "",
  currency: "BRL" as "BRL" | "USD",
  pricing: "custom" as "custom" | "catalog",
  billingMode: "standard" as "standard" | "courtesy",
  courtesyExpiresAt: "",
  priceVersionId: "",
  amount: "",
  setupAmount: "0",
  intervalMonths: 1,
  dueDay: Number(props.contract.diaVencimento) || 10,
  startsOn: props.contract.dataInicio,
  endsOn: props.contract.dataTermino,
  effectiveAt: "",
  reason: "",
  allowedMethods: ["card", "boleto", "external"] as Array<
    "card" | "boleto" | "external"
  >,
});
const overageResources = [
  { key: "dlq_events", label: "Por evento DLQ excedente" },
  { key: "ai_analysis", label: "Por análise IA excedente" },
  {
    key: "payload_replays",
    label: "Por replay excedente (manual ou automático)",
  },
] as const;
const overageRates = reactive<
  Record<"dlq_events" | "ai_analysis" | "payload_replays", string>
>({ dlq_events: "", ai_analysis: "", payload_replays: "" });
const overrides = reactive<Record<string, string>>({});
const limitFields = [
  { key: "maxUsers", label: "Usuários" },
  { key: "maxProjects", label: "Projetos" },
  { key: "maxMonthlyEvents", label: "Eventos por mês" },
  { key: "maxAiAnalysisMonthly", label: "Análises IA por mês" },
  { key: "maxPayloadReplaysMonthly", label: "Replays por mês" },
  { key: "retentionDays", label: "Retenção em dias" },
  { key: "supportSlaHours", label: "SLA de suporte em horas" },
];
const flagFields = [
  { key: "aiEnabled", label: "Inteligência artificial" },
  { key: "automaticReplayEnabled", label: "Replay automático" },
  { key: "manualReplayEnabled", label: "Replay manual" },
];
const priceOptions = computed(() => {
  const options: Array<
    Pick<
      CommercialPriceVersion,
      "id" | "amount" | "currency" | "intervalMonths" | "effectiveAt"
    >
  > = [...(prices.value?.versions ?? [])];
  const current = prices.value?.current;
  if (current && !options.some((price) => price.id === current.id))
    options.push(current);
  const previous = data.value?.current ?? data.value?.versions[0];
  const terms = previous?.terms;
  if (
    terms?.planId === form.planId &&
    terms.priceVersionId &&
    !options.some((price) => price.id === terms.priceVersionId)
  )
    options.push({
      id: terms.priceVersionId,
      amount: terms.amount,
      currency: terms.currency,
      intervalMonths: terms.intervalMonths,
      effectiveAt: terms.effectiveAt,
    });
  return options;
});
const courtesyEndReason = ref("");
let courtesyEndAttempt: { reason: string; key: string } | null = null;
async function endCourtesy() {
  if (busy.value || !data.value?.current) return;
  saving.value = true;
  error.value = "";
  try {
    const reason = courtesyEndReason.value;
    if (!courtesyEndAttempt || courtesyEndAttempt.reason !== reason)
      courtesyEndAttempt = { reason, key: requestKey() };
    await $fetch(`${path.value}/courtesy/end`, {
      method: "POST",
      body: { reason },
      headers: { "Idempotency-Key": courtesyEndAttempt.key },
    });
    courtesyEndAttempt = null;
    message.value =
      "Encerramento da cortesia registrado. A sincronização de acesso e o retorno Cloud ao Free serão processados automaticamente.";
    await load();
  } catch {
    error.value =
      "Não foi possível encerrar a cortesia. Verifique a sincronização e repita com o mesmo motivo.";
  } finally {
    saving.value = false;
  }
}
function billingModeChanged() {
  if (form.billingMode === "courtesy") {
    form.pricing = "custom";
    form.amount = "0";
    form.setupAmount = "0";
    form.priceVersionId = "";
    form.effectiveAt = "";
  }
}
function localInput(value: string) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
const cancellationReasons = reactive<Record<string, string>>({});
async function cancelRevision(id: string) {
  if (busy.value) return;
  syncing.value = true;
  error.value = "";
  try {
    await $fetch(`${path.value}/${id}/cancel`, {
      method: "POST",
      body: { reason: cancellationReasons[id] },
    });
    message.value =
      "Revisão futura cancelada no Control; sincronização com Billing registrada.";
    await load();
  } catch {
    error.value =
      "Não foi possível cancelar. Somente revisões futuras podem ser canceladas.";
  } finally {
    syncing.value = false;
  }
}

let attempt: { hash: string; key: string; effectiveAt: string } | null = null;
function dateTime(value: string) {
  return (
    new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Recife",
    }).format(new Date(value)) + " (Recife)"
  );
}
function methods(values: string[]) {
  const labels: Record<string, string> = {
    card: "Cartão",
    boleto: "Boleto",
    external: "Pagamento direto",
  };
  return values.map((value) => labels[value] ?? value).join(", ");
}
function amount(value: string) {
  return minorAmount(value, form.currency, true);
}
function major(value: number) {
  const amount = BigInt(value);
  return `${amount / 100n}.${(amount % 100n).toString().padStart(2, "0")}`;
}
function initialize(row: ContractRevision | null) {
  if (!row) return;
  const terms = row.terms;
  for (const resource of overageResources)
    overageRates[resource.key] = terms.overage?.[resource.key]
      ? major(terms.overage[resource.key]!)
      : "";
  Object.assign(form, {
    planId: terms.planId,
    currency: terms.currency,
    pricing: terms.pricing,
    billingMode: terms.billingMode ?? "standard",
    courtesyExpiresAt: terms.courtesyExpiresAt
      ? localInput(terms.courtesyExpiresAt)
      : "",
    priceVersionId: terms.priceVersionId ?? "",
    amount: major(terms.amount),
    setupAmount: major(terms.setupAmount),
    intervalMonths: terms.intervalMonths,
    dueDay: terms.dueDay,
    startsOn: terms.startsOn,
    endsOn: terms.endsOn ?? "",
    allowedMethods: [...terms.allowedMethods],
  });
  for (const field of [...limitFields, ...flagFields]) {
    const value = terms.entitlements[field.key];
    overrides[field.key] =
      value === undefined
        ? ""
        : value === "unlimited"
          ? "ilimitado"
          : String(value);
  }
}
async function load() {
  loading.value = true;
  error.value = "";
  try {
    data.value = await $fetch<ContractRevisions>(path.value, {
      query: { page: page.value },
    });
  } catch {
    data.value = null;
    error.value = "Não foi possível carregar as condições do contrato.";
  } finally {
    loading.value = false;
  }
}
async function loadPrices() {
  const selectedPrice = form.priceVersionId;
  prices.value = null;
  if (!form.planId) return;
  priceLoading.value = true;
  try {
    prices.value = await $fetch<CommercialPriceCatalog>(
      `/api/billing/plans/${encodeURIComponent(form.planId)}/prices`,
      { query: { currency: form.currency } },
    );
    form.priceVersionId = selectedPrice || prices.value.current?.id || "";
  } catch {
    error.value =
      "Não foi possível carregar os preços do plano. Você pode atualizar e tentar novamente.";
  } finally {
    priceLoading.value = false;
  }
}
async function currencyChanged() {
  form.priceVersionId = "";
  form.amount = "";
  form.setupAmount = "0";
  if (form.currency !== "BRL")
    form.allowedMethods = form.allowedMethods.filter((m) => m !== "boleto");
  for (const resource of overageResources) overageRates[resource.key] = "";
  await loadPrices();
}
async function planChanged() {
  form.priceVersionId = "";
  for (const field of [...limitFields, ...flagFields])
    overrides[field.key] = "";
  await loadPrices();
}
async function changePage(delta: number) {
  page.value += delta;
  await load();
}
async function sync(id: string) {
  syncing.value = true;
  error.value = "";
  message.value = "";
  try {
    const result = await $fetch<ContractRevision>(`${path.value}/${id}/sync`, {
      method: "POST",
    });
    message.value =
      result.status === "synced"
        ? "Condições sincronizadas com o Billing."
        : "A revisão continua pendente. Verifique a disponibilidade dos serviços.";
    await load();
  } catch {
    error.value =
      "Não foi possível sincronizar agora. A revisão permanece registrada; tente novamente.";
  } finally {
    syncing.value = false;
  }
}
async function publish() {
  if (busy.value) return;
  saving.value = true;
  error.value = "";
  message.value = "";
  try {
    const values: Record<string, number | string | boolean> = {};
    for (const field of limitFields) {
      const value = overrides[field.key]?.trim();
      if (value)
        values[field.key] =
          value.toLowerCase() === "ilimitado" ? "unlimited" : Number(value);
    }
    for (const field of flagFields) {
      const value = overrides[field.key];
      if (value) values[field.key] = value === "true";
    }
    const overage: Partial<
      Record<"dlq_events" | "ai_analysis" | "payload_replays", number>
    > = {};
    if (
      form.billingMode !== "courtesy" &&
      selectedPlan.value?.deployment === "cloud" &&
      !["free", "cloud-free"].includes(form.planId)
    ) {
      for (const resource of overageResources)
        if (overageRates[resource.key]) {
          const rate = amount(overageRates[resource.key]);
          if (rate <= 0)
            throw new Error("Preço do excedente deve ser positivo.");
          overage[resource.key] = rate;
        }
    }
    const body = {
      overage,
      planId: form.planId,
      currency: form.currency,
      pricing: form.pricing,
      billingMode: form.billingMode,
      courtesyExpiresAt:
        form.billingMode === "courtesy" && form.courtesyExpiresAt
          ? new Date(form.courtesyExpiresAt).toISOString()
          : null,
      priceVersionId: form.pricing === "catalog" ? form.priceVersionId : null,
      ...(form.pricing === "custom"
        ? { amount: amount(form.amount), intervalMonths: form.intervalMonths }
        : {}),
      setupAmount: amount(form.setupAmount),
      dueDay: form.dueDay,
      allowedMethods: [...form.allowedMethods],
      startsOn: form.startsOn,
      endsOn: form.endsOn || null,
      effectiveAt:
        form.billingMode === "courtesy"
          ? new Date().toISOString()
          : new Date(form.effectiveAt).toISOString(),
      overrides: values,
      reason: form.reason,
    };
    const hash = JSON.stringify({
      ...body,
      effectiveAt:
        form.billingMode === "courtesy" ? "immediate" : body.effectiveAt,
    });
    if (!attempt || attempt.hash !== hash)
      attempt = { hash, key: requestKey(), effectiveAt: body.effectiveAt };
    body.effectiveAt = attempt.effectiveAt;
    const result = await $fetch<ContractRevision>(path.value, {
      method: "POST",
      body,
      headers: { "Idempotency-Key": attempt.key },
    });
    attempt = null;
    message.value =
      result.status === "synced"
        ? "Versão registrada e sincronizada com o Billing."
        : "Versão registrada. Sincronização pendente com o Billing.";
    page.value = 1;
    await load();
  } catch {
    error.value =
      "Não foi possível salvar. Confira valores, datas, limites e sua permissão. Após uma falha de comunicação, repita com os mesmos dados.";
  } finally {
    saving.value = false;
  }
}
onMounted(async () => {
  await load();
  try {
    const catalog = await $fetch<LicensePlansResponse>("/api/plans", {
      query: { includeArchived: true },
    });
    plans.value = catalog.plans;
    initialize(data.value?.current ?? data.value?.versions[0] ?? null);
    await loadPrices();
  } catch {
    error.value = "Não foi possível consultar os planos do Licensing.";
  }
});
useFeedbackToast(error, "error");
useFeedbackToast(message, "success");
</script>
<style scoped>
.panel-heading h2 {
  color: var(--text);
}
.drawer-form h3 {
  color: var(--text);
}
.contract-terms {
  margin-top: 20px;
  overflow: hidden;
}
.contract-content {
  display: grid;
  gap: 24px;
  padding: 24px;
}
.contract-content p {
  margin: 0;
  line-height: 1.6;
}
.terms-summary {
  display: grid;
  gap: 8px;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface-soft);
}
.terms-summary strong {
  font-size: 18px;
  color: var(--text);
}
.terms-summary p {
  color: var(--muted);
  font-size: 13px;
}
.terms-history,
.terms-editor {
  border: 1px solid var(--border);
  border-radius: 8px;
  min-width: 0;
}
summary {
  color: var(--text);
  padding: 16px 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
}
summary span {
  display: block;
  color: var(--muted);
  font-size: 12px;
  font-weight: 400;
  margin: 6px 0 0 17px;
}
summary:focus-visible {
  outline: 2px solid var(--green);
  outline-offset: -2px;
  border-radius: 8px;
}
details[open] > summary {
  border-bottom: 1px solid var(--border);
}
.terms-history article {
  display: grid;
  gap: 10px;
  margin: 16px 20px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow-wrap: anywhere;
}
.terms-history article span,
.terms-history article p {
  color: var(--muted);
  font-size: 13px;
}
.terms-history article .ghost-button {
  justify-self: start;
}
.terms-history article form {
  display: grid;
  gap: 12px;
}
.terms-history article input {
  height: 40px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  padding: 0 12px;
}
.terms-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 20px 16px;
  font-size: 13px;
  color: var(--muted);
}
.terms-editor .drawer-form {
  padding: 20px;
  gap: 20px;
}
.drawer-form h3 {
  margin: 0;
  font-size: 14px;
}
.terms-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
label {
  display: grid;
  gap: 6px;
  min-width: 0;
}
input,
select,
textarea {
  width: 100%;
  box-sizing: border-box;
  min-width: 0;
}
fieldset {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
}
legend {
  color: var(--muted-strong);
  padding: 0 6px;
  font-size: 13px;
  font-weight: 700;
}
.drawer-form label.method {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--surface-soft);
  border-radius: 6px;
}
.drawer-form .method input {
  width: 16px;
  height: 16px;
  padding: 0;
  accent-color: var(--green);
}
.submit-button {
  justify-self: end;
  width: auto;
  padding: 0 20px;
}
.ghost-button:disabled,
.submit-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
@media (max-width: 1000px) {
  .terms-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 640px) {
  .contract-content {
    padding: 16px;
    gap: 16px;
  }
  .terms-grid {
    grid-template-columns: 1fr;
  }
  .terms-editor .drawer-form {
    padding: 16px;
  }
  .submit-button {
    width: 100%;
  }
  .terms-history article .ghost-button {
    height: auto;
    min-height: 36px;
    white-space: normal;
    text-align: left;
  }
}
input[type="date"],
input[type="datetime-local"] {
  color-scheme: dark;
}
</style>
