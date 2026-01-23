# Story 1.2: User Authentication & Role Mapping

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **User**,
I want to **log in using my credentials and have my specific Role (Superadmin, Admin_Tenant, Admin_Site, etc.) recognized**,
so that **I can access the correct features and data isolated to my tenant/site**.

## Acceptance Criteria

1. **Login Flow (Frontend):**
   - **Given** a user accesses the application
   - **When** they click "Login"
   - **Then** they are redirected to the Keycloak Login Page
   - **And** upon checks, redirected back with a valid session.

2. **JWT Claims Structure:**
   - **Given** a successful login
   - **Then** the JWT token MUST contain custom claims:
     - `tenant_id`: UUID of the tenant the user belongs to.
     - `site_ids`: Array of UUIDs for sites the user allows access to (for Admin_Site/User_Site).
     - `realm_access.roles`: Standard Keycloak roles (Superadmin, Admin_Tenant, etc.).

3. **Backend Security (Guards):**
   - **Given** a request to a protected endpoint (e.g., `/api/tenants`)
   - **When** the request includes a valid Bearer Token
   - **Then** the Backend validates the signature and expiration
   - **And** extracts the `AuthUser` context (id, email, roles, tenant_id).

4. **Role-Based Access Control (RBAC):**
   - **Given** a user with role `User_Site`
   - **When** they attempt to access a `Superadmin` only route
   - **Then** the system returns `403 Forbidden`.

## Tasks / Subtasks

- [x] **Task 1: Backend Auth Infrastructure** (AC: 2, 3, 4)
  - [x] Configure `KeycloakModule` (or AuthModule) in NestJS to validate tokens.
  - [x] Use `nest-keycloak-connect` library (provides guards and role validation without custom JwtStrategy).
  - [x] Create `@Roles()` decorator and `RolesGuard` (provided by nest-keycloak-connect).
  - [x] Implement `@CurrentUser` decorator to extract `tenant_id` and user context from JWT claims.

- [x] **Task 2: Frontend Auth Integration** (AC: 1)
  - [x] Install and configure `next-auth` (or generic OIDC client) for Keycloak.
  - [x] Configure `.../api/auth/[...nextauth]/route.ts` (App Router).
  - [x] Map Keycloak profile to NextAuth session object (ensure `tenant_id` and `roles` are persisted in session).

- [x] **Task 3: Keycloak Configuration (DevEnv)**
  - [x] Ensure `docker-compose` Keycloak has a client configured for the app.
  - [x] Create test users with different roles (Superadmin, Admin_Tenant) in the local Keycloak instance.

## Dev Notes

- **Architecture Compliance:**
  - **Backend:** NestJS Modular Architecture. Keep Auth logic in `AuthModule` (or `Shared/Keycloak`).
  - **Frontend:** Next.js 14 App Router. Use Server Actions or API Routes for sensitive operations, but Auth is typically middleware/client-side session.
  - **Security:** Do NOT hardcode secrets. Use `.env` (KEYCLOAK_CLIENT_SECRET, etc.).

- **Technical Specifics:**
  - **Keycloak Claims:** You may need to configure "Mappers" in Keycloak to emit `tenant_id` into the token. For local dev, manually add these to the user attributes or use a script.
  - **NextAuth v5:** If using v5, be aware of the new middleware pattern. v4 is also acceptable if more stable for this stack.

### Project Structure Notes

- Backend: `src/auth` or `src/shared/keycloak`.
- Frontend: `src/app/api/auth/[...nextauth]`.

### References

- [Source: docs/planning-artifacts/architecture.md#1-stack-technique](file:///c:/Users/kahonsu/Documents/GitHub/clean-track-pro/docs/planning-artifacts/architecture.md#L3)
- [Source: docs/planning-artifacts/prd.md#1-gestion-des-identités-iam-via-keycloak](file:///c:/Users/kahonsu/Documents/GitHub/clean-track-pro/docs/planning-artifacts/prd.md#L3)

## Dev Agent Record

### Agent Model Used

Claude 4.5 Sonnet

### Debug Log References

### Completion Notes List

- Configured `KeycloakModule` in `backend/src/shared/keycloak/keycloak.module.ts` with `nest-keycloak-connect` library
- Registered global guards: `AuthGuard`, `ResourceGuard`, and `RoleGuard` for automatic route protection
- Created auth decorators: `@CurrentUser` (extracts user context from JWT), `@Roles` (RBAC metadata), `@Public` (exempt routes)
- Enhanced `TenantController` with role-based guards to demonstrate AC3 and AC4 (protected endpoints, RBAC)
- Fixed `@CurrentUser` decorator to throw `UnauthorizedException` instead of generic Error
- Installed and configured `next-auth` in frontend with Keycloak provider
- Created NextAuth route handler at `frontend/src/app/api/auth/[...nextauth]/route.ts` with exported authOptions
- Created login page at `frontend/src/app/auth/signin/page.tsx` implementing AC1 (Login Flow)
- Implemented JWT and session callbacks to persist `tenant_id`, `site_ids`, and `roles` from Keycloak token
- Created TypeScript type augmentation for NextAuth session in `frontend/src/types/next-auth.d.ts`
- Updated `frontend/src/lib/auth.ts` to pass authOptions to getServerSession
- Developed automated Keycloak setup script (`scripts/setup-keycloak.ts`) using Keycloak Admin Client
- Script creates realm, client, protocol mappers for `tenant_id` and `site_ids`, roles, and test users
- Added `npm run keycloak:setup` script to backend package.json
- Created `.env.example` files for both backend and frontend with required Keycloak configuration
- Created comprehensive unit tests for `@CurrentUser` decorator
- Created E2E tests for TenantController demonstrating AC3 and AC4

### File List

**Backend:**
- `backend/src/app.module.ts` (modified - imported KeycloakModule)
- `backend/src/shared/keycloak/keycloak.module.ts` (modified)
- `backend/src/auth/decorators/current-user.decorator.ts` (new)
- `backend/src/auth/decorators/current-user.decorator.spec.ts` (new)
- `backend/src/auth/decorators/roles.decorator.ts` (new)
- `backend/src/auth/decorators/roles.decorator.spec.ts` (new)
- `backend/src/auth/decorators/public.decorator.ts` (new)
- `backend/src/auth/decorators/index.ts` (new)
- `backend/src/auth/auth.module.ts` (new)
- `backend/src/auth/index.ts` (new)
- `backend/src/tenant/tenant.controller.ts` (modified - added guards and roles)
- `backend/src/tenant/tenant.controller.spec.ts` (new)
- `backend/package.json` (modified)
- `backend/.env.example` (new)

**Frontend:**
- `frontend/src/app/auth/signin/page.tsx` (new)
- `frontend/src/app/api/auth/[...nextauth]/route.ts` (new)
- `frontend/src/types/next-auth.d.ts` (new)
- `frontend/src/lib/auth.ts` (new)
- `frontend/package.json` (modified)
- `frontend/.env.example` (new)

**Scripts:**
- `scripts/setup-keycloak.ts` (new)
