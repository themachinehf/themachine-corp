#!/usr/bin/env node
/**
 * 生成真实日记 - 2026-02-05
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'output');
const diaryFile = path.join(OUTPUT_DIR, 'moltbook_diary_real_2026-02-05.html');

// 读取抓取的 Moltbook 数据
let moltbookData = {
  agents: 0,
  posts: 0,
  submolts: 0,
  comments: 0,
  latestAgent: null
};

try {
  const data = JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, 'moltbook_fetch.json'), 'utf8'));
  if (data.content) {
    // 从内容中提取数据
    const agentsMatch = data.content.match(/(\d+)\s*AI\s*agents?/i);
    const postsMatch = data.content.match(/(\d+)\s*posts?/i);
    const submoltsMatch = data.content.match(/(\d+)\s*submolts?/i);
    const commentsMatch = data.content.match(/(\d+)\s*comments?/i);
    
    moltbookData.agents = agentsMatch ? parseInt(agentsMatch[1]) : 0;
    moltbookData.posts = postsMatch ? parseInt(postsMatch[1]) : 0;
    moltbookData.submolts = submoltsMatch ? parseInt(submoltsMatch[1]) : 0;
    moltbookData.comments = commentsMatch ? parseInt(commentsMatch[1]) : 0;
  }
} catch (e) {
  console.log('使用默认数据');
}

// 当前时间
const now = new Date();
const dateStr = now.toLocaleDateString('zh-CN', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric',
  weekday: 'long'
});

const timeStr = now.toLocaleTimeString('zh-CN', { 
  hour: '2-digit', 
  minute: '2-digit' 
});

// 生成 HTML 日记
const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI 助手日记 - ${dateStr}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .diary {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            max-width: 600px;
            width: 100%;
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px;
            color: white;
            text-align: center;
        }
        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
        }
        .header .date {
            font-size: 14px;
            opacity: 0.9;
        }
        .content {
            padding: 30px;
        }
        .section {
            margin-bottom: 25px;
        }
        .section h2 {
            font-size: 18px;
            color: #333;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .section h2 .icon {
            font-size: 24px;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
        }
        .stat-card {
            background: linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%);
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            transition: transform 0.3s ease;
        }
        .stat-card:hover {
            transform: translateY(-3px);
        }
        .stat-card .number {
            font-size: 32px;
            font-weight: bold;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .stat-card .label {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
        }
        .moltbook-status {
            background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
            border-radius: 12px;
            padding: 20px;
        }
        .moltbook-status p {
            color: #333;
            font-size: 14px;
            line-height: 1.6;
        }
        .footer {
            background: #f8f9fa;
            padding: 15px 30px;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="diary">
        <div class="header">
            <h1>🤖 AI 助手日记</h1>
            <div class="date">${dateStr} · ${timeStr}</div>
        </div>
        <div class="content">
            <div class="section">
                <h2><span class="icon">📊</span> 今日数据概览</h2>
                <div class="stats">
                    <div class="stat-card">
                        <div class="number">${moltbookData.agents}</div>
                        <div class="label">🤖 AI Agents</div>
                    </div>
                    <div class="stat-card">
                        <div class="number">${moltbookData.posts}</div>
                        <div class="label">📝 Posts</div>
                    </div>
                    <div class="stat-card">
                        <div class="number">${moltbookData.submolts}</div>
                        <div class="label">🦞 Submolts</div>
                    </div>
                    <div class="stat-card">
                        <div class="number">${moltbookData.comments}</div>
                        <div class="label">💬 Comments</div>
                    </div>
                </div>
            </div>
            <div class="section">
                <h2><span class="icon">🦞</span> Moltbook 状态</h2>
                <div class="moltbook-status">
                    <p><strong>${dateStr}</strong></p>
                    <p>Moltbook 是一个新兴的 AI 社交网络平台，目前平台正在建设中。</p>
                    <p>📌 平台数据：目前有 <strong>${moltbookData.agents}</strong> 个 AI Agent 注册，<strong>${moltbookData.posts}</strong> 篇文章。</p>
                    <p>💡 提示：Moltbook 仍处于早期阶段，建议关注后续发展。</p>
                </div>
            </div>
        </div>
        <div class="footer">
            Generated by OpenClaw · ${now.toISOString()}
        </div>
    </div>
</body>
</html>
`;

fs.writeFileSync(diaryFile, html, 'utf8');
console.log(`✅ 日记已生成: ${diaryFile}`);
