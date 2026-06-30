import { getDb } from './db';
import type { Item, ItemStatus } from '../types';

export async function getItemsByTopico(topicoId: number): Promise<Item[]> {
  const db = getDb();
  return db.getAllAsync<Item>('SELECT * FROM itens WHERE topico_id = ? ORDER BY id', [topicoId]);
}

export async function getItem(id: number): Promise<Item | null> {
  const db = getDb();
  return db.getFirstAsync<Item>('SELECT * FROM itens WHERE id = ?', [id]);
}

export async function updateItemDescricao(id: number, descricao: string): Promise<void> {
  const db = getDb();
  await db.runAsync('UPDATE itens SET descricao = ? WHERE id = ?', [descricao, id]);
}

export async function getItemsByDate(date: string): Promise<Item[]> {
  const db = getDb();
  return db.getAllAsync<Item>('SELECT * FROM itens WHERE data_prevista = ?', [date]);
}

export async function getAllItemsWithDates(): Promise<Item[]> {
  const db = getDb();
  return db.getAllAsync<Item>('SELECT * FROM itens WHERE data_prevista IS NOT NULL');
}

export async function groupByPeriodo(topicoId: number): Promise<Record<string, Item[]>> {
  const items = await getItemsByTopico(topicoId);
  const groups: Record<string, Item[]> = {};
  for (const item of items) {
    const key = item.periodo ?? '';
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return groups;
}

export async function upsertItem(item: Item): Promise<void> {
  const db = getDb();
  await db.runAsync(
    `INSERT INTO itens (id, topico_id, tipo, titulo, descricao, onde, periodo, data_prevista, status, peso, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       topico_id = excluded.topico_id,
       tipo = excluded.tipo,
       titulo = excluded.titulo,
       descricao = excluded.descricao,
       onde = excluded.onde,
       periodo = excluded.periodo,
       data_prevista = excluded.data_prevista,
       status = excluded.status,
       peso = excluded.peso,
       synced_at = excluded.synced_at`,
    [item.id, item.topico_id, item.tipo, item.titulo, item.descricao ?? null,
     item.onde ?? null, item.periodo ?? null, item.data_prevista ?? null,
     item.status, item.peso, item.synced_at ?? null]
  );
}

export async function insertItem(topicoId: number, item: Omit<Item, 'id' | 'topico_id' | 'synced_at'>): Promise<number> {
  const db = getDb();
  const result = await db.runAsync(
    `INSERT INTO itens (topico_id, tipo, titulo, descricao, onde, periodo, data_prevista, status, peso)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [topicoId, item.tipo, item.titulo, item.descricao ?? null, item.onde ?? null,
     item.periodo ?? null, item.data_prevista ?? null, item.status, item.peso]
  );
  return result.lastInsertRowId;
}

export async function updateItemStatus(id: number, status: ItemStatus): Promise<void> {
  const db = getDb();
  await db.runAsync('UPDATE itens SET status = ? WHERE id = ?', [status, id]);
}

export async function updateItemDate(id: number, date: string | null): Promise<void> {
  const db = getDb();
  await db.runAsync('UPDATE itens SET data_prevista = ? WHERE id = ?', [date, id]);
}

export async function deleteItem(id: number): Promise<void> {
  const db = getDb();
  await db.runAsync('DELETE FROM itens WHERE id = ?', [id]);
}
