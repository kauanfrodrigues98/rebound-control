<template>
  <section class="toolbar">
    <button class="filter-control date-filter" type="button">Jul 22, 2026</button>
    <select
      v-model="statusFilter"
      aria-label="Filtro de status"
      class="filter-control status-filter"
    >
      <option value="all">Todos os status</option>
      <option value="active">Ativas</option>
      <option value="suspended">Suspensas</option>
      <option value="expired">Expiradas</option>
    </select>
    <select
      v-model="contractFilter"
      aria-label="Filtro de contrato"
      class="filter-control contract-filter"
    >
      <option value="all">Contratos auto-hospedados</option>
      <option value="monthly">Mensais</option>
      <option value="annual">Anuais</option>
    </select>
    <button class="ghost-button" type="button" @click="refreshLicenses">
      Atualizar
    </button>
    <button class="primary-action-button" type="button" @click="openCreateDrawer">
      Emitir licença
    </button>
  </section>

  <section class="metrics-grid" aria-label="Métricas de licenciamento">
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

  <section class="page-content">
    <article class="panel">
      <div class="panel-heading">
        <div>
          <span>Atividade de licenças</span>
          <h2>{{ activityTotal }} eventos no período</h2>
        </div>
        <select
          v-model="activityRange"
          aria-label="Período do gráfico de atividade"
          class="filter-control activity-range-filter"
        >
          <option value="daily">Diário</option>
          <option value="weekly">Semanal</option>
          <option value="monthly">Mensal</option>
        </select>
      </div>

      <div class="chart" aria-label="Prévia de atividade de licenças">
        <div
          v-for="point in activityPoints"
          :key="point.key"
          class="chart-column"
          :title="`${point.label}: ${point.value} eventos`"
        >
          <span :style="{ height: `${point.height}%` }">
            <em>{{ point.value }}</em>
          </span>
          <small>{{ point.label }}</small>
        </div>
      </div>
    </article>
  </section>

  <section class="panel table-panel">
    <div class="panel-heading">
      <div>
          <span>Licenças</span>
          <h2>Clientes auto-hospedados</h2>
        </div>
      <p v-if="pending">Carregando...</p>
      <p v-else>{{ filteredLicenses.length }} registros</p>
    </div>

    <div v-if="errorMessage" class="status-banner">
      {{ errorMessage }}
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Instalação</th>
            <th>Status</th>
            <th>Vencimento</th>
            <th>Versão</th>
            <th>Última comunicação</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="license in visibleLicenses" :key="license.licenseInstanceId">
            <td>
              <strong>{{ license.customerId }}</strong>
              <small>{{ license.contractId }}</small>
            </td>
            <td>{{ license.installationName }}</td>
            <td>
              <span class="badge" :class="license.status">
                {{ formatStatus(license.status) }}
              </span>
            </td>
            <td>{{ formatDate(license.expiresAt) }}</td>
            <td>v{{ license.version }}</td>
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
          <tr v-if="!visibleLicenses.length && !pending">
            <td colspan="7">
              <div class="empty-state">
                Nenhuma licença encontrada para este filtro.
              </div>
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
          Plano cadastrado
          <select v-model="form.planId" required>
            <option disabled value="">Selecione um plano</option>
            <option v-for="plan in plans" :key="plan.id" :value="plan.id">
              {{ plan.name }} · {{ formatCadence(plan.cadence) }}
            </option>
          </select>
        </label>

        <div v-if="selectedCreatePlan" class="drawer-plan-preview">
          <div>
            <strong>{{ selectedCreatePlan.name }}</strong>
            <p>{{ selectedCreatePlan.description }}</p>
          </div>
          <span class="badge neutral">{{ selectedCreatePlan.priceLabel }}</span>
          <div class="entitlement-grid">
            <label
              v-for="entitlement in createPlanPreviewFields"
              :key="entitlement.key"
              class="readonly-field"
            >
              <span>{{ entitlement.label }}</span>
              <input :value="entitlement.value" readonly />
            </label>
          </div>
        </div>

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

        <label class="toggle">
          <input v-model="form.customLimits" type="checkbox" />
          <span>Customizar limites deste contrato</span>
        </label>

        <template v-if="form.customLimits">
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
          <div class="form-row">
            <label>
              Eventos mensais
              <input
                :value="formatIntegerInput(form.maxMonthlyEvents)"
                inputmode="numeric"
                min="1"
                required
                type="text"
                @input="updateFormNumber(form, 'maxMonthlyEvents', $event)"
              />
            </label>
            <label>
              Retenção em dias
              <input
                :value="formatIntegerInput(form.retentionDays)"
                inputmode="numeric"
                min="1"
                required
                type="text"
                @input="updateFormNumber(form, 'retentionDays', $event)"
              />
            </label>
          </div>
          <label class="toggle">
            <input v-model="form.aiEnabled" type="checkbox" />
            <span>IA habilitada</span>
          </label>
          <label class="toggle">
            <input v-model="form.automaticReplayEnabled" type="checkbox" />
            <span>Replay automático habilitado</span>
          </label>
        </template>

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
    title="Detalhes da licença"
    :ui="{ content: 'max-w-2xl' }"
  >
    <template #body>
      <div v-if="selectedLicense" class="drawer-detail">
        <div class="drawer-detail-heading">
          <div>
            <span class="eyebrow">Licença atual</span>
            <h2>{{ selectedLicense.installationName }}</h2>
          </div>
          <span v-if="currentLicense" class="badge" :class="currentLicense.status">
            {{ currentLicense.status }}
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
              <strong>Vencimento</strong>
              <p class="muted-text">{{ formatDate(currentLicense?.expiresAt) }}</p>
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
          Plano cadastrado
          <select v-model="reissueForm.planId" required>
            <option disabled value="">Selecione um plano</option>
            <option v-for="plan in plans" :key="plan.id" :value="plan.id">
              {{ plan.name }} · {{ formatCadence(plan.cadence) }}
            </option>
          </select>
        </label>

        <div v-if="selectedReissuePlan" class="drawer-plan-preview">
          <div>
            <strong>{{ selectedReissuePlan.name }}</strong>
            <p>{{ selectedReissuePlan.description }}</p>
          </div>
          <span class="badge neutral">{{ selectedReissuePlan.priceLabel }}</span>
          <div class="entitlement-grid">
            <label
              v-for="entitlement in reissuePlanPreviewFields"
              :key="entitlement.key"
              class="readonly-field"
            >
              <span>{{ entitlement.label }}</span>
              <input :value="entitlement.value" readonly />
            </label>
          </div>
        </div>

        <label>
          Novo vencimento
          <ControlDatePicker v-model="reissueForm.expiresAt" required />
        </label>
        <label class="toggle">
          <input v-model="reissueForm.customLimits" type="checkbox" />
          <span>Customizar limites desta renovação</span>
        </label>

        <template v-if="reissueForm.customLimits">
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
          <div class="form-row">
            <label>
              Eventos mensais
              <input
                :value="formatIntegerInput(reissueForm.maxMonthlyEvents)"
                inputmode="numeric"
                min="1"
                required
                type="text"
                @input="updateFormNumber(reissueForm, 'maxMonthlyEvents', $event)"
              />
            </label>
            <label>
              Retenção em dias
              <input
                :value="formatIntegerInput(reissueForm.retentionDays)"
                inputmode="numeric"
                min="1"
                required
                type="text"
                @input="updateFormNumber(reissueForm, 'retentionDays', $event)"
              />
            </label>
          </div>
          <label class="toggle">
            <input v-model="reissueForm.aiEnabled" type="checkbox" />
            <span>IA habilitada</span>
          </label>
          <label class="toggle">
            <input v-model="reissueForm.automaticReplayEnabled" type="checkbox" />
            <span>Replay automático habilitado</span>
          </label>
        </template>
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
  LicensePlan,
} from '~/types/licensing';

definePageMeta({
  title: 'Licenças',
  eyebrow: 'Licenciamento',
});

const {
  activateLicense,
  getCurrentLicense,
  listLicenses,
  listPlans,
  reissueLicense,
} = useLicenses();
const toast = useToast();

const statusFilter = ref('all');
const contractFilter = ref('all');
const activityRange = ref<'daily' | 'weekly' | 'monthly'>('daily');
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
  planId: '',
  customerId: '',
  contractId: '',
  installationName: '',
  expiresAt: toDateInputValue(nextMonth),
  customLimits: false,
  maxUsers: 10,
  maxProjects: 3,
  maxMonthlyEvents: 25000,
  retentionDays: 30,
  aiEnabled: true,
  automaticReplayEnabled: false,
});

const reissueForm = reactive({
  planId: '',
  expiresAt: toDateInputValue(nextMonth),
  customLimits: false,
  maxUsers: 10,
  maxProjects: 3,
  maxMonthlyEvents: 25000,
  retentionDays: 30,
  aiEnabled: true,
  automaticReplayEnabled: false,
});

type LimitNumberField =
  | 'maxMonthlyEvents'
  | 'maxProjects'
  | 'maxUsers'
  | 'retentionDays';
type LimitForm = {
  [key in LimitNumberField]: number;
};

const { data: plansData } = await listPlans();
const {
  data,
  pending,
  error,
  refresh: refreshLicenses,
} = await listLicenses();

const plans = computed(() => plansData.value?.plans ?? []);
const licenses = computed(() => data.value?.licenses ?? []);
const selectedCreatePlan = computed(() => findPlanById(form.planId));
const selectedReissuePlan = computed(() => findPlanById(reissueForm.planId));
const createPlanPreviewFields = computed(() =>
  selectedCreatePlan.value
    ? buildPlanPreviewFields(selectedCreatePlan.value, form.customLimits ? form : undefined)
    : [],
);
const reissuePlanPreviewFields = computed(() =>
  selectedReissuePlan.value
    ? buildPlanPreviewFields(
        selectedReissuePlan.value,
        reissueForm.customLimits ? reissueForm : undefined,
      )
    : [],
);
const filteredLicenses = computed(() =>
  licenses.value.filter((license) => {
    const statusMatches =
      statusFilter.value === 'all' || license.status === statusFilter.value;
    const contractMatches =
      contractFilter.value === 'all' ||
      license.contractId.toLowerCase().includes(contractFilter.value);

    return statusMatches && contractMatches;
  }),
);

const visibleLicenses = computed(() => filteredLicenses.value.slice(0, 10));
const activeLicenses = computed(
  () => licenses.value.filter((license) => license.status === 'active').length,
);
const entitlementFields = computed(() =>
  Object.entries(currentLicense.value?.entitlements ?? {}).map(([key, value]) => ({
    key,
    label: formatEntitlementLabel(key),
    value: formatEntitlementValue(value),
  })),
);

const expiringSoon = computed(() => {
  const now = Date.now();
  const limit = now + 1000 * 60 * 60 * 24 * 15;

  return licenses.value.filter((license) => {
    const expiresAt = new Date(license.expiresAt).getTime();
    return expiresAt >= now && expiresAt <= limit;
  }).length;
});

const metrics = computed(() => [
  {
    label: 'Licenças ativas',
    value: String(activeLicenses.value),
    delta: 'atuais',
    tone: 'positive',
  },
  {
    label: 'Vencem em breve',
    value: String(expiringSoon.value),
    delta: '15 dias',
    tone: expiringSoon.value > 0 ? 'warning' : 'positive',
  },
  {
    label: 'Licenças emitidas',
    value: String(licenses.value.length),
    delta: 'total',
    tone: 'neutral',
  },
  {
    label: 'Contratos com IA',
    value: String(Math.max(activeLicenses.value - 1, 0)),
    delta: 'habilitada',
    tone: 'positive',
  },
]);

const activityEvents = computed(() =>
  licenses.value.flatMap((license) => [
    {
      type: 'issued',
      occurredAt: license.issuedAt,
    },
    ...(license.lastCheckInAt
      ? [
          {
            type: 'check-in',
            occurredAt: license.lastCheckInAt,
          },
        ]
      : []),
  ]),
);
const activityPoints = computed(() => buildActivityPoints(activityRange.value));
const activityTotal = computed(() =>
  activityPoints.value.reduce((total, point) => total + point.value, 0),
);

const errorMessage = computed(() => {
  if (!error.value) {
    return '';
  }

  return 'Não foi possível carregar as licenças. Verifique se o rebound-control-api está online e conectado ao licensing.';
});

watch(
  plans,
  (currentPlans) => {
    if (!currentPlans.length) {
      return;
    }

    const defaultPlanId =
      currentPlans.find((plan) => plan.featured)?.id ?? currentPlans[0].id;

    if (!form.planId) {
      form.planId = defaultPlanId;
    }

    if (!reissueForm.planId) {
      reissueForm.planId = defaultPlanId;
    }
  },
  { immediate: true },
);

watch(
  () => form.planId,
  () => {
    if (!form.customLimits && selectedCreatePlan.value) {
      applyPlanToLimitForm(selectedCreatePlan.value, form);
    }
  },
);

watch(
  () => reissueForm.planId,
  () => {
    if (!reissueForm.customLimits && selectedReissuePlan.value) {
      applyPlanToLimitForm(selectedReissuePlan.value, reissueForm);
    }
  },
);

function updateFormNumber(target: LimitForm, field: LimitNumberField, event: Event): void {
  const input = event.target as HTMLInputElement | null;

  if (!input) {
    return;
  }

  const value = Math.max(1, parseMaskedInteger(input.value, 1));
  target[field] = value;
  input.value = formatIntegerInput(value);
}

async function openCreateDrawer(): Promise<void> {
  if (selectedCreatePlan.value) {
    applyPlanToLimitForm(selectedCreatePlan.value, form);
  }

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
      planId: form.planId,
      entitlements: form.customLimits ? buildLimitEntitlements(form) : undefined,
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
}

function maskFingerprint(fingerprint: string): string {
  if (fingerprint.length <= 14) {
    return '••••••••';
  }

  return `${fingerprint.slice(0, 6)}••••••••${fingerprint.slice(-5)}`;
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

async function loadDetails(license: LicenseListItem): Promise<void> {
  selectedLicense.value = license;
  currentLicense.value = await getCurrentLicense(license.licenseInstanceId);

  const entitlements = currentLicense.value.entitlements;
  reissueForm.expiresAt = toDateInputValue(new Date(currentLicense.value.expiresAt));
  reissueForm.planId =
    typeof entitlements.planId === 'string'
      ? entitlements.planId
      : inferPlanIdFromEntitlements(entitlements);
  reissueForm.customLimits = false;

  const plan = findPlanById(reissueForm.planId);

  if (plan) {
    applyPlanToLimitForm(plan, reissueForm);
  } else {
    applyEntitlementsToLimitForm(entitlements, reissueForm);
    reissueForm.customLimits = true;
  }
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
      planId: reissueForm.planId,
      entitlements: reissueForm.customLimits
        ? buildLimitEntitlements(reissueForm)
        : undefined,
    });

    await refreshLicenses();
    reissueDrawerOpen.value = false;
  } finally {
    reissuing.value = false;
  }
}

function findPlanById(planId: string): LicensePlan | undefined {
  return plans.value.find((plan) => plan.id === planId);
}

function applyPlanToLimitForm(
  plan: LicensePlan,
  target: {
    maxUsers: number;
    maxProjects: number;
    maxMonthlyEvents: number;
    retentionDays: number;
    aiEnabled: boolean;
    automaticReplayEnabled: boolean;
  },
): void {
  applyEntitlementsToLimitForm(plan.entitlements, target);
}

function applyEntitlementsToLimitForm(
  entitlements: Record<string, boolean | number | string>,
  target: {
    maxUsers: number;
    maxProjects: number;
    maxMonthlyEvents: number;
    retentionDays: number;
    aiEnabled: boolean;
    automaticReplayEnabled: boolean;
  },
): void {
  target.maxUsers = Number(entitlements.maxUsers ?? 10);
  target.maxProjects = Number(entitlements.maxProjects ?? 3);
  target.maxMonthlyEvents = Number(entitlements.maxMonthlyEvents ?? 25000);
  target.retentionDays = Number(entitlements.retentionDays ?? 30);
  target.aiEnabled = Boolean(entitlements.aiEnabled ?? true);
  target.automaticReplayEnabled = Boolean(
    entitlements.automaticReplayEnabled ?? false,
  );
}

function buildLimitEntitlements(source: {
  maxUsers: number;
  maxProjects: number;
  maxMonthlyEvents: number;
  retentionDays: number;
  aiEnabled: boolean;
  automaticReplayEnabled: boolean;
}): Record<string, boolean | number | string> {
  return {
    maxUsers: source.maxUsers,
    maxProjects: source.maxProjects,
    maxMonthlyEvents: source.maxMonthlyEvents,
    retentionDays: source.retentionDays,
    aiEnabled: source.aiEnabled,
    automaticReplayEnabled: source.automaticReplayEnabled,
  };
}

function inferPlanIdFromEntitlements(
  entitlements: Record<string, boolean | number | string>,
): string {
  const matchingPlan = plans.value.find((plan) => {
    return (
      Number(plan.entitlements.maxUsers) === Number(entitlements.maxUsers) &&
      Number(plan.entitlements.maxProjects) === Number(entitlements.maxProjects)
    );
  });

  return matchingPlan?.id ?? plans.value[0]?.id ?? '';
}

function buildPlanPreviewFields(
  plan: LicensePlan,
  overrides?: {
    maxUsers: number;
    maxProjects: number;
    maxMonthlyEvents: number;
    retentionDays: number;
    aiEnabled: boolean;
    automaticReplayEnabled: boolean;
  },
) {
  const entitlements = overrides ?? plan.entitlements;

  return [
    {
      key: 'maxUsers',
      label: 'Usuários',
      value: formatNumber(entitlements.maxUsers),
    },
    {
      key: 'maxProjects',
      label: 'Projetos',
      value: formatNumber(entitlements.maxProjects),
    },
    {
      key: 'maxMonthlyEvents',
      label: 'Eventos/mês',
      value: formatNumber(entitlements.maxMonthlyEvents),
    },
    {
      key: 'retentionDays',
      label: 'Retenção',
      value: `${formatNumber(entitlements.retentionDays)} dias`,
    },
    {
      key: 'aiEnabled',
      label: 'IA',
      value: formatEntitlementValue(Boolean(entitlements.aiEnabled)),
    },
    {
      key: 'automaticReplayEnabled',
      label: 'Replay auto',
      value: formatEntitlementValue(Boolean(entitlements.automaticReplayEnabled)),
    },
  ];
}

function formatNumber(value: unknown): string {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return '-';
  }

  return new Intl.NumberFormat('pt-BR').format(numberValue);
}

function formatCadence(cadence: LicensePlan['cadence']): string {
  const labels: Record<LicensePlan['cadence'], string> = {
    annual: 'anual',
    contract: 'contrato',
    monthly: 'mensal',
  };

  return labels[cadence];
}

function buildActivityPoints(range: 'daily' | 'weekly' | 'monthly') {
  const buckets =
    range === 'daily'
      ? buildDailyBuckets()
      : range === 'weekly'
        ? buildWeeklyBuckets()
        : buildMonthlyBuckets();

  const counts = new Map(buckets.map((bucket) => [bucket.key, 0]));

  activityEvents.value.forEach((event) => {
    const eventDate = new Date(event.occurredAt);
    const bucket = buckets.find(
      (item) => eventDate >= item.start && eventDate <= item.end,
    );

    if (!bucket) {
      return;
    }

    counts.set(bucket.key, (counts.get(bucket.key) ?? 0) + 1);
  });

  const maxValue = Math.max(...Array.from(counts.values()), 1);

  return buckets.map((bucket) => {
    const value = counts.get(bucket.key) ?? 0;

    return {
      key: bucket.key,
      label: bucket.label,
      value,
      height: value > 0 ? Math.max((value / maxValue) * 82, 14) : 4,
    };
  });
}

function buildDailyBuckets() {
  const today = startOfDay(new Date());

  return Array.from({ length: 7 }, (_, index) => {
    const start = addDays(today, index - 6);
    const end = endOfDay(start);

    return {
      key: start.toISOString(),
      label: new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'short',
      }).format(start),
      start,
      end,
    };
  });
}

function buildWeeklyBuckets() {
  const currentWeekStart = startOfWeek(new Date());

  return Array.from({ length: 8 }, (_, index) => {
    const start = addDays(currentWeekStart, (index - 7) * 7);
    const end = endOfDay(addDays(start, 6));

    return {
      key: start.toISOString(),
      label: `S${getWeekNumber(start)}`,
      start,
      end,
    };
  });
}

function buildMonthlyBuckets() {
  const currentMonthStart = startOfMonth(new Date());

  return Array.from({ length: 6 }, (_, index) => {
    const start = addMonths(currentMonthStart, index - 5);
    const end = endOfDay(addDays(addMonths(start, 1), -1));

    return {
      key: start.toISOString(),
      label: new Intl.DateTimeFormat('pt-BR', {
        month: 'short',
      }).format(start),
      start,
      end,
    };
  });
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function addDays(date: Date, amount: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function addMonths(date: Date, amount: number): Date {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + amount);
  return copy;
}

function startOfMonth(date: Date): Date {
  const copy = new Date(date);
  copy.setDate(1);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function startOfWeek(date: Date): Date {
  const copy = startOfDay(date);
  const day = copy.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + mondayOffset);
  return copy;
}

function getWeekNumber(date: Date): string {
  const firstDay = new Date(date.getFullYear(), 0, 1);
  const pastDays = Math.floor(
    (startOfDay(date).getTime() - firstDay.getTime()) / 86400000,
  );

  return String(Math.ceil((pastDays + firstDay.getDay() + 1) / 7)).padStart(2, '0');
}
</script>
