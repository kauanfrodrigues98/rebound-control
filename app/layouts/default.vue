<template>
  <div class="control-shell">
    <aside class="sidebar">
      <NuxtLink class="brand" to="/licensing/licenses">
        <div class="brand-mark">R</div>
        <div>
          <strong>Rebound</strong>
          <span>Controle</span>
        </div>
      </NuxtLink>

      <label class="search">
        <UIcon name="i-lucide-search" />
        <input placeholder="Buscar..." type="search" />
        <kbd>Ctrl K</kbd>
      </label>

      <nav class="nav-list" aria-label="Navegação principal">
        <NuxtLink class="nav-item" to="/licensing/licenses">
          <UIcon class="nav-icon" name="i-lucide-house" />
          Início
        </NuxtLink>

        <NuxtLink class="nav-item" to="/customers">
          <UIcon class="nav-icon" name="i-lucide-building-2" />
          Clientes
        </NuxtLink>

        <div
          class="nav-group"
          :class="{ expanded: isNavGroupOpen('licensing') }"
        >
          <button
            class="nav-item nav-parent"
            :class="{ 'active-strong': route.path.startsWith('/licensing') }"
            type="button"
            @click="toggleNavGroup('licensing')"
          >
            <UIcon class="nav-icon" name="i-lucide-key-round" />
            Licenciamento
            <UBadge
              class="nav-badge"
              color="primary"
              size="xs"
              variant="subtle"
            >
              3
            </UBadge>
            <UIcon
              class="chevron"
              :name="
                isNavGroupOpen('licensing')
                  ? 'i-lucide-chevron-up'
                  : 'i-lucide-chevron-down'
              "
            />
          </button>
          <div class="nav-submenu">
            <NuxtLink class="nav-subitem" to="/licensing/licenses">
              Licenças
            </NuxtLink>
            <NuxtLink class="nav-subitem" to="/licensing/installations">
              Instalações
            </NuxtLink>
            <NuxtLink class="nav-subitem" to="/licensing/plans">
              Planos e limites
            </NuxtLink>
          </div>
        </div>

        <NuxtLink class="nav-item" to="/requests" :class="{ 'active-strong': route.path.startsWith('/requests') }"><UIcon class="nav-icon" name="i-lucide-inbox" />Solicitações</NuxtLink>

        <div class="nav-group" :class="{ expanded: isNavGroupOpen('billing') }">
          <button
            class="nav-item nav-parent"
            :class="{ 'active-strong': route.path.startsWith('/billing') }"
            type="button"
            @click="toggleNavGroup('billing')"
          >
            <UIcon class="nav-icon" name="i-lucide-credit-card" />
            Cobrança
            <UBadge
              class="nav-badge"
              color="primary"
              size="xs"
              variant="subtle"
            >
              2
            </UBadge>
            <UIcon
              class="chevron"
              :name="
                isNavGroupOpen('billing')
                  ? 'i-lucide-chevron-up'
                  : 'i-lucide-chevron-down'
              "
            />
          </button>
          <div class="nav-submenu">
            <NuxtLink class="nav-subitem" to="/billing/contracts">
              Contratos
            </NuxtLink>
            <NuxtLink class="nav-subitem" to="/billing/invoices">
              Faturas
            </NuxtLink>
          </div>
        </div>

        <div
          class="nav-group"
          :class="{ expanded: isNavGroupOpen('telemetry') }"
        >
          <button
            class="nav-item nav-parent"
            :class="{ 'active-strong': route.path.startsWith('/telemetry') }"
            type="button"
            @click="toggleNavGroup('telemetry')"
          >
            <UIcon class="nav-icon" name="i-lucide-activity" />
            Telemetria
            <UBadge
              class="nav-badge"
              color="primary"
              size="xs"
              variant="subtle"
            >
              2
            </UBadge>
            <UIcon
              class="chevron"
              :name="
                isNavGroupOpen('telemetry')
                  ? 'i-lucide-chevron-up'
                  : 'i-lucide-chevron-down'
              "
            />
          </button>
          <div class="nav-submenu">
            <NuxtLink class="nav-subitem" to="/telemetry/check-ins">
              Comunicações
            </NuxtLink>
            <NuxtLink class="nav-subitem" to="/telemetry/events">
              Eventos
            </NuxtLink>
          </div>
        </div>

        <div
          class="nav-group"
          :class="{ expanded: isNavGroupOpen('settings') }"
        >
          <button
            class="nav-item nav-parent"
            :class="{ 'active-strong': route.path.startsWith('/settings') }"
            type="button"
            @click="toggleNavGroup('settings')"
          >
            <UIcon class="nav-icon" name="i-lucide-settings" />
            Configurações
            <UBadge
              class="nav-badge"
              color="primary"
              size="xs"
              variant="subtle"
            >
              1
            </UBadge>
            <UIcon
              class="chevron"
              :name="
                isNavGroupOpen('settings')
                  ? 'i-lucide-chevron-up'
                  : 'i-lucide-chevron-down'
              "
            />
          </button>
          <div class="nav-submenu">
            <span class="nav-subitem pending-nav" aria-disabled="true"
              >Geral<small>em breve</small></span
            >
            <span class="nav-subitem pending-nav" aria-disabled="true"
              >Membros<small>em breve</small></span
            >
            <span class="nav-subitem pending-nav" aria-disabled="true"
              >Notificações<small>em breve</small></span
            >
            <NuxtLink class="nav-subitem" to="/settings/security">
              Segurança
            </NuxtLink>
          </div>
        </div>
      </nav>

      <div class="sidebar-footer">
        <UDropdownMenu
          v-model:open="userMenuOpen"
          :content="{ align: 'start', side: 'top', sideOffset: 8 }"
          :items="userMenuItems"
          :ui="{ content: 'w-52' }"
        >
          <button class="profile" type="button" :aria-expanded="userMenuOpen">
            <UAvatar alt="Rebound Admin" size="xs" text="RC" />
            <div>
              <strong>{{ user?.name || 'Rebound Admin' }}</strong>
              <span>{{ user?.email || 'Console interno' }}</span>
            </div>
            <UIcon
              class="profile-chevron"
              :name="
                userMenuOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'
              "
            />
          </button>
        </UDropdownMenu>
      </div>
    </aside>

    <main class="workspace">
      <header class="topbar">
        <div class="page-title">
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
import type { DropdownMenuItem } from '@nuxt/ui';

const route = useRoute();
const userMenuOpen = ref(false);
const expandedNavGroups = ref(new Set(['licensing']));

const routeMeta = computed(() => ({
  eyebrow: String(route.meta.eyebrow ?? 'Painel de controle'),
  title: String(route.meta.title ?? 'Licenciamento'),
}));

const pageEyebrow = computed(() => routeMeta.value.eyebrow);
const pageTitle = computed(() => routeMeta.value.title);
const titleInitial = computed(() => pageTitle.value.slice(0, 1).toUpperCase());

const userMenuItems = computed<DropdownMenuItem[][]>(() => [
  [{ label: user.value?.name || 'Minha conta', type: 'label' }],
  [
    { label: 'Minha sessão', icon: 'i-lucide-user', to: '/settings/security' },
    {
      label: 'Faturas e recebimentos',
      icon: 'i-lucide-credit-card',
      to: '/billing/invoices',
    },
  ],
  [{ label: 'Sair', icon: 'i-lucide-log-out', onSelect: handleLogout }],
]);

const { user, logout } = useControlAuth();

watch(
  () => route.path,
  (path) => {
    const nextGroups = new Set(expandedNavGroups.value);

    if (path.startsWith('/licensing')) nextGroups.add('licensing');
    if (path.startsWith('/billing')) nextGroups.add('billing');
    if (path.startsWith('/telemetry')) nextGroups.add('telemetry');
    if (path.startsWith('/settings')) nextGroups.add('settings');

    expandedNavGroups.value = nextGroups;
  },
  { immediate: true },
);

function isNavGroupOpen(group: string): boolean {
  return expandedNavGroups.value.has(group);
}

function toggleNavGroup(group: string): void {
  const nextGroups = new Set(expandedNavGroups.value);

  if (nextGroups.has(group)) {
    nextGroups.delete(group);
  } else {
    nextGroups.add(group);
  }

  expandedNavGroups.value = nextGroups;
}

async function handleLogout(): Promise<void> {
  await logout();
}
</script>

<style scoped>
.pending-nav {
  justify-content: space-between;
  gap: 8px;
  opacity: 0.55;
  cursor: default;
}
.pending-nav small {
  font-size: 10px;
  padding: 2px 6px;
  background: var(--surface-soft);
  border-radius: 4px;
}
</style>
