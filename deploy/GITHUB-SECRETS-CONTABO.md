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
| `PROD_KEYCLOAK_HOSTNAME` | `cleantrack-auth.optimizesolux.com` |

Optionnel (recommandé) — à ajouter dans le CD plus tard :

| Secret | Valeur |
|--------|--------|
| `PROD_API_HOSTNAME` | `cleantrack-api.optimizesolux.com` |

## 3. Hosts runtime

| URL | Rôle |
|-----|------|
| https://cleantrack.optimizesolux.com | Frontend |
| https://cleantrack-api.optimizesolux.com | API NestJS |
| https://cleantrack-auth.optimizesolux.com | Keycloak |

## 4. Déploiement

1. Pousser les changements `deploy/docker-compose.prod.yml` + CORS sur `main` (ou branche `prod/**`)
2. Laisser la CI publier les images GHCR
3. Déclencher le CD prod (push `prod/**` ou promote)
4. Ou premier deploy manuel via `init.sh` une fois les images disponibles
