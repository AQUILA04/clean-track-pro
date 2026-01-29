# Code Review Report

## Story 1.3: Admin Tenant & Agency Management
**Status**: `review` -> **NEEDS WORK**

### 🔴 Critical Issues
1.  **Security Vulnerability (HIGH)**: `UserService.inviteUser` explicitly skips the AC-required security check: "Verify requested `siteId` belongs to current `tenantId`". The code contains a comment `// Security: In a real app...` admitting this gap.
2.  **AC Violation (HIGH)**: `UserService` hardcodes the Keycloak realm to `master` (or env), explicitly ignoring the AC requirement: "Use the Tenant's Realm (extracted from JWT iss or context)".

### 🟡 Medium Issues
1.  **UX/AC Partial Implementation**: Frontend "Invite User" modal uses a text input for `Site ID` instead of a dropdown as explicitly requested in AC "Fetch available Sites for the dropdown".

### 🟢 Low Issues
1.  **Error Handling**: `TenantController` uses generic `Error` classes (500 Internal Server Error) instead of appropriate NestJS exceptions (400/403).

---

## Story 2.2: Hybrid Client Search (Omnibox)
**Status**: `review` -> **PASSED** (with notes)

### 🟡 Medium Issues
1.  **Documentation Gap**: The story file's "Dev Agent Record -> File List" does not list the migration file responsible for the GIN indexes (`EnablePgTrgmAndGinIndexes...`), though the comments claim it exists and `app.module.ts` runs migrations.

### ✅ Positives
*   Redis caching is correctly implemented.
*   RLS context usage is secure.
*   Search logic correctly implements partial matching for phone numbers.
*   Frontend correctly passes search terms to the creation form.

---

## Story 5.2: Dashboard KPI Visualization
**Status**: `ready-for-dev` -> **INCOMPLETE**

### 🔴 Critical Issues
1.  **Missing Feature (HIGH)**: Acceptance Criteria 2 "Dashboard Date Filter" (e.g., "Last 7 days") is **completely missing**.
    *   **Backend**: `OrdersService.getDashboardStats` does not accept date range parameters. It hardcodes the query to "Today".
    *   **Frontend**: No UI exists for selecting a date range, and the service call does not confirm it.

### 🟡 Medium Issues
1.  **Status Discrepancy**: Story status is `ready-for-dev`, but substantial code (Controller, Service, Page, Layout) exists. The status should be updated to `in-progress` or `review`.

### 🟢 Low Issues
1.  **Timezone Handling**: Frontend `OrdersService.getDashboardStats` does not pass the user's browser timezone to the backend, which usually defaults to valid handling but explicit passing is safer for "Today" calculations.
