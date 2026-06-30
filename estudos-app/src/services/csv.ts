import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import Papa from 'papaparse';
import { parseRow } from '../logic/csvParse';
import { getDb } from './db';
import { insertTopico } from './topicoRepo';
import { insertItem } from './itemRepo';
import { insertCurso } from './cursoRepo';
import { api } from './api';
import type { CsvPreviewRow } from '../types';

export async function pickCsvFile(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: 'text/csv', copyToCacheDirectory: true });
  if (result.canceled) return null;
  return result.assets[0].uri;
}

export async function parseCsvToPreview(uri: string): Promise<CsvPreviewRow[]> {
  const content = await new File(uri).text();
  const { data } = Papa.parse(content, { header: true, skipEmptyLines: true });
  const rows: CsvPreviewRow[] = [];
  for (const raw of data as Record<string, string>[]) {
    const row = parseRow(raw);
    if (row) rows.push(row);
  }
  return rows;
}

export async function importRows(rows: CsvPreviewRow[], fileUri: string): Promise<{ itemsCreated: number; cursosCreated: number }> {
  const db = getDb();
  let itemsCreated = 0;
  let cursosCreated = 0;

  const topicoCache: Record<string, number> = {};

  async function getOrCreateTopico(nome: string): Promise<number> {
    if (topicoCache[nome]) return topicoCache[nome];
    const existing = await db.getFirstAsync<{ id: number }>('SELECT id FROM topicos WHERE LOWER(nome) = LOWER(?)', [nome]);
    if (existing) {
      topicoCache[nome] = existing.id;
      return existing.id;
    }
    const id = await insertTopico(nome, undefined, '#A85C42');
    topicoCache[nome] = id;
    return id;
  }

  for (const row of rows) {
    const topicoId = await getOrCreateTopico(row.topico);
    if (row.tipo === 'curso') {
      await insertCurso(topicoId, {
        nome: row.titulo,
        descricao: row.descricao,
        status: (row.status as any) ?? 'PLANEJADO',
        pagamento: 'UNICO',
        valor: row.valor ?? 0,
        moeda: row.moeda ?? 'BRL',
        progresso: 0,
        meses_ativos: 0,
      });
      cursosCreated++;
    } else {
      await insertItem(topicoId, {
        tipo: row.tipo,
        titulo: row.titulo,
        descricao: row.descricao,
        status: (row.status as any) ?? 'PENDENTE',
        peso: row.peso,
        periodo: row.periodo,
        data_prevista: row.data_prevista,
      });
      itemsCreated++;
    }
  }

  try {
    await api.importCsv(fileUri);
  } catch {
  }

  return { itemsCreated, cursosCreated };
}
