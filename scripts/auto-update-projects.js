#!/usr/bin/env node
/**
 * 自动更新 Mystic AI 和 Dashboard 项目
 * 运行方式: node scripts/auto-update-projects.js
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const projects = [
    {
        name: 'Mystic AI',
        path: 'ai-mystic-test',
        vercelUrl: 'mystic-ai-henna.vercel.app'
    },
    {
        name: 'Dashboard',
        path: 'dashboard',
        vercelUrl: 'themachine-dashboard.vercel.app'
    }
];

function runCommand(cmd, cwd) {
    try {
        execSync(cmd, { cwd, stdio: 'inherit' });
        return true;
    } catch (e) {
        console.error(`命令失败: ${cmd}`);
        return false;
    }
}

function checkAndUpdate(project) {
    console.log(`\n🔍 检查 ${project.name}...`);

    const status = execSync('git status --porcelain', { cwd: project.path, encoding: 'utf8' });

    if (status.trim()) {
        console.log(`📝 ${project.name} 有变更，正在提交...`);

        // 添加所有变更
        runCommand('git add -A', project.path);

        // 获取今日日期作为 commit 消息
        const today = new Date().toISOString().split('T')[0];
        const msg = `chore: daily update ${today}`;

        // 提交
        if (runCommand(`git commit -m "${msg}"`, project.path)) {
            // 推送
            if (runCommand('git push origin main', project.path)) {
                console.log(`✅ ${project.name} 已推送，等待 Vercel 部署...`);
                return true;
            }
        }
    } else {
        console.log(`✅ ${project.name} 无变更`);
        return true;
    }
    return false;
}

console.log('🚀 开始自动更新项目...');

let allSuccess = true;

for (const project of projects) {
    if (!checkAndUpdate(project)) {
        allSuccess = false;
    }
}

console.log('\n' + '='.repeat(50));
if (allSuccess) {
    console.log('✅ 所有项目更新完成！');
} else {
    console.log('⚠️ 部分项目更新失败，请检查');
}
