# CleanTrack Pro — Deployment Guide

This directory contains all the infrastructure and deployment scripts for CleanTrack Pro.
The deployment architecture follows the same patterns as ELYKIA: **immutable Docker images** pushed to GHCR, **per-environment `.env` files** stored outside the repository on the server, and a **Traefik reverse proxy** managing HTTPS and routing.

---

## Architecture Overview

```
GitHub Actions (CI)
  ├── On push to main/develop/release/** → Build & push images to GHCR
  └── On push to prod/** → Build & push images to GHCR

GitHub Actions (CD)
  ├── After CI on main → Deploy to TEST server
  ├── After CI on prod/** → Deploy to PROD server
  └── Manual dispatch (promote) → Promote TEST release to PROD

Server Layout
  /opt/cleantrack/
  ├── traefik/
  │   ├── acme.json          (Let's Encrypt certificates)
  │   └── docker-compose.traefik.yml
  ├── test/
  │   ├── .env               (test stack secrets — NOT in git)
  │   └── releases/          (timestamped release metadata)
  └── prod/
      ├── .env               (prod stack secrets — NOT in git)
      └── releases/          (timestamped release metadata)
```

---

## Files in this Directory

| File | Description |
|---|---|
| `deploy.sh` | Main deployment script. Pulls images and runs `docker compose up -d`. Ensures `.env` keys are complete. |
| `rollback.sh` | Rollback to a previous release by re-deploying its images. |
| `init.sh` | CD entrypoint: syncs `deploy/` from GitHub, optional first-time setup, then deploy. |
| `setup-server.sh` | One-time server setup: directories, Docker networks, Traefik fallback, `.env` templates. |
| `update-deploy.sh` | Atomically replaces `/opt/cleantrack/deploy` from GitHub (repo = source of truth). |
| `docker-compose.prod.yml` | Docker Compose stack for the PROD environment (Resend MAIL_* wired). |
| `docker-compose.test.yml` | Docker Compose stack for the TEST environment (includes MailDev). |
| `.env.prod.example` | Documented prod `.env` template (no real secrets). |
| `GITHUB-SECRETS-CONTABO.md` | Checklist DNS + GitHub Actions secrets (incl. Resend). |

### Source of truth

Do **not** hand-edit compose/scripts on the VPS. Every `init.sh` run refreshes `/opt/cleantrack/deploy/` from GitHub. Only `/opt/cleantrack/<env>/.env` is server-local (secrets).

---

## GitHub Actions Secrets Required

Configure these secrets in your GitHub repository settings under **Settings → Secrets and Variables → Actions**:

| Secret | Description |
|---|---|
| `GHCR_USERNAME` | GitHub username for GHCR authentication |
| `GHCR_TOKEN` | GitHub Personal Access Token with `read:packages` and `write:packages` scopes |
| `SSH_PRIVATE_KEY` | Private SSH key to connect to the deployment servers |
| `TEST_SERVER_USER` | SSH user on the test server (e.g. `deploy`) |
| `TEST_SERVER_HOST` | IP or hostname of the test server |
| `TEST_DEPLOY_PATH` | Path to the repository clone on the test server (e.g. `/opt/cleantrack/repo`) |
| `PROD_SERVER_USER` | SSH user on the prod server |
| `PROD_SERVER_HOST` | IP or hostname of the prod server |
| `PROD_DEPLOY_PATH` | Path to the repository clone on the prod server |

---

## Initial Server Setup (Run Once)

On a fresh VPS with Docker installed, run:

```bash
# Clone the repository
git clone https://github.com/AQUILA04/clean-track-pro.git /opt/cleantrack/repo
cd /opt/cleantrack/repo

# Run the one-time setup
chmod +x deploy/setup-server.sh
sudo ./deploy/setup-server.sh
```

Then edit the generated `.env` files with your real secrets:

```bash
sudo nano /opt/cleantrack/test/.env
sudo nano /opt/cleantrack/prod/.env
```

---

## Manual Deployment

```bash
# Deploy to TEST
./deploy/deploy.sh test ghcr.io/aquila04/clean-track-pro-frontend:<sha> ghcr.io/aquila04/clean-track-pro-backend:<sha>

# Deploy to PROD
./deploy/deploy.sh prod ghcr.io/aquila04/clean-track-pro-frontend:<sha> ghcr.io/aquila04/clean-track-pro-backend:<sha>
```

---

## Rollback

```bash
# Rollback to the previous release
./deploy/rollback.sh test

# Rollback to a specific release
./deploy/rollback.sh prod test_20250601T120000Z.txt
```

---

## Git Flow & Branch Strategy

| Branch Pattern | CI Triggered | CD Triggered |
|---|---|---|
| `main` | Build + push images | Deploy to TEST |
| `develop` | Build + push images | None |
| `release/**` | Build + push images | None |
| `prod/**` | Build + push images | Deploy to PROD |

To promote a tested release from TEST to PROD without a new build, use the **manual workflow dispatch** with the `promote` action in GitHub Actions.

---

## Environment Variables Reference

### Backend (NestJS)

| Variable | Description | Example |
|---|---|---|
| `PORT` | Backend listening port | `3000` |
| `DB_HOST` | PostgreSQL host | `postgres` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USERNAME` | Database user | `cleantrack_prod_user` |
| `DB_PASSWORD` | Database password | *(secret)* |
| `DB_NAME` | Database name | `cleantrack_prod` |
| `REDIS_HOST` | Redis host | `redis` |
| `REDIS_PORT` | Redis port | `6379` |
| `KEYCLOAK_AUTH_SERVER_URL` | Keycloak base URL | `https://keycloak.cleantrack.local` |
| `KEYCLOAK_REALM` | Keycloak realm | `cleantrack` |
| `KEYCLOAK_CLIENT_ID` | Keycloak client ID | `cleantrack-client` |
| `KEYCLOAK_CLIENT_SECRET` | Keycloak client secret | *(secret)* |

### Frontend (Next.js)

| Variable | Description | Example |
|---|---|---|
| `PORT` | Frontend listening port | `3001` |
| `NEXT_PUBLIC_API_URL` | Public API URL | `https://cleantrack.local/api` |
| `NEXTAUTH_URL` | NextAuth canonical URL | `https://cleantrack.local` |
| `NEXTAUTH_SECRET` | NextAuth secret key | *(secret)* |
| `KEYCLOAK_CLIENT_ID` | Keycloak client ID | `cleantrack-client` |
| `KEYCLOAK_CLIENT_SECRET` | Keycloak client secret | *(secret)* |
| `KEYCLOAK_ISSUER` | Keycloak issuer URL | `https://keycloak.cleantrack.local/realms/cleantrack` |
