import type { Item, Curso } from '../types';

export function weightedProgress(items: Item[]): number {
  if (items.length === 0) return 0;
  const totalPeso = items.reduce((sum, i) => sum + i.peso, 0);
  if (totalPeso === 0) return 0;
  const pesoConcluido = items
    .filter((i) => i.status === 'CONCLUIDO')
    .reduce((sum, i) => sum + i.peso, 0);
  return (pesoConcluido / totalPeso) * 100;
}

export function progressByPeriodo(items: Item[]): Record<string, number> {
  const groups: Record<string, Item[]> = {};
  for (const item of items) {
    const key = item.periodo ?? '';
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  const result: Record<string, number> = {};
  for (const [key, group] of Object.entries(groups)) {
    result[key] = weightedProgress(group);
  }
  return result;
}

export function investimentoPorMoeda(cursos: Curso[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const c of cursos) {
    const valor = c.pagamento === 'ASSINATURA' ? c.valor * c.meses_ativos : c.valor;
    result[c.moeda] = (result[c.moeda] ?? 0) + valor;
  }
  return result;
}

export function mensalAtivoPorMoeda(cursos: Curso[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const c of cursos) {
    if (c.pagamento === 'ASSINATURA' && c.status === 'FAZENDO') {
      result[c.moeda] = (result[c.moeda] ?? 0) + c.valor;
    }
  }
  return result;
}
