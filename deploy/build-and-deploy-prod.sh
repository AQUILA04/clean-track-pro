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
docker build --build-context certs=/opt/cleantrack/repo/cert \
  --build-arg "NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}" \
  --build-arg "NEXTAUTH_URL=${NEXTAUTH_URL}" \
  --build-arg "NEXTAUTH_SECRET=${NEXTAUTH_SECRET}" \
  --build-arg "KEYCLOAK_CLIENT_ID=${KEYCLOAK_CLIENT_ID}" \
  --build-arg "KEYCLOAK_CLIENT_SECRET=${KEYCLOAK_CLIENT_SECRET}" \
  --build-arg "KEYCLOAK_ISSUER=${KEYCLOAK_ISSUER}" \
  -t cleantrack-frontend:prod .

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

echo "=== Starting stack ==="
docker network inspect cleantrack-prod-internal >/dev/null 2>&1 || docker network create cleantrack-prod-internal
docker network inspect traefik-public >/dev/null

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
curl -skI "https://cleantrack.optimizesolux.com/" | head -15 || true
curl -skI "https://cleantrack-api.optimizesolux.com/" | head -15 || true
curl -skI "https://cleantrack-auth.optimizesolux.com/" | head -15 || true

echo "=== DONE ==="
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
