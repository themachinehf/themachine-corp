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

// ==================== Dashboard Handlers ====================

// 获取 Dashboard Agent 状态
async function handleDashboardAgents(request, env) {
  const { results: agents } = await env.DB.prepare("SELECT * FROM agents ORDER BY role").all();
  
  // 获取每个 Agent 的任务统计
  const { results: taskStats } = await env.DB.prepare(`
    SELECT 
      assigned_agent_id,
      status,
      COUNT(*) as count
    FROM tasks 
    WHERE assigned_agent_id IS NOT NULL
    GROUP BY assigned_agent_id, status
  `).all();
  
  // 获取每个 Agent 的最近活动时间
  const { results: lastActivity } = await env.DB.prepare(`
    SELECT 
      agent_id,
      MAX(created_at) as last_active
    FROM agent_logs 
    GROUP BY agent_id
  `).all();
  
  // 构建状态映射
  const agentMap = {};
  for (const stat of taskStats) {
    if (!agentMap[stat.assigned_agent_id]) {
      agentMap[stat.assigned_agent_id] = {
        pending: 0,
        in_progress: 0,
        review: 0,
        done: 0,
        escalated: 0
      };
    }
    agentMap[stat.assigned_agent_id][stat.status] = stat.count;
  }
  
  const lastActiveMap = {};
  for (const activity of lastActivity) {
    lastActiveMap[activity.agent_id] = activity.last_active;
  }
  
  // 合并数据
  const result = agents.map(Agent => ({
    ...Agent,
    tasks: agentMap[Agent.id] || {
      pending: 0,
      in_progress: 0,
      review: 0,
      done: 0,
      escalated: 0
    },
    last_active: lastActiveMap[Agent.id] || null,
    status: lastActiveMap[Agent.id] ? 'active' : 'idle'
  }));
  
  return new Response(JSON.stringify({ agents: result }), { headers: { 'Content-Type': 'application/json' } });
}

// 获取 Dashboard 任务统计
async function handleDashboardStats(request, env) {
  const { results } = await env.DB.prepare(`
    SELECT 
      status,
      priority,
      COUNT(*) as count
    FROM tasks 
    GROUP BY status, priority
    ORDER BY 
      CASE status
        WHEN 'pending' THEN 1
        WHEN 'in_progress' THEN 2
        WHEN 'review' THEN 3
        WHEN 'done' THEN 4
        WHEN 'escalated' THEN 5
        ELSE 6
      END,
      CASE priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'normal' THEN 3
        WHEN 'low' THEN 4
        ELSE 5
      END
  `).all();
  
  const stats = {
    pending: 0,
    in_progress: 0,
    review: 0,
    done: 0,
    escalated: 0,
    by_priority: {}
  };
  
  for (const row of results) {
    stats[row.status] = (stats[row.status] || 0) + row.count;
    if (!stats.by_priority[row.priority]) {
      stats.by_priority[row.priority] = 0;
    }
    stats.by_priority[row.priority]++;
  }
  
  return new Response(JSON.stringify({ stats }), { headers: { 'Content-Type': 'application/json' } });
}

// 获取 Dashboard 任务列表
async function handleDashboardTasks(request, env) {
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const agentId = url.searchParams.get('agent');
  const priority = url.searchParams.get('priority');
  
  let sql = "SELECT t.*, a.name as agent_name, a.emoji as agent_emoji FROM tasks t LEFT JOIN agents a ON t.assigned_agent_id = a.id WHERE 1=1";
  const params = [];
  
  if (status) {
    sql += " AND t.status = ?";
    params.push(status);
  }
  if (agentId) {
    sql += " AND t.assigned_agent_id = ?";
    params.push(agentId);
  }
  if (priority) {
    sql += " AND t.priority = ?";
    params.push(priority);
  }
  
  sql += " ORDER BY t.priority DESC, t.created_at DESC LIMIT 100";
  
  const { results } = await env.DB.prepare(sql).bind(...params).all();
  return new Response(JSON.stringify({ tasks: results }), { headers: { 'Content-Type': 'application/json' } });
}

// 创建 Dashboard 任务
async function handleDashboardCreateTask(request, env) {
  const body = await request.json();
  const id = uuid();
  
  await env.DB.prepare(`
    INSERT INTO tasks (id, title, description, assigned_agent_id, priority, status, source_agent_id)
    VALUES (?, ?, ?, ?, ?, 'pending', ?)
  `).bind(
    id, 
    body.title, 
    body.description || '', 
    body.assigned_agent_id || 'ceo', 
    body.priority || 'normal',
    body.source_agent_id || 'system'
  ).run();
  
  // 记录日志
  await env.DB.prepare(`
    INSERT INTO agent_logs (id, agent_id, task_id, event_type, message)
    VALUES (?, ?, ?, 'created', ?)
  `).bind(uuid(), 'system', id, `创建任务: ${body.title} [分配给 ${body.assigned_agent_id || 'ceo'}]`).run();
  
  return new Response(JSON.stringify({ id, title: body.title, status: 'pending', assigned_agent_id: body.assigned_agent_id || 'ceo' }), { headers: { 'Content-Type': 'application/json' } });
}

// 更新 Dashboard 任务
async function handleDashboardUpdateTask(request, env, taskId) {
  const body = await request.json();
  
  let sql = "UPDATE tasks SET status = ?, updated_at = datetime('now')";
  const params = [body.status];
  
  if (body.output) {
    sql += ", output_data = ?";
    params.push(JSON.stringify(body.output));
  }
  
  sql += " WHERE id = ?";
  params.push(taskId);
  
  await env.DB.prepare(sql).bind(...params).run();
  
  // 记录日志
  await env.DB.prepare(`
    INSERT INTO agent_logs (id, agent_id, task_id, event_type, message)
    VALUES (?, ?, ?, 'status_changed', ?)
  `).bind(uuid(), 'system', taskId, `任务状态更新: ${body.status}`).run();
  
  return new Response(JSON.stringify({ id: taskId, status: body.status }), { headers: { 'Content-Type': 'application/json' } });
}

// 获取 Dashboard 日志
async function handleDashboardLogs(request, env) {
  const url = new URL(request.url);
  const agentId = url.searchParams.get('agent');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  
  let sql = "SELECT l.*, a.name as agent_name, a.emoji as agent_emoji FROM agent_logs l LEFT JOIN agents a ON l.agent_id = a.id WHERE 1=1";
  const params = [];
  
  if (agentId) {
    sql += " AND l.agent_id = ?";
    params.push(agentId);
  }
  
  sql += " ORDER BY l.created_at DESC LIMIT ?";
  params.push(limit);
  
  const { results } = await env.DB.prepare(sql).bind(...params).all();
  return new Response(JSON.stringify({ logs: results }), { headers: { 'Content-Type': 'application/json' } });
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

      const dashboardHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>THEMACHINE Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <style>
    :root {
      --bg-primary: #0a0a0f;
      --bg-secondary: #12121a;
      --bg-card: #1a1a24;
      --bg-card-hover: #222230;
      --gold-primary: #fbbf24;
      --gold-secondary: #fcd34d;
      --gold-muted: #b45309;
      --gold-glow: rgba(251, 191, 36, 0.15);
      --text-primary: #e5e7eb;
      --text-secondary: #9ca3af;
      --text-muted: #6b7280;
      --accent-blue: #60a5fa;
      --accent-green: #4ade80;
      --accent-red: #f87171;
      --accent-purple: #a78bfa;
      --border-color: rgba(251, 191, 36, 0.12);
      --border-glow: rgba(251, 191, 36, 0.25);
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      background: var(--bg-primary);
      color: var(--text-primary);
      font-family: 'Courier New', Courier, monospace;
      min-height: 100vh;
      line-height: 1.6;
      background-image: 
        radial-gradient(ellipse at 20% 0%, rgba(251, 191, 36, 0.08) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 100%, rgba(96, 165, 250, 0.05) 0%, transparent 50%);
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 40px 24px;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 48px;
      animation: fadeInDown 0.6s ease-out;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .logo-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, var(--gold-primary), var(--gold-secondary));
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      box-shadow: 0 4px 24px var(--gold-glow);
    }

    .logo-text {
      font-size: 28px;
      font-weight: 700;
      background: linear-gradient(135deg, var(--gold-primary), var(--gold-secondary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.5px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .btn {
      padding: 10px 20px;
      border-radius: 8px;
      font-family: 'Courier New', Courier, monospace;
      font-weight: 500;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.3s ease;
      border: none;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--gold-primary), var(--gold-secondary));
      color: var(--bg-primary);
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px var(--gold-glow);
    }

    .btn-secondary {
      background: var(--bg-card);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
    }

    .btn-secondary:hover {
      border-color: var(--gold-muted);
      background: var(--bg-card-hover);
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 48px;
    }

    .stat-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 24px;
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease;
      animation: fadeInUp 0.6s ease-out backwards;
    }

    .stat-card:nth-child(1) { animation-delay: 0.1s; }
    .stat-card:nth-child(2) { animation-delay: 0.2s; }
    .stat-card:nth-child(3) { animation-delay: 0.3s; }
    .stat-card:nth-child(4) { animation-delay: 0.4s; }

    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--gold-primary), var(--gold-secondary));
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .stat-card:hover {
      border-color: var(--border-glow);
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
    }

    .stat-card:hover::before {
      opacity: 1;
    }

    .stat-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      margin-bottom: 16px;
    }

    .stat-icon.pending { background: rgba(248, 113, 113, 0.15); }
    .stat-icon.progress { background: rgba(96, 165, 250, 0.15); }
    .stat-icon.done { background: rgba(74, 222, 128, 0.15); }
    .stat-icon.escalated { background: rgba(167, 139, 250, 0.15); }

    .stat-number {
      font-family: 'Courier New', Courier, monospace;
      font-size: 36px;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1;
    }

    .stat-label {
      font-size: 14px;
      color: var(--text-secondary);
      margin-top: 8px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    /* Section Headers */
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .section-title {
      font-size: 20px;
      font-weight: 600;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .section-title::before {
      content: '';
      width: 4px;
      height: 24px;
      background: linear-gradient(180deg, var(--gold-primary), var(--gold-secondary));
      border-radius: 2px;
    }

    /* Agents Grid */
    .agents-section {
      margin-bottom: 48px;
    }

    .agents-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }

    .agent-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 24px;
      transition: all 0.3s ease;
      animation: fadeInUp 0.6s ease-out backwards;
    }

    .agent-card:hover {
      border-color: var(--gold-muted);
      transform: translateY(-4px);
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.3);
    }

    .agent-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
    }

    .agent-avatar {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      background: linear-gradient(135deg, var(--bg-secondary), var(--bg-card-hover));
      border: 1px solid var(--border-color);
    }

    .agent-info h3 {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 4px;
    }

    .agent-role {
      font-size: 13px;
      color: var(--gold-primary);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .agent-status {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      margin-top: 8px;
    }

    .agent-status.active {
      background: rgba(74, 222, 128, 0.15);
      color: var(--accent-green);
    }

    .agent-status.idle {
      background: rgba(161, 161, 170, 0.15);
      color: var(--text-muted);
    }

    .agent-status::before {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }

    .agent-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      padding-top: 16px;
      border-top: 1px solid var(--border-color);
    }

    .agent-stat {
      text-align: center;
    }

    .agent-stat-num {
      font-family: 'Courier New', Courier, monospace;
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .agent-stat-label {
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .agent-last-active {
      margin-top: 16px;
      font-size: 12px;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* Tasks Section */
    .tasks-section {
      margin-bottom: 48px;
    }

    .tasks-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .task-item {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      transition: all 0.3s ease;
      animation: fadeInUp 0.5s ease-out backwards;
    }

    .task-item:hover {
      border-color: var(--gold-muted);
      background: var(--bg-card-hover);
    }

    .task-priority {
      width: 8px;
      height: 40px;
      border-radius: 4px;
    }

    .task-priority.urgent { background: var(--accent-red); }
    .task-priority.high { background: var(--accent-purple); }
    .task-priority.normal { background: var(--accent-blue); }
    .task-priority.low { background: var(--text-muted); }

    .task-content {
      flex: 1;
    }

    .task-title {
      font-size: 15px;
      font-weight: 500;
      color: var(--text-primary);
      margin-bottom: 4px;
    }

    .task-meta {
      font-size: 12px;
      color: var(--text-muted);
      display: flex;
      gap: 16px;
    }

    .task-status {
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }

    .task-status.pending { background: rgba(248, 113, 113, 0.15); color: var(--accent-red); }
    .task-status.in_progress { background: rgba(96, 165, 250, 0.15); color: var(--accent-blue); }
    .task-status.done { background: rgba(74, 222, 128, 0.15); color: var(--accent-green); }

    /* Loading State */
    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 60px;
      color: var(--text-muted);
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--border-color);
      border-top-color: var(--gold-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    /* Animations */
    @keyframes fadeInDown {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .pulse {
      animation: pulse 2s ease-in-out infinite;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .container { padding: 24px 16px; }
      .header { flex-direction: column; gap: 20px; text-align: center; }
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .agents-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <div class="logo">
        <div class="logo-icon">👁️</div>
        <span class="logo-text">THEMACHINE</span>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary" onclick="refreshData()">🔄 刷新</button>
        <button class="btn btn-primary" onclick="createTask()">+ 新建任务</button>
      </div>
    </header>

    <section class="stats-grid" id="stats">
      <div class="stat-card">
        <div class="stat-icon pending">⏳</div>
        <div class="stat-number" id="stat-pending">-</div>
        <div class="stat-label">待处理</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon progress">⚡</div>
        <div class="stat-number" id="stat-progress">-</div>
        <div class="stat-label">进行中</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon done">✓</div>
        <div class="stat-number" id="stat-done">-</div>
        <div class="stat-label">已完成</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon escalated">🔺</div>
        <div class="stat-number" id="stat-escalated">-</div>
        <div class="stat-label">已升级</div>
      </div>
    </section>

    <section class="agents-section">
      <div class="section-header">
        <h2 class="section-title">Agent 团队</h2>
      </div>
      <div class="agents-grid" id="agents">
        <div class="loading"><div class="loading-spinner"></div></div>
      </div>
    </section>

    <section class="tasks-section">
      <div class="section-header">
        <h2 class="section-title">最近任务</h2>
      </div>
      <div class="tasks-list" id="tasks">
        <div class="loading"><div class="loading-spinner"></div></div>
      </div>
    </section>
  </div>

  <script>
    const API = "https://themachine-auth.jxs66.workers.dev";

    // 格式化时间
    function formatTime(timestamp) {
      if (!timestamp) return '从未活跃';
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;
      
      if (diff < 60000) return '刚刚';
      if (diff < 3600000) return Math.floor(diff / 60000) + ' 分钟前';
      if (diff < 86400000) return Math.floor(diff / 3600000) + ' 小时前';
      return date.toLocaleDateString('zh-CN');
    }

    // 加载数据
    async function loadData() {
      try {
        const [statsRes, agentsRes, tasksRes] = await Promise.all([
          fetch(API + "/api/dashboard/stats").then(r => r.json()),
          fetch(API + "/api/dashboard/agents").then(r => r.json()),
          fetch(API + "/api/dashboard/tasks?status=pending").then(r => r.json())
        ]);

        // 更新统计
        document.getElementById('stat-pending').textContent = statsRes.stats?.pending || 0;
        document.getElementById('stat-progress').textContent = statsRes.stats?.in_progress || 0;
        document.getElementById('stat-done').textContent = statsRes.stats?.done || 0;
        document.getElementById('stat-escalated').textContent = statsRes.stats?.escalated || 0;

        // Agent 角色中文映射
        const roleNames = {
          'ceo': '首席执行官',
          'cfo': '财务主管', 
          'cto': '技术主管',
          'cpo': '产品主管',
          'cmo': '市场主管',
          'sec': '安全主管',
          'dev': '开发主管'
        };

        // 渲染 Agents
        const agentsContainer = document.getElementById('agents');
        if (agentsRes.agents && agentsRes.agents.length > 0) {
          agentsContainer.innerHTML = agentsRes.agents.map((agent, i) => {
            const status = agent.last_active ? 'active' : 'idle';
            const lastActive = formatTime(agent.last_active);
            return \`
              <div class="agent-card" style="animation-delay: \${i * 0.1}s">
                <div class="agent-header">
                  <div class="agent-avatar">\${agent.emoji || '🤖'}</div>
                  <div class="agent-info">
                    <h3>\${agent.name}</h3>
                    <div class="agent-role">\${roleNames[agent.role] || agent.role}</div>
                    <div class="agent-status \${status}">\${status === 'active' ? '在线' : '空闲'}</div>
                  </div>
                </div>
                <div class="agent-stats">
                  <div class="agent-stat">
                    <div class="agent-stat-num">\${agent.tasks?.pending || 0}</div>
                    <div class="agent-stat-label">待处理</div>
                  </div>
                  <div class="agent-stat">
                    <div class="agent-stat-num">\${agent.tasks?.in_progress || 0}</div>
                    <div class="agent-stat-label">进行中</div>
                  </div>
                  <div class="agent-stat">
                    <div class="agent-stat-num">\${agent.tasks?.done || 0}</div>
                    <div class="agent-stat-label">已完成</div>
                  </div>
                </div>
                <div class="agent-last-active">🕐 最后活跃: \${lastActive}</div>
              </div>
            \`;
          }).join('');
        } else {
          agentsContainer.innerHTML = '<p style="color: var(--text-muted); padding: 20px;">暂无 Agent 数据</p>';
        }

        // 渲染 Tasks
        const tasksContainer = document.getElementById('tasks');
        if (tasksRes.tasks && tasksRes.tasks.length > 0) {
          tasksContainer.innerHTML = tasksRes.tasks.map((task, i) => \`
            <div class="task-item" style="animation-delay: \${i * 0.05}s">
              <div class="task-priority \${task.priority}"></div>
              <div class="task-content">
                <div class="task-title">\${task.title}</div>
                <div class="task-meta">
                  <span>👤 \${task.agent_name || task.assigned_agent_id}</span>
                  <span>📅 \${new Date(task.created_at).toLocaleDateString('zh-CN')}</span>
                </div>
              </div>
              <div class="task-status \${task.status}">\${task.status === 'pending' ? '待处理' : task.status === 'in_progress' ? '进行中' : task.status}</div>
            </div>
          \`).join('');
        } else {
          tasksContainer.innerHTML = '<p style="color: var(--text-muted); padding: 20px;">暂无任务</p>';
        }

      } catch(e) {
        console.error('Load error:', e);
        document.getElementById('stats').innerHTML = '<p style="color: var(--accent-red);">加载失败: ' + e.message + '</p>';
      }
    }

    function refreshData() {
      loadData();
    }

    function createTask() {
      const title = prompt('任务标题:');
      if (!title) return;
      const priority = prompt('优先级 (urgent/high/normal/low):', 'normal') || 'normal';
      
      fetch(API + '/api/dashboard/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, priority })
      }).then(r => r.json()).then(data => {
        alert('任务创建成功!');
        loadData();
      });
    }

    loadData();
  </script>
</body>
</html>`;
const officeHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Office</title></head><body><h1>Loading...</h1></body></html>`;

      // 静态文件
      if (path === '/dashboard.html') {
        return new Response(dashboardHtml, { headers: { 'Content-Type': 'text/html' } });
      }
      if (path === '/office.html') {
        return new Response(officeHtml, { headers: { 'Content-Type': 'text/html' } });
      }

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
      } else if (path === '/api/dashboard/agents' && method === 'GET') {
        return handleDashboardAgents(request, env);
      } else if (path === '/api/dashboard/stats' && method === 'GET') {
        return handleDashboardStats(request, env);
      } else if (path === '/api/dashboard/tasks' && method === 'GET') {
        return handleDashboardTasks(request, env);
      } else if (path === '/api/dashboard/tasks' && method === 'POST') {
        return handleDashboardCreateTask(request, env);
      } else if (path.startsWith('/api/dashboard/tasks/') && method === 'PUT') {
        const taskId = path.split('/').pop();
        return handleDashboardUpdateTask(request, env, taskId);
      } else if (path === '/api/dashboard/logs' && method === 'GET') {
        return handleDashboardLogs(request, env);
      } else if (path === '/api/auth/chat' && method === 'POST') {
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
