import { getDb } from './db';
import type { Curso } from '../types';

export async function getAllCursos(): Promise<Curso[]> {
  const db = getDb();
  return db.getAllAsync<Curso>('SELECT * FROM cursos ORDER BY status, nome');
}

export async function getCursosByTopico(topicoId: number): Promise<Curso[]> {
  const db = getDb();
  return db.getAllAsync<Curso>('SELECT * FROM cursos WHERE topico_id = ? ORDER BY id', [topicoId]);
}

export async function upsertCurso(curso: Curso): Promise<void> {
  const db = getDb();
  await db.runAsync(
    `INSERT INTO cursos
       (id, topico_id, nome, descricao, plataforma, periodo, status, pagamento, valor, moeda, progresso, meses_ativos, link, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       topico_id = excluded.topico_id,
       nome = excluded.nome,
       descricao = excluded.descricao,
       plataforma = excluded.plataforma,
       periodo = excluded.periodo,
       status = excluded.status,
       pagamento = excluded.pagamento,
       valor = excluded.valor,
       moeda = excluded.moeda,
       progresso = excluded.progresso,
       meses_ativos = excluded.meses_ativos,
       link = excluded.link,
       synced_at = excluded.synced_at`,
    [curso.id, curso.topico_id, curso.nome, curso.descricao ?? null,
     curso.plataforma ?? null, curso.periodo ?? null, curso.status,
     curso.pagamento, curso.valor, curso.moeda, curso.progresso,
     curso.meses_ativos, curso.link ?? null, curso.synced_at ?? null]
  );
}

export async function insertCurso(topicoId: number, curso: Omit<Curso, 'id' | 'topico_id' | 'synced_at'>): Promise<number> {
  const db = getDb();
  const result = await db.runAsync(
    `INSERT INTO cursos (topico_id, nome, descricao, plataforma, periodo, status, pagamento, valor, moeda, progresso, meses_ativos, link)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [topicoId, curso.nome, curso.descricao ?? null, curso.plataforma ?? null,
     curso.periodo ?? null, curso.status, curso.pagamento, curso.valor,
     curso.moeda, curso.progresso, curso.meses_ativos, curso.link ?? null]
  );
  return result.lastInsertRowId;
}

export async function updateCurso(id: number, patch: Partial<Omit<Curso, 'id' | 'topico_id'>>): Promise<void> {
  const db = getDb();
  const sets = Object.keys(patch).map((k) => `${k} = ?`).join(', ');
  const vals = [...Object.values(patch), id];
  await db.runAsync(`UPDATE cursos SET ${sets} WHERE id = ?`, vals);
}

export async function deleteCurso(id: number): Promise<void> {
  const db = getDb();
  await db.runAsync('DELETE FROM cursos WHERE id = ?', [id]);
}
