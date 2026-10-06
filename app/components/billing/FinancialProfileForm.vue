<template>
  <article class="panel">
    <div class="panel-heading">
      <div>
        <span>Contato financeiro</span>
        <h2>Identificação e meios de pagamento</h2>
      </div>
    </div>
    <form class="drawer-form" @submit.prevent="save">
      <div class="form-grid">
        <label
          >Nome ou razão social<input
            v-model="form.name"
            required
            maxlength="220"
            :disabled="!canWrite || busy" /></label
        ><label
          >Documento<input
            v-model="form.document"
            maxlength="80"
            :disabled="!canWrite || busy" /></label
        ><label
          >E-mail financeiro<input
            v-model="form.email"
            type="email"
            required
            maxlength="320"
            :disabled="!canWrite || busy"
        /></label>
      </div>
      <fieldset :disabled="!canWrite || busy">
        <legend>Meios permitidos</legend>
        <label
          v-for="method in methods"
          :key="method.value"
          class="billing-check"
          ><input
            v-model="form.allowedMethods"
            type="checkbox"
            :value="method.value"
          />{{ method.label }}</label
        >
      </fieldset>
      <label
        >Instruções para pagamento direto<textarea
          v-model="form.externalInstructions"
          rows="3"
          maxlength="2000"
          :required="form.allowedMethods.includes('external')"
          :disabled="!canWrite || busy"
        />
      </label>
      <label class="billing-check"
        ><input
          v-model="form.notificationsEnabled"
          type="checkbox"
          :disabled="!canWrite || busy"
        />Habilitar notificações para este contato</label
      >
      <p class="muted-text">
        A alteração da identificação ou do e-mail revoga os links de acesso
        existentes. Notificações começam pelos eventos posteriores à
        habilitação.
      </p>
      <p v-if="error" role="alert" class="billing-error">{{ error }}</p>
      <button
        v-if="canWrite"
        class="submit-button"
        :disabled="busy || !form.allowedMethods.length"
      >
        {{ busy ? 'Salvando…' : 'Salvar contato financeiro' }}
      </button>
    </form>
  </article>
</template>
<script setup lang="ts">
import type { FinancialProfile } from '~/types/billing'
const props = defineProps<{
  profile: FinancialProfile | null
  base: string
  canWrite: boolean
}>()
const emit = defineEmits<{ saved: [] }>()
const initial = (): FinancialProfile => ({
  name: '',
  document: '',
  email: '',
  allowedMethods: ['card', 'boleto'],
  externalInstructions: '',
  notificationsEnabled: false,
})
const form = reactive(initial())
watch(
  () => props.profile,
  (profile) =>
    Object.assign(
      form,
      profile
        ? { ...profile, allowedMethods: [...profile.allowedMethods] }
        : initial(),
    ),
  { immediate: true },
)
const methods = [
  { value: 'card', label: 'Cartão' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'external', label: 'Pagamento direto' },
]
const busy = ref(false),
  error = ref('')
async function save() {
  busy.value = true
  error.value = ''
  try {
    await $fetch(`${props.base}/profile`, {
      method: 'PUT',
      body: {
        name: form.name,
        document: form.document,
        email: form.email,
        allowedMethods: form.allowedMethods,
        externalInstructions: form.externalInstructions,
        notificationsEnabled: form.notificationsEnabled,
      },
    })
    emit('saved')
  } catch {
    error.value = 'Não foi possível salvar. Confira os campos e sua sessão.'
  } finally {
    busy.value = false
  }
}
</script>
