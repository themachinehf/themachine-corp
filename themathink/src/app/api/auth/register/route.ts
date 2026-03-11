import { NextRequest, NextResponse } from 'next/server';

// Cloudflare D1 - uses wrangler bindings in Edge runtime
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

// Register
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Check if user exists
    const existing = await DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();

    if (existing) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Create user
    const userId = generateId();
    const passwordHash = hashPassword(password);
    
    await DB.prepare(
      'INSERT INTO users (id, email, password_hash, subscription) VALUES (?, ?, ?, ?)'
    ).bind(userId, email, passwordHash, 'free').run();

    // Create session
    const sessionId = generateId();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    await DB.prepare(
      'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)'
    ).bind(sessionId, userId, expiresAt).run();

    return NextResponse.json({
      success: true,
      user: { id: userId, email, subscription: 'free' },
      sessionId
    });

  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
