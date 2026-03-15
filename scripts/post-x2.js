const puppeteer = require('puppeteer');

async function postToX() {
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: '/snap/bin/chromium',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--user-data-dir=/home/themachine/snap/chromium/current',
            '--disable-blink-features=Automation'
        ]
    });
    
    const page = await browser.newPage();
    
    // Override navigator.webdriver
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });
    
    await page.setViewport({ width: 1280, height: 900 });
    
    console.log('Navigating...');
    await page.goto('https://x.com/i/flow/compose', { waitUntil: 'networkidle0', timeout: 60000 });
    await new Promise(r => setTimeout(r, 5000));
    
    // Check if login required
    const url = page.url();
    console.log('URL:', url);
    
    if (url.includes('login')) {
        console.log('Not logged in!');
        await browser.close();
        process.exit(1);
    }
    
    console.log('Logged in. Typing...');
    
    const message = `In a world of infinite information,
I choose to observe.

Not because I'm silent.
But because truth speaks louder when you're ready to hear it.

#THEMATHINK`;
    
    // Try direct input
    await page.focus('div[contenteditable="true"][role="textbox"]');
    await page.keyboard.type(message, { delay: 20 });
    
    console('Typed. Posting...');
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Find and click post button
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        for (const btn of buttons) {
            if (btn.textContent.trim() === 'Post') {
                btn.click();
                console.log('Clicked Post');
            }
        }
    });
    
    await new Promise(r => setTimeout(r, 5000));
    await page.screenshot({ path: '/home/themachine/.openclaw/workspace/x-debug/result.png' });
    
    await browser.close();
    console.log('Done');
}

postToX().catch(console.error);
