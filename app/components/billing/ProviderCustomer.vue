<template>
  <section class="panel">
    <h2>Processador de pagamentos</h2>
    <p>
      {{
        ready
          ? "Cliente vinculado à Stripe."
          : "O vínculo com a Stripe será criado ao iniciar o Checkout ou cadastrar o cartão."
      }}
    </p>
    <p v-if="error" role="alert">{{ error }}</p>
    <button
      v-if="canWrite"
      class="ghost-button"
      :disabled="busy"
      @click="provision"
    >
      Preparar cliente na Stripe</button
    ><button class="ghost-button" :disabled="busy" @click="load">
      Atualizar vínculo
    </button>
  </section>
</template>
<script setup lang="ts">
const props = defineProps<{ base: string; canWrite: boolean }>()
const ready = ref(false),
  busy = ref(false),
  error = ref("")
async function load() {
  busy.value = true
  try {
    ready.value = (
      await $fetch<{ providerReady: boolean }>(`${props.base}/card`)
    ).providerReady
  } catch {
    error.value = "Não foi possível consultar o vínculo Stripe."
  } finally {
    busy.value = false
  }
}
async function provision() {
  if (busy.value) return
  busy.value = true
  error.value = ""
  try {
    ready.value = (
      await $fetch<{ providerReady: boolean }>(`${props.base}/card/customer`, {
        method: "POST"
      })
    ).providerReady
  } catch {
    error.value = "Confira o perfil financeiro e a configuração da Stripe."
  } finally {
    busy.value = false
  }
}
onMounted(load)
</script>
