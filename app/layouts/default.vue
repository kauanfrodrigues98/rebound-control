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

        <div class="nav-group" :class="{ expanded: isNavGroupOpen('licensing') }">
          <button
            class="nav-item nav-parent"
            :class="{ 'active-strong': route.path.startsWith('/licensing') }"
            type="button"
            @click="toggleNavGroup('licensing')"
          >
            <UIcon class="nav-icon" name="i-lucide-key-round" />
            Licenciamento
            <UBadge class="nav-badge" color="primary" size="xs" variant="subtle">
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

        <div class="nav-group" :class="{ expanded: isNavGroupOpen('billing') }">
          <button
            class="nav-item nav-parent"
            :class="{ 'active-strong': route.path.startsWith('/billing') }"
            type="button"
            @click="toggleNavGroup('billing')"
          >
            <UIcon class="nav-icon" name="i-lucide-credit-card" />
            Cobrança
            <UBadge class="nav-badge" color="neutral" size="xs" variant="subtle">
              em breve
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
          <div class="nav-submenu muted">
            <NuxtLink class="nav-subitem" to="/billing/contracts">
              Contratos
            </NuxtLink>
            <NuxtLink class="nav-subitem" to="/billing/invoices">
              Faturas
            </NuxtLink>
          </div>
        </div>

        <div class="nav-group" :class="{ expanded: isNavGroupOpen('telemetry') }">
          <button
            class="nav-item nav-parent"
            :class="{ 'active-strong': route.path.startsWith('/telemetry') }"
            type="button"
            @click="toggleNavGroup('telemetry')"
          >
            <UIcon class="nav-icon" name="i-lucide-activity" />
            Telemetria
            <UIcon
              class="chevron"
              :name="
                isNavGroupOpen('telemetry')
                  ? 'i-lucide-chevron-up'
                  : 'i-lucide-chevron-down'
              "
            />
          </button>
          <div class="nav-submenu muted">
            <NuxtLink class="nav-subitem" to="/telemetry/check-ins">
              Comunicações
            </NuxtLink>
            <NuxtLink class="nav-subitem" to="/telemetry/events">
              Eventos
            </NuxtLink>
          </div>
        </div>

        <div class="nav-group" :class="{ expanded: isNavGroupOpen('settings') }">
          <button
            class="nav-item nav-parent"
            :class="{ 'active-strong': route.path.startsWith('/settings') }"
            type="button"
            @click="toggleNavGroup('settings')"
          >
            <UIcon class="nav-icon" name="i-lucide-settings" />
            Configurações
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
            <NuxtLink class="nav-subitem" to="/settings/general">
              Geral
            </NuxtLink>
            <NuxtLink class="nav-subitem" to="/settings/members">
              Membros
            </NuxtLink>
            <NuxtLink class="nav-subitem" to="/settings/notifications">
              Notificações
            </NuxtLink>
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
const expandedNavGroups = ref(new Set(['licensing', 'settings']));

const routeMeta = computed(() => ({
  eyebrow: String(route.meta.eyebrow ?? 'Painel de controle'),
  title: String(route.meta.title ?? 'Licenciamento'),
}));

const pageEyebrow = computed(() => routeMeta.value.eyebrow);
const pageTitle = computed(() => routeMeta.value.title);
const titleInitial = computed(() => pageTitle.value.slice(0, 1).toUpperCase());

const userMenuItems = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: 'Rebound Admin',
      avatar: { text: 'RC' },
      type: 'label',
    },
  ],
  [
    { label: 'Perfil', icon: 'i-lucide-user' },
    { label: 'Cobrança', icon: 'i-lucide-credit-card' },
    { label: 'Configurações', icon: 'i-lucide-settings' },
  ],
  [
    {
      label: 'Tema',
      icon: 'i-lucide-palette',
      children: [
        { label: 'Escuro', icon: 'i-lucide-moon' },
        { label: 'Claro', icon: 'i-lucide-sun' },
      ],
    },
    {
      label: 'Aparência',
      icon: 'i-lucide-swatch-book',
      children: [{ label: 'Compacto' }, { label: 'Confortável' }],
    },
    {
      label: 'Modelos',
      icon: 'i-lucide-layout-template',
      children: [{ label: 'Painel' }, { label: 'Painel de controle' }],
    },
  ],
  [
    { label: 'Documentação', icon: 'i-lucide-book-open' },
    { label: 'Repositório GitHub', icon: 'i-lucide-github' },
    {
      label: 'Sair',
      icon: 'i-lucide-log-out',
      onSelect: handleLogout,
    },
  ],
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
