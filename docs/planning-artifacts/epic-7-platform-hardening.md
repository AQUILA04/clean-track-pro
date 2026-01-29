# Epic 7: Platform Hardening & Quality Assurance

**Goal:** Address critical technical debt, security gaps, and functional omissions identified during the Grand Retrospective of Epics 1-6. This "Hardening Sprint" ensures the platform is secure, stable, and functionally complete before further feature development.

## Stories

### Story 7.1: Security Hardening & Agency Management Fixes
**Rework of Story 1.3 findings**

As a **Security Engineer**,
I want to **close known security vulnerabilities in the User Management flow**,
so that **tenant data isolation is strictly enforced and authentication is secure**.

**Acceptance Criteria:**
1. **Site Verification Fix (Critical)**
   - **Given** An Admin_Tenant checks the "Add User" endpoint
   - **When** `UserService.inviteUser` is called
   - **Then** The system MUST verify that the requested `siteId` belongs to the current `tenantId`.
   - **And** Throw `ForbiddenException` if there is a mismatch.

2. **Keycloak Realm Dynamic Resolution**
   - **Given** The `UserService`
   - **When** It interacts with Keycloak Admin API
   - **Then** It MUST use the Realm ID from the current Tenant's configuration (or JWT context), NOT hardcoded `master`.

3. **UX Improvement**
   - **Given** The Invite User Modal
   - **When** Selecting a Site
   - **Then** Display a **Dropdown** of available Sites (fetched from `GET /sites`), replacing the raw Text Input.

### Story 7.2: Dashboard KPI Date Filtering
**Completion of Story 5.2 findings**

As an **Admin_Site**,
I want to **filter my dashboard KPIs by date range**,
so that **I can analyze performance over specific periods (e.g., Last 7 Days, This Month)**.

**Acceptance Criteria:**
1. **Backend Filtering**
   - **Given** `GET /orders/stats`
   - **When** Query params `startDate` and `endDate` are provided
   - **Then** The returned stats (Orders, Revenue) reflect ONLY that period.
   - **And** Defaults to "Today" if no params provided.

2. **Frontend UI**
   - **Given** The Dashboard Page
   - **When** I view the KPI cards
   - **Then** I see a "Date Range" picker or dropdown (Today, 7 Days, 30 Days).
   - **And** Changing it updates all KPI cards.

3. **Timezone Correctness**
   - **Given** A user in a specific timezone
   - **When** Requesting "Today"
   - **Then** The backed respects the client's timezone for start/end of day.

### Story 7.3: Test Infrastructure Recovery
**Fix of Story 6.1 and General Test Health**

As a **Developer**,
I want to **ensure all tests pass and run correctly**,
so that **we have a reliable CI baseline**.

**Acceptance Criteria:**
1. **Fix Broken Frontend Tests (Story 6.1)**
   - **Given** `StorageSlotList.test.tsx`
   - **When** Running `npm test`
   - **Then** It passes without "Module not found" errors (Fix relative imports).

2. **Test Suite Green Run**
   - **Given** The entire test suite
   - **When** Ran via `npm run test:all` (or equivalent)
   - **Then** All unit and integration tests pass.

3. **Environment Config**
   - **Given** The test environment
   - **When** Starting tests
   - **Then** `jest-dom` and other test dependencies are correctly loaded.
