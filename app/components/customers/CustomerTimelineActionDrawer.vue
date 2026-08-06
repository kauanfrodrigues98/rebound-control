<template>
  <CustomerDrawerShell
    :open="open"
    description="Registre uma ação, compromisso ou histórico do cliente."
    title="Nova ação"
    @close="emit('update:open', false)"
  >
    <form class="drawer-form" @submit.prevent="emit('submit')">
        <label>
          Tipo
          <select v-model="form.tipo">
            <option value="ligacao">Ligação</option>
            <option value="call">Call</option>
            <option value="proposta">Proposta</option>
            <option value="contrato">Contrato</option>
            <option value="implantacao">Implantação</option>
            <option value="observacao">Observação</option>
          </select>
        </label>
        <label>
          Título
          <input v-model.trim="form.titulo" required />
        </label>
        <label>
          Data
          <ControlDatePicker v-model="form.data" required />
        </label>
        <label>
          Descrição
          <textarea v-model.trim="form.descricao" />
        </label>
        <button class="submit-button" type="submit">Adicionar ação</button>
    </form>
  </CustomerDrawerShell>
</template>

<script setup lang="ts">
import CustomerDrawerShell from '~/components/customers/CustomerDrawerShell.vue';
import type { TimelineCliente } from '~/types/customers';

const props = defineProps<{
  open: boolean;
  form: TimelineCliente;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  'update:form': [value: TimelineCliente];
  submit: [];
}>();

const open = computed(() => props.open);
const form = computed({
  get: () => props.form,
  set: (value) => emit('update:form', value),
});
</script>
