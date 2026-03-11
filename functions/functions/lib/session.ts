// 会话管理
import { D1Database } from '@cloudflare/workers-types';

interface Session {
  token: string;
  userId: string;
  expiresAt: string;
}

export async function createSession(userId: string, db: D1Database): Promise<Session> {
  // 生成随机 token
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 天
  
  // 存储到数据库 - 使用 user_sessions 表
  await db.prepare(
    `INSERT INTO user_sessions (token, user_id, expires_at, created_at)
     VALUES (?, ?, ?, datetime('now'))`
  ).bind(token, userId, expiresAt).run();
  
  return { token, userId, expiresAt };
}

export async function getSession(token: string, db: D1Database): Promise<Session | null> {
  const session = await db.prepare(
    `SELECT token, user_id as userId, expires_at as expiresAt 
     FROM user_sessions 
     WHERE token = ? AND expires_at > datetime('now')`
  ).bind(token).first();
  
  return session as Session | null;
}

export async function deleteSession(token: string, db: D1Database): Promise<void> {
  await db.prepare('DELETE FROM user_sessions WHERE token = ?').bind(token).run();
}
