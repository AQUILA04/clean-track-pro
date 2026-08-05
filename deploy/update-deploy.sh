#!/usr/bin/env bash
set -euo pipefail
# =============================================================================
# update-deploy.sh — Mise à jour atomique des scripts de déploiement
# =============================================================================
# Télécharge la dernière version du dossier deploy/ depuis GitHub et remplace
# l'ancienne version sur le serveur de manière atomique (swap de répertoire).
# L'ancienne version est sauvegardée dans /opt/cleantrack/deploy.old_<timestamp>.
#
# Le dépôt GitHub est la SEULE source de vérité pour compose + scripts.
# Ne pas patcher durablement /opt/cleantrack/deploy sur le serveur.
# =============================================================================

echo ">>> [update-deploy] Fetching latest deploy scripts from GitHub..."
rm -rf /tmp/cleantrack_src
git clone --depth 1 https://github.com/AQUILA04/clean-track-pro.git /tmp/cleantrack_src > /dev/null 2>&1

echo ">>> [update-deploy] Applying new scripts..."
rm -rf /opt/cleantrack/deploy.new
cp -r /tmp/cleantrack_src/deploy /opt/cleantrack/deploy.new
rm -rf /tmp/cleantrack_src

# Ensure permissions
chmod +x /opt/cleantrack/deploy.new/*.sh

# Atomic swap: backup old, move new in place
BACKUP_DIR="/opt/cleantrack/deploy.old_$(date +%s)"
if [[ -d "/opt/cleantrack/deploy" ]]; then
    mv /opt/cleantrack/deploy "$BACKUP_DIR"
    echo ">>> [update-deploy] Old scripts backed up in $BACKUP_DIR"
fi
mv /opt/cleantrack/deploy.new /opt/cleantrack/deploy

echo ">>> [update-deploy] Update complete!"
