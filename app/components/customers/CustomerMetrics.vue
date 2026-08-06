<template>
  <section class="metrics-grid" aria-label="Métricas de clientes">
    <article v-for="metrica in metricas" :key="metrica.label" class="metric-card">
      <div class="metric-card-top">
        <div class="metric-name">{{ metrica.label }}</div>
        <em :class="metrica.tom">{{ metrica.delta }}</em>
      </div>
      <div class="metric-card-body">
        <strong>{{ metrica.valor }}</strong>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import type { MetricaCliente } from '~/types/customers';

defineProps<{
  metricas: MetricaCliente[];
}>();
</script>
