#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   deploy.sh [--force-update | -fu] <env> [frontend_image] [backend_image] [keycloak_image]
#   env = test|prod
#
# Options:
#   --force-update | -fu   Met à jour les scripts de déploiement depuis GitHub
#                          avant d'exécuter le déploiement.
#
# Exemples:
#   ./deploy.sh test ghcr.io/aquila04/clean-track-pro-frontend:abc123 ghcr.io/aquila04/clean-track-pro-backend:abc123 ghcr.io/aquila04/clean-track-pro-keycloak:abc123
#   ./deploy.sh -fu prod ghcr.io/aquila04/clean-track-pro-frontend:abc123 ghcr.io/aquila04/clean-track-pro-backend:abc123 ghcr.io/aquila04/clean-track-pro-keycloak:abc123

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 [--force-update | -fu] <env> [frontend_image] [backend_image] [keycloak_image]" >&2
  exit 2
fi

# Handle --force-update / -fu flag
if [[ "$1" == "--force-update" || "$1" == "-fu" ]]; then
    echo ">>> [deploy] Force update requested. Updating deploy scripts from GitHub..."
    curl -sSL https://raw.githubusercontent.com/AQUILA04/clean-track-pro/main/deploy/update-deploy.sh | bash
    shift
    if [ "$#" -lt 1 ]; then
      echo "Error: Missing environment argument after --force-update." >&2
      echo "Usage: $0 [--force-update | -fu] <env> [frontend_image] [backend_image] [keycloak_image]" >&2
      exit 2
    fi
    echo ">>> [deploy] Re-executing updated deploy.sh..."
    exec /opt/cleantrack/deploy/deploy.sh "$@"
fi

ENV="$1"
FRONTEND_ARG="${2:-}"
BACKEND_ARG="${3:-}"
KEYCLOAK_ARG="${4:-}"

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-compose.$ENV.yml"

# Each stack has its own directory and .env under /opt/cleantrack/<env>/
STACK_DIR="/opt/cleantrack/$ENV"
ENV_FILE="$STACK_DIR/.env"
RELEASES_DIR="$STACK_DIR/releases"
mkdir -p "$RELEASES_DIR"

env_quote() {
  local val="$1"
  if [[ "$val" == *[$'\n\r']* ]]; then
    echo "Error: newline in env value for key" >&2
    return 1
  fi
  # Single-quote values with shell metacharacters so `source` does not expand $, `, etc.
  if [[ "$val" =~ ^[A-Za-z0-9._:/+-]+$ ]]; then
    printf '%s' "$val"
  else
    printf "'%s'" "${val//\'/\'\\\'\'}"
  fi
}

safe_source_env() {
  local file="$1"
  [[ -f "$file" ]] || return 0
  set +u
  set -a
  # shellcheck disable=SC1090
  source "$file"
  set +a
  set -u
}

set_env_var() {
  local key="$1"
  local val="$2"
  local file="$ENV_FILE"
  local stored line found=false
  stored="$(env_quote "$val")"
  local tmp
  tmp=$(mktemp)

  if [[ -f "$file" ]]; then
    while IFS= read -r line || [[ -n "$line" ]]; do
      if [[ "$line" == "${key}="* ]] && [[ "$found" == false ]]; then
        printf '%s=%s\n' "$key" "$stored"
        found=true
      else
        printf '%s\n' "$line"
      fi
    done < "$file" > "$tmp"
  fi

  if [[ "$found" == false ]]; then
    printf '%s=%s\n' "$key" "$stored" >> "$tmp"
  fi

  cat "$tmp" > "$file"
  rm -f "$tmp"
}

# Load stack-specific .env if present (do not fail if absent)
if [[ -f "$ENV_FILE" ]]; then
  safe_source_env "$ENV_FILE"
else
  echo "Warning: $ENV_FILE not found. Run setup-server.sh or init.sh first." >&2
fi

# Determine images: prefer CLI args, fall back to values from .env
if [[ -n "$FRONTEND_ARG" ]]; then
  FRONTEND_IMAGE="$FRONTEND_ARG"
else
  FRONTEND_IMAGE="${FRONTEND_IMAGE:-}"
fi

if [[ -n "$BACKEND_ARG" ]]; then
  BACKEND_IMAGE="$BACKEND_ARG"
else
  BACKEND_IMAGE="${BACKEND_IMAGE:-}"
fi

if [[ -n "$KEYCLOAK_ARG" ]]; then
  KEYCLOAK_IMAGE="$KEYCLOAK_ARG"
else
  KEYCLOAK_IMAGE="${KEYCLOAK_IMAGE:-}"
fi

if [[ -z "$FRONTEND_IMAGE" || -z "$BACKEND_IMAGE" || -z "$KEYCLOAK_IMAGE" ]]; then
  echo "Error: FRONTEND_IMAGE, BACKEND_IMAGE and KEYCLOAK_IMAGE must be provided either as arguments or set in $ENV_FILE" >&2
  echo "Usage: $0 [--force-update | -fu] <env> [frontend_image] [backend_image] [keycloak_image]" >&2
  exit 1
fi

# Ensure .env exists and is protected
touch "$ENV_FILE"
chmod 600 "$ENV_FILE" || true

set_env_var_if_missing() {
  local key="$1"
  local val="$2"
  if ! grep -q -E "^${key}=" "$ENV_FILE" 2>/dev/null; then
    set_env_var "$key" "$val"
    echo "  + added missing $key"
  elif grep -q -E "^${key}=$" "$ENV_FILE" 2>/dev/null && [[ -n "$val" ]]; then
    set_env_var "$key" "$val"
    echo "  + filled empty $key"
  fi
}

# Persist images to .env if provided on CLI
if [[ -n "$FRONTEND_ARG" ]]; then
  set_env_var "FRONTEND_IMAGE" "$FRONTEND_IMAGE"
fi
if [[ -n "$BACKEND_ARG" ]]; then
  set_env_var "BACKEND_IMAGE" "$BACKEND_IMAGE"
fi
if [[ -n "$KEYCLOAK_ARG" ]]; then
  set_env_var "KEYCLOAK_IMAGE" "$KEYCLOAK_IMAGE"
fi

# ---------------------------------------------------------------------------
# Ensure .env has all keys expected by compose.
# Secrets and hostnames are written once (setup-server.sh or manual edit).
# Routine deploys only add missing keys and refresh image tags.
# Set CT_UPDATE_ENV_SECRETS=true to force syncing CT_* overrides from init/CD.
# ---------------------------------------------------------------------------
echo "Ensuring $ENV_FILE has required keys..."
if [[ "$ENV" == "prod" ]]; then
  set_env_var_if_missing APP_HOSTNAME "cleantrack.optimizesolux.com"
  set_env_var_if_missing API_HOSTNAME "cleantrack-api.optimizesolux.com"
  set_env_var_if_missing KEYCLOAK_HOSTNAME "cleantrack-auth.optimizesolux.com"
  set_env_var_if_missing CORS_ORIGINS "https://cleantrack.optimizesolux.com"
  set_env_var_if_missing NEXT_PUBLIC_API_URL "https://cleantrack-api.optimizesolux.com"
  set_env_var_if_missing NEXTAUTH_URL "https://cleantrack.optimizesolux.com"
  set_env_var_if_missing KEYCLOAK_AUTH_SERVER_URL "https://cleantrack-auth.optimizesolux.com"
  set_env_var_if_missing KEYCLOAK_ISSUER "https://cleantrack-auth.optimizesolux.com/realms/cleantrack"
  set_env_var_if_missing MAIL_HOST "smtp.resend.com"
  set_env_var_if_missing MAIL_PORT "465"
  set_env_var_if_missing MAIL_USER "resend"
  set_env_var_if_missing MAIL_FROM "CleanTrackPro <noreply@optimizesolux.com>"
fi

if [[ "${CT_UPDATE_ENV_SECRETS:-}" == "true" ]]; then
  echo "CT_UPDATE_ENV_SECRETS=true — applying secret overrides from init/CD..."
  [[ -n "${CT_API_HOSTNAME_PROD:-}" ]] && set_env_var API_HOSTNAME "$CT_API_HOSTNAME_PROD"
  [[ -n "${CT_APP_HOSTNAME_PROD:-}" ]] && set_env_var APP_HOSTNAME "$CT_APP_HOSTNAME_PROD"
  [[ -n "${CT_KEYCLOAK_HOSTNAME_PROD:-}" ]] && set_env_var KEYCLOAK_HOSTNAME "$CT_KEYCLOAK_HOSTNAME_PROD"
  [[ -n "${CT_MAIL_HOST:-}" ]] && set_env_var MAIL_HOST "$CT_MAIL_HOST"
  [[ -n "${CT_MAIL_PORT:-}" ]] && set_env_var MAIL_PORT "$CT_MAIL_PORT"
  [[ -n "${CT_MAIL_USER:-}" ]] && set_env_var MAIL_USER "$CT_MAIL_USER"
  [[ -n "${CT_MAIL_PASS:-}" ]] && set_env_var MAIL_PASS "$CT_MAIL_PASS"
  [[ -n "${CT_MAIL_FROM:-}" ]] && set_env_var MAIL_FROM "$CT_MAIL_FROM"
  [[ -n "${CT_DB_USER:-}" ]] && set_env_var DB_USER "$CT_DB_USER"
  [[ -n "${CT_DB_PASSWORD:-}" ]] && set_env_var DB_PASSWORD "$CT_DB_PASSWORD"
  [[ -n "${CT_DB_NAME:-}" ]] && set_env_var DB_NAME "$CT_DB_NAME"
  [[ -n "${CT_KEYCLOAK_ADMIN_PASSWORD:-}" ]] && set_env_var KEYCLOAK_ADMIN_PASSWORD "$CT_KEYCLOAK_ADMIN_PASSWORD"
  [[ -n "${CT_KEYCLOAK_CLIENT_SECRET:-}" ]] && set_env_var KEYCLOAK_CLIENT_SECRET "$CT_KEYCLOAK_CLIENT_SECRET"
  [[ -n "${CT_NEXTAUTH_SECRET:-}" ]] && set_env_var NEXTAUTH_SECRET "$CT_NEXTAUTH_SECRET"
fi

# Fill derived URLs only when still missing (do not rewrite on every deploy)
if [[ "$ENV" == "prod" ]]; then
  safe_source_env "$ENV_FILE"
  set_env_var_if_missing CORS_ORIGINS "https://${APP_HOSTNAME}"
  set_env_var_if_missing NEXTAUTH_URL "https://${APP_HOSTNAME}"
  set_env_var_if_missing NEXT_PUBLIC_API_URL "https://${API_HOSTNAME}"
  set_env_var_if_missing KEYCLOAK_AUTH_SERVER_URL "https://${KEYCLOAK_HOSTNAME}"
  set_env_var_if_missing KEYCLOAK_ISSUER "https://${KEYCLOAK_HOSTNAME}/realms/cleantrack"
fi

TIMESTAMP=$(date -u +"%Y%m%dT%H%M%SZ")
RELEASE_FILE="$RELEASES_DIR/${ENV}_${TIMESTAMP}.txt"

echo "DEPLOY: env=$ENV"
echo "Using compose file: $COMPOSE_FILE"
echo "Using env file:     $ENV_FILE"
echo "Saving release metadata to $RELEASE_FILE"
echo "FRONTEND_IMAGE=$FRONTEND_IMAGE" > "$RELEASE_FILE"
echo "BACKEND_IMAGE=$BACKEND_IMAGE"   >> "$RELEASE_FILE"
echo "KEYCLOAK_IMAGE=$KEYCLOAK_IMAGE" >> "$RELEASE_FILE"
echo "TIMESTAMP=$TIMESTAMP"           >> "$RELEASE_FILE"

echo "Pulling images..."
if [ -n "${GHCR_USERNAME:-}" ] && [ -n "${GHCR_TOKEN:-}" ]; then
  echo "Logging in to ghcr.io as $GHCR_USERNAME"
  echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USERNAME" --password-stdin
fi

docker compose \
  -f "$COMPOSE_FILE" \
  --project-name "cleantrack-$ENV" \
  --env-file "$ENV_FILE" \
  pull

echo "Starting services..."
docker compose \
  -f "$COMPOSE_FILE" \
  --project-name "cleantrack-$ENV" \
  --env-file "$ENV_FILE" \
  up -d

# Run database migrations inside the backend container
echo "Running database migrations..."
docker compose \
  -f "$COMPOSE_FILE" \
  --project-name "cleantrack-$ENV" \
  --env-file "$ENV_FILE" \
  exec -T backend npm run migration:run || echo "Migration skipped or already applied."

# Run Keycloak setup inside the backend container
echo "Running Keycloak setup..."
docker compose \
  -f "$COMPOSE_FILE" \
  --project-name "cleantrack-$ENV" \
  --env-file "$ENV_FILE" \
  exec -T backend npm run keycloak:setup || echo "Keycloak setup skipped or already applied."

echo "Deployment finished. Latest release metadata:"
tail -n +1 "$RELEASE_FILE"

echo "Touching current pointer"
ln -sfn "$RELEASE_FILE" "$RELEASES_DIR/${ENV}_current.txt"

echo "Done"
