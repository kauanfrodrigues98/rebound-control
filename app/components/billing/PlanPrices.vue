<template>
  <section
    class="panel plan-prices"
    aria-labelledby="commercial-prices-heading"
  >
    <div class="panel-heading prices-heading">
      <div>
        <span>Condições financeiras</span>
        <h2 id="commercial-prices-heading">Preços · {{ planName }}</h2>
      </div>
      <button
        type="button"
        class="ghost-button"
        :disabled="loading || saving"
        @click="load"
      >
        <UIcon name="i-lucide-refresh-cw" /> Atualizar
      </button>
    </div>
    <div class="prices-body">
      <div class="plan-price-context">
        <span class="badge neutral">{{
          deployment === "cloud" ? "Cloud" : "Self-hosted"
        }}</span>
        <strong>{{ planName }}</strong>
      </div>
      <p v-if="deployment !== 'cloud'" class="price-scope-note">
        Este preço é exclusivo de self-hosted e não aparece no painel Cloud.
        Para oferecer um upgrade no Cloud, selecione um plano marcado como
        Cloud.
      </p>

      <p class="muted-text">
        Defina o valor de cada ciclo e quando ele passa a valer. Contratos
        existentes preservam suas condições acordadas.
      </p>
      <p v-if="loading" class="muted-text" role="status">
        Carregando preços...
      </p>

      <div v-if="catalog" class="current-price">
        <div>
          <span class="eyebrow">Preço vigente</span
          ><strong
            >{{
              catalog.current
                ? billingMoney(catalog.current.amount, catalog.current.currency)
                : "Ainda não publicado"
            }}<small v-if="catalog.current">
              / {{ cycle(catalog.current.intervalMonths) }}</small
            ></strong
          >
        </div>
        <p>
          {{
            catalog.current
              ? "Novas contratações usam este preço."
              : "Publique um preço vigente para disponibilizar este plano no catálogo de contratação."
          }}
        </p>
      </div>
      <form
        v-if="canWrite && active && catalog"
        class="drawer-form price-editor"
        @submit.prevent="publish"
      >
        <div>
          <h3>Nova versão de preço</h3>
          <p class="muted-text">Informe o valor total do ciclo selecionado.</p>
        </div>
        <div class="price-fields">
          <label
            >Valor por ciclo<BillingMoneyInput
              v-model="form.amount"
              required
              :disabled="saving"
          /></label>
          <label
            >Periodicidade<select
              v-model.number="form.intervalMonths"
              :disabled="saving"
            >
              <option :value="1">Mensal</option>
              <option :value="3">Trimestral</option>
              <option :value="6">Semestral</option>
              <option :value="12">Anual</option>
            </select></label
          >
          <label
            >Quando começa a valer<select
              v-model="form.timing"
              :disabled="saving"
            >
              <option value="now">Imediatamente</option>
              <option value="scheduled">Agendar para uma data</option>
            </select></label
          >
          <label v-if="form.timing === 'scheduled'"
            >Data e hora da vigência<input
              v-model="form.effectiveAt"
              type="datetime-local"
              required
              :disabled="saving"
            /><small>Fuso do seu navegador.</small></label
          >
        </div>
        <label
          >Motivo da alteração<textarea
            v-model.trim="form.reason"
            placeholder="Ex.: lançamento do plano ou reajuste de preço"
            required
            minlength="3"
            maxlength="1000"
            :disabled="saving"
          />
        </label>
        <div class="price-actions">
          <p class="muted-text">
            Publicar um preço não gera cobrança. Valores personalizados são
            definidos no contrato do cliente.
          </p>
          <button
            type="submit"
            class="submit-button"
            :disabled="saving || loading"
          >
            {{ saving ? "Publicando..." : "Publicar preço" }}
          </button>
        </div>
      </form>
      <p v-else-if="!active" class="muted-text">
        Plano arquivado. O histórico permanece disponível.
      </p>
      <section
        v-if="catalog?.versions.length"
        class="price-history"
        aria-label="Histórico de preços"
      >
        <h3>Histórico de versões</h3>
        <article
          v-for="price in catalog.versions"
          :key="price.id"
          class="price-version"
        >
          <div class="version-title">
            <strong
              >{{ billingMoney(price.amount, price.currency) }}
              <small>/ {{ cycle(price.intervalMonths) }}</small></strong
            ><span class="badge neutral">{{
              new Date(price.effectiveAt).getTime() > Date.now()
                ? "Agendado"
                : price.id === catalog.current?.id
                  ? "Vigente"
                  : "Histórico"
            }}</span>
          </div>
          <span class="muted-text"
            >Vigência: {{ dateTime(price.effectiveAt) }}</span
          >
          <p>{{ price.reason }}</p>
        </article>
        <div class="price-pagination">
          <button
            type="button"
            class="ghost-button"
            :disabled="page === 1 || loading || saving"
            @click="changePage(-1)"
          >
            Anterior</button
          ><span class="muted-text">Página {{ page }}</span
          ><button
            type="button"
            class="ghost-button"
            :disabled="!catalog.hasMore || loading || saving"
            @click="changePage(1)"
          >
            Próxima
          </button>
        </div>
      </section>
    </div>
  </section>
</template>
<script setup lang="ts">
import { requestKey } from "~/utils/request-key";
import type {
  CommercialPriceCatalog,
  CommercialPriceVersion,
} from "~/types/commercial";
import { billingMoney, minorAmount } from "~/utils/billing";
const props = defineProps<{
  planId: string;
  planName: string;
  deployment: string;
  active: boolean;
}>();
const { user } = useControlAuth();
const canWrite = computed(() => user.value?.role === "admin");
const catalog = ref<CommercialPriceCatalog | null>(null);
const page = ref(1);
const loading = ref(false);
const saving = ref(false);
const error = ref("");
const success = ref("");
const form = reactive({
  amount: "",
  intervalMonths: 1,
  effectiveAt: "",
  timing: "now",
  reason: "",
});
let attempt: {
  hash: string;
  key: string;
  body: {
    amount: number;
    currency: string;
    intervalMonths: number;
    effectiveAt: string;
    reason: string;
  };
} | null = null;
const path = computed(
  () => `/api/billing/plans/${encodeURIComponent(props.planId)}/prices`,
);
function cycle(months: number) {
  return months === 1 ? "mês" : `${months} meses`;
}
function dateTime(value: string) {
  return (
    new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Recife",
    }).format(new Date(value)) + " (Recife)"
  );
}
async function load() {
  loading.value = true;
  error.value = "";
  try {
    catalog.value = await $fetch<CommercialPriceCatalog>(path.value, {
      query: { page: page.value },
    });
  } catch {
    catalog.value = null;
    error.value =
      "Não foi possível consultar os preços. Verifique o acesso e a disponibilidade dos serviços.";
  } finally {
    loading.value = false;
  }
}
async function changePage(delta: number) {
  page.value += delta;
  await load();
}
async function publish() {
  if (saving.value) return;
  error.value = "";
  success.value = "";
  saving.value = true;
  try {
    const amount = minorAmount(form.amount, "BRL", true);
    if (form.reason.trim().length < 3)
      throw new Error("Informe o motivo com pelo menos três caracteres.");
    const scheduled = form.timing === "scheduled";
    const date = scheduled ? new Date(form.effectiveAt) : new Date();
    if (
      !Number.isFinite(date.getTime()) ||
      (scheduled && date.getTime() <= Date.now())
    )
      throw new Error("Escolha uma data e hora futuras para agendar o preço.");
    const hash = JSON.stringify({
      amount,
      intervalMonths: form.intervalMonths,
      timing: form.timing,
      effectiveAt: scheduled ? form.effectiveAt : null,
      reason: form.reason.trim(),
    });
    if (!attempt || attempt.hash !== hash) {
      attempt = {
        hash,
        key: requestKey(),
        body: {
          amount,
          currency: "BRL",
          intervalMonths: form.intervalMonths,
          effectiveAt: date.toISOString(),
          reason: form.reason.trim(),
        },
      };
    }
    const body = attempt.body;
    await $fetch<CommercialPriceVersion>(path.value, {
      method: "POST",
      body,
      headers: { "Idempotency-Key": attempt.key },
    });
    attempt = null;
    success.value =
      "Preço publicado. Contratos e faturas existentes permanecem com suas condições.";
    form.amount = "";
    form.effectiveAt = "";
    form.reason = "";
    page.value = 1;
    await load();
  } catch (cause) {
    const failure = cause as {
      statusCode?: number;
      status?: number;
      message?: string;
    };
    const code = failure.statusCode ?? failure.status;
    error.value =
      code === 409
        ? "Há conflito com uma versão já publicada ou com a vigência escolhida. Atualize o histórico antes de tentar novamente."
        : code === 403
          ? "Seu usuário não tem permissão para publicar preços."
          : code
            ? "Não foi possível publicar o preço. Confira os dados e a conexão com os serviços; repetir os mesmos dados não duplica a operação."
            : (failure.message ?? "Não foi possível publicar o preço.");
  } finally {
    saving.value = false;
  }
}
onMounted(load);
useFeedbackToast(error, 'error');
useFeedbackToast(success, 'success');
</script>
<style scoped>
.plan-prices {
  color: var(--text);
  margin: 24px 0;
  padding: 0;
  overflow: hidden;
}
.prices-heading {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
  margin: 0;
}
.plan-price-context {
  display: flex;
  align-items: center;
  gap: 12px;
}
.price-scope-note {
  border-left: 3px solid var(--amber);
  padding: 12px 16px;
  background: rgba(251, 191, 36, 0.06);
  color: var(--muted-strong);
  border-radius: 6px;
  font-size: 13px;
}
.prices-body {
  display: grid;
  gap: 20px;
  padding: 24px;
}
.prices-body p,
.price-editor h3,
.price-history h3 {
  margin: 0;
}
.current-price {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 18px;
  border: 1px solid var(--border-strong);
  border-radius: 10px;
  background: var(--surface-soft, #121722);
}
.current-price strong {
  display: block;
  margin-top: 6px;
  font-size: 22px;
}
.current-price small,
.version-title small {
  font-size: 13px;
  color: var(--muted);
  font-weight: 500;
}
.current-price p {
  max-width: 360px;
  font-size: 13px;
  color: var(--muted);
}
.price-editor {
  display: grid;
  gap: 18px;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: 10px;
}
.price-fields {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
.price-editor label {
  display: grid;
  gap: 7px;
  min-width: 0;
}
.price-editor label small {
  color: var(--muted);
  font-weight: 400;
}
.price-editor textarea {
  min-height: 88px;
}
.price-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  border-top: 1px solid var(--border);
  padding-top: 18px;
}
.price-actions p {
  max-width: 540px;
  font-size: 13px;
}
.price-actions .submit-button {
  width: auto;
  min-width: 160px;
  flex-shrink: 0;
  margin: 0;
}
.price-editor h3,
.price-history h3,
.version-title strong,
.current-price strong {
  color: var(--text);
}
.price-version p {
  color: var(--muted-strong);
}
.price-history {
  display: grid;
  gap: 12px;
}
.price-version {
  display: grid;
  gap: 8px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow-wrap: anywhere;
}
.version-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.price-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
@media (max-width: 960px) {
  .price-fields {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 640px) {
  .prices-heading,
  .plan-price-context {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .price-scope-note {
    border-left: 3px solid var(--amber);
    padding: 12px 16px;
    background: rgba(251, 191, 36, 0.06);
    color: var(--muted-strong);
    border-radius: 6px;
    font-size: 13px;
  }
  .prices-body {
    padding: 16px;
  }
  .price-fields {
    grid-template-columns: 1fr;
  }
  .price-editor {
    padding: 16px;
  }
  .current-price,
  .price-actions {
    align-items: stretch;
    flex-direction: column;
  }
  .price-actions .submit-button {
    width: 100%;
  }
}
</style>
