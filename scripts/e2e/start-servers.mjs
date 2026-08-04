#!/usr/bin/env node
/**
 * Starts backend + frontend for E2E (foreground processes, CI-friendly).
 * Loads generated env files from bootstrap.mjs.
 */
import { spawn } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '../..');

function loadEnvFile(path) {
    if (!existsSync(path)) return {};
    return Object.fromEntries(
        readFileSync(path, 'utf-8')
            .split('\n')
            .filter((line) => line && !line.startsWith('#'))
            .map((line) => {
                const idx = line.indexOf('=');
                return [line.slice(0, idx), line.slice(idx + 1)];
            }),
    );
}

const backendEnv = loadEnvFile(join(root, 'backend/.env.e2e.generated'));
const frontendEnv = loadEnvFile(join(root, 'frontend/.env.e2e.generated'));

const children = [];

function start(name, cmd, args, cwd, extraEnv) {
    const child = spawn(cmd, args, {
        cwd,
        env: { ...process.env, ...extraEnv },
        stdio: 'inherit',
        shell: process.platform === 'win32',
    });
    child.on('exit', (code) => {
        console.error(`[${name}] exited with code ${code}`);
        process.exit(code ?? 1);
    });
    children.push(child);
    return child;
}

process.on('SIGINT', () => children.forEach((c) => c.kill()));
process.on('SIGTERM', () => children.forEach((c) => c.kill()));

start('backend', 'npm', ['run', 'start:dev'], join(root, 'backend'), backendEnv);
start('frontend', 'npm', ['run', 'dev'], join(root, 'frontend'), frontendEnv);
