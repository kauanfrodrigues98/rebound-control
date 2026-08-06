import type {
  CardEtapaCliente,
  Cliente,
  ContatoCliente,
  ContratoCliente,
  FiltroAmbientePrevisto,
  FiltroEtapaCliente,
  MetricaCliente,
  PapelContatoCliente,
  TimelineCliente,
} from '~/types/customers';
import type { ActivateLicenseResponse } from '~/types/licensing';

export const useCustomersMock = () => {
  const novoContato = (papel: PapelContatoCliente = 'principal'): ContatoCliente => ({
    id: `contato_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    nome: '',
    email: '',
    telefone: '',
    cargo: '',
    papel,
    preferencia: 'email',
  });

  const clientes = useState<Cliente[]>('customers:mock', () => [
    {
      id: 'cliente_acme',
      nome: 'ACME Pagamentos',
      tipo: 'cliente',
      etapa: 'implantacao',
      razaoSocial: 'ACME Pagamentos S.A.',
      documento: '',
      segmento: 'Fintech',
      site: 'https://acme.example',
      contatos: [
        {
          id: 'contato_acme_1',
          nome: 'Marina Lopes',
          email: 'marina@acme.example',
          telefone: '',
          cargo: 'Head de Engenharia',
          papel: 'principal',
          preferencia: 'email',
        },
        {
          id: 'contato_acme_2',
          nome: 'Time SRE ACME',
          email: 'sre@acme.example',
          telefone: '',
          cargo: 'Operação',
          papel: 'tecnico',
          preferencia: 'call',
        },
      ],
      responsavelComercial: 'Kauan Rodrigues',
      prioridade: 'alta',
      valorPrevisto: 'R$ 2.900/mês',
      ambientePrevisto: 'self-hosted',
      responsavelTecnico: 'Time SRE ACME',
      observacoes:
        'Cliente quer usar Postgres e Redis gerenciados. Precisa de checklist para ingress e secrets.',
      timeline: [
        {
          id: 'timeline_acme_1',
          tipo: 'implantacao',
          titulo: 'Validar ambiente Kubernetes',
          descricao: 'Confirmar ingress, secrets e acesso do control-api público.',
          data: 'Hoje',
        },
        {
          id: 'timeline_acme_2',
          tipo: 'contrato',
          titulo: 'Contrato assinado',
          descricao: 'Aguardando fechamento dos dados técnicos para instalação.',
          data: 'Ontem',
        },
      ],
      contratos: [
        {
          id: 'contrato_acme_1',
          codigo: 'CTR-ACME-2026-001',
          plano: 'Enterprise Self-hosted',
          planId: '',
          status: 'ativo',
          ciclo: 'anual',
          valorMensal: 'R$ 2.900,00',
          valorImplantacao: 'R$ 8.000,00',
          dataInicio: '2026-08-01',
          dataTermino: '2027-07-31',
          diaVencimento: '10',
          formaPagamento: 'Boleto',
          responsavelAssinatura: 'Marina Lopes',
          observacoes: 'Contrato usado como referência para instalação self-hosted.',
        },
      ],
    },
    {
      id: 'cliente_zenit',
      nome: 'Zenit Retail',
      tipo: 'prospect',
      etapa: 'negociacao',
      razaoSocial: '',
      documento: '',
      segmento: 'Varejo',
      site: '',
      contatos: [
        {
          id: 'contato_zenit_1',
          nome: 'Rafael Nunes',
          email: 'rafael@zenit.example',
          telefone: '',
          cargo: 'CTO',
          papel: 'principal',
          preferencia: 'email',
        },
      ],
      responsavelComercial: 'Kauan Rodrigues',
      prioridade: 'media',
      valorPrevisto: 'R$ 1.400/mês',
      ambientePrevisto: 'cloud',
      responsavelTecnico: '',
      observacoes: 'Quer começar cloud e avaliar self-hosted depois do piloto.',
      timeline: [
        {
          id: 'timeline_zenit_1',
          tipo: 'proposta',
          titulo: 'Enviar proposta revisada',
          descricao: 'Ajustar escopo para piloto cloud de 60 dias.',
          data: 'Amanhã',
        },
      ],
      contratos: [],
    },
    {
      id: 'cliente_nova',
      nome: 'Nova Health',
      tipo: 'lead',
      etapa: 'prospeccao',
      razaoSocial: '',
      documento: '',
      segmento: 'Healthtech',
      site: '',
      contatos: [novoContato()],
      responsavelComercial: '',
      prioridade: 'baixa',
      valorPrevisto: '',
      ambientePrevisto: 'indefinido',
      responsavelTecnico: '',
      observacoes: 'Entrada por indicação. Ainda sem dados comerciais completos.',
      timeline: [
        {
          id: 'timeline_nova_1',
          tipo: 'ligacao',
          titulo: 'Mapear decisor técnico',
          descricao: 'Identificar quem decide arquitetura e compra.',
          data: 'Sem data',
        },
      ],
      contratos: [],
    },
    {
      id: 'cliente_orion',
      nome: 'Orion Logistics',
      tipo: 'cliente',
      etapa: 'operacao',
      razaoSocial: 'Orion Logistics Ltda.',
      documento: '',
      segmento: 'Logística',
      site: '',
      contatos: [
        {
          id: 'contato_orion_1',
          nome: 'Bianca Freitas',
          email: 'bianca@orion.example',
          telefone: '',
          cargo: 'Platform Manager',
          papel: 'principal',
          preferencia: 'email',
        },
      ],
      responsavelComercial: 'Kauan Rodrigues',
      prioridade: 'media',
      valorPrevisto: 'R$ 3.800/mês',
      ambientePrevisto: 'hibrido',
      responsavelTecnico: 'Bianca Freitas',
      observacoes: 'Conta boa para testar modelo híbrido e futuro módulo de contratos.',
      timeline: [
        {
          id: 'timeline_orion_1',
          tipo: 'call',
          titulo: 'Revisar limites do contrato',
          descricao: 'Avaliar consumo e possíveis limites enterprise.',
          data: '12 Ago',
        },
      ],
      contratos: [
        {
          id: 'contrato_orion_1',
          codigo: 'CTR-ORION-2026-001',
          plano: 'Enterprise Híbrido',
          planId: '',
          status: 'em_assinatura',
          ciclo: 'anual',
          valorMensal: 'R$ 3.800,00',
          valorImplantacao: 'R$ 12.000,00',
          dataInicio: '2026-08-15',
          dataTermino: '2027-08-14',
          diaVencimento: '15',
          formaPagamento: 'Transferência',
          responsavelAssinatura: 'Bianca Freitas',
          observacoes: 'Aguardando assinatura da versão revisada.',
        },
      ],
    },
  ]);

  const filtroEtapa = useState<FiltroEtapaCliente>('customers:stage-filter', () => 'todas');
  const filtroAmbiente = useState<FiltroAmbientePrevisto>(
    'customers:deployment-filter',
    () => 'todos',
  );
  const carregandoClientes = useState('customers:loading', () => false);
  const clientesPersistidos = useState('customers:persisted', () => false);
  const erroClientes = useState<string | null>('customers:error', () => null);

  const clienteVazio = (): Cliente => ({
    id: '',
    nome: '',
    tipo: 'prospect',
    etapa: 'prospeccao',
    razaoSocial: '',
    documento: '',
    segmento: '',
    site: '',
    contatos: [novoContato()],
    responsavelComercial: '',
    prioridade: 'media',
    valorPrevisto: '',
    ambientePrevisto: 'indefinido',
    responsavelTecnico: '',
    observacoes: '',
    timeline: [],
    contratos: [],
  });

  const clientesFiltrados = computed(() =>
    clientes.value.filter((cliente) => {
      const bateEtapa = filtroEtapa.value === 'todas' || cliente.etapa === filtroEtapa.value;
      const bateAmbiente =
        filtroAmbiente.value === 'todos' || cliente.ambientePrevisto === filtroAmbiente.value;

      return bateEtapa && bateAmbiente;
    }),
  );

  const clienteEmFoco = computed(
    () =>
      clientes.value.find((cliente) => cliente.prioridade === 'alta') ??
      clientes.value[0] ??
      null,
  );

  const buscarClientePorId = (id: string): Cliente | undefined =>
    clientes.value.find((cliente) => cliente.id === id);

  const metricas = computed<MetricaCliente[]>(() => [
    {
      label: 'Clientes',
      valor: String(clientes.value.length),
      delta: 'total',
      tom: 'neutral',
    },
    {
      label: 'Em negociação',
      valor: String(clientes.value.filter((cliente) => cliente.etapa === 'negociacao').length),
      delta: 'pipeline',
      tom: 'warning',
    },
    {
      label: 'Self-hosted',
      valor: String(
        clientes.value.filter((cliente) => cliente.ambientePrevisto === 'self-hosted').length,
      ),
      delta: 'ambiente',
      tom: 'positive',
    },
    {
      label: 'Sem contato',
      valor: String(clientes.value.filter((cliente) => !contatoPrincipal(cliente)?.email).length),
      delta: 'cadastro',
      tom: 'danger',
    },
  ]);

  const cardsEtapas = computed<CardEtapaCliente[]>(() => {
    const etapas: Array<Omit<CardEtapaCliente, 'total'>> = [
      { valor: 'prospeccao', label: 'Prospecção', descricao: 'primeiro contato' },
      { valor: 'negociacao', label: 'Negociação', descricao: 'proposta e decisão' },
      { valor: 'contratacao', label: 'Contratação', descricao: 'jurídico e assinatura' },
      { valor: 'implantacao', label: 'Implantação', descricao: 'setup e treinamento' },
      { valor: 'operacao', label: 'Operação', descricao: 'cliente em produção' },
    ];

    return etapas.map((etapa) => ({
      ...etapa,
      total: clientes.value.filter((cliente) => cliente.etapa === etapa.valor).length,
    }));
  });

  function limparFiltros(): void {
    filtroEtapa.value = 'todas';
    filtroAmbiente.value = 'todos';
  }

  async function carregarClientes(): Promise<void> {
    carregandoClientes.value = true;
    erroClientes.value = null;

    try {
      const response = await $fetch<CustomerApiResponse[]>('/api/customers');
      clientes.value = response.map(apiToCliente);
      clientesPersistidos.value = true;
    } catch {
      erroClientes.value =
        'Não foi possível carregar clientes reais. Exibindo dados mockados.';
      clientesPersistidos.value = false;
    } finally {
      carregandoClientes.value = false;
    }
  }

  async function salvarClienteApi(cliente: Cliente): Promise<Cliente> {
    const response = cliente.id
      ? await $fetch<CustomerApiResponse>(`/api/customers/${cliente.id}`, {
          method: 'PUT',
          body: clienteToApi(cliente),
        })
      : await $fetch<CustomerApiResponse>('/api/customers', {
          method: 'POST',
          body: clienteToApi(cliente),
        });

    const salvo = apiToCliente(response);
    clientes.value = cliente.id
      ? clientes.value.map((item) => (item.id === cliente.id ? salvo : item))
      : [salvo, ...clientes.value];
    clientesPersistidos.value = true;
    return salvo;
  }

  async function adicionarContatoApi(clienteId: string, contato: ContatoCliente): Promise<ContatoCliente> {
    const response = await $fetch<CustomerContactApiResponse>(
      `/api/customers/${clienteId}/contacts`,
      {
        method: 'POST',
        body: contatoToApi(contato),
      },
    );

    return apiToContato(response);
  }

  async function adicionarTimelineApi(
    clienteId: string,
    timeline: TimelineCliente,
  ): Promise<TimelineCliente> {
    const response = await $fetch<CustomerTimelineApiResponse>(
      `/api/customers/${clienteId}/timeline`,
      {
        method: 'POST',
        body: timelineToApi(timeline),
      },
    );

    return apiToTimeline(response);
  }

  async function adicionarContratoApi(
    clienteId: string,
    contrato: ContratoCliente,
  ): Promise<ContratoCliente> {
    const response = await $fetch<CustomerContractApiResponse>(
      `/api/customers/${clienteId}/contracts`,
      {
        method: 'POST',
        body: contratoToApi(contrato),
      },
    );

    return apiToContrato(response);
  }

  async function atualizarContratoApi(
    clienteId: string,
    contrato: ContratoCliente,
  ): Promise<ContratoCliente> {
    const response = await $fetch<CustomerContractApiResponse>(
      `/api/customers/${clienteId}/contracts/${contrato.id}`,
      {
        method: 'PUT',
        body: contratoToApi(contrato),
      },
    );

    return apiToContrato(response);
  }

  async function emitirLicencaContratoApi(
    clienteId: string,
    contratoId: string,
  ): Promise<ActivateLicenseResponse> {
    return $fetch<ActivateLicenseResponse>(
      `/api/customers/${clienteId}/contracts/${contratoId}/license`,
      {
        method: 'POST',
      },
    );
  }

  return {
    adicionarContatoApi,
    adicionarContratoApi,
    adicionarTimelineApi,
    atualizarContratoApi,
    emitirLicencaContratoApi,
    cardsEtapas,
    buscarClientePorId,
    clienteEmFoco,
    clienteVazio,
    clientes,
    clientesFiltrados,
    clientesPersistidos,
    carregandoClientes,
    carregarClientes,
    erroClientes,
    filtroAmbiente,
    filtroEtapa,
    limparFiltros,
    metricas,
    novoContato,
    salvarClienteApi,
  };
};

type CustomerContactApiResponse = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  roleTitle: string | null;
  role: ContatoCliente['papel'];
  preference: ContatoCliente['preferencia'];
};

type CustomerTimelineApiResponse = {
  id: string;
  type: TimelineCliente['tipo'];
  title: string;
  description: string | null;
  scheduledFor: string | null;
};

type CustomerContractApiResponse = {
  id: string;
  code: string;
  plan: string;
  planId: string | null;
  status: ContratoCliente['status'];
  cycle: ContratoCliente['ciclo'];
  monthlyValue: string | null;
  setupValue: string | null;
  startsOn: string | null;
  endsOn: string | null;
  dueDay: string | null;
  paymentMethod: string | null;
  signingContact: string | null;
  notes: string | null;
};

type CustomerApiResponse = {
  id: string;
  name: string;
  type: Cliente['tipo'];
  stage: Cliente['etapa'];
  legalName: string | null;
  document: string | null;
  segment: string | null;
  website: string | null;
  commercialOwner: string | null;
  priority: Cliente['prioridade'];
  expectedValue: string | null;
  expectedEnvironment: Cliente['ambientePrevisto'];
  technicalOwner: string | null;
  notes: string | null;
  contacts: CustomerContactApiResponse[];
  timeline: CustomerTimelineApiResponse[];
  contracts: CustomerContractApiResponse[];
};

function apiToCliente(customer: CustomerApiResponse): Cliente {
  return {
    id: customer.id,
    nome: customer.name,
    tipo: customer.type,
    etapa: customer.stage,
    razaoSocial: customer.legalName ?? '',
    documento: customer.document ?? '',
    segmento: customer.segment ?? '',
    site: customer.website ?? '',
    contatos: customer.contacts.map(apiToContato),
    responsavelComercial: customer.commercialOwner ?? '',
    prioridade: customer.priority,
    valorPrevisto: customer.expectedValue ?? '',
    ambientePrevisto: customer.expectedEnvironment,
    responsavelTecnico: customer.technicalOwner ?? '',
    observacoes: customer.notes ?? '',
    timeline: customer.timeline.map(apiToTimeline),
    contratos: customer.contracts.map(apiToContrato),
  };
}

function apiToContato(contact: CustomerContactApiResponse): ContatoCliente {
  return {
    id: contact.id,
    nome: contact.name ?? '',
    email: contact.email ?? '',
    telefone: contact.phone ?? '',
    cargo: contact.roleTitle ?? '',
    papel: contact.role,
    preferencia: contact.preference,
  };
}

function apiToTimeline(entry: CustomerTimelineApiResponse): TimelineCliente {
  return {
    id: entry.id,
    tipo: entry.type,
    titulo: entry.title,
    descricao: entry.description ?? '',
    data: entry.scheduledFor ?? '',
  };
}

function apiToContrato(contract: CustomerContractApiResponse): ContratoCliente {
  return {
    id: contract.id,
    codigo: contract.code,
    plano: contract.plan,
    planId: contract.planId ?? '',
    status: contract.status,
    ciclo: contract.cycle,
    valorMensal: contract.monthlyValue ?? '',
    valorImplantacao: contract.setupValue ?? '',
    dataInicio: contract.startsOn ?? '',
    dataTermino: contract.endsOn ?? '',
    diaVencimento: contract.dueDay ?? '',
    formaPagamento: contract.paymentMethod ?? '',
    responsavelAssinatura: contract.signingContact ?? '',
    observacoes: contract.notes ?? '',
  };
}

function clienteToApi(cliente: Cliente) {
  return {
    name: cliente.nome,
    type: cliente.tipo,
    stage: cliente.etapa,
    legalName: cliente.razaoSocial,
    document: cliente.documento,
    segment: cliente.segmento,
    website: cliente.site,
    commercialOwner: cliente.responsavelComercial,
    priority: cliente.prioridade,
    expectedValue: cliente.valorPrevisto,
    expectedEnvironment: cliente.ambientePrevisto,
    technicalOwner: cliente.responsavelTecnico,
    notes: cliente.observacoes,
    contacts: cliente.contatos.map(contatoToApi),
  };
}

function contatoToApi(contato: ContatoCliente) {
  return {
    name: contato.nome,
    email: contato.email,
    phone: contato.telefone,
    roleTitle: contato.cargo,
    role: contato.papel,
    preference: contato.preferencia,
  };
}

function timelineToApi(timeline: TimelineCliente) {
  return {
    type: timeline.tipo,
    title: timeline.titulo,
    description: timeline.descricao,
    scheduledFor: timeline.data,
  };
}

function contratoToApi(contrato: ContratoCliente) {
  return {
    plan: contrato.plano,
    planId: contrato.planId,
    status: contrato.status,
    cycle: contrato.ciclo,
    monthlyValue: contrato.valorMensal,
    setupValue: contrato.valorImplantacao,
    startsOn: contrato.dataInicio,
    endsOn: contrato.dataTermino,
    dueDay: contrato.diaVencimento,
    paymentMethod: contrato.formaPagamento,
    signingContact: contrato.responsavelAssinatura,
    notes: contrato.observacoes,
  };
}
