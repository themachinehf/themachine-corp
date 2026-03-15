#!/usr/bin/env node
/**
 * 代码自动优化器
 * 发现问题 → 优化 → 自动提交推送
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';

const projects = [
    { name: 'Mystic AI', path: 'ai-mystic-test', vercel: 'mystic-ai-henna.vercel.app' },
    { name: 'Dashboard', path: 'dashboard', vercel: 'themachine-dashboard.vercel.app' }
];

function checkProject(project) {
    console.log(`\n🔍 扫描 ${project.name}...`);

    // 1. 检查代码质量问题
    const issues = scanForIssues(project.path);

    if (issues.length > 0) {
        console.log(`📝 发现 ${issues.length} 个优化点，正在修复...`);
        applyOptimizations(project.path, issues);
        commitAndPush(project);
    } else {
        console.log(`✅ ${project.name} 状态良好`);
    }
}

function scanForIssues(path) {
    const issues = [];

    // 检查 JS 文件格式
    try {
        const jsFiles = execSync(`find ${path} -name "*.js" -type f`, { encoding: 'utf8' }).split('\n');
        
        for (const file of jsFiles) {
            if (!file) continue;
            
            // 检查 console.log
            const content = readFileSync(file, 'utf8');
            if (content.includes('console.log(') && !content.includes('// eslint-disable')) {
                issues.push({ type: 'cleanup', file, reason: '移除调试日志' });
            }
        }
    } catch (e) {}

    // 检查 CSS 重复代码
    try {
        const cssFiles = execSync(`find ${path} -name "*.css" -type f`, { encoding: 'utf8' }).split('\n');
        
        for (const file of cssFiles) {
            if (!file) continue;
            
            const content = readFileSync(file, 'utf8');
            
            // 检查过时的注释
            if (content.includes('TODO') || content.includes('FIXME')) {
                issues.push({ type: 'cleanup', file, reason: '清理 TODO/FIXME' });
            }
        }
    } catch (e) {}

    return issues;
}

function applyOptimizations(path, issues) {
    for (const issue of issues) {
        if (issue.type === 'cleanup') {
            let content = readFileSync(issue.file, 'utf8');
            
            // 移除 console.log（保留错误日志）
            content = content.replace(/console\.log\([^)]+\);?/g, '');
            
            writeFileSync(issue.file, content);
            console.log(`  ✅ 优化: ${issue.file}`);
        }
    }
}

function commitAndPush(path) {
    try {
        const today = new Date().toISOString().split('T')[0];
        execSync('git add -A', { cwd: path });
        execSync(`git commit -m "refactor: code optimization ${today}"`, { cwd: path });
        execSync('git push origin main', { cwd: path });
        console.log(`  ✅ 已推送`);
    } catch (e) {
        console.log(`  ⚠️ 推送失败: ${e.message}`);
    }
}

// 运行优化
console.log('🚀 开始代码自动优化...');
for (const project of projects) {
    checkProject(project);
}
console.log('\n✅ 优化完成！');
