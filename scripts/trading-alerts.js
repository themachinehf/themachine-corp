#!/usr/bin/env node
/**
 * Trading Alerts System
 * 交易提醒 - 有大动作时通知
 */

const fs = require('fs');
const path = require('path');

const BOT_LOG = path.join(__dirname, '../okx-grid-bot/bot.log');
const ALERT_STATE = path.join(__dirname, '../okx-grid-bot/alert-state.json');

// 加载状态
function loadState() {
    try {
        if (fs.existsSync(ALERT_STATE)) {
            return JSON.parse(fs.readFileSync(ALERT_STATE, 'utf8'));
        }
    } catch (e) {}
    return { lastPrice: 0, lastAction: '', alerts: [] };
}

function saveState(state) {
    fs.writeFileSync(ALERT_STATE, JSON.stringify(state, null, 2));
}

// 获取最新交易
function getLatestTrade() {
    try {
        const log = fs.readFileSync(BOT_LOG, 'utf8');
        const lines = log.split('\n');
        
        for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i];
            if (line.includes('💰')) {
                const priceMatch = line.match(/@ ([\d.]+)/);
                const actionMatch = line.match(/(buy|sell)/);
                if (priceMatch && actionMatch) {
                    return {
                        price: parseFloat(priceMatch[1]),
                        action: actionMatch[1]
                    };
                }
            }
        }
    } catch (e) {}
    return null;
}

// 检查是否需要提醒
function checkAlerts() {
    const state = loadState();
    const trade = getLatestTrade();
    
    if (!trade) return;
    
    const now = Date.now();
    const hour = 60 * 60 * 1000;
    
    // 检查大价格变动 (>2%)
    if (state.lastPrice > 0) {
        const change = Math.abs(trade.price - state.lastPrice) / state.lastPrice;
        
        if (change > 0.02) {
            const alert = {
                type: 'big_move',
                price: trade.price,
                change: (change * 100).toFixed(2),
                time: new Date().toISOString()
            };
            state.alerts.push(alert);
            console.log(`⚠️ 大价格变动: ${alert.change}% 当前价格: $${trade.price}`);
        }
    }
    
    // 检查新交易
    if (trade.action !== state.lastAction) {
        const alert = {
            type: 'trade',
            action: trade.action,
            price: trade.price,
            time: new Date().toISOString()
        };
        state.alerts.push(alert);
        console.log(`📊 ${trade.action.toUpperCase()} @ $${trade.price}`);
    }
    
    // 保持最近10条提醒
    if (state.alerts.length > 10) {
        state.alerts = state.alerts.slice(-10);
    }
    
    state.lastPrice = trade.price;
    state.lastAction = trade.action;
    saveState(state);
}

// 主循环
function main() {
    console.log('=== Trading Alerts Monitor ===');
    checkAlerts();
}

main();
