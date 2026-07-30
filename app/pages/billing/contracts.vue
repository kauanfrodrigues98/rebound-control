<template>
  <section class="metrics-grid" aria-label="Métricas de contratos">
    <article v-for="metric in metrics" :key="metric.label" class="metric-card">
      <div class="metric-card-top">
        <div class="metric-name">{{ metric.label }}</div>
        <em :class="metric.tone">{{ metric.delta }}</em>
      </div>
      <div class="metric-card-body">
        <strong>{{ metric.value }}</strong>
      </div>
    </article>
  </section>

  <section class="panel table-panel">
    <div class="panel-heading">
      <div>
        <span>Contratos</span>
        <h2>Contratos diretos ligados às licenças</h2>
      </div>
      <button type="button" @click="refreshLicenses">Atualizar</button>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Contrato</th>
            <th>Cliente</th>
            <th>Instalação</th>
            <th>Status</th>
            <th>Fim do ciclo</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="license in licenses" :key="license.licenseInstanceId">
            <td>
              <strong>{{ license.contractId }}</strong>
              <small>contrato direto</small>
            </td>
            <td>{{ license.customerId }}</td>
            <td>{{ license.installationName }}</td>
            <td>
              <span class="badge" :class="license.status">
                {{ formatStatus(license.status) }}
              </span>
            </td>
            <td>{{ formatDate(license.expiresAt) }}</td>
          </tr>
          <tr v-if="!licenses.length && !pending">
            <td colspan="5">
              <div class="empty-state">Nenhum contrato encontrado.</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
definePageMeta({
  title: 'Contratos',
  eyebrow: 'Cobrança',
});

const { listLicenses } = useLicenses();
const {
  data,
  pending,
  refresh: refreshLicenses,
} = await listLicenses();

const licenses = computed(() => data.value?.licenses ?? []);
const activeContracts = computed(
  () => licenses.value.filter((license) => license.status === 'active').length,
);
const metrics = computed(() => [
  {
    label: 'Contratos',
    value: String(licenses.value.length),
    delta: 'total',
    tone: 'neutral',
  },
  {
    label: 'Ativos',
    value: String(activeContracts.value),
    delta: 'atuais',
    tone: 'positive',
  },
  {
    label: 'Cobrança manual',
    value: String(licenses.value.length),
    delta: 'fora do Stripe',
    tone: 'warning',
  },
  {
    label: 'Renovações',
    value: String(
      licenses.value.filter(
        (license) =>
          new Date(license.expiresAt).getTime() <
          Date.now() + 1000 * 60 * 60 * 24 * 30,
      ).length,
    ),
    delta: '30 dias',
    tone: 'warning',
  },
]);

function formatStatus(status: string): string {
  const labels: Record<string, string> = {
    active: 'ativo',
    expired: 'expirado',
    suspended: 'suspenso',
  };

  return labels[status] ?? status;
}
</script>
