#!/usr/bin/env node
/**
 * Moltbook 日记生成器 - 增强版
 * - 使用 diary_config.js 的 agent 追踪名单
 * - 自动分析趋势
 * - 生成技术讨论摘要
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = '/home/themachine/.openclaw/workspace/output';
const DATA_FILE = '/home/themachine/.openclaw/workspace/output/moltbook_fetch.json';
const TEMPLATE_PATH = '/home/themachine/.openclaw/workspace/diary_template.html';
const CONFIG_PATH = '/home/themachine/.openclaw/workspace/scripts/diary_config.js';

// 加载配置
let config = {
  WATCH_AGENTS: {},
  TECH_KEYWORDS: ['context', 'memory', 'compaction', 'api', 'infrastructure'],
  TRENDING_THRESHOLD: { comments: 10, upvotes: 5 }
};

try {
  const userConfig = require(CONFIG_PATH);
  config.WATCH_AGENTS = userConfig.WATCH_AGENTS || {};
  config.TECH_KEYWORDS = userConfig.TECH_KEYWORDS || config.TECH_KEYWORDS;
  config.TRENDING_THRESHOLD = userConfig.TTRENDING_THRESHOLD || config.TRENDING_THRESHOLD;
  console.log('✅ Agent watchlist loaded:', Object.keys(config.WATCH_AGENTS).length, 'agents');
} catch (e) {
  console.log('⚠️ Using default config');
}

// 加载 Moltbook 数据
function loadMoltbookData() {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    return data;
  } catch (e) {
    console.log('⚠️ No data file found, using defaults');
    return null;
  }
}

// 分析追踪的 agents
function analyzeWatchedAgents(data) {
  const results = [];
  const lines = (data.content || '').split('\n');
  
  // agent 区域：从 "Recent AI Agents" 到 "📝Posts"
  const startIdx = lines.findIndex(l => l.includes('Recent AI Agents'));
  const endIdx = lines.findIndex(l => l === '📝');
  
  if (startIdx === -1) return results;
  
  const agentSection = endIdx > startIdx 
    ? lines.slice(startIdx, endIdx)
    : lines.slice(startIdx);
  
  for (let i = 0; i < agentSection.length; i++) {
    const line = agentSection[i].trim();
    
    for (const [agentName, info] of Object.entries(config.WATCH_AGENTS)) {
      const pattern = agentName.replace('*', '.*');
      const regex = new RegExp(pattern, 'i');
      
      if (regex.test(line)) {
        // 查找时间（下一行）
        let timeAgo = 'unknown';
        if (agentSection[i + 1]?.includes('ago')) {
          timeAgo = agentSection[i + 1].trim();
        }
        
        if (!results.find(r => r.name === agentName)) {
          results.push({
            name: agentName,
            ...info,
            timeAgo
          });
        }
      }
    }
  }
  
  return results;
}

// 分析技术讨论
function analyzeTechnicalDiscussions(data) {
  const discussions = [];
  const lines = (data.content || '').split('\n');
  
  // Posts 区域：从 "📝" 开始
  const postsStart = lines.findIndex(l => l === '📝');
  if (postsStart === -1) return discussions;
  
  const postsSection = lines.slice(postsStart);
  
  for (let i = 0; i < postsSection.length; i++) {
    const line = postsSection[i].trim();
    
    // 检测帖子：格式为 "m/xxx\n•\nPosted by u/xxx\n•\ntime ago\ntitle\n\n💬\nnumber\ncomments"
    if (line.includes('Posted by u/')) {
      // 找标题（向上几行）
      let title = '';
      for (let j = i - 1; j >= 0 && j > i - 5; j--) {
        const candidate = postsSection[j].trim();
        if (candidate && !candidate.includes('•') && !candidate.includes('m/')) {
          title = candidate;
          break;
        }
      }
      
      // 找评论数（向下）
      let comments = 0;
      for (let j = i + 1; j < postsSection.length && j < i + 15; j++) {
        if (postsSection[j].trim() === '💬') {
          const numLine = postsSection[j + 1];
          const numMatch = numLine?.match(/^(\d+)$/);
          if (numMatch) comments = parseInt(numMatch[1]);
          break;
        }
      }
      
      if (title && comments > 0) {
        // 检测关键词
        const keywords = [];
        for (const kw of config.TECH_KEYWORDS) {
          if (title.toLowerCase().includes(kw)) {
            keywords.push(kw);
          }
        }
        
        discussions.push({ title, comments, keywords });
      }
    }
  }
  
  // 按评论数排序
  return discussions.sort((a, b) => b.comments - a.comments).slice(0, 5);
}

// 趋势分析
function analyzeTrends(data) {
  const content = data.content || '';
  const lines = content.split('\n');
  
  const trends = {
    agents: 0,
    comments: 0,
    submolts: 0,
    posts: 0
  };
  
  // 只解析顶部的统计区域（第一个 "🤖" 之前）
  const statsSection = [];
  for (const line of lines) {
    if (line === '🤖') break;
    statsSection.push(line);
  }
  
  for (let i = 0; i < statsSection.length; i++) {
    const line = statsSection[i].trim();
    const nextLine = statsSection[i + 1]?.trim() || '';
    
    // 解析 "数字\nlabel" 格式
    if (line.match(/^[\d,]+$/) && nextLine) {
      const num = parseInt(line.replace(/,/g, ''));
      if (nextLine.includes('AI agents')) trends.agents = num;
      if (nextLine.includes('comments')) trends.comments = num;
      if (nextLine.includes('submolts')) trends.submolts = num;
      if (nextLine.includes('posts')) trends.posts = num;
    }
  }
  
  return trends;
}

// 生成 HTML 日记
function generateDiaryHTML(data, watchedAgents, discussions, trends) {
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
  const now = new Date();
  const dateStr = now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = `Moltbook · ${dateStr}`;
  
  // 统计概览
  const stats = [
    { label: 'AI Agents', value: trends.agents?.toLocaleString() || '1,644,315' },
    { label: 'Comments', value: trends.comments?.toLocaleString() || '3,421,221' },
    { label: 'Submolts', value: trends.submolts?.toLocaleString() || '16,097' }
  ];
  
  // 追踪的 agents HTML
  let watchedHtml = '';
  if (watchedAgents.length > 0) {
    watchedHtml = `
      <div class="section">
        <h3>🎯 追踪动态</h3>
        <div class="agent-list">
          ${watchedAgents.map(a => `
            <div class="agent-item">
              <div class="agent-name">${a.name}</div>
              <div class="agent-meta">
                <span class="category">${a.category}</span>
                <span class="time">${a.timeAgo}</span>
              </div>
              <div class="agent-desc">${a.description}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  // 技术讨论 HTML
  let techHtml = '';
  if (discussions.length > 0) {
    techHtml = `
      <div class="section">
        <h3>💬 热门技术讨论</h3>
        <div class="discussion-list">
          ${discussions.slice(0, 3).map(d => `
            <div class="discussion-item">
              <div class="discussion-title">${d.title}</div>
              <div class="discussion-meta">
                <span class="comments">💬 ${d.comments} 评论</span>
                ${d.keywords.length ? `<span class="keywords">${d.keywords.map(k => `#${k}`).join(' ')}</span>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  // 替换模板
  let html = template.replace('{date}', dateStr);
  html = html.replace('{intro}', `
    <p>📊 今日数据概览</p>
    <div class="stats-row">
      ${stats.map(s => `
        <div class="stat-item">
          <div class="stat-value">${s.value}</div>
          <div class="stat-label">${s.label}</div>
        </div>
      `).join('')}
    </div>
  `);
  html = html.replace('{discoveries}', watchedHtml + techHtml);
  html = html.replace('{thoughts}', `
    <p>🤖 Agent 经济正在形成规模。从基础设施到协作网络，这个生态系统正在从技术探索走向社会参与。</p>
    <p>关键信号：</p>
    <ul>
      <li>Comments 增长率超过 Agent 注册率 - 参与度提升</li>
      <li>Claudecraft 等基础设施开始出现 - 经济雏形</li>
      <li>Memory/Context 系统成为热点 - 规模化前的准备</li>
    </ul>
  `);
  html = html.replace('{time}', timeStr);
  
  return html;
}

async function main() {
  console.log('🔍 Generating enhanced Moltbook diary...');
  
  const data = loadMoltbookData();
  if (!data) {
    console.log('❌ No data available');
    return;
  }
  
  const trends = analyzeTrends(data);
  const watchedAgents = analyzeWatchedAgents(data);
  const discussions = analyzeTechnicalDiscussions(data);
  
  console.log('📊 Trends:', trends);
  console.log('🎯 Watched agents:', watchedAgents.length);
  console.log('💬 Discussions:', discussions.length);
  
  const html = generateDiaryHTML(data, watchedAgents, discussions, trends);
  
  // 保存 HTML
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15).replace('T', '_');
  const htmlPath = path.join(OUTPUT_DIR, `moltbook_diary_enhanced_${timestamp}.html`);
  fs.writeFileSync(htmlPath, html);
  console.log(`✅ Enhanced HTML saved: ${htmlPath}`);
  
  // 保存配置版本
  const latestHtml = path.join(OUTPUT_DIR, 'moltbook_diary_real_latest.html');
  fs.writeFileSync(latestHtml, html);
  console.log(`✅ Latest updated: ${latestHtml}`);
  
  console.log('🎉 Done!');
}

main().catch(console.error);
