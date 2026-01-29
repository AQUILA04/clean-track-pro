# Story 7.1: Security Hardening & Agency Management Fixes

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Security Engineer**,
I want to **close known security vulnerabilities in the User Management flow**,
so that **tenant data isolation is strictly enforced and authentication is secure**.

## Acceptance Criteria

1.  **Site Verification Fix (Critical)**
    *   **Given** An Admin_Tenant sends a request to "Add User" (Invite) endpoint
    *   **When** `UserService.inviteUser` is executed
    *   **Then** The system MUST verify that the requested `siteId` belongs to the current `tenantId` context.
    *   **And** If the site belongs to a different tenant, it MUST throw `ForbiddenException` (HTTP 403).

2.  **Keycloak Realm Dynamic Resolution**
    *   **Given** The `UserService` interacts with Keycloak Admin API
    *   **When** Creating or finding a user
    *   **Then** It MUST use the `realm` associated with the current Tenant (e.g. from `ClsService` or `UserContext`), NOT hardcoded `master` or environment default.

3.  **UX Improvement - Site Dropdown**
    *   **Given** The "Invite User" Modal in the frontend
    *   **When** The user needs to assign a Site
    *   **Then** Display a **Dropdown** of available Sites (fetched from `GET /sites` filtered by current tenant).
    *   **And** The raw Text Input for Site ID is removed to prevent errors.

## Tasks / Subtasks

- [x] **Backend: Security Fixes**
  - [x] **Refactor:** Update `UserService.inviteUser` to perform `siteRepository.findOne({ where: { id: siteId, tenantId } })` check.
  - [x] **Refactor:** Replace hardcoded `realm` string in Keycloak calls with dynamic lookup (inject `ClsService` or similar).

- [x] **Frontend: UX Improvements**
  - [x] **Component:** Update `InviteUserModal` to fetch sites via `SitesService`.
  - [x] **UI:** Replace `<input>` with `<Select>` (or similar dropdown component) for Site selection.
  - [x] **Integration:** Ensure the selected Site ID is correctly passed to the API.

## Dev Notes

-   **Architecture Compliance:**
    -   **Security:** This story effectively effectively closes the hole identified in Story 1.3. Strict RLS and Tenant Context must be respected.
    -   **Services:** `UserService` is the primary backend target.
    -   **Testing:** Add a specific test case in `user.service.spec.ts` trying to invite a user to a Site ID that belongs to another tenant -> Expect 403.

-   **Previous Learnings:**
    -   Story 1.3 had a `// Security: In a real app...` comment. This MUST be removed and replaced with actual logic.
    -   Story 1.4 established the `ClsService` pattern for tenant context. Use it!

### Project Structure Notes

-   **Backend:** `backend/src/user/user.service.ts`
-   **Frontend:** `frontend/src/components/admin/InviteUserModal.tsx` (or similar path based on Story 1.3).

### References

-   Story 1.3: Admin Tenant Agency Management [Source: docs/implementation-artifacts/1-3-admin-tenant-agency-management.md]
-   Code Review Findings: [Source: docs/implementation-artifacts/code-review-findings-final.md]

## Dev Agent Record

### Agent Model Used

Claude 3.5 Sonnet (Implementation) + Claude 4.5 Sonnet (Code Review)

### Debug Log References

N/A - No debugging required. Implementation was straightforward.

### Completion Notes List

**Backend Security Fixes:**
- ✅ Implemented tenant isolation check in `UserService.inviteUser` using `SiteService.validate()`
- ✅ Replaced hardcoded realm with dynamic lookup via `TenantService.findOne()` in both `inviteUser` and `getUsers`
- ✅ Added comprehensive test coverage including cross-tenant security test

**Frontend UX Improvements:**
- ✅ Created new reusable `InviteUserModal` component with proper error handling
- ✅ Implemented site dropdown using `SiteService.getAll()` (tenant-filtered)
- ✅ Refactored `AgencySettingsPage` to use the new modal component

**Testing:**
- ✅ All 4 tests passing in `user.service.spec.ts`
- ✅ Security test validates ForbiddenException for cross-tenant invite attempts
- ✅ Dynamic realm test validates tenant-specific Keycloak realm usage

### File List

**Backend:**
- `backend/src/user/user.service.ts` - Added dynamic realm resolution and site validation
- `backend/src/user/user.service.spec.ts` - Added security and realm tests, fixed mock setup

**Frontend:**
- `frontend/src/components/admin/InviteUserModal.tsx` - NEW: Reusable modal component with site dropdown
- `frontend/src/app/settings/agency/page.tsx` - Refactored to use new modal component
