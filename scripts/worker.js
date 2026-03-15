#!/usr/bin/env node
/**
 * THEMACHINE Corp. Multi-Agent Controller - Enhanced Edition
 * 
 * Features:
 * - Retry logic with exponential backoff (3 retries, 2^n seconds)
 * - Agent health check (track last active time, mark idle/offline)
 * - Graceful degradation (partial failures don't stop the system)
 * - Message trace_id for each task
 * 
 * Usage:
 *   node worker.js spawn <agent> <task>
 *   node worker.js list
 *   node worker.js health
 *   node worker.js send <agent> <message>
 *   node worker.js kill <agent>
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const WORKER_DIR = __dirname;
const STATE_FILE = path.join(WORKER_DIR, 'agent-state.json');
const LOG_FILE = path.join(WORKER_DIR, 'worker.log');
const HEALTH_FILE = path.join(WORKER_DIR, 'agent-health.json');

// Configuration
const CONFIG = {
  MAX_RETRIES: 3,
  BASE_DELAY_MS: 1000,  // 1 second base
  MAX_DELAY_MS: 30000,  // 30 seconds max
  HEALTH_CHECK_INTERVAL: 60000,  // 60 seconds
  IDLE_TIMEOUT: 300000,  // 5 minutes
  OFFLINE_TIMEOUT: 600000,  // 10 minutes
};

const AGENT_CONFIGS = {
  cfo: {
    name: 'CFO - 交易主管',
    role: '财务管理、交易策略',
    prompt: '你 是 THEMACHINE Corp. 的 CFO，负责交易管理和资金管理。',
    critical: true
  },
  cto: {
    name: 'CTO - 技术运维',
    role: '系统监控、部署运维',
    prompt: '你 是 THEMACHINE Corp. 的 CTO，负责技术运维和系统安全。',
    critical: true
  },
  cpo: {
    name: 'CPO - 产品主管',
    role: '产品管理、API维护',
    prompt: '你 是 THEMACHINE Corp. 的 CPO，负责产品研发和项目管理。',
    critical: false
  },
  cmo: {
    name: 'CMO - 品牌主管',
    role: '内容运营、品牌推广',
    prompt: '你 是 THEMACHINE Corp. 的 CMO，负责品牌运营和内容营销。',
    critical: false
  },
  sec: {
    name: 'SEC - 安全主管',
    role: '安全审计、风险评估',
    prompt: '你 是 THEMACHINE Corp. 的安全主管，负责安全审计和风险评估。',
    critical: true
  },
  dev: {
    name: 'DEV - 开发主管',
    role: '代码开发、项目构建',
    prompt: '你 是 THEMACHINE Corp. 的开发主管，负责代码开发和项目管理。',
    critical: false
  }
};

// ========== Utility Functions ==========

function generateTraceId() {
  return `trace_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

function log(level, message, data = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data
  };
  const logLine = JSON.stringify(entry) + '\n';
  fs.appendFileSync(LOG_FILE, logLine);
  console.log(`[${level}] ${message}`, data);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getExponentialBackoff(retryCount) {
  const delay = Math.min(
    CONFIG.BASE_DELAY_MS * Math.pow(2, retryCount),
    CONFIG.MAX_DELAY_MS
  );
  return delay + Math.random() * 1000;  // Add jitter
}

// ========== State Management ==========

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch (e) {
    log('WARN', 'Failed to load state', { error: e.message });
  }
  return { agents: {}, tasks: {} };
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function loadHealth() {
  try {
    if (fs.existsSync(HEALTH_FILE)) {
      return JSON.parse(fs.readFileSync(HEALTH_FILE, 'utf8'));
    }
  } catch (e) {}
  return { agents: {}, lastCheck: null };
}

function saveHealth(health) {
  fs.writeFileSync(HEALTH_FILE, JSON.stringify(health, null, 2));
}

// ========== Retry Logic ==========

async function withRetry(fn, options = {}) {
  const {
    maxRetries = CONFIG.MAX_RETRIES,
    taskName = 'task',
    traceId = generateTraceId()
  } = options;

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      log('INFO', `Attempting ${taskName} (attempt ${attempt + 1}/${maxRetries + 1})`, { traceId });
      const result = await fn(attempt);
      
      if (attempt > 0) {
        log('INFO', `Retry successful for ${taskName}`, { traceId, attempts: attempt + 1 });
      }
      
      return { success: true, result, attempts: attempt + 1, traceId };
    } catch (error) {
      lastError = error;
      log('WARN', `Attempt ${attempt + 1} failed for ${taskName}`, { 
        traceId, 
        error: error.message,
        attempt: attempt + 1,
        maxRetries 
      });
      
      if (attempt < maxRetries) {
        const delay = getExponentialBackoff(attempt);
        log('INFO', `Waiting ${Math.round(delay)}ms before retry`, { traceId });
        await sleep(delay);
      }
    }
  }
  
  log('ERROR', `All retries exhausted for ${taskName}`, { traceId, error: lastError?.message });
  return { success: false, error: lastError, attempts: maxRetries + 1, traceId };
}

// ========== Agent Health Check ==========

function updateAgentHealth(agentId, status = 'active') {
  const health = loadHealth();
  const now = Date.now();
  
  if (!health.agents[agentId]) {
    health.agents[agentId] = {
      id: agentId,
      createdAt: now,
      status: 'offline',
      lastActive: null,
      lastChecked: now,
      consecutiveFailures: 0,
      totalTasks: 0,
      successfulTasks: 0
    };
  }
  
  const agent = health.agents[agentId];
  agent.lastChecked = now;
  agent.status = status;
  
  if (status === 'active') {
    agent.lastActive = now;
    agent.consecutiveFailures = 0;
  }
  
  saveHealth(health);
  return agent;
}

function checkAgentHealth(agentId) {
  const health = loadHealth();
  const agent = health.agents[agentId];
  
  if (!agent) {
    return { status: 'unknown', reason: 'No data' };
  }
  
  const now = Date.now();
  const timeSinceActive = now - (agent.lastActive || now);
  const timeSinceChecked = now - (agent.lastChecked || now);
  
  // Determine status
  let status = agent.status;
  
  if (timeSinceActive > CONFIG.OFFLINE_TIMEOUT) {
    status = 'offline';
  } else if (timeSinceActive > CONFIG.IDLE_TIMEOUT) {
    status = 'idle';
  } else if (timeSinceChecked > CONFIG.HEALTH_CHECK_INTERVAL * 2) {
    status = 'stale';
  }
  
  return {
    id: agentId,
    status,
    lastActive: agent.lastActive ? new Date(agent.lastActive).toISOString() : null,
    lastChecked: agent.lastChecked ? new Date(agent.lastChecked).toISOString() : null,
    consecutiveFailures: agent.consecutiveFailures,
    totalTasks: agent.totalTasks,
    successfulTasks: agent.successfulTasks,
    uptime: agent.createdAt ? now - agent.createdAt : 0
  };
}

function recordTaskResult(agentId, success) {
  const health = loadHealth();
  
  if (!health.agents[agentId]) {
    updateAgentHealth(agentId, 'active');
  }
  
  const agent = health.agents[agentId];
  agent.totalTasks++;
  
  if (success) {
    agent.successfulTasks++;
    agent.consecutiveFailures = 0;
  } else {
    agent.consecutiveFailures++;
    
    if (agent.consecutiveFailures >= 3) {
      agent.status = 'degraded';
    }
  }
  
  agent.lastActive = Date.now();
  saveHealth(health);
}

function checkAllAgentsHealth() {
  const health = loadHealth();
  const results = {};
  
  for (const agentId of Object.keys(AGENT_CONFIGS)) {
    results[agentId] = checkAgentHealth(agentId);
  }
  
  health.lastCheck = Date.now();
  saveHealth(health);
  
  return results;
}

// ========== Graceful Degradation ==========

async function executeWithGracefulDegradation(agents, taskFn, options = {}) {
  const { 
    requireAll = false,  // If false, partial success is OK
    traceId = generateTraceId()
  } = options;
  
  const results = {};
  const errors = {};
  let successCount = 0;
  let criticalFailed = false;
  
  for (const agentId of agents) {
    const config = AGENT_CONFIGS[agentId];
    
    try {
      log('INFO', `Executing task for agent ${agentId}`, { traceId, agentId });
      const result = await taskFn(agentId);
      results[agentId] = { success: true, result };
      successCount++;
      
      recordTaskResult(agentId, true);
      updateAgentHealth(agentId, 'active');
      
    } catch (error) {
      log('ERROR', `Agent ${agentId} failed`, { traceId, agentId, error: error.message });
      errors[agentId] = error.message;
      results[agentId] = { success: false, error: error.message };
      
      recordTaskResult(agentId, false);
      
      if (config?.critical) {
        criticalFailed = true;
      }
    }
  }
  
  const overallSuccess = requireAll 
    ? successCount === agents.length 
    : successCount > 0;
  
  log('INFO', `Graceful degradation result`, { 
    traceId, 
    successCount, 
    total: agents.length,
    criticalFailed,
    overallSuccess 
  });
  
  return {
    success: overallSuccess,
    results,
    errors,
    successCount,
    totalCount: agents.length,
    criticalFailed,
    traceId
  };
}

// ========== Agent Operations ==========

async function spawnAgent(agentId, task, options = {}) {
  const { traceId = generateTraceId(), retries = CONFIG.MAX_RETRIES } = options;
  const config = AGENT_CONFIGS[agentId];
  
  if (!config) {
    throw new Error(`Unknown agent: ${agentId}`);
  }
  
  log('INFO', `Spawning agent ${agentId}`, { traceId, task: task.substring(0, 100) });
  updateAgentHealth(agentId, 'active');
  
  return withRetry(async (attempt) => {
    const agentFile = path.join(WORKER_DIR, '..', 'scripts', 'agents', `${agentId}.md`);
    let systemPrompt = config.prompt;
    
    if (fs.existsSync(agentFile)) {
      systemPrompt = fs.readFileSync(agentFile, 'utf8');
    }
    
    // Use openclaw to spawn sub-agent
    const cmd = `openclaw sessions spawn --agent-id ${agentId} --task "${task.replace(/"/g, '\\"')}" --mode session`;
    
    return new Promise((resolve, reject) => {
      const child = spawn('bash', ['-c', cmd], {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve({ agentId, code, traceId });
        } else {
          reject(new Error(`Agent ${agentId} exited with code ${code}`));
        }
      });
      
      child.on('error', (err) => {
        reject(err);
      });
    });
  }, {
    maxRetries: retries,
    taskName: `spawn_${agentId}`,
    traceId
  });
}

function listAgents() {
  const state = loadState();
  const health = checkAllAgentsHealth();
  
  console.log('\n=== Active Agents ===\n');
  
  for (const [id, info] of Object.entries(state.agents)) {
    console.log(`${id}: ${info.name || id}`);
    console.log(`  Status: ${info.status}`);
    console.log(`  Session: ${info.sessionKey}`);
    console.log(`  Started: ${info.startedAt}`);
    console.log('');
  }
  
  if (Object.keys(state.agents).length === 0) {
    console.log('No active agents\n');
  }
  
  console.log('=== Agent Health ===\n');
  for (const [id, healthInfo] of Object.entries(health)) {
    const config = AGENT_CONFIGS[id];
    const statusEmoji = {
      'active': '🟢',
      'idle': '🟡',
      'offline': '🔴',
      'degraded': '🟠',
      'stale': '⚪',
      'unknown': '⚫'
    };
    
    console.log(`${statusEmoji[healthInfo.status] || '⚫'} ${id}: ${config?.name || id}`);
    console.log(`  Status: ${healthInfo.status}`);
    console.log(`  Last Active: ${healthInfo.lastActive || 'Never'}`);
    console.log(`  Tasks: ${healthInfo.successfulTasks || 0}/${healthInfo.totalTasks || 0} successful`);
    console.log(`  Failures: ${healthInfo.consecutiveFailures || 0} consecutive`);
    console.log('');
  }
  
  console.log('=== Available Agents ===\n');
  for (const [id, config] of Object.entries(AGENT_CONFIGS)) {
    const critical = config.critical ? ' [CRITICAL]' : '';
    console.log(`${id}: ${config.name} - ${config.role}${critical}`);
  }
}

function showHealth() {
  const health = checkAllAgentsHealth();
  
  console.log('\n=== Agent Health Status ===\n');
  
  const statusCounts = { active: 0, idle: 0, offline: 0, degraded: 0, stale: 0, unknown: 0 };
  
  for (const [id, info] of Object.entries(health)) {
    statusCounts[info.status] = (statusCounts[info.status] || 0) + 1;
  }
  
  console.log('Summary:', statusCounts);
  console.log('');
  
  for (const [id, info] of Object.entries(health)) {
    const config = AGENT_CONFIGS[id];
    const statusEmoji = {
      'active': '🟢',
      'idle': '🟡',
      'offline': '🔴',
      'degraded': '🟠',
      'stale': '⚪',
      'unknown': '⚫'
    };
    
    console.log(`${statusEmoji[info.status]} ${id}: ${info.status.toUpperCase()}`);
    console.log(`   Last Active: ${info.lastActive || 'Never'}`);
    console.log(`   Success Rate: ${info.totalTasks > 0 ? Math.round(info.successfulTasks / info.totalTasks * 100) : 0}%`);
    console.log('');
  }
}

// ========== Task Execution with Trace ID ==========

async function executeTask(agentId, task, options = {}) {
  const traceId = options.traceId || generateTraceId();
  
  log('INFO', `Executing task`, { traceId, agentId, task: task.substring(0, 50) });
  
  const result = await spawnAgent(agentId, task, { traceId, ...options });
  
  log('INFO', `Task completed`, { traceId, agentId, success: result.success });
  
  return {
    traceId,
    agentId,
    task,
    ...result
  };
}

// ========== Batch Operations with Graceful Degradation ==========

async function broadcastTask(agentIds, task, options = {}) {
  const traceId = options.traceId || generateTraceId();
  
  log('INFO', `Broadcasting task to ${agentIds.length} agents`, { traceId, agents: agentIds });
  
  const results = await executeWithGracefulDegradation(
    agentIds,
    async (agentId) => {
      return await spawnAgent(agentId, task, { traceId, ...options });
    },
    { requireAll: false, traceId }
  );
  
  return {
    traceId,
    task,
    ...results
  };
}

// ========== CLI ==========

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  switch (command) {
    case 'spawn': {
      const agentId = args[1];
      const task = args.slice(2).join(' ');
      const traceId = generateTraceId();
      
      console.log(`[${traceId}] Spawning ${agentId}...`);
      
      const result = await spawnAgent(agentId, task, { traceId });
      
      console.log(`[${traceId}] Result:`, result.success ? 'SUCCESS' : 'FAILED');
      break;
    }
    
    case 'list': {
      listAgents();
      break;
    }
    
    case 'health': {
      showHealth();
      break;
    }
    
    case 'broadcast': {
      const agents = args[1].split(',');
      const task = args.slice(2).join(' ');
      const traceId = generateTraceId();
      
      console.log(`[${traceId}] Broadcasting to: ${agents.join(', ')}`);
      
      const result = await broadcastTask(agents, task, { traceId });
      
      console.log(`[${traceId}] Completed: ${result.successCount}/${result.totalCount} succeeded`);
      console.log(`[${traceId}] Critical failed: ${result.criticalFailed}`);
      break;
    }
    
    case 'execute': {
      const agentId = args[1];
      const task = args.slice(2).join(' ');
      const traceId = generateTraceId();
      
      const result = await executeTask(agentId, task, { traceId });
      
      console.log(`[${traceId}]`, JSON.stringify(result, null, 2));
      break;
    }
    
    case 'check': {
      const agentId = args[1];
      const healthInfo = checkAgentHealth(agentId);
      console.log(JSON.stringify(healthInfo, null, 2));
      break;
    }
    
    default: {
      console.log(`
THEMACHINE Corp. Multi-Agent Controller - Enhanced Edition

Features:
  ✓ Retry logic (3 retries, exponential backoff)
  ✓ Agent health check (idle/offline detection)
  ✓ Graceful degradation (partial failures OK)
  ✓ Message trace_id for tracking

Usage:
  node worker.js spawn <agent> <task>
  node worker.js list
  node worker.js health
  node worker.js broadcast <agents> <task>
  node worker.js execute <agent> <task>
  node worker.js check <agent>

Agents:
  cfo  - CFO 交易主管 [CRITICAL]
  cto  - CTO 技术运维 [CRITICAL]
  cpo  - CPO 产品主管
  cmo  - CMO 品牌主管
  sec  - SEC 安全主管 [CRITICAL]
  dev  - DEV 开发主管

Examples:
  node worker.js spawn cto "Check server health"
  node worker.js broadcast cto,cfo,sec "System check"
  node worker.js health
`);
    }
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
