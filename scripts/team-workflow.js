// THEMACHINE 团队自动运作
// 1. 检查 Radar 任务完成 → 触发讨论
// 2. 检查讨论完成 → CEO 决策
// 3. CEO 决策 → 分配新任务

const API = 'https://themachine-auth.jxs66.workers.dev';

async function checkAndTrigger() {
  console.log('🔄 检查团队运作状态...');
  
  // 1. 获取待处理任务
  const tasksRes = await fetch(API + '/api/tasks?status=pending');
  const tasks = await tasksRes.json();
  
  // 2. 检查分析任务是否都完成
  const analysisTasks = tasks.filter(t => t.title.includes('[Radar]'));
  const allAnalyzed = analysisTasks.length === 0; // 如果没有 pending 的分析任务
  
  if (allAnalyzed) {
    console.log('✅ 分析完成，触发团队讨论...');
    
    // 创建讨论任务
    await fetch(API + '/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '[Team] 团队周会 - 讨论 Radar 发现',
        description: 'CMO/CFO/CTO 汇报分析结果，讨论可行项目',
        priority: 'high',
        assigned_agent_id: 'ceo'
      })
    });
  }
  
  // 3. 检查讨论任务状态 → CEO 决策
  const discussionTasks = tasks.filter(t => t.title.includes('[Team]') && t.status === 'done');
  if (discussionTasks.length > 0) {
    console.log('📋 讨论完成，CEO 决策中...');
  }
  
  console.log('✅ 检查完成');
}

checkAndTrigger();
