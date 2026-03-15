#!/usr/bin/env node
/**
 * 定时调度器
 * - 每4小时检查项目变更并提交
 * - 每天自动代码优化
 * - 每周一自动痛点挖掘
 */

import { execSync } from 'child_process';

const OPTIMIZE_INTERVAL = 24 * 60 * 60 * 1000; // 24小时
const CHECK_INTERVAL = 4 * 60 * 60 * 1000;    // 4小时
const WEEKLY_PAIN_POINTS_DAY = 1; // 周一
const WEEKLY_PAIN_POINTS_HOUR = 9; // 9点

async function runOptimizer() {
    try {
        console.log('🕐 定时优化任务启动...');
        execSync('node scripts/code-optimizer.js', { cwd: '/home/themachine/.openclaw/workspace' });
    } catch (e) {
        console.error('优化失败:', e.message);
    }
}

async function runChecker() {
    try {
        console.log('🕐 项目状态检查...');
        execSync('node scripts/auto-update-projects.js', { cwd: '/home/themachine/.openclaw/workspace' });
    } catch (e) {
        console.error('检查失败:', e.message);
    }
}

async function runPainPointsMining() {
    try {
        console.log('🔍 开始每周痛点挖掘...');
        // 调用痛点挖掘系统
        const { exec } = await import('child_process');
        
        // 本地运行痛点采集（如果Worker不可用）
        exec('cd pain-points-system && node -e "import(\"./worker.js\").then(m => m.default.fetch(new Request(\"/collect\")).then(r => r.json()).then(console.log))"', 
            { cwd: '/home/themachine/.openclaw/workspace' },
            (error, stdout, stderr) => {
                if (error) {
                    console.log('痛点采集需要 Cloudflare Worker 环境');
                    return;
                }
                console.log('✅ 痛点挖掘完成');
                // TODO: 发送报告给 CEO
            }
        );
    } catch (e) {
        console.error('痛点挖掘失败:', e.message);
    }
}

// 启动
console.log('📅 调度器已启动...');
console.log(`优化周期: ${OPTIMIZE_INTERVAL / 3600000}小时`);
console.log(`检查周期: ${CHECK_INTERVAL / 3600000}小时`);

// 主循环
let lastOptimize = Date.now();
let lastPainPoints = Date.now();

setInterval(() => {
    const now = Date.now();
    const currentDay = new Date().getDay();
    const currentHour = new Date().getHours();
    
    // 优化检查
    if (now - lastOptimize > OPTIMIZE_INTERVAL) {
        runOptimizer();
        lastOptimize = now;
    }
    
    // 痛点挖掘检查 - 每周一9点
    const shouldRunPainPoints = 
        currentDay === WEEKLY_PAIN_POINTS_DAY && 
        currentHour >= WEEKLY_PAIN_POINTS_HOUR &&
        now - lastPainPoints > 24 * 60 * 60 * 1000;
    
    if (shouldRunPainPoints) {
        runPainPointsMining();
        lastPainPoints = now;
    }
    
    // 常规检查
    runChecker();
    
}, CHECK_INTERVAL);

// 立即运行一次
runChecker();
