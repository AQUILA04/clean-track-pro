# Story 5.3: SLA Alerting (Delayed Orders)

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **User_Site**,
I want to **visually identify orders that are approaching or past their due date**,
so that **we can prioritize them**.

## Acceptance Criteria

1. **Given** The Active Orders List
   **When** An order is within 4 hours of its `due_date`
   **Then** High-level visual indicator (e.g., row background or date badge) turns **Yellow**.

2. **Given** The Active Orders List
   **When** An order is past its `due_date`
   **Then** High-level visual indicator turns **Red**.
   **And** Needs strict emphasis (e.g., bold text or warning icon).

3. **Given** The Backend API
   **When** I request the list of orders
   **Then** I can filter by Status (to show only "Active" orders: CREATED, IN_PROGRESS, READY).
   **And** The results are sorted by `due_date` ASC (most urgent first).

## Tasks / Subtasks

- [ ] **Backend: Order Filtering API**
  - [ ] **DTOs**: Create `OrderSummaryDto` (id, client_name, items_summary, due_date, status, total_price) to avoid over-fetching.
  - [ ] Update `OrdersService`: Add `findAll(tenantId, siteId, type, page, limit)`.
  - [ ] Implement query logic:
    - Conditions: `tenant_id` AND `site_id` (if applicable) AND status IN [CREATED, IN_PROGRESS, READY].
    - Sort: `due_date` ASC.
    - Pagination: Apply `skip`/`take`.
  - [ ] Update `OrdersController`: `GET /orders?type=active&page=1&limit=50`.

- [ ] **Frontend: Active Orders Page**
  - [ ] [NEW] Create `frontend/src/app/dashboard/orders/active/page.tsx`.
  - [ ] [NEW] Create `frontend/src/components/orders/OrderTable.tsx` (Reusable component).
    - Props: `orders: OrderSummary[]`, `loading: boolean`, `pagination: PaginationProps`.
  - [ ] Implement columns: ID, Client, Items (summary), **Due Date**, Status, Total.
  - [ ] **Icons**: Use `lucide-react` for status/alert icons (e.g., `AlertTriangle`, `Clock`).

- [ ] **Frontend: SLA Visual Logic**
  - [ ] Implement `getSLAStatus(dueDate)` utility:
    - Returns `'danger'` if `now > dueDate`.
    - Returns `'warning'` if `now + 4h > dueDate`.
    - Returns `'normal'` otherwise.
  - [ ] Apply conditional styling to `OrderTable` rows/badges based on SLA status.
    - Danger: `bg-red-50` / `text-red-700` / Red Badge / `AlertTriangle` icon.
    - Warning: `bg-yellow-50` / `text-yellow-700` / Yellow Badge / `Clock` icon.

- [ ] **Database Optimization**
  - [ ] Ensure composite index exists on `orders(tenant_id, status, due_date)` for query performance.

## Dev Notes

### Architecture Patterns
- **Pagination**: Standardize on `page`/`limit` query params. Default limit 50.
- **DTOs**: Use `class-transformer` `Exclude()` on the Entity or specific `Select` in TypeORM to ensure only `OrderSummaryDto` fields are fetched.
- **Components**: `OrderTable` should be generic enough to be used for History later.
- **Timezones**: Compare `now` to `due_date` carefully. `due_date` is UTC timestamp.

### Source Tree
- Backend: `src/orders/dto/order-summary.dto.ts` **[NEW]**
- Backend: `src/orders/orders.controller.ts`
- Backend: `src/orders/orders.service.ts`
- Frontend: `src/app/dashboard/orders/active/page.tsx` **[NEW]**
- Frontend: `src/components/orders/OrderTable.tsx` **[NEW]**
- Frontend: `src/utils/sla.utils.ts` **[NEW]**

### Testing
- **Unit**: Test `getSLAStatus` with fake dates.
- **Integration**: Verify `GET /orders` pagination works (e.g., page 2 returns different items).

## Dev Agent Record

### Agent Model Used
- {{agent_model_name_version}}

### File List
- `backend/src/orders/orders.service.ts`
- `backend/src/orders/orders.controller.ts`
- `frontend/src/app/dashboard/orders/active/page.tsx`
- `frontend/src/components/orders/ActiveOrderList.tsx`
- `frontend/src/utils/sla.utils.ts`
