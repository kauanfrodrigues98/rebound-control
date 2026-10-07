<template>
  <div class="financial-state">
    <p v-if="state?.financial.courtesy" role="status">
      Cortesia {{ state.financial.courtesy.active ? "ativa" : "encerrada" }} ·
      {{
        state.financial.courtesy.expiresAt
          ? formatDateTime(state.financial.courtesy.expiresAt)
          : "sem prazo"
      }}. Sem novas cobranças.
    </p>
    <p v-if="state">
      Pago até
      {{
        state.financial.paidThrough
          ? formatDate(state.financial.paidThrough)
          : "nenhum período confirmado"
      }}
      ·
      {{
        state.financial.overdueSince
          ? "Há faturas vencidas"
          : "Sem faturas vencidas"
      }}<span v-if="state.decision">
        · Licença:
        {{
          state.decision.status === "synced"
            ? "decisão sincronizada"
            : state.decision.status === "observed"
              ? "aguardando período pago"
              : "sincronização pendente"
        }}</span
      >
    </p>
    <p v-if="state?.access" role="status">
      {{ accessLabels[state.access.state] }}
      <span v-if="state.access.daysPastDue !== null">
        · {{ state.access.daysPastDue }} dia(s) completos de atraso</span
      >.
      <template v-if="!state.access.enforcementEnabled"
        >Monitoramento: restrições automáticas desativadas.</template
      >
      <template v-else>
        Acesso aplicado:
        {{ accessLabels[state.access.effectiveState] }}.</template
      >
    </p>
    <p v-if="state?.access?.overdueSince" class="muted-text">
      Restrição: {{ formatDateTime(state.access.restrictAt ?? undefined) }} ·
      Suspensão: {{ formatDateTime(state.access.suspendAt ?? undefined) }}.
      Login, consulta e regularização financeira permanecem disponíveis.
    </p>
    <div
      v-if="
        !state?.financial.courtesy &&
        state?.financial.recurrenceState &&
        state.financial.recurrenceState !== 'active'
      "
    >
      <p>
        Recorrência pausada. As faturas existentes permanecem disponíveis; os
        meses suspensos não serão cobrados.
      </p>
      <template v-if="state.financial.recurrenceState === 'renewal_required'">
        <p>
          O período pago terminou. A retomada exige o pagamento de um novo
          ciclo.
        </p>
        <label
          v-if="canWrite && !state.financial.renewalInvoiceId"
          class="renewal-confirmation"
          >Confirme o valor do novo ciclo (R$)
          <input
            v-model="renewalAmount"
            inputmode="decimal"
            placeholder="Ex.: 99,00"
            @input="maskAmount"
          />
        </label>
        <button
          v-if="canWrite && !state.financial.renewalInvoiceId"
          class="ghost-button"
          :disabled="busy || !renewalAmount"
          @click="renew"
        >
          Gerar fatura de retomada
        </button>
        <p v-if="state.financial.renewalInvoiceId">
          Fatura de retomada: {{ state.financial.renewalInvoiceId }}. Acesso
          após pagamento.
        </p>
      </template>
    </div>
    <details
      v-if="canWrite && state && !state.financial.courtesy"
      class="suspension-policy"
    >
      <summary>Política contratual durante suspensão</summary>
      <p>
        Por padrão, novas competências param na suspensão. A cobrança continuada
        só é permitida para self-hosted com acordo explícito de suporte ou
        disponibilidade. A suspensão do uso continua sendo aplicada.
      </p>
      <select v-model="billingPolicy">
        <option value="pause">Pausar novas competências</option>
        <option value="continue">
          Continuar cobrança (acordo self-hosted)
        </option>
      </select>
      <textarea
        v-model="policyReason"
        placeholder="Referência do contrato e motivo do acordo"
      />
      <button
        class="ghost-button"
        :disabled="busy || policyReason.trim().length < 10"
        @click="savePolicy"
      >
        Salvar política contratual
      </button>
    </details>
    <p v-if="error" role="alert">{{ error }}</p>
    <div class="financial-actions">
      <button class="ghost-button" type="button" :disabled="busy" @click="load">
        Consultar estado financeiro</button
      ><button
        v-if="canWrite"
        class="ghost-button"
        type="button"
        :disabled="busy"
        @click="sync"
      >
        Reavaliar acesso e sincronizar licença
      </button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { formatDate, formatDateTime } from "~/utils/date";
type AccessState =
  "healthy" | "payment_attention" | "payment_restricted" | "payment_suspended";
const accessLabels: Record<AccessState, string> = {
  healthy: "Regular",
  payment_attention: "Pagamento em atraso",
  payment_restricted: "Uso restrito",
  payment_suspended: "Uso suspenso",
};
const props = defineProps<{ customerId: string; contractId: string }>();
const { user } = useControlAuth();
const canWrite = computed(() => user.value?.role === "admin");
const state = ref<{
    financial: {
      courtesy?: {
        active: boolean;
        expiresAt: string | null;
        reason: string;
      } | null;
      suspensionBillingPolicy?: "pause" | "continue";
      recurrenceState?: "active" | "paused" | "renewal_required";
      renewalInvoiceId?: string | null;
      paidThrough: string | null;
      overdueSince: string | null;
    };
    decision: { status: string } | null;
    access?: {
      state: AccessState;
      effectiveState: AccessState;
      daysPastDue: number | null;
      enforcementEnabled: boolean;
      overdueSince: string | null;
      restrictAt: string | null;
      suspendAt: string | null;
    };
  } | null>(null),
  busy = ref(false),
  error = ref("");
const renewalAmount = ref("");
const billingPolicy = ref("pause"),
  policyReason = ref("");
const path = computed(
  () =>
    `/api/billing/customers/${props.customerId}/contracts/${props.contractId}/financial-state`,
);
async function request(method: "GET" | "POST") {
  busy.value = true;
  error.value = "";
  try {
    state.value = await $fetch(path.value, { method });
    billingPolicy.value =
      state.value?.financial.suspensionBillingPolicy ?? "pause";
  } catch {
    error.value =
      "Não foi possível consultar ou sincronizar o estado financeiro.";
  } finally {
    busy.value = false;
  }
}
async function savePolicy() {
  busy.value = true;
  error.value = "";
  try {
    state.value = await $fetch(`${path.value}/suspension-policy`, {
      method: "POST",
      body: { policy: billingPolicy.value, reason: policyReason.value },
    });
    policyReason.value = "";
  } catch {
    error.value =
      "Cobrança continuada requer contrato self-hosted ativo, regular e um acordo explícito.";
  } finally {
    busy.value = false;
  }
}
function maskAmount() {
  const digits = renewalAmount.value.replace(/\D/g, "").slice(0, 12);
  renewalAmount.value = digits
    ? new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(digits) / 100)
    : "";
}
async function renew() {
  busy.value = true;
  error.value = "";
  try {
    await $fetch(`${path.value}/renewal`, {
      method: "POST",
      body: { confirmedAmount: Number(renewalAmount.value.replace(/\D/g, "")) },
    });
    await request("GET");
  } catch {
    error.value =
      "Confira o valor vigente e quite os débitos antes de gerar uma nova fatura.";
  } finally {
    busy.value = false;
  }
}
async function load() {
  await request("GET");
}
async function sync() {
  await request("POST");
}
</script>

<style scoped>
.financial-state {
  display: grid;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  background: var(--surface-soft);
}
.financial-state p {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--muted-strong);
}
.renewal-confirmation {
  display: grid;
  gap: 8px;
  margin: 12px 0;
  max-width: 260px;
  font-size: 13px;
}
.renewal-confirmation input {
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface);
  color: inherit;
}
.suspension-policy {
  display: grid;
  gap: 10px;
  font-size: 13px;
}
.suspension-policy select,
.suspension-policy textarea {
  display: block;
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 6px;
}
.financial-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.ghost-button {
  height: auto;
  min-height: 36px;
  padding: 8px 12px;
  font-size: 12px;
  text-align: left;
}
.ghost-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
