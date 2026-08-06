<template>
  <ClientOnly>
    <section class="page-content">
      <NuxtLink class="inline-action secondary" to="/customers">
        Voltar para clientes
      </NuxtLink>
    </section>

    <template v-if="cliente">
      <section class="customer-detail-hero">
      <div>
        <span class="eyebrow">{{ formatarTipoCliente(cliente.tipo) }}</span>
        <h2>{{ cliente.nome }}</h2>
        <p>{{ cliente.segmento || 'Segmento não definido' }}</p>
      </div>
      <div class="customer-detail-badges">
        <span class="badge" :class="tomEtapaCliente(cliente.etapa)">
          {{ formatarEtapaCliente(cliente.etapa) }}
        </span>
        <span class="badge neutral">
          {{ formatarAmbientePrevisto(cliente.ambientePrevisto) }}
        </span>
        <span class="badge" :class="tomPrioridadeCliente(cliente.prioridade)">
          {{ formatarPrioridadeCliente(cliente.prioridade) }}
        </span>
      </div>
      </section>

      <section class="metrics-grid" aria-label="Resumo do cliente">
      <article v-for="metrica in metricasCliente" :key="metrica.label" class="metric-card">
        <div class="metric-card-top">
          <div class="metric-name">{{ metrica.label }}</div>
          <em :class="metrica.tom">{{ metrica.delta }}</em>
        </div>
        <div class="metric-card-body">
          <strong>{{ metrica.valor }}</strong>
        </div>
      </article>
      </section>

      <section class="customer-tabs" aria-label="Abas do cliente">
      <button
        v-for="aba in abas"
        :key="aba.valor"
        :class="{ active: abaSelecionada === aba.valor }"
        type="button"
        @click="abaSelecionada = aba.valor"
      >
        {{ aba.label }}
      </button>
      </section>

      <section v-if="abaSelecionada === 'visao-geral'" class="content-grid customer-detail-grid">
      <article class="panel">
        <div class="panel-heading compact">
          <div>
            <span>Dados do cliente</span>
            <h2>Visão geral</h2>
          </div>
        </div>
        <div class="split-list">
          <div class="list-row">
            <div>
              <strong>Razão social</strong>
              <p class="muted-text">{{ cliente.razaoSocial || 'Não informado' }}</p>
            </div>
            <span class="badge neutral">{{ cliente.documento || 'documento pendente' }}</span>
          </div>
          <div class="list-row">
            <div>
              <strong>Site</strong>
              <p class="muted-text">{{ cliente.site || 'Não informado' }}</p>
            </div>
            <span class="badge warning">{{ cliente.valorPrevisto || 'valor pendente' }}</span>
          </div>
          <div class="list-row vertical-row">
            <div>
              <strong>Observações</strong>
              <p class="muted-text">{{ cliente.observacoes || 'Sem observações.' }}</p>
            </div>
          </div>
        </div>
      </article>

      <article class="panel">
        <div class="panel-heading compact">
          <div>
            <span>Operação</span>
            <h2>Ambiente e responsáveis</h2>
          </div>
        </div>
        <div class="split-list">
          <div class="list-row">
            <div>
              <strong>Responsável comercial</strong>
              <p class="muted-text">{{ cliente.responsavelComercial || 'Não definido' }}</p>
            </div>
          </div>
          <div class="list-row">
            <div>
              <strong>Responsável técnico</strong>
              <p class="muted-text">{{ cliente.responsavelTecnico || 'Não definido' }}</p>
            </div>
            <span class="badge neutral">{{ formatarAmbientePrevisto(cliente.ambientePrevisto) }}</span>
          </div>
        </div>
      </article>
      </section>

      <section v-if="abaSelecionada === 'contatos'" class="panel table-panel">
      <div class="panel-heading">
        <div>
          <span>Contatos</span>
          <h2>{{ cliente.contatos.length }} pessoas vinculadas</h2>
        </div>
        <button class="primary-action-button" type="button" @click="abrirContato">
          Adicionar contato
        </button>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Contato</th>
              <th>Papel</th>
              <th>Cargo</th>
              <th>Preferência</th>
              <th>Telefone</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="contato in cliente.contatos" :key="contato.id">
              <td>
                <strong>{{ contato.nome || 'Nome pendente' }}</strong>
                <small>{{ contato.email || 'Email pendente' }}</small>
              </td>
              <td>{{ formatarPapelContatoCliente(contato.papel) }}</td>
              <td>{{ contato.cargo || 'Não informado' }}</td>
              <td>{{ contato.preferencia }}</td>
              <td>{{ contato.telefone || 'Não informado' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      </section>

      <section v-if="abaSelecionada === 'timeline'" class="panel table-panel">
      <div class="panel-heading">
        <div>
          <span>Timeline</span>
          <h2>Ações e histórico do cliente</h2>
        </div>
        <button class="primary-action-button" type="button" @click="abrirAcao">
          Nova ação
        </button>
      </div>
      <div class="customer-timeline detail-page-timeline">
        <div v-for="item in cliente.timeline" :key="item.id" class="timeline-item">
          <span class="timeline-dot" />
          <div>
            <strong>{{ item.titulo }}</strong>
            <p>{{ item.descricao }}</p>
            <small>{{ item.data }} · {{ formatarTipoTimelineCliente(item.tipo) }}</small>
          </div>
        </div>
      </div>
      </section>

      <section v-if="abaSelecionada === 'contratos'" class="panel table-panel">
      <div class="panel-heading">
        <div>
          <span>Contratos</span>
          <h2>Contratos vinculados ao cliente</h2>
        </div>
        <button class="primary-action-button" type="button" @click="abrirContrato">
          Novo contrato
        </button>
      </div>
      <div v-if="cliente.contratos.length" class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Contrato</th>
              <th>Plano</th>
              <th>Status</th>
              <th>Valor mensal</th>
              <th>Implantação</th>
              <th>Vigência</th>
              <th>Pagamento</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="contrato in cliente.contratos" :key="contrato.id">
              <td>
                <strong>{{ contrato.codigo }}</strong>
                <small>{{ formatarCicloContratoCliente(contrato.ciclo) }}</small>
              </td>
              <td>{{ contrato.plano }}</td>
              <td>
                <span class="badge" :class="tomStatusContratoCliente(contrato.status)">
                  {{ formatarStatusContratoCliente(contrato.status) }}
                </span>
              </td>
              <td>{{ contrato.valorMensal || 'Pendente' }}</td>
              <td>{{ contrato.valorImplantacao || 'Pendente' }}</td>
              <td>
                <strong>{{ contrato.dataInicio || 'Início pendente' }}</strong>
                <small>{{ contrato.dataTermino || 'sem término definido' }}</small>
              </td>
              <td>
                <strong>{{ contrato.formaPagamento || 'Não definido' }}</strong>
                <small>Vencimento dia {{ contrato.diaVencimento || '-' }}</small>
              </td>
              <td>
                <div class="table-action-group">
                  <button
                    v-if="contrato.status === 'ativo'"
                    class="inline-action"
                    type="button"
                    @click="emitirLicencaContrato(contrato)"
                  >
                    Emitir licença
                  </button>
                  <button
                    class="inline-action secondary"
                    type="button"
                    @click="abrirEdicaoContrato(contrato)"
                  >
                  Editar
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-state">
        Nenhum contrato real vinculado ainda.
      </div>
      <div v-if="licencaEmitida" class="created-license customer-created-license">
        <span>Chave emitida para {{ licencaEmitida.licenseInstanceId }}</span>
        <code>{{ licencaEmitida.licenseKey }}</code>
        <button type="button" @click="copiarLicencaEmitida">Copiar</button>
      </div>
      </section>

      <section v-if="abaSelecionada === 'instalacoes'" class="panel table-panel">
      <div class="panel-heading">
        <div>
          <span>Instalações</span>
          <h2>Licenças e ambientes vinculados</h2>
        </div>
        <button class="ghost-button" type="button" @click="refreshLicenses">
          Atualizar
        </button>
      </div>
      <div v-if="pendingLicenses" class="empty-state">
        Carregando licenças do cliente...
      </div>
      <div v-else-if="licencasDoCliente.length" class="installation-card-list">
        <article
          v-for="license in licencasDoCliente"
          :key="license.licenseInstanceId"
          class="installation-card"
        >
          <div>
            <span class="eyebrow">Licença</span>
            <h3>{{ license.installationName }}</h3>
            <p>{{ license.licenseInstanceId }}</p>
          </div>
          <span class="badge" :class="getLicenseHealth(license)">
            {{ formatarStatusLicenca(license.status) }}
          </span>
          <div class="installation-card-grid">
            <div>
              <strong>Contrato</strong>
              <p>{{ codigoContratoPorId(license.contractId) }}</p>
            </div>
            <div>
              <strong>Fingerprint</strong>
              <p>{{ mascararFingerprint(license.installationFingerprint) }}</p>
            </div>
            <div>
              <strong>Último check-in</strong>
              <p>{{ formatarDataHoraLicenca(license.lastCheckInAt) }}</p>
            </div>
            <div>
              <strong>Expira em</strong>
              <p>{{ formatarDataLicenca(license.expiresAt) }}</p>
            </div>
          </div>
        </article>
      </div>
      <div v-else class="empty-state">
        Nenhuma licença ou instalação vinculada a este cliente ainda.
      </div>
      </section>
    </template>

    <section v-else class="panel table-panel">
      <div class="empty-state">Cliente não encontrado.</div>
    </section>

    <CustomerContactDrawer
      v-model:form="contatoForm"
      v-model:open="contatoDrawerAberto"
      @submit="salvarContato"
    />

    <CustomerTimelineActionDrawer
      v-model:form="acaoForm"
      v-model:open="acaoDrawerAberto"
      @submit="salvarAcao"
    />

    <CustomerContractDrawer
      v-model:form="contratoForm"
      v-model:open="contratoDrawerAberto"
      :editing="Boolean(contratoEmEdicao)"
      :current-status="contratoEmEdicao?.status"
      @submit="salvarContrato"
    />
  </ClientOnly>
</template>

<script setup lang="ts">
import CustomerContactDrawer from '~/components/customers/CustomerContactDrawer.vue';
import CustomerContractDrawer from '~/components/customers/CustomerContractDrawer.vue';
import CustomerTimelineActionDrawer from '~/components/customers/CustomerTimelineActionDrawer.vue';
import type { ContatoCliente, ContratoCliente, TimelineCliente } from '~/types/customers';
import type { ActivateLicenseResponse, LicenseListItem } from '~/types/licensing';

type AbaCliente = 'visao-geral' | 'contatos' | 'timeline' | 'contratos' | 'instalacoes';

definePageMeta({
  title: 'Detalhes do cliente',
  eyebrow: 'Clientes',
});

const route = useRoute();
const {
  adicionarContatoApi,
  adicionarContratoApi,
  adicionarTimelineApi,
  atualizarContratoApi,
  buscarClientePorId,
  carregarClientes,
  erroClientes,
  emitirLicencaContratoApi,
  novoContato,
} = useCustomersMock();
const { getLicenseHealth, listLicenses } = useLicenses();

const cliente = computed(() => buscarClientePorId(String(route.params.customerId)));
const abaSelecionada = ref<AbaCliente>('visao-geral');
const contatoDrawerAberto = ref(false);
const acaoDrawerAberto = ref(false);
const contratoDrawerAberto = ref(false);
const contratoEmEdicao = ref<ContratoCliente | null>(null);
const licencaEmitida = ref<ActivateLicenseResponse | null>(null);
const {
  data: licensesData,
  pending: pendingLicenses,
  refresh: refreshLicenses,
} = await listLicenses();

const abas: Array<{ valor: AbaCliente; label: string }> = [
  { valor: 'visao-geral', label: 'Visão geral' },
  { valor: 'contatos', label: 'Contatos' },
  { valor: 'timeline', label: 'Timeline' },
  { valor: 'contratos', label: 'Contratos' },
  { valor: 'instalacoes', label: 'Instalações' },
];

const metricasCliente = computed(() => {
  if (!cliente.value) return [];

  return [
    {
      label: 'Valor previsto',
      valor: cliente.value.valorPrevisto || 'Pendente',
      delta: 'comercial',
      tom: 'warning',
    },
    {
      label: 'Contatos',
      valor: String(cliente.value.contatos.length),
      delta: 'cadastro',
      tom: 'neutral',
    },
    {
      label: 'Ações',
      valor: String(cliente.value.timeline.length),
      delta: 'timeline',
      tom: 'positive',
    },
    {
      label: 'Ambiente',
      valor: formatarAmbientePrevisto(cliente.value.ambientePrevisto),
      delta: 'operação',
      tom: 'neutral',
    },
  ];
});
const licencasDoCliente = computed(() => {
  if (!cliente.value) return [];

  return (licensesData.value?.licenses ?? []).filter(
    (license) => license.customerId === cliente.value?.id,
  );
});

const contatoForm = ref<ContatoCliente>(novoContato());
const acaoForm = ref<TimelineCliente>(novaAcao());
const contratoForm = ref<ContratoCliente>(novoContrato());

function novaAcao(): TimelineCliente {
  return {
    id: `timeline_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    tipo: 'call',
    titulo: '',
    descricao: '',
    data: '',
  };
}

function novoContrato(): ContratoCliente {
  return {
    id: `contrato_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    codigo: '',
    plano: '',
    planId: '',
    status: 'rascunho',
    ciclo: 'mensal',
    valorMensal: '',
    valorImplantacao: '',
    dataInicio: '',
    dataTermino: '',
    diaVencimento: '',
    formaPagamento: '',
    responsavelAssinatura: '',
    observacoes: '',
  };
}

function abrirContato(): void {
  contatoForm.value = novoContato('substituto');
  contatoDrawerAberto.value = true;
}

function abrirAcao(): void {
  acaoForm.value = novaAcao();
  acaoDrawerAberto.value = true;
}

function abrirContrato(): void {
  contratoEmEdicao.value = null;
  contratoForm.value = novoContrato();
  contratoDrawerAberto.value = true;
}

function abrirEdicaoContrato(contrato: ContratoCliente): void {
  contratoEmEdicao.value = contrato;
  contratoForm.value = { ...contrato };
  contratoDrawerAberto.value = true;
}

onMounted(() => {
  void carregarClientes();
});

async function salvarContato(): Promise<void> {
  if (!cliente.value) return;

  try {
    const contato = await adicionarContatoApi(cliente.value.id, contatoForm.value);
    cliente.value.contatos.push(contato);
  } catch {
    erroClientes.value = 'Não foi possível salvar o contato.';
    return;
  }

  contatoDrawerAberto.value = false;
}

async function salvarAcao(): Promise<void> {
  if (!cliente.value) return;

  try {
    const acao = await adicionarTimelineApi(cliente.value.id, acaoForm.value);
    cliente.value.timeline = [acao, ...cliente.value.timeline];
  } catch {
    erroClientes.value = 'Não foi possível salvar a ação.';
    return;
  }

  acaoDrawerAberto.value = false;
}

async function salvarContrato(): Promise<void> {
  if (!cliente.value) return;

  try {
    if (contratoEmEdicao.value) {
      const contrato = await atualizarContratoApi(cliente.value.id, contratoForm.value);
      cliente.value.contratos = cliente.value.contratos.map((item) =>
        item.id === contrato.id ? contrato : item,
      );
    } else {
      const contrato = await adicionarContratoApi(cliente.value.id, contratoForm.value);
      cliente.value.contratos = [contrato, ...cliente.value.contratos];
    }
  } catch {
    erroClientes.value = 'Não foi possível salvar o contrato.';
    return;
  }

  contratoEmEdicao.value = null;
  contratoDrawerAberto.value = false;
}

async function emitirLicencaContrato(contrato: ContratoCliente): Promise<void> {
  if (!cliente.value || contrato.status !== 'ativo') return;

  licencaEmitida.value = await emitirLicencaContratoApi(cliente.value.id, contrato.id);
  await refreshLicenses();
}

async function copiarLicencaEmitida(): Promise<void> {
  if (!licencaEmitida.value?.licenseKey) return;
  await navigator.clipboard.writeText(licencaEmitida.value.licenseKey);
}

function codigoContratoPorId(contractId: string): string {
  return cliente.value?.contratos.find((contrato) => contrato.id === contractId)?.codigo ?? contractId;
}

function mascararFingerprint(fingerprint: string): string {
  if (fingerprint.length <= 16) return fingerprint;
  return `${fingerprint.slice(0, 10)}...${fingerprint.slice(-6)}`;
}

function formatarStatusLicenca(status: LicenseListItem['status']): string {
  const labels: Record<string, string> = {
    active: 'Ativa',
    expired: 'Expirada',
    revoked: 'Revogada',
    suspended: 'Suspensa',
  };

  return labels[status] ?? status;
}

function formatarDataLicenca(value?: string): string {
  if (!value) return 'Não informado';
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value));
}

function formatarDataHoraLicenca(value?: string): string {
  if (!value) return 'Aguardando check-in';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}
</script>
