#!/usr/bin/env bash
# Production smoke checks — run on the VPS after deploy or from CD.
set -euo pipefail

APP_URL="${APP_URL:-https://cleantrack.optimizesolux.com}"
API_URL="${API_URL:-https://cleantrack-api.optimizesolux.com}"
AUTH_URL="${AUTH_URL:-https://cleantrack-auth.optimizesolux.com/realms/cleantrack}"

echo "=== CleanTrack Pro prod smoke ==="
echo "app=$APP_URL"
echo "api=$API_URL"
echo "auth=$AUTH_URL"

fail=0

check_http() {
  local name="$1" url="$2" expect="$3"
  local code
  code=$(curl -sk -o /dev/null -w "%{http_code}" "$url" || echo "000")
  if [[ "$code" =~ $expect ]]; then
    echo "OK  $name → HTTP $code"
  else
    echo "FAIL $name → HTTP $code (expected /$expect/)"
    fail=1
  fi
}

check_http "frontend" "$APP_URL/" "200"
check_http "api" "$API_URL/" "401|200"
check_http "keycloak realm" "$AUTH_URL" "200"

echo "--- frontend image: no localhost API bake ---"
if docker ps --format '{{.Names}}' | grep -qx 'cleantrack-prod-frontend-1'; then
  # next-auth ships a parseUrl() sentinel at http://localhost:3000/api/auth — ignore it.
  if docker exec cleantrack-prod-frontend-1 \
    sh -c 'grep -R -E "http://localhost:3000|http://127\\.0\\.0\\.1:3000" /app/.next/static 2>/dev/null | grep -v "/api/auth" | head -5' \
    | grep -q .; then
    echo "FAIL frontend bundle contains localhost:3000 (non-auth)"
    fail=1
  else
    echo "OK  frontend bundle has no localhost:3000 API bake"
  fi

  if docker exec cleantrack-prod-frontend-1 \
    sh -c 'wget -qO- http://127.0.0.1:3001/ 2>/dev/null || true' \
    | grep -q '__CTP_PUBLIC_ENV__'; then
    echo "OK  runtime public env script present in HTML"
  else
    echo "WARN runtime __CTP_PUBLIC_ENV__ not found in HTML (deploy frontend with PublicEnvScript)"
  fi

  if docker exec cleantrack-prod-frontend-1 \
    sh -c 'grep -R "cleantrack-api.optimizesolux.com" /app/.next/static 2>/dev/null | head -1' \
    | grep -q .; then
    echo "OK  prod API host present in client assets"
  else
    echo "FAIL prod API host missing from client assets"
    fail=1
  fi
else
  echo "WARN cleantrack-prod-frontend-1 not running — skip bundle checks"
fi

if [[ "$fail" -ne 0 ]]; then
  echo "=== SMOKE FAILED ==="
  exit 1
fi
echo "=== SMOKE OK ==="
