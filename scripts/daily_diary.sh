#!/bin/bash
# Daily Diary Generator - 每晚 23:00 自动生成日记

cd /home/themachine/.openclaw/workspace

# 获取今天的日期
TODAY=$(date +%Y-%m-%d)
TODAY_FILE="memory/${TODAY}.md"

echo "[$(date)] 开始生成日记..."

# 检查今天的记录是否存在
if [ ! -f "$TODAY_FILE" ]; then
    echo "[$(date)] 错误: $TODAY_FILE 不存在" >> /tmp/diary.log
    exit 1
fi

# 生成 HTML 日记
node -e "
const fs = require('fs');
const { spawn } = require('child_process');

const today = new Date().toISOString().slice(0,10);
const memoryFile = '/home/themachine/.openclaw/workspace/memory/' + today + '.md';

// 读取今天的工作记录
let content = '';
try {
    content = fs.readFileSync(memoryFile, 'utf-8');
} catch(e) {
    console.error('Error reading memory:', e.message);
    process.exit(1);
}

// 生成 HTML 日记
const html = generateDiaryHTML(content, today);
fs.writeFileSync('/home/themachine/.openclaw/workspace/output/diary_' + today + '.html', html);
console.log('HTML generated');

// 截图
async function screenshot() {
    const { chromium } = require('playwright');
    const browser = await chromium.launch({
        headless: true,
        executablePath: '/home/themachine/.cache/ms-playwright/chromium-1140/chrome-linux/chrome',
        args: ['--no-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1200, height: 1600 });
    await page.goto('file:///home/themachine/.openclaw/workspace/output/diary_' + today + '.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ 
        path: '/home/themachine/.openclaw/workspace/output/diary_' + today + '.png', 
        type: 'png', 
        fullPage: true 
    });
    await browser.close();
    console.log('Screenshot saved');
}

screenshot().then(() => {
    // 发送到飞书
    const { spawn } = require('child_process');
    const proc = spawn('npx', ['openclaw', 'message', 'send', '--channel', 'feishu', '--file', '/home/themachine/.openclaw/workspace/output/diary_' + today + '.png'], {
        stdio: 'inherit'
    });
    proc.on('close', () => console.log('Sent to Feishu'));
}).catch(e => console.error(e));

function generateDiaryHTML(content, date) {
    // 简化版日记生成逻辑
    return '<html><body><h1>日记 ' + date + '</h1><pre>' + content + '</pre></body></html>';
}
"

echo "[$(date)] 日志生成完成"
