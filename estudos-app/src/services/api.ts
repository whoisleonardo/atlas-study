import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ItemStatus } from '../types';

const DEFAULT_BASE = 'http://localhost:8080';
const KEY = 'api_base_url';

export async function getBaseUrl(): Promise<string> {
  return (await AsyncStorage.getItem(KEY)) ?? DEFAULT_BASE;
}

export async function setBaseUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(KEY, url);
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const base = await getBaseUrl();
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API ${method} ${path} → ${res.status}`);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  getTopicos: () => req<any[]>('GET', '/api/topicos'),
  getTopico: (id: number) => req<any>('GET', `/api/topicos/${id}`),
  createTopico: (body: { nome: string; descricao?: string; cor: string }) =>
    req<number>('POST', '/api/topicos', body),
  addItem: (topicoId: number, body: object) =>
    req<any>('POST', `/api/topicos/${topicoId}/itens`, body),
  addCurso: (topicoId: number, body: object) =>
    req<any>('POST', `/api/topicos/${topicoId}/cursos`, body),
  patchItemStatus: (id: number, status: ItemStatus) =>
    req<any>('PATCH', `/api/itens/${id}/status`, { status }),
  updateCurso: (id: number, body: object) =>
    req<any>('PUT', `/api/cursos/${id}`, body),
  deleteTopico: (id: number) => req<void>('DELETE', `/api/topicos/${id}`),
  deleteItem: (id: number) => req<void>('DELETE', `/api/itens/${id}`),
  deleteCurso: (id: number) => req<void>('DELETE', `/api/cursos/${id}`),
  importCsv: async (fileUri: string): Promise<any> => {
    const base = await getBaseUrl();
    const formData = new FormData();
    formData.append('file', { uri: fileUri, name: 'import.csv', type: 'text/csv' } as any);
    const res = await fetch(`${base}/api/import`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error(`CSV import → ${res.status}`);
    return res.json();
  },
};
