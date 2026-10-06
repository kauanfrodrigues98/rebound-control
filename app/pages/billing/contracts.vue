<template>
  <section class="page-content contracts-content">
    <section class="metrics-grid" aria-label="Resumo dos contratos">
      <article
        v-for="metric in metrics"
        :key="metric.label"
        class="metric-card"
      >
        <div class="metric-card-top">
          <div class="metric-name">{{ metric.label }}</div>
        </div>
        <div class="metric-card-body">
          <strong>{{ metric.value }}</strong>
        </div>
      </article>
    </section>
    <article class="panel table-panel">
      <div class="panel-heading">
        <div>
          <span>Comercial</span>
          <h2>Contratos dos clientes</h2>
          <p>
            Consulte contratos cloud e self-hosted. Gerencie condições e
            recorrência na aba Contratos do cliente.
          </p>
        </div>
        <button
          class="ghost-button"
          :disabled="carregandoClientes"
          @click="carregarClientes"
        >
          Atualizar
        </button>
      </div>
      <div class="contract-filters">
        <label
          >Buscar cliente ou contrato<input
            v-model.trim="search"
            type="search"
            placeholder="Nome, código ou plano" /></label
        ><NuxtLink class="ghost-button" to="/customers"
          >Cadastrar cliente ou contrato</NuxtLink
        >
      </div>
      <p v-if="erroClientes" class="status-banner" role="alert">
        {{ erroClientes }}
      </p>
      <p v-if="carregandoClientes" class="empty-state" role="status">
        Carregando contratos...
      </p>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Contrato</th>
              <th>Cliente</th>
              <th>Plano</th>
              <th>Status</th>
              <th>Vigência</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filtered" :key="row.contract.id">
              <td>
                <strong>{{ row.contract.codigo }}</strong
                ><small>{{ row.contract.ciclo }}</small>
              </td>
              <td>
                {{ row.customer.nome
                }}<small>{{ row.customer.ambientePrevisto }}</small>
              </td>
              <td>{{ row.contract.plano }}</td>
              <td>
                <span
                  class="badge"
                  :class="
                    row.contract.status === 'ativo' ? 'active' : 'neutral'
                  "
                  >{{ statusLabels[row.contract.status] }}</span
                >
              </td>
              <td>
                {{ formatDate(row.contract.dataInicio)
                }}<small>{{
                  row.contract.dataTermino
                    ? `Até ${formatDate(row.contract.dataTermino)}`
                    : 'Sem término definido'
                }}</small>
              </td>
              <td>
                <div class="table-action-group">
                  <NuxtLink
                    class="inline-action secondary"
                    :to="`/customers/${row.customer.id}`"
                    >Abrir cliente</NuxtLink
                  ><NuxtLink
                    class="inline-action secondary"
                    :to="`/billing/invoices?customerId=${row.customer.id}`"
                    >Financeiro</NuxtLink
                  >
                </div>
              </td>
            </tr>
            <tr v-if="!filtered.length && !erroClientes">
              <td colspan="6">
                <div class="empty-state">
                  {{
                    search
                      ? 'Nenhum contrato corresponde à busca.'
                      : 'Nenhum contrato cadastrado. Comece pelo cadastro de um cliente.'
                  }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
  </section>
</template>
<script setup lang="ts">
definePageMeta({ title: 'Contratos', eyebrow: 'Cobrança' });
const { clientes, carregarClientes, carregandoClientes, erroClientes } =
  useCustomersMock();
const search = ref('');
const rows = computed(() =>
  clientes.value.flatMap((customer) =>
    customer.contratos.map((contract) => ({ customer, contract })),
  ),
);
const filtered = computed(() =>
  rows.value.filter((row) =>
    `${row.customer.nome} ${row.contract.codigo} ${row.contract.plano}`
      .toLocaleLowerCase('pt-BR')
      .includes(search.value.toLocaleLowerCase('pt-BR')),
  ),
);
const statusLabels = {
  rascunho: 'Rascunho',
  em_assinatura: 'Em assinatura',
  ativo: 'Ativo',
  encerrado: 'Encerrado',
  cancelado: 'Cancelado',
};
const metrics = computed(() => [
  { label: 'Contratos', value: rows.value.length },
  {
    label: 'Ativos',
    value: rows.value.filter((row) => row.contract.status === 'ativo').length,
  },
  {
    label: 'Cloud',
    value: rows.value.filter((row) => row.customer.ambientePrevisto === 'cloud')
      .length,
  },
  {
    label: 'Self-hosted',
    value: rows.value.filter(
      (row) => row.customer.ambientePrevisto === 'self-hosted',
    ).length,
  },
]);
onMounted(carregarClientes);
</script>
<style scoped>
.contracts-content > .metrics-grid { margin: 0; }
.contracts-content table { min-width: 760px; }
.contracts-content {
  display: grid;
  gap: 24px;
}
.panel-heading h2 {
  color: var(--text);
}
.panel-heading p {
  margin-top: 8px;
  max-width: 660px;
  font-size: 13px;
  line-height: 1.6;
}
.contract-filters {
  display: flex;
  justify-content: space-between;
  align-items: end;
  flex-wrap: wrap;
  gap: 16px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
}
.contract-filters label {
  flex: 1;
  max-width: 360px;
  display: grid;
  gap: 8px;
  font-size: 13px;
  color: var(--muted);
}
.contract-filters input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  color: var(--text);
}
a.ghost-button {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}
.inline-action {
  white-space: nowrap;
}
</style>
