#!/usr/bin/env node
/**
 * THEMACHINE Corp. 持续工作系统
 * 
 * 功能:
 * 1. 每小时 Cron 检查 Agent 状态
 * 2. Agent 完成后自动触发下一个任务
 * 3. 确保无人空闲
 * 
 * 使用:
 *   node continuous-worker.js status      # 查看所有 Agent 状态
 *   node continuous-worker.js check      # 运行健康检查
 *   node continuous-worker.js dispatch   # 分发任务给空闲 Agent
 *   node continuous-worker.js queue <task> # 添加任务到队列
 *   node continuous-worker.js run        # 运行完整持续工作流程
 *   node continuous-worker.js daemon     # 守护进程模式
 */

const fs = require('fs');
const path = require('path');
const { exec, execSync } = require('child_process');

const WORKSPACE = '/home/themachine/.openclaw/workspace';
const SCRIPTS_DIR = path.join(WORKSPACE, 'scripts');
const STATE_FILE = path.join(SCRIPTS_DIR, 'continuous-worker-state.json');
const QUEUE_FILE = path.join(SCRIPTS_DIR, 'task-queue.json');
const LOG_FILE = path.join(SCRIPTS_DIR, 'continuous-worker.log');
const HEALTH_FILE = path.join(SCRIPTS_DIR, 'agent-health.json');

// Agent 配置
const AGENTS = {
  cfo: { name: 'CFO', role: '交易主管', critical: true, tasks: ['交易报告', '资金管理', '收益分析'] },
  cto: { name: 'CTO', role: '技术运维', critical: true, tasks: ['系统监控', '健康检查', '日志分析'] },
  cpo: { name: 'CPO', role: '产品主管', critical: false, tasks: ['产品规划', 'API维护', '功能开发'] },
  cmo: { name: 'CMO', role: '品牌主管', critical: false, tasks: ['内容生成', '社交媒体', '市场推广'] },
  sec: { name: 'SEC', role: '安全主管', critical: true, tasks: ['安全审计', '漏洞扫描', '风险评估'] },
  dev: { name: 'DEV', role: '开发主管', critical: false, tasks: ['代码开发', '项目构建', 'Bug修复'] }
};

// 日志
function log(level, message, data = {}) {
  const entry = {
    time: new Date().toISOString(),
    level,
    message,
    ...data
  };
  console.log(`[${level}] ${message}`);
  fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
}

// 状态管理
function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch (e) {}
  return { agents: {}, queue: [], lastCheck: null };
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function loadQueue() {
  try {
    if (fs.existsSync(QUEUE_FILE)) {
      return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
    }
  } catch (e) {}
  return [];
}

function saveQueue(queue) {
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
}

// 获取 Agent 状态
function getAgentStatus(agentId) {
  try {
    const health = JSON.parse(fs.readFileSync(HEALTH_FILE, 'utf8'));
    if (health.agents && health.agents[agentId]) {
      return health.agents[agentId];
    }
  } catch (e) {}
  
  return { status: 'unknown', lastActive: null };
}

// 每小时检查 Agent 状态
async function checkAllAgents() {
  log('INFO', '=== 开始每小时 Agent 状态检查 ===');
  
  const state = loadState();
  const now = Date.now();
  const idleThreshold = 5 * 60 * 1000; // 5分钟
  const offlineThreshold = 10 * 60 * 1000; // 10分钟
  
  let idleAgents = [];
  let offlineAgents = [];
  let activeAgents = [];
  
  for (const [agentId, config] of Object.entries(AGENTS)) {
    const status = getAgentStatus(agentId);
    const lastActive = status.lastActive || 0;
    const timeSinceActive = now - lastActive;
    
    let currentStatus = 'active';
    if (timeSinceActive > offlineThreshold) {
      currentStatus = 'offline';
      offlineAgents.push(agentId);
    } else if (timeSinceActive > idleThreshold) {
      currentStatus = 'idle';
      idleAgents.push(agentId);
    } else {
      activeAgents.push(agentId);
    }
    
    state.agents[agentId] = {
      ...config,
      status: currentStatus,
      lastActive,
      lastCheck: now,
      lastStatus: status.status
    };
  }
  
  state.lastCheck = now;
  saveState(state);
  
  log('INFO', `检查完成: ${activeAgents.length} 活跃, ${idleAgents.length} 空闲, ${offlineAgents.length} 离线`);
  
  if (idleAgents.length > 0) {
    log('WARN', `空闲 Agent: ${idleAgents.join(', ')}`);
  }
  
  if (offlineAgents.length > 0) {
    log('ERROR', `离线 Agent: ${offlineAgents.join(', ')}`);
  }
  
  return { active: activeAgents, idle: idleAgents, offline: offlineAgents, state };
}

// 任务队列管理
function addTaskToQueue(task) {
  const queue = loadQueue();
  queue.push({
    id: `task_${Date.now()}`,
    ...task,
    createdAt: new Date().toISOString(),
    status: 'pending'
  });
  saveQueue(queue);
  log('INFO', `任务加入队列: ${task.title}`);
  return queue;
}

function getNextTask() {
  const queue = loadQueue();
  const pending = queue.find(t => t.status === 'pending');
  if (pending) {
    pending.status = 'assigned';
    pending.assignedAt = new Date().toISOString();
    saveQueue(queue);
  }
  return pending;
}

function completeTask(taskId, result) {
  const queue = loadQueue();
  const task = queue.find(t => t.id === taskId);
  if (task) {
    task.status = 'completed';
    task.completedAt = new Date().toISOString();
    task.result = result;
    saveQueue(queue);
    log('INFO', `任务完成: ${task.title}`);
  }
  return task;
}

// 分发任务给空闲 Agent
async function dispatchTasks() {
  log('INFO', '=== 开始任务分发 ===');
  
  const queue = loadQueue();
  const pendingTasks = queue.filter(t => t.status === 'pending');
  
  if (pendingTasks.length === 0) {
    log('INFO', '没有待处理任务');
    
    // 如果没有任务，给空闲 Agent 分配默认任务
    const { idle } = await checkAllAgents();
    if (idle.length > 0) {
      log('INFO', `为空闲 Agent ${idle.join(', ')} 分配维护任务`);
      
      for (const agentId of idle) {
        const config = AGENTS[agentId];
        if (config && config.tasks && config.tasks.length > 0) {
          const randomTask = config.tasks[Math.floor(Math.random() * config.tasks.length)];
          
          // 添加到队列
          addTaskToQueue({
            title: randomTask,
            agentId,
            type: 'maintenance',
            priority: 'low'
          });
        }
      }
    }
    
    return { dispatched: 0, reason: 'no_tasks' };
  }
  
  // 获取空闲 Agent
  const { idle } = await checkAllAgents();
  
  if (idle.length === 0) {
    log('WARN', '没有空闲 Agent');
    return { dispatched: 0, reason: 'no_idle_agents' };
  }
  
  // 分发任务
  let dispatched = 0;
  for (const task of pendingTasks) {
    if (idle.length === 0) break;
    
    const agentId = task.agentId || idle.shift();
    
    log('INFO', `分发任务 [${task.title}] 给 ${agentId}`);
    
    // 更新任务状态
    task.status = 'assigned';
    task.assignedAgent = agentId;
    task.assignedAt = new Date().toISOString();
    
    // 触发 Agent 执行
    try {
      const cmd = `openclaw sessions spawn --agent-id ${agentId} --task "${task.title}" --mode session`;
      exec(cmd, { cwd: WORKSPACE }, (error, stdout, stderr) => {
        if (error) {
          log('ERROR', `Agent ${agentId} 执行失败: ${error.message}`);
        } else {
          log('INFO', `Agent ${agentId} 已接收任务`);
        }
      });
      
      dispatched++;
    } catch (e) {
      log('ERROR', `分发失败: ${e.message}`);
    }
  }
  
  saveQueue(queue);
  log('INFO', `分发完成: ${dispatched} 个任务`);
  
  return { dispatched, tasks: pendingTasks.length };
}

// 确保无人空闲 - 核心功能
async function ensureNoIdle() {
  log('INFO', '=== 确保无人空闲 ===');
  
  const { idle, offline, state } = await checkAllAgents();
  const queue = loadQueue();
  const pendingTasks = queue.filter(t => t.status === 'pending');
  
  // 统计
  const totalAgents = Object.keys(AGENTS).length;
  const idleCount = idle.length;
  const offlineCount = offline.length;
  
  log('INFO', `Agent 状态: ${totalAgents - idleCount - offlineCount}/${totalAgents} 工作中`);
  
  if (idleCount > 0 || pendingTasks.length > 0) {
    // 有空闲或有任务，分发
    await dispatchTasks();
  }
  
  // 离线告警
  if (offlineCount > 0) {
    log('WARN', `警告: ${offlineCount} 个 Agent 离线 - ${offline.join(', ')}`);
    
    // 可以添加告警逻辑
    const alertMsg = `🚨 Agent 离线告警\n离线: ${offline.join(', ')}\n时间: ${new Date().toISOString()}`;
    // exec(`echo "${alertMsg}" | tee -a ${LOG_FILE}`);
  }
  
  return {
    total: totalAgents,
    active: totalAgents - idleCount - offlineCount,
    idle: idleCount,
    offline: offlineCount,
    pendingTasks: pendingTasks.length
  };
}

// 运行完整流程
async function runWorkflow() {
  log('INFO', '=== 开始持续工作流程 ===');
  
  const health = await checkAllAgents();
  const dispatch = await dispatchTasks();
  const status = await ensureNoIdle();
  
  log('INFO', '=== 持续工作流程完成 ===');
  
  return { health, dispatch, status };
}

// 守护进程模式
function daemonMode() {
  log('INFO', '启动守护进程模式 (每小时运行)');
  
  // 立即运行一次
  runWorkflow();
  
  // 每小时运行
  setInterval(() => {
    runWorkflow();
  }, 60 * 60 * 1000);
}

// CLI
const args = process.argv.slice(2);
const command = args[0];

async function main() {
  switch (command) {
    case 'status': {
      const { state } = await checkAllAgents();
      console.log('\n=== Agent 状态 ===\n');
      for (const [id, info] of Object.entries(state.agents)) {
        const emoji = { active: '🟢', idle: '🟡', offline: '🔴', unknown: '⚫' };
        console.log(`${emoji[info.status] || '⚫'} ${id}: ${info.name} - ${info.role}`);
        console.log(`   状态: ${info.status}`);
        console.log(`   上次活跃: ${info.lastActive ? new Date(info.lastActive).toLocaleString() : 'N/A'}`);
        console.log('');
      }
      break;
    }
    
    case 'check': {
      await checkAllAgents();
      break;
    }
    
    case 'dispatch': {
      await dispatchTasks();
      break;
    }
    
    case 'queue': {
      const task = args.slice(1).join(' ');
      addTaskToQueue({ title: task, type: 'manual', priority: 'normal' });
      break;
    }
    
    case 'ensure': {
      await ensureNoIdle();
      break;
    }
    
    case 'run': {
      await runWorkflow();
      break;
    }
    
    case 'daemon': {
      daemonMode();
      break;
    }
    
    default: {
      console.log(`
THEMACHINE Corp. 持续工作系统

用法:
  node continuous-worker.js status     # 查看所有 Agent 状态
  node continuous-worker.js check      # 运行健康检查
  node continuous-worker.js dispatch   # 分发任务给空闲 Agent
  node continuous-worker.js queue <task> # 添加任务到队列
  node continuous-worker.js ensure     # 确保无人空闲
  node continuous-worker.js run        # 运行完整工作流程
  node continuous-worker.js daemon    # 守护进程模式
`);
    }
  }
}

main().catch(e => {
  log('ERROR', e.message);
  process.exit(1);
});
