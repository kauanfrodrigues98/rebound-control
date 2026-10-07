<template>
  <section class="automatic-card">
    <div class="automatic-heading">
      <span class="automatic-icon"><UIcon name="i-lucide-credit-card" /></span>
      <div>
        <p class="automatic-eyebrow">MAIS PRATICIDADE</p>
        <h2>Pagamento automático</h2>
      </div>
    </div>
    <p v-if="status">
      {{
        status.enabled
          ? "Autorização ativa na Stripe."
          : "Cobrança automática desativada."
      }}
    </p>

    <form v-if="status && !status.enabled" @submit.prevent="setup">
      <label class="automatic-consent"
        ><input v-model="consent" type="checkbox" required :disabled="busy" />{{
          status.consentText
        }}</label
      >
      <button class="automatic-primary" :disabled="busy || !consent">
        {{
          status.pending
            ? "Continuar autorização na Stripe"
            : "Autorizar cartão na Stripe"
        }}
      </button>
    </form>
    <button
      class="automatic-secondary"
      v-if="status?.enabled || status?.pending"
      :disabled="busy"
      @click="disable"
    >
      Desativar cobrança automática
    </button>
    <button class="automatic-secondary" :disabled="busy" @click="load">
      <UIcon name="i-lucide-refresh-cw" /> Atualizar cartão
    </button>
  </section>
</template>
<script setup lang="ts">
import { requestKey } from "~/utils/request-key";
const status = ref<{
  enabled: boolean;
  pending: boolean;
  consentText: string;
} | null>(null);
const busy = ref(false),
  error = ref(""),
  consent = ref(false);
let key: string | null = null;
async function load() {
  if (busy.value) return;
  busy.value = true;
  error.value = "";
  try {
    status.value = await $fetch("/api/financial-portal/card");
  } catch {
    error.value = "Não foi possível consultar o cartão.";
  } finally {
    busy.value = false;
  }
}
async function setup() {
  if (busy.value || !consent.value) return;
  busy.value = true;
  error.value = "";
  try {
    key ??= requestKey();
    const result = await $fetch<{ url: string | null }>(
      "/api/financial-portal/card/setup",
      {
        method: "POST",
        body: { consent: true },
        headers: { "Idempotency-Key": key },
      },
    );
    if (result.url) {
      const url = new URL(result.url);
      if (url.protocol !== "https:" || url.hostname !== "checkout.stripe.com")
        throw new Error("URL inválida");
      window.location.assign(url.href);
    } else {
      key = null;
      busy.value = false;
      await load();
    }
  } catch {
    error.value =
      "Não foi possível autorizar. Tente novamente com a mesma solicitação.";
  } finally {
    busy.value = false;
  }
}
async function disable() {
  if (busy.value) return;
  busy.value = true;
  error.value = "";
  try {
    await $fetch("/api/financial-portal/card", { method: "DELETE" });
    key = null;
    busy.value = false;
    await load();
  } catch {
    error.value = "Não foi possível desativar o cartão.";
  } finally {
    busy.value = false;
  }
}
onMounted(load);
useFeedbackToast(error, 'error');
</script>

<style scoped>
.automatic-card {
  background: #101826;
  border: 1px solid #ffffff10;
  border-radius: 16px;
  padding: 24px;
  color: #edf3fa;
}
.automatic-heading {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}
.automatic-icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  color: #a4f3ce;
  background: #a4f3ce09;
  border: 1px solid #a4f3ce20;
  border-radius: 10px;
  font-size: 18px;
}
.automatic-eyebrow {
  font-size: 9px;
  letter-spacing: 1.7px;
  color: #93a2b8;
  margin: 0 0 5px;
}
.automatic-heading h2 {
  font-size: 15px;
  font-weight: 550;
  margin: 0;
}
.automatic-card > p {
  font-size: 12px;
  color: #93a2b8;
  line-height: 1.7;
  margin: 12px 0;
}
.automatic-consent {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 11px;
  color: #93a2b8;
  line-height: 1.8;
  cursor: pointer;
  margin: 16px 0;
}
.automatic-consent input {
  margin-top: 4px;
  accent-color: #a4f3ce;
  flex-shrink: 0;
  width: 14px;
  height: 14px;
}
.automatic-primary,
.automatic-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  font-size: 11px;
  border: 1px solid #ffffff16;
  border-radius: 8px;
  background: #ffffff03;
  color: #b8c8da;
  cursor: pointer;
  margin: 4px 8px 0 0;
}
.automatic-primary {
  background: #a4f3ce10;
  border-color: #a4f3ce30;
  color: #a4f3ce;
}
.automatic-primary:hover:not(:disabled),
.automatic-secondary:hover:not(:disabled) {
  background: #ffffff08;
}
.automatic-card button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.automatic-card button:focus-visible,
.automatic-consent input:focus-visible {
  outline: 2px solid #a4f3ce;
  outline-offset: 4px;
}
@media (max-width: 640px) {
  .automatic-card {
    padding: 20px;
  }
  .automatic-consent {
    font-size: 12px;
  }
  .automatic-primary {
    width: 100%;
    justify-content: center;
  }
}
</style>
