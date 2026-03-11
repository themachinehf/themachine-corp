import { createClient } from '@libsql/client';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-session-id',
};

async function hashPassword(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export async function onRequestPost({ request, env }) {
  const client = createClient({
    url: 'libsql://themachinecorp-themachinehf.aws-ap-northeast-1.turso.io',
    authToken: env.TURSO_AUTH_TOKEN
  });

  const { email, password } = await request.json();
  
  if (!email || !password) {
    return new Response(JSON.stringify({ error: 'Email and password required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    await client.execute(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      subscription TEXT DEFAULT 'free',
      subscription_expires_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`).catch(() => {});
    
    await client.execute(`CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`).catch(() => {});

    const existing = await client.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [email]
    });

    if (existing.rows.length > 0) {
      return new Response(JSON.stringify({ error: 'User already exists' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const userId = generateId();
    const passwordHash = await hashPassword(password);
    
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

    return new Response(JSON.stringify({
      success: true,
      user: { id: userId, email, subscription: 'free' },
      sessionId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal error: ' + error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}
