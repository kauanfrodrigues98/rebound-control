<template>
  <div class="control-shell">
    <ControlSidebar class="desktop-sidebar" />

    <main class="workspace">
      <header class="topbar">
        <div class="page-title">
          <USlideover
            v-model:open="mobileMenuOpen"
            side="left"
            :close="false"
            title="Navegação principal"
            description="Acesse as telas do Rebound Control e sua conta."
            :ui="{ content: 'w-[min(20rem,100vw)]', header: 'sr-only', body: 'p-0' }"
          >
            <button
              class="mobile-menu-button"
              type="button"
              aria-label="Abrir menu de navegação"
              aria-haspopup="dialog"
              :aria-expanded="mobileMenuOpen"
            >
              <UIcon name="i-lucide-menu" />
            </button>
            <template #body>
              <ControlSidebar mobile @close="mobileMenuOpen = false" />
            </template>
          </USlideover>
          <div class="title-icon">{{ titleInitial }}</div>
          <div>
            <p>{{ pageEyebrow }}</p>
            <h1>{{ pageTitle }}</h1>
          </div>
        </div>
        <div class="topbar-actions">
          <slot name="actions" />
        </div>
      </header>
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const mobileMenuOpen = ref(false);
const pageEyebrow = computed(() => String(route.meta.eyebrow ?? 'Painel de controle'));
const pageTitle = computed(() => String(route.meta.title ?? 'Licenciamento'));
const titleInitial = computed(() => pageTitle.value.slice(0, 1).toUpperCase());

watch(() => route.fullPath, () => {
  mobileMenuOpen.value = false;
});
// Close the modal when returning to the desktop layout, including orientation changes.
onMounted(() => {
  const desktop = window.matchMedia('(min-width: 1024px)');
  const closeOnDesktop = () => {
    if (desktop.matches) mobileMenuOpen.value = false;
  };
  desktop.addEventListener('change', closeOnDesktop);
  onBeforeUnmount(() => desktop.removeEventListener('change', closeOnDesktop));
});
</script>
