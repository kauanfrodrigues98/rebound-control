<template>
  <USlideover
    v-model:open="open"
    :description="contatoPrincipal(cliente)?.email || cliente?.segmento"
    side="right"
    title="Detalhes do cliente"
    :ui="{ content: 'max-w-2xl' }"
  >
    <template #body>
      <div v-if="cliente" class="drawer-detail">
        <div class="drawer-detail-heading">
          <div>
            <span class="eyebrow">{{ formatarTipoCliente(cliente.tipo) }}</span>
            <h2>{{ cliente.nome }}</h2>
          </div>
          <span class="badge" :class="tomEtapaCliente(cliente.etapa)">
            {{ formatarEtapaCliente(cliente.etapa) }}
          </span>
        </div>

        <div class="split-list drawer-detail-list">
          <div class="list-row">
            <div>
              <strong>Valor previsto</strong>
              <p class="muted-text">Referência comercial antes do contrato formal.</p>
            </div>
            <span class="badge warning">{{ cliente.valorPrevisto || 'pendente' }}</span>
          </div>
          <div class="list-row">
            <div>
              <strong>Ambiente</strong>
              <p class="muted-text">
                {{ cliente.responsavelTecnico || 'Responsável técnico pendente' }}
              </p>
            </div>
            <span class="badge neutral">
              {{ formatarAmbientePrevisto(cliente.ambientePrevisto) }}
            </span>
          </div>
        </div>

        <article class="panel nested-panel">
          <div class="panel-heading compact">
            <div>
              <span>Contatos</span>
              <h2>{{ cliente.contatos.length }} cadastrados</h2>
            </div>
          </div>
          <div class="split-list">
            <div v-for="contato in cliente.contatos" :key="contato.id" class="list-row">
              <div>
                <strong>{{ contato.nome || 'Nome pendente' }}</strong>
                <p class="muted-text">
                  {{ contato.email || 'Email pendente' }}
                  <template v-if="contato.telefone"> · {{ contato.telefone }}</template>
                </p>
              </div>
              <span class="badge neutral">{{ formatarPapelContatoCliente(contato.papel) }}</span>
            </div>
          </div>
        </article>

        <article class="panel nested-panel">
          <div class="panel-heading compact">
            <div>
              <span>Timeline</span>
              <h2>Ações e histórico</h2>
            </div>
            <button type="button">Nova ação</button>
          </div>
          <div class="customer-timeline">
            <div v-for="item in cliente.timeline" :key="item.id" class="timeline-item">
              <span class="timeline-dot" />
              <div>
                <strong>{{ item.titulo }}</strong>
                <p>{{ item.descricao }}</p>
                <small>{{ item.data }} · {{ formatarTipoTimelineCliente(item.tipo) }}</small>
              </div>
            </div>
          </div>
        </article>

        <div class="split-list drawer-detail-list">
          <div class="list-row vertical-row">
            <div>
              <strong>Observações</strong>
              <p class="muted-text">{{ cliente.observacoes || 'Sem observações.' }}</p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import type { Cliente } from '~/types/customers';
import {
  contatoPrincipal,
  formatarAmbientePrevisto,
  formatarEtapaCliente,
  formatarPapelContatoCliente,
  formatarTipoCliente,
  formatarTipoTimelineCliente,
  tomEtapaCliente,
} from '~/utils/customers';

defineProps<{
  cliente: Cliente | null;
}>();

const open = defineModel<boolean>('open', { required: true });
</script>
