#!/usr/bin/env bash
set -euo pipefail

# Usage:
# rollback.sh <env> [release_filename_or_timestamp]
# env = test|prod
#
# If no release is specified, it rolls back to the previous release (the one before current).

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <env> [release_file_or_timestamp]" >&2
  exit 2
fi

ENV="$1"
TARGET_RELEASE="${2:-}"

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-compose.$ENV.yml"

STACK_DIR="/opt/cleantrack/$ENV"
ENV_FILE="$STACK_DIR/.env"
RELEASES_DIR="$STACK_DIR/releases"

if [[ ! -d "$RELEASES_DIR" ]]; then
  echo "Error: Releases directory $RELEASES_DIR does not exist. No deployments found." >&2
  exit 1
fi

# Load current stack .env
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a; source "$ENV_FILE"; set +a
fi

# Resolve the target release file
RESOLVED_RELEASE_FILE=""

if [[ -n "$TARGET_RELEASE" ]]; then
  # If absolute or relative path is provided
  if [[ -f "$TARGET_RELEASE" ]]; then
    RESOLVED_RELEASE_FILE="$TARGET_RELEASE"
  elif [[ -f "$RELEASES_DIR/$TARGET_RELEASE" ]]; then
    RESOLVED_RELEASE_FILE="$RELEASES_DIR/$TARGET_RELEASE"
  else
    # Try searching by timestamp/pattern
    MATCHES=($(find "$RELEASES_DIR" -maxdepth 1 -name "*${TARGET_RELEASE}*" -type f | sort))
    if [ ${#MATCHES[@]} -eq 0 ]; then
      echo "Error: No release file matching '$TARGET_RELEASE' found in $RELEASES_DIR" >&2
      exit 1
    elif [ ${#MATCHES[@]} -gt 1 ]; then
      echo "Error: Multiple release files matched '$TARGET_RELEASE':" >&2
      printf '%s\n' "${MATCHES[@]}" >&2
      exit 1
    fi
    RESOLVED_RELEASE_FILE="${MATCHES[0]}"
  fi
else
  # No target release specified, find the previous release
  CURRENT_LINK="$RELEASES_DIR/${ENV}_current.txt"
  if [[ ! -L "$CURRENT_LINK" ]]; then
    echo "Error: No current release link found at $CURRENT_LINK. Cannot perform automatic rollback." >&2
    exit 1
  fi
  
  CURRENT_FILE=$(readlink -f "$CURRENT_LINK")
  echo "Current release file: $CURRENT_FILE"
  
  # List all release files for this env, sorted by name (timestamp)
  ALL_RELEASES=($(find "$RELEASES_DIR" -maxdepth 1 -name "${ENV}_*.txt" -type f | sort))
  
  # Find the index of the current file
  CURRENT_INDEX=-1
  for i in "${!ALL_RELEASES[@]}"; do
    if [[ "${ALL_RELEASES[$i]}" == "$CURRENT_FILE" ]]; then
      CURRENT_INDEX=$i
      break
    fi
  done
  
  if [ "$CURRENT_INDEX" -le 0 ]; then
    echo "Error: No previous release found to rollback to (current is first or not found in list)." >&2
    exit 1
  fi
  
  PREV_INDEX=$((CURRENT_INDEX - 1))
  RESOLVED_RELEASE_FILE="${ALL_RELEASES[$PREV_INDEX]}"
fi

echo "ROLLBACK: Rolling back $ENV to release: $RESOLVED_RELEASE_FILE"
echo "--------------------------------------------------"
cat "$RESOLVED_RELEASE_FILE"
echo "--------------------------------------------------"

# Extract images from release file
FRONTEND_IMAGE=$(grep '^FRONTEND_IMAGE=' "$RESOLVED_RELEASE_FILE" | cut -d= -f2-)
BACKEND_IMAGE=$(grep '^BACKEND_IMAGE=' "$RESOLVED_RELEASE_FILE" | cut -d= -f2-)
KEYCLOAK_IMAGE=$(grep '^KEYCLOAK_IMAGE=' "$RESOLVED_RELEASE_FILE" | cut -d= -f2-)

if [[ -z "$FRONTEND_IMAGE" || -z "$BACKEND_IMAGE" || -z "$KEYCLOAK_IMAGE" ]]; then
  echo "Error: Could not parse images from release file." >&2
  exit 1
fi

# Update images in the stack .env
set_env_var() {
  key="$1"
  val="$2"
  file="$ENV_FILE"
  if grep -q -E "^${key}=" "$file" 2>/dev/null; then
    tmp=$(mktemp)
    sed "s~^${key}=.*~${key}=${val}~" "$file" > "$tmp"
    cat "$tmp" > "$file"
    rm -f "$tmp"
  else
    echo "${key}=${val}" >> "$file"
  fi
}

set_env_var "FRONTEND_IMAGE" "$FRONTEND_IMAGE"
set_env_var "BACKEND_IMAGE" "$BACKEND_IMAGE"
set_env_var "KEYCLOAK_IMAGE" "$KEYCLOAK_IMAGE"

echo "Pulling images..."
docker compose \
  -f "$COMPOSE_FILE" \
  --project-name "cleantrack-$ENV" \
  --env-file "$ENV_FILE" \
  pull

echo "Restarting services with previous images..."
docker compose \
  -f "$COMPOSE_FILE" \
  --project-name "cleantrack-$ENV" \
  --env-file "$ENV_FILE" \
  up -d

# Update current pointer
ln -sfn "$RESOLVED_RELEASE_FILE" "$RELEASES_DIR/${ENV}_current.txt"

echo "Rollback successful!"
