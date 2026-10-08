<template>
  <USlideover
    :open="open"
    :title="title"
    :description="description || undefined"
    :ui="{
      content: `customer-drawer-panel ${sizeClass}`,
      header: 'customer-drawer-header',
      body: 'customer-drawer-body',
    }"
    @update:open="handleOpenChange"
  >
    <template #close>
      <button class="customer-drawer-close" type="button" aria-label="Fechar painel">
        <UIcon name="i-lucide-x" />
      </button>
    </template>
    <template #body>
      <slot />
    </template>
  </USlideover>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    description?: string;
    open: boolean;
    size?: 'md' | 'lg';
    title: string;
  }>(),
  {
    description: '',
    size: 'md',
  },
);

const emit = defineEmits<{
  close: [];
}>();

function handleOpenChange(open: boolean): void {
  if (!open) emit('close');
}

const sizeClass = computed(() => `customer-drawer-panel-${props.size}`);
</script>
