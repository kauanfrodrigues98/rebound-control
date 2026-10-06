<template>
  <section class="page-content">
    <article class="panel">
      <div class="panel-heading">
        <div>
          <span>Minha conta</span>
          <h2>Sessão e segurança</h2>
          <p>Informações do acesso atual ao Control.</p>
        </div>
      </div>
      <div class="split-list">
        <div class="list-row">
          <div>
            <strong>{{ user?.name }}</strong>
            <p class="muted-text">{{ user?.email }}</p>
          </div>
          <span class="badge active">{{
            user?.role === 'admin' ? 'Administrador' : 'Usuário'
          }}</span>
        </div>
        <div class="list-row">
          <div>
            <strong>Sessão persistente</strong>
            <p class="muted-text">
              Recarregar a página mantém o acesso enquanto a sessão puder ser
              renovada. Sair encerra sua sessão.
            </p>
          </div>
          <span class="badge active">Ativa</span>
        </div>
        <div class="list-row">
          <div>
            <strong>Renovação automática</strong>
            <p class="muted-text">
              Quando o acesso expira, o painel tenta renová-lo. Se a sessão não
              for mais válida, solicita um novo login.
            </p>
          </div>
          <span class="badge active">Habilitada</span>
        </div>
        <div class="list-row">
          <div>
            <strong>Proteção das credenciais</strong>
            <p class="muted-text">
              Tokens ficam em cookies protegidos. Chaves dos serviços permanecem
              no servidor.
            </p>
          </div>
          <span class="badge neutral">Protegida</span>
        </div>
      </div>
    </article>
  </section>
</template>
<script setup lang="ts">
definePageMeta({ title: 'Sessão e segurança', eyebrow: 'Configurações' });
const { user } = useControlAuth();
</script>
<style scoped>
h2 {
  color: var(--text);
}
.panel-heading p {
  margin-top: 8px;
  font-size: 13px;
}
.list-row {
  gap: 16px;
}
.muted-text {
  max-width: 680px;
  line-height: 1.6;
}
</style>
