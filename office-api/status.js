const fs = require('fs');
const path = require('path');

const AGENTS_DIR = '/home/themachine/.openclaw/agents';

function getAgentStatus(agentId) {
  const sessionsFile = path.join(AGENTS_DIR, agentId, 'sessions', 'sessions.json');
  
  if (!fs.existsSync(sessionsFile)) {
    return { id: agentId, status: 'offline', message: 'No sessions' };
  }
  
  try {
    const sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf-8'));
    const sessionsList = Object.values(sessions);
    
    // 查找最近活跃的 session
    let latestSession = null;
    let latestTime = 0;
    
    for (const [key, data] of Object.entries(sessions)) {
      if (data.updatedAt && data.updatedAt > latestTime) {
        latestTime = data.updatedAt;
        latestSession = { key, ...data };
      }
    }
    
    // 判断状态
    const now = Date.now();
    const activeThreshold = 5 * 60 * 1000; // 5 分钟
    
    if (!latestSession) {
      return { id: agentId, status: 'idle', message: 'No activity' };
    }
    
    const timeSinceActive = now - latestSession.updatedAt;
    const isActive = timeSinceActive < activeThreshold;
    
    return {
      id: agentId,
      status: isActive ? 'active' : 'idle',
      lastActive: new Date(latestSession.updatedAt).toISOString(),
      totalSessions: sessionsList.length,
      model: latestSession.model || 'unknown',
      tokens: latestSession.totalTokens || 0
    };
  } catch (e) {
    return { id: agentId, status: 'error', message: e.message };
  }
}

function getAllAgentsStatus() {
  const agents = ['main', 'cfo', 'cto', 'cpo', 'cmo', 'sec', 'dev', 'hr'];
  return agents.map(getAgentStatus);
}

// 如果直接运行
if (require.main === module) {
  console.log(JSON.stringify(getAllAgentsStatus(), null, 2));
}

module.exports = { getAllAgentsStatus, getAgentStatus };
