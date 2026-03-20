// 注册 API
import { D1Database } from '@cloudflare/workers-types';
import { hashPassword, verifyPassword } from '../../lib/auth';

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

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 验证密码强度
    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const db = DB;

    // 检查用户是否已存在
    const existingUser = await db.prepare(
      'SELECT id FROM themathink_users WHERE email = ?'
    ).bind(email).first();

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'User already exists' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 哈希密码
    const passwordHash = await hashPassword(password);

    // 生成用户 ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    // 创建用户
    await db.prepare(
      `INSERT INTO themathink_users (id, email, password_hash, tier, subscription_status, created_at, updated_at)
       VALUES (?, ?, ?, 'free', 'inactive', datetime('now'), datetime('now'))`
    ).bind(userId, email, passwordHash).run();

    return new Response(
      JSON.stringify({
        success: true,
        user: { id: userId, email, tier: 'free' }
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Register Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
