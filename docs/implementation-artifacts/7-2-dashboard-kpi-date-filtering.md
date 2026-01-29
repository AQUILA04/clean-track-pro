# Story 7.2: Dashboard KPI Date Filtering

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **Admin_Site**,
I want to **filter my dashboard KPIs by date range**,
so that **I can analyze performance over specific periods (e.g., Last 7 Days, This Month)**.

## Acceptance Criteria

1. **Backend Filtering**
   - **Given** `GET /orders/stats/dashboard`
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
   - **Then** The backend respects the client's timezone for start/end of day.

## Tasks / Subtasks

- [x] **Verification: Backend Date Filtering** (AC: #1)
  - [x] Verify `OrdersController.getDashboardStats` accepts `startDate` and `endDate` query params
  - [x] Verify `OrdersService.getDashboardStats` correctly filters orders by date range
  - [x] Verify default behavior returns "Today" stats when no params provided
  - [x] Add test case for date range filtering

- [x] **Verification: Frontend Date Picker UI** (AC: #2)
  - [x] Verify Dashboard page displays date range buttons (Today, Last 7 Days, Last 30 Days)
  - [x] Verify clicking a date range button updates the `dateRange` state
  - [x] Verify KPI cards re-fetch data when date range changes
  - [x] Verify active button has visual distinction (blue background)

- [x] **Verification: Timezone Handling** (AC: #3)
  - [x] Verify backend uses `timezone` query parameter
  - [x] Verify `toZonedTime` and `fromZonedTime` are used correctly
  - [x] Verify "Today" calculation respects user's timezone
  - [x] Add test case for timezone-aware date calculations

## Dev Notes

### 🚨 CRITICAL DISCOVERY: Feature Already Implemented

**All acceptance criteria were implemented in Story 5.2.** This story is a **verification and testing task**.

**Existing Implementation**:
- ✅ Backend: `OrdersService.getDashboardStats(tenantId, timezone?, startDate?, endDate?)` with `date-fns-tz` timezone support
- ✅ Frontend: Date range picker (Today/7 Days/30 Days) with state management and auto-refresh
- ✅ Files: `backend/src/orders/orders.service.ts` (lines 140-195), `frontend/src/app/(dashboard)/page.tsx`

**Primary Task**: Write comprehensive tests to verify all acceptance criteria are met.

**Optional Enhancements**:
- Add custom date range picker (calendar widget)
- Add "This Month"/"Last Month" quick filters  
- Improve timezone detection: `const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;`

### Architecture Compliance

- **Stack**: Next.js 14 (App Router), NestJS, PostgreSQL ✅
- **Authentication**: Keycloak with `@CurrentUser()` decorator ✅
- **RLS**: Tenant isolation via `tenant_id` filtering ✅
- **Date Handling**: `date-fns` and `date-fns-tz` libraries ✅
- **TypeScript**: Strict typing with DTOs ✅

### Previous Story Learnings

**From Story 5.2 (Dashboard KPI Visualization)**:
- Dashboard layout created with sidebar navigation
- KPI cards implemented with icons from `lucide-react`
- Date filtering already functional
- Error handling and loading states implemented

**From Story 7.1 (Security Hardening)**:
- Always verify tenant context in backend services
- Use proper NestJS exceptions (`BadRequestException`, `ForbiddenException`)
- Write comprehensive tests for security-critical features
- Frontend should fetch data from tenant-scoped APIs

### Project Structure Notes

**Backend Files**:
- `backend/src/orders/orders.controller.ts` - Controller with `getDashboardStats` endpoint
- `backend/src/orders/orders.service.ts` - Service with date filtering logic
- `backend/src/orders/dto/dashboard-stats.dto.ts` - DTO for stats response:
  ```typescript
  export class DashboardStatsDto {
    ordersToday: number;
    revenueToday: number;
    pendingOrders: number;
  }
  ```

**Frontend Files**:
- `frontend/src/app/(dashboard)/page.tsx` - Main dashboard with date picker
- `frontend/src/components/dashboard/KPICard.tsx` - Reusable KPI card component
- `frontend/src/services/orders.service.ts` - Frontend service:
  ```typescript
  static async getDashboardStats(startDate: string, endDate: string, timezone: string = 'UTC') {
    const params = new URLSearchParams({ startDate, endDate, timezone });
    const response = await fetch(`/api/orders/stats/dashboard?${params}`);
    return response.json();
  }
  ```

### Testing Requirements

**Backend Tests** (`backend/src/orders/orders.service.spec.ts`):
- Test default "Today" behavior without date params
- Test custom date range filtering with startDate/endDate
- Test timezone-aware calculations (different timezones)
- Test RLS enforcement (tenant isolation)

**Frontend Tests** (`frontend/src/app/(dashboard)/page.test.tsx`):
- Test date range button rendering
- Test state updates when date range changes
- Test API calls triggered by date range changes
- Test active button visual distinction

### References

- Story 5.2: Dashboard KPI Visualization [Source: docs/implementation-artifacts/5-2-dashboard-kpi-visualization.md]
- Epic 7: Platform Hardening & Quality Assurance [Source: docs/planning-artifacts/epic-7-platform-hardening.md]
- Architecture: CleanTrack Pro [Source: docs/planning-artifacts/architecture.md]
- Previous Story: 7.1 Security Hardening [Source: docs/implementation-artifacts/7-1-security-hardening-agency-management.md]

### Libraries & Dependencies

**Backend**:
- `date-fns` (v2.x): Date manipulation
- `date-fns-tz` (v2.x): Timezone support
- `typeorm`: Database queries with `Between` operator

**Frontend**:
- `date-fns` (v2.x): Date formatting and manipulation
- `lucide-react`: Icons for UI
- `react` (v18.x): State management with `useState` and `useEffect`

### API Endpoint Details

**GET /orders/stats/dashboard**
- **Auth**: Requires `Admin_Site`, `Admin_Tenant`, or `Super_Admin` role
- **Query Params**:
  - `timezone` (optional, string): IANA timezone (e.g., "America/New_York")
  - `startDate` (optional, string): Start date in YYYY-MM-DD format
  - `endDate` (optional, string): End date in YYYY-MM-DD format
- **Response**:
  ```typescript
  {
    ordersToday: number;
    revenueToday: number;
    pendingOrders: number;
  }
  ```

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- Verified backend implementation of date filtering and timezone handling.
- Added comprehensive unit tests for `OrdersService.getDashboardStats` covering custom date ranges and timezones.
- Implemented frontend test `page.test.tsx` to verify Dashboard UI interactions and API calls.
- Updated `OrdersService` (frontend) and `DashboardPage` to correctly pass the user's timezone to the backend.
- Fixed `jest.config.js` alias resolution for frontend tests.

### Code Review Fixes (Adversarial Review)

**Review Date:** 2026-01-29

**Issues Found:** 8 (3 HIGH, 4 MEDIUM, 1 LOW)
**Issues Fixed:** 7 (All HIGH and MEDIUM issues)

**Critical Bug Fixed:**
- **Issue #4 [HIGH]:** `pendingOrders` query was not filtering by date range, violating AC #1. Added `created_at: Between(startPeriod, endPeriod)` to the query.

**Test Improvements:**
- **Issue #1 [HIGH]:** Strengthened backend test assertions for date range filtering with specific result validation.
- **Issue #2 [HIGH]:** Added error handling tests for invalid date formats.
- **Issue #5 [MEDIUM]:** Added dedicated test to verify `pendingOrders` respects date range.
- **Issue #3 [HIGH]:** Added frontend test to validate timezone is a non-empty string before API call.
- **Issue #6 [MEDIUM]:** Added frontend test for error state display when API call fails.

**UX Improvements:**
- **Issue #7 [MEDIUM]:** Made KPI card labels dynamic to reflect selected date range (e.g., "Orders (Last 7 Days)" instead of always "Orders Today").

**Documentation:**
- **Issue #8 [MEDIUM]:** Documented `jest.config.js` `moduleNameMapper` addition in this section.

**Not Fixed (Low Priority):**
- **Issue #9 [LOW]:** Inconsistent naming (`dateRange` vs actual behavior). Deferred as it doesn't affect functionality.

### File List

- backend/src/orders/orders.service.ts (Bug fix: pendingOrders date filtering)
- backend/src/orders/orders.service.spec.ts (Added 3 new tests, strengthened assertions)
- frontend/src/app/(dashboard)/page.test.tsx (Added 2 new tests)
- frontend/src/services/orders.service.ts
- frontend/src/app/(dashboard)/page.tsx (Dynamic KPI labels)
- frontend/jest.config.js
