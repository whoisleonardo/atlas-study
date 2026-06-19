import { getDb } from './db';
import { weightedProgress } from '../logic/progresso';
import type { Topico, Item, TopicoResumo } from '../types';

export async function getAllTopicos(): Promise<TopicoResumo[]> {
  const db = getDb();
  const topicos = await db.getAllAsync<Topico>('SELECT * FROM topicos ORDER BY nome');
  const results: TopicoResumo[] = [];
  for (const t of topicos) {
    const itens = await db.getAllAsync<Item>('SELECT * FROM itens WHERE topico_id = ?', [t.id]);
    const concluidos = itens.filter((i) => i.status === 'CONCLUIDO').length;
    results.push({
      ...t,
      progresso: weightedProgress(itens),
      totalItens: itens.length,
      concluidos,
    });
  }
  return results;
}

export async function getTopico(id: number): Promise<Topico | null> {
  const db = getDb();
  return db.getFirstAsync<Topico>('SELECT * FROM topicos WHERE id = ?', [id]);
}

export async function upsertTopico(t: Topico): Promise<void> {
  const db = getDb();
  await db.runAsync(
    `INSERT INTO topicos (id, nome, descricao, cor, synced_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       nome = excluded.nome,
       descricao = excluded.descricao,
       cor = excluded.cor,
       synced_at = excluded.synced_at`,
    [t.id, t.nome, t.descricao ?? null, t.cor, t.synced_at ?? null]
  );
}

export async function insertTopico(nome: string, descricao: string | undefined, cor: string): Promise<number> {
  const db = getDb();
  const result = await db.runAsync(
    'INSERT INTO topicos (nome, descricao, cor) VALUES (?, ?, ?)',
    [nome, descricao ?? null, cor]
  );
  return result.lastInsertRowId;
}

export async function updateTopicoCor(id: number, cor: string): Promise<void> {
  const db = getDb();
  await db.runAsync('UPDATE topicos SET cor = ? WHERE id = ?', [cor, id]);
}

export async function deleteTopico(id: number): Promise<void> {
  const db = getDb();
  await db.runAsync('DELETE FROM topicos WHERE id = ?', [id]);
}
