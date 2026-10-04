<template>
  <section class="recurrence">
    <h3>Faturamento recorrente</h3>
    <p class="muted-text">A ativação define a primeira competência. Cada ciclo gera uma fatura; o cliente paga pelos meios acordados. Não há débito automático no cartão nesta etapa.</p>
    <p v-if="error" role="alert" class="status-banner">{{ error }}</p>
    <p v-if="message" role="status">{{ message }}</p>
    <button type="button" class="ghost-button" :disabled="busy" @click="load">Atualizar recorrência</button>
    <template v-if="loaded && recurrence">
      <p>{{ recurrence.nextCycleOn ? `Próxima competência: ${recurrence.nextCycleOn}` : 'Competências concluídas' }} · {{ recurrence.enabled ? 'Processamento habilitado' : 'Processamento pausado' }}</p>
      <p v-if="recurrence.lastError">Processamento pendente. Verifique a disponibilidade e a sincronização dos serviços antes de tentar novamente.</p>
      <NuxtLink v-if="recurrence.lastInvoiceId" :to="`/billing/invoices?customerId=${customerId}`">Consultar faturas do cliente</NuxtLink>
      <template v-if="canWrite && active && recurrence.nextCycleOn">
        <button type="button" class="submit-button" :disabled="busy || !recurrence.enabled" @click="process">Processar próxima competência</button>
        <form class="drawer-form" @submit.prevent="changeState">
          <p class="muted-text">Pausar conserva as competências pendentes. Ao retomar, elas poderão ser faturadas. Cada ciclo tem o valor integral contratado, sem proporcionalidade.</p>
          <label>Motivo da pausa ou retomada<textarea v-model.trim="stateReason" required minlength="3" maxlength="1000" :disabled="busy" /></label>
          <button class="ghost-button" :disabled="busy">{{ recurrence.enabled ? 'Pausar processamento' : 'Retomar processamento' }}</button>
        </form>
      </template>
    </template>
    <form v-else-if="loaded && canWrite && active" class="drawer-form" @submit.prevent="enroll">
      <label>Primeira competência<input v-model="firstCycleOn" type="date" required :disabled="busy" /></label>
      <label>Motivo / referência do acordo<textarea v-model.trim="reason" required minlength="3" maxlength="1000" :disabled="busy" /></label>
      <label class="confirmation"><input v-model="legacyCollectionStopped" type="checkbox" required :disabled="busy" />Confirmo que o fluxo anterior não cobrará estas competências.</label>
      <p class="muted-text">Escolha hoje ou uma data futura, dentro do contrato. As condições vigentes devem estar sincronizadas. A implantação será incluída somente na primeira fatura.</p>
      <button class="submit-button" :disabled="busy">Ativar faturamento recorrente</button>
    </form>
  </section>
</template>
<script setup lang="ts">
import type { ContractRecurrence } from '~/types/contract-recurrence'
const props = defineProps<{ customerId: string; contractId: string; active: boolean }>()
const { user } = useControlAuth()
const canWrite = computed(() => user.value?.role === 'admin')
const path = computed(() => `/api/billing/customers/${props.customerId}/contracts/${props.contractId}/recurrence`)
const recurrence = ref<ContractRecurrence | null>(null)
const busy = ref(false), loaded = ref(false), error = ref(''), message = ref('')
const firstCycleOn = ref(''), reason = ref(''), stateReason = ref(''), legacyCollectionStopped = ref(false)
let attempt: { hash: string; key: string } | null = null
async function load() {
  busy.value = true
  error.value = ''
  try { recurrence.value = await $fetch<ContractRecurrence | null>(path.value); loaded.value = true }
  catch { error.value = 'Não foi possível consultar a recorrência.' }
  finally { busy.value = false }
}
async function mutate(suffix: string, method: 'POST' | 'PUT', body?: unknown, key?: string) {
  if (busy.value) return false
  busy.value = true
  error.value = ''; message.value = ''
  try {
    recurrence.value = await $fetch<ContractRecurrence>(`${path.value}${suffix}`, { method, body, ...(key ? { headers: { 'Idempotency-Key': key } } : {}) })
    message.value = recurrence.value.lastError ? 'Operação pendente; tente novamente após verificar os serviços.' : 'Configuração ou competência registrada. Competências futuras aguardam sua data.'
    return true
  } catch { error.value = 'Não foi possível concluir. Confira datas, condições sincronizadas e permissão. Se houve falha de comunicação, repita os mesmos dados.'; return false }
  finally { busy.value = false }
}
async function enroll() {
  const body = { firstCycleOn: firstCycleOn.value, reason: reason.value, legacyCollectionStopped: legacyCollectionStopped.value }
  const hash = JSON.stringify(body)
  if (!attempt || attempt.hash !== hash) attempt = { hash, key: crypto.randomUUID() }
  if (await mutate('', 'POST', body, attempt.key)) attempt = null
}
async function process() { await mutate('/process', 'POST') }
async function changeState() {
  if (!recurrence.value) return
  if (await mutate('/state', 'PUT', { enabled: !recurrence.value.enabled, reason: stateReason.value })) stateReason.value = ''
}
onMounted(load)
</script>
<style scoped>
.recurrence { border-top: 1px solid var(--border-color, #d4d4d4); margin: 20px 0; padding-top: 16px; }
label { display: grid; gap: 6px; }
.confirmation { display: flex; align-items: center; gap: 8px; }
.confirmation input { width: auto; }
</style>
