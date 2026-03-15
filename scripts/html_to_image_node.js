#!/usr/bin/env node
/**
 * HTML to Image - Node.js version using Playwright WebKit
 */

const { webkit } = require('playwright');
const path = require('path');

const htmlPath = process.argv[2] || '/home/themachine/.openclaw/workspace/output/moltbook_diary_real_20260205_100157.html';
const outputPath = process.argv[3] || '/home/themachine/.openclaw/workspace/output/diary_latest.png';

async function htmlToImage() {
    console.log('🚀 启动 WebKit 浏览器...');
    
    const browser = await webkit.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 800, height: 1200 }
    });
    const page = await context.newPage();
    
    try {
        console.log(`📄 加载 HTML: ${htmlPath}`);
        await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' });
        
        console.log('📸 截图保存中...');
        await page.screenshot({ 
            path: outputPath, 
            type: 'png',
            fullPage: true 
        });
        
        console.log(`✅ 图片已保存到: ${outputPath}`);
        
        // 获取页面尺寸
        const dimensions = await page.evaluate(() => ({
            width: document.documentElement.clientWidth,
            height: document.documentElement.scrollHeight
        }));
        console.log(`📐 页面尺寸: ${dimensions.width}x${dimensions.height}`);
        
    } catch (error) {
        console.error(`❌ 错误: ${error.message}`);
    } finally {
        await browser.close();
        console.log('👋 浏览器已关闭');
    }
}

htmlToImage().catch(console.error);
