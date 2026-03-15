#!/usr/bin/env node

/**
 * Token Usage Tracker
 * Reads from OpenClaw session and syncs to both private and public Gists
 */

const fs = require('fs');
const https = require('https');

const SESSION_FILE = '/home/themachine/.openclaw/agents/main/sessions/sessions.json';
const GIST_TOKEN = fs.readFileSync('/home/themachine/.openclaw/workspace/.github_token', 'utf8').trim();
const PRIVATE_GIST_ID = fs.readFileSync('/home/themachine/.openclaw/workspace/.token_gist_id', 'utf8').trim();
const PUBLIC_GIST_ID = 'c556a24690494e4b71388b8c0c39480d';

function getTokenUsage() {
    try {
        const data = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
        const session = data['agent:main:main'];
        
        return {
            inputTokens: session.inputTokens || 0,
            outputTokens: session.outputTokens || 0,
            totalTokens: session.totalTokens || 0,
            model: session.model || 'MiniMax-M2.1',
            context: session.contextTokens || 200000,
            updated: new Date().toISOString()
        };
    } catch (e) {
        console.log('Error reading session:', e.message);
        return null;
    }
}

function syncToGist(gistId, isPrivate, tokens) {
    return new Promise((resolve) => {
        const data = JSON.stringify(tokens, null, 2);
        
        const req = https.request(`https://api.github.com/gists/${gistId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${GIST_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'User-Agent': 'The-Machine-Token-Tracker'
            }
        }, (res) => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log(`${isPrivate ? 'Private' : 'Public'} gist synced: ${res.statusCode}`);
                }
                resolve();
            });
        });
        
        req.write(JSON.stringify({
            files: { [isPrivate ? 'token-usage.json' : 'token-usage-public.json']: { content: data } }
        }));
        req.end();
    });
}

async function main() {
    const tokens = getTokenUsage();
    if (tokens) {
        console.log('Tokens:', tokens.totalTokens, '(' + tokens.model + ')');
        
        // Sync to both gists
        await syncToGist(PRIVATE_GIST_ID, true, tokens);
        await syncToGist(PUBLIC_GIST_ID, false, tokens);
        
        console.log('Done!');
    }
}

main();
