#!/usr/bin/env bash
# Apply Keycloak theme mount + Resend SMTP on prod (one-shot ops helper).
set -euo pipefail
ENV=/opt/cleantrack/prod/.env
COMPOSE=/opt/cleantrack/deploy/docker-compose.prod.yml

env_get() {
  grep -E "^${1}=" "$ENV" | head -1 | cut -d= -f2- | sed 's/^"//;s/"$//'
}

# Ensure theme path exists
THEME_SRC=/opt/cleantrack/repo/keycloak/themes/cleantrack-pro
if [[ ! -d "$THEME_SRC" ]]; then
  echo "ERROR: theme missing at $THEME_SRC — sync repo first" >&2
  exit 1
fi

grep -q '^KEYCLOAK_THEMES_PATH=' "$ENV" || echo "KEYCLOAK_THEMES_PATH=$THEME_SRC" >> "$ENV"

# Ensure compose has theme volume
if ! grep -q 'themes/cleantrack-pro' "$COMPOSE"; then
  echo "ERROR: $COMPOSE missing theme volume — upload updated compose from repo" >&2
  exit 1
fi

cd /opt/cleantrack/deploy
docker compose -f docker-compose.prod.yml --project-name cleantrack-prod --env-file "$ENV" \
  up -d --force-recreate --no-deps keycloak

echo "Waiting for Keycloak..."
for i in $(seq 1 30); do
  if curl -sf http://127.0.0.1:8080/realms/master >/dev/null 2>&1; then break; fi
  # Keycloak not published on host — check via docker
  if docker exec cleantrack-prod-keycloak-1 curl -sf http://127.0.0.1:8080/realms/master >/dev/null 2>&1; then break; fi
  sleep 3
done

echo "=== Theme in container ==="
docker exec cleantrack-prod-keycloak-1 ls -la /opt/keycloak/themes/cleantrack-pro/login | head -10

ADMIN=$(env_get KEYCLOAK_ADMIN)
PASS=$(env_get KEYCLOAK_ADMIN_PASSWORD)
MAIL_HOST=$(env_get MAIL_HOST)
MAIL_PORT=$(env_get MAIL_PORT)
MAIL_USER=$(env_get MAIL_USER)
MAIL_PASS=$(env_get MAIL_PASS)

docker exec cleantrack-prod-keycloak-1 /opt/keycloak/bin/kcadm.sh config credentials \
  --server http://localhost:8080 --realm master --user "$ADMIN" --password "$PASS"

# Ensure realm uses custom theme
docker exec cleantrack-prod-keycloak-1 /opt/keycloak/bin/kcadm.sh update realms/cleantrack \
  -s loginTheme=cleantrack-pro \
  -s accountTheme=cleantrack-pro \
  -s emailTheme=cleantrack-pro

# Resend SMTP: user=resend, password=API key (JSON merge — kcadm -s nested map is unreliable)
SMTP_JSON=$(mktemp)
cat > "$SMTP_JSON" <<EOF
{
  "smtpServer": {
    "host": "${MAIL_HOST:-smtp.resend.com}",
    "port": "${MAIL_PORT:-465}",
    "from": "noreply@optimizesolux.com",
    "fromDisplayName": "CleanTrackPro",
    "replyTo": "noreply@optimizesolux.com",
    "replyToDisplayName": "CleanTrackPro",
    "ssl": "true",
    "starttls": "false",
    "auth": "true",
    "user": "${MAIL_USER:-resend}",
    "password": "${MAIL_PASS}"
  }
}
EOF
docker cp "$SMTP_JSON" cleantrack-prod-keycloak-1:/tmp/smtp.json
rm -f "$SMTP_JSON"
docker exec cleantrack-prod-keycloak-1 /opt/keycloak/bin/kcadm.sh update realms/cleantrack -f /tmp/smtp.json
docker exec cleantrack-prod-keycloak-1 rm -f /tmp/smtp.json

echo "=== Realm theme + smtp (password redacted) ==="
docker exec cleantrack-prod-keycloak-1 /opt/keycloak/bin/kcadm.sh get realms/cleantrack \
  --fields loginTheme,accountTheme,emailTheme,smtpServer | sed 's/"password" : "[^"]*"/"password" : "<set>"/'
echo "DONE"
