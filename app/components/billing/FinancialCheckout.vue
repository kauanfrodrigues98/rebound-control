<script setup lang="ts">
import type {
  BillingInvoice,
  CheckoutState,
  FinancialSession,
  InvoiceDetails,
} from "~/types/billing";
import {
  billingDate,
  billingMoney,
  billingStatus,
  safeFinancialUrl,
} from "~/utils/billing";
import type { gsap as Gsap } from "gsap";
const props = defineProps<{
  session: FinancialSession | null;
  invoices: BillingInvoice[];
  details: InvoiceDetails | null;
  payment: CheckoutState | null;
  busy: boolean;
  error: string;
  page: number;
  hasMore: boolean;
  invoiceMethods: string[];
  collectible: boolean;
  hasPending: boolean;
  boletoEligible: boolean;
}>();
const emit = defineEmits<{
  refresh: [];
  select: [id: string];
  page: [delta: number];
  consult: [id: string];
  checkout: [method: "card" | "boleto"];
  logout: [];
}>();
const root = ref<HTMLElement | null>(null);
const method = ref<"card" | "boleto">("card");
const pendingPayment = computed(() =>
  props.details?.payments.find(
    (p) =>
      ["pending", "processing"].includes(p.status) && p.provider === "stripe",
  ),
);
watch(
  () => [
    props.details?.invoice.id,
    props.invoiceMethods.join(","),
    props.boletoEligible,
  ],
  () => {
    if (props.invoiceMethods.includes("card")) method.value = "card";
    else if (props.invoiceMethods.includes("boleto") && props.boletoEligible)
      method.value = "boleto";
  },
  { immediate: true },
);
const canCheckout = computed(
  () =>
    props.collectible &&
    !props.hasPending &&
    !props.busy &&
    props.invoiceMethods.includes(method.value) &&
    (method.value !== "boleto" || props.boletoEligible),
);
let motion: typeof Gsap | undefined;
let context: ReturnType<typeof Gsap.context> | undefined;
let disposed = false;
async function animate() {
  await nextTick();
  if (!motion || disposed || !root.value) return;
  context?.revert();
  context = motion.context(() => {
    motion!.from(".portal-enter", {
      y: 22,
      opacity: 0,
      duration: 0.75,
      stagger: 0.09,
      ease: "power3.out",
      clearProps: "transform,opacity",
    });
    motion!.to(".orbit-ring", {
      rotation: 360,
      duration: 90,
      repeat: -1,
      ease: "none",
    });
  }, root.value);
}
onMounted(async () => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  motion = (await import("gsap")).gsap;
  if (!disposed) await animate();
});
watch(() => Boolean(props.session), animate);
onBeforeUnmount(() => {
  disposed = true;
  context?.revert();
});
</script>

<template>
  <main ref="root" class="checkout-shell">
    <div class="ambient-glow" aria-hidden="true" />
    <div class="checkout-wrap">
      <header class="checkout-header portal-enter">
        <div class="portal-brand">
          <span class="brand-mark" aria-hidden="true">R<span /></span>
          <div>
            <strong>rebound<span class="brand-dot">.</span></strong>
            <p>PORTAL FINANCEIRO</p>
          </div>
        </div>
        <div class="header-actions">
          <span class="secure-label"
            ><UIcon name="i-lucide-shield-check" /> Acesso seguro</span
          ><button
            v-if="session"
            class="subtle-button"
            :disabled="busy"
            @click="emit('logout')"
          >
            Encerrar acesso <UIcon name="i-lucide-log-out" />
          </button>
        </div>
      </header>
      <section class="welcome portal-enter">
        <div>
          <p class="portal-eyebrow">SEU ESPAÇO FINANCEIRO</p>
          <h1>Tudo certo para o próximo passo<span>.</span></h1>
          <p class="welcome-copy">
            {{
              session?.customerName ||
              "Suas faturas e pagamentos, em um só lugar."
            }}
          </p>
        </div>
        <span v-if="session" class="customer-chip"
          ><UIcon name="i-lucide-building-2" /> {{ session.customerName }}</span
        >
      </section>
      <p v-if="error" class="feedback error" role="alert">
        <UIcon name="i-lucide-circle-alert" /> {{ error }}
      </p>
      <p v-if="busy" class="loading-note" role="status">
        <UIcon name="i-lucide-loader-circle" class="loading-icon" /> Atualizando
        informações…
      </p>
      <div v-if="session" class="checkout-grid">
        <aside class="invoice-sidebar portal-enter">
          <div class="section-heading">
            <div>
              <p class="portal-eyebrow">HISTÓRICO</p>
              <h2>Suas faturas</h2>
            </div>
            <button
              class="icon-button"
              aria-label="Atualizar faturas"
              :disabled="busy"
              @click="emit('refresh')"
            >
              <UIcon name="i-lucide-refresh-cw" />
            </button>
          </div>
          <div class="invoice-list">
            <button
              v-for="invoice in invoices"
              :key="invoice.id"
              class="invoice-option"
              :class="{ selected: details?.invoice.id === invoice.id }"
              :aria-pressed="details?.invoice.id === invoice.id"
              :disabled="busy"
              @click="emit('select', invoice.id)"
            >
              <div class="invoice-option-top">
                <span class="invoice-icon"
                  ><UIcon
                    :name="
                      invoice.status === 'paid'
                        ? 'i-lucide-check'
                        : 'i-lucide-file-text'
                    " /></span
                ><span
                  class="status-pill"
                  :class="{
                    settled: invoice.status === 'paid',
                    overdue: invoice.status === 'past_due',
                  }"
                  >{{ billingStatus(invoice.status) }}</span
                >
              </div>
              <strong>{{ invoice.number }}</strong>
              <p>Vencimento {{ billingDate(invoice.dueAt) }}</p>
              <div class="invoice-option-bottom">
                <span>{{
                  billingMoney(invoice.amountDue, invoice.currency)
                }}</span
                ><UIcon name="i-lucide-arrow-up-right" />
              </div>
            </button>
            <p v-if="!invoices.length" class="empty-copy">
              Nenhuma fatura disponível por enquanto.
            </p>
          </div>
          <nav class="pagination" aria-label="Páginas de faturas">
            <button
              class="icon-button"
              aria-label="Página anterior"
              :disabled="page <= 1 || busy"
              @click="emit('page', -1)"
            >
              <UIcon name="i-lucide-chevron-left" /></button
            ><span>Página {{ page }}</span
            ><button
              class="icon-button"
              aria-label="Próxima página"
              :disabled="!hasMore || busy"
              @click="emit('page', 1)"
            >
              <UIcon name="i-lucide-chevron-right" />
            </button>
          </nav>
          <div class="support-note">
            <UIcon name="i-lucide-messages-square" />
            <div>
              <strong>Precisa de uma mão?</strong>
              <p>Fale com nosso time financeiro.</p>
              <a href="mailto:contato@rebound-dlq.com"
                >contato@rebound-dlq.com</a
              >
            </div>
          </div>
        </aside>
        <div class="checkout-content portal-enter">
          <template v-if="details">
            <section
              class="amount-card"
              :class="{ paid: details.invoice.status === 'paid' }"
            >
              <div class="orbit-art" aria-hidden="true">
                <div class="orbit-ring"><span /></div>
                <div class="orbit-core">
                  <UIcon
                    :name="
                      details.invoice.status === 'paid'
                        ? 'i-lucide-check-check'
                        : 'i-lucide-zap'
                    "
                  />
                </div>
              </div>
              <p class="portal-eyebrow">
                {{
                  details.invoice.status === "paid"
                    ? "PAGAMENTO CONCLUÍDO"
                    : "RESUMO DA FATURA"
                }}
              </p>
              <div class="amount-heading">
                <h2>
                  {{
                    collectible
                      ? "Seu próximo passo começa aqui."
                      : details.invoice.status === "paid"
                        ? "Tudo em dia. Obrigado!"
                        : "Acompanhe sua fatura."
                  }}
                </h2>
                <span class="status-pill">{{
                  billingStatus(details.invoice.status)
                }}</span>
              </div>
              <p class="total-label">
                {{
                  details.invoice.status === "paid"
                    ? "Valor da fatura quitada"
                    : "Saldo a pagar"
                }}
              </p>
              <p class="hero-amount">
                {{
                  billingMoney(
                    details.invoice.status === "paid"
                      ? details.invoice.total
                      : details.invoice.amountDue,
                    details.invoice.currency,
                  )
                }}
              </p>
              <div class="amount-meta">
                <span
                  ><UIcon name="i-lucide-file-text" />
                  {{ details.invoice.number }}</span
                ><span
                  ><UIcon name="i-lucide-calendar-days" /> Vence em
                  {{ billingDate(details.invoice.dueAt) }}</span
                >
              </div>
              <div class="order-lines">
                <div v-for="item in details.items" :key="item.id">
                  <span
                    >{{ item.description
                    }}<small
                      >{{ item.quantity }} ×
                      {{
                        billingMoney(item.unitAmount, details.invoice.currency)
                      }}</small
                    ></span
                  ><strong>{{
                    billingMoney(item.amount, details.invoice.currency)
                  }}</strong>
                </div>
              </div>
              <div
                v-if="details.invoice.amountPaid > 0 && collectible"
                class="partial-note"
              >
                Já recebido:
                {{
                  billingMoney(
                    details.invoice.amountPaid,
                    details.invoice.currency,
                  )
                }}
                · O saldo acima considera os pagamentos confirmados.
              </div>
            </section>
            <section v-if="collectible" class="payment-card">
              <div class="section-heading">
                <div>
                  <p class="portal-eyebrow">PAGAMENTO</p>
                  <h2>Escolha como pagar</h2>
                </div>
                <UIcon name="i-lucide-lock-keyhole" class="muted-icon" />
              </div>
              <template v-if="hasPending">
                <div class="pending-notice">
                  <span class="notice-icon"
                    ><UIcon name="i-lucide-clock-3"
                  /></span>
                  <div>
                    <h3>Seu pagamento está em andamento</h3>
                    <p>
                      Continue a cobrança existente ou acompanhe a compensação.
                      Assim você evita pagar a mesma fatura duas vezes.
                    </p>
                  </div>
                </div>
                <button
                  v-if="pendingPayment"
                  class="primary-button"
                  :disabled="busy"
                  @click="emit('consult', pendingPayment.id)"
                >
                  Consultar e continuar pagamento
                  <UIcon name="i-lucide-arrow-right" />
                </button>
                <p v-else class="empty-copy">
                  Aguarde a confirmação do financeiro. Os dados são atualizados
                  automaticamente.
                </p>
              </template>
              <template v-else>
                <div
                  class="method-grid"
                  role="group"
                  aria-label="Forma de pagamento"
                >
                  <button
                    v-if="invoiceMethods.includes('card')"
                    class="method-option"
                    :class="{ active: method === 'card' }"
                    :aria-pressed="method === 'card'"
                    :disabled="busy"
                    @click="method = 'card'"
                  >
                    <span class="method-icon"
                      ><UIcon name="i-lucide-credit-card" /></span
                    ><span
                      ><strong>Cartão de crédito</strong
                      ><small>Ativação após a confirmação</small></span
                    ><span class="radio-dot" />
                  </button>
                  <button
                    v-if="invoiceMethods.includes('boleto')"
                    class="method-option"
                    :class="{ active: method === 'boleto' }"
                    :aria-pressed="method === 'boleto'"
                    :disabled="busy || !boletoEligible"
                    @click="method = 'boleto'"
                  >
                    <span class="method-icon"
                      ><UIcon name="i-lucide-barcode" /></span
                    ><span
                      ><strong>Boleto bancário</strong
                      ><small>Aguarde a compensação</small></span
                    ><span class="radio-dot" />
                  </button>
                </div>
                <p
                  v-if="invoiceMethods.includes('boleto') && !boletoEligible"
                  class="empty-copy"
                >
                  Boleto disponível em BRL para saldos de R$ 5,00 a R$
                  49.999,99.
                </p>
                <div
                  v-if="
                    invoiceMethods.includes('card') ||
                    invoiceMethods.includes('boleto')
                  "
                  class="payment-summary"
                >
                  <span>Você paga agora</span
                  ><strong>{{
                    billingMoney(
                      details.invoice.amountDue,
                      details.invoice.currency,
                    )
                  }}</strong>
                </div>
                <button
                  v-if="
                    invoiceMethods.includes('card') ||
                    invoiceMethods.includes('boleto')
                  "
                  class="primary-button"
                  :disabled="!canCheckout"
                  @click="emit('checkout', method)"
                >
                  {{
                    busy
                      ? "Preparando pagamento…"
                      : method === "card"
                        ? "Continuar para pagamento seguro"
                        : "Gerar boleto bancário"
                  }}<UIcon name="i-lucide-arrow-right" />
                </button>
                <p
                  v-if="
                    invoiceMethods.includes('card') ||
                    invoiceMethods.includes('boleto')
                  "
                  class="security-copy"
                >
                  <UIcon name="i-lucide-shield-check" /> Você continuará na
                  Stripe. Seus dados de cartão são protegidos por ela.
                </p>
              </template>
              <div
                v-if="invoiceMethods.includes('external')"
                class="external-payment"
              >
                <h3><UIcon name="i-lucide-landmark" /> Pagamento direto</h3>
                <p class="instructions">{{ session.externalInstructions }}</p>
                <small
                  >O recibo ficará disponível após a confirmação do
                  financeiro.</small
                >
              </div>
            </section>
            <Transition name="payment-reveal"
              ><section
                v-if="payment"
                class="payment-card payment-result"
                aria-live="polite"
              >
                <div class="section-heading">
                  <div>
                    <p class="portal-eyebrow">ACOMPANHAMENTO</p>
                    <h2>{{ billingStatus(payment.status) }}</h2>
                  </div>
                  <UIcon name="i-lucide-receipt" />
                </div>
                <p v-if="payment.receiptNumber">
                  Recebimento registrado: {{ payment.receiptNumber }}.
                </p>
                <p v-if="payment.requiresReconciliation" class="feedback error">
                  Este pagamento precisa de conciliação. Fale com o financeiro
                  antes de pagar novamente.
                </p>
                <a
                  v-if="
                    !payment.requiresReconciliation &&
                    safeFinancialUrl(payment.checkoutUrl) &&
                    ['pending', 'processing'].includes(payment.status)
                  "
                  :href="safeFinancialUrl(payment.checkoutUrl)!"
                  rel="noopener noreferrer"
                  class="primary-button"
                  >Continuar no pagamento seguro
                  <UIcon name="i-lucide-arrow-up-right"
                /></a>
                <div v-if="payment.boleto" class="boleto-details">
                  <h3>Boleto bancário</h3>
                  <p v-if="payment.boleto.number" class="boleto-number">
                    {{ payment.boleto.number }}
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
                    class="primary-button"
                    >Abrir boleto <UIcon name="i-lucide-external-link"
                  /></a>
                  <p class="empty-copy">
                    A emissão do boleto não confirma o pagamento. Aguarde a
                    compensação.
                  </p>
                </div>
                <button
                  class="subtle-button"
                  :disabled="busy"
                  @click="emit('consult', payment.paymentId)"
                >
                  <UIcon name="i-lucide-refresh-cw" /> Atualizar cobrança
                </button>
              </section></Transition
            >
            <details class="invoice-documents">
              <summary>
                <span
                  ><UIcon name="i-lucide-files" /> Detalhes, recibos e notas
                  fiscais</span
                ><UIcon name="i-lucide-chevron-down" />
              </summary>
              <BillingInvoiceInformation
                :details="details"
                base="/api/financial-portal"
                customer
                @refresh="emit('refresh')"
                @payment="emit('consult', $event)"
              />
            </details>
          </template>
          <div v-else class="payment-card empty-state">
            <UIcon name="i-lucide-receipt-text" />
            <h2>
              {{
                invoices.length
                  ? "Selecione uma fatura"
                  : "Tudo organizado por aqui."
              }}
            </h2>
            <p>
              {{
                invoices.length
                  ? "Confira os detalhes e as opções de pagamento ao lado."
                  : "Suas faturas aparecerão aqui assim que forem emitidas."
              }}
            </p>
          </div>
          <slot name="automatic-card" />
        </div>
      </div>
      <section
        v-else-if="!busy"
        class="payment-card expired-state portal-enter"
      >
        <UIcon name="i-lucide-key-round" />
        <h2>Seu acesso pessoal ao financeiro</h2>
        <p>
          Abra o link enviado pelo financeiro. Se ele expirou, solicite um novo
          acesso.
        </p>
        <a class="subtle-button" href="mailto:contato@rebound-dlq.com"
          >Falar com o financeiro <UIcon name="i-lucide-arrow-up-right"
        /></a>
      </section>
      <footer class="portal-footer">
        <span
          >Rebound DLQ <span class="footer-dot">·</span> Clareza em cada
          pagamento.</span
        ><span
          ><UIcon name="i-lucide-lock-keyhole" /> Seus dados protegidos</span
        >
      </footer>
    </div>
  </main>
</template>

<style scoped>
.checkout-shell {
  --mint: #a4f3ce;
  --text: #edf3fa;
  --muted: #93a2b8;
  min-height: 100vh;
  background: #0b111c;
  color: var(--text);
  padding: 32px 30px 24px;
  position: relative;
  isolation: isolate;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}
.ambient-glow {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background:
    radial-gradient(ellipse at 80% 0%, #1a3a453b, transparent 45%),
    radial-gradient(ellipse at 0% 50%, #26345725, transparent 45%);
}
.checkout-wrap {
  max-width: 1220px;
  margin: auto;
}
.checkout-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 26px;
  border-bottom: 1px solid #ffffff0d;
}
.portal-brand {
  display: flex;
  gap: 12px;
  align-items: center;
}
.portal-brand strong {
  font-size: 26px;
  letter-spacing: -1.2px;
  font-weight: 750;
}
.brand-dot {
  color: var(--mint);
}
.portal-brand p {
  font-size: 9px;
  letter-spacing: 2px;
  margin: 1px 0 0;
  color: var(--muted);
}
.brand-mark {
  height: 40px;
  width: 40px;
  border: 1px solid #a4f3ce4a;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: #a4f3ce0e;
  color: var(--mint);
  font-weight: 800;
  font-size: 25px;
  transform: rotate(-7deg);
}
.header-actions {
  display: flex;
  gap: 24px;
  align-items: center;
}
.secure-label {
  font-size: 12px;
  color: var(--muted);
  display: flex;
  gap: 7px;
  align-items: center;
}
.secure-label :deep(.iconify) {
  color: var(--mint);
}
.welcome {
  padding: 36px 0 30px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
}
.portal-eyebrow {
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 1.9px;
  color: var(--muted);
  margin: 0 0 10px;
}
.welcome h1 {
  font-size: clamp(24px, 3vw, 34px);
  line-height: 1.25;
  font-weight: 650;
  letter-spacing: -1px;
  margin: 0;
}
.welcome h1 span {
  color: var(--mint);
}
.welcome-copy {
  font-size: 14px;
  color: var(--muted);
  margin: 12px 0 0;
}
.customer-chip {
  font-size: 12px;
  border: 1px solid #ffffff12;
  background: #ffffff03;
  border-radius: 30px;
  padding: 10px 15px;
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 320px;
  overflow-wrap: anywhere;
}
.checkout-grid {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 28px;
  align-items: start;
}
.invoice-sidebar {
  min-width: 0;
  border: 1px solid #ffffff10;
  background: #101826;
  border-radius: 20px;
  padding: 22px;
  position: sticky;
  top: 24px;
}
.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}
.section-heading h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.4px;
}
.section-heading .portal-eyebrow {
  margin-bottom: 7px;
}
.invoice-list {
  display: grid;
  gap: 12px;
}
.invoice-option {
  display: block;
  text-align: left;
  width: 100%;
  border: 1px solid #ffffff10;
  border-radius: 13px;
  padding: 16px;
  background: #ffffff02;
  transition:
    background 0.2s,
    border-color 0.2s,
    transform 0.2s;
  color: var(--text);
}
.invoice-option:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: #a4f3ce40;
}
.invoice-option.selected {
  background: #a4f3ce08;
  border-color: #a4f3ce70;
}
.invoice-option-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  gap: 8px;
}
.invoice-icon {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: #ffffff06;
  color: var(--muted);
}
.selected .invoice-icon {
  color: var(--mint);
  background: #a4f3ce14;
}
.invoice-option strong {
  font-size: 13px;
  font-weight: 600;
}
.invoice-option p {
  font-size: 11px;
  color: var(--muted);
  margin: 6px 0 15px;
}
.invoice-option-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.invoice-option-bottom span {
  font-size: 21px;
  font-weight: 600;
  letter-spacing: -0.4px;
}
.invoice-option-bottom :deep(.iconify) {
  color: var(--mint);
}
.status-pill {
  font-size: 10px;
  white-space: nowrap;
  line-height: 1.4;
  border: 1px solid #ffffff15;
  border-radius: 20px;
  padding: 5px 9px;
  color: #d8e2f0;
  background: #ffffff06;
}
.status-pill.settled {
  color: #a4f3ce;
  border-color: #a4f3ce20;
  background: #a4f3ce0a;
}
.status-pill.overdue {
  color: #f7bc93;
  border-color: #f7bc9340;
}
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  font-size: 11px;
  color: var(--muted);
}
.support-note {
  display: flex;
  gap: 12px;
  border-top: 1px solid #ffffff0c;
  padding-top: 22px;
  margin-top: 22px;
  color: var(--muted);
}
.support-note strong {
  font-size: 12px;
  color: var(--text);
  font-weight: 500;
}
.support-note p {
  font-size: 11px;
  margin: 5px 0;
}
.support-note a {
  font-size: 11px;
  color: var(--mint);
  text-decoration: none;
  overflow-wrap: anywhere;
}
.checkout-content {
  display: grid;
  gap: 20px;
  min-width: 0;
}
.amount-card {
  border: 1px solid #a4f3ce25;
  border-radius: 20px;
  background: linear-gradient(115deg, #18302e, #13202c 65%, #142033);
  padding: 30px;
  position: relative;
  overflow: hidden;
}
.amount-card > .portal-eyebrow {
  color: #a8c9c4;
}
.amount-heading {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
}
.amount-heading h2 {
  font-size: 19px;
  letter-spacing: -0.4px;
  font-weight: 500;
  margin: 0;
}
.total-label {
  font-size: 12px;
  color: #a0b9b8;
  margin: 28px 0 5px;
}
.hero-amount {
  font-size: clamp(36px, 5vw, 52px);
  font-weight: 550;
  letter-spacing: -2px;
  margin: 0;
  line-height: 1.2;
  position: relative;
}
.amount-meta {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  font-size: 11px;
  color: #a7bbca;
  margin-top: 17px;
}
.amount-meta span {
  display: flex;
  align-items: center;
  gap: 7px;
}
.order-lines {
  position: relative;
  margin-top: 26px;
  border-top: 1px solid #ffffff13;
  padding-top: 18px;
  display: grid;
  gap: 12px;
}
.order-lines > div {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  font-size: 13px;
}
.order-lines strong {
  white-space: nowrap;
  font-size: 12px;
  font-weight: 500;
}
.order-lines small {
  display: block;
  color: #96aeb9;
  font-size: 11px;
  margin-top: 5px;
}
.orbit-art {
  position: absolute;
  right: 45px;
  top: 60px;
  width: 155px;
  height: 155px;
  pointer-events: none;
  opacity: 0.45;
}
.orbit-ring {
  width: 100%;
  height: 100%;
  border: 1px solid #a4f3ce29;
  border-radius: 50%;
  position: relative;
}
.orbit-ring:after {
  content: "";
  position: absolute;
  inset: 20px;
  border-radius: 50%;
  border: 1px dashed #a4f3ce24;
}
.orbit-ring span {
  position: absolute;
  width: 7px;
  height: 7px;
  top: 25px;
  left: 15px;
  background: var(--mint);
  box-shadow: 0 0 24px #a4f3ce;
  border-radius: 50%;
}
.orbit-core {
  position: absolute;
  inset: 45px;
  border: 1px solid #a4f3ce25;
  background: #a4f3ce06;
  border-radius: 18px;
  display: grid;
  place-items: center;
  color: var(--mint);
  font-size: 26px;
  transform: rotate(-10deg);
}
.payment-card {
  background: #111a28;
  border: 1px solid #ffffff10;
  border-radius: 20px;
  padding: 28px;
}
.muted-icon {
  color: var(--muted);
  font-size: 20px;
}
.method-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.method-option {
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid #ffffff18;
  border-radius: 12px;
  padding: 17px 14px;
  background: #ffffff02;
  color: var(--text);
  text-align: left;
  transition:
    border-color 0.2s,
    background 0.2s;
}
.method-option.active {
  border-color: #a4f3ce80;
  background: #a4f3ce06;
}
.method-icon {
  font-size: 22px;
  color: var(--muted);
  flex-shrink: 0;
}
.method-option.active .method-icon {
  color: var(--mint);
}
.method-option strong {
  font-size: 12px;
  font-weight: 600;
  display: block;
}
.method-option small {
  font-size: 10px;
  color: var(--muted);
  display: block;
  margin-top: 6px;
}
.radio-dot {
  width: 14px;
  height: 14px;
  border: 1px solid #627082;
  border-radius: 50%;
  margin-left: auto;
  flex-shrink: 0;
}
.active .radio-dot {
  border: 4px solid var(--mint);
  background: #15232b;
}
.payment-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #ffffff0d;
  margin: 22px 0 18px;
  padding-top: 20px;
  font-size: 13px;
  color: var(--muted);
}
.payment-summary strong {
  color: var(--text);
  font-size: 19px;
  font-weight: 600;
}
.primary-button {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  text-decoration: none;
  width: 100%;
  background: var(--mint);
  color: #10231e;
  border: 1px solid var(--mint);
  border-radius: 11px;
  padding: 16px 18px;
  font-size: 13px;
  font-weight: 650;
  transition:
    background 0.2s,
    transform 0.2s,
    box-shadow 0.2s;
}
.primary-button:hover:not(:disabled) {
  background: #c0ffdf;
  transform: translateY(-1px);
  box-shadow: 0 6px 25px #a4f3ce18;
}
.security-copy {
  color: var(--muted);
  font-size: 10px;
  text-align: center;
  margin: 15px 0 0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 7px;
  line-height: 1.6;
}
.subtle-button,
.icon-button {
  background: #ffffff03;
  color: #bac7d8;
  border: 1px solid #ffffff13;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 9px 12px;
  font-size: 11px;
  text-decoration: none;
  transition: background 0.2s;
}
.icon-button {
  padding: 8px;
  font-size: 15px;
}
.subtle-button:hover:not(:disabled),
.icon-button:hover:not(:disabled) {
  background: #ffffff08;
  color: var(--text);
}
button {
  cursor: pointer;
}
button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
button:focus-visible,
a:focus-visible,
summary:focus-visible {
  outline: 2px solid var(--mint);
  outline-offset: 4px;
}
.pending-notice {
  display: flex;
  gap: 14px;
  align-items: start;
  margin: 10px 0 22px;
}
.notice-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border: 1px solid #dfb87830;
  border-radius: 11px;
  background: #dfb8780a;
  color: #dfb878;
  font-size: 20px;
}
.pending-notice h3 {
  font-size: 14px;
  margin: 0 0 7px;
  font-weight: 500;
}
.pending-notice p,
.empty-copy {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.7;
  margin: 0;
}
.payment-result {
  display: grid;
  gap: 16px;
}
.payment-result .section-heading {
  margin: 0;
}
.payment-result p {
  font-size: 12px;
}
.boleto-details {
  display: grid;
  gap: 14px;
}
.boleto-details h3 {
  font-size: 14px;
}
.boleto-number {
  word-break: break-all;
  background: #ffffff04;
  padding: 14px;
  border-radius: 8px;
  font-family: ui-monospace, monospace;
}
.external-payment {
  border-top: 1px solid #ffffff0d;
  padding-top: 20px;
  margin-top: 22px;
}
.external-payment h3 {
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.instructions {
  white-space: pre-wrap;
  font-size: 12px;
  color: #bac7d8;
  line-height: 1.7;
  margin: 12px 0;
}
.external-payment small {
  font-size: 11px;
  color: var(--muted);
}
.invoice-documents {
  border: 1px solid #ffffff10;
  border-radius: 14px;
  background: #101826;
}
.invoice-documents summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px;
  font-size: 12px;
  cursor: pointer;
  list-style: none;
  color: #b8c8da;
}
.invoice-documents summary::-webkit-details-marker {
  display: none;
}
.invoice-documents summary span {
  display: flex;
  align-items: center;
  gap: 9px;
}
.invoice-documents[open] summary {
  border-bottom: 1px solid #ffffff0d;
}
.invoice-documents[open] summary > :deep(.iconify) {
  transform: rotate(180deg);
}
.invoice-documents :deep(.panel) {
  padding: 24px;
  margin: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
}
.invoice-documents :deep(h2) {
  font-size: 16px;
}
.invoice-documents :deep(h3) {
  font-size: 13px;
  margin: 22px 0 12px;
}
.invoice-documents :deep(p) {
  font-size: 12px;
  line-height: 1.7;
}
.invoice-documents :deep(.list-row) {
  margin-top: 10px;
  padding: 14px;
  border: 1px solid #ffffff0d;
  border-radius: 10px;
  font-size: 12px;
  gap: 15px;
}
.invoice-documents :deep(.ghost-button) {
  font-size: 11px;
  padding: 8px 10px;
}
.feedback {
  padding: 16px 18px;
  border-radius: 11px;
  display: flex;
  gap: 10px;
  align-items: start;
  line-height: 1.6;
  font-size: 12px;
  margin-bottom: 20px;
}
.error {
  border: 1px solid #ffacac30;
  background: #ffacac08;
  color: #efb5b5;
}
.loading-note {
  font-size: 11px;
  color: var(--muted);
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 14px;
}
.loading-icon {
  animation: spin 1s linear infinite;
}
.partial-note {
  font-size: 11px;
  margin-top: 15px;
  color: #a7bbca;
}
.empty-state,
.expired-state {
  text-align: center;
  padding: 60px 30px;
}
.empty-state > :deep(.iconify),
.expired-state > :deep(.iconify) {
  font-size: 36px;
  color: var(--mint);
  margin-bottom: 20px;
}
.empty-state h2,
.expired-state h2 {
  font-size: 20px;
  font-weight: 500;
  margin: 0 0 12px;
}
.empty-state p,
.expired-state p {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.7;
}
.expired-state .subtle-button {
  margin-top: 20px;
}
.portal-footer {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-top: 36px;
  padding-top: 24px;
  border-top: 1px solid #ffffff0c;
  color: #687a91;
  font-size: 10px;
}
.portal-footer > span:last-child {
  display: flex;
  align-items: center;
  gap: 6px;
}
.footer-dot {
  padding: 0 8px;
  color: var(--mint);
}
.payment-reveal-enter-active,
.payment-reveal-leave-active {
  transition:
    opacity 0.3s,
    transform 0.3s;
}
.payment-reveal-enter-from,
.payment-reveal-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (min-width: 1200px) {
  .amount-card {
    padding: 34px;
  }
  .payment-card {
    padding: 30px;
  }
  .hero-amount {
    font-size: 54px;
  }
}
@media (max-width: 900px) {
  .checkout-grid {
    grid-template-columns: 250px minmax(0, 1fr);
    gap: 18px;
  }
  .invoice-sidebar {
    min-width: 0;
    padding: 16px;
  }
  .method-grid {
    grid-template-columns: 1fr;
  }
  .amount-card,
  .payment-card {
    padding: 24px;
  }
  .customer-chip {
    display: none;
  }
  .orbit-art {
    right: -45px;
    opacity: 0.2;
  }
  .amount-heading {
    align-items: start;
  }
  .amount-heading h2 {
    font-size: 17px;
  }
}
@media (max-width: 640px) {
  .checkout-shell {
    padding: 20px 16px;
  }
  .header-actions {
    gap: 8px;
  }
  .secure-label {
    display: none;
  }
  .portal-brand strong {
    font-size: 22px;
  }
  .brand-mark {
    height: 34px;
    width: 34px;
    font-size: 21px;
  }
  .checkout-header {
    padding-bottom: 20px;
  }
  .welcome {
    padding: 26px 0;
  }
  .welcome h1 {
    font-size: 27px;
    max-width: 310px;
  }
  .checkout-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .invoice-sidebar {
    min-width: 0;
    position: static;
  }
  .invoice-list {
    display: flex;
    overflow-x: auto;
    scrollbar-width: thin;
    scrollbar-color: #344959 transparent;
    padding-bottom: 5px;
    scroll-snap-type: x mandatory;
  }
  .invoice-option {
    min-width: 215px;
    max-width: 245px;
    scroll-snap-align: start;
  }
  .support-note {
    display: none;
  }
  .pagination {
    margin-top: 10px;
  }
  .amount-card,
  .payment-card {
    padding: 22px;
  }
  .hero-amount {
    font-size: 44px;
  }
  .amount-heading {
    display: block;
  }
  .amount-heading .status-pill {
    display: inline-block;
    margin-top: 10px;
  }
  .amount-meta {
    gap: 12px;
  }
  .portal-footer {
    flex-direction: column;
    gap: 12px;
  }
  .security-copy {
    align-items: start;
    text-align: left;
  }
  .invoice-documents summary {
    padding: 18px;
  }
  .invoice-documents :deep(.panel) {
    padding: 18px;
  }
  .invoice-documents :deep(.list-row) {
    flex-wrap: wrap;
  }
}
@media (prefers-reduced-motion: reduce) {
  *,
  *:before,
  *:after {
    animation: none !important;
    transition: none !important;
    scroll-behavior: auto !important;
  }
}
</style>
