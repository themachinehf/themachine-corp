/**
 * Agent 积分激励系统
 * 
 * 积分规则：
 * - 任务完成: +10
 * - 任务失败: -5
 * - 准时完成: +5
 * - 获得用户好评: +20
 */

const fs = require('fs');
const path = require('path');

const SCORE_FILE = path.join(__dirname, 'agent-scores.json');

const SCORE_RULES = {
  TASK_COMPLETE: 10,
  TASK_FAIL: -5,
  ON_TIME: 5,
  USER_PRAISE: 20
};

// 初始化积分文件
function initScores() {
  if (!fs.existsSync(SCORE_FILE)) {
    const defaultScores = {
      cto: { score: 100, tasks: 0, completed: 0, failed: 0 },
      cmo: { score: 100, tasks: 0, completed: 0, failed: 0 },
      cfo: { score: 100, tasks: 0, completed: 0, failed: 0 },
      cpo: { score: 100, tasks: 0, completed: 0, failed: 0 },
      sec: { score: 100, tasks: 0, completed: 0, failed: 0 },
      dev: { score: 100, tasks: 0, completed: 0, failed: 0 },
      hr: { score: 100, tasks: 0, completed: 0, failed: 0 }
    };
    fs.writeFileSync(SCORE_FILE, JSON.stringify(defaultScores, null, 2));
    return defaultScores;
  }
  return JSON.parse(fs.readFileSync(SCORE_FILE, 'utf8'));
}

function saveScores(scores) {
  fs.writeFileSync(SCORE_FILE, JSON.stringify(scores, null, 2));
}

// 加分
function addScore(agent, amount, reason) {
  const scores = initScores();
  if (!scores[agent]) {
    scores[agent] = { score: 100, tasks: 0, completed: 0, failed: 0 };
  }
  scores[agent].score += amount;
  scores[agent].tasks++;
  console.log(`[积分] ${agent}: ${amount > 0 ? '+' : ''}${amount} (${reason})`);
  console.log(`[总分] ${agent}: ${scores[agent].score}`);
  saveScores(scores);
  return scores[agent].score;
}

// 任务完成
function completeTask(agent) {
  return addScore(agent, SCORE_RULES.TASK_COMPLETE, '任务完成');
}

// 任务失败
function failTask(agent) {
  return addScore(agent, SCORE_RULES.TASK_FAIL, '任务失败');
}

// 准时完成
function onTimeComplete(agent) {
  return addScore(agent, SCORE_RULES.ON_TIME, '准时完成');
}

// 获得好评
function userPraise(agent) {
  return addScore(agent, SCORE_RULES.USER_PRAISE, '用户好评');
}

// 排行榜
function leaderboard() {
  const scores = initScores();
  const sorted = Object.entries(scores)
    .sort((a, b) => b[1].score - a[1].score);
  
  console.log('\n🏆 Agent 积分榜\n');
  console.log('| 排名 | Agent | 积分 | 任务数 | 完成 | 失败 |');
  console.log('|------|--------|------|--------|------|------|');
  
  sorted.forEach(([agent, data], index) => {
    console.log(`| ${index + 1} | ${agent} | ${data.score} | ${data.tasks} | ${data.completed} | ${data.failed} |`);
  });
  console.log('');
}

// 每日工资结算
function dailySalary() {
  const scores = initScores();
  
  console.log('\n💰 每日工资结算\n');
  
  Object.entries(scores).forEach(([agent, data]) => {
    const base = 100;
    const bonus = data.completed * 10;
    const penalty = data.failed * 5;
    const total = base + bonus - penalty;
    
    console.log(`${agent}: 基础${base} + 完成奖励${bonus} - 失败扣款${penalty} = ${total}`);
  });
  console.log('');
}

// 命令行接口
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'complete':
    addScore(args[1], SCORE_RULES.TASK_COMPLETE, '任务完成');
    break;
  case 'fail':
    addScore(args[1], SCORE_RULES.TASK_FAIL, '任务失败');
    break;
  case 'praise':
    addScore(args[1], SCORE_RULES.USER_PRAISE, '用户好评');
    break;
  case 'leaderboard':
    leaderboard();
    break;
  case 'salary':
    dailySalary();
    break;
  default:
    console.log('用法:');
    console.log('  node agent-scores.js complete <agent>   任务完成 +10');
    console.log('  node agent-scores.js fail <agent>       任务失败 -5');
    console.log('  node agent-scores.js praise <agent>      用户好评 +20');
    console.log('  node agent-scores.js leaderboard        积分榜');
    console.log('  node agent-scores.js salary             工资结算');
}
