import { createClient } from '@libsql/client';

const client = createClient({
  url: 'libsql://themachinecorp-themachinehf.aws-ap-northeast-1.turso.io',
  authToken: process.env.TURSO_AUTH_TOKEN
});

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

// Register
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    
    if (!email || !password) {
      return Response.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Check if user exists
    const existing = await client.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [email]
    });

    if (existing.rows.length > 0) {
      return Response.json({ error: 'User already exists' }, { status: 400 });
    }

    // Create user
    const userId = generateId();
    const passwordHash = hashPassword(password);
    
    await client.execute({
      sql: 'INSERT INTO users (id, email, password_hash, subscription) VALUES (?, ?, ?, ?)',
      args: [userId, email, passwordHash, 'free']
    });

    // Create session
    const sessionId = generateId();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    await client.execute({
      sql: 'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)',
      args: [sessionId, userId, expiresAt]
    });

    return Response.json({
      success: true,
      user: { id: userId, email, subscription: 'free' },
      sessionId
    });

  } catch (error) {
    console.error('Register error:', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
