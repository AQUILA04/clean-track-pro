#!/usr/bin/env bash
# =============================================================================
# init.sh — Bootstrap complet du serveur CleanTrack Pro
# =============================================================================
# Ce script est le point d'entrée unique pour un nouveau serveur.
# Il est téléchargé par le CD via curl si absent, puis exécuté.
#
# Comportement :
#   - Si /opt/cleantrack/ n'existe PAS → setup complet du serveur, puis déploiement
#   - Si /opt/cleantrack/ existe déjà  → déploiement direct (setup ignoré)
#
# Usage (appelé par le CD via SSH) :
#   ./init.sh <env> <frontend_image> <backend_image> <keycloak_image> [--force-update | -fu] \
#     [--db-password <val>] \
#     [--db-user <val>] \
#     [--db-name <val>] \
#     [--keycloak-admin-password <val>] \
#     [--keycloak-client-secret <val>] \
#     [--nextauth-secret <val>] \
#     [--app-hostname <val>] \
#     [--keycloak-hostname <val>] \
#     [--ghcr-username <val>] \
#     [--ghcr-token <val>]
#
# Usage manuel (bootstrap d'un nouveau serveur) :
#   curl -sSL https://raw.githubusercontent.com/AQUILA04/clean-track-pro/main/deploy/init.sh -o /opt/cleantrack/init.sh
#   chmod +x /opt/cleantrack/init.sh
#   sudo /opt/cleantrack/init.sh prod \
#       ghcr.io/aquila04/clean-track-pro-frontend:<sha> \
#       ghcr.io/aquila04/clean-track-pro-backend:<sha> \
#       ghcr.io/aquila04/clean-track-pro-keycloak:<sha> \
#       --db-password "..." \
#       --keycloak-admin-password "..." \
#       ...
# =============================================================================
set -euo pipefail

INIT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEPLOY_DIR="/opt/cleantrack/deploy"
GITHUB_RAW="https://raw.githubusercontent.com/AQUILA04/clean-track-pro/main/deploy"

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------
ENV=""
FRONTEND_IMAGE=""
BACKEND_IMAGE=""
KEYCLOAK_IMAGE=""
FORCE_UPDATE=false

DB_USER=""
DB_PASSWORD=""
DB_NAME=""
KEYCLOAK_ADMIN_PASSWORD=""
KEYCLOAK_CLIENT_SECRET=""
NEXTAUTH_SECRET=""
APP_HOSTNAME_TEST=""
APP_HOSTNAME_PROD=""
KEYCLOAK_HOSTNAME_TEST=""
KEYCLOAK_HOSTNAME_PROD=""
MAILDEV_HOSTNAME=""
GHCR_USERNAME=""
GHCR_TOKEN=""

# First positional: env
if [[ "$#" -ge 1 && "$1" != --* && "$1" != -* ]]; then
    ENV="$1"; shift
fi
# Second positional: frontend image
if [[ "$#" -ge 1 && "$1" != --* && "$1" != -* ]]; then
    FRONTEND_IMAGE="$1"; shift
fi
# Third positional: backend image
if [[ "$#" -ge 1 && "$1" != --* && "$1" != -* ]]; then
    BACKEND_IMAGE="$1"; shift
fi
# Fourth positional: keycloak image
if [[ "$#" -ge 1 && "$1" != --* && "$1" != -* ]]; then
    KEYCLOAK_IMAGE="$1"; shift
fi

while [[ "$#" -gt 0 ]]; do
    case "$1" in
        --force-update|-fu) FORCE_UPDATE=true ;;
        --db-user)                    DB_USER="$2";                    shift ;;
        --db-password)                DB_PASSWORD="$2";                shift ;;
        --db-name)                    DB_NAME="$2";                    shift ;;
        --keycloak-admin-password)    KEYCLOAK_ADMIN_PASSWORD="$2";    shift ;;
        --keycloak-client-secret)     KEYCLOAK_CLIENT_SECRET="$2";     shift ;;
        --nextauth-secret)            NEXTAUTH_SECRET="$2";            shift ;;
        --app-hostname-test)          APP_HOSTNAME_TEST="$2";          shift ;;
        --app-hostname-prod)          APP_HOSTNAME_PROD="$2";          shift ;;
        --keycloak-hostname-test)     KEYCLOAK_HOSTNAME_TEST="$2";     shift ;;
        --keycloak-hostname-prod)     KEYCLOAK_HOSTNAME_PROD="$2";     shift ;;
        --maildev-hostname)           MAILDEV_HOSTNAME="$2";           shift ;;
        --ghcr-username)              GHCR_USERNAME="$2";              shift ;;
        --ghcr-token)                 GHCR_TOKEN="$2";                 shift ;;
        *) echo "Unknown parameter: $1" >&2; exit 1 ;;
    esac
    shift
done

if [[ -z "$ENV" || -z "$FRONTEND_IMAGE" || -z "$BACKEND_IMAGE" || -z "$KEYCLOAK_IMAGE" ]]; then
    echo "Error: env, frontend_image, backend_image and keycloak_image are required." >&2
    echo "Usage: $0 <env> <frontend_image> <backend_image> <keycloak_image> [options...]" >&2
    exit 1
fi

# ---------------------------------------------------------------------------
# Step 1 — Ensure /opt/cleantrack/deploy/ is present and up-to-date
# ---------------------------------------------------------------------------
if [[ "$FORCE_UPDATE" == "true" ]]; then
    echo ">>> [init] --force-update: refreshing deploy scripts from GitHub..."
    bash <(curl -sSL "$GITHUB_RAW/update-deploy.sh")
    echo ">>> [init] Re-executing updated init.sh..."
    exec "$DEPLOY_DIR/init.sh" "$ENV" "$FRONTEND_IMAGE" "$BACKEND_IMAGE" "$KEYCLOAK_IMAGE" \
        ${DB_USER:+--db-user "$DB_USER"} \
        ${DB_PASSWORD:+--db-password "$DB_PASSWORD"} \
        ${DB_NAME:+--db-name "$DB_NAME"} \
        ${KEYCLOAK_ADMIN_PASSWORD:+--keycloak-admin-password "$KEYCLOAK_ADMIN_PASSWORD"} \
        ${KEYCLOAK_CLIENT_SECRET:+--keycloak-client-secret "$KEYCLOAK_CLIENT_SECRET"} \
        ${NEXTAUTH_SECRET:+--nextauth-secret "$NEXTAUTH_SECRET"} \
        ${APP_HOSTNAME_TEST:+--app-hostname-test "$APP_HOSTNAME_TEST"} \
        ${APP_HOSTNAME_PROD:+--app-hostname-prod "$APP_HOSTNAME_PROD"} \
        ${KEYCLOAK_HOSTNAME_TEST:+--keycloak-hostname-test "$KEYCLOAK_HOSTNAME_TEST"} \
        ${KEYCLOAK_HOSTNAME_PROD:+--keycloak-hostname-prod "$KEYCLOAK_HOSTNAME_PROD"} \
        ${MAILDEV_HOSTNAME:+--maildev-hostname "$MAILDEV_HOSTNAME"} \
        ${GHCR_USERNAME:+--ghcr-username "$GHCR_USERNAME"} \
        ${GHCR_TOKEN:+--ghcr-token "$GHCR_TOKEN"}
fi

if [[ ! -d "$DEPLOY_DIR" ]]; then
    echo ">>> [init] /opt/cleantrack/deploy not found. Fetching deploy scripts from GitHub..."
    mkdir -p /opt/cleantrack
    rm -rf /tmp/cleantrack_src
    git clone https://github.com/AQUILA04/clean-track-pro.git /tmp/cleantrack_src
    cp -r /tmp/cleantrack_src/deploy "$DEPLOY_DIR"
    rm -rf /tmp/cleantrack_src
    chmod +x "$DEPLOY_DIR"/*.sh
    echo ">>> [init] Deploy scripts installed in $DEPLOY_DIR"
fi

# ---------------------------------------------------------------------------
# Step 2 — First-time server setup (only if /opt/cleantrack/ is brand new)
# ---------------------------------------------------------------------------
SETUP_MARKER="/opt/cleantrack/.server_initialized"

if [[ ! -f "$SETUP_MARKER" ]]; then
    echo ">>> [init] First-time setup detected. Running setup-server.sh..."

    # Export all secrets so setup-server.sh can inject them into .env templates
    export CT_DB_USER="${DB_USER:-cleantrack}"
    export CT_DB_PASSWORD="${DB_PASSWORD:-}"
    export CT_DB_NAME_TEST="${DB_NAME:-cleantrack_test}"
    export CT_DB_NAME_PROD="${DB_NAME:-cleantrack_prod}"
    export CT_KEYCLOAK_ADMIN_PASSWORD="${KEYCLOAK_ADMIN_PASSWORD:-}"
    export CT_KEYCLOAK_CLIENT_SECRET="${KEYCLOAK_CLIENT_SECRET:-}"
    export CT_NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-}"
    export CT_APP_HOSTNAME_TEST="${APP_HOSTNAME_TEST:-test.cleantrack.local}"
    export CT_APP_HOSTNAME_PROD="${APP_HOSTNAME_PROD:-cleantrack.local}"
    export CT_KEYCLOAK_HOSTNAME_TEST="${KEYCLOAK_HOSTNAME_TEST:-keycloak.test.cleantrack.local}"
    export CT_KEYCLOAK_HOSTNAME_PROD="${KEYCLOAK_HOSTNAME_PROD:-keycloak.cleantrack.local}"
    export CT_MAILDEV_HOSTNAME="${MAILDEV_HOSTNAME:-maildev.test.cleantrack.local}"

    bash "$DEPLOY_DIR/setup-server.sh"

    touch "$SETUP_MARKER"
    echo ">>> [init] Server setup complete. Marker written to $SETUP_MARKER"
else
    echo ">>> [init] Server already initialized (found $SETUP_MARKER). Skipping setup."
fi

# ---------------------------------------------------------------------------
# Step 3 — Deploy
# ---------------------------------------------------------------------------
echo ">>> [init] Launching deployment: env=$ENV"
export GHCR_USERNAME="${GHCR_USERNAME:-}"
export GHCR_TOKEN="${GHCR_TOKEN:-}"

bash "$DEPLOY_DIR/deploy.sh" "$ENV" "$FRONTEND_IMAGE" "$BACKEND_IMAGE" "$KEYCLOAK_IMAGE"

echo ">>> [init] Done."
