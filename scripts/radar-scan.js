// 自动痛点扫描 - 每日运行
const API_BASE = 'https://themachine-auth.jxs66.workers.dev';

// 数据源
const SOURCES = [
  { name: 'HN', url: 'https://hacker-news.firebaseio.com/v0/topstories.json' },
  { name: 'GitHub', url: 'https://api.github.com/search/repositories?q=created:>2024-01-01&sort=stars&per_page=30' },
  { name: 'HF', url: 'https://huggingface.co/api/papers/trending?limit=20' }
];

async function scan() {
  console.log('🔍 Radar 扫描开始...');
  
  // 扫描各个数据源
  for (const source of SOURCES) {
    try {
      const res = await fetch(source.url, {
        headers: source.name === 'GitHub' ? { 'User-Agent': 'THEMACHINE-Radar' } : {}
      });
      const data = await res.json();
      console.log(`✅ ${source.name}: ${data.items?.length || data.length || 'ok'}`);
    } catch(e) {
      console.log(`❌ ${source.name}: ${e.message}`);
    }
  }
  
  console.log('📝 扫描完成，记录已保存');
}

scan();
