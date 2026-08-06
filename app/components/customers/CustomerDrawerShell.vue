<template>
  <Teleport to="body">
    <div v-if="open" class="customer-drawer-overlay" @click.self="emit('close')">
      <aside
        class="customer-drawer-panel"
        :class="sizeClass"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
      >
        <header class="customer-drawer-header">
          <div>
            <h2>{{ title }}</h2>
            <p v-if="description">{{ description }}</p>
          </div>
          <button class="customer-drawer-close" type="button" @click="emit('close')">
            <UIcon name="i-lucide-x" />
          </button>
        </header>

        <div class="customer-drawer-body">
          <slot />
        </div>
      </aside>
    </div>
  </Teleport>
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

const sizeClass = computed(() => `customer-drawer-panel-${props.size}`);
</script>
