<template>
  <ClientOnly>
    <CustomerFilters
      v-model:filtro-ambiente="filtroAmbiente"
      v-model:filtro-etapa="filtroEtapa"
      @create="abrirCadastro"
      @reset="limparFiltros"
    />

    <CustomerMetrics :metricas="metricas" />

    <section v-if="erroClientes" class="page-content">
      <p class="muted-text">{{ erroClientes }}</p>
    </section>

    <section class="content-grid customer-content-grid">
      <CustomerPipeline v-model:filtro-etapa="filtroEtapa" :etapas="cardsEtapas" />
      <CustomerFocusCard :cliente="clienteEmFoco" />
    </section>

    <CustomersTable
      :clientes="clientesFiltrados"
      @create="abrirCadastro"
      @edit="abrirEdicao"
    />

    <CustomerFormDrawer
      v-model:form="form"
      v-model:open="cadastroAberto"
      :editing="Boolean(clienteEmEdicao)"
      @add-contact="adicionarContato"
      @remove-contact="removerContato"
      @submit="salvarCliente"
    />
  </ClientOnly>
</template>

<script setup lang="ts">
import CustomerFilters from '~/components/customers/CustomerFilters.vue';
import CustomerFocusCard from '~/components/customers/CustomerFocusCard.vue';
import CustomerFormDrawer from '~/components/customers/CustomerFormDrawer.vue';
import CustomerMetrics from '~/components/customers/CustomerMetrics.vue';
import CustomerPipeline from '~/components/customers/CustomerPipeline.vue';
import CustomersTable from '~/components/customers/CustomersTable.vue';
import type { Cliente } from '~/types/customers';
import { clonarCliente, slugCliente } from '~/utils/customers';

definePageMeta({
  title: 'Clientes',
  eyebrow: 'Operação',
});

const {
  cardsEtapas,
  clienteEmFoco,
  clienteVazio,
  clientes,
  clientesFiltrados,
  clientesPersistidos,
  carregarClientes,
  erroClientes,
  filtroAmbiente,
  filtroEtapa,
  limparFiltros,
  metricas,
  novoContato,
  salvarClienteApi,
} = useCustomersMock();

const cadastroAberto = ref(false);
const clienteEmEdicao = ref<Cliente | null>(null);
const form = ref<Cliente>(clienteVazio());

function abrirCadastro(): void {
  clienteEmEdicao.value = null;
  form.value = clienteVazio();
  cadastroAberto.value = true;
}

function abrirEdicao(cliente: Cliente): void {
  clienteEmEdicao.value = cliente;
  form.value = clonarCliente(cliente);
  cadastroAberto.value = true;
}

function adicionarContato(): void {
  form.value.contatos.push(novoContato('substituto'));
}

function removerContato(index: number): void {
  form.value.contatos.splice(index, 1);
}

onMounted(() => {
  void carregarClientes();
});

async function salvarCliente(): Promise<void> {
  const payload: Cliente = {
    ...form.value,
    id:
      form.value.id && clientesPersistidos.value
        ? form.value.id
        : '',
    contatos: form.value.contatos.length ? form.value.contatos : [novoContato()],
  };

  try {
    await salvarClienteApi(payload);
  } catch {
    const fallbackPayload = {
      ...payload,
      id: form.value.id || `cliente_${slugCliente(form.value.nome) || Date.now()}`,
    };

    if (clienteEmEdicao.value) {
      clientes.value = clientes.value.map((cliente) =>
        cliente.id === clienteEmEdicao.value?.id ? fallbackPayload : cliente,
      );
    } else {
      clientes.value = [fallbackPayload, ...clientes.value];
    }
  }

  cadastroAberto.value = false;
}
</script>
