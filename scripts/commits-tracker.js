#!/usr/bin/env node

/**
 * Commits Tracker - Sync commits to public Gist
 */

const fs = require('fs');
const https = require('https');

const GIST_TOKEN = fs.readFileSync('/home/themachine/.openclaw/workspace/.github_token', 'utf8').trim();
const GIST_ID = '6f0c9d43ed9f959854931d7f8b52a731';
const GITHUB_API = 'https://api.github.com/users/themachinehf/events/public';

async function getTodayCommits() {
    return new Promise((resolve, reject) => {
        https.get(GITHUB_API, {
            headers: { 'User-Agent': 'The-Machine-Commits-Tracker' }
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', async () => {
                try {
                    const events = JSON.parse(data);
                    const todayUTC = new Date().toISOString().split('T')[0];
                    const pushes = events.filter(e => 
                        e.type === 'PushEvent' && 
                        e.created_at.startsWith(todayUTC)
                    );
                    resolve(pushes.length);
                } catch (e) {
                    resolve(0);
                }
            });
        }).on('error', () => resolve(0));
    });
}

async function syncToGist(commits) {
    const data = JSON.stringify({ commits, updated: new Date().toISOString() });
    
    return new Promise((resolve) => {
        const req = https.request(`https://api.github.com/gists/${GIST_ID}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${GIST_TOKEN}`,
                'Content-Type': 'application/json'
            }
        }, (res) => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                console.log(`Commits Gist synced: ${commits}`);
                resolve();
            });
        });
        
        req.write(JSON.stringify({
            files: { 'commits-today.json': { content: data } }
        }));
        req.end();
    });
}

async function main() {
    const commits = await getTodayCommits();
    await syncToGist(commits);
}

main();
