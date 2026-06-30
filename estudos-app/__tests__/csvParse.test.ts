import { parseRow, discriminateTipo } from '../src/logic/csvParse';

describe('discriminateTipo', () => {
  it('maps meta/teoria/pratica to item tipos', () => {
    expect(discriminateTipo('meta')).toBe('META');
    expect(discriminateTipo('TEORIA')).toBe('TEORIA');
    expect(discriminateTipo('Pratica')).toBe('PRATICA');
  });

  it('maps curso to curso', () => {
    expect(discriminateTipo('curso')).toBe('curso');
  });

  it('returns null for unknown tipos', () => {
    expect(discriminateTipo('unknown')).toBeNull();
  });
});

describe('parseRow', () => {
  const base = {
    topico: 'Guitarra',
    tipo: 'meta',
    titulo: 'Aprender acorde',
    descricao: '',
    onde: '',
    periodo: 'Semana 1',
    data_prevista: '2026-07-01',
    status: 'PENDENTE',
    peso: '3',
    pagamento: '',
    valor: '',
    moeda: 'BRL',
    progresso: '0',
    link: '',
  };

  it('parses an item row correctly', () => {
    const result = parseRow(base);
    expect(result).toMatchObject({
      tipo: 'META',
      titulo: 'Aprender acorde',
      topico: 'Guitarra',
      periodo: 'Semana 1',
      data_prevista: '2026-07-01',
      status: 'PENDENTE',
      peso: 3,
    });
  });

  it('returns null for unknown tipo', () => {
    expect(parseRow({ ...base, tipo: 'xxx' })).toBeNull();
  });

  it('defaults peso to 1 when blank', () => {
    const result = parseRow({ ...base, peso: '' });
    expect(result?.peso).toBe(1);
  });

  it('parses a curso row with valor containing comma', () => {
    const row = { ...base, tipo: 'curso', onde: 'Udemy', valor: '1.200,50', moeda: 'BRL' };
    const result = parseRow(row);
    expect(result).toMatchObject({ tipo: 'curso', valor: 1200.5, moeda: 'BRL' });
  });

  it('nullifies invalid date', () => {
    const result = parseRow({ ...base, data_prevista: 'not-a-date' });
    expect(result?.data_prevista).toBeUndefined();
  });

  it('defaults status to PENDENTE when blank for items', () => {
    const result = parseRow({ ...base, status: '' });
    expect(result?.status).toBe('PENDENTE');
  });

  it('parses descricao for items and courses', () => {
    expect(parseRow({ ...base, descricao: 'Praticar Em, Am, C' })?.descricao).toBe('Praticar Em, Am, C');
    expect(parseRow({ ...base, tipo: 'curso', descricao: 'Curso completo' })?.descricao).toBe('Curso completo');
  });

  it('leaves descricao undefined when blank', () => {
    expect(parseRow(base)?.descricao).toBeUndefined();
  });

  it('caps descricao at 1000 chars', () => {
    const result = parseRow({ ...base, descricao: 'x'.repeat(1500) });
    expect(result?.descricao?.length).toBe(1000);
  });
});
