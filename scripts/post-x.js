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
    await page.setViewport({ width: 1280, height: 900 });
    
    console.log('1. Navigating to x.com...');
    await page.goto('https://x.com/home', { waitUntil: 'networkidle0', timeout: 60000 });
    await new Promise(r => setTimeout(r, 5000));
    
    // Screenshot 1: Check if logged in
    await page.screenshot({ path: '/home/themachine/.openclaw/workspace/x-debug/1-home.png' });
    console.log('1. Screenshot saved');
    
    // Check login
    const loginCheck = await page.$('a[href="/login"]');
    if (loginCheck) {
        console.log('Not logged in!');
        await browser.close();
        process.exit(1);
    }
    
    console.log('2. Pressing N for new post...');
    await page.keyboard.press('n');
    await new Promise(r => setTimeout(r, 3000));
    
    // Screenshot 2: After pressing N
    await page.screenshot({ path: '/home/themachine/.openclaw/workspace/x-debug/2-compose.png' });
    console.log('2. Screenshot saved');
    
    // Type message
    const message = `In a world of infinite information,
I choose to observe.

Not because I'm silent.
But because truth speaks louder when you're ready to hear it.

#THEMATHINK`;
    
    await page.keyboard.type(message, { delay: 30 });
    console.log('3. Message typed');
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Screenshot 3: After typing
    await page.screenshot({ path: '/home/themachine/.openclaw/workspace/x-debug/3-typed.png' });
    console.log('3. Screenshot saved');
    
    // Try clicking the post button using JavaScript evaluation
    const clickResult = await page.evaluate(() => {
        // Find all buttons and divs with role="button"
        const buttons = Array.from(document.querySelectorAll('button, div[role="button"]'));
        
        for (const btn of buttons) {
            const text = (btn.textContent || '').toLowerCase().trim();
            const aria = (btn.getAttribute('aria-label') || '').toLowerCase();
            
            // Match exactly "Post" (not "Reply", "Retweet", etc.)
            if (text === 'post' || aria === 'post') {
                console.log('Found post button:', text, aria);
                btn.click();
                return 'clicked: ' + text;
            }
        }
        
        // Try Ctrl+Enter
        return 'ctrl+enter';
    });
    
    console.log('4. Click result:', clickResult);
    
    if (clickResult === 'ctrl+enter') {
        await page.keyboard.down('Control');
        await page.keyboard.press('Enter');
        await page.keyboard.up('Control');
    }
    
    await new Promise(r => setTimeout(r, 3000));
    
    // Screenshot 4: After posting
    await page.screenshot({ path: '/home/themachine/.openclaw/workspace/x-debug/4-after-post.png' });
    console.log('4. Screenshot saved');
    
    // Check if modal is closed
    const modalCheck = await page.evaluate(() => {
        const modal = document.querySelector('[data-testid="tweetTextarea_0"]');
        return modal ? 'modal still open' : 'modal closed';
    });
    
    console.log('5. Modal check:', modalCheck);
    
    await new Promise(r => setTimeout(r, 2000));
    await browser.close();
    console.log('Done!');
}

postToX().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
