#!/usr/bin/env node
/**
 * Moltbook 抓取工具 - Node.js 版本
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const OUTPUT_DIR = path.join(__dirname, '..', 'output');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'moltbook_fetch.json');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function fetchMoltbook() {
  console.log('正在访问 Moltbook...');
  
  return new Promise((resolve, reject) => {
    const req = https.get('https://moltbook.com', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (res) => {
      let data = '';
      
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`获取到 ${data.length} 字节的内容`);
        
        // 提取页面标题
        const titleMatch = data.match(/<title>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1] : 'Moltbook';
        
        // 提取主要内容
        const bodyMatch = data.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        let content = '';
        if (bodyMatch) {
          // 移除 HTML 标签获取纯文本
          content = bodyMatch[1]
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 5000);
        }
        
        // 尝试查找 Agents 相关内容
        const agentsSection = content.toLowerCase().includes('agent') || 
                              content.toLowerCase().includes('discover');
        
        const result = {
          url: 'https://moltbook.com',
          title: title,
          content: content,
          agents_section: agentsSection,
          timestamp: new Date().toISOString()
        };
        
        // 保存结果
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2), 'utf8');
        console.log(`结果已保存到: ${OUTPUT_FILE}`);
        console.log(`\n=== 页面内容预览 ===\n${content.slice(0, 1500)}`);
        
        resolve(result);
      });
    });
    
    req.on('error', (e) => {
      console.error(`请求错误: ${e.message}`);
      reject(e);
    });
    
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('请求超时'));
    });
  });
}

fetchMoltbook()
  .then(() => {
    console.log('\n✅ 抓取完成');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ 抓取失败:', err.message);
    process.exit(1);
  });
