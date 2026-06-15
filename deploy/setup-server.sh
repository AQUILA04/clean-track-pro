#!/usr/bin/env bash
# =============================================================================
# setup-server.sh — One-time server setup for CleanTrack Pro
# =============================================================================
# Ce script est appelé par init.sh lors du premier déploiement sur un nouveau
# serveur. Il peut aussi être exécuté manuellement.
#
# Les secrets sont injectés via des variables d'environnement (préfixe CT_)
# exportées par init.sh. Si elles sont absentes, des placeholders sont utilisés
# et doivent être remplacés manuellement dans les fichiers .env.
#
# Variables attendues (toutes optionnelles — init.sh les exporte si disponibles):
#   CT_DB_USER, CT_DB_PASSWORD, CT_DB_NAME_TEST, CT_DB_NAME_PROD
#   CT_KEYCLOAK_ADMIN_PASSWORD, CT_KEYCLOAK_CLIENT_SECRET
#   CT_NEXTAUTH_SECRET
#   CT_APP_HOSTNAME_TEST, CT_APP_HOSTNAME_PROD
#   CT_KEYCLOAK_HOSTNAME_TEST, CT_KEYCLOAK_HOSTNAME_PROD
#   CT_MAILDEV_HOSTNAME
# =============================================================================
set -euo pipefail

DEPLOY_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== CleanTrack Pro Server Setup ==="
echo ""

# --- 1. Install Docker if absent ---
echo "[1/5] Checking Docker installation..."
if ! command -v docker &>/dev/null; then
    echo "      Docker not found. Installing..."
    apt-get update -y
    apt-get install -y ca-certificates curl gnupg git
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
        | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    echo "      Docker installed successfully."
else
    echo "      Docker already installed."
fi

# --- 2. Create directory structure ---
echo "[2/5] Creating directory structure..."
mkdir -p /opt/cleantrack/traefik
mkdir -p /opt/cleantrack/test/releases
mkdir -p /opt/cleantrack/prod/releases

# acme.json must exist and be chmod 600 for Traefik
touch /opt/cleantrack/traefik/acme.json
chmod 600 /opt/cleantrack/traefik/acme.json
echo "      Directories created."

# --- 3. Create shared Docker networks ---
echo "[3/5] Creating shared Docker networks..."
for net in traefik-public cleantrack-test-internal cleantrack-prod-internal; do
  if docker network inspect "$net" > /dev/null 2>&1; then
    echo "      Network '$net' already exists, skipping."
  else
    docker network create "$net"
    echo "      Network '$net' created."
  fi
done

# --- 4. Create .env files for test and prod stacks ---
echo "[4/5] Creating .env files..."

# Resolve values: use CT_ vars if set, otherwise use placeholders
_db_user="${CT_DB_USER:-cleantrack}"
_db_pass_test="${CT_DB_PASSWORD:-CHANGE_ME_test_db_password}"
_db_pass_prod="${CT_DB_PASSWORD:-CHANGE_ME_prod_db_password}"
_db_name_test="${CT_DB_NAME_TEST:-cleantrack_test}"
_db_name_prod="${CT_DB_NAME_PROD:-cleantrack_prod}"
_kc_admin_pass="${CT_KEYCLOAK_ADMIN_PASSWORD:-CHANGE_ME_keycloak_admin_password}"
_kc_client_secret="${CT_KEYCLOAK_CLIENT_SECRET:-CHANGE_ME_keycloak_client_secret}"
_nextauth_secret="${CT_NEXTAUTH_SECRET:-CHANGE_ME_nextauth_secret}"
_app_host_test="${CT_APP_HOSTNAME_TEST:-test.cleantrack.local}"
_app_host_prod="${CT_APP_HOSTNAME_PROD:-cleantrack.local}"
_kc_host_test="${CT_KEYCLOAK_HOSTNAME_TEST:-keycloak.test.cleantrack.local}"
_kc_host_prod="${CT_KEYCLOAK_HOSTNAME_PROD:-keycloak.cleantrack.local}"
_maildev_host="${CT_MAILDEV_HOSTNAME:-maildev.test.cleantrack.local}"

TEST_ENV="/opt/cleantrack/test/.env"
if [[ ! -f "$TEST_ENV" ]]; then
  cat > "$TEST_ENV" << EOF
# =============================================================================
# CleanTrack Pro TEST stack — /opt/cleantrack/test/.env
# =============================================================================
DB_USER=${_db_user}
DB_PASSWORD=${_db_pass_test}
DB_NAME=${_db_name_test}

KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=${_kc_admin_pass}
KEYCLOAK_HOSTNAME=${_kc_host_test}
KEYCLOAK_REALM=cleantrack
KEYCLOAK_CLIENT_ID=cleantrack-client
KEYCLOAK_CLIENT_SECRET=${_kc_client_secret}
KEYCLOAK_AUTH_SERVER_URL=https://${_kc_host_test}
KEYCLOAK_ISSUER=https://${_kc_host_test}/realms/cleantrack

APP_HOSTNAME=${_app_host_test}
MAILDEV_HOSTNAME=${_maildev_host}

NEXT_PUBLIC_API_URL=https://${_app_host_test}/api
NEXTAUTH_URL=https://${_app_host_test}
NEXTAUTH_SECRET=${_nextauth_secret}

# Populated automatically by deploy.sh — do not edit manually
FRONTEND_IMAGE=
BACKEND_IMAGE=
EOF
  chmod 600 "$TEST_ENV"
  echo "      Created $TEST_ENV"
else
  echo "      $TEST_ENV already exists, skipping."
fi

PROD_ENV="/opt/cleantrack/prod/.env"
if [[ ! -f "$PROD_ENV" ]]; then
  cat > "$PROD_ENV" << EOF
# =============================================================================
# CleanTrack Pro PROD stack — /opt/cleantrack/prod/.env
# =============================================================================
DB_USER=${_db_user}
DB_PASSWORD=${_db_pass_prod}
DB_NAME=${_db_name_prod}

KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=${_kc_admin_pass}
KEYCLOAK_HOSTNAME=${_kc_host_prod}
KEYCLOAK_REALM=cleantrack
KEYCLOAK_CLIENT_ID=cleantrack-client
KEYCLOAK_CLIENT_SECRET=${_kc_client_secret}
KEYCLOAK_AUTH_SERVER_URL=https://${_kc_host_prod}
KEYCLOAK_ISSUER=https://${_kc_host_prod}/realms/cleantrack

APP_HOSTNAME=${_app_host_prod}

NEXT_PUBLIC_API_URL=https://${_app_host_prod}/api
NEXTAUTH_URL=https://${_app_host_prod}
NEXTAUTH_SECRET=${_nextauth_secret}

# Populated automatically by deploy.sh — do not edit manually
FRONTEND_IMAGE=
BACKEND_IMAGE=
EOF
  chmod 600 "$PROD_ENV"
  echo "      Created $PROD_ENV"
else
  echo "      $PROD_ENV already exists, skipping."
fi

# --- 5. Start Traefik reverse proxy ---
echo "[5/5] Starting Traefik reverse proxy..."
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
  echo "      Traefik compose file created."
fi

if docker compose -f "$TRAEFIK_COMPOSE" ps --quiet traefik 2>/dev/null | grep -q .; then
    echo "      Traefik is already running."
else
    docker compose -f "$TRAEFIK_COMPOSE" up -d
    echo "      Traefik started."
fi

echo ""
echo "=== Setup complete! ==="
echo ""
echo "Server IP: $(curl -s ifconfig.me 2>/dev/null || echo '<server-ip>')"
echo ""
echo "Next steps:"
echo "  1. Ensure DNS records point to this server IP:"
echo "       A  ${_app_host_test}   →  <server-ip>"
echo "       A  ${_kc_host_test}    →  <server-ip>"
echo "       A  ${_maildev_host}    →  <server-ip>"
echo "       A  ${_app_host_prod}   →  <server-ip>"
echo "       A  ${_kc_host_prod}    →  <server-ip>"
echo "  2. Verify secrets in /opt/cleantrack/test/.env and /opt/cleantrack/prod/.env"
echo "  3. Deployment will proceed automatically via init.sh"
echo ""
