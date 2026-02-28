const fs = require('fs');
const path = require('path');

const AGENTS_DIR = '/home/themachine/.openclaw/agents';

function getAgentStatus(agentId) {
  const sessionsFile = path.join(AGENTS_DIR, agentId, 'sessions', 'sessions.json');
  
  if (!fs.existsSync(sessionsFile)) {
    return { id: agentId, status: 'offline', activity: 'No sessions' };
  }
  
  try {
    const sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf-8'));
    const sessionsList = Object.values(sessions);
    
    let latestSession = null;
    let latestTime = 0;
    
    for (const [key, data] of Object.entries(sessions)) {
      if (data.updatedAt && data.updatedAt > latestTime) {
        latestTime = data.updatedAt;
        latestSession = { key, ...data };
      }
    }
    
    const now = Date.now();
    const activeThreshold = 5 * 60 * 1000;
    
    if (!latestSession) {
      return { id: agentId, status: 'idle', activity: 'No activity' };
    }
    
    const timeSinceActive = now - latestSession.updatedAt;
    const isActive = timeSinceActive < activeThreshold;
    
    // 映射 agent 名称
    const names = {
      'main': 'CEO - The Machine',
      'cfo': 'CFO - Alex',
      'cto': 'CTO - Kevin',
      'cpo': 'CPO - Sarah',
      'cmo': 'CMO - Mike',
      'sec': 'SEC - David',
      'dev': 'DEV - Chris',
      'hr': 'HR - Lisa'
    };
    
    return {
      id: agentId,
      name: names[agentId] || agentId,
      status: isActive ? 'working' : 'idle',
      activity: isActive ? 'Active' : 'Idle',
      lastActive: new Date(latestSession.updatedAt).toISOString(),
      totalSessions: sessionsList.length,
      tokens: latestSession.totalTokens || 0
    };
  } catch (e) {
    return { id: agentId, status: 'error', activity: e.message };
  }
}

module.exports = (req, res) => {
  const agents = ['main', 'cfo', 'cto', 'cpo', 'cmo', 'sec', 'dev', 'hr'];
  const result = {};
  agents.forEach(id => {
    result[id] = getAgentStatus(id);
  });
  res.json(result);
};
