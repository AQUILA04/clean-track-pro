# Story 5.2: Dashboard KPI Visualization

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **Admin_Site**,
I want to **see real-time KPIs (Orders Received, Ready, Delivered) on my dashboard**,
so that **I can monitor daily performance**.

## Acceptance Criteria

1. **Given** The Admin Dashboard
   **When** I load the page
   **Then** I see counters for:
   - **Orders Today**: Count of orders starting today (`00:00` to `now`).
   - **Revenue Today**: Sum of `total_price` for orders created today.
   - **Pending Orders**: Count of orders in `CREATED`, `IN_PROGRESS`, or `READY` status.

2. **Given** The Dashboard Date Filter
   **When** I change the date range (e.g. "Last 7 days")
   **Then** The counters update to reflect the selected period.

3. **Given** The Multi-tenant Environment (RLS)
   **When** The backend queries are executed
   **Then** Data is strictly filtered by the User's `tenant_id`.
   **And** If generic `Admin_Tenant`, potentially aggregates all sites (or filters by specific site if selected).

## Tasks / Subtasks

- [ ] **Backend: KPI Endpoint Implementation**
  - [ ] extend `OrdersService` with `getDashboardStats(tenantId, siteId?, dateRange?)`.
  - [ ] Implement aggregation queries:
    - `count({ created_at: Today })`
    - `sum(total_price, { created_at: Today })`
    - `count({ status: In [CREATED, IN_PROGRESS, READY] })`
  - [ ] Create `GET /orders/stats/dashboard` endpoint in `OrdersController`.
  - [ ] Ensure `tenant_id` scope is applied.

- [ ] **Frontend: Dashboard Foundation (New)**
  - [ ] [NEW] Create `frontend/src/app/(dashboard)/layout.tsx` with a **Sidebar Navigation**.
    - Links: Dashboard (Home), Orders (POS), History/Workflow, Settings.
  - [ ] [NEW] Create `frontend/src/app/(dashboard)/page.tsx` (Main Dashboard).
  - [ ] [NEW] Create `KPICard` component (Label, Value, Icon, Trend).

- [ ] **Frontend: Integration**
  - [ ] Implement `useDashboardStats` hook (using `OrdersService` frontend).
  - [ ] Connect Dashboard UI to `GET /orders/stats/dashboard` endpoint.
  - [ ] Ensure loading states and error handling.

## Dev Notes

### ⚠️ Reality Check (Phantom Code)
- **IGNORE** any user notes claiming "Infos et KPIs dynamiques : FAIT".
- **Validation Finding**: The dashboard page `frontend/src/app/(dashboard)/page.tsx` **DOES NOT EXIST**. You must build it from scratch.
- **Navigation**: Currently, there is no way to navigate between pages. You MUST implement a `Sidebar` or `NavBar` in the new `layout.tsx`.

### Architecture Patterns
- **Aggregation Strategy**: For now, direct SQL `COUNT`/`SUM` on the `orders` table is acceptable (low volume).
- **Date Handling**: Be careful with Timezones. "Today" means "Tenant's Local Time Today". Backend usually stores UTC.
- **Service Reuse**: Reuse `OrdersService` in backend.

### Source Tree
- Backend: `src/orders/orders.controller.ts`
- Backend: `src/orders/orders.service.ts`
- Frontend: `src/app/(dashboard)/layout.tsx` **[NEW]**
- Frontend: `src/app/(dashboard)/page.tsx` **[NEW]**
- Frontend: `src/components/dashboard/KPICard.tsx` **[NEW]**
- Frontend: `src/services/orders.service.ts`

### Testing
- **Unit**: Mock repository and test `getDashboardStats` calculations.
- **Integration**: Call API with different Roles (Admin_Site vs Admin_Tenant) and ensure RLS isolation.

## Dev Agent Record

### Agent Model Used
- {{agent_model_name_version}}

### File List
- `backend/src/orders/orders.controller.ts`
- `backend/src/orders/orders.service.ts`
- `frontend/src/app/(dashboard)/layout.tsx`
- `frontend/src/app/(dashboard)/page.tsx`
- `frontend/src/components/dashboard/KPICard.tsx`
- `frontend/src/services/orders.service.ts`
