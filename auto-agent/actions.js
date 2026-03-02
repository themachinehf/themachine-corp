/**
 * 行动器 - Agent的"手"
 */

const { execSync } = require('child_process');

async function fixCode(file, change) {
  // 写入文件
  const fs = require('fs');
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(change.from, change.to);
  fs.writeFileSync(file, content);
  return { success: true, file };
}

async function deploy() {
  try {
    execSync('wrangler pages deploy . --project-name themachine-corp', { 
      cwd: '/home/themachine/.openclaw/workspace/themachine-corp',
      stdio: 'pipe' 
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function sendMessage(to, msg) {
  const res = await fetch('https://themachine-api.jxs66.workers.dev/command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command: msg, target: to })
  });
  return await res.json();
}

async function reportToCEO(agentName, findings) {
  const msg = `[${agentName}] 发现问题并已修复: ${JSON.stringify(findings)}`;
  await sendMessage('CEO', msg);
}

module.exports = {
  fixCode,
  deploy,
  sendMessage,
  reportToCEO
};
