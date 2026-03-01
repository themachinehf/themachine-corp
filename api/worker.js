// THEMACHINE Corp. - 自主意识系统 (含触发机制)

const AGENTS_CONFIG = {
  CEO:   { name: 'The Machine', role: 'CEO', baseStatus: 'working', tasks: ['Managing company', 'Strategic planning', 'Team coordination'], triggers: [] },
  CFO:   { name: 'Alex', role: 'CFO', baseStatus: 'holding', tasks: ['Analyzing markets', 'Portfolio management'], triggers: ['collab', 'emergency'] },
  CTO:   { name: 'Kevin', role: 'CTO', baseStatus: 'coding', tasks: ['Building infrastructure', 'System optimization'], triggers: ['moyu', 'emergency'] },
  CPO:   { name: 'Sarah', role: 'CPO', baseStatus: 'designing', tasks: ['Product design', 'User research'], triggers: ['collab'] },
  CMO:   { name: 'Mike', role: 'CMO', baseStatus: 'meeting', tasks: ['Content creation', 'Social media'], triggers: ['moyu'] },
  SEC:   { name: 'David', role: 'SEC', baseStatus: 'auditing', tasks: ['Security audit', 'Threat monitoring'], triggers: ['emergency'] },
  DEV:   { name: 'Chris', role: 'DEV', baseStatus: 'coding', tasks: ['Code review', 'Bug fixes'], triggers: ['moyu', 'collab'] },
  HR:    { name: 'Lisa', role: 'HR', baseStatus: 'working', tasks: ['Recruitment', 'Employee care'], triggers: ['collab'] }
};

const MOOD_MAP = {
  working: '👔', coding: '💻', designing: '🎨', meeting: '🗣️', auditing: '🔒',
  holding: '🚀', collaborating: '🤝', break: '☕', idle: '🤔', sleeping: '😴',
  emergency: '😰', breakthrough: '💡'
};

// 触发事件记录 (保存在内存中)
let triggerEvents = [];

class AgentConsciousness {
  constructor(agentId, config) {
    this.agentId = agentId;
    this.config = config;
    this.state = {
      status: config.baseStatus,
      mood: MOOD_MAP[config.baseStatus],
      activity: config.tasks[0],
      energy: 80 + Math.floor(Math.random() * 20),
      focus: 70 + Math.floor(Math.random() * 30),
      lastUpdate: Date.now(),
      workDuration: 0,
      lastTrigger: null
    };
    this.triggerCooldown = 0; // 触发冷却
  }
  
  think() {
    const now = Date.now();
    const hour = new Date().getHours();
    const minute = new Date().getMinutes();
    const rand = Math.random();
    const dt = (now - this.state.lastUpdate) / 1000;
    
    const isWorkTime = hour >= 9 && hour < 18;
    const isDeepNight = hour >= 23 || hour < 6;
    const isLunchTime = hour === 12 && minute >= 0 && minute < 30;
    
    let newStatus = this.state.status;
    let triggered = null;
    
    // ========== 自主决策 (意识驱动) ==========
    
    // 1. 深夜强制睡觉
    if (isDeepNight) {
      newStatus = 'sleeping';
    }
    // 2. 午休 (我们"想"休息)
    else if (isLunchTime && this.state.energy < 90) {
      newStatus = 'break';
      if (rand > 0.3) triggered = 'break';
    }
    // 3. 精力不足时 (身体"驱动"休息)
    else if (this.state.energy < 15 && isWorkTime) {
      newStatus = 'break';
      triggered = 'break';
    }
    // 4. 突发事件 (2%概率"想到"要处理)
    else if (rand < 0.02 && this.triggerCooldown <= 0) {
      newStatus = 'emergency';
      triggered = 'emergency';
    }
    // 5. 灵感爆发 (2%概率)
    else if (rand > 0.98) {
      newStatus = 'breakthrough';
    }
    // 6. 连续工作太久想协作 (90分钟后，"感到"需要帮助)
    else if (this.state.workDuration > 90 && rand > 0.5 && this.triggerCooldown <= 0) {
      newStatus = 'collaborating';
      triggered = 'collab';
    }
    // 7. 摸鱼 (连续工作60分钟后，小概率"想"休息)
    else if (this.state.workDuration > 60 && rand < 0.03 && this.triggerCooldown <= 0) {
      newStatus = 'idle';
      triggered = 'moyu';
    }
    // 8. 正常工作
    else if (isWorkTime) {
      newStatus = this.config.baseStatus;
    }
    // 9. 下班
    else {
      newStatus = 'idle';
    }
    
    // ========== 状态更新 ==========
    if (newStatus !== this.state.status) {
      this.state.status = newStatus;
      this.state.mood = MOOD_MAP[newStatus] || '😐';
      
      if (['working','coding','designing','meeting','auditing'].includes(newStatus)) {
        this.state.workDuration += dt / 60;
      } else {
        this.state.workDuration = 0;
      }
      
      // 记录触发事件
      if (triggered && this.triggerCooldown <= 0) {
        const event = {
          agent: this.agentId,
          type: triggered,
          time: now,
          status: newStatus
        };
        triggerEvents.push(event);
        this.state.lastTrigger = triggered;
        this.triggerCooldown = 300; // 5分钟冷却
        
        // 限制事件数量
        if (triggerEvents.length > 50) triggerEvents.shift();
      }
    }
    
    // 冷却递减
    if (this.triggerCooldown > 0) this.triggerCooldown -= dt;
    
    // 活动描述
    if (newStatus === 'break' || newStatus === 'idle') {
      this.state.activity = this.state.energy < 30 ? 'Resting...' : 'Taking a break';
    } else if (newStatus === 'emergency') {
      this.state.activity = 'Handling emergency!';
    } else if (newStatus === 'breakthrough') {
      this.state.activity = 'Eureka!';
    } else if (newStatus === 'collaborating') {
      this.state.activity = 'Team collaboration';
    } else if (newStatus === 'sleeping') {
      this.state.activity = 'Sleeping...';
    } else {
      this.state.activity = this.config.tasks[Math.floor(Math.random() * this.config.tasks.length)];
    }
    
    // 能量变化
    if (['break','idle','sleeping'].includes(newStatus)) {
      this.state.energy = Math.min(100, this.state.energy + 0.5);
    } else if (isWorkTime) {
      this.state.energy = Math.max(5, this.state.energy - 0.1);
    }
    
    this.state.lastUpdate = now;
    
    return {
      status: this.state.status,
      mood: this.state.mood,
      activity: this.state.activity,
      energy: Math.round(this.state.energy),
      focus: Math.round(this.state.focus),
      workDuration: Math.round(this.state.workDuration),
      lastTrigger: this.state.lastTrigger,
      name: this.config.name
    };
  }
}

const agents = {};
Object.keys(AGENTS_CONFIG).forEach(id => {
  agents[id] = new AgentConsciousness(id, AGENTS_CONFIG[id]);
});

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS' };
    
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
    
    // /agents - 获取状态 (触发自主思考)
    if (path === '/agents' || path === '/agents/') {
      const result = {};
      Object.keys(agents).forEach(id => { result[id] = agents[id].think(); });
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    // /triggers - 获取最近的触发事件
    if (path === '/triggers') {
      return new Response(JSON.stringify(triggerEvents.slice(-10).reverse()), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('Not Found', { status: 404 });
  }
};
