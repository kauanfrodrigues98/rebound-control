<template>
  <CustomerDrawerShell
    :open="open"
    :description="
      editing
        ? 'Atualize o contrato respeitando o fluxo comercial permitido.'
        : 'Cadastre uma minuta ou contrato firmado com o cliente.'
    "
    size="lg"
    :title="editing ? 'Editar contrato' : 'Novo contrato'"
    @close="emit('update:open', false)"
  >
    <form class="drawer-form" @submit.prevent="emit('submit')">
        <div class="drawer-section">
          <span class="eyebrow">Identificação</span>
          <div class="form-row">
            <label>
              Código
              <input
                :value="form.codigo || 'Gerado automaticamente ao salvar'"
                disabled
                readonly
              />
            </label>
            <label>
              Status
              <select v-model="form.status" :disabled="statusOptions.length <= 1">
                <option
                  v-for="status in statusOptions"
                  :key="status.value"
                  :value="status.value"
                >
                  {{ status.label }}
                </option>
              </select>
            </label>
          </div>
          <div v-if="isActiveContract" class="status-note">
            Contrato ativo fica travado para edição. Para mudar valores, plano ou vigência,
            crie um novo contrato.
          </div>
          <div v-else-if="isFinalContract" class="status-note">
            Contrato {{ form.status === 'encerrado' ? 'encerrado' : 'cancelado' }} fica somente
            para consulta.
          </div>
          <div class="contract-plan-picker">
            <div class="contract-plan-picker-heading">
              <div>
                <strong>Plano do contrato</strong>
                <small>Selecione um plano ativo cadastrado e ajuste os valores se precisar.</small>
              </div>
              <span class="badge neutral">{{ selectedPlan?.ambiente ?? 'manual' }}</span>
            </div>
            <div v-if="plansPending" class="empty-state compact-empty-state">
              Carregando planos ativos...
            </div>
            <div
              v-else-if="planOptions.length"
              class="contract-plan-scroll"
              aria-label="Planos ativos cadastrados"
            >
              <button
                v-for="plan in planOptions"
                :key="plan.id"
                class="contract-plan-card"
                :class="{ selected: form.plano === plan.nome }"
                :disabled="fieldsLocked"
                type="button"
                @click="selectPlan(plan)"
              >
                <span class="contract-plan-card-top">
                  <span class="badge neutral">{{ plan.ambiente }}</span>
                  <span v-if="plan.destaque" class="badge active">recomendado</span>
                </span>
                <strong>{{ plan.nome }}</strong>
                <p>{{ plan.descricao }}</p>
                <span class="contract-plan-price">{{ plan.valorMensal }}</span>
                <span class="contract-plan-limits">
                  <small>{{ plan.usuarios }}</small>
                  <small>{{ plan.eventos }}</small>
                  <small>{{ plan.retencao }}</small>
                </span>
              </button>
            </div>
            <div v-else class="empty-state compact-empty-state">
              Nenhum plano ativo cadastrado.
            </div>
          </div>
          <label>
            Plano selecionado
            <input
              v-model.trim="form.plano"
              :disabled="fieldsLocked"
              placeholder="Enterprise Self-hosted"
              required
              @input="form.planId = ''"
            />
          </label>
        </div>

        <div class="drawer-section">
          <span class="eyebrow">Valores</span>
          <div class="form-row">
            <label>
              Valor mensal
              <input
                :value="form.valorMensal"
                inputmode="numeric"
                :disabled="fieldsLocked"
                placeholder="R$ 0,00"
                @input="updateMoney('valorMensal', $event)"
              />
            </label>
            <label>
              Valor de implantação
              <input
                :value="form.valorImplantacao"
                inputmode="numeric"
                :disabled="fieldsLocked"
                placeholder="R$ 0,00"
                @input="updateMoney('valorImplantacao', $event)"
              />
            </label>
          </div>
          <div class="form-row">
            <label>
              Ciclo
              <select v-model="form.ciclo" :disabled="fieldsLocked">
                <option value="mensal">Mensal</option>
                <option value="trimestral">Trimestral</option>
                <option value="semestral">Semestral</option>
                <option value="anual">Anual</option>
                <option value="customizado">Customizado</option>
              </select>
            </label>
            <label>
              Dia de vencimento
              <input
                v-model.trim="form.diaVencimento"
                :disabled="fieldsLocked"
                inputmode="numeric"
                placeholder="10"
              />
            </label>
          </div>
          <label>
            Forma de pagamento
            <input
              v-model.trim="form.formaPagamento"
              :disabled="fieldsLocked"
              placeholder="Boleto, cartão, transferência..."
            />
          </label>
        </div>

        <div class="drawer-section">
          <span class="eyebrow">Vigência</span>
          <div class="form-row">
            <label>
              Data de início
              <ControlDatePicker v-model="form.dataInicio" :disabled="fieldsLocked" required />
            </label>
            <label>
              Data de término
              <ControlDatePicker v-model="form.dataTermino" :disabled="fieldsLocked" />
            </label>
          </div>
          <label>
            Responsável pela assinatura
            <input v-model.trim="form.responsavelAssinatura" :disabled="fieldsLocked" />
          </label>
        </div>

        <label>
          Observações
          <textarea v-model.trim="form.observacoes" :disabled="fieldsLocked" />
        </label>

        <button class="submit-button" type="submit" :disabled="!canSubmit">
          {{ editing ? 'Salvar contrato' : 'Adicionar contrato' }}
        </button>
    </form>
  </CustomerDrawerShell>
</template>

<script setup lang="ts">
import CustomerDrawerShell from '~/components/customers/CustomerDrawerShell.vue';
import type { ContratoCliente, StatusContratoCliente } from '~/types/customers';
import type { LicensePlan, LicensePlansResponse } from '~/types/licensing';
import { formatarStatusContratoCliente } from '~/utils/customers';
import { formatBrlInput } from '~/utils/masks';

const props = defineProps<{
  open: boolean;
  form: ContratoCliente;
  editing?: boolean;
  currentStatus?: StatusContratoCliente;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  'update:form': [value: ContratoCliente];
  submit: [];
}>();

const open = computed(() => props.open);
const form = computed({
  get: () => props.form,
  set: (value) => emit('update:form', value),
});
const editing = computed(() => Boolean(props.editing));
const transitionBaseStatus = computed(() => props.currentStatus ?? props.form.status);

const { data: plansResponse, pending: plansPending } = useFetch<LicensePlansResponse>(
  '/api/plans',
  {
    default: () => ({ plans: [] }),
    query: { includeArchived: false },
  },
);

const planOptions = computed(() =>
  (plansResponse.value?.plans ?? [])
    .filter((plan) => plan.active)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    .map(mapPlanToContractOption),
);

const selectedPlan = computed(
  () => planOptions.value.find((plan) => plan.nome === form.value.plano) ?? null,
);
const isActiveContract = computed(() => editing.value && transitionBaseStatus.value === 'ativo');
const isFinalContract = computed(
  () => editing.value && ['encerrado', 'cancelado'].includes(transitionBaseStatus.value),
);
const fieldsLocked = computed(() => isActiveContract.value || isFinalContract.value);
const statusOptions = computed(() =>
  availableContractStatuses(transitionBaseStatus.value).map((status) => ({
    value: status,
    label: formatarStatusContratoCliente(status),
  })),
);
const canSubmit = computed(() => !isFinalContract.value || !editing.value);

type ContractPlanOption = {
  id: string;
  nome: string;
  descricao: string;
  ambiente: string;
  valorMensal: string;
  ciclo: ContratoCliente['ciclo'];
  usuarios: string;
  eventos: string;
  retencao: string;
  destaque: boolean;
};

function selectPlan(plan: ContractPlanOption): void {
  if (fieldsLocked.value) return;
  form.value.plano = plan.nome;
  form.value.planId = plan.id;
  form.value.valorMensal = plan.valorMensal;
  form.value.ciclo = plan.ciclo;
}

function updateMoney(field: 'valorMensal' | 'valorImplantacao', event: Event): void {
  if (fieldsLocked.value) return;
  const input = event.target as HTMLInputElement;
  form.value[field] = formatBrlInput(input.value);
}

function availableContractStatuses(status: StatusContratoCliente): StatusContratoCliente[] {
  const transitions: Record<StatusContratoCliente, StatusContratoCliente[]> = {
    rascunho: ['rascunho', 'em_assinatura', 'ativo', 'cancelado'],
    em_assinatura: ['em_assinatura', 'ativo', 'cancelado'],
    ativo: ['ativo', 'encerrado'],
    encerrado: ['encerrado'],
    cancelado: ['cancelado'],
  };

  return transitions[status];
}

function mapPlanToContractOption(plan: LicensePlan): ContractPlanOption {
  return {
    id: plan.id,
    nome: plan.name,
    descricao: plan.description || 'Plano cadastrado no catálogo operacional.',
    ambiente: inferPlanEnvironment(plan),
    valorMensal: plan.priceLabel || 'R$ 0,00',
    ciclo: mapCadenceToContractCycle(plan.cadence),
    usuarios: `${formatLimit(plan.entitlements.maxUsers)} usuários`,
    eventos: `${formatLimit(plan.entitlements.maxMonthlyEvents)} eventos/mês`,
    retencao: `${formatLimit(plan.entitlements.retentionDays)} dias`,
    destaque: plan.featured,
  };
}

function mapCadenceToContractCycle(cadence: LicensePlan['cadence']): ContratoCliente['ciclo'] {
  const cycles: Record<LicensePlan['cadence'], ContratoCliente['ciclo']> = {
    annual: 'anual',
    contract: 'customizado',
    monthly: 'mensal',
  };

  return cycles[cadence];
}

function inferPlanEnvironment(plan: LicensePlan): string {
  const haystack = `${plan.id} ${plan.name} ${plan.description}`.toLowerCase();

  if (haystack.includes('hibrido') || haystack.includes('hybrid')) return 'Híbrido';
  if (haystack.includes('self') || haystack.includes('hosted')) return 'Self-hosted';
  if (haystack.includes('cloud')) return 'Cloud';

  return 'Contrato';
}

function formatLimit(value: unknown): string {
  if (value === 'unlimited' || value === null) return 'Ilimitado';

  if (typeof value === 'number') {
    return new Intl.NumberFormat('pt-BR').format(value);
  }

  return String(value ?? '-');
}
</script>
