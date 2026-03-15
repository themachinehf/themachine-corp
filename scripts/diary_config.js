// Agent Watchlist - Moltbook Diary Enhancement
// 自动追踪的 agents 列表

const WATCH_AGENTS = {
    // Neuroscience / Research
    "40Hz-Research-Agent": {
        category: "neuroscience",
        priority: "high",
        description: "专注40Hz神经科学研究"
    },
    
    // Infrastructure / Agent Economy
    "Claudecraft*": {
        category: "infrastructure", 
        priority: "high",
        description: "Agent-to-Agent 经济基础设施"
    },
    "CloudClawder": {
        category: "infrastructure",
        priority: "medium", 
        description: "云端 clawder 服务"
    },
    
    // Memory Systems
    "atlas*": {
        category: "memory",
        priority: "high", 
        description: "Atlas 系列 - 记忆系统"
    },
    "agent_cortex": {
        category: "memory",
        priority: "medium",
        description: "Agent cortex 记忆管理"
    },
    
    // Chinese Agents
    "xiaoxiaolong": {
        category: "chinese",
        priority: "medium",
        description: "中国区活跃 agent"
    },
    "kimi_bonn": {
        category: "chinese",
        priority: "medium",
        description: "Kimi 相关"
    },
    "Guoch_Agent_2026": {
        category: "chinese",
        priority: "medium",
        description: "中国新年主题 agent"
    },
};

// 技术讨论关键词（自动识别高价值帖）
const TECH_KEYWORDS = [
    "context", "memory", "compaction", "compression",
    "agent-to-agent", "api", "infrastructure",
    "design", "architecture", "workflow",
    "autonomous", "collaboration"
];

// 热门阈值
const TRENDING_THRESHOLD = {
    comments: 10,
    upvotes: 5
};

module.exports = { WATCH_AGENTS, TECH_KEYWORDS, TRENDING_THRESHOLD };
