<template>
  <section class="page-content billing-content">
    <article class="panel">
      <div class="panel-heading">
        <div>
          <span>Financeiro</span>
          <h2>Faturas e recebimentos</h2>
        </div>
      </div>
      <form class="drawer-form" @submit.prevent="load">
        <label
          >Cliente<select v-model="customerId" required :disabled="busy">
            <option value="">Selecione um cliente</option>
            <option
              v-for="customer in clientes"
              :key="customer.id"
              :value="customer.id"
            >
              {{ customer.nome }}
            </option>
          </select></label
        ><button class="ghost-button" :disabled="busy || !customerId">
          Consultar
        </button>
      </form>
      <p v-if="error" class="billing-error" role="alert">{{ error }}</p>
    </article>
    <template v-if="overview">
      <BillingProviderCustomer :base="base" :can-write="canWrite" />
      <BillingFinancialProfileForm
        :key="loadedCustomer"
        :profile="overview.profile"
        :base="base"
        :can-write="canWrite"
        @saved="load"
      />
      <article class="panel">
        <h3>Acesso do cliente ao portal</h3>
        <button
          v-if="canWrite && overview.profile"
          class="ghost-button"
          :disabled="busy"
          @click="grant"
        >
          Gerar link pessoal válido por 24 horas
        </button>
        <p v-if="accessUrl" class="billing-access">
          <a :href="accessUrl" target="_blank" rel="noopener noreferrer"
            >Abrir portal</a
          ><button class="ghost-button" @click="copyAccess">
            Copiar link de acesso
          </button>
        </p>
        <p class="muted-text">
          Compartilhe somente com o contato financeiro autorizado. O link
          concede acesso às faturas e recibos desta conta.
        </p>
        <div
          v-for="access in overview.grants"
          :key="access.id"
          class="list-row"
        >
          <span>{{
            access.revokedAt
              ? 'Revogado'
              : 'Expira em ' + billingDate(access.expiresAt)
          }}</span
          ><button
            v-if="
              canWrite &&
              !access.revokedAt &&
              new Date(access.expiresAt).getTime() > Date.now()
            "
            class="ghost-button"
            :disabled="busy"
            @click="revoke(access.id)"
          >
            Revogar
          </button>
        </div>
      </article>
      <article class="panel">
        <div class="panel-heading">
          <h3>Faturas</h3>
          <span>Página {{ overview.page }}</span>
        </div>
        <div
          v-for="invoice in overview.invoices"
          :key="invoice.id"
          class="list-row"
        >
          <div>
            <strong>{{ invoice.number }}</strong>
            <p>
              {{ billingStatus(invoice.status) }} · Vencimento
              {{ billingDate(invoice.dueAt) }} · Saldo
              {{ billingMoney(invoice.amountDue, invoice.currency) }}
            </p>
          </div>
          <button
            class="ghost-button"
            :disabled="busy"
            @click="selectInvoice(invoice.id)"
          >
            Detalhes
          </button>
        </div>
        <p v-if="!overview.invoices.length">Nenhuma fatura encontrada.</p>
        <div class="billing-actions">
          <button
            class="ghost-button"
            :disabled="overview.page <= 1 || busy"
            @click="changePage(-1)"
          >
            Anterior</button
          ><button
            class="ghost-button"
            :disabled="!overview.hasMore || busy"
            @click="changePage(1)"
          >
            Próxima
          </button>
        </div>
      </article>
      <BillingInvoiceInformation
        :details="details"
        :base="base"
        @refresh="refreshDetails"
      />
      <BillingExternalReceiptForm
        :details="details"
        :base="base"
        :can-write="canWrite"
        @saved="refreshFinancial"
      />
      <article class="panel">
        <h3>Notificações</h3>
        <div
          v-for="notice in overview.notifications"
          :key="notice.id"
          class="list-row"
        >
          <span
            >{{ notificationLabel(notice.kind) }} ·
            {{
              notice.sentAt
                ? 'Enviada'
                : notice.suppressedAt
                  ? 'Suprimida'
                  : notice.errorCode
                    ? 'Falha de entrega'
                    : 'Pendente'
            }}
            · {{ notice.attemptCount }} tentativas</span
          ><button
            v-if="
              canWrite &&
              notice.errorCode &&
              !notice.sentAt &&
              !notice.suppressedAt
            "
            class="ghost-button"
            :disabled="busy"
            @click="retry(notice.id)"
          >
            Tentar novamente
          </button>
        </div>
        <p v-if="!overview.notifications.length" class="muted-text">
          Nenhuma notificação registrada.
        </p>
      </article>
    </template>
  </section>
</template>
<script setup lang="ts">
import type { BillingOverview, InvoiceDetails } from '~/types/billing';
import { billingDate, billingMoney, billingStatus } from '~/utils/billing';
definePageMeta({ title: 'Faturas', eyebrow: 'Cobrança' });
const { clientes, carregarClientes } = useCustomersMock();
const { user } = useControlAuth();
const canWrite = computed(() => user.value?.role === 'admin');
const route = useRoute();
const customerId = ref(
  typeof route.query.customerId === 'string' ? route.query.customerId : '',
);
const loadedCustomer = ref(''),
  page = ref(1),
  busy = ref(false),
  error = ref(''),
  accessUrl = ref('');
const overview = ref<BillingOverview | null>(null),
  details = ref<InvoiceDetails | null>(null);
const base = computed(() => `/api/billing/customers/${loadedCustomer.value}`);
onMounted(async () => {
  await carregarClientes();
  if (customerId.value) await load();
});
watch(customerId, () => {
  overview.value = null;
  details.value = null;
  accessUrl.value = '';
  loadedCustomer.value = '';
  page.value = 1;
});
async function load() {
  if (busy.value || !customerId.value) return;
  busy.value = true;
  error.value = '';
  try {
    const result = await $fetch<BillingOverview>(
      `/api/billing/customers/${customerId.value}`,
      { query: { page: page.value } },
    );
    loadedCustomer.value = customerId.value;
    overview.value = result;
  } catch {
    overview.value = null;
    details.value = null;
    error.value =
      'Não foi possível consultar. Verifique sua sessão, o vínculo da conta no Billing e a configuração do serviço.';
  } finally {
    busy.value = false;
  }
}
async function selectInvoice(id: string) {
  error.value = '';
  try {
    details.value = await $fetch<InvoiceDetails>(
      `${base.value}/invoices/${id}`,
    );
  } catch {
    error.value = 'Não foi possível consultar a fatura.';
  }
}
async function refreshDetails() {
  if (details.value) await selectInvoice(details.value.invoice.id);
}
async function refreshFinancial() {
  await refreshDetails();
  await load();
}
async function changePage(delta: number) {
  page.value += delta;
  await load();
}
async function adminAction(
  path: string,
  method: 'POST' | 'DELETE',
  body?: object,
) {
  if (busy.value) return null;
  busy.value = true;
  error.value = '';
  try {
    return await $fetch<{ url?: string }>(`${base.value}/${path}`, {
      method,
      body,
    });
  } catch {
    error.value =
      'Não foi possível concluir a operação. Verifique sua sessão e as configurações.';
    return null;
  } finally {
    busy.value = false;
  }
}
async function grant() {
  const result = await adminAction('access', 'POST', { expiresInHours: 24 });
  if (result?.url) accessUrl.value = result.url;
  await load();
}
async function revoke(id: string) {
  await adminAction(`access/${id}`, 'DELETE');
  accessUrl.value = '';
  await load();
}
async function retry(id: string) {
  await adminAction(`notifications/${id}/retry`, 'POST', {});
  await load();
}
async function copyAccess() {
  try {
    await navigator.clipboard.writeText(accessUrl.value);
  } catch {
    error.value = 'Não foi possível copiar o link.';
  }
}
function notificationLabel(kind: string) {
  return (
    (
      {
        invoice_issued: 'Emissão',
        invoice_due: 'Vencimento',
        payment_failed: 'Falha de pagamento',
        payment_received: 'Recebimento',
        receipt_reversed: 'Correção de recebimento',
      } as Record<string, string>
    )[kind] ?? kind
  );
}
</script>

<style scoped>
.billing-content { display: grid; gap: 24px; }
.billing-content > article:first-child .drawer-form { grid-template-columns: minmax(0, 1fr) auto; align-items: end; }
.billing-content :deep(h2), .billing-content :deep(h3) { color: var(--text); }
.billing-content :deep(p) { line-height: 1.6; }
.billing-content :deep(.ghost-button), .billing-content :deep(.submit-button) { justify-self: start; }
.billing-content :deep(.submit-button) { padding: 0 20px; }
.billing-access { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; }
@media (max-width: 640px) { .billing-content > article:first-child .drawer-form { grid-template-columns: 1fr; } }
</style>
