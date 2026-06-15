#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   deploy.sh [--force-update | -fu] <env> [frontend_image] [backend_image]
#   env = test|prod
#
# Options:
#   --force-update | -fu   Met à jour les scripts de déploiement depuis GitHub
#                          avant d'exécuter le déploiement.
#
# Exemples:
#   ./deploy.sh test ghcr.io/aquila04/clean-track-pro-frontend:abc123 ghcr.io/aquila04/clean-track-pro-backend:abc123
#   ./deploy.sh -fu prod ghcr.io/aquila04/clean-track-pro-frontend:abc123 ghcr.io/aquila04/clean-track-pro-backend:abc123

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 [--force-update | -fu] <env> [frontend_image] [backend_image]" >&2
  exit 2
fi

# Handle --force-update / -fu flag
if [[ "$1" == "--force-update" || "$1" == "-fu" ]]; then
    echo ">>> [deploy] Force update requested. Updating deploy scripts from GitHub..."
    curl -sSL https://raw.githubusercontent.com/AQUILA04/clean-track-pro/main/deploy/update-deploy.sh | bash
    shift
    if [ "$#" -lt 1 ]; then
      echo "Error: Missing environment argument after --force-update." >&2
      echo "Usage: $0 [--force-update | -fu] <env> [frontend_image] [backend_image]" >&2
      exit 2
    fi
    echo ">>> [deploy] Re-executing updated deploy.sh..."
    exec /opt/cleantrack/deploy/deploy.sh "$@"
fi

ENV="$1"
FRONTEND_ARG="${2:-}"
BACKEND_ARG="${3:-}"

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-compose.$ENV.yml"

# Each stack has its own directory and .env under /opt/cleantrack/<env>/
STACK_DIR="/opt/cleantrack/$ENV"
ENV_FILE="$STACK_DIR/.env"
RELEASES_DIR="$STACK_DIR/releases"
mkdir -p "$RELEASES_DIR"

# Load stack-specific .env if present (do not fail if absent)
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a; source "$ENV_FILE"; set +a
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

if [[ -z "$FRONTEND_IMAGE" || -z "$BACKEND_IMAGE" ]]; then
  echo "Error: FRONTEND_IMAGE and BACKEND_IMAGE must be provided either as arguments or set in $ENV_FILE" >&2
  echo "Usage: $0 [--force-update | -fu] <env> [frontend_image] [backend_image]" >&2
  exit 1
fi

# Ensure .env exists and is protected
touch "$ENV_FILE"
chmod 600 "$ENV_FILE" || true

set_env_var() {
  local key="$1"
  local val="$2"
  local file="$ENV_FILE"
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

# Persist images to .env if provided on CLI
if [[ -n "$FRONTEND_ARG" ]]; then
  set_env_var "FRONTEND_IMAGE" "$FRONTEND_IMAGE"
fi
if [[ -n "$BACKEND_ARG" ]]; then
  set_env_var "BACKEND_IMAGE" "$BACKEND_IMAGE"
fi

TIMESTAMP=$(date -u +"%Y%m%dT%H%M%SZ")
RELEASE_FILE="$RELEASES_DIR/${ENV}_${TIMESTAMP}.txt"

echo "DEPLOY: env=$ENV"
echo "Using compose file: $COMPOSE_FILE"
echo "Using env file:     $ENV_FILE"
echo "Saving release metadata to $RELEASE_FILE"
echo "FRONTEND_IMAGE=$FRONTEND_IMAGE" > "$RELEASE_FILE"
echo "BACKEND_IMAGE=$BACKEND_IMAGE"   >> "$RELEASE_FILE"
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
