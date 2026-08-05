#!/usr/bin/env bash
# =============================================================================
# init.sh — Bootstrap complet du serveur CleanTrack Pro
# =============================================================================
# Ce script est le point d'entrée unique pour un nouveau serveur.
# Il est téléchargé par le CD via curl si absent, puis exécuté.
#
# Source de vérité : le dépôt GitHub (dossier deploy/).
# À chaque exécution, les scripts sous /opt/cleantrack/deploy/ sont resynchronisés
# depuis GitHub — aucune config manuelle sur le serveur ne doit survivre hors .env.
#
# Comportement :
#   - Sync deploy/ depuis GitHub (toujours)
#   - Si première fois → setup-server.sh, puis déploiement
#   - Sinon → déploiement direct
#
# Usage (appelé par le CD via SSH) :
#   ./init.sh <env> <frontend_image> <backend_image> <keycloak_image> \
#     [--db-password <val>] \
#     [--mail-pass <val>] \
#     [--mail-from <val>] \
#     [--api-hostname-prod <val>] \
#     ...
# =============================================================================
set -euo pipefail

INIT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEPLOY_DIR="/opt/cleantrack/deploy"
GITHUB_RAW="https://raw.githubusercontent.com/AQUILA04/clean-track-pro/main/deploy"

# ---------------------------------------------------------------------------
# Parse arguments (saved for re-exec after sync)
# ---------------------------------------------------------------------------
ORIG_ARGS=("$@")

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
API_HOSTNAME_PROD=""
KEYCLOAK_HOSTNAME_TEST=""
KEYCLOAK_HOSTNAME_PROD=""
MAILDEV_HOSTNAME=""
MAIL_HOST=""
MAIL_PORT=""
MAIL_USER=""
MAIL_PASS=""
MAIL_FROM=""
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
        --api-hostname-prod)          API_HOSTNAME_PROD="$2";          shift ;;
        --keycloak-hostname-test)     KEYCLOAK_HOSTNAME_TEST="$2";     shift ;;
        --keycloak-hostname-prod)     KEYCLOAK_HOSTNAME_PROD="$2";     shift ;;
        --maildev-hostname)           MAILDEV_HOSTNAME="$2";           shift ;;
        --mail-host)                  MAIL_HOST="$2";                  shift ;;
        --mail-port)                  MAIL_PORT="$2";                  shift ;;
        --mail-user)                  MAIL_USER="$2";                  shift ;;
        --mail-pass)                  MAIL_PASS="$2";                  shift ;;
        --mail-from)                  MAIL_FROM="$2";                  shift ;;
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
# Step 0 — Always sync deploy/ from GitHub (repo = single source of truth)
# ---------------------------------------------------------------------------
# CT_INIT_SYNCED=1 prevents infinite re-exec after update-deploy swaps scripts.
if [[ "${CT_INIT_SYNCED:-}" != "1" ]]; then
    echo ">>> [init] Syncing /opt/cleantrack/deploy from GitHub (repo is source of truth)..."
    mkdir -p /opt/cleantrack
    bash <(curl -sSL "$GITHUB_RAW/update-deploy.sh")

    # Keep the bootstrap copy of init.sh in sync too
    curl -sSL "$GITHUB_RAW/init.sh" -o /opt/cleantrack/init.sh
    chmod +x /opt/cleantrack/init.sh

    export CT_INIT_SYNCED=1
    echo ">>> [init] Re-executing synced init.sh from $DEPLOY_DIR..."
    exec "$DEPLOY_DIR/init.sh" "${ORIG_ARGS[@]}"
fi

# Optional explicit force-update (already synced above; kept for compatibility)
if [[ "$FORCE_UPDATE" == "true" ]]; then
    echo ">>> [init] --force-update acknowledged (deploy/ already synced)."
fi

if [[ ! -d "$DEPLOY_DIR" ]]; then
    echo "Error: $DEPLOY_DIR missing after sync." >&2
    exit 1
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
    export CT_APP_HOSTNAME_TEST="${APP_HOSTNAME_TEST:-test.cleantrack.optimizesolux.com}"
    export CT_APP_HOSTNAME_PROD="${APP_HOSTNAME_PROD:-cleantrack.optimizesolux.com}"
    export CT_API_HOSTNAME_PROD="${API_HOSTNAME_PROD:-cleantrack-api.optimizesolux.com}"
    export CT_KEYCLOAK_HOSTNAME_TEST="${KEYCLOAK_HOSTNAME_TEST:-keycloak.test.cleantrack.optimizesolux.com}"
    export CT_KEYCLOAK_HOSTNAME_PROD="${KEYCLOAK_HOSTNAME_PROD:-cleantrack-auth.optimizesolux.com}"
    export CT_MAILDEV_HOSTNAME="${MAILDEV_HOSTNAME:-maildev.test.cleantrack.optimizesolux.com}"
    export CT_MAIL_HOST="${MAIL_HOST:-smtp.resend.com}"
    export CT_MAIL_PORT="${MAIL_PORT:-465}"
    export CT_MAIL_USER="${MAIL_USER:-resend}"
    export CT_MAIL_PASS="${MAIL_PASS:-}"
    export CT_MAIL_FROM="${MAIL_FROM:-CleanTrackPro <noreply@optimizesolux.com>}"

    bash "$DEPLOY_DIR/setup-server.sh"

    touch "$SETUP_MARKER"
    echo ">>> [init] Server setup complete. Marker written to $SETUP_MARKER"
else
    echo ">>> [init] Server already initialized (found $SETUP_MARKER). Skipping setup."
fi

# ---------------------------------------------------------------------------
# Step 3 — Deploy (pass mail/API overrides so existing .env stays complete)
# ---------------------------------------------------------------------------
echo ">>> [init] Launching deployment: env=$ENV"
export GHCR_USERNAME="${GHCR_USERNAME:-}"
export GHCR_TOKEN="${GHCR_TOKEN:-}"
export CT_API_HOSTNAME_PROD="${API_HOSTNAME_PROD:-}"
export CT_MAIL_HOST="${MAIL_HOST:-}"
export CT_MAIL_PORT="${MAIL_PORT:-}"
export CT_MAIL_USER="${MAIL_USER:-}"
export CT_MAIL_PASS="${MAIL_PASS:-}"
export CT_MAIL_FROM="${MAIL_FROM:-}"
export CT_APP_HOSTNAME_PROD="${APP_HOSTNAME_PROD:-}"
export CT_KEYCLOAK_HOSTNAME_PROD="${KEYCLOAK_HOSTNAME_PROD:-}"
export CT_KEYCLOAK_ADMIN_PASSWORD="${KEYCLOAK_ADMIN_PASSWORD:-}"
export CT_KEYCLOAK_CLIENT_SECRET="${KEYCLOAK_CLIENT_SECRET:-}"
export CT_NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-}"
export CT_DB_PASSWORD="${DB_PASSWORD:-}"
export CT_DB_USER="${DB_USER:-}"
export CT_DB_NAME="${DB_NAME:-}"

bash "$DEPLOY_DIR/deploy.sh" "$ENV" "$FRONTEND_IMAGE" "$BACKEND_IMAGE" "$KEYCLOAK_IMAGE"

echo ">>> [init] Done."
