<template>
  <section
    class="panel plan-prices"
    aria-labelledby="commercial-prices-heading"
  >
    <div class="panel-heading">
      <div>
        <span>Condições financeiras</span>
        <h2 id="commercial-prices-heading">Preços do plano</h2>
      </div>
      <button
        type="button"
        class="ghost-button"
        :disabled="loading || saving"
        @click="load"
      >
        Atualizar
      </button>
    </div>
    <p class="muted-text">
      Preços administrados no Billing. Recursos e limites continuam no
      Licensing. Publicar uma versão não altera contratos ou faturas existentes.
    </p>
    <p v-if="loading" role="status">Carregando preços...</p>
    <p v-if="error" class="status-banner" role="alert">{{ error }}</p>
    <p v-if="success" role="status">{{ success }}</p>
    <p v-if="catalog?.current">
      <strong>Preço vigente:</strong>
      {{ billingMoney(catalog.current.amount, catalog.current.currency) }} /
      {{ cycle(catalog.current.intervalMonths) }}
    </p>
    <p v-else-if="catalog">
      Nenhum preço vigente no Billing. O texto antigo do Licensing é apenas uma
      referência legada.
    </p>
    <div v-if="catalog?.versions.length" class="price-history">
      <article
        v-for="price in catalog.versions"
        :key="price.id"
        class="price-version"
      >
        <strong
          >{{ billingMoney(price.amount, price.currency) }} /
          {{ cycle(price.intervalMonths) }}</strong
        >
        <span>Vigência: {{ dateTime(price.effectiveAt) }}</span>
        <span>{{
          new Date(price.effectiveAt).getTime() > Date.now()
            ? "Agendado"
            : price.id === catalog.current?.id
              ? "Vigente"
              : "Histórico"
        }}</span>
        <p>{{ price.reason }}</p>
      </article>
      <div class="price-pagination">
        <button
          type="button"
          class="ghost-button"
          :disabled="page === 1 || loading || saving"
          @click="changePage(-1)"
        >
          Anterior
        </button>
        <span>Página {{ page }}</span>
        <button
          type="button"
          class="ghost-button"
          :disabled="!catalog.hasMore || loading || saving"
          @click="changePage(1)"
        >
          Próxima
        </button>
      </div>
    </div>
    <form
      v-if="canWrite && active && catalog"
      class="drawer-form"
      @submit.prevent="publish"
    >
      <h3>Publicar nova versão</h3>
      <div class="price-fields">
        <label
          >Valor por ciclo (BRL)<input
            v-model.trim="form.amount"
            inputmode="decimal"
            placeholder="199,00"
            required
            :disabled="saving"
        /></label>
        <label
          >Periodicidade<select
            v-model.number="form.intervalMonths"
            :disabled="saving"
          >
            <option :value="1">Mensal</option>
            <option :value="3">Trimestral</option>
            <option :value="6">Semestral</option>
            <option :value="12">Anual</option>
          </select></label
        >
        <label
          >Vigência<input
            v-model="form.effectiveAt"
            type="datetime-local"
            required
            :disabled="saving"
        /></label>
      </div>
      <label
        >Motivo da alteração<textarea
          v-model.trim="form.reason"
          required
          minlength="3"
          maxlength="1000"
          :disabled="saving"
        />
      </label>
      <p class="muted-text">
        O valor cobre o ciclo inteiro. A vigência usa o fuso do seu navegador.
        Para condições negociadas por cliente, usaremos o contrato na próxima
        entrega.
      </p>
      <button class="submit-button" :disabled="saving || loading">
        {{ saving ? "Publicando..." : "Publicar preço" }}
      </button>
    </form>
    <p v-else-if="!active" class="muted-text">
      Planos arquivados preservam o histórico e não aceitam novos preços.
    </p>
  </section>
</template>
<script setup lang="ts">
import type {
  CommercialPriceCatalog,
  CommercialPriceVersion,
} from "~/types/commercial"
import { billingMoney, minorAmount } from "~/utils/billing"
const props = defineProps<{ planId: string; active: boolean }>()
const { user } = useControlAuth()
const canWrite = computed(() => user.value?.role === "admin")
const catalog = ref<CommercialPriceCatalog | null>(null)
const page = ref(1)
const loading = ref(false)
const saving = ref(false)
const error = ref("")
const success = ref("")
const form = reactive({
  amount: "",
  intervalMonths: 1,
  effectiveAt: "",
  reason: "",
})
let attempt: { hash: string; key: string } | null = null
const path = computed(
  () => `/api/billing/plans/${encodeURIComponent(props.planId)}/prices`,
)
function cycle(months: number) {
  return months === 1 ? "mês" : `${months} meses`
}
function dateTime(value: string) {
  return (
    new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Recife",
    }).format(new Date(value)) + " (Recife)"
  )
}
async function load() {
  loading.value = true
  error.value = ""
  try {
    catalog.value = await $fetch<CommercialPriceCatalog>(path.value, {
      query: { page: page.value },
    })
  } catch {
    catalog.value = null
    error.value =
      "Não foi possível consultar os preços. Verifique o acesso e a disponibilidade dos serviços."
  } finally {
    loading.value = false
  }
}
async function changePage(delta: number) {
  page.value += delta
  await load()
}
async function publish() {
  if (saving.value) return
  error.value = ""
  success.value = ""
  saving.value = true
  try {
    const amount = /^0(?:[,.]0{1,2})?$/.test(form.amount)
      ? 0
      : minorAmount(form.amount)
    const effectiveAt = new Date(form.effectiveAt).toISOString()
    const body = {
      amount,
      currency: "BRL",
      intervalMonths: form.intervalMonths,
      effectiveAt,
      reason: form.reason,
    }
    const hash = JSON.stringify(body)
    if (!attempt || attempt.hash !== hash)
      attempt = { hash, key: crypto.randomUUID() }
    await $fetch<CommercialPriceVersion>(path.value, {
      method: "POST",
      body,
      headers: { "Idempotency-Key": attempt.key },
    })
    attempt = null
    success.value =
      "Preço publicado. Contratos e faturas existentes permanecem com suas condições."
    form.amount = ""
    form.effectiveAt = ""
    form.reason = ""
    page.value = 1
    await load()
  } catch {
    error.value =
      "Não foi possível publicar. Confira o valor, a vigência e seu acesso. Em caso de falha de comunicação, tente novamente com os mesmos dados."
  } finally {
    saving.value = false
  }
}
onMounted(load)
</script>
<style scoped>
.plan-prices {
  margin: 20px 0;
}
.price-fields {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
.price-history {
  display: grid;
  gap: 12px;
  margin: 16px 0;
}
.price-version {
  display: grid;
  gap: 4px;
  padding: 12px;
  border: 1px solid var(--border-color, #d4d4d4);
  border-radius: 8px;
  overflow-wrap: anywhere;
}
.price-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
label {
  display: grid;
  gap: 6px;
  min-width: 0;
}
input,
select,
textarea {
  width: 100%;
  box-sizing: border-box;
}
@media (max-width: 720px) {
  .price-fields {
    grid-template-columns: 1fr;
  }
}
</style>
