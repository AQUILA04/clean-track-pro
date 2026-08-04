#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "==> Starting infrastructure (postgres, keycloak, redis)..."
docker compose up -d postgres keycloak redis

echo "==> Bootstrapping Keycloak + database..."
node scripts/e2e/bootstrap.mjs

echo "==> Installing app dependencies..."
npm ci --legacy-peer-deps --prefix backend
npm ci --legacy-peer-deps --prefix frontend
npm ci --legacy-peer-deps

echo "==> Starting backend + frontend..."
node scripts/e2e/start-servers.mjs &
SERVERS_PID=$!

cleanup() {
  kill "$SERVERS_PID" 2>/dev/null || true
  wait "$SERVERS_PID" 2>/dev/null || true
}
trap cleanup EXIT

echo "==> Waiting for backend..."
node scripts/e2e/wait-for-url.mjs http://localhost:3000 180000

echo "==> Waiting for frontend..."
node scripts/e2e/wait-for-url.mjs http://localhost:3001 180000

echo "==> Running Playwright E2E tests..."
export $(grep -v '^#' .env.e2e.generated | xargs)
npx playwright install --with-deps chromium
npx playwright test "$@"
