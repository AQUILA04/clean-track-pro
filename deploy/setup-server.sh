#!/usr/bin/env bash
# =============================================================================
# setup-server.sh — One-time server setup for CleanTrack Pro (Traefik + test + prod)
# =============================================================================
set -euo pipefail

DEPLOY_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== CleanTrack Pro Server Setup ==="
echo ""

# --- 1. Create directory structure ---
echo "[1/5] Creating directory structure..."
mkdir -p /opt/cleantrack/traefik
mkdir -p /opt/cleantrack/test/releases
mkdir -p /opt/cleantrack/prod/releases

# acme.json must exist and be chmod 600 for Traefik to accept it
touch /opt/cleantrack/traefik/acme.json
chmod 600 /opt/cleantrack/traefik/acme.json

echo "      Directories created."

# --- 2. Create shared Docker networks ---
echo "[2/5] Creating shared Docker networks..."
for net in traefik-public cleantrack-test-internal cleantrack-prod-internal; do
  if docker network inspect "$net" > /dev/null 2>&1; then
    echo "      Network '$net' already exists, skipping."
  else
    docker network create "$net"
    echo "      Network '$net' created."
  fi
done

# --- 3. Create .env templates for test and prod stacks ---
echo "[3/5] Creating .env templates if they don't exist..."

TEST_ENV="/opt/cleantrack/test/.env"
if [[ ! -f "$TEST_ENV" ]]; then
  cat > "$TEST_ENV" << EOF
# =============================================================================
# CleanTrack Pro TEST stack — /opt/cleantrack/test/.env
# =============================================================================
DB_USER=cleantrack_test_user
DB_PASSWORD='change_me_test_db_password'
DB_NAME=cleantrack_test

KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD='change_me_test_keycloak_admin_password'
KEYCLOAK_HOSTNAME=keycloak.test.cleantrack.local
KEYCLOAK_REALM=cleantrack
KEYCLOAK_CLIENT_ID=cleantrack-client
KEYCLOAK_CLIENT_SECRET='change_me_test_keycloak_client_secret'
KEYCLOAK_AUTH_SERVER_URL=https://keycloak.test.cleantrack.local
KEYCLOAK_ISSUER=https://keycloak.test.cleantrack.local/realms/cleantrack

APP_HOSTNAME=test.cleantrack.local
MAILDEV_HOSTNAME=maildev.test.cleantrack.local

NEXT_PUBLIC_API_URL=https://test.cleantrack.local/api
NEXTAUTH_URL=https://test.cleantrack.local
NEXTAUTH_SECRET='change_me_test_nextauth_secret'

# Populated automatically by deploy.sh — do not edit manually
FRONTEND_IMAGE=
BACKEND_IMAGE=
EOF
  chmod 600 "$TEST_ENV"
  echo "      Created $TEST_ENV — EDIT passwords and domain hostnames before deploying!"
else
  echo "      $TEST_ENV already exists, skipping."
fi

PROD_ENV="/opt/cleantrack/prod/.env"
if [[ ! -f "$PROD_ENV" ]]; then
  cat > "$PROD_ENV" << EOF
# =============================================================================
# CleanTrack Pro PROD stack — /opt/cleantrack/prod/.env
# =============================================================================
DB_USER=cleantrack_prod_user
DB_PASSWORD='change_me_prod_db_password'
DB_NAME=cleantrack_prod

KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD='change_me_prod_keycloak_admin_password'
KEYCLOAK_HOSTNAME=keycloak.cleantrack.local
KEYCLOAK_REALM=cleantrack
KEYCLOAK_CLIENT_ID=cleantrack-client
KEYCLOAK_CLIENT_SECRET='change_me_prod_keycloak_client_secret'
KEYCLOAK_AUTH_SERVER_URL=https://keycloak.cleantrack.local
KEYCLOAK_ISSUER=https://keycloak.cleantrack.local/realms/cleantrack

APP_HOSTNAME=cleantrack.local

NEXT_PUBLIC_API_URL=https://cleantrack.local/api
NEXTAUTH_URL=https://cleantrack.local
NEXTAUTH_SECRET='change_me_prod_nextauth_secret'

# Populated automatically by deploy.sh — do not edit manually
FRONTEND_IMAGE=
BACKEND_IMAGE=
EOF
  chmod 600 "$PROD_ENV"
  echo "      Created $PROD_ENV — EDIT passwords and domain hostnames before deploying!"
else
  echo "      $PROD_ENV already exists, skipping."
fi

# --- 4. Start Traefik reverse proxy ---
echo "[4/5] Starting Traefik reverse proxy..."
# We can use ELYKIA's Traefik compose or write a simple one for CleanTrack
TRAEFIK_COMPOSE="/opt/cleantrack/traefik/docker-compose.traefik.yml"
if [[ ! -f "$TRAEFIK_COMPOSE" ]]; then
  cat > "$TRAEFIK_COMPOSE" << 'EOF'
services:
  traefik:
    image: traefik:v3.0
    container_name: traefik
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    command:
      - "--api.dashboard=true"
      - "--api.insecure=false"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.web.http.redirections.entrypoint.to=websecure"
      - "--entrypoints.web.http.redirections.entrypoint.scheme=https"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
      - "--certificatesresolvers.letsencrypt.acme.email=admin@cleantrack.local"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - /opt/cleantrack/traefik/acme.json:/letsencrypt/acme.json
    networks:
      - traefik-public

networks:
  traefik-public:
    external: true
EOF
  echo "      Created Traefik compose file at $TRAEFIK_COMPOSE"
fi

# Start Traefik
docker compose -f "$TRAEFIK_COMPOSE" up -d
echo "      Traefik started successfully."

# --- 5. Summary and next steps ---
echo "[5/5] Server setup complete!"
echo "--------------------------------------------------"
echo "Next Steps:"
echo "1. Configure domain names pointing to this server IP:"
echo "   - Test Environment: test.cleantrack.local, keycloak.test.cleantrack.local, maildev.test.cleantrack.local"
echo "   - Prod Environment: cleantrack.local, keycloak.cleantrack.local"
echo "2. Edit secrets in /opt/cleantrack/test/.env and /opt/cleantrack/prod/.env"
echo "3. Run your GitHub Actions CI/CD or run deploy.sh manually:"
echo "   ./deploy/deploy.sh test <frontend_image> <backend_image>"
echo "--------------------------------------------------"
