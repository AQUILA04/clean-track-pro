#!/usr/bin/env node
/**
 * Cross-platform E2E runner: infra → bootstrap → servers → playwright.
 */
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '../..');
const shell = process.platform === 'win32';

function run(cmd, args, opts = {}) {
    console.log(`\n▶ ${cmd} ${args.join(' ')}`);
    const result = spawnSync(cmd, args, {
        cwd: opts.cwd || root,
        stdio: 'inherit',
        env: { ...process.env, ...opts.env },
        shell,
    });
    if (result.status !== 0) process.exit(result.status ?? 1);
    return result;
}

function parseEnvFile(path) {
    if (!existsSync(path)) return {};
    return Object.fromEntries(
        readFileSync(path, 'utf-8')
            .split('\n')
            .filter((l) => l && !l.startsWith('#'))
            .map((l) => {
                const i = l.indexOf('=');
                return [l.slice(0, i), l.slice(i + 1)];
            }),
    );
}

const extraArgs = process.argv.slice(2);
const isCI = process.env.CI === 'true';
const composeArgs = isCI
    ? ['-f', 'docker-compose.yml']
    : ['-f', 'docker-compose.yml', '-f', 'docker-compose.e2e.yml'];

run('docker', ['compose', ...composeArgs, 'up', '-d', 'postgres', 'keycloak', 'redis']);
run('npm', ['ci', '--legacy-peer-deps'], { cwd: join(root, 'backend') });
run('npm', ['ci', '--legacy-peer-deps'], { cwd: join(root, 'frontend') });
run('node', ['scripts/e2e/bootstrap.mjs'], {
    env: {
        ...process.env,
        KEYCLOAK_URL: process.env.KEYCLOAK_URL || (isCI ? 'http://localhost:8080' : 'http://localhost:9081'),
        E2E_DB_PORT: process.env.E2E_DB_PORT || (isCI ? '5432' : '5433'),
    },
});

const backend = spawn('npm', ['run', 'start:dev'], {
    cwd: join(root, 'backend'),
    env: { ...process.env, ...parseEnvFile(join(root, 'backend/.env.e2e.generated')) },
    stdio: 'inherit',
    shell,
});

const frontend = spawn('npm', ['run', 'dev'], {
    cwd: join(root, 'frontend'),
    env: { ...process.env, ...parseEnvFile(join(root, 'frontend/.env.e2e.generated')) },
    stdio: 'inherit',
    shell,
});

const shutdown = () => {
    if (!backend.killed) backend.kill('SIGTERM');
    if (!frontend.killed) frontend.kill('SIGTERM');
};

process.on('SIGINT', () => { shutdown(); process.exit(130); });
process.on('SIGTERM', () => { shutdown(); process.exit(143); });

run('node', ['scripts/e2e/wait-for-url.mjs', 'http://localhost:3000', '180000']);
run('node', ['scripts/e2e/wait-for-url.mjs', 'http://localhost:3001', '180000']);
run('npx', ['playwright', 'install', 'chromium']);

const testResult = run('npx', ['playwright', 'test', ...extraArgs], {
    env: parseEnvFile(join(root, '.env.e2e.generated')),
});

shutdown();
process.exit(testResult.status ?? 0);
