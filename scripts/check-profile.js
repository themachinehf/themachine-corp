const puppeteer = require('puppeteer');

async function checkProfile() {
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
    
    console.log('Going to profile...');
    await page.goto('https://x.com/THEMACHINE_HF', { waitUntil: 'networkidle0', timeout: 60000 });
    await new Promise(r => setTimeout(r, 5000));
    
    // Screenshot
    await page.screenshot({ path: '/home/themachine/.openclaw/workspace/x-debug/profile.png' });
    console.log('Profile screenshot saved');
    
    // Check for any restriction banners
    const banner = await page.evaluate(() => {
        const banners = document.querySelectorAll('[role="alert"], [role="banner"]');
        for (const b of banners) {
            const text = b.textContent.toLowerCase();
            if (text.includes('suspended') || text.includes('restricted') || text.includes('locked')) {
                return 'Found: ' + text.substring(0, 100);
            }
        }
        return 'No restriction banners';
    });
    
    console.log('Banner check:', banner);
    
    // Get first tweet text
    const firstTweet = await page.evaluate(() => {
        const articles = document.querySelectorAll('article');
        if (articles.length > 0) {
            return articles[0].textContent.substring(0, 200);
        }
        return 'No tweets found';
    });
    
    console.log('First tweet:', firstTweet.substring(0, 100));
    
    await browser.close();
}

checkProfile().catch(console.error);
