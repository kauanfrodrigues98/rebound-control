<template>
  <section class="toolbar">
    <button class="ghost-button" type="button" @click="refreshLicenses">
      Atualizar
    </button>
    <button class="primary-action-button" type="button" @click="openCreateDrawer">
      Emitir licença
    </button>
  </section>

  <section class="metrics-grid" aria-label="Métricas de instalações">
    <article v-for="metric in metrics" :key="metric.label" class="metric-card">
      <div class="metric-card-top">
        <div class="metric-name">{{ metric.label }}</div>
        <em :class="metric.tone">{{ metric.delta }}</em>
      </div>
      <div class="metric-card-body">
        <strong>{{ metric.value }}</strong>
      </div>
    </article>
  </section>

  <section class="panel table-panel">
    <div class="panel-heading">
      <div>
        <span>Instalações</span>
        <h2>Ambientes auto-hospedados registrados</h2>
      </div>
    </div>

    <div v-if="error" class="status-banner">
      Não foi possível carregar as instalações do serviço de licenciamento.
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Instalação</th>
            <th>Cliente</th>
            <th>Identificador</th>
            <th>Licença</th>
            <th>Status</th>
            <th>Emissão</th>
            <th>Última comunicação</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="license in licenses" :key="license.licenseInstanceId">
            <td>
              <strong>{{ license.installationName }}</strong>
              <small>{{ license.licenseInstanceId }}</small>
            </td>
            <td>{{ license.customerId }}</td>
            <td>
              <div class="masked-secret">
                <code>{{ maskFingerprint(license.installationFingerprint) }}</code>
                <button
                  aria-label="Copiar identificador da instalação"
                  class="copy-secret-button"
                  type="button"
                  @click="copyFingerprint(license.installationFingerprint)"
                >
                  <UIcon name="i-lucide-copy" />
                </button>
              </div>
            </td>
            <td>
              <div v-if="license.licenseKey" class="masked-secret">
                <code>{{ maskLicenseKey(license.licenseKey) }}</code>
                <button
                  aria-label="Copiar licença da instalação"
                  class="copy-secret-button"
                  type="button"
                  @click="copyStoredLicenseKey(license.licenseKey)"
                >
                  <UIcon name="i-lucide-copy" />
                </button>
              </div>
              <span v-else class="muted-text">Reemita para copiar</span>
            </td>
            <td>
              <span class="badge" :class="getLicenseHealth(license)">
                {{ formatHealth(getLicenseHealth(license)) }}
              </span>
            </td>
            <td>{{ formatDate(license.issuedAt) }}</td>
            <td>{{ formatDateTime(license.lastCheckInAt) }}</td>
            <td>
              <button
                class="inline-action"
                type="button"
                @click="openDetailsDrawer(license)"
              >
                Detalhes
              </button>
              <button
                class="inline-action secondary"
                type="button"
                @click="openReissueDrawer(license)"
              >
                Renovar
              </button>
            </td>
          </tr>
          <tr v-if="!licenses.length && !pending">
            <td colspan="8">
              <div class="empty-state">Nenhuma instalação encontrada.</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <USlideover
    v-model:open="createDrawerOpen"
    description="Emita uma chave de licença para um contrato auto-hospedado."
    side="right"
    title="Emitir licença"
    :ui="{ content: 'max-w-md' }"
  >
    <template #body>
      <form class="drawer-form" @submit.prevent="createLicense">
        <label>
          ID do cliente
          <input
            ref="customerInput"
            v-model.trim="form.customerId"
            autocomplete="off"
            placeholder="cust_acme"
            required
          />
        </label>
        <label>
          ID do contrato
          <input
            v-model.trim="form.contractId"
            autocomplete="off"
            placeholder="ctr_2026_001"
            required
          />
        </label>
        <label>
          Nome da instalação
          <input
            v-model.trim="form.installationName"
            autocomplete="off"
            placeholder="ACME Produção"
            required
          />
        </label>
        <label>
          Vencimento
          <ControlDatePicker v-model="form.expiresAt" required />
        </label>

        <div class="form-row">
          <label>
            Máximo de usuários
            <input
              :value="formatIntegerInput(form.maxUsers)"
              inputmode="numeric"
              min="1"
              required
              type="text"
              @input="updateFormNumber(form, 'maxUsers', $event)"
            />
          </label>
          <label>
            Máximo de projetos
            <input
              :value="formatIntegerInput(form.maxProjects)"
              inputmode="numeric"
              min="1"
              required
              type="text"
              @input="updateFormNumber(form, 'maxProjects', $event)"
            />
          </label>
        </div>

        <label class="toggle">
          <input v-model="form.aiEnabled" type="checkbox" />
          <span>IA habilitada</span>
        </label>

        <button class="submit-button" :disabled="creating" type="submit">
          {{ creating ? 'Emitindo...' : 'Emitir licença' }}
        </button>
      </form>

      <div v-if="createdLicense" class="created-license drawer-created-license">
        <span>Chave da licença</span>
        <code>{{ createdLicense.licenseKey }}</code>
        <button type="button" @click="copyLicenseKey">Copiar</button>
      </div>
    </template>
  </USlideover>

  <USlideover
    v-model:open="detailsDrawerOpen"
    :description="selectedLicense?.customerId"
    side="right"
    title="Detalhes da instalação"
    :ui="{ content: 'max-w-2xl' }"
  >
    <template #body>
      <div v-if="selectedLicense" class="drawer-detail">
        <div class="drawer-detail-heading">
          <div>
            <span class="eyebrow">Instalação</span>
            <h2>{{ selectedLicense.installationName }}</h2>
          </div>
          <span v-if="currentLicense" class="badge" :class="currentLicense.status">
            {{ formatStatus(currentLicense.status) }}
          </span>
        </div>

        <div class="split-list drawer-detail-list">
          <div class="list-row">
            <div>
              <strong>Instância da licença</strong>
              <p class="muted-text">{{ selectedLicense.licenseInstanceId }}</p>
            </div>
            <span class="badge neutral">v{{ currentLicense?.version ?? '-' }}</span>
          </div>
          <div class="list-row vertical-row">
            <div class="detail-field">
              <strong>Identificador da instalação</strong>
              <div class="masked-secret drawer-secret">
                <code>{{ maskFingerprint(selectedLicense.installationFingerprint) }}</code>
                <button
                  aria-label="Copiar identificador da instalação"
                  class="copy-secret-button"
                  type="button"
                  @click="copyFingerprint(selectedLicense.installationFingerprint)"
                >
                  <UIcon name="i-lucide-copy" />
                </button>
              </div>
            </div>
          </div>
          <div class="list-row vertical-row">
            <div class="detail-field">
              <strong>Chave da licença</strong>
              <div v-if="selectedLicense.licenseKey" class="masked-secret drawer-secret">
                <code>{{ maskLicenseKey(selectedLicense.licenseKey) }}</code>
                <button
                  aria-label="Copiar licença da instalação"
                  class="copy-secret-button"
                  type="button"
                  @click="copyStoredLicenseKey(selectedLicense.licenseKey)"
                >
                  <UIcon name="i-lucide-copy" />
                </button>
              </div>
              <p v-else class="muted-text">
                Esta licença foi emitida antes do armazenamento da chave. Reemita
                para gerar uma nova chave copiável.
              </p>
            </div>
          </div>
          <div class="list-row vertical-row">
            <div class="detail-field">
              <strong>Permissões e limites</strong>
              <div class="entitlement-grid">
                <label
                  v-for="entitlement in entitlementFields"
                  :key="entitlement.key"
                  class="readonly-field"
                >
                  <span>{{ entitlement.label }}</span>
                  <input :value="entitlement.value" readonly />
                </label>
              </div>
            </div>
          </div>
          <div class="list-row">
            <div>
              <strong>Última comunicação</strong>
              <p class="muted-text">{{ formatDateTime(selectedLicense.lastCheckInAt) }}</p>
            </div>
            <button class="inline-action" type="button" @click="reissueDrawerOpen = true">
              Renovar
            </button>
          </div>
        </div>
      </div>
    </template>
  </USlideover>

  <USlideover
    v-model:open="reissueDrawerOpen"
    :description="selectedLicense?.installationName"
    side="right"
    title="Renovar licença"
    :ui="{ content: 'max-w-md' }"
  >
    <template #body>
      <form class="drawer-form" @submit.prevent="reissueSelectedLicense">
        <label>
          Novo vencimento
          <ControlDatePicker v-model="reissueForm.expiresAt" required />
        </label>
        <div class="form-row">
          <label>
            Máximo de usuários
            <input
              :value="formatIntegerInput(reissueForm.maxUsers)"
              inputmode="numeric"
              min="1"
              required
              type="text"
              @input="updateFormNumber(reissueForm, 'maxUsers', $event)"
            />
          </label>
          <label>
            Máximo de projetos
            <input
              :value="formatIntegerInput(reissueForm.maxProjects)"
              inputmode="numeric"
              min="1"
              required
              type="text"
              @input="updateFormNumber(reissueForm, 'maxProjects', $event)"
            />
          </label>
        </div>
        <label class="toggle">
          <input v-model="reissueForm.aiEnabled" type="checkbox" />
          <span>IA habilitada</span>
        </label>
        <button class="submit-button" :disabled="reissuing" type="submit">
          {{ reissuing ? 'Renovando...' : 'Renovar licença' }}
        </button>
      </form>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import type {
  ActivateLicenseResponse,
  CurrentLicenseResponse,
  LicenseListItem,
} from '~/types/licensing';

definePageMeta({
  title: 'Instalações',
  eyebrow: 'Licenciamento',
});

const {
  activateLicense,
  getCurrentLicense,
  getLicenseHealth,
  listLicenses,
  reissueLicense,
} = useLicenses();
const toast = useToast();
const creating = ref(false);
const reissuing = ref(false);
const createDrawerOpen = ref(false);
const detailsDrawerOpen = ref(false);
const reissueDrawerOpen = ref(false);
const createdLicense = ref<ActivateLicenseResponse | null>(null);
const currentLicense = ref<CurrentLicenseResponse | null>(null);
const selectedLicense = ref<LicenseListItem | null>(null);
const customerInput = ref<HTMLInputElement | null>(null);

const nextMonth = new Date();
nextMonth.setDate(nextMonth.getDate() + 30);

const form = reactive({
  customerId: '',
  contractId: '',
  installationName: '',
  expiresAt: toDateInputValue(nextMonth),
  maxUsers: 10,
  maxProjects: 3,
  aiEnabled: true,
});

const reissueForm = reactive({
  expiresAt: toDateInputValue(nextMonth),
  maxUsers: 10,
  maxProjects: 3,
  aiEnabled: true,
});

type LimitNumberField = 'maxProjects' | 'maxUsers';
type LimitForm = {
  [key in LimitNumberField]: number;
};

const {
  data,
  pending,
  error,
  refresh: refreshLicenses,
} = await listLicenses();

const licenses = computed(() => data.value?.licenses ?? []);
const entitlementFields = computed(() =>
  Object.entries(currentLicense.value?.entitlements ?? {}).map(([key, value]) => ({
    key,
    label: formatEntitlementLabel(key),
    value: formatEntitlementValue(value),
  })),
);
const metrics = computed(() => [
  {
    label: 'Instalações',
    value: String(licenses.value.length),
    delta: 'total',
    tone: 'neutral',
  },
  {
    label: 'Saudáveis',
    value: String(
      licenses.value.filter((license) => getLicenseHealth(license) === 'healthy')
        .length,
    ),
    delta: 'online',
    tone: 'positive',
  },
  {
    label: 'Em tolerância',
    value: String(
      licenses.value.filter((license) => getLicenseHealth(license) === 'grace')
        .length,
    ),
    delta: 'atenção',
    tone: 'warning',
  },
  {
    label: 'Bloqueadas',
    value: String(
      licenses.value.filter((license) =>
        ['blocked', 'expired'].includes(getLicenseHealth(license)),
      ).length,
    ),
    delta: 'risco',
    tone: 'danger',
  },
]);

function updateFormNumber(target: LimitForm, field: LimitNumberField, event: Event): void {
  const input = event.target as HTMLInputElement | null;

  if (!input) {
    return;
  }

  const value = Math.max(1, parseMaskedInteger(input.value, 1));
  target[field] = value;
  input.value = formatIntegerInput(value);
}

function maskFingerprint(fingerprint: string): string {
  if (fingerprint.length <= 14) {
    return '••••••••';
  }

  return `${fingerprint.slice(0, 6)}••••••••${fingerprint.slice(-5)}`;
}

function maskLicenseKey(licenseKey: string): string {
  if (licenseKey.length <= 22) {
    return '••••••••';
  }

  return `${licenseKey.slice(0, 10)}••••••••${licenseKey.slice(-8)}`;
}

function formatEntitlementLabel(key: string): string {
  const labels: Record<string, string> = {
    aiEnabled: 'IA habilitada',
    automaticReplayEnabled: 'Replay automático',
    cadence: 'Cadência',
    maxMonthlyEvents: 'Eventos mensais',
    maxProjects: 'Projetos',
    maxUsers: 'Usuários',
    planId: 'ID do plano',
    planName: 'Plano',
    priceLabel: 'Preço exibido',
    retentionDays: 'Retenção em dias',
    supportSlaHours: 'SLA de suporte',
  };

  return labels[key] ?? key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (character) => character.toUpperCase());
}

function formatEntitlementValue(value: boolean | number | string): string {
  if (typeof value === 'boolean') {
    return value ? 'Habilitado' : 'Desabilitado';
  }

  if (typeof value === 'string') {
    const labels: Record<string, string> = {
      annual: 'anual',
      contract: 'contrato',
      monthly: 'mensal',
    };

    return labels[value] ?? value;
  }

  return String(value);
}

function formatHealth(health: string): string {
  const labels: Record<string, string> = {
    blocked: 'bloqueada',
    expired: 'expirada',
    grace: 'tolerância',
    healthy: 'saudável',
  };

  return labels[health] ?? health;
}

function formatStatus(status: string): string {
  const labels: Record<string, string> = {
    active: 'ativa',
    expired: 'expirada',
    suspended: 'suspensa',
  };

  return labels[status] ?? status;
}

async function copyFingerprint(fingerprint: string): Promise<void> {
  await navigator.clipboard.writeText(fingerprint);

  toast.add({
    title: 'Identificador copiado',
    description: 'O identificador da instalação foi copiado para a área de transferência.',
    color: 'success',
    icon: 'i-lucide-copy-check',
  });
}

async function copyStoredLicenseKey(licenseKey: string): Promise<void> {
  await navigator.clipboard.writeText(licenseKey);

  toast.add({
    title: 'Licença copiada',
    description: 'A chave da licença foi copiada para a área de transferência.',
    color: 'success',
    icon: 'i-lucide-copy-check',
  });
}

async function openCreateDrawer(): Promise<void> {
  createDrawerOpen.value = true;
  await nextTick();
  customerInput.value?.focus();
}

async function createLicense(): Promise<void> {
  creating.value = true;
  createdLicense.value = null;

  try {
    createdLicense.value = await activateLicense({
      customerId: form.customerId,
      contractId: form.contractId,
      installationName: form.installationName,
      expiresAt: toEndOfDayIso(form.expiresAt),
      entitlements: {
        maxUsers: form.maxUsers,
        maxProjects: form.maxProjects,
        aiEnabled: form.aiEnabled,
      },
    });

    await refreshLicenses();
    customerInput.value?.focus();
  } finally {
    creating.value = false;
  }
}

async function copyLicenseKey(): Promise<void> {
  if (!createdLicense.value?.licenseKey) {
    return;
  }

  await navigator.clipboard.writeText(createdLicense.value.licenseKey);

  toast.add({
    title: 'Licença copiada',
    description: 'A chave da licença foi copiada para a área de transferência.',
    color: 'success',
    icon: 'i-lucide-copy-check',
  });
}

async function loadDetails(license: LicenseListItem): Promise<void> {
  selectedLicense.value = license;
  currentLicense.value = await getCurrentLicense(license.licenseInstanceId);

  const entitlements = currentLicense.value.entitlements;
  reissueForm.expiresAt = toDateInputValue(new Date(currentLicense.value.expiresAt));
  reissueForm.maxUsers = Number(entitlements.maxUsers ?? 10);
  reissueForm.maxProjects = Number(entitlements.maxProjects ?? 3);
  reissueForm.aiEnabled = Boolean(entitlements.aiEnabled ?? true);
}

async function openDetailsDrawer(license: LicenseListItem): Promise<void> {
  await loadDetails(license);
  detailsDrawerOpen.value = true;
}

async function openReissueDrawer(license: LicenseListItem): Promise<void> {
  await loadDetails(license);
  reissueDrawerOpen.value = true;
}

async function reissueSelectedLicense(): Promise<void> {
  if (!selectedLicense.value) {
    return;
  }

  reissuing.value = true;

  try {
    currentLicense.value = await reissueLicense(selectedLicense.value.licenseInstanceId, {
      expiresAt: toEndOfDayIso(reissueForm.expiresAt),
      entitlements: {
        maxUsers: reissueForm.maxUsers,
        maxProjects: reissueForm.maxProjects,
        aiEnabled: reissueForm.aiEnabled,
      },
    });

    if (currentLicense.value.licenseKey) {
      selectedLicense.value.licenseKey = currentLicense.value.licenseKey;
    }

    await refreshLicenses();
    reissueDrawerOpen.value = false;
  } finally {
    reissuing.value = false;
  }
}
</script>
