import {
  weightedProgress,
  progressByPeriodo,
  investimentoPorMoeda,
  mensalAtivoPorMoeda,
} from '../src/logic/progresso';
import type { Item, Curso } from '../src/types';

const makeItem = (overrides: Partial<Item>): Item => ({
  id: 1,
  topico_id: 1,
  tipo: 'META',
  titulo: 'T',
  status: 'PENDENTE',
  peso: 1,
  ...overrides,
});

const makeCurso = (overrides: Partial<Curso>): Curso => ({
  id: 1,
  topico_id: 1,
  nome: 'C',
  status: 'PLANEJADO',
  pagamento: 'UNICO',
  valor: 0,
  moeda: 'BRL',
  progresso: 0,
  meses_ativos: 0,
  ...overrides,
});

describe('weightedProgress', () => {
  it('returns 0 when no items', () => {
    expect(weightedProgress([])).toBe(0);
  });

  it('returns 100 when all items are CONCLUIDO', () => {
    const items = [makeItem({ status: 'CONCLUIDO', peso: 2 }), makeItem({ status: 'CONCLUIDO', peso: 3 })];
    expect(weightedProgress(items)).toBe(100);
  });

  it('calculates weighted percentage correctly', () => {
    const items = [
      makeItem({ status: 'CONCLUIDO', peso: 3 }),
      makeItem({ status: 'PENDENTE', peso: 1 }),
    ];
    expect(weightedProgress(items)).toBeCloseTo(75);
  });

  it('treats FAZENDO as not concluido', () => {
    const items = [makeItem({ status: 'FAZENDO', peso: 1 }), makeItem({ status: 'CONCLUIDO', peso: 1 })];
    expect(weightedProgress(items)).toBe(50);
  });
});

describe('progressByPeriodo', () => {
  it('groups items by periodo and calculates progress per group', () => {
    const items = [
      makeItem({ periodo: 'Semana 1', status: 'CONCLUIDO', peso: 1 }),
      makeItem({ periodo: 'Semana 1', status: 'PENDENTE', peso: 1 }),
      makeItem({ periodo: 'Semana 2', status: 'CONCLUIDO', peso: 1 }),
    ];
    const result = progressByPeriodo(items);
    expect(result['Semana 1']).toBeCloseTo(50);
    expect(result['Semana 2']).toBe(100);
  });
});

describe('investimentoPorMoeda', () => {
  it('sums UNICO courses by moeda', () => {
    const cursos = [
      makeCurso({ pagamento: 'UNICO', valor: 100, moeda: 'BRL' }),
      makeCurso({ pagamento: 'UNICO', valor: 50, moeda: 'USD' }),
    ];
    const result = investimentoPorMoeda(cursos);
    expect(result['BRL']).toBe(100);
    expect(result['USD']).toBe(50);
  });

  it('multiplies ASSINATURA by meses_ativos', () => {
    const cursos = [makeCurso({ pagamento: 'ASSINATURA', valor: 30, moeda: 'BRL', meses_ativos: 4 })];
    const result = investimentoPorMoeda(cursos);
    expect(result['BRL']).toBe(120);
  });

  it('never mixes BRL and USD', () => {
    const cursos = [
      makeCurso({ pagamento: 'UNICO', valor: 100, moeda: 'BRL' }),
      makeCurso({ pagamento: 'UNICO', valor: 20, moeda: 'USD' }),
    ];
    const result = investimentoPorMoeda(cursos);
    expect(Object.keys(result)).toHaveLength(2);
    expect(result['BRL']).toBe(100);
    expect(result['USD']).toBe(20);
  });
});

describe('mensalAtivoPorMoeda', () => {
  it('sums only ASSINATURA courses with status FAZENDO', () => {
    const cursos = [
      makeCurso({ pagamento: 'ASSINATURA', valor: 30, moeda: 'BRL', status: 'FAZENDO' }),
      makeCurso({ pagamento: 'ASSINATURA', valor: 10, moeda: 'BRL', status: 'PAUSADO' }),
      makeCurso({ pagamento: 'UNICO', valor: 500, moeda: 'BRL', status: 'FAZENDO' }),
    ];
    const result = mensalAtivoPorMoeda(cursos);
    expect(result['BRL']).toBe(30);
  });

  it('returns empty object when no active subscriptions', () => {
    const cursos = [makeCurso({ pagamento: 'UNICO', valor: 100, moeda: 'BRL' })];
    expect(mensalAtivoPorMoeda(cursos)).toEqual({});
  });
});
