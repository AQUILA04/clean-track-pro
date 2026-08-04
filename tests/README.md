# E2E Tests — CleanTrack Pro (Playwright)

## Quick start (local, full stack)

```bash
# One command: Docker infra + bootstrap + servers + Playwright
npm run e2e:run

# Admin tests only
npm run e2e:run:admin
```

**Prerequisites:** Docker Desktop running.

**Ports locaux (profil E2E)** — évite les conflits avec d'autres projets :

| Service   | Port hôte |
|-----------|-----------|
| PostgreSQL | 5433     |
| Redis      | 6380     |
| Keycloak   | **9081** |
| Backend    | 3000     |
| Frontend   | 3001     |

## Manual steps

```bash
# 1. Infrastructure
npm run e2e:infra

# 2. Keycloak + DB migrations + seed data
npm ci --legacy-peer-deps --prefix backend
npm run e2e:bootstrap

# 3. Start apps (two terminals)
# Terminal A — backend (port 3000)
cd backend && set -a && source .env.e2e.generated && set +a && npm run start:dev
# Terminal B — frontend (port 3001)
cd frontend && set -a && source .env.e2e.generated && set +a && npm run dev

# 4. Run tests (third terminal)
export $(grep -v '^#' .env.e2e.generated | xargs)   # or set vars manually on Windows
npm run test:e2e
npm run test:e2e:admin
```

### Windows (PowerShell)

```powershell
npm run e2e:run
# or step by step:
npm run e2e:infra
npm ci --legacy-peer-deps --prefix backend
npm run e2e:bootstrap
# then start backend/frontend with generated .env.e2e.generated files
$env:BASE_URL="http://localhost:3001"
npm run test:e2e:admin
```

## Test user

Created by `scripts/setup-keycloak.ts`:

| User | Password | Role |
|------|----------|------|
| `admin_tenant` | `password123` | Admin_Tenant |
| `admin_site` | `password123` | Admin_Site |
| `user_site` | `password123` | User_Site |

## CI pipeline

Workflow: `.github/workflows/e2e.yml`

Runs on `push` / `pull_request` to `main`, `develop`, `release/**`:

1. Docker: postgres + keycloak + redis
2. Bootstrap Keycloak + migrations + E2E seed
3. Start backend (3000) + frontend (3001)
4. Playwright admin E2E suite
5. Upload HTML report artifact on completion

## Structure

```
tests/e2e/
├── auth.setup.ts                  # Admin_Tenant login → storageState
├── auth-admin-site.setup.ts       # Admin_Site login → storageState
├── auth-user-site.setup.ts        # User_Site login → storageState
└── admin/
    ├── agencies.spec.ts    # [P0/P1] Agency management
    ├── catalogue.spec.ts   # [P0/P1] Catalogue tabs
    └── pricing.spec.ts     # [P0/P1] Pricing matrix
└── order-workflow/
    ├── nominal.spec.ts      # [P0] create client -> create order -> workflow -> storage -> delivery
    ├── alternatives.spec.ts # [P1] invalid transition, occupied slot, already delivered
    └── roles.spec.ts        # [P1] User_Site/Admin_Site access checks
```

## Priority tags

- **[P0]** Critical paths — agencies list, catalogue tabs, pricing grid
- **[P1]** Important flows — filters, modals, dirty-state guard

## Generated files (gitignored)

- `.env.e2e.generated`
- `backend/.env.e2e.generated`
- `frontend/.env.e2e.generated`
- `tests/.auth/admin-tenant.json`
