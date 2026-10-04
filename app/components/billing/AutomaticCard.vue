<template>
  <section class="panel">
    <h2>Cartão para cobranças recorrentes</h2>
    <p v-if="status">
      {{
        status.enabled
          ? "Autorização ativa na Stripe."
          : "Cobrança automática desativada."
      }}
    </p>
    <p v-if="error" role="alert">{{ error }}</p>
    <form v-if="status && !status.enabled" @submit.prevent="setup">
      <label
        ><input v-model="consent" type="checkbox" required :disabled="busy" />{{
          status.consentText
        }}</label
      >
      <button :disabled="busy || !consent">
        {{
          status.pending
            ? "Continuar autorização na Stripe"
            : "Autorizar cartão na Stripe"
        }}
      </button>
    </form>
    <button
      v-if="status?.enabled || status?.pending"
      :disabled="busy"
      @click="disable"
    >
      Desativar cobrança automática
    </button>
    <button :disabled="busy" @click="load">Atualizar cartão</button>
  </section>
</template>
<script setup lang="ts">
const status = ref<{
  enabled: boolean
  pending: boolean
  consentText: string
} | null>(null)
const busy = ref(false),
  error = ref(""),
  consent = ref(false)
let key: string | null = null
async function load() {
  busy.value = true
  try {
    status.value = await $fetch("/api/financial-portal/card")
  } catch {
    error.value = "Não foi possível consultar o cartão."
  } finally {
    busy.value = false
  }
}
async function setup() {
  if (busy.value || !consent.value) return
  busy.value = true
  error.value = ""
  try {
    key ??= crypto.randomUUID()
    const result = await $fetch<{ url: string | null }>(
      "/api/financial-portal/card/setup",
      {
        method: "POST",
        body: { consent: true },
        headers: { "Idempotency-Key": key }
      }
    )
    if (result.url) {
      const url = new URL(result.url)
      if (url.protocol !== "https:" || url.hostname !== "checkout.stripe.com")
        throw new Error("URL inválida")
      window.location.assign(url.href)
    } else {
      key = null
      busy.value = false
      await load()
    }
  } catch {
    error.value =
      "Não foi possível autorizar. Tente novamente com a mesma solicitação."
  } finally {
    busy.value = false
  }
}
async function disable() {
  if (busy.value) return
  busy.value = true
  error.value = ""
  try {
    await $fetch("/api/financial-portal/card", { method: "DELETE" })
    key = null
    busy.value = false
    await load()
  } catch {
    error.value = "Não foi possível desativar o cartão."
  } finally {
    busy.value = false
  }
}
onMounted(load)
</script>
