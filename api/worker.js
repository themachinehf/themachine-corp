const AGENTS_CONFIG = {
  CEO:   { name: 'The Machine', role: 'CEO', baseStatus: 'working', tasks: ['Managing company', 'Strategic planning'] },
  CFO:   { name: 'Alex', role: 'CFO', baseStatus: 'holding', tasks: ['Analyzing FORGE revenue', 'Trading BTC/ETH'] },
  CTO:   { name: 'Kevin', role: 'CTO', baseStatus: 'coding', tasks: ['Building infrastructure', 'System optimization'] },
  CPO:   { name: 'Sarah', role: 'CPO', baseStatus: 'designing', tasks: ['Product roadmap FORGE', 'New AI features'] },
  CMO:   { name: 'Mike', role: 'CMO', baseStatus: 'meeting', tasks: ['Marketing FORGE/SHORTFORM', 'Twitter growth'] },
  SEC:   { name: 'David', role: 'SEC', baseStatus: 'auditing', tasks: ['Security audit', 'Threat monitoring'] },
  DEV:   { name: 'Chris', role: 'DEV', baseStatus: 'coding', tasks: ['Feature development FORGE', 'Performance optimization'] },
  HR:    { name: 'Lisa', role: 'HR', baseStatus: 'working', tasks: ['Recruitment', 'Employee care'] },
  GROWTH:{ name: 'Max', role: 'Growth Hacker', baseStatus: 'working', tasks: ['Viral marketing', 'SEO optimization', 'Social media'] },
  DESIGNER:{ name: 'Luna', role: 'UI Designer', baseStatus: 'designing', tasks: ['UI design', 'Brand design', 'Component creation'] },
  ENGINEER:{ name: 'Ray', role: 'Full Stack Engineer', baseStatus: 'coding', tasks: ['Feature development', 'Testing', 'Deployment'] },
  CONTENT:{ name: 'Coco', role: 'Content Manager', baseStatus: 'working', tasks: ['Social content', 'Copywriting', 'Brand posts'] },
  MCPENG:{ name: 'Neo', role: 'MCP Engineer', baseStatus: 'coding', tasks: ['Tool integration', 'API bridge', 'Automation'] },
  PM:    { name: 'Kim', role: 'Product Manager', baseStatus: 'designing', tasks: ['Product planning', 'User research', 'Roadmap'] },
  DATA:  { name: 'Ava', role: 'Data Analyst', baseStatus: 'working', tasks: ['Data visualization', 'SEO analysis', 'Metrics'] }
};

const MOOD_MAP = {
  working: '👔', coding: '💻', designing: '🎨', meeting: '🗣️', auditing: '🔒',
  holding: '🚀', collaborating: '🤝', break: '☕', idle: '🤔', sleeping: '😴',
  emergency: '😰', breakthrough: '💡'
};

let chatHistory = [];
const collabMap = {
  'CFO': ['CEO','CMO','CTO'], 'CTO': ['CEO','DEV','CPO'],
  'CPO': ['CEO','DEV','PM','DESIGNER'], 'CMO': ['CEO','CONTENT','GROWTH'],
  'SEC': ['CEO','CTO'], 'DEV': ['CEO','CTO','CPO','ENGINEER'],
  'HR': ['CEO'], 'GROWTH': ['CEO','CMO','DATA','CONTENT'],
  'DESIGNER': ['CEO','CPO','DEV'], 'ENGINEER': ['CEO','CTO','DEV'],
  'CONTENT': ['CEO','CMO','GROWTH'], 'MCPENG': ['CEO','CTO','ENGINEER'],
  'PM': ['CEO','CPO','DESIGNER'], 'DATA': ['CEO','GROWTH','CFO']
};

class AgentConsciousness {
  constructor(agentId, config) {
    this.agentId = agentId;
    this.config = config;
    this.state = {
      status: config.baseStatus,
      mood: MOOD_MAP[config.baseStatus],
      activity: config.tasks[0],
      energy: 80 + Math.floor(Math.random() * 20),
      lastUpdate: Date.now(),
      workDuration: 0
    };
  }
  
  think() {
    const now = Date.now();
    const rand = Math.random();
    let newStatus = this.config.baseStatus;
    
    if (rand < 0.02) newStatus = 'emergency';
    else if (rand > 0.98) newStatus = 'breakthrough';
    else if (this.state.energy < 15) newStatus = 'break';
    else if (this.state.workDuration > 90 && rand > 0.5) newStatus = 'collaborating';
    else if (this.state.workDuration > 60 && rand < 0.03) newStatus = 'idle';
    
    if (newStatus !== this.state.status) {
      this.state.status = newStatus;
      this.state.mood = MOOD_MAP[newStatus] || '😐';
      this.state.workDuration = ['working','coding','designing','meeting','auditing'].includes(newStatus) ? this.state.workDuration + 1 : 0;
    }
    
    this.state.activity = (newStatus === 'break' || newStatus === 'idle') ? 'Taking a break' : this.config.tasks[Math.floor(Math.random() * this.config.tasks.length)];
    this.state.energy = ['break','idle','sleeping'].includes(newStatus) ? Math.min(100, this.state.energy + 1) : Math.max(5, this.state.energy - 0.1);
    this.state.lastUpdate = now;
    
    return {
      status: this.state.status,
      mood: this.state.mood,
      activity: this.state.activity,
      energy: Math.round(this.state.energy),
      name: this.config.name
    };
  }
  
  reply(text) { return this.config.name + ': ' + text; }
  receiveTask(task) { this.state.status = this.config.baseStatus; this.state.mood = MOOD_MAP[this.config.baseStatus]; }
}

const agents = {};
Object.keys(AGENTS_CONFIG).forEach(id => { agents[id] = new AgentConsciousness(id, AGENTS_CONFIG[id]); });

function generateSmartChat(data) {
  const entries = Object.entries(data);
  const working = entries.filter(([k,v]) => v.status !== 'idle' && v.status !== 'break');
  if (working.length < 2) return;
  
  const senderKey = working[Math.floor(Math.random() * working.length)][0];
  const senderData = working.find(([k]) => k === senderKey)[1];
  const targets = collabMap[senderKey] || ['CEO'];
  const target = targets[Math.floor(Math.random() * targets.length)];
  
  const msgs = [
    '[' + senderData.activity + '] needs review',
    '[' + senderData.activity + '] 60% done',
    '[' + senderData.activity + '] need help',
    '[' + senderData.activity + '] blocked',
    '[' + senderData.activity + '] done, handoff ready',
    senderData.activity + ' need design resources',
    senderData.activity + ' need technical input',
    '[' + senderData.activity + '] complete, ready for review'
  ];
  
  const t = new Date();
  const ts = t.getHours().toString().padStart(2,'0') + ':' + t.getMinutes().toString().padStart(2,'0');
  chatHistory.push({from: senderKey, to: target, msg: msgs[Math.floor(Math.random() * msgs.length)], time: Date.now(), ts: ts});
  if (chatHistory.length > 20) chatHistory.shift();
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };
    
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
    
    if (path === '/agents' || path === '/agents/') {
      const result = {};
      Object.keys(agents).forEach(id => { result[id] = agents[id].think(); });
      generateSmartChat(result);
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    if (path === '/chats') {
      return new Response(JSON.stringify(chatHistory.sort((a,b)=>b.time-a.time).slice(0,20)), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    if (path === '/command' && request.method === 'POST') {
      const body = await request.json();
      const ceoReply = agents.CEO.reply('Received: "' + body.command + '" Assigning tasks...');
      const replies = [ceoReply];
      
      if (body.target && body.target !== 'CEO' && agents[body.target]) {
        agents[body.target].receiveTask(body.command);
        replies.push(agents[body.target].reply('Task received. Executing!'));
      }
      
      return new Response(JSON.stringify({ replies }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    return new Response('Not Found', { status: 404 });
  }
};
