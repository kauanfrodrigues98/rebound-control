<template>
  <main class="control-auth-page">
    <section class="control-auth-shell">
      <aside class="control-auth-context">
        <div class="control-auth-brand">
          <div class="brand-mark">R</div>
          <div>
            <strong>Rebound Control</strong>
            <span>Painel administrativo</span>
          </div>
        </div>

        <div class="control-auth-copy">
          <p class="eyebrow">Operação interna</p>
          <h1>Controle licenças, instalações e clientes em um só lugar.</h1>
          <p>
            Acesse o painel para emitir licenças, acompanhar check-ins e manter
            ambientes self-hosted sob controle operacional.
          </p>
        </div>
      </aside>

      <section class="control-auth-card" aria-labelledby="login-title">
        <div class="auth-card-top">
          <span class="auth-badge">
            <UIcon name="i-lucide-shield-check" />
            Acesso protegido
          </span>
          <span class="auth-status">
            <i />
            Control
          </span>
        </div>

        <div class="auth-card-heading">
          <p class="eyebrow">{{ isFirstAccess ? 'Primeiro acesso' : 'Login' }}</p>
          <h2 id="login-title">
            {{ isFirstAccess ? 'Definir senha inicial' : 'Entrar no Rebound Control' }}
          </h2>
          <p>
            {{
              isFirstAccess
                ? 'Use a chave de ativação para criar sua senha forte e acessar o painel.'
                : 'Use sua conta administrativa para acessar clientes, licenças e instalações.'
            }}
          </p>
        </div>

        <div class="auth-mode-switch" aria-label="Modo de acesso">
          <button
            type="button"
            :class="{ active: !isFirstAccess }"
            @click="setMode('login')"
          >
            Entrar
          </button>
          <button
            type="button"
            :class="{ active: isFirstAccess }"
            @click="setMode('first-access')"
          >
            Primeiro acesso
          </button>
        </div>

        <div v-if="errorMessage" class="control-auth-error" role="alert">
          <UIcon name="i-lucide-circle-alert" />
          <span>{{ errorMessage }}</span>
        </div>

        <form v-if="!isFirstAccess" class="control-auth-form" @submit.prevent="handleSubmit">
          <label>
            Email
            <input
              v-model.trim="form.email"
              autocomplete="email"
              inputmode="email"
              placeholder="admin@empresa.com"
              required
              type="email"
            />
          </label>

          <label>
            Senha
            <span class="password-field">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="Senha temporária ou atual"
                required
              />
              <button
                type="button"
                :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
                @click="showPassword = !showPassword"
              >
                <UIcon :name="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'" />
              </button>
            </span>
          </label>

          <button class="auth-submit" :disabled="!canSubmitLogin" type="submit">
            <span>{{ isSubmitting ? 'Entrando...' : 'Entrar' }}</span>
            <UIcon :name="isSubmitting ? 'i-lucide-loader-circle' : 'i-lucide-arrow-right'" />
          </button>
        </form>

        <form v-else class="control-auth-form" @submit.prevent="handleFirstAccess">
          <label>
            Email
            <input
              v-model.trim="firstAccessForm.email"
              autocomplete="email"
              inputmode="email"
              placeholder="admin@empresa.com"
              required
              type="email"
            />
          </label>

          <label>
            Chave de ativação
            <input
              v-model.trim="firstAccessForm.setupToken"
              autocomplete="one-time-code"
              placeholder="Cole a chave de primeiro acesso"
              required
              type="text"
            />
          </label>

          <label>
            Nova senha
            <span class="password-field">
              <input
                v-model="firstAccessForm.newPassword"
                :type="showNewPassword ? 'text' : 'password'"
                autocomplete="new-password"
                placeholder="Mínimo 12 caracteres"
                required
              />
              <button
                type="button"
                :aria-label="showNewPassword ? 'Ocultar senha' : 'Mostrar senha'"
                @click="showNewPassword = !showNewPassword"
              >
                <UIcon :name="showNewPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'" />
              </button>
            </span>
            <small v-if="showPasswordMismatch" class="auth-field-error">
              As senhas precisam ser iguais.
            </small>
          </label>

          <label>
            Confirmar senha
            <span class="password-field">
              <input
                v-model="firstAccessForm.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                autocomplete="new-password"
                placeholder="Repita a nova senha"
                required
              />
              <button
                type="button"
                :aria-label="showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'"
                @click="showConfirmPassword = !showConfirmPassword"
              >
                <UIcon :name="showConfirmPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'" />
              </button>
            </span>
          </label>

          <div class="password-rules">
            <span :class="{ ok: passwordStrength.length }">12+ caracteres</span>
            <span :class="{ ok: passwordStrength.upper }">Maiúscula</span>
            <span :class="{ ok: passwordStrength.lower }">Minúscula</span>
            <span :class="{ ok: passwordStrength.number }">Número</span>
            <span :class="{ ok: passwordStrength.special }">Especial</span>
          </div>

          <button class="auth-submit" :disabled="!canSubmitFirstAccess" type="submit">
            <span>{{ isSubmitting ? 'Criando senha...' : 'Criar senha e entrar' }}</span>
            <UIcon :name="isSubmitting ? 'i-lucide-loader-circle' : 'i-lucide-arrow-right'" />
          </button>
        </form>

        <footer class="auth-card-footer">
          <span>Ambiente administrativo</span>
          <button type="button">Preciso de ajuda</button>
        </footer>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
})

useHead({
  title: 'Login | Rebound Control',
})

const showPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')
const authMode = ref<'login' | 'first-access'>('login')
const { login, completeFirstAccess } = useControlAuth()
const form = reactive({
  email: '',
  password: '',
})
const firstAccessForm = reactive({
  email: '',
  setupToken: '',
  newPassword: '',
  confirmPassword: '',
})

const isFirstAccess = computed(() => authMode.value === 'first-access')
const passwordStrength = computed(() => ({
  length: firstAccessForm.newPassword.length >= 12,
  upper: /[A-Z]/.test(firstAccessForm.newPassword),
  lower: /[a-z]/.test(firstAccessForm.newPassword),
  number: /[0-9]/.test(firstAccessForm.newPassword),
  special: /[^A-Za-z0-9]/.test(firstAccessForm.newPassword),
}))
const passwordsMatch = computed(
  () => firstAccessForm.newPassword === firstAccessForm.confirmPassword,
)
const showPasswordMismatch = computed(
  () =>
    firstAccessForm.newPassword.length > 0 &&
    firstAccessForm.confirmPassword.length > 0 &&
    !passwordsMatch.value,
)
const isStrongPassword = computed(() => {
  const rules = passwordStrength.value
  return rules.length && rules.upper && rules.lower && rules.number && rules.special
})
const canSubmitLogin = computed(
  () => !isSubmitting.value && form.email.trim().length > 0 && form.password.length > 0,
)
const canSubmitFirstAccess = computed(
  () =>
    !isSubmitting.value &&
    firstAccessForm.email.trim().length > 0 &&
    firstAccessForm.setupToken.trim().length > 0 &&
    isStrongPassword.value &&
    passwordsMatch.value,
)

function setMode(mode: 'login' | 'first-access'): void {
  authMode.value = mode
  errorMessage.value = ''
}

function getErrorMessage(error: unknown): string {
  const fetchError = error as {
    data?: {
      message?: string
      errors?: Array<{ message: string }>
    }
  }
  return (
    fetchError.data?.errors?.[0]?.message ||
    fetchError.data?.message ||
    'Não foi possível concluir a operação.'
  )
}

async function handleSubmit(): Promise<void> {
  if (!canSubmitLogin.value) return

  errorMessage.value = ''
  isSubmitting.value = true

  try {
    await login({
      email: form.email,
      password: form.password,
    })

    await navigateTo('/')
  } catch (error: unknown) {
    errorMessage.value = getErrorMessage(error)
  } finally {
    isSubmitting.value = false
  }
}

async function handleFirstAccess(): Promise<void> {
  if (!canSubmitFirstAccess.value) return

  errorMessage.value = ''

  if (firstAccessForm.newPassword !== firstAccessForm.confirmPassword) {
    errorMessage.value = 'A confirmação precisa ser igual à nova senha.'
    return
  }

  const rules = passwordStrength.value
  if (!rules.length || !rules.upper || !rules.lower || !rules.number || !rules.special) {
    errorMessage.value =
      'A senha precisa ter 12 caracteres, maiúscula, minúscula, número e caractere especial.'
    return
  }

  isSubmitting.value = true

  try {
    await completeFirstAccess({
      email: firstAccessForm.email,
      setupToken: firstAccessForm.setupToken,
      newPassword: firstAccessForm.newPassword,
      confirmPassword: firstAccessForm.confirmPassword,
    })

    await navigateTo('/')
  } catch (error: unknown) {
    errorMessage.value = getErrorMessage(error)
  } finally {
    isSubmitting.value = false
  }
}
</script>
