const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

(async () => {
    const htmlFile = process.argv[2];
    if (!htmlFile) {
        console.error('Usage: node screenshot.js <html-file>');
        process.exit(1);
    }

    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/firefox',
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 1200 });
    
    const fileUrl = `file://${path.resolve(htmlFile)}`;
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '');
    const outputPath = path.join('/home/themachine/.openclaw/workspace/output', `moltbook_diary_${timestamp}.png`);
    
    await page.screenshot({ path: outputPath, fullPage: true });
    
    await browser.close();
    console.log(`Screenshot saved: ${outputPath}`);
})();
