import { createClient } from '@libsql/client';

const client = createClient({
  url: 'libsql://themachinecorp-themachinehf.aws-ap-northeast-1.turso.io',
  authToken: TURSO_AUTH_TOKEN
});

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

export async function onRequestPost({ request }) {
  const { email, password } = await request.json();
  
  if (!email || !password) {
    return new Response(JSON.stringify({ error: 'Email and password required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const passwordHash = await hashPassword(password);
    
    const result = await client.execute({
      sql: 'SELECT id, email, subscription, subscription_expires_at FROM users WHERE email = ? AND password_hash = ?',
      args: [email, passwordHash]
    });

    if (result.rows.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const user = result.rows[0];

    const sessionId = generateId();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    await client.execute({
      sql: 'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)',
      args: [sessionId, user.id, expiresAt]
    });

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        subscription: user.subscription,
        subscription_expires_at: user.subscription_expires_at
      },
      sessionId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}
