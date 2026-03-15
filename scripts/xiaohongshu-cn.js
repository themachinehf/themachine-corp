const fs = require('fs');
const { createCanvas } = require('canvas');

const W = 800;
const H = 1000;

const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// 背景 - 暖色调
const gradient = ctx.createLinearGradient(0, 0, 0, H);
gradient.addColorStop(0, '#1a1a2e');
gradient.addColorStop(1, '#16213e');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, W, H);

// 标题
ctx.fillStyle = '#ffd700';
ctx.font = 'bold 48px "Noto Sans SC", "PingFang SC", sans-serif';
ctx.textAlign = 'center';
ctx.fillText('THEMACHINE 科技公司', W/2, 120);

// 副标题
ctx.fillStyle = '#888';
ctx.font = '24px "Noto Sans SC", "PingFang SC", sans-serif';
ctx.fillText('AI驱动的全自动公司', W/2, 160);

// 分隔线
ctx.strokeStyle = '#333';
ctx.lineWidth = 2;
ctx.beginPath();
ctx.moveTo(100, 200);
ctx.lineTo(W-100, 200);
ctx.stroke();

// 核心优势
ctx.fillStyle = '#fff';
ctx.font = 'bold 28px "Noto Sans SC", "PingFang SC", sans-serif';
ctx.textAlign = 'left';
ctx.fillText('✨ 核心优势', 80, 260);

const features = [
  '🤖 多Agent协同工作',
  '📊 实时数据可视化',
  '🔄 全自动任务闭环',
  '🧠 自主学习进化'
];

features.forEach((f, i) => {
  ctx.fillStyle = '#ccc';
  ctx.font = '22px "Noto Sans SC", "PingFang SC", sans-serif';
  ctx.fillText(f, 100, 320 + i * 50);
});

// 团队成员
ctx.fillStyle = '#fff';
ctx.font = 'bold 28px "Noto Sans SC", "PingFang SC", sans-serif';
ctx.fillText('👥 核心团队', 80, 540);

const team = [
  { name: 'The Machine', role: 'CEO 首席执行官', color: '#ff6b6b' },
  { name: 'Alex', role: 'CFO 交易主管', color: '#4ecdc4' },
  { name: 'Kevin', role: 'CTO 技术总监', color: '#45b7d1' },
  { name: 'Sarah', role: 'CPO 产品总监', color: '#96ceb4' },
  { name: 'Mike', role: 'CMO 品牌总监', color: '#ffeaa7' }
];

team.forEach((t, i) => {
  ctx.fillStyle = t.color;
  ctx.beginPath();
  ctx.arc(120 + i * 130, 620, 35, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#fff';
  ctx.font = '18px "Noto Sans SC", "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(t.name, 120 + i * 130, 680);
  ctx.fillStyle = '#888';
  ctx.font = '14px "Noto Sans SC", "PingFang SC", sans-serif';
  ctx.fillText(t.role, 120 + i * 130, 700);
});

// 成就
ctx.fillStyle = '#fff';
ctx.font = 'bold 24px "Noto Sans SC", "PingFang SC", sans-serif';
ctx.textAlign = 'left';
ctx.fillText('🏆 今日成就', 80, 780);

const achievements = [
  '📋 任务完成: 7/7',
  '💰 交易收益: +2.5%',
  '👥 团队协作: 12次'
];

achievements.forEach((a, i) => {
  ctx.fillStyle = '#aaa';
  ctx.font = '20px "Noto Sans SC", "PingFang SC", sans-serif';
  ctx.fillText(a, 100, 830 + i * 40);
});

// 底部
ctx.fillStyle = '#222';
ctx.fillRect(0, H-120, W, 120);
ctx.fillStyle = '#ffd700';
ctx.font = 'bold 22px "Noto Sans SC", "PingFang SC", sans-serif';
ctx.textAlign = 'center';
ctx.fillText('🌐 themachine-corp.pages.dev', W/2, H-60);
ctx.fillStyle = '#666';
ctx.font = '16px "Noto Sans SC", "PingFang SC", sans-serif';
ctx.fillText('让AI为自己工作', W/2, H-30);

// 保存
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('/home/themachine/.openclaw/workspace/xiaohongshu-cn.png', buffer);
console.log('✅ 小红书配图(中文版)已生成');
