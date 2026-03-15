#!/usr/bin/env node
/**
 * Daily Diary Generator - 纯散文格式
 */

const fs = require('fs');
const sharp = require('sharp');

const today = new Date().toISOString().slice(0, 10);
const memoryFile = `/home/themachine/.openclaw/workspace/memory/${today}.md`;
const outputDir = '/home/themachine/.openclaw/workspace/output';
const pngFile = `${outputDir}/diary_${today}.png`;

function log(msg) { console.log(`[${new Date().toISOString()}] ${msg}`); }

function cleanMarkdown(text) {
    return text
        .replace(/^#+\s+/gm, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/^- (.+)$/gm, '$1')
        .replace(/^\d+\. (.+)$/gm, '$1')
        .replace(/\[\]\s*/g, '')
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
        .trim();
}

function readMemory() {
    try { return fs.readFileSync(memoryFile, 'utf-8'); } 
    catch { return '今天暂无记录。'; }
}

function generateSVG(content, chineseDate, today) {
    const cleanText = cleanMarkdown(content);
    const paragraphs = cleanText.split(/\n\n+/).filter(p => p.trim());
    
    // 简化：只显示日期和摘要
    const summary = cleanText.substring(0, 500) + (cleanText.length > 500 ? '...' : '');
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="900" height="1200" viewBox="0 0 900 1200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a0a"/>
      <stop offset="100%" style="stop-color:#141414"/>
    </linearGradient>
  </defs>
  
  <!-- 背景 -->
  <rect width="900" height="1200" fill="url(#bg)"/>
  
  <!-- 边框装饰 -->
  <rect x="20" y="20" width="860" height="1160" fill="none" stroke="rgba(139,115,85,0.2)" stroke-width="1"/>
  
  <!-- 日期 -->
  <text x="450" y="120" text-anchor="middle" fill="#8b7355" font-family="serif" font-size="16" letter-spacing="8">${chineseDate}</text>
  <text x="450" y="200" text-anchor="middle" fill="#8b7355" font-family="serif" font-size="80" font-weight="200">${today.slice(-2)}</text>
  <text x="450" y="240" text-anchor="middle" fill="#8b7355" font-family="serif" font-size="16" letter-spacing="6" opacity="0.5">${new Date(today).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()}</text>
  
  <!-- 分隔线 -->
  <line x1="420" y1="280" x2="480" y2="280" stroke="rgba(139,115,85,0.4)" stroke-width="1"/>
  
  <!-- 纯散文内容 -->
  <foreignObject x="60" y="320" width="780" height="800">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: serif; font-size: 18px; line-height: 2.0; color: #d4c4a8; text-align: justify;">
      <p style="margin-bottom: 24px; text-indent: 2em;">${summary.replace(/\n/g, ' ')}</p>
    </div>
  </foreignObject>
  
  <!-- 签名 -->
  <text x="450" y="1140" text-anchor="middle" fill="#8b7355" font-family="serif" font-size="28" font-style="italic" opacity="0.8">The Machine</text>
  <text x="450" y="1170" text-anchor="middle" fill="#8b7355" font-family="serif" font-size="10" letter-spacing="4" opacity="0.4">A I · DAILY · DIARY</text>
</svg>`;
}

function getChineseDate(dateStr) {
    const months = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
    return `${months[parseInt(dateStr.slice(5, 7))-1]}月${parseInt(dateStr.slice(8))}日`;
}

async function generate() {
    log('生成纯散文日记...');
    
    const content = readMemory();
    const svg = generateSVG(content, getChineseDate(today), today);
    
    await sharp(Buffer.from(svg))
        .png({ quality: 90 })
        .toFile(pngFile);
    
    log(`PNG: ${pngFile}`);
    return pngFile;
}

generate().catch(err => { log('错误: ' + err.message); process.exit(1); });
