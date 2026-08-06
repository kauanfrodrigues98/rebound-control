<template>
  <article class="panel">
    <div class="panel-heading">
      <div>
        <span>Pipeline</span>
        <h2>Clientes por etapa</h2>
      </div>
    </div>
    <div class="customer-stage-list">
      <button
        v-for="etapa in etapas"
        :key="etapa.valor"
        class="customer-stage-card"
        :class="{ active: filtroEtapa === etapa.valor }"
        type="button"
        @click="filtroEtapa = etapa.valor"
      >
        <span>{{ etapa.label }}</span>
        <strong>{{ etapa.total }}</strong>
        <small>{{ etapa.descricao }}</small>
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { CardEtapaCliente, FiltroEtapaCliente } from '~/types/customers';

defineProps<{
  etapas: CardEtapaCliente[];
}>();

const filtroEtapa = defineModel<FiltroEtapaCliente>('filtroEtapa', { required: true });
</script>
