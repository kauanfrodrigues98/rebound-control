<template>
  <section class="page-content">
    <article class="panel">
      <div class="panel-heading">
        <div>
          <span>Segurança</span>
          <h2>Postura de segurança do painel</h2>
        </div>
      </div>
      <div class="split-list">
        <div class="list-row">
          <div>
            <strong>Proxy no servidor</strong>
            <p class="muted-text">
              Todas as chamadas administrativas passam pelo servidor do Nuxt.
            </p>
          </div>
          <span class="badge active">habilitado</span>
        </div>
        <div class="list-row">
          <div>
              <strong>Chave administrativa no navegador</strong>
            <p class="muted-text">
              A chave não é serializada para o cliente.
            </p>
          </div>
          <span class="badge active">bloqueada</span>
        </div>
        <div class="list-row">
          <div>
            <strong>Login do painel</strong>
            <p class="muted-text">
              Ainda não implementado porque esta fase é validação interna.
            </p>
          </div>
          <span class="badge warning">próximo</span>
        </div>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
definePageMeta({
  title: 'Segurança',
  eyebrow: 'Configurações',
});
</script>
