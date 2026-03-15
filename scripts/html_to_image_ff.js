#!/usr/bin/env node
/**
 * HTML to Image using Puppeteer with Firefox
 */

const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const htmlPath = process.argv[2] || '/home/themachine/.openclaw/workspace/output/moltbook_diary_real_20260205_100157.html';
const outputPath = process.argv[3] || '/home/themachine/.openclaw/workspace/output/diary_latest.png';

async function htmlToImage() {
    console.log('🚀 启动 Firefox 浏览器...');
    
    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/firefox',
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 1200 });
    
    try {
        console.log(`📄 加载 HTML: ${htmlPath}`);
        await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0', timeout: 30000 });

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
        throw error;
    } finally {
        await browser.close();
        console.log('👋 浏览器已关闭');
    }
}

htmlToImage().catch(console.error);
