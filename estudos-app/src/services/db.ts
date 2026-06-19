import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!_db) throw new Error('DB not initialized — call initDb() first');
  return _db;
}

export async function initDb(): Promise<void> {
  const db = await SQLite.openDatabaseAsync('estudos.db');
  _db = db;

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS topicos (
      id INTEGER PRIMARY KEY,
      nome TEXT NOT NULL UNIQUE,
      descricao TEXT,
      cor TEXT DEFAULT '#A85C42',
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS itens (
      id INTEGER PRIMARY KEY,
      topico_id INTEGER NOT NULL REFERENCES topicos(id) ON DELETE CASCADE,
      tipo TEXT NOT NULL,
      titulo TEXT NOT NULL,
      descricao TEXT,
      onde TEXT,
      periodo TEXT,
      data_prevista TEXT,
      status TEXT DEFAULT 'PENDENTE',
      peso INTEGER DEFAULT 1,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS cursos (
      id INTEGER PRIMARY KEY,
      topico_id INTEGER NOT NULL REFERENCES topicos(id) ON DELETE CASCADE,
      nome TEXT NOT NULL,
      descricao TEXT,
      plataforma TEXT,
      periodo TEXT,
      status TEXT DEFAULT 'PLANEJADO',
      pagamento TEXT DEFAULT 'UNICO',
      valor REAL DEFAULT 0,
      moeda TEXT DEFAULT 'BRL',
      progresso INTEGER DEFAULT 0,
      meses_ativos INTEGER DEFAULT 0,
      link TEXT,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS lembretes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topico_id INTEGER REFERENCES topicos(id) ON DELETE SET NULL,
      frequencia TEXT DEFAULT 'SEMANAL',
      dias TEXT,
      hora TEXT NOT NULL,
      ativo INTEGER DEFAULT 1,
      expo_notification_ids TEXT
    );

    CREATE TABLE IF NOT EXISTS pending_ops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      metodo TEXT NOT NULL,
      rota TEXT NOT NULL,
      payload TEXT NOT NULL,
      criado_em TEXT NOT NULL
    );
  `);
}
