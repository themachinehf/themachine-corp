import { createClient } from '@libsql/client';

const client = createClient({
  url: 'libsql://themachinecorp-themachinehf.aws-ap-northeast-1.turso.io',
  authToken: process.env.TURSO_AUTH_TOKEN
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-session-id',
};

function json(data: any, status = 200) {
  return Response.json(data, { status, headers: corsHeaders });
}

// Handle CORS preflight
export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}

// Verify session / Get current user
export async function GET(req: Request) {
  try {
    const sessionId = req.headers.get('x-session-id');
    
    if (!sessionId) {
      return json({ error: 'No session' }, 401);
    }

    const result = await client.execute({
      sql: `SELECT u.id, u.email, u.subscription, u.subscription_expires_at 
            FROM users u 
            JOIN sessions s ON u.id = s.user_id 
            WHERE s.id = ? AND s.expires_at > datetime('now')`,
      args: [sessionId]
    });

    if (result.rows.length === 0) {
      return json({ error: 'Invalid or expired session' }, 401);
    }

    const user = result.rows[0];
    return json({
      user: {
        id: user.id,
        email: user.email,
        subscription: user.subscription,
        subscription_expires_at: user.subscription_expires_at
      }
    });

  } catch (error) {
    console.error('Session verify error:', error);
    return json({ error: 'Internal error' }, 500);
  }
}

// Logout
export async function DELETE(req: Request) {
  try {
    const sessionId = req.headers.get('x-session-id');
    
    if (sessionId) {
      await client.execute({
        sql: 'DELETE FROM sessions WHERE id = ?',
        args: [sessionId]
      });
    }

    return json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return json({ error: 'Internal error' }, 500);
  }
}
