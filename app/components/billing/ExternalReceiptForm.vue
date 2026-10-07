<template>
  <article class="panel" v-if="details && canWrite">
    <h3>Registrar pagamento recebido fora da Stripe</h3>
    <form class="drawer-form" @submit.prevent="receive">
      <div class="form-grid">
        <label
          >Valor recebido ({{ details.invoice.currency }})<BillingMoneyInput
            v-model="form.amount"
            :currency="details.invoice.currency"
            required
            :disabled="busy" /></label
        ><label
          >Meio<select v-model="form.method" :disabled="busy">
            <option value="bank_transfer">Transferência</option>
            <option value="pix">Pix</option>
            <option value="boleto">Boleto externo</option>
            <option value="cash">Dinheiro</option>
            <option value="other">Outro</option>
          </select></label
        ><label
          >Referência única<input
            v-model="form.reference"
            required
            maxlength="200"
            :disabled="busy" /></label
        ><label
          >Data e hora do recebimento<input
            v-model="form.paidAt"
            type="datetime-local"
            required
            :disabled="busy"
        /></label>
      </div>
      <label
        >Observação interna<textarea
          v-model="form.note"
          maxlength="2000"
          :disabled="busy"
        />
      </label>
      <p class="muted-text">
        Confirme somente valores efetivamente recebidos. O registro pode ser
        parcial ou exceder o saldo; não envia uma cobrança à Stripe.
      </p>
      <button class="submit-button" :disabled="busy">
        Confirmar recebimento
      </button>
    </form>
    <h3>Associar nota fiscal emitida</h3>
    <form class="drawer-form" @submit.prevent="attach">
      <div class="form-grid">
        <label
          >Número<input
            v-model="fiscal.number"
            required
            :disabled="busy" /></label
        ><label
          >Referência<input
            v-model="fiscal.reference"
            required
            :disabled="busy" /></label
        ><label
          >Link do documento<input
            v-model="fiscal.documentUrl"
            type="url"
            :disabled="busy" /></label
        ><label
          >Data e hora da emissão<input
            v-model="fiscal.issuedAt"
            type="datetime-local"
            required
            :disabled="busy"
        /></label>
      </div>
      <button class="ghost-button" :disabled="busy">Associar documento</button>
    </form>
    <div
      v-for="receipt in reversible"
      :key="receipt.id"
      class="billing-reversal"
    >
      <strong>Corrigir {{ receipt.number }} por reversão</strong>
      <form class="drawer-form" @submit.prevent="reverse(receipt.id)">
        <label
          >Motivo da correção<input
            v-model="reasons[receipt.id]"
            required
            minlength="3"
            maxlength="1000"
            :disabled="busy"
        /></label>
        <p class="muted-text">
          Preserva o histórico e recalcula o saldo. Não devolve dinheiro ao
          cliente.
        </p>
        <button class="ghost-button" :disabled="busy">
          Registrar reversão
        </button>
      </form>
    </div>

  </article>
</template>
<script setup lang="ts">
import { requestKey } from "~/utils/request-key";
import type { InvoiceDetails } from "~/types/billing";
import { minorAmount } from "~/utils/billing";
const props = defineProps<{
  details: InvoiceDetails | null;
  base: string;
  canWrite: boolean;
}>();
const emit = defineEmits<{ saved: [] }>();
const form = reactive({
  amount: "",
  method: "bank_transfer",
  reference: "",
  paidAt: "",
  note: "",
});
const fiscal = reactive({
  number: "",
  reference: "",
  documentUrl: "",
  issuedAt: "",
});
const reasons = reactive<Record<string, string>>({});
const busy = ref(false),
  error = ref(""),
  success = ref("");
const reversible = computed(
  () =>
    props.details?.receipts.filter(
      (r) => r.source === "external" && !r.reversedAt,
    ) ?? [],
);
const requests = new Map<string, { signature: string; key: string }>();
watch(
  () => props.details?.invoice.id,
  () => {
    Object.assign(form, { amount: "", reference: "", paidAt: "", note: "" });
    Object.assign(fiscal, {
      number: "",
      reference: "",
      documentUrl: "",
      issuedAt: "",
    });
    requests.clear();
    success.value = "";
    error.value = "";
  },
);
async function submit(path: string, body: object, message: string) {
  if (busy.value) return;
  busy.value = true;
  error.value = "";
  success.value = "";
  const signature = JSON.stringify(body);
  let operation = requests.get(path);
  if (!operation || operation.signature !== signature) {
    operation = { signature, key: requestKey() };
    requests.set(path, operation);
  }
  try {
    await $fetch(`${props.base}/${path}`, {
      method: "POST",
      body,
      headers: { "Idempotency-Key": operation.key },
    });
    requests.delete(path);
    success.value = message;
    emit("saved");
  } catch {
    error.value =
      "Não foi possível confirmar. Em caso de timeout, mantenha os dados e tente novamente para recuperar a mesma operação.";
  } finally {
    busy.value = false;
  }
}
async function receive() {
  try {
    if (!props.details) return;
    const amount = minorAmount(form.amount, props.details.invoice.currency);
    const paidAt = new Date(form.paidAt).toISOString();
    await submit(
      `invoices/${props.details.invoice.id}/external-receipts`,
      {
        amount,
        currency: props.details.invoice.currency,
        method: form.method,
        reference: form.reference,
        paidAt,
        ...(form.note.trim() ? { note: form.note } : {}),
      },
      "Recebimento registrado.",
    );
    if (success.value)
      Object.assign(form, { amount: "", reference: "", paidAt: "", note: "" });
  } catch {
    error.value = "Confira o valor, a data e a referência do pagamento.";
  }
}
async function attach() {
  try {
    if (!props.details) return;
    await submit(
      `invoices/${props.details.invoice.id}/fiscal-documents`,
      {
        number: fiscal.number,
        reference: fiscal.reference,
        issuedAt: new Date(fiscal.issuedAt).toISOString(),
        ...(fiscal.documentUrl ? { documentUrl: fiscal.documentUrl } : {}),
      },
      "Documento fiscal associado.",
    );
  } catch {
    error.value = "Confira a data e os dados do documento fiscal.";
  }
}
function reverse(id: string) {
  return submit(
    `external-receipts/${id}/reverse`,
    { reason: reasons[id] },
    "Reversão registrada.",
  );
}
useFeedbackToast(error, 'error');
useFeedbackToast(success, 'success');
</script>
