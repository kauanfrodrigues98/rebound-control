<template>
  <article class="panel customer-focus-panel">
    <div class="panel-heading compact">
      <div>
        <span>Próxima ação</span>
        <h2>{{ cliente?.nome ?? 'Sem cliente' }}</h2>
      </div>
    </div>
    <div v-if="cliente" class="split-list">
      <div class="list-row vertical-row">
        <div>
          <strong>{{ cliente.timeline[0]?.titulo ?? 'Nenhuma ação agendada' }}</strong>
          <p class="muted-text">
            {{ cliente.timeline[0]?.data ?? 'Sem data' }}
          </p>
        </div>
      </div>
      <div class="list-row">
        <div>
          <strong>Responsável</strong>
          <p class="muted-text">{{ cliente.responsavelComercial || 'Não definido' }}</p>
        </div>
        <span class="badge" :class="tomPrioridadeCliente(cliente.prioridade)">
          {{ formatarPrioridadeCliente(cliente.prioridade) }}
        </span>
      </div>
      <div class="list-row vertical-row">
        <div>
          <strong>Observação</strong>
          <p class="muted-text">{{ cliente.observacoes || 'Sem observações.' }}</p>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { Cliente } from '~/types/customers';
import { formatarPrioridadeCliente, tomPrioridadeCliente } from '~/utils/customers';

defineProps<{
  cliente: Cliente | null;
}>();
</script>
