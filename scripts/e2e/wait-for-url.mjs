#!/usr/bin/env node
/**
 * Polls a URL until it responds with an acceptable status code.
 * Usage: node scripts/e2e/wait-for-url.mjs http://localhost:8080/realms/master 120000
 */
import http from 'node:http';
import https from 'node:https';

const url = process.argv[2];
const timeoutMs = Number(process.argv[3] || 120_000);
const intervalMs = 2_000;

if (!url) {
    console.error('Usage: node wait-for-url.mjs <url> [timeoutMs]');
    process.exit(1);
}

const deadline = Date.now() + timeoutMs;

function check() {
    return new Promise((resolve) => {
        const client = url.startsWith('https') ? https : http;
        const req = client.get(url, (res) => {
            res.resume();
            resolve(res.statusCode && res.statusCode < 500);
        });
        req.on('error', () => resolve(false));
        req.setTimeout(5_000, () => {
            req.destroy();
            resolve(false);
        });
    });
}

async function main() {
    console.log(`Waiting for ${url} (timeout ${timeoutMs}ms)...`);
    while (Date.now() < deadline) {
        if (await check()) {
            console.log(`✅ ${url} is reachable`);
            return;
        }
        await new Promise((r) => setTimeout(r, intervalMs));
    }
    console.error(`❌ Timeout waiting for ${url}`);
    process.exit(1);
}

main();
