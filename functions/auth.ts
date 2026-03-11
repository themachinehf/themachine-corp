// themachine-corp/functions/auth.ts
// Cloudflare Workers Auth System (ES Module)

interface Env {
  DB: D1Database;
  AUTH_KV: KVNamespace;
  AUTH_SECRET: string;
  COOKIE_DOMAIN: string;
}

interface User {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  avatar_url: string | null;
  created_at: number;
  updated_at: number;
  email_verified: number;
}

interface Session {
  id: string;
  user_id: string;
  expires_at: number;
  created_at: number;
}

// 工具函数
function generateId(): string {
  return crypto.randomUUID();
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function createToken(): string {
  return generateId() + '.' + generateId();
}

function getCookieValue(name: string, cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';').map(c => c.trim());
  for (const cookie of cookies) {
    const [key, value] = cookie.split('=');
    if (key === name) return value;
  }
  return null;
}

function setCookie(name: string, value: string, maxAge: number = 86400): string {
  return `${name}=${value}; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}; Path=/`;
}

// 响应构建
function jsonResponse(data: any, status: number = 200, cookies?: string[]): Response {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (cookies) {
    cookies.forEach(c => headers.append('Set-Cookie', c));
  }
  return new Response(JSON.stringify(data), { status, headers });
}

function errorResponse(message: string, status: number = 400): Response {
  return jsonResponse({ error: message }, status);
}

// 认证中间件
async function authenticate(request: Request, env: Env): Promise<User | null> {
  const sessionId = getCookieValue('session_id', request.headers.get('Cookie'));
  if (!sessionId) return null;

  // 先尝试从 KV 获取
  const cached = await env.AUTH_KV.get(`sessions:${sessionId}`, 'json');
  if (cached) return cached as User;

  // 从 D1 获取
  const session = await env.DB.prepare(`
    SELECT s.*, u.id, u.email, u.username, u.avatar_url, u.created_at, u.updated_at, u.email_verified
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ? AND s.expires_at > ?
  `).bind(sessionId, Date.now()).first<Session & User>();

  if (!session) return null;

  // 缓存到 KV
  await env.AUTH_KV.put(`sessions:${sessionId}`, JSON.stringify({
    id: session.id,
    email: session.email,
    username: session.username,
    avatar_url: session.avatar_url
  }), { expirationTtl: 86400 });

  return session;
}

// 速率限制中间件
async function rateLimit(request: Request, env: Env, action: string): Promise<boolean> {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const key = `rate_limit:${ip}:${action}`;
  
  const current = await env.AUTH_KV.get(key);
  const count = current ? parseInt(current) : 0;
  
  if (count >= 10) return false;
  
  await env.AUTH_KV.put(key, String(count + 1), { expirationTtl: 60 });
  return true;
}

// 注册
async function handleRegister(request: Request, env: Env): Promise<Response> {
  if (!await rateLimit(request, env, 'register')) {
    return errorResponse('Too many requests', 429);
  }

  const { email, username, password } = await request.json();
  
  if (!email || !username || !password) {
    return errorResponse('Missing required fields');
  }

  if (password.length < 8) {
    return errorResponse('Password must be at least 8 characters');
  }

  const passwordHash = await hashPassword(password);
  const now = Date.now();
  
  try {
    const userId = generateId();
    
    await env.DB.prepare(`
      INSERT INTO users (id, email, username, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(userId, email.toLowerCase(), username, passwordHash, now, now).run();

    // 创建验证邮件 token
    const verifyToken = createToken();
    await env.DB.prepare(`
      INSERT INTO verification_tokens (token, user_id, type, expires_at)
      VALUES (?, ?, 'email_verify', ?)
    `).bind(verifyToken, userId, now + 86400000).run();

    // 实际项目中发送验证邮件
    console.log(`Verification link: https://themachine.ai/verify?token=${verifyToken}`);

    return jsonResponse({ message: 'Registration successful', user_id: userId });
  } catch (err: any) {
    if (err.message?.includes('UNIQUE constraint failed')) {
      return errorResponse('Email or username already exists', 409);
    }
    return errorResponse('Registration failed', 500);
  }
}

// 登录
async function handleLogin(request: Request, env: Env): Promise<Response> {
  if (!await rateLimit(request, env, 'login')) {
    return errorResponse('Too many requests', 429);
  }

  const { email, password } = await request.json();
  
  if (!email || !password) {
    return errorResponse('Missing email or password');
  }

  const user = await env.DB.prepare(`
    SELECT * FROM users WHERE email = ?
  `).bind(email.toLowerCase()).first<User>();

  if (!user) {
    return errorResponse('Invalid credentials', 401);
  }

  const passwordHash = await hashPassword(password);
  if (passwordHash !== user.password_hash) {
    return errorResponse('Invalid credentials', 401);
  }

  // 创建会话
  const sessionId = generateId();
  const expiresAt = Date.now() + 86400000 * 7; // 7 days
  
  await env.DB.prepare(`
    INSERT INTO sessions (id, user_id, expires_at, created_at)
    VALUES (?, ?, ?, ?)
  `).bind(sessionId, user.id, expiresAt, Date.now()).run();

  // 缓存到 KV
  await env.AUTH_KV.put(`sessions:${sessionId}`, JSON.stringify({
    id: user.id,
    email: user.email,
    username: user.username,
    avatar_url: user.avatar_url
  }), { expirationTtl: 86400 * 7 });

  return jsonResponse({
    user: { id: user.id, email: user.email, username: user.username, avatar_url: user.avatar_url }
  }, 200, [setCookie('session_id', sessionId, 86400 * 7)]);
}

// 登出
async function handleLogout(request: Request, env: Env): Promise<Response> {
  const sessionId = getCookieValue('session_id', request.headers.get('Cookie'));
  
  if (sessionId) {
    await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
    await env.AUTH_KV.delete(`sessions:${sessionId}`);
  }

  return jsonResponse({ message: 'Logged out' }, 200, [setCookie('session_id', '', 0)]);
}

// 获取当前用户
async function handleMe(request: Request, env: Env): Promise<Response> {
  const user = await authenticate(request, env);
  
  if (!user) {
    return errorResponse('Not authenticated', 401);
  }

  return jsonResponse({ user });
}

// 邮箱验证
async function handleVerifyEmail(request: Request, env: Env): Promise<Response> {
  const { token } = await request.json();
  
  if (!token) {
    return errorResponse('Missing token');
  }

  const result = await env.DB.prepare(`
    SELECT * FROM verification_tokens WHERE token = ? AND type = 'email_verify' AND expires_at > ?
  `).bind(token, Date.now()).first<{ user_id: string }>();

  if (!result) {
    return errorResponse('Invalid or expired token', 400);
  }

  await env.DB.prepare('UPDATE users SET email_verified = 1 WHERE id = ?').bind(result.user_id).run();
  await env.DB.prepare('DELETE FROM verification_tokens WHERE token = ?').bind(token).run();

  return jsonResponse({ message: 'Email verified successfully' });
}

// 主处理函数
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS 预检
    if (method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    try {
      let response: Response;

      // 路由匹配
      if (path === '/api/auth/register' && method === 'POST') {
        response = await handleRegister(request, env);
      } else if (path === '/api/auth/login' && method === 'POST') {
        response = await handleLogin(request, env);
      } else if (path === '/api/auth/logout' && method === 'POST') {
        response = await handleLogout(request, env);
      } else if (path === '/api/auth/me' && method === 'GET') {
        response = await handleMe(request, env);
      } else if (path === '/api/auth/verify-email' && method === 'POST') {
        response = await handleVerifyEmail(request, env);
      } else if (path === '/api/auth/chat' && method === 'POST') {
        response = await handleChat(request, env);
      } else {
        response = errorResponse('Not found', 404);
      }

      // 添加 CORS 头
      const headers = new Headers(response.headers);
      headers.set('Access-Control-Allow-Origin', '*');
      
      return new Response(response.body, {
        status: response.status,
        headers
      });

    } catch (err) {
      console.error('Auth error:', err);
      return errorResponse('Internal server error', 500);
    }
  }
};

// 哲学聊天处理
async function handleChat(request: Request, env: Env): Promise<Response> {
  const sessionId = getCookieValue('session_id', request.headers.get('Cookie'));
  
  if (!sessionId) {
    return errorResponse('Not authenticated', 401);
  }

  const { message, mode = 'default' } = await request.json();

  if (!message) {
    return errorResponse('Message required', 400);
  }

  const modes = {
    socratic: 'You are a Socratic philosopher. NEVER give direct answers. Instead, ask probing questions to help the user discover the answer themselves. Keep responses short (2-3 sentences) and end with a question.',
    critical: 'You are a critical thinking coach. Challenge assumptions. Ask: "What evidence?" "What would disprove this?" Keep responses short.',
    creative: 'You are a creative brainstorm partner. Suggest wild possibilities. Ask: "What if we looked at this differently?"',
    default: 'You are a thoughtful thinking partner. Help users think deeper. Ask questions. Keep responses concise.'
  };

  try {
    const aiRes = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.MINIMAX_API_KEY || 'sk-api-YhH4k0J3Vmstql8F67XAmb8Z8MIgPSgADYbGCHQMWXn6J3F52MBBXuu4xGXFgrEwScRPA2g8IVgv7Xf0WvUAD8k3zgJSfucn5K0-FNaFC3TZBvVe6Rc93uw'}`
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.1',
        messages: [
          { role: 'system', content: modes[mode] || modes.default },
          { role: 'user', content: message }
        ],
        tokens_to_generate: 500,
        temperature: 0.8
      })
    });

    const aiData = await aiRes.json();
    const reply = aiData.choices?.[0]?.message?.content || "I'm thinking...";

    return jsonResponse({ reply, mode });
  } catch (error) {
    return errorResponse('Chat error: ' + error.message, 500);
  }
};
