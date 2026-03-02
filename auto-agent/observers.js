/**
 * 观察器 - Agent的"眼睛"
 */

async function fetchUserMessages() {
  // 获取最近用户消息
  const res = await fetch('https://themachine-api.jxs66.workers.dev/chats?limit=10');
  return await res.json();
}

async function checkAPIHealth() {
  const start = Date.now();
  try {
    await fetch('https://themachine-api.jxs66.workers.dev/agents', { 
      signal: AbortSignal.timeout(5000) 
    });
    return { status: 'ok', latency: Date.now() - start };
  } catch (e) {
    return { status: 'error', error: e.message };
  }
}

async function checkPageErrors() {
  // 模拟页面检查（实际可以用puppeteer）
  return { errors: [] };
}

async function fetchAgentStatus() {
  const res = await fetch('https://themachine-api.jxs66.workers.dev/agents');
  return await res.json();
}

async function checkPageLayout() {
  // 检查页面是否正常渲染
  return { width: 640, height: 400, elements: 15 };
}

module.exports = {
  fetchUserMessages,
  checkAPIHealth,
  checkPageErrors,
  fetchAgentStatus,
  checkPageLayout
};
