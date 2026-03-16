export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // 真实 RSS 数据源 (公开合法)
    const RSS_SOURCES = [
      'https://feeds.bbci.co.uk/news/world/rss.xml',
      'https://rss.nytimes.com/services/xml/rss/nyt/World.xml'
    ];
    
    // 犯罪关键词 (用于分析)
    const CRIME_KEYWORDS = {
      violent: ['murder', 'killing', 'assault', 'attack', 'shooting', 'kidnap', 'abduction', 'hostage'],
      property: ['burglary', 'theft', 'robbery', 'steal', 'break-in', 'larceny', 'vandalism'],
      cyber: ['cyber', 'hack', 'phishing', 'malware', 'ransomware', 'data breach', 'online scam'],
      fraud: ['fraud', 'scam', 'con', 'embezzlement', 'money laundering', 'ponzi']
    };
    
    // 获取 RSS
    async function fetchRSS(rssUrl) {
      try {
        const res = await fetch(rssUrl, { 
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(5000)
        });
        const text = await res.text();
        
        // 简单解析
        const items = [];
        const regex = /<item[^>]*>[\s\S]*?<title>([^<]+)<\/title>[\s\S]*?<link>([^<]+)<\/link>[\s\S]*?<\/item>/g;
        let match;
        while ((match = regex.exec(text)) !== null && items.length < 15) {
          items.push({
            title: match[1].trim(),
            link: match[2].trim()
          });
        }
        return items;
      } catch (e) {
        return [];
      }
    }
    
    // 分析新闻
    function analyzeNews(allNews) {
      const crimes = { violent: [], property: [], cyber: [], fraud: [], other: [] };
      const scores = { violent: 0, property: 0, cyber: 0, fraud: 0 };
      
      allNews.forEach(news => {
        const title = news.title.toLowerCase();
        
        // 分类
        let found = false;
        for (const [category, keywords] of Object.entries(CRIME_KEYWORDS)) {
          if (keywords.some(k => title.includes(k))) {
            crimes[category].push(news);
            scores[category]++;
            found = true;
            break;
          }
        }
        if (!found && title.includes('crime')) {
          crimes.other.push(news);
        }
      });
      
      return { crimes, scores };
    }
    
    // 计算风险
    function calculateRisk(scores, total) {
      const base = 20;
      const max = 95;
      
      const violent = Math.min(max, base + (scores.violent / total) * 80);
      const property = Math.min(max, base + (scores.property / total) * 75);
      const cyber = Math.min(max, base + (scores.cyber / total) * 70);
      const fraud = Math.min(max, base + (scores.fraud / total) * 85);
      
      const overall = Math.max(violent, property, cyber, fraud);
      
      return {
        violent: Math.round(violent),
        property: Math.round(property),
        cyber: Math.round(cyber),
        fraud: Math.round(fraud),
        overallRisk: overall > 60 ? 'HIGH' : overall > 35 ? 'MEDIUM' : 'LOW',
        level: overall
      };
    }
    
    // 生成建议
    function generateRecommendations(risk) {
      const recs = [];
      if (risk.violent > 40) recs.push({ type: 'warning', text: '增加夜间巡逻' });
      if (risk.property > 50) recs.push({ type: 'warning', text: '加强防盗措施' });
      if (risk.cyber > 45) recs.push({ type: 'warning', text: '提高网络安全意识' });
      if (risk.fraud > 50) recs.push({ type: 'warning', text: '防范电信诈骗' });
      if (recs.length === 0) recs.push({ type: 'safe', text: '整体安全状况良好' });
      return recs;
    }
    
    // 主逻辑
    let allNews = [];
    let sources = [];
    
    // 尝试获取 RSS
    for (const rssUrl of RSS_SOURCES) {
      const items = await fetchRSS(rssUrl);
      if (items.length > 0) {
        allNews = [...allNews, ...items];
        sources.push(rssUrl.split('/')[2]);
      }
    }
    
    // 如果 RSS 失败，使用模拟数据
    if (allNews.length < 5) {
      const mockTitles = [
        'Police investigate burglary wave in residential areas',
        'Cybercrime cases rise sharply this quarter',
        'New fraud prevention measures announced',
        'Assault incident leads to increased patrols',
        'Robbery caught on camera in downtown',
        'Fraud ring busted by authorities',
        'Theft reports increase near shopping centers'
      ];
      allNews = mockTitles.map(t => ({ title: t, link: '#' }));
      sources = ['Simulated Data (RSS unavailable)'];
    }
    
    // 分析
    const { crimes, scores } = analyzeNews(allNews);
    const risk = calculateRisk(scores, allNews.length);
    const recommendations = generateRecommendations(risk);
    
    // 响应
    const response = {
      success: true,
      data: {
        totalNews: allNews.length,
        news: allNews.slice(0, 10).map(n => ({
          ...n,
          category: Object.entries(CRIME_KEYWORDS).find(([k, v]) => 
            v.some(keyword => n.title.toLowerCase().includes(keyword))
          )?.[0] || 'other'
        })),
        risk: risk,
        recommendations: recommendations,
        sources: sources,
        crimeBreakdown: {
          violent: crimes.violent.length,
          property: crimes.property.length,
          cyber: crimes.cyber.length,
          fraud: crimes.fraud.length
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        disclaimer: 'Data from public RSS feeds. For demonstration only.'
      }
    };
    
    return new Response(JSON.stringify(response, null, 2), {
      headers: { 
        'Content-Type': 'application/json', 
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      }
    });
  }
};
