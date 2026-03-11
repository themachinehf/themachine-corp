import { createClient } from '@libsql/client';

const client = createClient({
  url: 'libsql://themachinecorp-themachinehf.aws-ap-northeast-1.turso.io',
  authToken: TURSO_AUTH_TOKEN
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-session-id',
};

export async function onRequestGet({ request }) {
  const sessionId = request.headers.get('x-session-id');
  
  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'No session' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const result = await client.execute({
      sql: `SELECT u.id, u.email, u.subscription, u.subscription_expires_at 
            FROM users u 
            JOIN sessions s ON u.id = s.user_id 
            WHERE s.id = ? AND s.expires_at > datetime('now')`,
      args: [sessionId]
    });

    if (result.rows.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid or expired session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const user = result.rows[0];
    return new Response(JSON.stringify({
      user: {
        id: user.id,
        email: user.email,
        subscription: user.subscription,
        subscription_expires_at: user.subscription_expires_at
      }
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

export async function onRequestDelete({ request }) {
  const sessionId = request.headers.get('x-session-id');
  
  if (sessionId) {
    await client.execute({
      sql: 'DELETE FROM sessions WHERE id = ?',
      args: [sessionId]
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}
