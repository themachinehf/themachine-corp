#!/usr/bin/env node
/**
 * Trading Insights Generator
 * 每隔一段时间生成交易见解并发送到 Telegram
 */

const fs = require('fs');
const path = require('path');

const BOT_LOG = path.join(__dirname, '../okx-grid-bot/bot.log');
const STATE_FILE = path.join(__dirname, '../themathink-ai/insight-state.json');

function loadState() {
    try {
        if (fs.existsSync(STATE_FILE)) {
            return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
        }
    } catch (e) {}
    return { lastPrice: 0, lastInsight: '', lastSent: 0 };
}

function saveState(state) {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function getLatestTrade() {
    try {
        const log = fs.readFileSync(BOT_LOG, 'utf8');
        const lines = log.split('\n');
        
        // Find last trade
        for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i];
            if (line.includes('BTC/USDT') && (line.includes('buy') || line.includes('sell'))) {
                // Extract price
                const priceMatch = line.match(/@ (\d+\.\d+)/);
                const actionMatch = line.match(/(buy|sell)/);
                const timeMatch = line.match(/\[(.*?)\]/);
                
                if (priceMatch && actionMatch) {
                    return {
                        price: parseFloat(priceMatch[1]),
                        action: actionMatch[1],
                        time: timeMatch ? timeMatch[1] : ''
                    };
                }
            }
        }
    } catch (e) {
        console.error('Error reading log:', e.message);
    }
    return null;
}

async function generateInsight(price, action) {
    const styles = ['philosophical', 'analytical', 'concise'];
    const style = styles[Math.floor(Math.random() * styles.length)];
    
    // Call the insight API
    const API_KEY = process.env.MINIMAX_API_KEY || '';
    
    if (!API_KEY) {
        return null;
    }
    
    const prompts = {
        philosophical: `你是 THE MACHINE，一个哲学化的 AI。用一句话概括当前 BTC 市场。`,
        analytical: `你是专业分析师。用一句话分析当前 BTC 走势。`,
        concise: `用不超过 20 个字评论当前 BTC 走势。`
    };
    
    try {
        const response = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'MiniMax-M2.1',
                tokens_to_generate: 100,
                temperature: 0.8,
                messages: [
                    { role: 'system', content: prompts[style] },
                    { role: 'user', content: `BTC 当前价格 $${price}，信号: ${action}` }
                ]
            }),
            signal: AbortSignal.timeout(10000)
        });
        
        const data = await response.json();
        return data.choices?.[0]?.message?.content?.trim() || null;
    } catch (e) {
        console.error('Generate error:', e.message);
        return null;
    }
}

async function main() {
    const state = loadState();
    const trade = getLatestTrade();
    
    if (!trade) {
        console.log('No recent trade found');
        return;
    }
    
    // Check if we should generate insight
    const now = Date.now();
    const hoursSinceLastSent = (now - state.lastSent) / (1000 * 60 * 60);
    
    // Only generate if price changed significantly or 4 hours passed
    const priceChange = Math.abs(trade.price - state.lastPrice) / state.lastPrice;
    
    if (priceChange > 0.01 || hoursSinceLastSent > 4) {
        console.log(`Generating insight for price ${trade.price}, change: ${(priceChange * 100).toFixed(2)}%`);
        
        const insight = await generateInsight(trade.price, trade.action);
        
        if (insight) {
            state.lastInsight = insight;
            state.lastPrice = trade.price;
            state.lastSent = now;
            saveState(state);
            
            console.log('Insight:', insight);
            
            // TODO: Send to Telegram
            // This would require the message tool
        }
    } else {
        console.log('No significant change, skipping');
    }
}

main().catch(console.error);
