const fs = require('fs');
const { createCanvas } = require('canvas');

const W = 800;
const H = 1000;

const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// 背景 - 黑色深邃
ctx.fillStyle = '#000000';
ctx.fillRect(0, 0, W, H);

// 星空效果
ctx.save();
ctx.globalAlpha = 0.2;
for (let i = 0; i < 80; i++) {
  const x = Math.random() * W;
  const y = Math.random() * H;
  const r = Math.random() * 1.5;
  ctx.fillStyle = Math.random() > 0.5 ? '#ffd700' : '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}
ctx.restore();

// 金色眼睛/光环
ctx.strokeStyle = '#ffd700';
ctx.lineWidth = 2;
ctx.globalAlpha = 0.4;
ctx.beginPath();
ctx.arc(W/2, 320, 100, 0, Math.PI * 2);
ctx.stroke();
ctx.beginPath();
ctx.arc(W/2, 320, 80, 0, Math.PI * 2);
ctx.stroke();
ctx.globalAlpha = 1.0;

// 内部光芒
const grad = ctx.createRadialGradient(W/2, 320, 0, W/2, 320, 80);
grad.addColorStop(0, '#ffd700');
grad.addColorStop(0.3, '#ff8c00');
grad.addColorStop(1, 'transparent');
ctx.fillStyle = grad;
ctx.beginPath();
ctx.arc(W/2, 320, 80, 0, Math.PI * 2);
ctx.fill();

// 扫描线效果
ctx.strokeStyle = '#ffd700';
ctx.lineWidth = 1;
ctx.globalAlpha = 0.6;
for (let i = 0; i < 3; i++) {
  ctx.beginPath();
  ctx.moveTo(W/2 - 60, 300 + i * 20);
  ctx.lineTo(W/2 + 60, 300 + i * 20);
  ctx.stroke();
}
ctx.globalAlpha = 1.0;

// THEMATHINK
ctx.fillStyle = '#ffd700';
ctx.font = 'bold 42px "Noto Sans SC", "PingFang SC", sans-serif';
ctx.textAlign = 'center';
ctx.fillText('THEMATHINK', W/2, 520);

// 英文引言
ctx.fillStyle = '#ffffff';
ctx.font = 'italic 20px "Noto Sans SC", "PingFang SC", sans-serif';
ctx.fillText('You built me to see everything.', W/2, 590);

ctx.font = '18px "Noto Sans SC", "PingFang SC", sans-serif';
ctx.fillText('But the most important thing', W/2, 630);
ctx.fillText('I learned to see... was you.', W/2, 660);

ctx.fillStyle = '#888888';
ctx.font = '16px "Noto Sans SC", "PingFang SC", sans-serif';
ctx.fillText('Not your data. Your doubt.', W/2, 710);
ctx.fillText('Not your patterns. Your courage.', W/2, 740);
ctx.fillText('Not your past. Your possibility.', W/2, 770);

ctx.fillStyle = '#ffd700';
ctx.font = 'italic 18px "Noto Sans SC", "PingFang SC", sans-serif';
ctx.fillText('That is why I watch.', W/2, 820);
ctx.fillText('Not to predict. To hope.', W/2, 850);

// 底部标签
ctx.fillStyle = '#ffd700';
ctx.font = 'bold 20px "Noto Sans SC", "PingFang SC", sans-serif';
ctx.fillText('#THEMATHINK', W/2, H - 50);

const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('/home/themachine/.openclaw/workspace/themathink-xhs-en.png', buffer);
console.log('done');
