const fs = require('fs');
const { createCanvas } = require('canvas');

const W = 800;
const H = 1000;

const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// 背景 - 深色科技风
const gradient = ctx.createLinearGradient(0, 0, 0, H);
gradient.addColorStop(0, '#0a0a12');
gradient.addColorStop(1, '#0d0d18');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, W, H);

// 标题 - 金色
ctx.fillStyle = '#ffd700';
ctx.font = 'bold 42px "Noto Sans SC", "PingFang SC", sans-serif';
ctx.textAlign = 'center';
ctx.fillText('THEMATHINK', W/2, 100);

// 副标题
ctx.fillStyle = '#888';
ctx.font = '20px "Noto Sans SC", "PingFang SC", sans-serif';
ctx.fillText('AI-Powered Autonomous Company', W/2, 135);

// 2.5D 办公室示意 (简化版)
ctx.save();
ctx.translate(W/2 - 150, 320);

// 地面
ctx.fillStyle = '#151520';
ctx.beginPath();
ctx.moveTo(0, 80);
ctx.lineTo(150, 30);
ctx.lineTo(300, 80);
ctx.lineTo(150, 130);
ctx.closePath();
ctx.fill();

// 墙壁
ctx.fillStyle = '#252535';
ctx.beginPath();
ctx.moveTo(0, 80);
ctx.lineTo(150, 30);
ctx.lineTo(150, -40);
ctx.lineTo(0, 10);
ctx.closePath();
ctx.fill();

ctx.fillStyle = '#1a1a25';
ctx.beginPath();
ctx.moveTo(150, 30);
ctx.lineTo(300, 80);
ctx.lineTo(300, -40);
ctx.lineTo(150, -80);
ctx.closePath();
ctx.fill();

// 桌子
ctx.fillStyle = '#8B4513';
ctx.fillRect(80, 40, 40, 25);

// 椅子
ctx.fillStyle = '#2F4F4F';
ctx.fillRect(85, 60, 25, 15);

// 小人
ctx.fillStyle = '#ff6b6b';
ctx.fillRect(90, 15, 20, 25);

ctx.restore();

// 核心特性
ctx.fillStyle = '#fff';
ctx.font = 'bold 24px "Noto Sans SC", "PingFang SC", sans-serif';
ctx.textAlign = 'left';
ctx.fillText('✦ CORE FEATURES', 60, 520);

const features = [
  '🤖 Multi-Agent Autonomous Operation',
  '📊 Real-Time Office Visualization',
  '🔄 Automated Task闭环 (Closed Loop)',
  '🧠 Self-Learning & Optimization'
];

features.forEach((f, i) => {
  ctx.fillStyle = '#aaa';
  ctx.font = '18px "Noto Sans SC", "PingFang SC", sans-serif';
  ctx.fillText(f, 80, 570 + i * 45);
});

// 团队
ctx.fillStyle = '#fff';
ctx.font = 'bold 24px "Noto Sans SC", "PingFang SC", sans-serif';
ctx.fillText('✦ TEAM', 60, 800);

const team = [
  { name: 'The Machine', role: 'CEO', color: '#ff6b6b' },
  { name: 'Alex', role: 'CFO', color: '#4ecdc4' },
  { name: 'Kevin', role: 'CTO', color: '#45b7d1' },
  { name: 'Sarah', role: 'CPO', color: '#96ceb4' },
  { name: 'Mike', role: 'CMO', color: '#ffeaa7' }
];

team.forEach((t, i) => {
  ctx.fillStyle = t.color;
  ctx.beginPath();
  ctx.arc(100 + i * 130, 870, 28, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#fff';
  ctx.font = '14px "Noto Sans SC", "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(t.name, 100 + i * 130, 920);
  ctx.fillStyle = '#666';
  ctx.font = '11px "Noto Sans SC", "PingFang SC", sans-serif';
  ctx.fillText(t.role, 100 + i * 130, 938);
});

// 底部
ctx.fillStyle = '#0a0a12';
ctx.fillRect(0, H-100, W, 100);
ctx.fillStyle = '#ffd700';
ctx.font = 'bold 18px "Noto Sans SC", "PingFang SC", sans-serif';
ctx.textAlign = 'center';
ctx.fillText('themachine-corp.pages.dev', W/2, H-45);
ctx.fillStyle = '#555';
ctx.font = '14px "Noto Sans SC", "PingFang SC", sans-serif';
ctx.fillText('Let AI work for you', W/2, H-20);

// 保存
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('/home/themachine/.openclaw/workspace/xiaohongshu-en.png', buffer);
console.log('✅ English image generated');
