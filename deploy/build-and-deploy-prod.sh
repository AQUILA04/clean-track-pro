#!/usr/bin/env bash
set -euo pipefail

set -a
# shellcheck disable=SC1091
source /opt/cleantrack/prod/.env
set +a

echo "=== Building backend ==="
cd /opt/cleantrack/repo/backend
docker build --build-context certs=/opt/cleantrack/repo/cert -t cleantrack-backend:prod .

echo "=== Building frontend ==="
cd /opt/cleantrack/repo/frontend
if [[ -z "${NEXT_PUBLIC_API_URL:-}" ]]; then
  echo "ERROR: NEXT_PUBLIC_API_URL missing in /opt/cleantrack/prod/.env" >&2
  exit 1
fi
if echo "$NEXT_PUBLIC_API_URL" | grep -Eq 'localhost|127\.0\.0\.1'; then
  echo "ERROR: refusing to build prod frontend with NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL" >&2
  exit 1
fi
docker build --build-context certs=/opt/cleantrack/repo/cert \
  --build-arg "APP_ENV=production" \
  --build-arg "NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}" \
  --build-arg "NEXTAUTH_URL=${NEXTAUTH_URL}" \
  --build-arg "NEXTAUTH_SECRET=${NEXTAUTH_SECRET}" \
  --build-arg "KEYCLOAK_CLIENT_ID=${KEYCLOAK_CLIENT_ID}" \
  --build-arg "KEYCLOAK_CLIENT_SECRET=${KEYCLOAK_CLIENT_SECRET}" \
  --build-arg "KEYCLOAK_ISSUER=${KEYCLOAK_ISSUER}" \
  -t cleantrack-frontend:prod .

echo "=== Building keycloak (custom themes) ==="
cd /opt/cleantrack/repo/keycloak
docker build --build-context certs=/opt/cleantrack/repo/cert -t cleantrack-keycloak:prod .

echo "=== Updating .env image tags ==="
set_env_var() {
  local key="$1"
  local val="$2"
  local file="/opt/cleantrack/prod/.env"
  if grep -q -E "^${key}=" "$file" 2>/dev/null; then
    local tmp
    tmp=$(mktemp)
    sed "s~^${key}=.*~${key}=${val}~" "$file" > "$tmp"
    cat "$tmp" > "$file"
    rm -f "$tmp"
  else
    echo "${key}=${val}" >> "$file"
  fi
}
set_env_var FRONTEND_IMAGE cleantrack-frontend:prod
set_env_var BACKEND_IMAGE cleantrack-backend:prod
set_env_var KEYCLOAK_IMAGE cleantrack-keycloak:prod
set_env_var KEYCLOAK_THEMES_PATH /opt/cleantrack/repo/keycloak/themes/cleantrack-pro

echo "=== Starting stack ==="
# Networks are external in compose — create if missing (same as setup-server.sh)
docker network inspect cleantrack-prod-internal >/dev/null 2>&1 || docker network create cleantrack-prod-internal
docker network inspect traefik-public >/dev/null 2>&1 || docker network create traefik-public

# Prefer scripts from the repo checkout when available (source of truth before push/CD)
if [[ -d /opt/cleantrack/repo/deploy ]]; then
  cp -a /opt/cleantrack/repo/deploy/. /opt/cleantrack/deploy/
  chmod +x /opt/cleantrack/deploy/*.sh 2>/dev/null || true
fi

cd /opt/cleantrack/deploy
docker compose \
  -f docker-compose.prod.yml \
  --project-name cleantrack-prod \
  --env-file /opt/cleantrack/prod/.env \
  up -d

echo "=== Waiting for services ==="
sleep 15
docker compose \
  -f docker-compose.prod.yml \
  --project-name cleantrack-prod \
  --env-file /opt/cleantrack/prod/.env \
  ps

echo "=== Migrations ==="
docker compose \
  -f docker-compose.prod.yml \
  --project-name cleantrack-prod \
  --env-file /opt/cleantrack/prod/.env \
  exec -T backend npm run migration:run || echo "Migration skipped or failed (check logs)"

echo "=== Keycloak setup ==="
docker compose \
  -f docker-compose.prod.yml \
  --project-name cleantrack-prod \
  --env-file /opt/cleantrack/prod/.env \
  exec -T backend npm run keycloak:setup || echo "Keycloak setup skipped or failed (check logs)"

echo "=== Smoke from VPS ==="
chmod +x /opt/cleantrack/deploy/smoke-prod.sh 2>/dev/null || true
if [[ -x /opt/cleantrack/deploy/smoke-prod.sh ]]; then
  /opt/cleantrack/deploy/smoke-prod.sh
else
  curl -skI "https://cleantrack.optimizesolux.com/" | head -15 || true
  curl -skI "https://cleantrack-api.optimizesolux.com/" | head -15 || true
  curl -skI "https://cleantrack-auth.optimizesolux.com/" | head -15 || true
fi

echo "=== DONE ==="
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
