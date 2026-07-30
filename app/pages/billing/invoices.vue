<template>
  <section class="page-content">
    <article class="panel">
      <div class="panel-heading">
        <div>
          <span>Faturas</span>
          <h2>Ciclos de cobrança derivados das licenças</h2>
        </div>
      </div>

      <div class="split-list">
        <div v-for="license in licenses" :key="license.licenseInstanceId" class="list-row">
          <div>
            <strong>{{ license.customerId }}</strong>
            <p class="muted-text">
              {{ license.contractId }} vence em {{ formatDate(license.expiresAt) }}
            </p>
          </div>
          <span class="badge warning">manual</span>
        </div>
        <div v-if="!licenses.length && !pending" class="empty-state">
          Nenhum ciclo de cobrança encontrado.
        </div>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
definePageMeta({
  title: 'Faturas',
  eyebrow: 'Cobrança',
});

const { listLicenses } = useLicenses();
const { data, pending } = await listLicenses();
const licenses = computed(() => data.value?.licenses ?? []);
</script>
