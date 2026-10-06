<template>
  <section class="termination-panel">
    <h3>Encerramento do contrato</h3>
    <p v-if="termination">
      {{
        termination.accessEnded ? "Contrato encerrado" : "Encerramento agendado"
      }}
      · {{ date(termination.effectiveAt) }}
    </p>
    <p v-if="termination?.dataRetention">
      Prazo de preservação dos dados operacionais: até {{ date(termination.dataRetention.preserveUntil) }}
      ({{ termination.dataRetention.days }} dias após o encerramento efetivo).
      O histórico financeiro segue uma política de conservação separada.
    </p>
    <p v-if="termination?.dataRetention?.operationalErasedAt">
      Limpeza operacional Cloud confirmada em {{ date(termination.dataRetention.operationalErasedAt) }}.
      Os registros financeiros e comerciais conservados seguem separados.
    </p>
    <p v-if="termination?.deliveryPending" role="status">
      Pedido registrado; sincronização pendente.
    </p>
    <details v-if="!termination && active && canWrite">
      <summary>Agendar encerramento</summary>
      <form class="drawer-form" @submit.prevent="submit">
        <p>
          O período pago será preservado; contratos gratuitos terminam
          imediatamente. Usuários e dados não serão excluídos no ato do encerramento. Faturas
          anteriores continuam sujeitas à conciliação.
        </p>
        <label
          >Motivo<textarea
            v-model="reason"
            required
            minlength="3"
            maxlength="1000"
            :disabled="busy"
            rows="3"
          />
        </label>
        <label class="termination-confirm"
          ><input v-model="confirm" type="checkbox" required :disabled="busy" />
          Confirmo o encerramento ao fim do período pago.</label
        >
        <button class="ghost-button" type="submit" :disabled="busy || !confirm">
          {{ busy ? "Registrando…" : "Confirmar encerramento" }}
        </button>
      </form>
    </details>
    <p v-if="error" role="alert">{{ error }}</p>
  </section>
</template>
<script setup lang="ts">
import { requestKey } from "~/utils/request-key";
const props = defineProps<{
  customerId: string;
  contractId: string;
  active: boolean;
}>();
const { user } = useControlAuth();
const canWrite = computed(() => user.value?.role === "admin");
const termination = ref<{
  dataRetention?: { days: number; preserveUntil: string; operationalErasedAt?: string | null };
  effectiveAt: string;
  accessEnded: boolean;
  deliveryPending: boolean;
} | null>(null);
const busy = ref(false),
  error = ref(""),
  reason = ref(""),
  confirm = ref(false);
let operation: { key: string; reason: string } | undefined;
const path = computed(
  () =>
    `/api/billing/customers/${props.customerId}/contracts/${props.contractId}/termination`,
);
function date(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Recife",
  }).format(new Date(value));
}
async function load() {
  try {
    termination.value = await $fetch(path.value);
  } catch {
    error.value = "Não foi possível consultar o encerramento.";
  }
}
async function submit() {
  if (busy.value || !confirm.value || !canWrite.value) return;
  busy.value = true;
  error.value = "";
  try {
    if (!operation || operation.reason !== reason.value.trim())
      operation = { key: requestKey(), reason: reason.value.trim() };
    termination.value = await $fetch(path.value, {
      method: "POST",
      headers: { "idempotency-key": operation.key },
      body: { reason: operation.reason, confirm: true },
    });
  } catch {
    error.value =
      "Não foi possível confirmar. Verifique se o contrato já utiliza o faturamento interno e tente novamente.";
  } finally {
    busy.value = false;
  }
}
onMounted(load);
watch(
  () => props.contractId,
  () => {
    termination.value = null;
    reason.value = "";
    confirm.value = false;
    operation = undefined;
    void load();
  },
);
</script>
<style scoped>
.termination-panel {
  display: grid;
  gap: 12px;
  margin-top: 20px;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface-soft);
}
h3,
p {
  margin: 0;
}
p,
summary {
  font-size: 13px;
  line-height: 1.6;
  color: var(--muted-strong);
}
summary {
  cursor: pointer;
}
.drawer-form {
  margin-top: 16px;
}
.termination-confirm {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}
.termination-confirm input {
  width: auto;
}
</style>
