#!/usr/bin/env node
/**
 * Fail the build if a production frontend client bundle still points at localhost APIs.
 * Run after `next build` in CI / Docker (APP_ENV=production).
 *
 * Checks .next/static only (browser assets). Also requires the build-time
 * NEXT_PUBLIC_API_URL host to appear somewhere in those assets.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(process.cwd(), '.next');
const FORBIDDEN = [
    // next-auth client ships a parseUrl() sentinel at http://localhost:3000/api/auth — ignore that.
    // Fail on any other localhost:3000 reference (real backend API bake mistakes).
    /http:\/\/localhost:3000(?!\/api\/auth)/gi,
    /http:\/\/127\.0\.0\.1:3000(?!\/api\/auth)/gi,
];

async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...(await walk(full)));
        } else if (/\.(js|html|json)$/.test(entry.name) && !entry.name.endsWith('.map')) {
            files.push(full);
        }
    }
    return files;
}

const appEnv = process.env.APP_ENV || process.env.NODE_ENV || '';
if (appEnv !== 'production') {
    console.log(`[verify-prod-bundle] skip (APP_ENV/NODE_ENV=${appEnv || 'unset'})`);
    process.exit(0);
}

const expectedApi = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
if (!expectedApi || /localhost|127\.0\.0\.1/.test(expectedApi)) {
    console.error(
        `[verify-prod-bundle] FAIL: NEXT_PUBLIC_API_URL must be a non-localhost URL at verify time (got: ${expectedApi || 'empty'})`,
    );
    process.exit(1);
}

const staticDir = path.join(ROOT, 'static');
let files = [];
try {
    files = await walk(staticDir);
} catch {
    console.error('[verify-prod-bundle] FAIL: .next/static missing — did next build run?');
    process.exit(1);
}

const hits = [];
let expectedFound = false;
const expectedNeedle = expectedApi.replace(/^https?:\/\//, '');

for (const file of files) {
    const text = await readFile(file, 'utf8');
    if (text.includes(expectedNeedle) || text.includes(expectedApi)) {
        expectedFound = true;
    }
    for (const pattern of FORBIDDEN) {
        pattern.lastIndex = 0;
        const m = pattern.exec(text);
        if (m) {
            hits.push({
                file: path.relative(process.cwd(), file),
                snippet: text.slice(Math.max(0, m.index - 80), m.index + 80),
            });
            break;
        }
    }
}

if (!expectedFound) {
    console.error(
        `[verify-prod-bundle] FAIL: expected API host "${expectedNeedle}" not found in .next/static — build-arg may not have been applied`,
    );
    process.exit(1);
}

if (hits.length > 0) {
    console.error(
        '[verify-prod-bundle] FAIL: production client bundle contains localhost API URLs:',
    );
    for (const hit of hits.slice(0, 10)) {
        console.error(`  - ${hit.file}`);
        console.error(`    snippet: ${JSON.stringify(hit.snippet)}`);
    }
    process.exit(1);
}

console.log(
    `[verify-prod-bundle] OK — API host "${expectedNeedle}" present, no localhost:3000 in client assets`,
);
