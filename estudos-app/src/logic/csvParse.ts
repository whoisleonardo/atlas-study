import type { ItemTipo, ItemStatus, CursoStatus } from '../types';
import type { CsvPreviewRow } from '../types';

const ITEM_TIPOS: Record<string, ItemTipo> = {
  META: 'META',
  TEORIA: 'TEORIA',
  PRATICA: 'PRATICA',
};

export function discriminateTipo(raw: string): ItemTipo | 'curso' | null {
  const upper = raw.trim().toUpperCase();
  if (ITEM_TIPOS[upper]) return ITEM_TIPOS[upper];
  if (upper === 'CURSO') return 'curso';
  return null;
}

function parseDecimal(raw: string): number {
  const cleaned = raw.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function parseISODate(raw: string): string | undefined {
  if (!raw) return undefined;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? undefined : raw;
}

function enumOr<T extends string>(raw: string, allowed: T[], fallback: T): T {
  const upper = raw.trim().toUpperCase() as T;
  return allowed.includes(upper) ? upper : fallback;
}

const ITEM_STATUSES: ItemStatus[] = ['PENDENTE', 'FAZENDO', 'CONCLUIDO'];
const CURSO_STATUSES: CursoStatus[] = ['PLANEJADO', 'FAZENDO', 'CONCLUIDO', 'PAUSADO'];

export function parseRow(row: Record<string, string>): CsvPreviewRow | null {
  const tipo = discriminateTipo(row.tipo ?? '');
  if (!tipo) return null;

  const topico = (row.topico ?? '').trim();
  const titulo = (row.titulo ?? '').trim();
  const periodo = (row.periodo ?? '').trim() || undefined;
  const data_prevista = parseISODate((row.data_prevista ?? '').trim());
  const peso = parseInt(row.peso ?? '') || 1;

  if (tipo === 'curso') {
    const status = enumOr(row.status ?? '', CURSO_STATUSES, 'PLANEJADO');
    const valor = parseDecimal(row.valor ?? '');
    const moeda = (row.moeda ?? 'BRL').trim().toUpperCase() || 'BRL';
    return { tipo: 'curso', titulo, topico, periodo, data_prevista, status, peso, valor, moeda };
  }

  const status = enumOr(row.status ?? '', ITEM_STATUSES, 'PENDENTE');
  return { tipo, titulo, topico, periodo, data_prevista, status, peso };
}
