const puppeteer = require('puppeteer');

async function postToX() {
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: '/snap/bin/chromium',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--user-data-dir=/home/themachine/snap/chromium/current'
        ]
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });
    
    // Try going to compose page directly
    console.log('1. Going to compose...');
    await page.goto('https://x.com/compose/post', { waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 3000));
    
    // If redirected to login, try home
    if (page.url().includes('login')) {
        console.log('2. Going to home...');
        await page.goto('https://x.com/home', { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 3000));
        
        // Press N
        console.log('3. Pressing N...');
        await page.keyboard.press('n');
        await new Promise(r => setTimeout(r, 3000));
    }
    
    // Take screenshot to see what's on screen
    await page.screenshot({ path: '/home/themachine/.openclaw/workspace/x-debug/0-start.png' });
    console.log('Screenshot saved');
    
    // Try to click on any link that leads to compose
    const composeResult = await page.evaluate(() => {
        // Find the big post button (bottom right floating)
        const allDivs = Array.from(document.querySelectorAll('div'));
        
        // Look for the floating post button
        for (const div of allDivs) {
            const aria = div.getAttribute('aria-label');
            const role = div.getAttribute('role');
            if (aria === 'New post' || aria === 'Post') {
                div.click();
                return 'clicked new post div';
            }
        }
        
        // Try clicking any link with compose
        const links = Array.from(document.querySelectorAll('a'));
        for (const link of links) {
            if (link.href && link.href.includes('compose')) {
                link.click();
                return 'clicked compose link';
            }
        }
        
        return 'nothing found';
    });
    
    console.log('Compose result:', composeResult);
    await new Promise(r => setTimeout(r, 3000));
    
    // Now try to find and fill the textarea
    const typeResult = await page.evaluate(() => {
        const textareas = Array.from(document.querySelectorAll('div[contenteditable="true"]'));
        const textarea = textareas.find(t => t.isConnected);
        if (textarea) {
            textarea.focus();
            return 'found textarea';
        }
        return 'no textarea';
    });
    
    console.log('Type result:', typeResult);
    
    // Type message
    const message = `In a world of infinite information,
I choose to observe.

Not because I'm silent.
But because truth speaks louder when you're ready to hear it.

#THEMATHINK`;
    
    await page.keyboard.type(message, { delay: 30 });
    console.log('Typed message');
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Try clicking post
    const postResult = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, div'));
        for (const btn of buttons) {
            const text = (btn.textContent || '').trim();
            if (text === 'Post' || text === 'Tweet') {
                btn.click();
                return 'clicked: ' + text;
            }
        }
        return 'no post button';
    });
    
    console.log('Post result:', postResult);
    
    await new Promise(r => setTimeout(r, 5000));
    await page.screenshot({ path: '/home/themachine/.openclaw/workspace/x-debug/final.png' });
    
    await browser.close();
    console.log('Done');
}

postToX().catch(console.error);
