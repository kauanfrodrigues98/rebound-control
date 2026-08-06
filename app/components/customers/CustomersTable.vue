<template>
  <section class="panel table-panel">
    <div class="panel-heading customer-table-heading">
      <div>
        <span>Clientes</span>
        <h2>{{ clientesFiltrados.length }} registros</h2>
      </div>
      <button class="primary-action-button" type="button" @click="emit('create')">
        Novo cliente
      </button>
    </div>

    <div class="table-controls">
      <label class="table-search">
        <UIcon name="i-lucide-search" />
        <input
          v-model.trim="busca"
          placeholder="Buscar por cliente, contato, segmento ou responsável..."
          type="search"
        />
      </label>
      <select v-model.number="itensPorPagina" class="filter-control pagination-size-filter">
        <option :value="5">5 por página</option>
        <option :value="10">10 por página</option>
        <option :value="20">20 por página</option>
      </select>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Etapa</th>
            <th>Ambiente</th>
            <th>Contato principal</th>
            <th>Valor previsto</th>
            <th>Responsável</th>
            <th>Último movimento</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cliente in clientesPaginados" :key="cliente.id">
            <td>
              <strong>{{ cliente.nome }}</strong>
              <small>{{ cliente.segmento || 'Segmento não definido' }}</small>
            </td>
            <td>
              <span class="badge" :class="tomEtapaCliente(cliente.etapa)">
                {{ formatarEtapaCliente(cliente.etapa) }}
              </span>
            </td>
            <td>{{ formatarAmbientePrevisto(cliente.ambientePrevisto) }}</td>
            <td>
              <strong>{{ contatoPrincipal(cliente)?.nome || 'Não definido' }}</strong>
              <small>{{ contatoPrincipal(cliente)?.email || 'Email pendente' }}</small>
            </td>
            <td>{{ cliente.valorPrevisto || 'Pendente' }}</td>
            <td>{{ cliente.responsavelComercial || 'Não definido' }}</td>
            <td>
              <strong>{{ cliente.timeline[0]?.titulo || 'Sem histórico' }}</strong>
              <small>{{ cliente.timeline[0]?.data || 'Sem data' }}</small>
            </td>
            <td>
              <NuxtLink class="inline-action" :to="`/customers/${cliente.id}`">
                Detalhes
              </NuxtLink>
              <button class="inline-action secondary" type="button" @click="emit('edit', cliente)">
                Editar
              </button>
            </td>
          </tr>
          <tr v-if="!clientesPaginados.length">
            <td colspan="8">
              <div class="empty-state">
                Nenhum cliente encontrado com os filtros atuais.
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination-bar">
      <p>
        Exibindo {{ intervaloInicio }}-{{ intervaloFim }} de {{ clientesFiltrados.length }}
      </p>
      <div class="pagination-actions">
        <button
          class="ghost-button"
          :disabled="paginaAtual === 1"
          type="button"
          @click="paginaAtual--"
        >
          Anterior
        </button>
        <span>Página {{ paginaAtual }} de {{ totalPaginas }}</span>
        <button
          class="ghost-button"
          :disabled="paginaAtual === totalPaginas"
          type="button"
          @click="paginaAtual++"
        >
          Próxima
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Cliente } from '~/types/customers';
import {
  contatoPrincipal,
  formatarAmbientePrevisto,
  formatarEtapaCliente,
  tomEtapaCliente,
} from '~/utils/customers';

const emit = defineEmits<{
  create: [];
  edit: [cliente: Cliente];
}>();

const props = defineProps<{
  clientes: Cliente[];
}>();

const busca = ref('');
const paginaAtual = ref(1);
const itensPorPagina = ref(10);

const clientesFiltrados = computed(() => {
  const termo = busca.value.toLowerCase();

  if (!termo) return props.clientes;

  return props.clientes.filter((cliente) => {
    const contato = contatoPrincipal(cliente);
    const campos = [
      cliente.nome,
      cliente.segmento,
      cliente.valorPrevisto,
      cliente.responsavelComercial,
      cliente.responsavelTecnico,
      contato?.nome,
      contato?.email,
    ];

    return campos.some((campo) => String(campo ?? '').toLowerCase().includes(termo));
  });
});

const totalPaginas = computed(() =>
  Math.max(1, Math.ceil(clientesFiltrados.value.length / itensPorPagina.value)),
);

const clientesPaginados = computed(() => {
  const start = (paginaAtual.value - 1) * itensPorPagina.value;
  return clientesFiltrados.value.slice(start, start + itensPorPagina.value);
});

const intervaloInicio = computed(() => {
  if (!clientesFiltrados.value.length) return 0;
  return (paginaAtual.value - 1) * itensPorPagina.value + 1;
});

const intervaloFim = computed(() =>
  Math.min(paginaAtual.value * itensPorPagina.value, clientesFiltrados.value.length),
);

watch([busca, itensPorPagina, () => props.clientes.length], () => {
  paginaAtual.value = 1;
});

watch(totalPaginas, (total) => {
  if (paginaAtual.value > total) paginaAtual.value = total;
});
</script>
