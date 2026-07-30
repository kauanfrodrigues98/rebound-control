<template>
  <section class="page-content">
    <div class="content-grid" style="margin: 0">
      <article class="panel">
        <div class="panel-heading">
          <div>
            <span>Geral</span>
            <h2>Configuração do painel de controle</h2>
          </div>
        </div>

        <div class="split-list">
          <div class="list-row">
            <div>
              <strong>URL do serviço de licenciamento</strong>
              <p class="muted-text">Configurada no ambiente de servidor do Nuxt</p>
            </div>
            <span class="badge neutral">lado servidor</span>
          </div>
          <div class="list-row">
            <div>
              <strong>Chave administrativa da API</strong>
              <p class="muted-text">Nunca é exposta no navegador</p>
            </div>
            <span class="badge active">protegida</span>
          </div>
        </div>
      </article>

      <aside class="panel">
        <div class="panel-heading compact">
          <div>
            <span>Status</span>
            <h2>Integração</h2>
          </div>
        </div>
        <div class="split-list">
          <div class="list-row">
            <div>
              <strong>Endpoint de licenças</strong>
              <p class="muted-text">GET /api/licenses</p>
            </div>
            <span class="badge active">pronto</span>
          </div>
          <div class="list-row">
            <div>
              <strong>Endpoint de ativação</strong>
              <p class="muted-text">POST /api/licenses</p>
            </div>
            <span class="badge active">pronto</span>
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
definePageMeta({
  title: 'Geral',
  eyebrow: 'Configurações',
});
</script>
