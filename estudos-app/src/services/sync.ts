import { getDb } from './db';
import { getBaseUrl } from './api';
import { api } from './api';
import { upsertTopico } from './topicoRepo';
import { upsertItem } from './itemRepo';
import { upsertCurso } from './cursoRepo';
import type { PendingOp } from '../types';

async function drainPendingOps(): Promise<void> {
  const db = getDb();
  const ops = await db.getAllAsync<PendingOp>('SELECT * FROM pending_ops ORDER BY id');
  const base = await getBaseUrl();
  for (const op of ops) {
    try {
      const payload = JSON.parse(op.payload);
      const res = await fetch(`${base}${op.rota}`, {
        method: op.metodo,
        headers: { 'Content-Type': 'application/json' },
        body: op.metodo !== 'DELETE' ? JSON.stringify(payload) : undefined,
      });
      if (res.ok) {
        await db.runAsync('DELETE FROM pending_ops WHERE id = ?', [op.id]);
      }
    } catch {
    }
  }
}

async function pullAndUpsert(): Promise<void> {
  const db = getDb();
  const topicos: any[] = await api.getTopicos();
  const serverIds = new Set<number>(topicos.map((t: any) => t.id));
  const now = new Date().toISOString();

  const localSynced = await db.getAllAsync<{ id: number }>(
    'SELECT id FROM topicos WHERE synced_at IS NOT NULL'
  );
  for (const local of localSynced) {
    if (!serverIds.has(local.id)) {
      await db.runAsync('DELETE FROM topicos WHERE id = ?', [local.id]);
    }
  }

  for (const t of topicos) {
    await upsertTopico({ id: t.id, nome: t.nome, descricao: t.descricao, cor: t.cor, synced_at: now });
    const detail: any = await api.getTopico(t.id);
    for (const item of detail.itens ?? []) {
      await upsertItem({
        id: item.id,
        topico_id: t.id,
        tipo: item.tipo,
        titulo: item.titulo,
        descricao: item.descricao,
        onde: item.onde,
        periodo: item.periodo,
        data_prevista: item.dataPrevista,
        status: item.status,
        peso: item.peso ?? 1,
        synced_at: now,
      });
    }
    for (const curso of detail.cursos ?? []) {
      await upsertCurso({
        id: curso.id,
        topico_id: t.id,
        nome: curso.nome,
        descricao: curso.descricao,
        plataforma: curso.plataforma,
        periodo: curso.periodo,
        status: curso.status,
        pagamento: curso.pagamento,
        valor: parseFloat(curso.valor ?? '0'),
        moeda: curso.moeda ?? 'BRL',
        progresso: curso.progresso ?? 0,
        meses_ativos: curso.mesesAtivos ?? 0,
        link: curso.link,
        synced_at: now,
      });
    }
  }
}

export async function sync(): Promise<void> {
  await drainPendingOps();
  await pullAndUpsert();
}

export async function enqueuePendingOp(
  metodo: PendingOp['metodo'],
  rota: string,
  payload: object
): Promise<void> {
  const db = getDb();
  await db.runAsync(
    'INSERT INTO pending_ops (metodo, rota, payload, criado_em) VALUES (?, ?, ?, ?)',
    [metodo, rota, JSON.stringify(payload), new Date().toISOString()]
  );
}
