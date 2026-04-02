import Database from '@tauri-apps/plugin-sql';

let db: Database | null = null;

export async function getDatabase(): Promise<Database> {
  if (!db) {
    db = await Database.load('sqlite:optivision.db');
  }
  return db;
}

export async function query<T>(sql: string, bindValues: unknown[] = []): Promise<T[]> {
  const database = await getDatabase();
  return database.select<T[]>(sql, bindValues);
}

export async function execute(sql: string, bindValues: unknown[] = []): Promise<{ lastInsertId: number; rowsAffected: number }> {
  const database = await getDatabase();
  const result = await database.execute(sql, bindValues);
  return {
    lastInsertId: result.lastInsertId ?? 0,
    rowsAffected: result.rowsAffected ?? 0,
  };
}
