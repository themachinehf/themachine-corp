// Agent 系统 API

const DB = env.DB;

// Agent 能力映射 - 关键词匹配
const AGENT_KEYWORDS = {
  // CTO: 技术、代码、开发、架构、系统、API、部署、数据库
  cto: [
    '技术', '代码', '开发', '编程', '架构', '系统', 'api', 'API', '部署', '数据库',
    'server', '服务器', 'cloudflare', 'wrangler', 'd1', 'database', 'dev',
    'debug', 'bug', 'fix', 'error', 'issue', 'deploy', 'git', 'github',
    'python', 'javascript', 'typescript', 'node', 'rust', 'html', 'css',
    'nextjs', 'next.js', 'react', 'frontend', 'backend', 'fullstack',
    'infrastructure', 'infrastructure', '运维', '监控', 'monitoring'
  ],
  
  // CFO: 交易、财务、投资、资金、收益、网格
  cfo: [
    '交易', '财务', '投资', '资金', '收益', '网格', '量化', 'trading',
    'finance', 'okx', 'binance', 'crypto', '加密货币', 'token', 'coin',
    'profit', 'loss', '盈利', '亏损', '策略', 'strategy', 'backtest',
    '回测', ' portfolio', '仓位', '止损', '止盈', '杠杆', '合约'
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
function autoAssignAgent(title, description) {
  const text = `${title} ${description || ''}`.toLowerCase();
  
  // 统计每个 Agent 的匹配分数
  const scores = {};
  
  for (const [agentId, keywords] of Object.entries(AGENT_KEYWORDS)) {
    scores[agentId] = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        scores[agentId]++;
      }
    }
  }
  
  // 找出最高分数的 Agent
  let bestAgent = null;
  let bestScore = 0;
  
  for (const [agentId, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestAgent = agentId;
    }
  }
  
  // 如果匹配分数 >= 1 才自动分配，否则返回 null（需要人工分配）
  return bestScore >= 1 ? bestAgent : null;
}

// 生成 UUID
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8).toString(16);
  });
}

// 获取所有 Agent
async function getAgents() {
  const { results } = await DB.prepare("SELECT * FROM agents ORDER BY role").all();
  return results;
}

// 获取任务列表
async function getTasks(agentId = null, status = null) {
  let sql = "SELECT * FROM tasks WHERE 1=1";
  const params = [];
  if (agentId) {
    sql += " AND assigned_agent_id = ?";
    params.push(agentId);
  }
  if (status) {
    sql += " AND status = ?";
    params.push(status);
  }
  sql += " ORDER BY priority DESC, created_at DESC LIMIT 50";
  
  const { results } = await DB.prepare(sql).bind(...params).all();
  return results;
}

// 创建任务 - 支持自动分配
async function createTask(title, description, assignedAgentId, priority = 'normal') {
  const id = uuid();
  
  // 如果没有指定 Agent，自动分配
  let finalAgentId = assignedAgentId;
  if (!finalAgentId) {
    finalAgentId = autoAssignAgent(title, description);
    // 如果自动分配失败，记录警告
    if (!finalAgentId) {
      finalAgentId = 'ceo'; // 默认分配给 CEO
    }
  }
  
  await DB.prepare(`
    INSERT INTO tasks (id, title, description, assigned_agent_id, priority, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `).bind(id, title, description, finalAgentId, priority).run();
  
  // 记录日志
  const assignedBy = assignedAgentId ? '人工' : '自动';
  await logEvent('ceo', id, 'created', `创建任务: ${title} [${assignedBy}分配 -> ${finalAgentId}]`);
  
  return { id, title, status: 'pending', assigned_agent_id: finalAgentId };
}

// 更新任务状态
async function updateTask(taskId, status, outputData = null) {
  let sql = "UPDATE tasks SET status = ?, updated_at = datetime('now')";
  const params = [status];
  
  if (outputData) {
    sql += ", output_data = ?";
    params.push(JSON.stringify(outputData));
  }
  
  sql += " WHERE id = ?";
  params.push(taskId);
  
  await DB.prepare(sql).bind(...params).run();
  return { id: taskId, status };
}

// 记录事件
async function logEvent(agentId, taskId, eventType, message) {
  const id = uuid();
  await DB.prepare(`
    INSERT INTO agent_logs (id, agent_id, task_id, event_type, message)
    VALUES (?, ?, ?, ?, ?)
  `).bind(id, agentId, taskId, eventType, message).run();
}

// Agent 间消息 - 支持多种类型
async function sendMessage(fromAgentId, toAgentId, taskId, content, type = 'notification', metadata = null) {
  const id = uuid();
  await DB.prepare(`
    INSERT INTO messages (id, from_agent_id, to_agent_id, task_id, type, content, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(id, fromAgentId, toAgentId, taskId, type, content, metadata ? JSON.stringify(metadata) : null).run();
  return { id, from: fromAgentId, to: toAgentId, task_id: taskId, type, content };
}

// 任务完成通知 - 自动通知相关 Agent
async function notifyTaskComplete(task) {
  const messages = [];
  
  // 通知创建者 (source_agent_id)
  if (task.source_agent_id && task.source_agent_id !== task.assigned_agent_id) {
    const msg = await sendMessage(
      'system',
      task.source_agent_id,
      task.id,
      `✅ 任务已完成: ${task.title}`,
      'notification',
      { status: 'done', task_status: task.status }
    );
    messages.push(msg);
  }
  
  // 如果有 review_by，也通知审查者
  if (task.review_by) {
    const reviewMsg = await sendMessage(
      'system',
      task.review_by,
      task.id,
      `📋 任务需要审查: ${task.title}`,
      'review',
      { task_status: 'review', priority: task.priority }
    );
    messages.push(reviewMsg);
  }
  
  return messages;
}

// Review Loop - 需要审查的任务自动发送给 CEO 或相关 Agent
async function handleReviewLoop(task) {
  // 如果任务状态为 review 且有指定的审查者
  if (task.status === 'review' && task.review_by) {
    await sendMessage(
      'system',
      task.review_by,
      task.id,
      `🔍 审查请求: ${task.title}\n\n${task.description || '无描述'}\n\n请审查并决策。`,
      'review',
      { priority: task.priority, assigned_agent: task.assigned_agent_id }
    );
    return true;
  }
  
  // 如果任务被拒绝/退回，重新分配
  if (task.status === 'rejected' && task.assigned_agent_id) {
    await sendMessage(
      'system',
      task.assigned_agent_id,
      task.id,
      `❌ 任务被退回: ${task.title}\n\n请根据审查意见修改后重新提交。`,
      'escalation',
      { action: 'resubmit' }
    );
    return true;
  }
  
  return false;
}

// 升级任务 - 自动发送给 CEO
async function escalateTask(task, reason) {
  await sendMessage(
    task.assigned_agent_id || 'system',
    'ceo',
    task.id,
    `⚠️ 任务升级: ${task.title}\n\n原因: ${reason}\n\n需要 CEO 决策。`,
    'escalation',
    { priority: 'urgent', original_agent: task.assigned_agent_id }
  );
  
  // 更新任务状态
  await updateTask(task.id, 'escalated');
  
  return { escalated: true, to: 'ceo' };
}

// 广播通知给所有 Agent
async function broadcastNotification(content, metadata = null) {
  const agents = await getAgents();
  const messages = [];
  
  for (const agent of agents) {
    if (agent.id !== 'ceo') { // 不需要通知 CEO 自己是吧
      const msg = await sendMessage(
        'system',
        agent.id,
        null,
        content,
        'notification',
        metadata
      );
      messages.push(msg);
    }
  }
  
  return messages;
}

// 发送请求给另一个 Agent
async function sendRequest(fromAgentId, toAgentId, taskId, requestContent, metadata = null) {
  return await sendMessage(
    fromAgentId,
    toAgentId,
    taskId,
    requestContent,
    'request',
    metadata
  );
}

// 发送响应
async function sendResponse(fromAgentId, toAgentId, taskId, responseContent, metadata = null) {
  return await sendMessage(
    fromAgentId,
    toAgentId,
    taskId,
    responseContent,
    'response',
    metadata
  );
}

// 获取未读消息
async function getMessages(agentId) {
  const { results } = await DB.prepare(`
    SELECT * FROM messages WHERE to_agent_id = ? AND read_at IS NULL
    ORDER BY created_at DESC LIMIT 20
  `).bind(agentId).all();
  return results;
}

// 路由
async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  
  // CORS
  if (method === 'OPTIONS') {
    return new Response('', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };
  
  try {
    // GET /api/agents - 获取所有 Agent
    if (path === '/api/agents' && method === 'GET') {
      const agents = await getAgents();
      return new Response(JSON.stringify({ agents }), { headers: corsHeaders });
    }
    
    // GET /api/tasks - 获取任务列表
    if (path === '/api/tasks' && method === 'GET') {
      const agentId = url.searchParams.get('agent');
      const status = url.searchParams.get('status');
      const tasks = await getTasks(agentId, status);
      return new Response(JSON.stringify({ tasks }), { headers: corsHeaders });
    }
    
    // POST /api/tasks - 创建任务
    if (path === '/api/tasks' && method === 'POST') {
      const body = await request.json();
      const task = await createTask(
        body.title,
        body.description,
        body.assigned_agent_id,
        body.priority || 'normal'
      );
      return new Response(JSON.stringify(task), { headers: corsHeaders });
    }
    
    // PUT /api/tasks/:id - 更新任务（触发通知）
    if (path.startsWith('/api/tasks/') && method === 'PUT') {
      const taskId = path.split('/')[3];
      const body = await request.json();
      
      // 先获取旧任务信息
      const { results: [oldTask] } = await DB.prepare("SELECT * FROM tasks WHERE id = ?").bind(taskId).all();
      
      const task = await updateTask(taskId, body.status, body.output);
      
      // 如果任务完成，触发通知
      if (body.status === 'done' && oldTask) {
        await notifyTaskComplete(oldTask);
      }
      
      // 如果任务进入审查状态，触发 Review Loop
      if ((body.status === 'review' || body.status === 'rejected') && oldTask) {
        await handleReviewLoop({ ...oldTask, status: body.status });
      }
      
      return new Response(JSON.stringify(task), { headers: corsHeaders });
    }
    
    // GET /api/messages - 获取消息
    if (path === '/api/messages' && method === 'GET') {
      const agentId = url.searchParams.get('agent');
      const messages = await getMessages(agentId);
      return new Response(JSON.stringify({ messages }), { headers: corsHeaders });
    }
    
    // POST /api/messages - 发送消息（支持 type）
    if (path === '/api/messages' && method === 'POST') {
      const body = await request.json();
      const msg = await sendMessage(
        body.from,
        body.to,
        body.task_id,
        body.content,
        body.type || 'notification',
        body.metadata
      );
      return new Response(JSON.stringify(msg), { headers: corsHeaders });
    }
    
    // POST /api/notify - 发送通知
    if (path === '/api/notify' && method === 'POST') {
      const body = await request.json();
      const msg = await sendMessage(
        body.from || 'system',
        body.to,
        body.task_id,
        body.content,
        'notification',
        body.metadata
      );
      return new Response(JSON.stringify({ success: true, message: msg }), { headers: corsHeaders });
    }
    
    // POST /api/request - 发送请求
    if (path === '/api/request' && method === 'POST') {
      const body = await request.json();
      const msg = await sendRequest(
        body.from,
        body.to,
        body.task_id,
        body.content,
        body.metadata
      );
      return new Response(JSON.stringify({ success: true, request: msg }), { headers: corsHeaders });
    }
    
    // POST /api/response - 发送响应
    if (path === '/api/response' && method === 'POST') {
      const body = await request.json();
      const msg = await sendResponse(
        body.from,
        body.to,
        body.task_id,
        body.content,
        body.metadata
      );
      return new Response(JSON.stringify({ success: true, response: msg }), { headers: corsHeaders });
    }
    
    // POST /api/escalate - 升级任务
    if (path === '/api/escalate' && method === 'POST') {
      const body = await request.json();
      const { results: [task] } = await DB.prepare("SELECT * FROM tasks WHERE id = ?").bind(body.task_id).all();
      
      if (!task) {
        return new Response(JSON.stringify({ error: 'Task not found' }), { status: 404, headers: corsHeaders });
      }
      
      const result = await escalateTask(task, body.reason);
      return new Response(JSON.stringify(result), { headers: corsHeaders });
    }
    
    // POST /api/broadcast - 广播通知
    if (path === '/api/broadcast' && method === 'POST') {
      const body = await request.json();
      const messages = await broadcastNotification(body.content, body.metadata);
      return new Response(JSON.stringify({ success: true, count: messages.length, messages }), { headers: corsHeaders });
    }
    
    // GET /api/messages/:type - 按类型获取消息
    if (path.startsWith('/api/messages/') && method === 'GET') {
      const msgType = path.split('/')[3];
      const agentId = url.searchParams.get('agent');
      
      let sql = "SELECT * FROM messages WHERE 1=1";
      const params = [];
      
      if (agentId) {
        sql += " AND to_agent_id = ?";
        params.push(agentId);
      }
      
      if (msgType && msgType !== 'all') {
        sql += " AND type = ?";
        params.push(msgType);
      }
      
      sql += " ORDER BY created_at DESC LIMIT 50";
      
      const { results } = await DB.prepare(sql).bind(...params).all();
      return new Response(JSON.stringify({ messages: results, type: msgType }), { headers: corsHeaders });
    }
    
    // GET /api/logs - 获取日志
    if (path === '/api/logs' && method === 'GET') {
      const { results } = await DB.prepare(`
        SELECT * FROM agent_logs ORDER BY created_at DESC LIMIT 100
      `).all();
      return new Response(JSON.stringify({ logs: results }), { headers: corsHeaders });
    }
    
    // POST /api/auto-assign - 测试自动分配（不创建任务）
    if (path === '/api/auto-assign' && method === 'POST') {
      const body = await request.json();
      const assignedAgent = autoAssignAgent(body.title, body.description || '');
      return new Response(JSON.stringify({ 
        title: body.title,
        description: body.description,
        assigned_agent_id: assignedAgent || 'ceo (fallback)',
        confidence: 'keyword matching'
      }), { headers: corsHeaders });
    }
    
    // GET /api/keywords - 获取关键词映射表
    if (path === '/api/keywords' && method === 'GET') {
      return new Response(JSON.stringify({ 
        keywords: AGENT_KEYWORDS,
        agents: ['cto', 'cfo', 'cmo', 'cpo', 'sec']
      }), { headers: corsHeaders });
    }
    
    return new Response(JSON.stringify({ error: 'Not found' }), { 
      status: 404, 
      headers: corsHeaders 
    });
    
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}

export default {
  async fetch(request, env) {
    global.env = env;
    return handleRequest(request);
  }
};
