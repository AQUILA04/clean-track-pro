# Story 3.3: Express Mode Configuration

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **Admin_Tenant**,
I want to **configure the surcharge and SLA reduction for "Express" orders**,
so that **urgent orders are priced and tracked correctly according to business rules**.

## Acceptance Criteria

1.  **Configure Express Parameters**:
    *   **Given** I am on the Tenant Configuration page (`/settings/configuration`).
    *   **When** I set the **Express Multiplier** (e.g., 1.5 for +50% price).
    *   **And** I set the **Express SLA Target** (e.g., 24 hours).
    *   **Then** The system saves these parameters for my tenant.
    *   **And** The system validates that Multiplier >= 1.0 and SLA > 0.

2.  **Persistence & Isolation**:
    *   **Given** I have saved the settings.
    *   **When** I reload the page.
    *   **Then** The saved values are displayed.
    *   **And** Other tenants cannot see or modify my settings (RLS).

3.  **Default Values (Migration/Init)**:
    *   **Given** A new tenant or existing tenant without configuration.
    *   **Then** Default values should apply (e.g., Multiplier = 1.0 (no surcharge) or 1.5, SLA = 24h).
    *   **Note**: Ideally explicit defaults in DB or code.

## Tasks / Subtasks

- [ ] **Backend: Tenant Configuration Entities** (AC: 1, 2)
    - [ ] **Entity Update (`Tenant`)**:
        - Add column `express_multiplier` (Decimal/Numeric, precision 10,2, default 1.5).
        - Add column `express_sla_hours` (Int, default 24).
        - **Critical**: Ensure `default` values are set in `@Column` decorator to prevent issues with existing records.
    - [ ] **DTO Creation**: Create `UpdateTenantConfigDto` (separate from Branding DTO) to validate:
        - `express_multiplier`: Min 1.0.
        - `express_sla_hours`: Min 1.
    - [ ] **Migrations**: Generate migration to alter `tenants` table.
    - [ ] **Controller**: Implement `PATCH /tenants/me/config` (or extend `me` logic) to handle configuration updates securely.

- [ ] **Frontend: Settings UI** (AC: 1, 2)
    - [ ] **Page Creation**: Create `src/app/settings/configuration/page.tsx` (since `settings/page.tsx` likely doesn't exist or is a redirect).
    - [ ] **Navigation**: Update `src/app/settings/layout.tsx` (or Main Layout) to include a link/tab for "Configuration".
    - [ ] **Form Implementation**:
        - Use `react-hook-form` + `zod`.
        - Inputs: Number field for Multiplier (step 0.01), Number field for SLA (hours).
    - [ ] **API Integration**: Connect to `tenant.service.ts` using the new/updated endpoint.

## Dev Notes

### Architecture Patterns
- **Entity Location**: `backend/src/tenant/entities/tenant.entity.ts`.
- **Numeric Handling**: `express_multiplier` should be handled as `number` in TS (transformed from string/numeric in DB).
- **Validation**: Strict validation in DTO.
- **DTO Separation**: Use `UpdateTenantConfigDto` to keep concern separate from branding (logo/name).

### Project Structure Notes
- **Frontend Path**: `frontend/src/app/settings/configuration`. This ensures proper routing hierarchy.
- **Backend Module**: `backend/src/tenant`.

### References
- [Story 1.1: Superadmin Tenant Onboarding](docs/implementation-artifacts/1-1-superadmin-tenant-onboarding.md) (Tenant Entity origin)
- [Architecture: Core Tables](docs/planning-artifacts/architecture.md)

## Dev Agent Record

### Agent Model Used
Antigravity (Google DeepMind)

### Debug Log References

### Completion Notes List
- 2026-01-28: Implemented Express Mode Configuration.
  - Backend: Added `express_multiplier` and `express_sla_hours` to Tenant entity, updated DTO, Service, and Controller. Added Migration.
  - Frontend: Added Configuration page and Settings layout. Updated TenantService.
- 2026-01-28: Addressed Code Review Findings.
  - Populated File List.
  - Note: Frontend unit tests skipped as frontend project lacks test infrastructure (Jest/RTL). Validation performed via Build.

### File List
backend/src/tenant/entities/tenant.entity.ts
backend/src/tenant/tenant.controller.ts
backend/src/tenant/tenant.service.ts
backend/src/tenant/dto/update-tenant-config.dto.ts
backend/src/migrations/1769544149390-AddExpressConfig.ts
backend/src/tenant/tenant.controller.spec.ts
backend/src/tenant/tenant.service.spec.ts
frontend/src/app/settings/configuration/page.tsx
frontend/src/app/settings/layout.tsx
frontend/src/services/tenant.service.ts

