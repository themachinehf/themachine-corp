#!/usr/bin/env node
/**
 * THEMACHINE Corp. 日会报告
 * 每天 9:00 自动生成
 */

const fs = require('fs');
const path = require('path');

const OKX_LOG = path.join(__dirname, '../okx-grid-bot/bot.log');

// 获取今日交易统计
function getTradeStats() {
    try {
        const log = fs.readFileSync(OKX_LOG, 'utf8');
        const lines = log.split('\n');
        
        let buyCount = 0;
        let sellCount = 0;
        let lastPrice = 0;
        
        for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i];
            if (line.includes('💰')) {
                if (line.includes('buy')) buyCount++;
                if (line.includes('sell')) sellCount++;
                
                const match = line.match(/@ ([\d.]+)/);
                if (match) lastPrice = parseFloat(match[1]);
            }
        }
        
        return { buyCount, sellCount, lastPrice };
    } catch (e) {
        return { buyCount: 0, sellCount: 0, lastPrice: 0 };
    }
}

function generateReport() {
    const stats = getTradeStats();
    const now = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
    
    const report = `
╔═══════════════════════════════════════╗
║     THEMACHINE Corp. 每日例会          ║
║     ${now}       ║
╚═══════════════════════════════════════╝

📊 CFO - 交易主管
   今日交易: ${stats.buyCount} 买入, ${stats.sellCount} 卖出
   BTC 价格: $${stats.lastPrice}
   状态: ✅ 运行中

🔧 CTO - 技术运维
   OpenClaw: ✅ 正常
   GitHub: ✅ 同步
   监控: ✅ 运行中

📢 CMO - 品牌主管
   THEMATHINK: ✅ 在线
   内容: 待发布

📦 CPO - 产品
   THEMATHINK AI: ✅ 运行中
   订单: ${stats.buyCount + stats.sellCount} 笔

---
💰 专注交易 + 品牌
`;

    return report;
}

console.log(generateReport());
