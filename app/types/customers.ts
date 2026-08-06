export type EtapaCliente =
  | 'prospeccao'
  | 'negociacao'
  | 'contratacao'
  | 'implantacao'
  | 'operacao'
  | 'pausado'
  | 'perdido';

export type AmbientePrevisto = 'cloud' | 'self-hosted' | 'hibrido' | 'indefinido';
export type FiltroEtapaCliente = EtapaCliente | 'todas';
export type FiltroAmbientePrevisto = AmbientePrevisto | 'todos';
export type TipoCliente = 'lead' | 'prospect' | 'cliente' | 'parceiro';
export type PrioridadeCliente = 'baixa' | 'media' | 'alta';
export type PapelContatoCliente =
  | 'principal'
  | 'substituto'
  | 'tecnico'
  | 'financeiro'
  | 'juridico'
  | 'outro';
export type PreferenciaContatoCliente = 'email' | 'telefone' | 'whatsapp' | 'call';
export type TipoTimelineCliente =
  | 'ligacao'
  | 'call'
  | 'proposta'
  | 'contrato'
  | 'implantacao'
  | 'observacao';
export type StatusContratoCliente =
  | 'rascunho'
  | 'em_assinatura'
  | 'ativo'
  | 'encerrado'
  | 'cancelado';
export type CicloContratoCliente = 'mensal' | 'trimestral' | 'semestral' | 'anual' | 'customizado';

export type ContatoCliente = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
  papel: PapelContatoCliente;
  preferencia: PreferenciaContatoCliente;
};

export type TimelineCliente = {
  id: string;
  tipo: TipoTimelineCliente;
  titulo: string;
  descricao: string;
  data: string;
};

export type ContratoCliente = {
  id: string;
  codigo: string;
  plano: string;
  planId: string;
  status: StatusContratoCliente;
  ciclo: CicloContratoCliente;
  valorMensal: string;
  valorImplantacao: string;
  dataInicio: string;
  dataTermino: string;
  diaVencimento: string;
  formaPagamento: string;
  responsavelAssinatura: string;
  observacoes: string;
};

export type Cliente = {
  id: string;
  nome: string;
  tipo: TipoCliente;
  etapa: EtapaCliente;
  razaoSocial: string;
  documento: string;
  segmento: string;
  site: string;
  contatos: ContatoCliente[];
  responsavelComercial: string;
  prioridade: PrioridadeCliente;
  valorPrevisto: string;
  ambientePrevisto: AmbientePrevisto;
  responsavelTecnico: string;
  observacoes: string;
  timeline: TimelineCliente[];
  contratos: ContratoCliente[];
};

export type CardEtapaCliente = {
  valor: EtapaCliente;
  label: string;
  descricao: string;
  total: number;
};

export type MetricaCliente = {
  label: string;
  valor: string;
  delta: string;
  tom: string;
};
