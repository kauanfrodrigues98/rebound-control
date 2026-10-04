<template>
  <main class="financial-portal">
    <header>
      <div>
        <p class="eyebrow">Rebound DLQ</p>
        <h1>Portal financeiro</h1>
        <p v-if="session">{{ session.customerName }}</p>
      </div>
      <button
        v-if="session"
        class="ghost-button"
        :disabled="busy"
        @click="logout"
      >
        Encerrar acesso
      </button>
    </header>
    <p v-if="error" class="billing-error" role="alert">{{ error }}</p>
    <p v-if="busy" role="status">Carregando…</p>
    <template v-if="session">
      <article class="panel">
        <div class="panel-heading">
          <h2>Suas faturas</h2>
          <button :disabled="busy" @click="refresh">Atualizar</button>
        </div>
        <div v-for="invoice in invoices" :key="invoice.id" class="list-row">
          <div>
            <strong>{{ invoice.number }}</strong>
            <p>
              {{ billingStatus(invoice.status) }} · Vence em
              {{ billingDate(invoice.dueAt) }}
            </p>
            <p>
              Saldo: {{ billingMoney(invoice.amountDue, invoice.currency) }}
            </p>
          </div>
          <button
            class="ghost-button"
            :disabled="busy"
            @click="select(invoice.id)"
          >
            Ver detalhes
          </button>
        </div>
        <p v-if="!invoices.length">Nenhuma fatura disponível.</p>
        <div class="billing-actions">
          <button
            class="ghost-button"
            :disabled="page <= 1 || busy"
            @click="changePage(-1)"
          >
            Anterior</button
          ><span>Página {{ page }}</span
          ><button
            class="ghost-button"
            :disabled="!hasMore || busy"
            @click="changePage(1)"
          >
            Próxima
          </button>
        </div>
      </article>
      <BillingInvoiceInformation
        :details="details"
        base="/api/financial-portal"
        customer
        @refresh="refresh"
        @payment="consult"
      />
      <article class="panel" v-if="details && collectible">
        <h2>Como pagar</h2>
        <p v-if="hasPending" class="muted-text">
          Já existe uma cobrança pendente. Consulte o pagamento para recuperar o
          Checkout ou o boleto. A confirmação pode levar algum tempo.
        </p>
        <div class="billing-actions">
          <button
            v-if="invoiceMethods.includes('card')"
            class="ghost-button"
            :disabled="busy || hasPending"
            @click="checkout('card')"
          >
            Pagar com cartão</button
          ><button
            v-if="invoiceMethods.includes('boleto')"
            class="ghost-button"
            :disabled="busy || hasPending || !boletoEligible"
            @click="checkout('boleto')"
          >
            Emitir boleto
          </button>
        </div>
        <p
          v-if="invoiceMethods.includes('boleto') && !boletoEligible"
          class="muted-text"
        >
          Boleto disponível para faturas em BRL com saldo entre R$ 5,00 e R$
          49.999,99.
        </p>
        <div v-if="invoiceMethods.includes('external')">
          <h3>Pagamento direto</h3>
          <p class="billing-instructions">{{ session.externalInstructions }}</p>
          <p class="muted-text">
            Após o recebimento ser confirmado pelo financeiro, o pagamento e o
            recibo aparecerão aqui.
          </p>
        </div>
      </article>
      <article class="panel" v-if="payment">
        <h2>Cobrança {{ billingStatus(payment.status) }}</h2>
        <p v-if="payment.receiptNumber">
          Recebimento registrado: {{ payment.receiptNumber }}.
        </p>
        <p v-if="payment.requiresReconciliation">
          O financeiro precisa conciliar este pagamento. Consulte o atendimento
          antes de pagar novamente.
        </p>
        <p v-if="safeFinancialUrl(payment.checkoutUrl)">
          <a
            :href="safeFinancialUrl(payment.checkoutUrl)!"
            rel="noopener noreferrer"
            class="ghost-button"
            >Continuar no Checkout</a
          >
        </p>
        <div v-if="payment.boleto">
          <h3>Boleto</h3>
          <p v-if="payment.boleto.number">
            Número: {{ payment.boleto.number }}
          </p>
          <p v-if="payment.boleto.expiresAt">
            Validade:
            {{
              billingDate(
                new Date(payment.boleto.expiresAt * 1000).toISOString(),
              )
            }}
          </p>
          <a
            v-if="safeFinancialUrl(payment.boleto.url)"
            :href="safeFinancialUrl(payment.boleto.url)!"
            target="_blank"
            rel="noopener noreferrer"
            >Abrir boleto</a
          >
          <p class="muted-text">
            Boleto emitido não significa pagamento confirmado. Aguarde a
            compensação antes de realizar outro pagamento.
          </p>
        </div>
        <button
          class="ghost-button"
          :disabled="busy"
          @click="consult(payment.paymentId)"
        >
          Atualizar cobrança
        </button>
      </article>
    </template>
    <p v-else-if="!busy">
      Abra o link pessoal enviado pelo financeiro. Se o acesso expirou, solicite
      um novo link.
    </p>
  </main>
</template>
<script setup lang="ts">
import type {
  BillingInvoice,
  CheckoutState,
  FinancialSession,
  InvoiceDetails,
} from '~/types/billing'
import {
  billingDate,
  billingMoney,
  billingStatus,
  safeFinancialUrl,
} from '~/utils/billing'
definePageMeta({ layout: false })
useHead({
  title: 'Portal financeiro | Rebound DLQ',
  meta: [
    { name: 'robots', content: 'noindex,nofollow' },
    { name: 'referrer', content: 'no-referrer' },
  ],
})
const session = ref<FinancialSession | null>(null),
  invoices = ref<BillingInvoice[]>([]),
  details = ref<InvoiceDetails | null>(null),
  payment = ref<CheckoutState | null>(null)
const busy = ref(false),
  error = ref(''),
  page = ref(1),
  hasMore = ref(false)
const invoiceMethods = computed(() => (session.value?.allowedMethods ?? []).filter(method => !details.value?.invoice.allowedMethods || details.value.invoice.allowedMethods.includes(method)))
const collectible = computed(
  () =>
    details.value &&
    ['open', 'partially_paid', 'past_due'].includes(
      details.value.invoice.status,
    ) &&
    details.value.invoice.amountDue > 0,
)
const hasPending = computed(
  () =>
    details.value?.payments.some((p) =>
      ['pending', 'processing'].includes(p.status),
    ) ?? false,
)
const boletoEligible = computed(
  () =>
    details.value?.invoice.currency === 'BRL' &&
    details.value.invoice.amountDue >= 500 &&
    details.value.invoice.amountDue <= 4999999,
)
let timer: ReturnType<typeof setInterval> | undefined
onMounted(async () => {
  busy.value = true
  const token = new URLSearchParams(window.location.hash.slice(1)).get('access')
  if (window.location.hash)
    window.history.replaceState(null, '', window.location.pathname)
  try {
    session.value = token
      ? await $fetch<FinancialSession>('/api/financial-portal/session', {
          method: 'POST',
          body: { token },
        })
      : await $fetch<FinancialSession>('/api/financial-portal/session')
    await loadInvoices()
    timer = setInterval(() => {
      if (
        !busy.value &&
        session.value &&
        document.visibilityState === 'visible'
      )
        void refresh()
    }, 30000)
  } catch {
    error.value =
      'Não foi possível abrir o acesso. Solicite um novo link se ele estiver expirado ou revogado.'
  } finally {
    busy.value = false
  }
})
onUnmounted(() => {
  if (timer) clearInterval(timer)
})
async function loadInvoices() {
  const result = await $fetch<{ invoices: BillingInvoice[]; hasMore: boolean }>(
    '/api/financial-portal/invoices',
    { query: { page: page.value } },
  )
  invoices.value = result.invoices
  hasMore.value = result.hasMore
}
async function select(id: string) {
  if (busy.value) return
  busy.value = true
  error.value = ''
  payment.value = null
  try {
    details.value = await $fetch<InvoiceDetails>(
      `/api/financial-portal/invoices/${id}`,
    )
  } catch {
    error.value = 'Não foi possível consultar a fatura. Atualize o acesso.'
  } finally {
    busy.value = false
  }
}
async function refresh() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    session.value = await $fetch<FinancialSession>(
      '/api/financial-portal/session',
    )
    await loadInvoices()
    if (details.value)
      details.value = await $fetch<InvoiceDetails>(
        `/api/financial-portal/invoices/${details.value.invoice.id}`,
      )
    if (payment.value && details.value)
      payment.value = await $fetch<CheckoutState>(
        `/api/financial-portal/invoices/${details.value.invoice.id}/payments/${payment.value.paymentId}`,
      )
  } catch {
    error.value =
      'Não foi possível atualizar. O acesso pode ter expirado; solicite um novo link.'
  } finally {
    busy.value = false
  }
}
async function changePage(delta: number) {
  page.value += delta
  await refresh()
}
async function consult(id: string) {
  if (busy.value || !details.value) return
  busy.value = true
  error.value = ''
  try {
    payment.value = await $fetch<CheckoutState>(
      `/api/financial-portal/invoices/${details.value.invoice.id}/payments/${id}`,
    )
    details.value = await $fetch<InvoiceDetails>(
      `/api/financial-portal/invoices/${details.value.invoice.id}`,
    )
  } catch {
    error.value =
      'Não foi possível consultar a cobrança. Atualize a página ou consulte o financeiro.'
  } finally {
    busy.value = false
  }
}
async function checkout(method: 'card' | 'boleto') {
  if (busy.value || !details.value) return
  busy.value = true
  error.value = ''
  const invoice = details.value.invoice
  const storageKey = `financial-checkout:${invoice.id}:${method}`
  let key = sessionStorage.getItem(storageKey)
  if (!key) {
    key = crypto.randomUUID()
    sessionStorage.setItem(storageKey, key)
  }
  try {
    payment.value = await $fetch<CheckoutState>(
      `/api/financial-portal/invoices/${invoice.id}/checkout`,
      { method: 'POST', body: { method }, headers: { 'Idempotency-Key': key } },
    )
    details.value = await $fetch<InvoiceDetails>(
      `/api/financial-portal/invoices/${invoice.id}`,
    )
    if (['failed', 'cancelled'].includes(payment.value.status))
      sessionStorage.removeItem(storageKey)
    const url = safeFinancialUrl(payment.value.checkoutUrl)
    if (url) window.location.assign(url)
  } catch {
    error.value =
      'Não foi possível iniciar ou recuperar a cobrança. Atualize a fatura e consulte os pagamentos antes de tentar novamente.'
  } finally {
    busy.value = false
  }
}
async function logout() {
  busy.value = true
  try {
    await $fetch('/api/financial-portal/logout', { method: 'POST', body: {} })
    session.value = null
    invoices.value = []
    details.value = null
    payment.value = null
    if (timer) clearInterval(timer)
  } catch {
    error.value = 'Não foi possível encerrar o acesso.'
  } finally {
    busy.value = false
  }
}
</script>
