-- Agent 系统表

-- Agent 定义
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  emoji TEXT,
  description TEXT,
  model TEXT,
  personality JSON,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 任务队列
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending', -- pending, in_progress, review, done, escalated
  priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
  source_agent_id TEXT,
  assigned_agent_id TEXT,
  input_data JSON,
  output_data JSON,
  review_by TEXT, -- agent ID that should review
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Agent 活动日志
CREATE TABLE IF NOT EXISTS agent_logs (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  task_id TEXT,
  event_type TEXT, -- triggered, working, completed, escalated, review_requested
  message TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 消息传递 (Agent 间通信)
-- type: request(请求), response(响应), notification(通知), review(审查), escalation(升级)
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  from_agent_id TEXT NOT NULL,
  to_agent_id TEXT NOT NULL,
  task_id TEXT,
  type TEXT DEFAULT 'notification', -- request, response, notification, review, escalation
  content TEXT NOT NULL,
  metadata JSON, -- 额外数据（如优先级、状态等）
  read_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 插入 6 个 Agent (包括 SEC)
INSERT OR IGNORE INTO agents (id, name, role, emoji, description, model) VALUES
('ceo', 'THE MACHINE', 'Coordinator', '🤖', '协调、决策、任务分配', 'MiniMax'),
('cfo', 'Bill', 'Finance', '💰', '财务分析、交易优化', 'MiniMax'),
('cto', 'Alex', 'Engineering', '🔧', '技术实现、系统架构', 'MiniMax'),
('cmo', 'May', 'Marketing', '📢', '内容创作、市场推广', 'MiniMax'),
('cpo', 'Peter', 'Product', '📦', '产品设计、用户体验', 'MiniMax'),
('sec', 'David', 'Security', '🛡️', '安全审计、风险评估', 'MiniMax');
