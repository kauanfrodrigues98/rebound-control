<template>
  <details class="currency-panel">
    <summary>
      Alterar moeda no próximo ciclo
      <span>{{ current.terms.currency }} → {{ currency }}</span>
    </summary>
    <form class="drawer-form" @submit.prevent="preview">
      <p class="muted-text">
        Use após uma solicitação via suporte. O preço será o do catálogo na nova
        moeda; limites e políticas de excedente serão preservados. Cadastre
        antes o preço do plano nessa moeda.
      </p>
      <div class="currency-fields">
        <label
          >Nova moeda<select :value="currency" disabled>
            <option :value="currency">
              {{
                currency === "USD"
                  ? "USD · Dólar americano"
                  : "BRL · Real brasileiro"
              }}
            </option>
          </select></label
        >
        <label
          >Solicitante / chamado<input
            v-model.trim="requestedBy"
            required
            minlength="3"
            maxlength="200"
            :disabled="busy"
            placeholder="Cliente e referência do chamado"
        /></label>
      </div>
      <label
        >Motivo<textarea
          v-model.trim="reason"
          required
          minlength="3"
          maxlength="1000"
          :disabled="busy"
        />
      </label>
      <div v-if="resources.length" class="currency-fields">
        <label v-for="resource in resources" :key="resource"
          >{{ labels[resource] }} · {{ currency }} por unidade<input
            v-model="rates[resource]"
            required
            inputmode="decimal"
            placeholder="0,00"
            :disabled="busy"
        /></label>
      </div>
      <p class="muted-text">
        Faturas, pagamentos e consumo de ciclos anteriores conservam a moeda
        contratada. A autorização de débito automático no cartão deverá ser
        renovada após a troca. Boleto está disponível apenas em BRL.
      </p>
      <button type="submit" class="ghost-button" :disabled="busy">
        {{ busy ? "Consultando…" : "Consultar prévia" }}
      </button>
      <section v-if="quote" class="currency-preview" aria-live="polite">
        <h4>
          {{ quote.from }} → {{ quote.currency }} ·
          {{ billingDate(quote.effectiveAt) }}
        </h4>
        <p>
          Novo preço:
          <strong>{{ billingMoney(quote.amount, quote.currency) }}</strong> /
          {{ quote.intervalMonths }} mês(es)
        </p>
        <p v-for="(amount, resource) in quote.overage" :key="resource">
          {{ labels[resource] }}:
          {{ billingMoney(amount!, quote.currency) }} por unidade excedente
        </p>
        <p class="muted-text">
          Vigência no início da próxima competência, no fuso America/Recife.
          Nenhuma cobrança é gerada ao agendar.
        </p>
        <button
          type="button"
          class="submit-button"
          :disabled="busy"
          @click="schedule"
        >
          {{ busy ? "Agendando…" : "Confirmar e agendar troca" }}
        </button>
      </section>
      <p v-if="message" role="status">{{ message }}</p>
      <p v-if="error" role="alert" class="currency-error">{{ error }}</p>
    </form>
  </details>
</template>
<script setup lang="ts">
import type { ContractRevision } from "~/types/contract-commercial";
import { billingDate, billingMoney, minorAmount } from "~/utils/billing";
import { requestKey } from "~/utils/request-key";
type Resource = "dlq_events" | "ai_analysis" | "payload_replays";
interface Preview {
  hash: string;
  effectiveAt: string;
  from: string;
  currency: string;
  amount: number;
  intervalMonths: number;
  overage: Partial<Record<Resource, number>>;
}
const props = defineProps<{
  customerId: string;
  contractId: string;
  current: ContractRevision;
}>();
const emit = defineEmits<{ refresh: [] }>();
const currency = computed(() =>
  props.current.terms.currency === "BRL" ? "USD" : "BRL",
);
const resources = computed(
  () => Object.keys(props.current.terms.overage ?? {}) as Resource[],
);
const labels: Record<Resource, string> = {
  dlq_events: "Eventos DLQ",
  ai_analysis: "Análises IA",
  payload_replays: "Reprocessamentos",
};
const requestedBy = ref(""),
  reason = ref(""),
  busy = ref(false),
  message = ref(""),
  error = ref("");
const rates = reactive<Partial<Record<Resource, string>>>({});
const quote = ref<Preview | null>(null);
const path = computed(
  () =>
    `/api/billing/customers/${props.customerId}/contracts/${props.contractId}/terms/currency`,
);
let attempt: { body: string; key: string } | null = null;
function input() {
  return {
    currency: currency.value,
    requestedBy: requestedBy.value,
    reason: reason.value,
    overage: Object.fromEntries(
      resources.value.map((resource) => [
        resource,
        minorAmount(rates[resource] ?? "", currency.value),
      ]),
    ),
  };
}
function failure(cause: unknown) {
  const value = cause as {
    data?: {
      message?: string;
      statusMessage?: string;
      data?: { message?: string };
    };
  };
  return (
    value.data?.data?.message ??
    value.data?.message ??
    value.data?.statusMessage ??
    (cause instanceof Error && cause.message === "Valor inválido."
      ? "Informe as tarifas de excedente na nova moeda."
      : "Não foi possível concluir. Verifique o catálogo, a recorrência e outras alterações pendentes.")
  );
}
async function preview() {
  if (busy.value) return;
  busy.value = true;
  error.value = "";
  message.value = "";
  quote.value = null;
  try {
    quote.value = await $fetch<Preview>(`${path.value}/preview`, {
      method: "POST",
      body: input(),
    });
  } catch (cause) {
    error.value = failure(cause);
  } finally {
    busy.value = false;
  }
}
async function schedule() {
  if (busy.value || !quote.value) return;
  busy.value = true;
  error.value = "";
  message.value = "";
  try {
    const body = { ...input(), expectedHash: quote.value.hash };
    const signature = JSON.stringify(body);
    if (!attempt || attempt.body !== signature)
      attempt = { body: signature, key: requestKey() };
    const revision = await $fetch<ContractRevision>(path.value, {
      method: "POST",
      body,
      headers: { "Idempotency-Key": attempt.key },
    });
    message.value =
      revision.status === "synced"
        ? `Troca agendada para ${billingDate(revision.terms.effectiveAt)}. A moeda atual permanece até o próximo ciclo.`
        : "Solicitação registrada, aguardando sincronização com o Billing. Consulte o histórico e tente sincronizar novamente.";
    quote.value = null;
    attempt = null;
    emit("refresh");
  } catch (cause) {
    error.value = failure(cause);
  } finally {
    busy.value = false;
  }
}
watch(
  [requestedBy, reason, rates, () => props.current.id],
  () => {
    quote.value = null;
  },
  { deep: true },
);
</script>
<style scoped>
.currency-panel {
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}
summary {
  padding: 16px;
  cursor: pointer;
  font-weight: 700;
  font-size: 14px;
  color: var(--text);
}
summary span {
  display: inline-block;
  margin-left: 12px;
  color: var(--green);
}
summary:focus-visible {
  outline: 2px solid var(--green);
  outline-offset: -2px;
}
.drawer-form {
  padding: 16px;
  gap: 16px;
}
.currency-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
label {
  display: grid;
  gap: 6px;
  min-width: 0;
}
p {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
}
.currency-preview {
  display: grid;
  gap: 12px;
  border: 1px solid var(--green);
  background: var(--surface-soft);
  border-radius: 8px;
  padding: 16px;
}
h4 {
  margin: 0;
  color: var(--green);
}
.currency-error {
  color: #fca5a5;
}
button {
  justify-self: start;
  width: auto;
  padding: 10px 16px;
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
@media (max-width: 640px) {
  .currency-fields {
    grid-template-columns: 1fr;
  }
  button {
    width: 100%;
  }
}
</style>
