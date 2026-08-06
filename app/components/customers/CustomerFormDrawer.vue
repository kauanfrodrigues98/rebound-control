<template>
  <CustomerDrawerShell
    :open="open"
    description="Cadastro interno do relacionamento com o cliente."
    size="lg"
    :title="editing ? 'Editar cliente' : 'Novo cliente'"
    @close="emit('update:open', false)"
  >
    <form class="drawer-form" @submit.prevent="emit('submit')">
        <div class="drawer-section">
          <span class="eyebrow">Identificação</span>
          <label>
            Nome do cliente
            <input v-model.trim="form.nome" autocomplete="organization" required />
          </label>
          <div class="form-row">
            <label>
              Tipo
              <select v-model="form.tipo">
                <option value="lead">Lead</option>
                <option value="prospect">Prospect</option>
                <option value="cliente">Cliente</option>
                <option value="parceiro">Parceiro</option>
              </select>
            </label>
            <label>
              Etapa
              <select v-model="form.etapa" required>
                <option value="prospeccao">Prospecção</option>
                <option value="negociacao">Negociação</option>
                <option value="contratacao">Contratação</option>
                <option value="implantacao">Implantação</option>
                <option value="operacao">Operação</option>
                <option value="pausado">Pausado</option>
                <option value="perdido">Perdido</option>
              </select>
            </label>
          </div>
          <div class="form-row">
            <label>
              Razão social
              <input v-model.trim="form.razaoSocial" autocomplete="off" />
            </label>
            <label>
              Documento
              <input
                v-model.trim="form.documento"
                autocomplete="off"
                placeholder="CNPJ, VAT ou equivalente"
              />
            </label>
          </div>
          <div class="form-row">
            <label>
              Segmento
              <input v-model.trim="form.segmento" autocomplete="off" />
            </label>
            <label>
              Site
              <input v-model.trim="form.site" autocomplete="url" placeholder="https://" />
            </label>
          </div>
        </div>

        <div class="drawer-section">
          <div class="drawer-section-heading">
            <span class="eyebrow">Contatos</span>
            <button class="inline-action secondary" type="button" @click="emit('add-contact')">
              Adicionar contato
            </button>
          </div>

          <div
            v-for="(contato, index) in form.contatos"
            :key="contato.id"
            class="contact-form-card"
          >
            <div class="contact-form-card-heading">
              <strong>Contato {{ index + 1 }}</strong>
              <button
                v-if="form.contatos.length > 1"
                class="inline-action secondary"
                type="button"
                @click="emit('remove-contact', index)"
              >
                Remover
              </button>
            </div>
            <div class="form-row">
              <label>
                Nome
                <input v-model.trim="contato.nome" autocomplete="name" />
              </label>
              <label>
                Email
                <input v-model.trim="contato.email" autocomplete="email" type="email" />
              </label>
            </div>
            <div class="form-row">
              <label>
                Telefone
                <input v-model.trim="contato.telefone" autocomplete="tel" />
              </label>
              <label>
                Cargo
                <input v-model.trim="contato.cargo" autocomplete="organization-title" />
              </label>
            </div>
            <div class="form-row">
              <label>
                Papel no relacionamento
                <select v-model="contato.papel">
                  <option value="principal">Principal</option>
                  <option value="substituto">Substituto</option>
                  <option value="tecnico">Técnico</option>
                  <option value="financeiro">Financeiro</option>
                  <option value="juridico">Jurídico</option>
                  <option value="outro">Outro</option>
                </select>
              </label>
              <label>
                Preferência de contato
                <select v-model="contato.preferencia">
                  <option value="email">Email</option>
                  <option value="telefone">Telefone</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="call">Call</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        <div class="drawer-section">
          <span class="eyebrow">Comercial</span>
          <div class="form-row">
            <label>
              Responsável comercial
              <input v-model.trim="form.responsavelComercial" autocomplete="off" />
            </label>
            <label>
              Prioridade
              <select v-model="form.prioridade">
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </select>
            </label>
          </div>
          <label>
            Valor previsto
            <input
              :value="form.valorPrevisto"
              autocomplete="off"
              inputmode="numeric"
              placeholder="R$ 0,00"
              @input="atualizarValorPrevisto"
            />
          </label>
        </div>

        <div class="drawer-section">
          <span class="eyebrow">Operação</span>
          <div class="form-row">
            <label>
              Ambiente previsto
              <select v-model="form.ambientePrevisto">
                <option value="indefinido">Indefinido</option>
                <option value="cloud">Cloud</option>
                <option value="self-hosted">Self-hosted</option>
                <option value="hibrido">Híbrido</option>
              </select>
            </label>
            <label>
              Responsável técnico
              <input v-model.trim="form.responsavelTecnico" autocomplete="off" />
            </label>
          </div>
          <label>
            Observações
            <textarea v-model.trim="form.observacoes" />
          </label>
        </div>

        <button class="submit-button" type="submit">
          {{ editing ? 'Salvar alterações' : 'Adicionar cliente' }}
        </button>
    </form>
  </CustomerDrawerShell>
</template>

<script setup lang="ts">
import CustomerDrawerShell from '~/components/customers/CustomerDrawerShell.vue';
import type { Cliente } from '~/types/customers';
import { formatBrlInput } from '~/utils/masks';

const props = defineProps<{
  open: boolean;
  form: Cliente;
  editing: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  'update:form': [value: Cliente];
  'add-contact': [];
  'remove-contact': [index: number];
  submit: [];
}>();

const open = computed(() => props.open);
const form = computed({
  get: () => props.form,
  set: (value) => emit('update:form', value),
});

function atualizarValorPrevisto(event: Event): void {
  const input = event.target as HTMLInputElement;
  form.value.valorPrevisto = formatBrlInput(input.value);
}
</script>
