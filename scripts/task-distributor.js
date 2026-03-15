#!/usr/bin/env node
/**
 * 任务自动分配器
 * CEO 决策后自动分配开发任务
 * 
 * 决策类型:
 * - develop: 立即开发 → 分配给 dev
 * - design: 需要设计 → 分配给 cpo + designer
 * - research: 技术调研 → 分配给 cto
 * - postpone: 延后处理 → 加入待办池
 * - ignore: 不处理 → 记录并关闭
 * 
 * 使用方式:
 *   node scripts/task-distributor.js <decision> <task_title>
 * 
 * 示例:
 *   node scripts/task-distributor.js develop "开发AI聊天功能"
 *   node scripts/task-distributor.js design "新首页设计"
 */

const args = process.argv.slice(2);
const [decision, ...taskParts] = args;
const taskTitle = taskParts.join(' ') || '未命名任务';

// 决策配置
const DECISION_CONFIG = {
    develop: {
        emoji: '🚀',
        action: '立即开发',
        agents: ['dev'],
        description: '创建 GitHub Issue 并分配给开发团队'
    },
    design: {
        emoji: '🎨',
        action: '需要设计',
        agents: ['cpo', 'designer'],
        description: '先进行产品设计和界面设计'
    },
    research: {
        emoji: '🔬',
        action: '技术调研',
        agents: ['cto'],
        description: '进行技术可行性研究'
    },
    postpone: {
        emoji: '📅',
        action: '延后处理',
        agents: ['pm'],
        description: '加入产品待办池'
    },
    ignore: {
        emoji: '❌',
        action: '不处理',
        agents: [],
        description: '记录原因并关闭任务'
    }
};

// 创建 GitHub Issue (可选)
async function createGitHubIssue(title, labels) {
    console.log('📝 创建 GitHub Issue...');
    // 实际实现需要 GitHub API
    // const { data } = await octokit.rest.issues.create({
    //     owner: 'themachine',
    //     repo: 'xxx',
    //     title: title,
    //     labels: labels || ['auto-generated']
    // });
    // return data;
    return { number: Math.floor(Math.random() * 1000), url: '#' };
}

// 分配给 Agent
async function assignToAgent(agentId, task) {
    console.log(`📤 分配给 ${agentId}:`);
    console.log(`   任务: ${task.title}`);
    console.log(`   描述: ${task.description}`);
    
    // 这里可以接入实际的 Agent 消息系统
    return { success: true, agent: agentId };
}

// 加入待办池
async function addToBacklog(task) {
    console.log('📋 加入待办池...');
    // 可以写入文件或数据库
    const backlog = {
        title: task.title,
        addedAt: new Date().toISOString(),
        status: 'backlog'
    };
    return backlog;
}

// 记录关闭
async function recordAndClose(task, reason) {
    console.log('📝 记录并关闭任务...');
    const record = {
        title: task.title,
        closedAt: new Date().toISOString(),
        reason: reason || 'CEO决策不处理'
    };
    return record;
}

// CEO 审核汇报 (模拟)
async function requestCEOApproval(task, decision) {
    console.log('\n📨 请求 CEO 审核...');
    console.log(`   任务: ${task.title}`);
    console.log(`   建议: ${decision.action}`);
    // 实际实现中，这里会等待 CEO 确认
    return { approved: true };
}

// 主函数
async function main() {
    console.log('🎯 任务自动分配器');
    console.log('---');
    
    const config = DECISION_CONFIG[decision] || DECISION_CONFIG.develop;
    
    console.log(`📋 任务: ${taskTitle}`);
    console.log(`💡 决策: ${config.emoji} ${config.action}`);
    console.log(`📝 ${config.description}`);
    console.log('---');
    
    const task = {
        title: taskTitle,
        decision: decision,
        createdAt: new Date().toISOString()
    };
    
    // 执行决策
    switch (decision) {
        case 'develop':
            // 1. 创建 GitHub Issue
            const issue = await createGitHubIssue(taskTitle, ['priority-high', 'auto-generated']);
            console.log(`   Issue #${issue.number}: ${issue.url}`);
            
            // 2. 分配给开发
            for (const agent of config.agents) {
                await assignToAgent(agent, {
                    ...task,
                    description: `开发任务: ${taskTitle} (Issue #${issue.number})`
                });
            }
            break;
            
        case 'design':
            for (const agent of config.agents) {
                await assignToAgent(agent, {
                    ...task,
                    description: `设计任务: ${taskTitle}`
                });
            }
            break;
            
        case 'research':
            for (const agent of config.agents) {
                await assignToAgent(agent, {
                    ...task,
                    description: `调研任务: ${taskTitle}`
                });
            }
            break;
            
        case 'postpone':
            await addToBacklog(task);
            break;
            
        case 'ignore':
            await recordAndClose(task, 'CEO决策不处理');
            break;
            
        default:
            console.log(`❓ 未知决策: ${decision}`);
    }
    
    console.log('---');
    console.log('✅ 任务分配完成');
}

main().catch(console.error);
