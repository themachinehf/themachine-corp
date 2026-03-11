// 登录 API
import { D1Database } from '@cloudflare/workers-types';
import { hashPassword, verifyPassword } from '../../../lib/auth';
import { createSession } from '../../../lib/session';

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const DB: D1Database = env.DB;
    
    if (!DB) {
      return new Response(
        JSON.stringify({ error: 'Database not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    // 验证输入
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const db = DB;

    // 查找用户
    const user = await db.prepare(
      'SELECT id, email, password_hash, tier, subscription_status FROM themathink_users WHERE email = ?'
    ).bind(email).first();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 验证密码
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 创建会话
    const session = await createSession(user.id, db);

    // 设置 cookie
    const cookieHeader = `session=${session.token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`;

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          tier: user.tier,
          subscriptionStatus: user.subscription_status
        },
        sessionToken: session.token
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Set-Cookie': cookieHeader
        } 
      }
    );

  } catch (error) {
    console.error('Login Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
