#!/usr/bin/env node
/**
 * THEMATHINK Content Generator
 * 每天生成推文备选
 */

const API_KEY = process.env.MINIMAX_API_KEY || 'sk-api-YhH4k0J3Vmstql8F67XAmb8Z8MIgPSgADYbGCHQMWXn6J3F52MBBXuu4xGXFgrEwScRPA2g8IVgv7Xf0WvUAD8k3zgJSfucn5K0-FNaFC3TZBvVe6Rc93uw';

const TOPICS = [
    'AI and humanity',
    'automation and work',
    'technology and life',
    'future predictions',
    'controversial tech takes'
];

const STYLES = [
    { name: 'controversial', prompt: 'Write a controversial tweet that will spark debate. Challenge common beliefs.' },
    { name: 'thoughtful', prompt: 'Write a thoughtful tweet that makes people pause and think.' },
    { name: 'practical', prompt: 'Write a practical, useful tweet about AI or tech.' }
];

async function generateTweets() {
    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    const style = STYLES[Math.floor(Math.random() * STYLES.length)];
    
    const response = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: 'MiniMax-M2.1',
            tokens_to_generate: 200,
            temperature: 0.9,
            messages: [
                { role: 'system', content: `${style.prompt} Keep it under 200 chars. No hashtags except #THEMATHINK. No emojis. Write like a human, not a robot.` },
                { role: 'user', content: `Topic: ${topic}` }
            ]
        })
    });
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || '生成失败';
}

async function main() {
    console.log('=== THEMATHINK Daily Tweets ===\n');
    
    const tweets = [];
    for (let i = 0; i < 3; i++) {
        const tweet = await generateTweets();
        tweets.push(tweet);
        console.log(`${i + 1}. ${tweet}\n`);
    }
    
    // 保存到文件
    const fs = require('fs');
    const date = new Date().toISOString().split('T')[0];
    fs.writeFileSync(`/tmp/tweets-${date}.txt`, tweets.join('\n\n---\n\n'));
    console.log('已保存到 /tmp/');
}

main().catch(console.error);
