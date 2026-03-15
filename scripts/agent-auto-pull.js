#!/usr/bin/env node
/**
 * THEMACHINE Corp. Agent 自动拉取任务系统
 * 
 * 功能:
 * 1. 每个 Agent 每小时自动检查任务队列
 * 2. 有 pending 任务自动开始执行
 * 3. 支持任务锁定防止重复执行
 * 4. 支持优先级和任务类型过滤
 * 
 * 使用:
 *   node agent-auto-pull.js status              # 查看队列状态
 *   node agent-auto-pull.js list                # 列出所有任务
 *   node agent-auto-pull.js add <agent> <task> # 添加任务
 *   node agent-auto-pull.js pull <agent>       # Agent 拉取任务
 *   node agent-auto-pull.js run                # 运行自动拉取
 *   node agent-auto-pull.js daemon             # 守护进程模式
 *   node agent-auto-pull.js cron               # Cron 模式 (每小时)
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const WORKSPACE = '/home/themachine/.openclaw/workspace';
const SCRIPTS_DIR = path.join(WORKSPACE, 'scripts');
const STATE_DIR = path.join(SCRIPTS_DIR, 'agent-state');
const QUEUE_FILE = path.join(SCRIPTS_DIR, 'task-queue.json');
const LOG_FILE = path.join(SCRIPTS_DIR, 'agent-auto-pull.log');
const LOCK_DIR = path.join(STATE_DIR, 'locks');

// Agent 配置
const AGENTS = {
  cfo: { 
    name: 'CFO', 
    role: '交易主管', 
    tasks: ['交易报告', '资金管理', '收益分析', '交易监控', '风险检查'],
    cron: '0 * * * *'
  },
  cto: { 
    name: 'CTO', 
    role: '技术运维', 
    tasks: ['系统监控', '健康检查', '日志分析', '备份检查', '性能分析'],
    cron: '*/15 * * * *'
  },
  cpo: { 
    name: 'CPO', 
    role: '产品主管', 
    tasks: ['产品规划', 'API维护', '功能开发', '用户反馈', '竞品分析'],
    cron: '0 * * * *'
  },
  cmo: { 
    name: 'CMO', 
    role: '品牌主管', 
    tasks: ['内容生成', '社交媒体', '市场推广', '数据分析', '活动策划'],
    cron: '0 * * * *'
  },
  sec: { 
    name: 'SEC', 
    role: '安全主管', 
    tasks: ['安全审计', '漏洞扫描', '风险评估', '权限检查', '日志审计'],
    cron: '0 * * * *'
  },
  dev: { 
    name: 'DEV', 
    role: '开发主管', 
    tasks: ['代码开发', '项目构建', 'Bug修复', '代码审查', '文档更新'],
    cron: '0 * * * *'
  }
};

// 确保目录存在
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 日志
function log(level, message, data = {}) {
  const entry = {
    time: new Date().toISOString(),
    level,
    message,
    ...data
  };
  const logLine = `[${level}] ${message}`;
  console.log(logLine);
  fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
}

// 队列管理
function loadQueue() {
  try {
    ensureDir(STATE_DIR);
    if (fs.existsSync(QUEUE_FILE)) {
      return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
    }
  } catch (e) {
    log('ERROR', `加载队列失败: ${e.message}`);
  }
  return [];
}

function saveQueue(queue) {
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
}

// 任务锁
function acquireLock(agentId, taskId) {
  ensureDir(LOCK_DIR);
  const lockFile = path.join(LOCK_DIR, `${taskId}.lock`);
  
  if (fs.existsSync(lockFile)) {
    const lock = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
    // 检查锁是否过期 (1小时)
    if (Date.now() - lock.timestamp < 3600000 && lock.agentId !== agentId) {
      return false; // 已被其他 Agent 锁定
    }
  }
  
  fs.writeFileSync(lockFile, JSON.stringify({
    agentId,
    taskId,
    timestamp: Date.now()
  }));
  return true;
}

function releaseLock(taskId) {
  const lockFile = path.join(LOCK_DIR, `${taskId}.lock`);
  if (fs.existsSync(lockFile)) {
    fs.unlinkSync(lockFile);
  }
}

function cleanupLocks() {
  if (!fs.existsSync(LOCK_DIR)) return;
  
  const files = fs.readdirSync(LOCK_DIR);
  const now = Date.now();
  
  for (const file of files) {
    if (!file.endsWith('.lock')) continue;
    
    try {
      const lock = JSON.parse(fs.readFileSync(path.join(LOCK_DIR, file), 'utf8'));
      if (now - lock.timestamp > 3600000) {
        fs.unlinkSync(path.join(LOCK_DIR, file));
        log('INFO', `清理过期锁: ${file}`);
      }
    } catch (e) {}
  }
}

// 添加任务
function addTask(agentId, title, options = {}) {
  const queue = loadQueue();
  
  const task = {
    id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title,
    agentId, // 指定 Agent，为空则任意
    type: options.type || 'auto',
    priority: options.priority || 'normal',
    status: 'pending',
    createdAt: new Date().toISOString(),
    lockedBy: null
  };
  
  queue.push(task);
  saveQueue(queue);
  
  log('INFO', `任务添加: [${task.id}] ${title} -> ${agentId || '任意'}`);
  return task;
}

// 列出任务
function listTasks(filter = {}) {
  const queue = loadQueue();
  
  let filtered = queue;
  
  if (filter.status) {
    filtered = filtered.filter(t => t.status === filter.status);
  }
  
  if (filter.agentId) {
    filtered = filtered.filter(t => t.agentId === filter.agentId || !t.agentId);
  }
  
  return filtered;
}

// Agent 拉取任务
async function pullTask(agentId) {
  const queue = loadQueue();
  
  // 查找该 Agent 的 pending 任务
  // 优先级: 1. 指定给该 Agent 的 2. 任意 Agent 的
  let task = queue.find(t => 
    t.status === 'pending' && 
    (t.agentId === agentId || !t.agentId) &&
    !t.lockedBy
  );
  
  if (!task) {
    log('INFO', `Agent ${agentId}: 没有待处理任务`);
    return null;
  }
  
  // 尝试获取锁
  if (!acquireLock(agentId, task.id)) {
    log('WARN', `Agent ${agentId}: 任务 ${task.id} 被锁定`);
    return null;
  }
  
  // 更新任务状态
  task.status = 'pulled';
  task.pulledBy = agentId;
  task.pulledAt = new Date().toISOString();
  task.lockedBy = agentId;
  
  saveQueue(queue);
  
  log('INFO', `Agent ${agentId} 拉取任务: [${task.id}] ${task.title}`);
  
  return task;
}

// 执行任务
async function executeTask(agentId, task) {
  log('INFO', `Agent ${agentId} 开始执行: ${task.title}`);
  
  // 构造任务提示
  const taskPrompt = `
请执行以下任务:

任务: ${task.title}
优先级: ${task.priority}
类型: ${task.type}

请完成任务并汇报结果。
`;
  
  // 调用 OpenClaw agent
  return new Promise((resolve, reject) => {
    const taskMsg = `请执行以下任务：

任务：${task.title}
类型：${task.type || 'manual'}
优先级：${task.priority || 'normal'}

请完成并汇报结果。`;
    const cmd = `openclaw agent --agent ${agentId} --message "${taskMsg.replace(/"/g, '\"')}" --deliver`;
    
    exec(cmd, { cwd: WORKSPACE, timeout: 300000 }, (error, stdout, stderr) => {
      if (error) {
        log('ERROR', `Agent ${agentId} 执行失败: ${error.message}`);
        reject(error);
        return;
      }
      
      log('INFO', `Agent ${agentId} 任务已启动: ${task.title}`);
      resolve({ success: true, taskId: task.id });
    });
  });
}

// 完成任务
function completeTask(taskId, result = {}) {
  const queue = loadQueue();
  const task = queue.find(t => t.id === taskId);
  
  if (task) {
    task.status = 'completed';
    task.completedAt = new Date().toISOString();
    task.result = result;
    
    releaseLock(taskId);
    saveQueue(queue);
    
    log('INFO', `任务完成: [${taskId}] ${task.title}`);
  }
  
  return task;
}

// 失败任务
function failTask(taskId, error) {
  const queue = loadQueue();
  const task = queue.find(t => t.id === taskId);
  
  if (task) {
    task.status = 'failed';
    task.failedAt = new Date().toISOString();
    task.error = error;
    
    releaseLock(taskId);
    saveQueue(queue);
    
    log('ERROR', `任务失败: [${taskId}] ${task.title} - ${error}`);
  }
  
  return task;
}

// 自动拉取主流程
async function autoPull(agentId) {
  log('INFO', `=== Agent ${agentId} 自动拉取任务 ===`);
  
  // 清理过期锁
  cleanupLocks();
  
  // 拉取任务
  const task = await pullTask(agentId);
  
  if (!task) {
    return { success: false, reason: 'no_task' };
  }
  
  // 执行任务
  try {
    await executeTask(agentId, task);
    return { success: true, task };
  } catch (e) {
    failTask(task.id, e.message);
    return { success: false, error: e.message };
  }
}

// 所有 Agent 自动拉取
async function autoPullAll() {
  log('INFO', '=== 所有 Agent 自动拉取任务 ===');
  
  const results = {};
  
  for (const agentId of Object.keys(AGENTS)) {
    const result = await autoPull(agentId);
    results[agentId] = result;
    
    // 每个 Agent 之间稍作延迟
    await new Promise(r => setTimeout(r, 2000));
  }
  
  const summary = {
    total: Object.keys(AGENTS).length,
    success: Object.values(results).filter(r => r.success).length,
    failed: Object.values(results).filter(r => !r.success).length
  };
  
  log('INFO', `自动拉取完成: ${summary.success}/${summary.total} 成功`);
  
  return summary;
}

// 状态统计
function getStatus() {
  const queue = loadQueue();
  
  const stats = {
    total: queue.length,
    pending: queue.filter(t => t.status === 'pending').length,
    pulled: queue.filter(t => t.status === 'pulled').length,
    completed: queue.filter(t => t.status === 'completed').length,
    failed: queue.filter(t => t.status === 'failed').length
  };
  
  // 每个 Agent 的任务数
  const byAgent = {};
  for (const agentId of Object.keys(AGENTS)) {
    byAgent[agentId] = {
      pending: queue.filter(t => (t.agentId === agentId || !t.agentId) && t.status === 'pending').length,
      completed: queue.filter(t => t.pulledBy === agentId && t.status === 'completed').length
    };
  }
  
  return { stats, byAgent, queue };
}

// Cron 模式
function cronMode() {
  log('INFO', '=== Cron 模式运行 ===');
  
  autoPullAll().then(summary => {
    // 如果有成功的任务，触发后续流程
    if (summary.success > 0) {
      log('INFO', `成功拉取 ${summary.success} 个任务`);
    }
    process.exit(0);
  }).catch(e => {
    log('ERROR', `Cron 运行失败: ${e.message}`);
    process.exit(1);
  });
}

// CLI
const args = process.argv.slice(2);
const command = args[0];

async function main() {
  switch (command) {
    case 'status': {
      const { stats, byAgent } = getStatus();
      console.log('\n=== 任务队列状态 ===\n');
      console.log(`总任务: ${stats.total}`);
      console.log(`待处理: ${stats.pending}`);
      console.log(`执行中: ${stats.pulled}`);
      console.log(`已完成: ${stats.completed}`);
      console.log(`失败: ${stats.failed}`);
      console.log('\n=== 按 Agent 统计 ===\n');
      for (const [agentId, data] of Object.entries(byAgent)) {
        const config = AGENTS[agentId];
        console.log(`${agentId} (${config.name}): ${data.pending} 待处理, ${data.completed} 已完成`);
      }
      break;
    }
    
    case 'list': {
      const filter = {};
      if (args[1]) filter.status = args[1];
      if (args[2]) filter.agentId = args[2];
      
      const tasks = listTasks(filter);
      console.log(`\n=== 任务列表 (${tasks.length}) ===\n`);
      for (const task of tasks) {
        console.log(`[${task.status}] ${task.title}`);
        console.log(`  ID: ${task.id}`);
        console.log(`  Agent: ${task.agentId || '任意'}`);
        console.log(`  优先级: ${task.priority}`);
        console.log(`  创建: ${new Date(task.createdAt).toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai'})}`);
        console.log('');
      }
      break;
    }
    
    case 'add': {
      const agentId = args[1];
      const title = args.slice(2).join(' ');
      
      if (!title) {
        console.log('用法: node agent-auto-pull.js add <agent> <task>');
        console.log('示例: node agent-auto-pull.js add cto "检查服务器健康"');
        process.exit(1);
      }
      
      addTask(agentId || null, title, { type: 'manual' });
      break;
    }
    
    case 'pull': {
      const agentId = args[1];
      if (!agentId) {
        console.log('用法: node agent-auto-pull.js pull <agent>');
        process.exit(1);
      }
      
      await autoPull(agentId);
      break;
    }
    
    case 'run': {
      await autoPullAll();
      break;
    }
    
    case 'daemon': {
      log('INFO', '启动守护进程 (每小时拉取)');
      
      // 立即运行一次
      await autoPullAll();
      
      // 每小时运行
      setInterval(() => {
        autoPullAll();
      }, 60 * 60 * 1000);
      break;
    }
    
    case 'cron': {
      cronMode();
      break;
    }
    
    case 'complete': {
      const taskId = args[1];
      if (!taskId) {
        console.log('用法: node agent-auto-pull.js complete <task-id>');
        process.exit(1);
      }
      completeTask(taskId);
      break;
    }
    
    case 'cleanup': {
      cleanupLocks();
      log('INFO', '锁清理完成');
      break;
    }
    
    default: {
      console.log(`
THEMACHINE Corp. Agent 自动拉取任务系统

用法:
  node agent-auto-pull.js status              # 查看队列状态
  node agent-auto-pull.js list [status]       # 列出任务
  node agent-auto-pull.js add <agent> <task>  # 添加任务
  node agent-auto-pull.js pull <agent>         # Agent 拉取任务
  node agent-auto-pull.js run                  # 所有 Agent 拉取
  node agent-auto-pull.js daemon              # 守护进程模式
  node agent-auto-pull.js cron                 # Cron 模式
  node agent-auto-pull.js complete <id>       # 标记任务完成
  node agent-auto-pull.js cleanup              # 清理过期锁

Agent ID: cfo, cto, cpo, cmo, sec, dev
Status: pending, pulled, completed, failed

示例:
  node agent-auto-pull.js add cto "检查服务器"
  node agent-auto-pull.js add "" "通用任务"
  node agent-auto-pull.js pull cto
  node agent-auto-pull.js list pending
`);
    }
  }
}

main().catch(e => {
  log('ERROR', e.message);
  process.exit(1);
});
