// themachine-corp/functions/auth.ts
// Cloudflare Workers Auth System (ES Module)

interface Env {
  DB: D1Database;
  AUTH_KV: KVNamespace;
  AUTH_SECRET: string;
  COOKIE_DOMAIN: string;
}

// Agent 能力映射 - 关键词匹配
const AGENT_KEYWORDS: Record<string, string[]> = {
  // CTO: 技术、代码、开发、架构、系统、API、部署、数据库
  cto: [
    '技术', '代码', '开发', '编程', '架构', '系统', 'api', 'API', '部署', '数据库',
    'server', '服务器', 'cloudflare', 'wrangler', 'd1', 'database', 'dev',
    'debug', 'bug', 'fix', 'error', 'issue', 'deploy', 'git', 'github',
    'python', 'javascript', 'typescript', 'node', 'rust', 'html', 'css',
    'nextjs', 'next.js', 'react', 'frontend', 'backend', 'fullstack',
    'infrastructure', '运维', '监控', 'monitoring'
  ],
  
  // CFO: 交易、财务、投资、资金、收益、网格
  cfo: [
    '交易', '财务', '投资', '资金', '收益', '网格', '量化', 'trading',
    'finance', 'okx', 'binance', 'crypto', '加密货币', 'token', 'coin',
    'profit', 'loss', '盈利', '亏损', '策略', 'strategy', 'backtest',
    '回测', 'portfolio', '仓位', '止损', '止盈', '杠杆', '合约'
  ],
  
  // CMO: 营销、内容、推广、社交、品牌、文案
  cmo: [
    '营销', '内容', '推广', '社交', '品牌', '文案', 'marketing', 'content',
    'social', 'twitter', 'telegram', 'discord', 'facebook', 'instagram',
    '文章', '博客', 'post', '帖子', '视频', '短视频', 'youtube', 'tiktok',
    'seo', '广告', 'campaign', '活动', '运营', '增长', '粉丝', 'follower'
  ],
  
  // CPO: 产品、设计、功能、体验、需求
  cpo: [
    '产品', '设计', '功能', '体验', '需求', 'product', 'design', 'feature',
    'ui', 'ux', 'interface', '界面', '交互', 'prototype', '原型',
    'mvp', 'roadmap', '路线图', 'spec', '规格', 'PRD', '需求文档',
    '用户体验', '用户研究', '测试', 'testing', 'qa'
  ],
  
  // SEC: 安全、审计、权限、备份、风险
  sec: [
    '安全', '审计', '权限', '备份', '风险', 'security', 'audit', 'permission',
    'backup', 'risk', 'vulnerability', '漏洞', '渗透', 'penetration',
    'auth', 'authentication', 'authorization', 'oauth', 'jwt', 'token',
    'ssl', 'tls', 'https', '加密', 'encryption', 'firewall', 'waf'
  ]
};

// 根据关键词自动分配 Agent
function autoAssignAgent(title: string, description: string): string | null {
  const text = `${title} ${description || ''}`.toLowerCase();
  
  // 统计每个 Agent 的匹配分数
  const scores: Record<string, number> = {};
  
  for (const [agentId, keywords] of Object.entries(AGENT_KEYWORDS)) {
    scores[agentId] = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        scores[agentId]++;
      }
    }
  }
  
  // 找出最高分数的 Agent
  let bestAgent: string | null = null;
  let bestScore = 0;
  
  for (const [agentId, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestAgent = agentId;
    }
  }
  
  // 如果匹配分数 >= 1 才自动分配，否则返回 null
  return bestScore >= 1 ? bestAgent : null;
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

// Agent Handlers
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8).toString(16));
  });
}

async function handleAgents(request) {
  const { results } = await env.DB.prepare("SELECT * FROM agents ORDER BY role").all();
  return new Response(JSON.stringify({ agents: results }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleTasks(request) {
  const url = new URL(request.url);
  const method = request.method;
  
  if (method === 'GET') {
    const agentId = url.searchParams.get('agent');
    const status = url.searchParams.get('status');
    let sql = "SELECT * FROM tasks WHERE 1=1";
    const params = [];
    if (agentId) { sql += " AND assigned_agent_id = ?"; params.push(agentId); }
    if (status) { sql += " AND status = ?"; params.push(status); }
    sql += " ORDER BY CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 ELSE 2 END, created_at DESC LIMIT 50";
    const { results } = await env.DB.prepare(sql).bind(...params).all();
    return new Response(JSON.stringify({ tasks: results }), { headers: { 'Content-Type': 'application/json' } });
  }
  
  if (method === 'POST') {
    const body = await request.json();
    const id = uuid();
    
    // 如果没有指定 Agent，自动分配
    let assignedAgentId = body.assigned_agent_id;
    if (!assignedAgentId) {
      assignedAgentId = autoAssignAgent(body.title, body.description || '');
      if (!assignedAgentId) {
        assignedAgentId = 'ceo'; // 默认分配给 CEO
      }
    }
    
    await env.DB.prepare(`
      INSERT INTO tasks (id, title, description, assigned_agent_id, priority, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).bind(id, body.title, body.description || '', assignedAgentId, body.priority || 'normal').run();
    
    // 记录日志
    const assignedBy = body.assigned_agent_id ? '人工' : '自动';
    await env.DB.prepare(`
      INSERT INTO agent_logs (id, agent_id, task_id, event_type, message)
      VALUES (?, 'ceo', ?, 'created', ?)
    `).bind(uuid(), id, `创建任务: ${body.title} [${assignedBy}分配 -> ${assignedAgentId}]`).run();
    
    return new Response(JSON.stringify({ id, status: 'pending', assigned_agent_id: assignedAgentId }), { headers: { 'Content-Type': 'application/json' } });
  }
  
  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
}

async function handleMessages(request) {
  const url = new URL(request.url);
  const method = request.method;
  
  if (method === 'GET') {
    const agentId = url.searchParams.get('agent');
    const { results } = await env.DB.prepare(`
      SELECT * FROM messages WHERE to_agent_id = ? AND read_at IS NULL
      ORDER BY created_at DESC LIMIT 20
    `).bind(agentId).all();
    return new Response(JSON.stringify({ messages: results }), { headers: { 'Content-Type': 'application/json' } });
  }
  
  if (method === 'POST') {
    const body = await request.json();
    const id = uuid();
    await env.DB.prepare(`
      INSERT INTO messages (id, from_agent_id, to_agent_id, task_id, content)
      VALUES (?, ?, ?, ?, ?)
    `).bind(id, body.from, body.to, body.task_id || null, body.content).run();
    return new Response(JSON.stringify({ id }), { headers: { 'Content-Type': 'application/json' } });
  }
  
  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
}

async function handleLogs(request) {
  const { results } = await env.DB.prepare(`
    SELECT * FROM agent_logs ORDER BY created_at DESC LIMIT 100
  `).all();
  return new Response(JSON.stringify({ logs: results }), { headers: { 'Content-Type': 'application/json' } });
}

// 自动分配测试
async function handleAutoAssign(request) {
  const body = await request.json();
  const assignedAgent = autoAssignAgent(body.title, body.description || '');
  return new Response(JSON.stringify({ 
    title: body.title,
    description: body.description,
    assigned_agent_id: assignedAgent || 'ceo (fallback)',
    confidence: 'keyword matching'
  }), { headers: { 'Content-Type': 'application/json' } });
}

// 获取关键词映射表
async function handleKeywords(request) {
  return new Response(JSON.stringify({ 
    keywords: AGENT_KEYWORDS,
    agents: ['cto', 'cfo', 'cmo', 'cpo', 'sec']
  }), { headers: { 'Content-Type': 'application/json' } });
}


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
      } else if (path === '/api/agents' && method === 'GET') {
        return handleAgents(request);
      } else if (path === '/api/tasks' && method === 'GET') {
        return handleTasks(request);
      } else if (path === '/api/tasks' && method === 'POST') {
        return handleTasks(request);
      } else if (path === '/api/messages' && method === 'GET') {
        return handleMessages(request);
      } else if (path === '/api/messages' && method === 'POST') {
        return handleMessages(request);
      } else if (path === '/api/logs' && method === 'GET') {
        return handleLogs(request);
      } else if (path === '/api/auto-assign' && method === 'POST') {
        return handleAutoAssign(request);
      } else if (path === '/api/keywords' && method === 'GET') {
        return handleKeywords(request);
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
  const sessionId = request.headers.get('x-session-id') || getCookieValue('session_id', request.headers.get('Cookie'));
  
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

// Cron Scheduler - Task Queue Processor
export async function scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<Response> {
  console.log('[Scheduler] Cron triggered at', new Date().toISOString());
  
  try {
    // Fetch pending tasks ordered by priority
    const pendingTasks = await env.DB.prepare(`
      SELECT * FROM tasks 
      WHERE status = 'pending' 
      ORDER BY 
        CASE priority 
          WHEN 'urgent' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'normal' THEN 3 
          ELSE 4 
        END,
        created_at ASC
      LIMIT 10
    `).all();
    
    const tasks = pendingTasks.results || [];
    console.log(`[Scheduler] Found ${tasks.length} pending tasks`);
    
    for (const task of tasks) {
      // Update task status to in_progress
      await env.DB.prepare(`
        UPDATE tasks 
        SET status = 'in_progress', updated_at = datetime('now') 
        WHERE id = ?
      `).bind(task.id).run();
      
      // Log the task processing
      await env.DB.prepare(`
        INSERT INTO agent_logs (id, agent_id, task_id, event_type, message)
        VALUES (?, 'scheduler', ?, 'working', ?)
      `).bind(
        crypto.randomUUID(),
        task.id,
        `Task picked up by scheduler at ${new Date().toISOString()}`
      ).run();
      
      console.log(`[Scheduler] Processing task: ${task.id} - ${task.title}`);
    }
    
    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      processed: tasks.length
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Scheduler] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
