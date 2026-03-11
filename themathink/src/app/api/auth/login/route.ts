import { NextRequest, NextResponse } from 'next/server';

// Cloudflare D1
// @ts-ignore
const DB = process.env.DB;

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

// Login
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const passwordHash = hashPassword(password);
    
    // Find user
    const user = await DB.prepare(
      'SELECT id, email, subscription, subscription_expires_at FROM users WHERE email = ? AND password_hash = ?'
    ).bind(email, passwordHash).first();

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Create session
    const sessionId = generateId();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    await DB.prepare(
      'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)'
    ).bind(sessionId, user.id, expiresAt).run();

    return NextResponse.json({
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
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
