<template>
  <section class="page-content">
    <article class="panel">
      <div class="panel-heading">
        <div>
          <span>Eventos</span>
          <h2>Resumo de eventos do licenciamento</h2><p class="muted-text">Emissões e última comunicação de cada instalação. Esta consulta não é um histórico completo de auditoria.</p>
        </div>
        <button class="ghost-button" :disabled="pending" @click="refresh()">Atualizar</button>
      </div>
      <p v-if="error" class="status-banner" role="alert">Não foi possível carregar os eventos. Tente novamente.</p>
      <p v-if="pending" class="empty-state" role="status">Carregando eventos...</p>
      <div v-else class="split-list">
        <div v-for="event in events" :key="event.id" class="list-row">
          <div>
            <strong>{{ event.title }}</strong>
            <p class="muted-text">{{ event.description }}</p>
          </div>
          <span class="badge neutral">{{ event.date }}</span>
        </div>
        <div v-if="!events.length && !error" class="empty-state">
          Nenhum evento operacional disponível.
        </div>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
definePageMeta({
  title: 'Eventos',
  eyebrow: 'Telemetria',
});

const { listLicenses } = useLicenses();
const { data, pending, error, refresh } = await listLicenses();
const licenses = computed(() => data.value?.licenses ?? []);
const events = computed(() =>
  licenses.value.flatMap((license) => [
    {
      id: `${license.licenseInstanceId}-issued`,
      title: 'Licença emitida',
      description: `${license.installationName} para ${license.customerId}`,
      date: formatDate(license.issuedAt),
    },
    ...(license.lastCheckInAt
      ? [
          {
            id: `${license.licenseInstanceId}-checkin`,
            title: 'Comunicação recebida',
            description: `${license.installationName} reportou versão v${license.version}`,
            date: formatDateTime(license.lastCheckInAt),
          },
        ]
      : []),
  ]),
);
</script>
