// 数据库连接
import { D1Database } from '@cloudflare/workers-types';

let db: D1Database | null = null;

export async function getDatabase(): Promise<D1Database> {
  if (!db) {
    // 通过 context.env 获取 D1 数据库绑定
    // Workers 会自动注入 DB 绑定
    throw new Error('Database not initialized. Use getDatabase(context) or ensure DB is bound.');
  }
  return db;
}

export function initDatabase(database: D1Database) {
  db = database;
}
