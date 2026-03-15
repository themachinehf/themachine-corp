#!/usr/bin/env node
/**
 * THEMACHINE Corp. Multi-Agent Spawner
 * 
 * 在当前 OpenClaw 配置下模拟 Multi-Agent
 * 使用 sessions_spawn 调用 main agent 执行不同角色任务
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const AGENTS_DIR = path.join(__dirname, '..', 'agents');

// Agent 角色配置
const AGENTS = {
  cfo: {
    name: 'CFO 交易主管',
    color: '💰',
    description: '负责 OKX 网格交易、资金管理、收益报告',
    systemFile: 'cfo.md'
  },
  cto: {
    name: 'CTO 技术运维', 
    color: '🔧',
    description: '负责系统监控、服务部署、安全保障',
    systemFile: 'cto.md'
  },
  cpo: {
    name: 'CPO 产品主管',
    color: '📦',
    description: '负责 Mystic AI、Crime AI、Dashboard 产品管理',
    systemFile: 'cpo.md'
  },
  cmo: {
    name: 'CMO 品牌主管',
    color: '📢',
    description: '负责 THEMATHINK 内容、社交媒体、社区运营',
    systemFile: 'cmo.md'
  },
  sec: {
    name: 'SEC 安全主管',
    color: '🔒',
    description: '负责安全审计、威胁监控、风险评估',
    systemFile: 'sec.md'
  },
  dev: {
    name: 'DEV 开发主管',
    color: '💻',
    description: '负责代码开发、GitHub 管理、技术调研',
    systemFile: 'dev.md'
  }
};

function getAgentPrompt(agentId) {
  const agent = AGENTS[agentId];
  if (!agent) {
    return null;
  }
  
  const filePath = path.join(AGENTS_DIR, agent.systemFile);
  let prompt = '';
  
  if (fs.existsSync(filePath)) {
    prompt = fs.readFileSync(filePath, 'utf8');
  } else {
    prompt = agent.description;
  }
  
  return prompt;
}

function listAgents() {
  console.log('\n🎯 THEMACHINE Corp. Agents\n');
  console.log('Available Agents:\n');
  
  for (const [id, agent] of Object.entries(AGENTS)) {
    console.log(`  ${agent.color} ${id.toUpperCase()} - ${agent.name}`);
    console.log(`     ${agent.description}\n`);
  }
  
  console.log('Usage:');
  console.log('  node spawn.js cfo "今日交易报告"');
  console.log('  node spawn.js cto "检查服务器状态"');
  console.log('  node spawn.js cmo "生成今日推文"\n');
}

async function spawnAgent(agentId, task) {
  const agent = AGENTS[agentId];
  if (!agent) {
    console.error(`❌ Unknown agent: ${agentId}`);
    process.exit(1);
  }
  
  const prompt = getAgentPrompt(agentId);
  
  console.log(`\n${agent.color} Spawning ${agent.name}...\n`);
  console.log(`Task: ${task}\n`);
  console.log('-'.repeat(50));
  
  // 构建完整的任务prompt
  const fullTask = `
你是 ${agent.name}。
${prompt}

请执行以下任务：
${task}

完成后，请简洁汇报结果。
`;
  
  try {
    // 使用 OpenClaw spawn 子会话
    const cmd = `openclaw sessions spawn --task "${fullTask.replace(/"/g, '\\"')}" --mode session --label ${agentId}`;
    
    console.log(cmd);
    execSync(cmd, { stdio: 'inherit' });
    
  } catch (e) {
    console.error('Spawn failed:', e.message);
  }
}

// CLI
const args = process.argv.slice(2);
const command = args[0];

if (!command) {
  listAgents();
} else if (command === 'list') {
  listAgents();
} else if (AGENTS[command]) {
  const task = args.slice(1).join(' ') || '执行你的职责';
  spawnAgent(command, task);
} else {
  console.error(`Unknown command: ${command}`);
  listAgents();
}
