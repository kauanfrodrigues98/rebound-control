<template>
  <CustomerDrawerShell
    :open="open"
    description="Adicione um contato vinculado ao cliente."
    title="Adicionar contato"
    @close="emit('update:open', false)"
  >
    <form class="drawer-form" @submit.prevent="emit('submit')">
        <label>
          Nome
          <input v-model.trim="form.nome" autocomplete="name" />
        </label>
        <label>
          Email
          <input v-model.trim="form.email" autocomplete="email" type="email" />
        </label>
        <div class="form-row">
          <label>
            Telefone
            <input v-model.trim="form.telefone" autocomplete="tel" />
          </label>
          <label>
            Cargo
            <input v-model.trim="form.cargo" autocomplete="organization-title" />
          </label>
        </div>
        <div class="form-row">
          <label>
            Papel
            <select v-model="form.papel">
              <option value="principal">Principal</option>
              <option value="substituto">Substituto</option>
              <option value="tecnico">Técnico</option>
              <option value="financeiro">Financeiro</option>
              <option value="juridico">Jurídico</option>
              <option value="outro">Outro</option>
            </select>
          </label>
          <label>
            Preferência
            <select v-model="form.preferencia">
              <option value="email">Email</option>
              <option value="telefone">Telefone</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="call">Call</option>
            </select>
          </label>
        </div>
        <button class="submit-button" type="submit">Adicionar contato</button>
    </form>
  </CustomerDrawerShell>
</template>

<script setup lang="ts">
import CustomerDrawerShell from '~/components/customers/CustomerDrawerShell.vue';
import type { ContatoCliente } from '~/types/customers';

const props = defineProps<{
  open: boolean;
  form: ContatoCliente;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  'update:form': [value: ContatoCliente];
  submit: [];
}>();

const open = computed(() => props.open);
const form = computed({
  get: () => props.form,
  set: (value) => emit('update:form', value),
});
</script>
