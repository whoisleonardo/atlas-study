export type ItemTipo = 'META' | 'TEORIA' | 'PRATICA';
export type ItemStatus = 'PENDENTE' | 'FAZENDO' | 'CONCLUIDO';
export type CursoStatus = 'PLANEJADO' | 'FAZENDO' | 'CONCLUIDO' | 'PAUSADO';
export type Pagamento = 'UNICO' | 'ASSINATURA';
export type Frequencia = 'DIARIO' | 'SEMANAL' | 'CUSTOM';

export interface Topico {
  id: number;
  nome: string;
  descricao?: string;
  cor: string;
  synced_at?: string;
}

export interface Item {
  id: number;
  topico_id: number;
  tipo: ItemTipo;
  titulo: string;
  descricao?: string;
  onde?: string;
  periodo?: string;
  data_prevista?: string;
  status: ItemStatus;
  peso: number;
  synced_at?: string;
}

export interface Curso {
  id: number;
  topico_id: number;
  nome: string;
  descricao?: string;
  plataforma?: string;
  periodo?: string;
  status: CursoStatus;
  pagamento: Pagamento;
  valor: number;
  moeda: string;
  progresso: number;
  meses_ativos: number;
  link?: string;
  synced_at?: string;
}

export interface Lembrete {
  id: number;
  topico_id?: number;
  frequencia: Frequencia;
  dias?: string;
  hora: string;
  ativo: number;
  expo_notification_ids?: string;
}

export interface PendingOp {
  id: number;
  metodo: 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  rota: string;
  payload: string;
  criado_em: string;
}

export interface TopicoResumo extends Topico {
  progresso: number;
  totalItens: number;
  concluidos: number;
}

export interface ProgressoCalc {
  percentualGeral: number;
  totalItens: number;
  concluidos: number;
  porPeriodo: Record<string, number>;
  investidoPorMoeda: Record<string, number>;
  mensalAtivoPorMoeda: Record<string, number>;
}

export interface CsvPreviewRow {
  tipo: ItemTipo | 'curso';
  titulo: string;
  topico: string;
  descricao?: string;
  periodo?: string;
  data_prevista?: string;
  status: ItemStatus | CursoStatus;
  peso: number;
  valor?: number;
  moeda?: string;
}
