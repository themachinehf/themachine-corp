import { createClient } from '@libsql/client';

const client = createClient({
  url: 'libsql://themachinecorp-themachinehf.aws-ap-northeast-1.turso.io',
  authToken: process.env.TURSO_AUTH_TOKEN
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-session-id',
};

function json(data: any, status = 200) {
  return Response.json(data, { status, headers: corsHeaders });
}

// Auto-create tables on startup
client.execute(`CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  subscription TEXT DEFAULT 'free',
  subscription_expires_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
)`).catch(() => {});

client.execute(`CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
)`).catch(() => {});

function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Handle CORS preflight
export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}

// Register
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    
    if (!email || !password) {
      return json({ error: 'Email and password required' }, 400);
    }

    const existing = await client.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [email]
    });

    if (existing.rows.length > 0) {
      return json({ error: 'User already exists' }, 400);
    }

    const userId = generateId();
    const passwordHash = hashPassword(password);
    
    await client.execute({
      sql: 'INSERT INTO users (id, email, password_hash, subscription) VALUES (?, ?, ?, ?)',
      args: [userId, email, passwordHash, 'free']
    });

    const sessionId = generateId();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    await client.execute({
      sql: 'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)',
      args: [sessionId, userId, expiresAt]
    });

    return json({
      success: true,
      user: { id: userId, email, subscription: 'free' },
      sessionId
    });

  } catch (error) {
    console.error('Register error:', error);
    return json({ error: 'Internal error' }, 500);
  }
}
