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

// Login
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    
    if (!email || !password) {
      return json({ error: 'Email and password required' }, 400);
    }

    const passwordHash = hashPassword(password);
    
    const result = await client.execute({
      sql: 'SELECT id, email, subscription, subscription_expires_at FROM users WHERE email = ? AND password_hash = ?',
      args: [email, passwordHash]
    });

    if (result.rows.length === 0) {
      return json({ error: 'Invalid credentials' }, 401);
    }

    const user = result.rows[0];

    const sessionId = generateId();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    await client.execute({
      sql: 'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)',
      args: [sessionId, user.id, expiresAt]
    });

    return json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        subscription: user.subscription,
        subscription_expires_at: user.subscription_expires_at
      },
      sessionId
    });

  } catch (error) {
    console.error('Login error:', error);
    return json({ error: 'Internal error' }, 500);
  }
}
