<template>
  <article class="panel" v-if="details">
    <div class="panel-heading">
      <div>
        <span>{{ billingStatus(details.invoice.status) }}</span>
        <h2>Fatura {{ details.invoice.number }}</h2>
      </div>
      <button type="button" class="ghost-button" @click="$emit('refresh')">
        Atualizar
      </button>
    </div>
    <p>
      Vencimento: {{ billingDate(details.invoice.dueAt) }} · Total:
      {{ billingMoney(details.invoice.total, details.invoice.currency) }} ·
      Saldo:
      <strong>{{
        billingMoney(details.invoice.amountDue, details.invoice.currency)
      }}</strong>
    </p>
    <div class="split-list">
      <div class="list-row" v-for="item in details.items" :key="item.id">
        <div>
          <strong>{{ item.description }}</strong>
          <p class="muted-text">
            {{ item.quantity }} ×
            {{ billingMoney(item.unitAmount, details.invoice.currency) }}
          </p>
        </div>
        <span>{{ billingMoney(item.amount, details.invoice.currency) }}</span>
      </div>
    </div>
    <h3>Pagamentos</h3>
    <div v-for="payment in details.payments" :key="payment.id" class="list-row">
      <span
        >{{ billingStatus(payment.status) }} ·
        {{ billingMoney(payment.amount, details.invoice.currency) }}</span
      ><button
        v-if="customer && payment.provider === 'stripe'"
        type="button"
        class="ghost-button"
        @click="$emit('payment', payment.id)"
      >
        Consultar cobrança
      </button>
    </div>
    <h3>Recibos</h3>
    <div v-for="receipt in details.receipts" :key="receipt.id" class="list-row">
      <div>
        <strong>{{ receipt.number }}</strong>
        <p>
          {{ billingMoney(receipt.amount, details.invoice.currency) }} ·
          {{ billingDate(receipt.paidAt) }}
          <span v-if="receipt.reversedAt">· Revertido</span>
        </p>
        <p v-if="receipt.unallocatedAmount">
          Valor não alocado:
          {{
            billingMoney(receipt.unallocatedAmount, details.invoice.currency)
          }}
        </p>
      </div>
      <div>
        <a
          :href="`${base}/receipts/${receipt.id}?format=pdf`"
          class="ghost-button"
          >PDF</a
        >
        <a
          :href="`${base}/receipts/${receipt.id}?format=html`"
          target="_blank"
          rel="noopener noreferrer"
          >Visualizar</a
        >
      </div>
    </div>
    <p v-if="!details.receipts.length" class="muted-text">
      Nenhum recebimento confirmado.
    </p>
    <h3>Notas fiscais</h3>
    <div
      v-for="document in details.fiscalDocuments"
      :key="document.id"
      class="list-row"
    >
      <span>{{ document.number }} · {{ document.reference }}</span
      ><a
        v-if="safeFinancialUrl(document.documentUrl)"
        :href="safeFinancialUrl(document.documentUrl)!"
        target="_blank"
        rel="noopener noreferrer"
        >Abrir documento</a
      >
    </div>
    <p v-if="!details.fiscalDocuments.length" class="muted-text">
      Nenhum documento fiscal associado.
    </p>
  </article>
</template>
<script setup lang="ts">
import type { InvoiceDetails } from '~/types/billing'
import {
  billingDate,
  billingMoney,
  billingStatus,
  safeFinancialUrl,
} from '~/utils/billing'
defineProps<{
  details: InvoiceDetails | null
  base: string
  customer?: boolean
}>()
defineEmits<{ refresh: []; payment: [id: string] }>()
</script>
