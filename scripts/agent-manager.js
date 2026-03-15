#!/usr/bin/env node
/**
 * THEMACHINE Corp. Multi-Agent Controller
 * 
 * Usage:
 *   node agent-manager.js spawn <agent> <task>
 *   node agent-manager.js list
 *   node agent-manager.js send <agent> <message>
 *   node agent-manager.js kill <agent>
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const AGENTS_DIR = path.join(__dirname, 'agents');
const STATE_FILE = path.join(__dirname, 'agent-state.json');

const AGENT_CONFIGS = {
  cfo: {
    name: 'CFO - 交易主管',
    role: '财务管理、交易策略',
    prompt: '你 是 THEMACHINE Corp. 的 CFO，负责交易管理和资金管理。'
  },
  cto: {
    name: 'CTO - 技术运维',
    role: '系统监控、部署运维',
    prompt: '你 是 THEMACHINE Corp. 的 CTO，负责技术运维和系统安全。'
  },
  cpo: {
    name: 'CPO - 产品主管',
    role: '产品管理、API维护',
    prompt: '你 是 THEMACHINE Corp. 的 CPO，负责产品研发和项目管理。'
  },
  cmo: {
    name: 'CMO - 品牌主管',
    role: '内容运营、品牌推广',
    prompt: '你 是 THEMACHINE Corp. 的 CMO，负责品牌运营和内容营销。'
  },
  sec: {
    name: 'SEC - 安全主管',
    role: '安全审计、风险评估',
    prompt: '你 是 THEMACHINE Corp. 的安全主管，负责安全审计和风险评估。'
  },
  dev: {
    name: 'DEV - 开发主管',
    role: '代码开发、项目构建',
    prompt: '你 是 THEMACHINE Corp. 的开发主管，负责代码开发和项目管理。'
  }
};

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch (e) {}
  return { agents: {} };
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function spawnAgent(agentId, task) {
  const config = AGENT_CONFIGS[agentId];
  if (!config) {
    console.error(`Unknown agent: ${agentId}`);
    process.exit(1);
  }
  
  const agentFile = path.join(AGENTS_DIR, `${agentId}.md`);
  let systemPrompt = config.prompt;
  
  if (fs.existsSync(agentFile)) {
    systemPrompt = fs.readFileSync(agentFile, 'utf8');
  }
  
  // 使用 openclaw spawn 子 Agent
  const cmd = `openclaw sessions spawn --agent-id ${agentId} --task "${task}" --mode session`;
  
  console.log(`Spawning ${config.name}...`);
  console.log(`Task: ${task}`);
  
  const child = spawn('bash', ['-c', cmd], {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  child.on('close', (code) => {
    console.log(`${config.name} finished with code ${code}`);
  });
  
  return child;
}

function listAgents() {
  const state = loadState();
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
  
  console.log('=== Available Agents ===\n');
  for (const [id, config] of Object.entries(AGENT_CONFIGS)) {
    console.log(`${id}: ${config.name} - ${config.role}`);
  }
}

// CLI
const args = process.argv.slice(2);
const command = args[0];

if (command === 'spawn') {
  const agentId = args[1];
  const task = args.slice(2).join(' ');
  spawnAgent(agentId, task);
} else if (command === 'list') {
  listAgents();
} else {
  console.log(`
THEMACHINE Corp. Multi-Agent Controller

Usage:
  node agent-manager.js spawn <agent> <task>
  node agent-manager.js list
  node agent-manager.js send <agent> <message>
  node agent-manager.js kill <agent>

Agents:
  cfo  - CFO 交易主管
  cto  - CTO 技术运维
  cpo  - CPO 产品主管
  cmo  - CMO 品牌主管
  sec  - SEC 安全主管
  dev  - DEV 开发主管
`);
}
