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
              Máximo de usuários (0 = ilimitado)
              <input
                :value="formatIntegerInput(form.maxUsers)"
                inputmode="numeric"
                min="0"
                required
                type="text"
                @input="updateFormNumber(form, 'maxUsers', $event, 0)"
              />
            </label>
            <label>
              Máximo de projetos (0 = ilimitado)
              <input
                :value="formatIntegerInput(form.maxProjects)"
                inputmode="numeric"
                min="0"
                required
                type="text"
                @input="updateFormNumber(form, 'maxProjects', $event, 0)"
              />
            </label>
          </div>
          <div class="form-row">
            <label>
              Eventos mensais (0 = ilimitado)
              <input
                :value="formatIntegerInput(form.maxMonthlyEvents)"
                inputmode="numeric"
                min="0"
                required
                type="text"
                @input="updateFormNumber(form, 'maxMonthlyEvents', $event, 0)"
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
          <label v-if="form.aiEnabled">
            Análises IA/mês (0 = ilimitado)
            <input
              :value="formatIntegerInput(form.maxAiAnalysisMonthly)"
              inputmode="numeric"
              min="0"
              required
              type="text"
              @input="updateFormNumber(form, 'maxAiAnalysisMonthly', $event, 0)"
            />
          </label>
          <label>
            Reprocessamentos manuais/mês (0 = ilimitado)
            <input
              :value="formatIntegerInput(form.maxPayloadReplaysMonthly)"
              inputmode="numeric"
              min="0"
              required
              type="text"
              @input="updateFormNumber(form, 'maxPayloadReplaysMonthly', $event, 0)"
            />
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
              Máximo de usuários (0 = ilimitado)
              <input
                :value="formatIntegerInput(reissueForm.maxUsers)"
                inputmode="numeric"
                min="0"
                required
                type="text"
                @input="updateFormNumber(reissueForm, 'maxUsers', $event, 0)"
              />
            </label>
            <label>
              Máximo de projetos (0 = ilimitado)
              <input
                :value="formatIntegerInput(reissueForm.maxProjects)"
                inputmode="numeric"
                min="0"
                required
                type="text"
                @input="updateFormNumber(reissueForm, 'maxProjects', $event, 0)"
              />
            </label>
          </div>
          <div class="form-row">
            <label>
              Eventos mensais (0 = ilimitado)
              <input
                :value="formatIntegerInput(reissueForm.maxMonthlyEvents)"
                inputmode="numeric"
                min="0"
                required
                type="text"
                @input="updateFormNumber(reissueForm, 'maxMonthlyEvents', $event, 0)"
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
          <label v-if="reissueForm.aiEnabled">
            Análises IA/mês (0 = ilimitado)
            <input
              :value="formatIntegerInput(reissueForm.maxAiAnalysisMonthly)"
              inputmode="numeric"
              min="0"
              required
              type="text"
              @input="updateFormNumber(reissueForm, 'maxAiAnalysisMonthly', $event, 0)"
            />
          </label>
          <label>
            Reprocessamentos manuais/mês (0 = ilimitado)
            <input
              :value="formatIntegerInput(reissueForm.maxPayloadReplaysMonthly)"
              inputmode="numeric"
              min="0"
              required
              type="text"
              @input="updateFormNumber(reissueForm, 'maxPayloadReplaysMonthly', $event, 0)"
            />
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
  title: 'Instalações',
  eyebrow: 'Licenciamento',
});

const {
  activateLicense,
  getCurrentLicense,
  getLicenseHealth,
  listLicenses,
  listPlans,
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
  planId: '',
  customerId: '',
  contractId: '',
  installationName: '',
  expiresAt: toDateInputValue(nextMonth),
  customLimits: false,
  maxUsers: 10,
  maxProjects: 3,
  maxMonthlyEvents: 25000,
  maxAiAnalysisMonthly: 100,
  maxPayloadReplaysMonthly: 30,
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
  maxAiAnalysisMonthly: 100,
  maxPayloadReplaysMonthly: 30,
  retentionDays: 30,
  aiEnabled: true,
  automaticReplayEnabled: false,
});

type LimitNumberField =
  | 'maxMonthlyEvents'
  | 'maxAiAnalysisMonthly'
  | 'maxPayloadReplaysMonthly'
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

function updateFormNumber(
  target: LimitForm,
  field: LimitNumberField,
  event: Event,
  minimum = 1,
): void {
  const input = event.target as HTMLInputElement | null;

  if (!input) {
    return;
  }

  const value = Math.max(minimum, parseMaskedInteger(input.value, minimum));
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
    maxAiAnalysisMonthly: 'Análises IA/mês',
    maxPayloadReplaysMonthly: 'Reprocessamentos manuais/mês',
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

    if (currentLicense.value.licenseKey) {
      selectedLicense.value.licenseKey = currentLicense.value.licenseKey;
    }

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
    maxAiAnalysisMonthly: number;
    maxPayloadReplaysMonthly: number;
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
    maxAiAnalysisMonthly: number;
    maxPayloadReplaysMonthly: number;
    retentionDays: number;
    aiEnabled: boolean;
    automaticReplayEnabled: boolean;
  },
): void {
  target.maxUsers = readLimitForForm(entitlements.maxUsers, 10);
  target.maxProjects = readLimitForForm(entitlements.maxProjects, 3);
  target.maxMonthlyEvents = readLimitForForm(entitlements.maxMonthlyEvents, 25000);
  target.maxAiAnalysisMonthly = readLimitForForm(entitlements.maxAiAnalysisMonthly, 100);
  target.maxPayloadReplaysMonthly = readLimitForForm(
    entitlements.maxPayloadReplaysMonthly,
    30,
  );
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
  maxAiAnalysisMonthly: number;
  maxPayloadReplaysMonthly: number;
  retentionDays: number;
  aiEnabled: boolean;
  automaticReplayEnabled: boolean;
}): Record<string, boolean | number | string> {
  return {
    maxUsers: serializeLimit(source.maxUsers),
    maxProjects: serializeLimit(source.maxProjects),
    maxMonthlyEvents: serializeLimit(source.maxMonthlyEvents),
    maxAiAnalysisMonthly: serializeLimit(source.maxAiAnalysisMonthly),
    maxPayloadReplaysMonthly: serializeLimit(source.maxPayloadReplaysMonthly),
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
    maxAiAnalysisMonthly: number;
    maxPayloadReplaysMonthly: number;
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
      value: formatLimit(entitlements.maxUsers),
    },
    {
      key: 'maxProjects',
      label: 'Projetos',
      value: formatLimit(entitlements.maxProjects),
    },
    {
      key: 'maxMonthlyEvents',
      label: 'Eventos/mês',
      value: formatLimit(entitlements.maxMonthlyEvents),
    },
    {
      key: 'maxAiAnalysisMonthly',
      label: 'Análises IA/mês',
      value: formatLimit(entitlements.maxAiAnalysisMonthly),
    },
    {
      key: 'maxPayloadReplaysMonthly',
      label: 'Replays manuais/mês',
      value: formatLimit(entitlements.maxPayloadReplaysMonthly),
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

function formatLimit(value: unknown): string {
  if (value === 'unlimited' || value === null) {
    return 'Ilimitado';
  }

  return formatNumber(value);
}

function readLimitForForm(value: unknown, fallback: number): number {
  if (value === 'unlimited' || value === null) {
    return 0;
  }

  const numberValue = Number(value ?? fallback);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function serializeLimit(value: number): number | string {
  return value <= 0 ? 'unlimited' : value;
}

function formatCadence(cadence: LicensePlan['cadence']): string {
  const labels: Record<LicensePlan['cadence'], string> = {
    annual: 'anual',
    contract: 'contrato',
    monthly: 'mensal',
  };

  return labels[cadence];
}
</script>
