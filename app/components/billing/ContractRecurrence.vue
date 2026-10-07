<template>
  <section class="recurrence">
    <div class="recurrence-heading">
      <div>
        <h3>Faturamento recorrente</h3>
        <p class="muted-text">
          Competências, faturas e processamento do contrato.
        </p>
      </div>
      <button type="button" class="ghost-button" :disabled="busy" @click="load">
        Atualizar
      </button>
    </div>
    <BillingContractFinancialState
      :customer-id="customerId"
      :contract-id="contractId"
    />
    <p class="muted-text">
      A ativação define a primeira competência. Cada ciclo gera uma fatura; o
      cliente paga pelos meios acordados. O débito automático depende da
      autorização de cartão no portal financeiro.
    </p>

    <template v-if="loaded && recurrence">
      <p>
        {{
          recurrence.nextCycleOn
            ? `Próxima competência: ${formatDate(recurrence.nextCycleOn)}`
            : 'Competências concluídas'
        }}
        ·
        {{
          recurrence.enabled
            ? 'Processamento habilitado'
            : 'Processamento pausado'
        }}
      </p>
      <p v-if="recurrence.lastError">
        Processamento pendente. Verifique a disponibilidade e a sincronização
        dos serviços antes de tentar novamente.
      </p>
      <NuxtLink
        v-if="recurrence.lastInvoiceId"
        :to="`/billing/invoices?customerId=${customerId}`"
        >Consultar faturas do cliente</NuxtLink
      >
      <template v-if="canWrite && active && recurrence.nextCycleOn">
        <button
          type="button"
          class="submit-button"
          :disabled="busy || !recurrence.enabled"
          @click="process"
        >
          Processar próxima competência
        </button>
        <form class="drawer-form" @submit.prevent="changeState">
          <p class="muted-text">
            Pausar conserva as competências pendentes. Ao retomar, elas poderão
            ser faturadas. Cada ciclo tem o valor integral contratado, sem
            proporcionalidade.
          </p>
          <label
            >Motivo da pausa ou retomada<textarea
              v-model.trim="stateReason"
              required
              minlength="3"
              maxlength="1000"
              :disabled="busy"
            />
          </label>
          <button class="ghost-button" :disabled="busy">
            {{
              recurrence.enabled
                ? 'Pausar processamento'
                : 'Retomar processamento'
            }}
          </button>
        </form>
      </template>
    </template>
    <details v-else-if="loaded && canWrite && active" class="recurrence-setup">
      <summary>Ativar faturamento recorrente</summary>
      <form class="drawer-form" @submit.prevent="enroll">
        <label
          >Primeira competência<input
            v-model="firstCycleOn"
            type="date"
            required
            :disabled="busy"
        /></label>
        <label
          >Motivo / referência do acordo<textarea
            v-model.trim="reason"
            required
            minlength="3"
            maxlength="1000"
            :disabled="busy"
          />
        </label>
        <label class="confirmation"
          ><input
            v-model="legacyCollectionStopped"
            type="checkbox"
            required
            :disabled="busy"
          />Confirmo que o fluxo anterior não cobrará estas competências.</label
        >
        <p class="muted-text">
          Escolha hoje ou uma data futura, dentro do contrato. As condições
          vigentes devem estar sincronizadas. A implantação será incluída
          somente na primeira fatura.
        </p>
        <button class="submit-button" :disabled="busy">
          Ativar faturamento recorrente
        </button>
      </form>
    </details>
  </section>
</template>
<script setup lang="ts">
import { formatDate } from "~/utils/date";
import { requestKey } from "~/utils/request-key";
import type { ContractRecurrence } from '~/types/contract-recurrence';
const props = defineProps<{
  customerId: string;
  contractId: string;
  active: boolean;
}>();
const { user } = useControlAuth();
const canWrite = computed(() => user.value?.role === 'admin');
const path = computed(
  () =>
    `/api/billing/customers/${props.customerId}/contracts/${props.contractId}/recurrence`,
);
const recurrence = ref<ContractRecurrence | null>(null);
const busy = ref(false),
  loaded = ref(false),
  error = ref(''),
  message = ref('');
const firstCycleOn = ref(''),
  reason = ref(''),
  stateReason = ref(''),
  legacyCollectionStopped = ref(false);
let attempt: { hash: string; key: string } | null = null;
async function load() {
  busy.value = true;
  error.value = '';
  try {
    recurrence.value = await $fetch<ContractRecurrence | null>(path.value);
    loaded.value = true;
  } catch {
    error.value = 'Não foi possível consultar a recorrência.';
  } finally {
    busy.value = false;
  }
}
async function mutate(
  suffix: string,
  method: 'POST' | 'PUT',
  body?: Record<string, unknown>,
  key?: string,
) {
  if (busy.value) return false;
  busy.value = true;
  error.value = '';
  message.value = '';
  try {
    recurrence.value = await $fetch<ContractRecurrence>(
      `${path.value}${suffix}`,
      { method, body, ...(key ? { headers: { 'Idempotency-Key': key } } : {}) },
    );
    message.value = recurrence.value.lastError
      ? 'Operação pendente; tente novamente após verificar os serviços.'
      : 'Configuração ou competência registrada. Competências futuras aguardam sua data.';
    return true;
  } catch {
    error.value =
      'Não foi possível concluir. Confira datas, condições sincronizadas e permissão. Se houve falha de comunicação, repita os mesmos dados.';
    return false;
  } finally {
    busy.value = false;
  }
}
async function enroll() {
  const body = {
    firstCycleOn: firstCycleOn.value,
    reason: reason.value,
    legacyCollectionStopped: legacyCollectionStopped.value,
  };
  const hash = JSON.stringify(body);
  if (!attempt || attempt.hash !== hash)
    attempt = { hash, key: requestKey() };
  if (await mutate('', 'POST', body, attempt.key)) attempt = null;
}
async function process() {
  await mutate('/process', 'POST');
}
async function changeState() {
  if (!recurrence.value) return;
  if (
    await mutate('/state', 'PUT', {
      enabled: !recurrence.value.enabled,
      reason: stateReason.value,
    })
  )
    stateReason.value = '';
}
onMounted(load);
useFeedbackToast(error, 'error');
useFeedbackToast(message, 'success');
</script>
<style scoped>
.recurrence {
  display: grid;
  gap: 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 20px;
}
.recurrence-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
h3 {
  color: var(--text);
  margin: 0 0 6px;
  font-size: 15px;
}
p {
  margin: 0;
  line-height: 1.6;
  font-size: 13px;
}
.recurrence-setup {
  border: 1px solid var(--border);
  border-radius: 8px;
}
summary {
  color: var(--text);
  padding: 14px 16px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}
summary:focus-visible {
  outline: 2px solid var(--green);
  outline-offset: -2px;
}
details[open] summary {
  border-bottom: 1px solid var(--border);
}
.drawer-form {
  padding: 16px;
  gap: 16px;
}
label {
  display: grid;
  gap: 6px;
  min-width: 0;
}
.drawer-form label.confirmation {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  line-height: 1.5;
  padding: 12px;
  background: var(--surface-soft);
  border-radius: 8px;
}
.drawer-form .confirmation input {
  width: 16px;
  height: 16px;
  margin-top: 2px;
  padding: 0;
  flex-shrink: 0;
  accent-color: var(--green);
}
.submit-button {
  justify-self: start;
  width: auto;
  padding: 0 16px;
}
.ghost-button {
  justify-self: start;
}
a {
  font-size: 13px;
  color: var(--green);
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
@media (max-width: 640px) {
  .recurrence {
    padding: 16px;
  }
  .recurrence-heading {
    align-items: flex-start;
  }
  .submit-button {
    width: 100%;
    height: auto;
    min-height: 42px;
    padding: 10px 16px;
  }
}
input[type='date'],
input[type='datetime-local'] {
  color-scheme: dark;
}
</style>
