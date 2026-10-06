<template>
  <BillingFinancialCheckout
    :session="session"
    :invoices="invoices"
    :details="details"
    :payment="payment"
    :busy="busy"
    :error="error"
    :page="page"
    :has-more="hasMore"
    :invoice-methods="invoiceMethods"
    :collectible="Boolean(collectible)"
    :has-pending="hasPending"
    :boleto-eligible="Boolean(boletoEligible)"
    @refresh="refresh"
    @select="select"
    @page="changePage"
    @consult="consult"
    @checkout="checkout"
    @logout="logout"
  >
    <template #automatic-card><BillingAutomaticCard v-if="session" /></template>
  </BillingFinancialCheckout>
</template>
<script setup lang="ts">
import { requestKey } from "~/utils/request-key";
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
definePageMeta({ layout: false });
useHead({
  title: "Portal financeiro | Rebound DLQ",
  meta: [
    { name: "robots", content: "noindex,nofollow" },
    { name: "referrer", content: "no-referrer" },
  ],
});
const session = ref<FinancialSession | null>(null),
  invoices = ref<BillingInvoice[]>([]),
  details = ref<InvoiceDetails | null>(null),
  payment = ref<CheckoutState | null>(null);
const busy = ref(true),
  error = ref(""),
  page = ref(1),
  hasMore = ref(false);
const invoiceMethods = computed(() =>
  (session.value?.allowedMethods ?? []).filter(
    (method) =>
      !details.value?.invoice.allowedMethods ||
      details.value.invoice.allowedMethods.includes(method),
  ),
);
const collectible = computed(
  () =>
    details.value &&
    ["open", "partially_paid", "past_due"].includes(
      details.value.invoice.status,
    ) &&
    details.value.invoice.amountDue > 0,
);
const hasPending = computed(
  () =>
    details.value?.payments.some((p) =>
      ["pending", "processing"].includes(p.status),
    ) ?? false,
);
const boletoEligible = computed(
  () =>
    details.value?.invoice.currency === "BRL" &&
    details.value.invoice.amountDue >= 500 &&
    details.value.invoice.amountDue <= 4999999,
);
let timer: ReturnType<typeof setInterval> | undefined;
onMounted(async () => {
  busy.value = true;
  const token = new URLSearchParams(window.location.hash.slice(1)).get(
    "access",
  );
  if (window.location.hash)
    window.history.replaceState(null, "", window.location.pathname);
  try {
    session.value = token
      ? await $fetch<FinancialSession>("/api/financial-portal/session", {
          method: "POST",
          body: { token },
        })
      : await $fetch<FinancialSession>("/api/financial-portal/session");
    await loadInvoices();
    const initial =
      invoices.value.find((invoice) =>
        ["open", "partially_paid", "past_due"].includes(invoice.status),
      ) ?? invoices.value[0];
    if (initial)
      details.value = await $fetch<InvoiceDetails>(
        `/api/financial-portal/invoices/${initial.id}`,
      );
    timer = setInterval(() => {
      if (
        !busy.value &&
        session.value &&
        document.visibilityState === "visible"
      )
        void refresh();
    }, 30000);
  } catch {
    error.value =
      "Não foi possível abrir o acesso. Solicite um novo link se ele estiver expirado ou revogado.";
  } finally {
    busy.value = false;
  }
});
onUnmounted(() => {
  if (timer) clearInterval(timer);
});
async function loadInvoices() {
  const result = await $fetch<{ invoices: BillingInvoice[]; hasMore: boolean }>(
    "/api/financial-portal/invoices",
    { query: { page: page.value } },
  );
  invoices.value = result.invoices;
  hasMore.value = result.hasMore;
}
async function select(id: string) {
  if (busy.value) return;
  busy.value = true;
  error.value = "";
  payment.value = null;
  try {
    details.value = await $fetch<InvoiceDetails>(
      `/api/financial-portal/invoices/${id}`,
    );
  } catch {
    error.value = "Não foi possível consultar a fatura. Atualize o acesso.";
  } finally {
    busy.value = false;
  }
}
async function refresh() {
  if (busy.value) return;
  busy.value = true;
  error.value = "";
  try {
    session.value = await $fetch<FinancialSession>(
      "/api/financial-portal/session",
    );
    await loadInvoices();
    if (details.value)
      details.value = await $fetch<InvoiceDetails>(
        `/api/financial-portal/invoices/${details.value.invoice.id}`,
      );
    if (payment.value && details.value)
      payment.value = await $fetch<CheckoutState>(
        `/api/financial-portal/invoices/${details.value.invoice.id}/payments/${payment.value.paymentId}`,
      );
  } catch {
    error.value =
      "Não foi possível atualizar. O acesso pode ter expirado; solicite um novo link.";
  } finally {
    busy.value = false;
  }
}
async function changePage(delta: number) {
  page.value += delta;
  await refresh();
}
async function consult(id: string) {
  if (busy.value || !details.value) return;
  busy.value = true;
  error.value = "";
  try {
    payment.value = await $fetch<CheckoutState>(
      `/api/financial-portal/invoices/${details.value.invoice.id}/payments/${id}`,
    );
    details.value = await $fetch<InvoiceDetails>(
      `/api/financial-portal/invoices/${details.value.invoice.id}`,
    );
  } catch {
    error.value =
      "Não foi possível consultar a cobrança. Atualize a página ou consulte o financeiro.";
  } finally {
    busy.value = false;
  }
}
async function checkout(method: "card" | "boleto") {
  if (
    busy.value ||
    !details.value ||
    !collectible.value ||
    hasPending.value ||
    !invoiceMethods.value.includes(method) ||
    (method === "boleto" && !boletoEligible.value)
  )
    return;
  busy.value = true;
  error.value = "";
  const invoice = details.value.invoice;
  const storageKey = `financial-checkout:${invoice.id}:${method}`;
  let key = sessionStorage.getItem(storageKey);
  if (!key) {
    key = requestKey();
    sessionStorage.setItem(storageKey, key);
  }
  try {
    payment.value = await $fetch<CheckoutState>(
      `/api/financial-portal/invoices/${invoice.id}/checkout`,
      { method: "POST", body: { method }, headers: { "Idempotency-Key": key } },
    );
    details.value = await $fetch<InvoiceDetails>(
      `/api/financial-portal/invoices/${invoice.id}`,
    );
    if (["failed", "cancelled"].includes(payment.value.status))
      sessionStorage.removeItem(storageKey);
    const url = safeFinancialUrl(payment.value.checkoutUrl);
    if (url) window.location.assign(url);
  } catch {
    error.value =
      "Não foi possível iniciar ou recuperar a cobrança. Atualize a fatura e consulte os pagamentos antes de tentar novamente.";
  } finally {
    busy.value = false;
  }
}
async function logout() {
  busy.value = true;
  try {
    await $fetch("/api/financial-portal/logout", { method: "POST", body: {} });
    session.value = null;
    invoices.value = [];
    details.value = null;
    payment.value = null;
    if (timer) clearInterval(timer);
  } catch {
    error.value = "Não foi possível encerrar o acesso.";
  } finally {
    busy.value = false;
  }
}
</script>
