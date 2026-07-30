<template>
  <section class="page-content">
    <article class="panel">
      <div class="panel-heading">
        <div>
          <span>Notificações</span>
          <h2>Alertas operacionais</h2>
        </div>
      </div>
      <div class="split-list">
        <div v-for="item in items" :key="item.title" class="list-row">
          <div>
            <strong>{{ item.title }}</strong>
            <p class="muted-text">{{ item.description }}</p>
          </div>
          <span class="badge neutral">planejado</span>
        </div>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
definePageMeta({
  title: 'Notificações',
  eyebrow: 'Configurações',
});

const items = [
  {
    title: 'Licença perto do vencimento',
    description: 'Alerta interno antes do vencimento.',
  },
  {
    title: 'Comunicação atrasada',
    description: 'Alerta quando uma instalação fica sem comunicação.',
  },
  {
    title: 'Contrato bloqueado',
    description: 'Alerta quando status deixa de ser ativo.',
  },
];
</script>
