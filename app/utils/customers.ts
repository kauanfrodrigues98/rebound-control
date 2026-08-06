import type {
  AmbientePrevisto,
  Cliente,
  ContatoCliente,
  EtapaCliente,
  PapelContatoCliente,
  PrioridadeCliente,
  CicloContratoCliente,
  StatusContratoCliente,
  TipoCliente,
  TipoTimelineCliente,
} from '~/types/customers';

export function contatoPrincipal(cliente?: Cliente | null): ContatoCliente | undefined {
  return cliente?.contatos.find((contato) => contato.papel === 'principal') ?? cliente?.contatos[0];
}

export function clonarCliente(cliente: Cliente): Cliente {
  return {
    ...cliente,
    contratos: cliente.contratos.map((contrato) => ({ ...contrato })),
    contatos: cliente.contatos.map((contato) => ({ ...contato })),
    timeline: cliente.timeline.map((item) => ({ ...item })),
  };
}

export function slugCliente(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

export function formatarEtapaCliente(etapa: EtapaCliente): string {
  const labels: Record<EtapaCliente, string> = {
    prospeccao: 'prospecção',
    negociacao: 'negociação',
    contratacao: 'contratação',
    implantacao: 'implantação',
    operacao: 'operação',
    pausado: 'pausado',
    perdido: 'perdido',
  };

  return labels[etapa];
}

export function tomEtapaCliente(etapa: EtapaCliente): string {
  const tons: Record<EtapaCliente, string> = {
    prospeccao: 'neutral',
    negociacao: 'warning',
    contratacao: 'warning',
    implantacao: 'positive',
    operacao: 'active',
    pausado: 'neutral',
    perdido: 'danger',
  };

  return tons[etapa];
}

export function formatarAmbientePrevisto(ambiente: AmbientePrevisto): string {
  const labels: Record<AmbientePrevisto, string> = {
    cloud: 'Cloud',
    'self-hosted': 'Self-hosted',
    hibrido: 'Híbrido',
    indefinido: 'Indefinido',
  };

  return labels[ambiente];
}

export function formatarTipoCliente(tipo: TipoCliente): string {
  const labels: Record<TipoCliente, string> = {
    lead: 'Lead',
    prospect: 'Prospect',
    cliente: 'Cliente',
    parceiro: 'Parceiro',
  };

  return labels[tipo];
}

export function formatarPrioridadeCliente(prioridade: PrioridadeCliente): string {
  const labels: Record<PrioridadeCliente, string> = {
    baixa: 'baixa',
    media: 'média',
    alta: 'alta',
  };

  return labels[prioridade];
}

export function tomPrioridadeCliente(prioridade: PrioridadeCliente): string {
  const tons: Record<PrioridadeCliente, string> = {
    baixa: 'neutral',
    media: 'warning',
    alta: 'danger',
  };

  return tons[prioridade];
}

export function formatarPapelContatoCliente(papel: PapelContatoCliente): string {
  const labels: Record<PapelContatoCliente, string> = {
    principal: 'Principal',
    substituto: 'Substituto',
    tecnico: 'Técnico',
    financeiro: 'Financeiro',
    juridico: 'Jurídico',
    outro: 'Outro',
  };

  return labels[papel];
}

export function formatarTipoTimelineCliente(tipo: TipoTimelineCliente): string {
  const labels: Record<TipoTimelineCliente, string> = {
    ligacao: 'ligação',
    call: 'call',
    proposta: 'proposta',
    contrato: 'contrato',
    implantacao: 'implantação',
    observacao: 'observação',
  };

  return labels[tipo];
}

export function formatarStatusContratoCliente(status: StatusContratoCliente): string {
  const labels: Record<StatusContratoCliente, string> = {
    rascunho: 'Rascunho',
    em_assinatura: 'Em assinatura',
    ativo: 'Ativo',
    encerrado: 'Encerrado',
    cancelado: 'Cancelado',
  };

  return labels[status];
}

export function tomStatusContratoCliente(status: StatusContratoCliente): string {
  const tons: Record<StatusContratoCliente, string> = {
    rascunho: 'neutral',
    em_assinatura: 'warning',
    ativo: 'active',
    encerrado: 'neutral',
    cancelado: 'danger',
  };

  return tons[status];
}

export function formatarCicloContratoCliente(ciclo: CicloContratoCliente): string {
  const labels: Record<CicloContratoCliente, string> = {
    mensal: 'Mensal',
    trimestral: 'Trimestral',
    semestral: 'Semestral',
    anual: 'Anual',
    customizado: 'Customizado',
  };

  return labels[ciclo];
}
