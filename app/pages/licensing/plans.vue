<template>
  <section class="plans-toolbar">
    <div class="plans-toolbar-summary">
      <span class="eyebrow">Catálogo operacional</span>
      <strong>{{ activePlans.length }} planos ativos</strong>
    </div>
    <div class="plans-toolbar-actions">
      <label class="toggle compact-toggle">
        <input v-model="showArchived" type="checkbox" />
        <span>Arquivados</span>
      </label>
      <button class="ghost-button" type="button" @click="refreshAll">
        <UIcon name="i-lucide-refresh-cw" />
        Atualizar
      </button>
      <button class="primary-action-button" type="button" @click="openPlanDrawer()">
        <UIcon name="i-lucide-plus" />
        Novo plano
      </button>
    </div>
  </section>

  <section class="plans-page">
    <div v-if="plansErrorMessage" class="status-banner plans-status">
      {{ plansErrorMessage }}
    </div>

    <section class="plans-hero">
      <article class="plans-hero-main">
        <span class="eyebrow">Planos cadastrados</span>
        <h2>Limites usados para emitir licenças auto-hospedadas</h2>
        <p>
          Cadastre, edite e arquive planos diretamente no serviço de licenciamento.
          Emissão e renovação usam estes limites como fonte de verdade.
        </p>
      </article>

      <div class="plans-summary-grid">
        <article v-for="metric in metrics" :key="metric.label" class="plans-metric">
          <span>{{ metric.label }}</span>
          <strong>{{ metric.value }}</strong>
          <small :class="metric.tone">{{ metric.detail }}</small>
        </article>
      </div>
    </section>

    <section class="plan-card-grid" aria-label="Planos de licença">
      <button
        v-for="plan in displayedPlans"
        :key="plan.id"
        class="plan-card"
        :class="{
          archived: !plan.active,
          featured: plan.featured,
          selected: selectedPlanId === plan.id,
        }"
        type="button"
        @click="selectPlan(plan)"
      >
        <span class="plan-card-topline">
          <span class="badge neutral">{{ formatCadence(plan.cadence) }}</span>
          <span v-if="!plan.active" class="badge danger">arquivado</span>
          <UIcon v-if="plan.featured" name="i-lucide-sparkles" />
        </span>
        <strong>{{ plan.name }}</strong>
        <p>{{ plan.description }}</p>
        <span class="plan-price">{{ plan.priceLabel }}</span>

        <div class="plan-limit-strip">
          <span>
            <strong>{{ formatLimit(plan.entitlements.maxUsers) }}</strong>
            usuários
          </span>
          <span>
            <strong>{{ formatLimit(plan.entitlements.maxProjects) }}</strong>
            projetos
          </span>
          <span>
            <strong>{{ formatBoolean(plan.entitlements.aiEnabled) }}</strong>
            IA
          </span>
        </div>
      </button>
    </section>

    <section class="content-grid plans-content-grid">
      <article class="panel plan-detail-panel">
        <div class="panel-heading">
          <div>
            <span>Plano selecionado</span>
            <h2>{{ selectedPlan?.name ?? 'Selecione um plano' }}</h2>
          </div>
          <button
            class="primary-action-button"
            :disabled="!selectedPlan || !selectedPlan.active"
            type="button"
            @click="openIssueDrawer"
          >
            <UIcon name="i-lucide-key-round" />
            Emitir licença
          </button>
        </div>

        <div v-if="selectedPlan" class="limits-board">
          <article
            v-for="limit in selectedPlanLimits"
            :key="limit.key"
            class="limit-tile"
          >
            <span>{{ limit.label }}</span>
            <strong>{{ limit.value }}</strong>
            <small>{{ limit.description }}</small>
          </article>
        </div>
        <div v-else class="empty-state">Escolha um preset para ver os limites.</div>
      </article>

      <aside class="panel">
        <div class="panel-heading compact">
          <div>
            <span>Resumo real</span>
            <h2>Contratos ativos</h2>
          </div>
        </div>
        <div class="split-list">
          <div class="list-row">
            <div>
              <strong>Total emitido</strong>
              <p class="muted-text">Licenças no serviço de licenciamento</p>
            </div>
            <span class="badge neutral">{{ licenses.length }}</span>
          </div>
          <div class="list-row">
            <div>
              <strong>Ativas</strong>
              <p class="muted-text">Licenças aptas para operação</p>
            </div>
            <span class="badge active">{{ activeLicenses }}</span>
          </div>
          <div class="list-row">
            <div>
              <strong>Vencem em 15 dias</strong>
              <p class="muted-text">Contratos que pedem ação comercial</p>
            </div>
            <span class="badge warning">{{ expiringSoon }}</span>
          </div>
        </div>
      </aside>
    </section>

    <section class="panel table-panel plans-table-panel">
      <div class="panel-heading">
        <div>
          <span>Comparativo</span>
          <h2>Limites por plano</h2>
        </div>
        <p v-if="plansPending">Carregando...</p>
        <p v-else>{{ displayedPlans.length }} planos</p>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Plano</th>
              <th>Status</th>
              <th>Usuários</th>
              <th>Projetos</th>
              <th>Eventos/mês</th>
              <th>Retenção</th>
              <th>IA</th>
              <th>Replay automático</th>
              <th>SLA</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="plan in displayedPlans" :key="plan.id">
              <td>
                <strong>{{ plan.name }}</strong>
                <small>{{ plan.priceLabel }}</small>
              </td>
              <td>
                <span class="badge" :class="plan.active ? 'active' : 'danger'">
                  {{ plan.active ? 'ativo' : 'arquivado' }}
                </span>
              </td>
              <td>{{ formatLimit(plan.entitlements.maxUsers) }}</td>
              <td>{{ formatLimit(plan.entitlements.maxProjects) }}</td>
              <td>{{ formatNumber(plan.entitlements.maxMonthlyEvents) }}</td>
              <td>{{ formatDays(plan.entitlements.retentionDays) }}</td>
              <td>{{ formatBoolean(plan.entitlements.aiEnabled) }}</td>
              <td>{{ formatBoolean(plan.entitlements.automaticReplayEnabled) }}</td>
              <td>{{ formatSla(plan.entitlements.supportSlaHours) }}</td>
              <td>
                <button class="inline-action" type="button" @click="openPlanDrawer(plan)">
                  Editar
                </button>
                <button
                  v-if="plan.active"
                  class="inline-action secondary"
                  type="button"
                  @click="archiveSelectedPlan(plan)"
                >
                  Arquivar
                </button>
                <button
                  v-if="plan.active"
                  class="inline-action secondary"
                  type="button"
                  @click="selectAndIssue(plan)"
                >
                  Emitir
                </button>
              </td>
            </tr>
            <tr v-if="!displayedPlans.length && !plansPending">
              <td colspan="9">
                <div class="empty-state">Nenhum plano retornado pelo serviço de licenciamento.</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>

  <USlideover
    v-model:open="issueDrawerOpen"
    :description="selectedPlan?.name"
    side="right"
    title="Emitir licença por plano"
    :ui="{ content: 'max-w-xl' }"
  >
    <template #body>
      <form v-if="selectedPlan" class="drawer-form plan-drawer" @submit.prevent="issueLicense">
        <div class="drawer-plan-summary">
          <span class="badge neutral">{{ formatCadence(selectedPlan.cadence) }}</span>
          <strong>{{ selectedPlan.name }}</strong>
          <p>{{ selectedPlan.description }}</p>
        </div>

        <label>
          ID do cliente
          <input
            ref="customerInput"
            v-model.trim="issueForm.customerId"
            autocomplete="off"
            placeholder="cust_acme"
            required
          />
        </label>
        <label>
          ID do contrato
          <input
            v-model.trim="issueForm.contractId"
            autocomplete="off"
            placeholder="monthly_acme_2026"
            required
          />
        </label>
        <label>
          Nome da instalação
          <input
            v-model.trim="issueForm.installationName"
            autocomplete="off"
            placeholder="ACME Produção"
            required
          />
        </label>
        <label>
          Vencimento
          <ControlDatePicker v-model="issueForm.expiresAt" required />
        </label>

        <div class="drawer-section-title">Limites do contrato</div>
        <div class="form-row">
          <label>
            Máximo de usuários
            <input
              :value="formatIntegerInput(issueForm.maxUsers)"
              inputmode="numeric"
              min="1"
              required
              type="text"
              @input="updateIssueNumber('maxUsers', $event)"
            />
          </label>
          <label>
            Máximo de projetos
            <input
              :value="formatIntegerInput(issueForm.maxProjects)"
              inputmode="numeric"
              min="1"
              required
              type="text"
              @input="updateIssueNumber('maxProjects', $event)"
            />
          </label>
        </div>
        <div class="form-row">
          <label>
            Eventos mensais
            <input
              :value="formatIntegerInput(issueForm.maxMonthlyEvents)"
              inputmode="numeric"
              min="1"
              required
              type="text"
              @input="updateIssueNumber('maxMonthlyEvents', $event)"
            />
          </label>
          <label>
            Retenção em dias
            <input
              :value="formatIntegerInput(issueForm.retentionDays)"
              inputmode="numeric"
              min="1"
              required
              type="text"
              @input="updateIssueNumber('retentionDays', $event)"
            />
          </label>
        </div>
        <div class="form-row">
          <label>
            SLA de suporte (h)
            <input
              :value="formatIntegerInput(issueForm.supportSlaHours)"
              inputmode="numeric"
              min="1"
              required
              type="text"
              @input="updateIssueNumber('supportSlaHours', $event)"
            />
          </label>
          <label>
            Preço exibido
            <input
              :value="formatBrlInput(issueForm.priceLabel)"
              autocomplete="off"
              inputmode="numeric"
              placeholder="R$ 1.990,00"
              @input="updateIssueCurrency('priceLabel', $event)"
            />
          </label>
        </div>

        <label class="toggle">
          <input v-model="issueForm.aiEnabled" type="checkbox" />
          <span>IA habilitada</span>
        </label>
        <label class="toggle">
          <input v-model="issueForm.automaticReplayEnabled" type="checkbox" />
          <span>Replay automático habilitado</span>
        </label>

        <button class="submit-button" :disabled="issuing" type="submit">
          {{ issuing ? 'Emitindo...' : 'Emitir licença' }}
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
    v-model:open="planDrawerOpen"
    :description="editingPlan?.id ?? 'Novo plano'"
    side="right"
    :title="editingPlan ? 'Editar plano' : 'Cadastrar plano'"
    :ui="{ content: 'max-w-xl' }"
  >
    <template #body>
      <form class="drawer-form plan-drawer" @submit.prevent="savePlan">
        <label>
          ID do plano
          <input
            v-model.trim="planForm.id"
            :disabled="Boolean(editingPlan)"
            autocomplete="off"
            placeholder="auto-hospedado-crescimento"
            required
          />
        </label>
        <label>
          Nome
          <input
            v-model.trim="planForm.name"
            autocomplete="off"
            placeholder="Self-hosted Crescimento"
            required
          />
        </label>
        <label>
          Descrição
          <textarea
            v-model.trim="planForm.description"
            placeholder="Plano para clientes em crescimento..."
            required
            rows="3"
          />
        </label>
        <div class="form-row">
          <label>
            Cadência
            <select v-model="planForm.cadence" required>
              <option value="monthly">Mensal</option>
              <option value="annual">Anual</option>
              <option value="contract">Contrato</option>
            </select>
          </label>
          <label>
            Preço exibido
            <input
              :value="formatBrlInput(planForm.priceLabel)"
              inputmode="numeric"
              placeholder="R$ 1.990,00"
              required
              @input="updatePlanCurrency('priceLabel', $event)"
            />
          </label>
        </div>
        <div class="form-row">
          <label>
            Ordem
            <input
              :value="formatIntegerInput(planForm.sortOrder)"
              inputmode="numeric"
              min="0"
              required
              type="text"
              @input="updatePlanNumber('sortOrder', $event, 0)"
            />
          </label>
          <label>
            SLA suporte (h)
            <input
              :value="formatIntegerInput(planForm.supportSlaHours)"
              inputmode="numeric"
              min="1"
              required
              type="text"
              @input="updatePlanNumber('supportSlaHours', $event)"
            />
          </label>
        </div>

        <div class="drawer-section-title">Limites do plano</div>
        <div class="form-row">
          <label>
            Usuários
            <input
              :value="formatIntegerInput(planForm.maxUsers)"
              inputmode="numeric"
              min="1"
              required
              type="text"
              @input="updatePlanNumber('maxUsers', $event)"
            />
          </label>
          <label>
            Projetos
            <input
              :value="formatIntegerInput(planForm.maxProjects)"
              inputmode="numeric"
              min="1"
              required
              type="text"
              @input="updatePlanNumber('maxProjects', $event)"
            />
          </label>
        </div>
        <div class="form-row">
          <label>
            Eventos/mês
            <input
              :value="formatIntegerInput(planForm.maxMonthlyEvents)"
              inputmode="numeric"
              min="1"
              required
              type="text"
              @input="updatePlanNumber('maxMonthlyEvents', $event)"
            />
          </label>
          <label>
            Retenção (dias)
            <input
              :value="formatIntegerInput(planForm.retentionDays)"
              inputmode="numeric"
              min="1"
              required
              type="text"
              @input="updatePlanNumber('retentionDays', $event)"
            />
          </label>
        </div>

        <label class="toggle">
          <input v-model="planForm.aiEnabled" type="checkbox" />
          <span>Análise por IA</span>
        </label>
        <label class="toggle">
          <input v-model="planForm.automaticReplayEnabled" type="checkbox" />
          <span>Replay automático</span>
        </label>
        <label class="toggle">
          <input v-model="planForm.featured" type="checkbox" />
          <span>Destacar no catálogo</span>
        </label>
        <label class="toggle">
          <input v-model="planForm.active" type="checkbox" />
          <span>Plano ativo</span>
        </label>

        <button class="submit-button" :disabled="savingPlan" type="submit">
          {{ savingPlan ? 'Salvando...' : 'Salvar plano' }}
        </button>
      </form>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import type {
  ActivateLicenseResponse,
  LicensePlan,
} from '~/types/licensing';
import type { LicensePlanPayload } from '~/composables/useLicenses';

definePageMeta({
  title: 'Planos e limites',
  eyebrow: 'Licenciamento',
});

const {
  activateLicense,
  archivePlan,
  createPlan,
  listLicenses,
  listPlans,
  updatePlan,
} = useLicenses();
const toast = useToast();

const showArchived = ref(false);
const selectedPlanId = ref('');
const issueDrawerOpen = ref(false);
const planDrawerOpen = ref(false);
const issuing = ref(false);
const savingPlan = ref(false);
const createdLicense = ref<ActivateLicenseResponse | null>(null);
const editingPlan = ref<LicensePlan | null>(null);
const customerInput = ref<HTMLInputElement | null>(null);

const nextMonth = new Date();
nextMonth.setDate(nextMonth.getDate() + 30);

const issueForm = reactive({
  customerId: '',
  contractId: '',
  installationName: '',
  expiresAt: toDateInputValue(nextMonth),
  maxUsers: 10,
  maxProjects: 3,
  maxMonthlyEvents: 25000,
  retentionDays: 30,
  supportSlaHours: 72,
  priceLabel: '',
  aiEnabled: false,
  automaticReplayEnabled: false,
});
const planForm = reactive({
  id: '',
  name: '',
  description: '',
  cadence: 'monthly' as LicensePlan['cadence'],
  featured: false,
  priceLabel: '',
  active: true,
  sortOrder: 10,
  maxUsers: 10,
  maxProjects: 3,
  maxMonthlyEvents: 25000,
  retentionDays: 30,
  supportSlaHours: 72,
  aiEnabled: false,
  automaticReplayEnabled: false,
});

type IssueNumberField =
  | 'maxMonthlyEvents'
  | 'maxProjects'
  | 'maxUsers'
  | 'retentionDays'
  | 'supportSlaHours';
type PlanNumberField = IssueNumberField | 'sortOrder';
type PriceLabelField = 'priceLabel';

const {
  data: plansData,
  pending: plansPending,
  error: plansError,
  refresh: refreshPlans,
} = await listPlans(true);
const {
  data: licensesData,
  refresh: refreshLicenses,
} = await listLicenses();

const plans = computed(() => plansData.value?.plans ?? []);
const activePlans = computed(() => plans.value.filter((plan) => plan.active));
const displayedPlans = computed(() =>
  showArchived.value ? plans.value : activePlans.value,
);
const licenses = computed(() => licensesData.value?.licenses ?? []);
const selectedPlan = computed(
  () => plans.value.find((plan) => plan.id === selectedPlanId.value) ?? plans.value[0],
);
const activeLicenses = computed(
  () => licenses.value.filter((license) => license.status === 'active').length,
);
const expiringSoon = computed(() => {
  const now = Date.now();
  const limit = now + 1000 * 60 * 60 * 24 * 15;

  return licenses.value.filter((license) => {
    const expiresAt = new Date(license.expiresAt).getTime();
    return expiresAt >= now && expiresAt <= limit;
  }).length;
});
const aiPlans = computed(
  () => activePlans.value.filter((plan) => Boolean(plan.entitlements.aiEnabled)).length,
);
const largestPlan = computed(() =>
  activePlans.value.reduce<LicensePlan | null>((largest, plan) => {
    if (!largest) {
      return plan;
    }

    return Number(plan.entitlements.maxMonthlyEvents ?? 0) >
      Number(largest.entitlements.maxMonthlyEvents ?? 0)
      ? plan
      : largest;
  }, null),
);
const metrics = computed(() => [
  {
    label: 'Licenças emitidas',
    value: String(licenses.value.length),
    detail: `${activeLicenses.value} ativas`,
    tone: 'positive',
  },
  {
    label: 'Planos com IA',
    value: String(aiPlans.value),
    detail: `${activePlans.value.length} ativos`,
    tone: 'neutral',
  },
  {
    label: 'Maior franquia mensal',
    value: largestPlan.value
      ? formatEvents(largestPlan.value.entitlements.maxMonthlyEvents)
      : '-',
    detail: largestPlan.value?.name ?? 'sem dados',
    tone: 'neutral',
  },
  {
    label: 'A vencer',
    value: String(expiringSoon.value),
    detail: '15 dias',
    tone: expiringSoon.value > 0 ? 'warning' : 'positive',
  },
]);
const selectedPlanLimits = computed(() => {
  if (!selectedPlan.value) {
    return [];
  }

  const entitlements = selectedPlan.value.entitlements;

  return [
    {
      key: 'maxUsers',
      label: 'Usuários',
      value: formatLimit(entitlements.maxUsers),
      description: 'Assentos máximos habilitados.',
    },
    {
      key: 'maxProjects',
      label: 'Projetos',
      value: formatLimit(entitlements.maxProjects),
      description: 'Ambientes/projetos no cliente.',
    },
    {
      key: 'maxMonthlyEvents',
      label: 'Eventos mensais',
      value: formatNumber(entitlements.maxMonthlyEvents),
      description: 'Franquia antes de negociação extra.',
    },
    {
      key: 'retentionDays',
      label: 'Retenção',
      value: formatDays(entitlements.retentionDays),
      description: 'Janela de dados disponível.',
    },
    {
      key: 'aiEnabled',
      label: 'Análise por IA',
      value: formatBoolean(entitlements.aiEnabled),
      description: 'Permissão para recursos de IA.',
    },
    {
      key: 'automaticReplayEnabled',
      label: 'Replay automático',
      value: formatBoolean(entitlements.automaticReplayEnabled),
      description: 'Automação de recuperação habilitada.',
    },
  ];
});
const plansErrorMessage = computed(() => {
  if (!plansError.value) {
    return '';
  }

  return 'Não foi possível carregar os planos. Verifique se o rebound-control-api está online e conectado ao licensing.';
});

watch(
  plans,
  (currentPlans) => {
  if (!selectedPlanId.value && currentPlans.length) {
      selectedPlanId.value =
        currentPlans.find((plan) => plan.active && plan.featured)?.id ??
        currentPlans.find((plan) => plan.active)?.id ??
        currentPlans[0].id;
    }
  },
  { immediate: true },
);

watch(showArchived, (includeArchived) => {
  if (!includeArchived && selectedPlan.value && !selectedPlan.value.active) {
    selectedPlanId.value = activePlans.value[0]?.id ?? '';
  }
});

function updateMaskedNumber(
  event: Event,
  setValue: (value: number) => void,
  minimum = 1,
): void {
  const input = event.target as HTMLInputElement | null;

  if (!input) {
    return;
  }

  const value = Math.max(minimum, parseMaskedInteger(input.value, minimum));
  setValue(value);
  input.value = formatIntegerInput(value);
}

function updateMaskedCurrency(
  event: Event,
  setValue: (value: string) => void,
): void {
  const input = event.target as HTMLInputElement | null;

  if (!input) {
    return;
  }

  const value = formatBrlFromCents(parseMaskedCurrencyToCents(input.value));
  setValue(value);
  input.value = value;
}

function updateIssueNumber(field: IssueNumberField, event: Event): void {
  updateMaskedNumber(event, (value) => {
    issueForm[field] = value;
  });
}

function updatePlanNumber(field: PlanNumberField, event: Event, minimum = 1): void {
  updateMaskedNumber(event, (value) => {
    planForm[field] = value;
  }, minimum);
}

function updateIssueCurrency(field: PriceLabelField, event: Event): void {
  updateMaskedCurrency(event, (value) => {
    issueForm[field] = value;
  });
}

function updatePlanCurrency(field: PriceLabelField, event: Event): void {
  updateMaskedCurrency(event, (value) => {
    planForm[field] = value;
  });
}

function selectPlan(plan: LicensePlan): void {
  selectedPlanId.value = plan.id;
}

async function selectAndIssue(plan: LicensePlan): Promise<void> {
  selectPlan(plan);
  await openIssueDrawer();
}

async function openIssueDrawer(): Promise<void> {
  if (!selectedPlan.value || !selectedPlan.value.active) {
    return;
  }

  fillIssueForm(selectedPlan.value);
  createdLicense.value = null;
  issueDrawerOpen.value = true;
  await nextTick();
  customerInput.value?.focus();
}

function openPlanDrawer(plan?: LicensePlan): void {
  editingPlan.value = plan ?? null;

  if (plan) {
    fillPlanForm(plan);
  } else {
    resetPlanForm();
  }

  planDrawerOpen.value = true;
}

function fillIssueForm(plan: LicensePlan): void {
  const entitlements = plan.entitlements;
  issueForm.maxUsers = Number(entitlements.maxUsers ?? 10);
  issueForm.maxProjects = Number(entitlements.maxProjects ?? 3);
  issueForm.maxMonthlyEvents = Number(entitlements.maxMonthlyEvents ?? 25000);
  issueForm.retentionDays = Number(entitlements.retentionDays ?? 30);
  issueForm.supportSlaHours = Number(entitlements.supportSlaHours ?? 72);
  issueForm.priceLabel = plan.priceLabel;
  issueForm.aiEnabled = Boolean(entitlements.aiEnabled);
  issueForm.automaticReplayEnabled = Boolean(entitlements.automaticReplayEnabled);
}

async function issueLicense(): Promise<void> {
  if (!selectedPlan.value) {
    return;
  }

  issuing.value = true;
  createdLicense.value = null;

  try {
    createdLicense.value = await activateLicense({
      customerId: issueForm.customerId,
      contractId: issueForm.contractId,
      installationName: issueForm.installationName,
      expiresAt: toEndOfDayIso(issueForm.expiresAt),
      planId: selectedPlan.value.id,
      entitlements: {
        maxUsers: issueForm.maxUsers,
        maxProjects: issueForm.maxProjects,
        maxMonthlyEvents: issueForm.maxMonthlyEvents,
        retentionDays: issueForm.retentionDays,
        supportSlaHours: issueForm.supportSlaHours,
        priceLabel: issueForm.priceLabel,
        aiEnabled: issueForm.aiEnabled,
        automaticReplayEnabled: issueForm.automaticReplayEnabled,
      },
    });

    await refreshLicenses();
    toast.add({
      title: 'Licença emitida',
      description: 'A chave da licença foi gerada com os limites do plano.',
      color: 'success',
      icon: 'i-lucide-key-round',
    });
  } finally {
    issuing.value = false;
  }
}

async function copyLicenseKey(): Promise<void> {
  if (!createdLicense.value?.licenseKey) {
    return;
  }

  await navigator.clipboard.writeText(createdLicense.value.licenseKey);
  toast.add({
    title: 'Chave da licença copiada',
    color: 'success',
    icon: 'i-lucide-copy-check',
  });
}

async function refreshAll(): Promise<void> {
  await Promise.all([refreshPlans(), refreshLicenses()]);
}

async function savePlan(): Promise<void> {
  savingPlan.value = true;

  try {
    const payload = buildPlanPayload();

    if (editingPlan.value) {
      await updatePlan(editingPlan.value.id, payload);
    } else {
      await createPlan(payload);
    }

    await refreshPlans();
    selectedPlanId.value = payload.id;
    planDrawerOpen.value = false;

    toast.add({
      title: editingPlan.value ? 'Plano atualizado' : 'Plano cadastrado',
      color: 'success',
      icon: 'i-lucide-badge-check',
    });
  } finally {
    savingPlan.value = false;
  }
}

async function archiveSelectedPlan(plan: LicensePlan): Promise<void> {
  await archivePlan(plan.id);
  await refreshPlans();

  if (selectedPlanId.value === plan.id) {
    selectedPlanId.value = activePlans.value[0]?.id ?? '';
  }

  toast.add({
    title: 'Plano arquivado',
    description: 'Ele não ficará disponível para novas emissões.',
    color: 'success',
    icon: 'i-lucide-archive',
  });
}

function buildPlanPayload(): LicensePlanPayload {
  return {
    id: slugifyPlanId(planForm.id),
    name: planForm.name,
    description: planForm.description,
    cadence: planForm.cadence,
    featured: planForm.featured,
    priceLabel: planForm.priceLabel,
    active: planForm.active,
    sortOrder: planForm.sortOrder,
    entitlements: {
      maxUsers: planForm.maxUsers,
      maxProjects: planForm.maxProjects,
      maxMonthlyEvents: planForm.maxMonthlyEvents,
      retentionDays: planForm.retentionDays,
      supportSlaHours: planForm.supportSlaHours,
      aiEnabled: planForm.aiEnabled,
      automaticReplayEnabled: planForm.automaticReplayEnabled,
    },
  };
}

function fillPlanForm(plan: LicensePlan): void {
  const entitlements = plan.entitlements;
  planForm.id = plan.id;
  planForm.name = plan.name;
  planForm.description = plan.description;
  planForm.cadence = plan.cadence;
  planForm.featured = plan.featured;
  planForm.priceLabel = plan.priceLabel;
  planForm.active = plan.active;
  planForm.sortOrder = plan.sortOrder;
  planForm.maxUsers = Number(entitlements.maxUsers ?? 10);
  planForm.maxProjects = Number(entitlements.maxProjects ?? 3);
  planForm.maxMonthlyEvents = Number(entitlements.maxMonthlyEvents ?? 25000);
  planForm.retentionDays = Number(entitlements.retentionDays ?? 30);
  planForm.supportSlaHours = Number(entitlements.supportSlaHours ?? 72);
  planForm.aiEnabled = Boolean(entitlements.aiEnabled);
  planForm.automaticReplayEnabled = Boolean(entitlements.automaticReplayEnabled);
}

function resetPlanForm(): void {
  planForm.id = '';
  planForm.name = '';
  planForm.description = '';
  planForm.cadence = 'monthly';
  planForm.featured = false;
  planForm.priceLabel = '';
  planForm.active = true;
  planForm.sortOrder = (plans.value.length + 1) * 10;
  planForm.maxUsers = 10;
  planForm.maxProjects = 3;
  planForm.maxMonthlyEvents = 25000;
  planForm.retentionDays = 30;
  planForm.supportSlaHours = 72;
  planForm.aiEnabled = false;
  planForm.automaticReplayEnabled = false;
}

function slugifyPlanId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatCadence(cadence: LicensePlan['cadence']): string {
  const labels: Record<LicensePlan['cadence'], string> = {
    annual: 'anual',
    contract: 'contrato',
    monthly: 'mensal',
  };

  return labels[cadence];
}

function formatBoolean(value: unknown): string {
  return value ? 'Sim' : 'Não';
}

function formatLimit(value: unknown): string {
  return typeof value === 'number' ? formatNumber(value) : String(value ?? '-');
}

function formatNumber(value: unknown): string {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return '-';
  }

  return new Intl.NumberFormat('pt-BR').format(numberValue);
}

function formatEvents(value: unknown): string {
  const formatted = formatNumber(value);

  return formatted === '-' ? formatted : `${formatted} eventos`;
}

function formatDays(value: unknown): string {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return '-';
  }

  return `${formatNumber(numberValue)} dias`;
}

function formatSla(value: unknown): string {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return '-';
  }

  return `${formatNumber(numberValue)}h`;
}
</script>

<style scoped>
.plans-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  min-height: 50px;
  padding: 0 24px;
  border-bottom: 1px solid var(--border);
}

.plans-toolbar-summary {
  display: grid;
  gap: 2px;
}

.plans-toolbar strong {
  color: var(--text);
  font-size: 14px;
}

.plans-toolbar button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.plans-toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
}

.compact-toggle {
  position: relative;
  display: inline-flex !important;
  align-items: center;
  gap: 8px !important;
  height: 32px;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: rgba(23, 24, 29, 0.72);
  color: var(--muted-strong);
  font-size: 13px;
  font-weight: 800;
  padding: 0 12px 0 36px;
}

.compact-toggle input {
  position: absolute;
  left: 10px;
  width: 16px;
  height: 16px;
  margin: 0;
  accent-color: var(--green);
}

.compact-toggle:has(input:checked) {
  border-color: rgba(0, 220, 130, 0.35);
  background: var(--green-soft);
  color: var(--green);
}

.plans-toolbar-actions .ghost-button,
.plans-toolbar-actions .primary-action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 118px;
}

.plans-page {
  display: grid;
  gap: 24px;
  padding: 24px;
}

.plans-status {
  margin: 0;
}

.plans-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(360px, 0.9fr);
  gap: 18px;
  align-items: stretch;
}

.plans-hero-main {
  display: grid;
  align-content: center;
  min-height: 210px;
  border: 1px solid rgba(0, 220, 130, 0.22);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(0, 220, 130, 0.12), transparent 48%),
    var(--surface);
  padding: 24px;
  box-shadow: var(--shadow);
}

.plans-hero-main h2 {
  max-width: 760px;
  margin: 6px 0 0;
  color: var(--text);
  font-size: 28px;
  line-height: 1.12;
}

.plans-hero-main p {
  max-width: 680px;
  margin: 12px 0 0;
  color: var(--muted-strong);
  line-height: 1.55;
}

.plans-summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.plans-metric {
  display: grid;
  align-content: space-between;
  min-height: 99px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  padding: 16px;
}

.plans-metric span {
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.plans-metric strong {
  margin-top: 12px;
  color: var(--text);
  font-size: 26px;
  line-height: 1;
}

.plans-metric small {
  margin-top: 6px;
  font-size: 12px;
  font-weight: 800;
}

.plan-card-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.plan-card {
  display: grid;
  min-height: 246px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: inherit;
  padding: 18px;
  text-align: left;
  transition:
    border-color 160ms ease,
    transform 160ms ease,
    background 160ms ease;
}

.plan-card:hover,
.plan-card.selected {
  transform: translateY(-1px);
  border-color: rgba(0, 220, 130, 0.42);
  background: var(--surface-soft);
}

.plan-card.featured {
  border-color: rgba(96, 165, 250, 0.34);
  background:
    linear-gradient(135deg, rgba(96, 165, 250, 0.1), transparent 54%),
    var(--surface);
}

.plan-card.archived {
  opacity: 0.58;
}

.plan-card-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--blue);
}

.plan-card > strong {
  margin-top: 16px;
  color: var(--text);
  font-size: 20px;
}

.plan-card p {
  margin: 8px 0 0;
  color: var(--muted-strong);
  line-height: 1.45;
}

.plan-price {
  margin-top: 18px;
  color: var(--green);
  font-size: 15px;
  font-weight: 900;
}

.plan-limit-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 18px;
}

.plan-limit-strip span {
  min-width: 0;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
  color: var(--muted);
  font-size: 12px;
  padding: 10px;
}

.plan-limit-strip strong {
  display: block;
  color: var(--text);
  font-size: 15px;
}

.plans-content-grid {
  margin: 0;
}

.plan-detail-panel {
  overflow: hidden;
}

.panel-heading .primary-action-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.limits-board {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  padding: 18px 24px 24px;
}

.limit-tile {
  min-height: 126px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.018);
  padding: 16px;
}

.limit-tile span {
  color: var(--muted);
  font-size: 12px;
  font-weight: 850;
  text-transform: uppercase;
}

.limit-tile strong {
  display: block;
  margin-top: 12px;
  color: var(--text);
  font-size: 24px;
}

.limit-tile small {
  display: block;
  margin-top: 8px;
  color: var(--muted-strong);
  line-height: 1.4;
}

.plans-table-panel {
  margin: 0;
}

.drawer-plan-summary {
  display: grid;
  gap: 8px;
  border: 1px solid rgba(96, 165, 250, 0.28);
  border-radius: 8px;
  background: rgba(96, 165, 250, 0.08);
  padding: 14px;
}

.drawer-plan-summary .badge {
  justify-self: start;
}

.drawer-plan-summary strong {
  color: var(--text);
  font-size: 18px;
}

.drawer-plan-summary p {
  margin: 0;
  color: var(--muted-strong);
}

.drawer-section-title {
  color: var(--muted);
  font-size: 12px;
  font-weight: 850;
  text-transform: uppercase;
}

@media (max-width: 1180px) {
  .plans-hero,
  .plan-card-grid {
    grid-template-columns: 1fr;
  }

  .plans-summary-grid,
  .limits-board {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 820px) {
  .plans-toolbar,
  .plans-page {
    padding: 16px;
  }

  .plans-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .plans-toolbar-actions {
    align-items: stretch;
    flex-direction: column;
    width: 100%;
  }

  .plans-hero-main {
    min-height: 180px;
  }

  .plans-hero-main h2 {
    font-size: 22px;
  }

  .plans-summary-grid,
  .limits-board,
  .plan-limit-strip {
    grid-template-columns: 1fr;
  }
}
</style>
