<template>
  <div>
    <p v-if="state">
      Pago até
      {{ state.financial.paidThrough || "nenhum período confirmado" }} ·
      {{
        state.financial.overdueSince
          ? "Há faturas vencidas"
          : "Sem faturas vencidas"
      }}<span v-if="state.decision">
        · Licença:
        {{
          state.decision.status === "synced"
            ? "decisão sincronizada"
            : "sincronização pendente"
        }}</span
      >
    </p>
    <p v-if="error" role="alert">{{ error }}</p>
    <button class="ghost-button" type="button" :disabled="busy" @click="load">
      Consultar estado financeiro</button
    ><button
      v-if="canWrite"
      class="ghost-button"
      type="button"
      :disabled="busy"
      @click="sync"
    >
      Sincronizar período pago com Licensing
    </button>
  </div>
</template>
<script setup lang="ts">
const props = defineProps<{ customerId: string; contractId: string }>()
const { user } = useControlAuth()
const canWrite = computed(() => user.value?.role === "admin")
const state = ref<{
    financial: { paidThrough: string | null; overdueSince: string | null }
    decision: { status: string } | null
  } | null>(null),
  busy = ref(false),
  error = ref("")
const path = computed(
  () =>
    `/api/billing/customers/${props.customerId}/contracts/${props.contractId}/financial-state`
)
async function request(method: "GET" | "POST") {
  busy.value = true
  error.value = ""
  try {
    state.value = await $fetch(path.value, { method })
  } catch {
    error.value =
      "Não foi possível consultar ou sincronizar o estado financeiro."
  } finally {
    busy.value = false
  }
}
async function load() {
  await request("GET")
}
async function sync() {
  await request("POST")
}
</script>
