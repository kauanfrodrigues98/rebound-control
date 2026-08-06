<template>
  <section class="toolbar customer-toolbar">
    <div class="toolbar-filter-group">
      <select
        v-model="filtroEtapa"
        aria-label="Filtro de etapa"
        class="filter-control customer-filter"
      >
        <option value="todas">Todas as etapas</option>
        <option value="prospeccao">Prospecção</option>
        <option value="negociacao">Negociação</option>
        <option value="contratacao">Contratação</option>
        <option value="implantacao">Implantação</option>
        <option value="operacao">Operação</option>
      </select>
      <select
        v-model="filtroAmbiente"
        aria-label="Filtro de instalação"
        class="filter-control customer-filter"
      >
        <option value="todos">Todos os ambientes</option>
        <option value="cloud">Cloud</option>
        <option value="self-hosted">Self-hosted</option>
        <option value="hibrido">Híbrido</option>
        <option value="indefinido">Indefinido</option>
      </select>
      <button class="ghost-button" type="button" @click="emit('reset')">
        Limpar filtros
      </button>
    </div>

    <button class="primary-action-button customer-create-button" type="button" @click="emit('create')">
      Novo cliente
    </button>
  </section>
</template>

<script setup lang="ts">
import type { FiltroAmbientePrevisto, FiltroEtapaCliente } from '~/types/customers';

const emit = defineEmits<{
  create: [];
  reset: [];
}>();

const filtroEtapa = defineModel<FiltroEtapaCliente>('filtroEtapa', { required: true });
const filtroAmbiente = defineModel<FiltroAmbientePrevisto>('filtroAmbiente', {
  required: true,
});
</script>
