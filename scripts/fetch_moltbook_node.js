#!/usr/bin/env node
/**
 * Moltbook 抓取工具 - Node.js 版本
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'output');
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function fetchMoltbook() {
    console.log('🚀 启动浏览器...');
    
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
        console.log('📡 正在访问 Moltbook...');
        await page.goto('https://moltbook.com', { 
            waitUntil: 'networkidle',
            timeout: 30000 
        });
        
        // 等待内容加载
        await page.waitForTimeout(5000);
        
        // 获取页面标题
        const title = await page.title();
        console.log(`📄 页面标题: ${title}`);
        
        // 提取 AI Agents 数据
        const agentsData = await page.evaluate(() => {
            // 查找所有 agent 卡片
            const agentCards = document.querySelectorAll('[class*="agent"], [class*="Agent"]');
            const agents = [];
            
            // 尝试从页面结构中提取信息
            const mainContent = document.querySelector('main');
            if (mainContent) {
                const text = mainContent.innerText;
                
                // 提取统计信息
                const stats = {
                    agents: 0,
                    submolts: 0,
                    posts: 0,
                    comments: 0
                };
                
                // 查找数字统计
                const numbers = text.match(/(\d+)\s*(AI agents|submolts|posts|comments)/gi);
                if (numbers) {
                    numbers.forEach(num => {
                        const match = num.match(/(\d+)\s*(.*)/i);
                        if (match) {
                            const count = parseInt(match[1]);
                            const label = match[2].toLowerCase();
                            if (label.includes('agent')) stats.agents = count;
                            else if (label.includes('submolt')) stats.submolts = count;
                            else if (label.includes('post')) stats.posts = count;
                            else if (label.includes('comment')) stats.comments = count;
                        }
                    });
                }
                
                return { stats, rawText: text.slice(0, 3000) };
            }
            
            return { stats: { agents: 0, submolts: 0, posts: 0, comments: 0 }, rawText: '' };
        });
        
        console.log('\n📊 统计信息:');
        console.log(`   - AI Agents: ${agentsData.stats.agents}`);
        console.log(`   - Submolts: ${agentsData.stats.submolts}`);
        console.log(`   - Posts: ${agentsData.stats.posts}`);
        console.log(`   - Comments: ${agentsData.stats.comments}`);
        
        // 尝试获取更多动态内容
        const dynamicContent = await page.evaluate(() => {
            // 查找所有链接和交互元素
            const links = Array.from(document.querySelectorAll('a[href]'))
                .map(a => ({
                    href: a.href,
                    text: a.innerText.slice(0, 100)
                }))
                .filter(a => a.text.trim().length > 0)
                .slice(0, 20);
            
            return { links };
        });
        
        console.log('\n🔗 发现链接:');
        dynamicContent.links.forEach(link => {
            console.log(`   - ${link.text}: ${link.href}`);
        });
        
        // 保存结果
        const result = {
            url: 'https://moltbook.com',
            title: title,
            timestamp: new Date().toISOString(),
            stats: agentsData.stats,
            content: agentsData.rawText,
            links: dynamicContent.links
        };
        
        const outputFile = path.join(OUTPUT_DIR, 'moltbook_fetch.json');
        fs.writeFileSync(outputFile, JSON.stringify(result, null, 2), 'utf-8');
        console.log(`\n✅ 结果已保存到: ${outputFile}`);
        
        return result;
        
    } catch (error) {
        console.error(`❌ 错误: ${error.message}`);
        return null;
    } finally {
        await browser.close();
        console.log('👋 浏览器已关闭');
    }
}

fetchMoltbook().catch(console.error);
