#!/usr/bin/env node
/**
 * Agent 自动汇报系统
 * Agent 执行完任务后自动生成汇报发送给 CEO
 * 
 * 使用方式:
 *   node scripts/auto-report.js <agent_id> <task_id> <status> <duration>
 * 
 * 示例:
 *   node scripts/auto-report.js dev 123 success 300
 */

const args = process.argv.slice(2);
const [agentId, taskId, status = 'success', duration = 0] = args;

// 状态映射
const STATUS_MAP = {
    success: { emoji: '✅', text: '完成' },
    warning: { emoji: '⚠️', text: '警告' },
    failed: { emoji: '❌', text: '失败' },
    pending: { emoji: '⏳', text: '进行中' }
};

// Agent 名称映射
const AGENT_NAMES = {
    main: 'THE MACHINE (CEO)',
    cfo: 'Alex (CFO)',
    cto: 'Kevin (CTO)',
    cpo: 'Sarah (CPO)',
    cmo: 'Mike (CMO)',
    sec: 'David (SEC)',
    dev: 'Chris (DEV)',
    hr: 'Lisa (HR)',
    growth: 'Max (GROWTH)',
    designer: 'Luna (DESIGNER)',
    engineer: 'Ray (ENGINEER)',
    content: 'Coco (CONTENT)',
    pm: 'Kim (PM)',
    data: 'Ava (DATA)'
};

// 生成汇报
function generateReport(agentId, taskId, status, duration) {
    const agentName = AGENT_NAMES[agentId] || agentId;
    const statusInfo = STATUS_MAP[status] || STATUS_MAP.success;
    const durationText = formatDuration(parseInt(duration));
    
    let report = `## 📋 执行报告

**任务ID**: ${taskId}
**执行者**: ${agentName}
**状态**: ${statusInfo.emoji} ${statusInfo.text}
**耗时**: ${durationText}
**时间**: ${new Date().toISOString().replace('T', ' ').substring(0, 19)}

---

### 📊 执行结果

`;

    if (status === 'success') {
        report += `任务已成功完成。详细内容请查看相关日志。`;
    } else if (status === 'warning') {
        report += `任务执行过程中出现警告，但已处理完毕。`;
    } else if (status === 'failed') {
        report += `任务执行失败，需要进一步排查。`;
    }

    report += `

---

### 💡 下一步建议

`;

    if (status === 'success') {
        report += `- 等待 CEO 审核决策
- 如需进一步开发，将分配给 Dev 团队
- 归档任务记录`;
    } else if (status === 'failed') {
        report += `- 需要人工介入处理
- 分析失败原因
- 重新分配任务`;
    }

    report += `

---

*由 THEMACHINE Corp. 自动汇报系统生成*`;

    return report;
}

// 格式化时长
function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}小时${minutes % 60}分钟`;
    if (minutes > 0) return `${minutes}分钟${seconds % 60}秒`;
    return `${seconds}秒`;
}

// 发送到 CEO
async function sendToCEO(report) {
    console.log('📤 发送汇报给 CEO...\n');
    console.log(report);
    console.log('\n---');
    
    // 这里可以接入实际的 Discord webhook 或消息系统
    // await fetch(DISCORD_WEBHOOK_URL, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //         content: report,
    //         embeds: [{
    //             title: '📋 新任务执行报告',
    //             description: report.substring(0, 4000),
    //             timestamp: new Date().toISOString()
    //         }]
    //     })
    // });
    
    return { success: true };
}

// 主函数
async function main() {
    console.log('🎯 Agent 自动汇报系统');
    console.log('---');
    
    const report = generateReport(agentId, taskId, status, duration);
    await sendToCEO(report);
    
    console.log('✅ 汇报已发送');
}

main().catch(console.error);
