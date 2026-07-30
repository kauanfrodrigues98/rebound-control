<template>
  <section class="panel table-panel">
    <div class="panel-heading">
      <div>
        <span>Comunicações</span>
        <h2>Última comunicação conhecida</h2>
      </div>
      <button type="button" @click="refreshLicenses">Atualizar</button>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Instalação</th>
            <th>Cliente</th>
            <th>Última comunicação</th>
            <th>Versão atual</th>
            <th>Saúde</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="license in licenses" :key="license.licenseInstanceId">
            <td>
              <strong>{{ license.installationName }}</strong>
              <small>{{ license.licenseInstanceId }}</small>
            </td>
            <td>{{ license.customerId }}</td>
            <td>{{ formatDateTime(license.lastCheckInAt) }}</td>
            <td>v{{ license.version }}</td>
            <td>
              <span class="badge" :class="getLicenseHealth(license)">
                {{ formatHealth(getLicenseHealth(license)) }}
              </span>
            </td>
          </tr>
          <tr v-if="!licenses.length && !pending">
            <td colspan="5">
              <div class="empty-state">Nenhuma comunicação encontrada.</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
definePageMeta({
  title: 'Comunicações',
  eyebrow: 'Telemetria',
});

const { getLicenseHealth, listLicenses } = useLicenses();
const {
  data,
  pending,
  refresh: refreshLicenses,
} = await listLicenses();
const licenses = computed(() => data.value?.licenses ?? []);

function formatHealth(health: string): string {
  const labels: Record<string, string> = {
    blocked: 'bloqueada',
    expired: 'expirada',
    grace: 'tolerância',
    healthy: 'saudável',
  };

  return labels[health] ?? health;
}
</script>
