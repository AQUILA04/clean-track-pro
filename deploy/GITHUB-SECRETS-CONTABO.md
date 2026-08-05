# Secrets GitHub + DNS — CleanTrackPro (OptimizeSolux Contabo)

À configurer **après** Shared Traefik (déjà OK).

## 1. DNS Cloudflare (DNS only / nuage gris)

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | `cleantrack` | `169.58.127.90` | DNS only |
| A | `cleantrack-api` | `169.58.127.90` | DNS only |
| A | `cleantrack-auth` | `169.58.127.90` | DNS only |

## 2. Secrets repo `clean-track-pro` (Actions)

Réutilise la même clé SSH que SharedTraefik si possible.

| Secret | Valeur |
|--------|--------|
| `SSH_PRIVATE_KEY` | contenu de `~\.ssh\optimizesolux_vps_ed25519` |
| `PROD_SERVER_HOST` | `169.58.127.90` |
| `PROD_SERVER_USER` | `root` |
| `GHCR_USERNAME` | ton user GitHub |
| `GHCR_TOKEN` | PAT avec `read:packages` (+ `write:packages` pour CI) |
| `DB_USER` | ex. `cleantrack` |
| `PROD_DB_PASSWORD` | mot de passe fort |
| `PROD_DB_NAME` | `cleantrack` |
| `PROD_KEYCLOAK_ADMIN_PASSWORD` | mot de passe fort |
| `PROD_KEYCLOAK_CLIENT_SECRET` | secret UUID / fort |
| `PROD_NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `PROD_APP_HOSTNAME` | `cleantrack.optimizesolux.com` |
| `PROD_API_HOSTNAME` | `cleantrack-api.optimizesolux.com` |
| `PROD_KEYCLOAK_HOSTNAME` | `cleantrack-auth.optimizesolux.com` |
| `PROD_MAIL_HOST` | `smtp.resend.com` |
| `PROD_MAIL_PORT` | `465` |
| `PROD_MAIL_USER` | `resend` |
| `PROD_MAIL_PASS` | clé API Resend (`re_…`) |
| `PROD_MAIL_FROM` | `CleanTrackPro <noreply@optimizesolux.com>` |

### Resend SMTP pour Keycloak (Realm → Email)

Ce n’est **pas** un compte email classique. Resend SMTP :

| Champ Keycloak | Valeur |
|----------------|--------|
| Host | `smtp.resend.com` |
| Port | `465` (SSL) ou `587` (STARTTLS) |
| Encryption | SSL activé sur 465 |
| Authentication | ON |
| Username | `resend` |
| Password | **la même clé API** Resend (`re_…`) que `MAIL_PASS` |
| From | `noreply@optimizesolux.com` (domaine vérifié) |

Le script `keycloak:setup` (et `apply-keycloak-theme-smtp.sh`) reprend automatiquement `MAIL_*` du `.env`.

## 3. Hosts runtime

| URL | Rôle |
|-----|------|
| https://cleantrack.optimizesolux.com | Frontend |
| https://cleantrack-api.optimizesolux.com | API NestJS |
| https://cleantrack-auth.optimizesolux.com | Keycloak |

## 4. Source de vérité (zéro config serveur)

- **Tout** le runtime Docker (compose, scripts) vit dans `deploy/` du dépôt.
- À chaque `init.sh`, `/opt/cleantrack/deploy/` est **resynchronisé depuis GitHub** — pas de patch manuel durable sur le VPS.
- Les secrets restent hors git dans `/opt/cleantrack/<env>/.env` (injectés par le CD / `setup-server.sh`).
- Template documenté : `deploy/.env.prod.example`.

## 5. Déploiement

1. Pousser les changements `deploy/` + CD sur `main` (ou branche `prod/**`)
2. Configurer les secrets GitHub ci-dessus (dont Resend)
3. Laisser la CI publier les images GHCR
4. Déclencher le CD prod (push `prod/**` ou promote)
5. Ou premier deploy manuel via `init.sh` une fois les images disponibles
