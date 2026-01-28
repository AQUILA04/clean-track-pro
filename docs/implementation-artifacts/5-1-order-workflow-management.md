# Story 5.1: Order Workflow Management

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an User_Site,
I want to scan an item or order to update its status (e.g., from CREATED to IN_PROGRESS to READY),
so that the customer knows the progress.

## Acceptance Criteria

1. **Given** An order or item QR code
   **When** I scan it using the workflow scanner (Article ID or Order ID)
   **Then** The system expects a keyboard-emulated input ending with 'Enter'
   **And** Auto-fetches the current order details without manual submission

2. **When** selecting a new status
   **Then** I can choose from valid next states based on the defined lifecycle: `CREATED`, `IN_PROGRESS`, `READY`, `STORED`, `DELIVERED`, `CANCELLED`
   **And** The system validates the transition logic (State Machine)

3. **When** confirming the update
   **Then** The request is sent to `PATCH /orders/:id/status`
   **And** The endpoint enforces `@Roles('User_Site')` security
   **And** The update query MUST scope by `tenant_id` (RLS) to prevent cross-tenant modification
   **And** The Status change is persisted with a timestamp

## Tasks / Subtasks

- [x] Backyard: Implement Order Status State Machine
  - [x] Define `OrderStatus` enum in backend: `CREATED`, `IN_PROGRESS`, `READY`, `STORED`, `DELIVERED`, `CANCELLED`
  - [x] Implement validation logic for allowed status transitions (Guard or Service method) in `OrdersService`.
  - [x] Add `PATCH /orders/:id/status` endpoint in `OrdersController` protected by `@Roles(Role.USER_SITE)`.
  - [x] Ensure `update` operation uses `tenant_id` from user context.
- [x] Frontend: Create Workflow Scanner Page
  - [x] Create `/workflow` route/page.
  - [x] Implement "Scan Mode" input: auto-focus, hidden/obscured, listens for 'Enter' key event to trigger fetch.
  - [x] Reuse existing `OrdersService` logic for fetching order details.
- [x] Frontend: Status Update UI
  - [x] Display current order status and details (reuse Order Components where possible).
  - [x] Show available "Next Actions" buttons based on current status (e.g. if CREATED, show "Start Processing").
  - [x] Handle successful update with visual feedback (Toast) and reset for next scan.

## Dev Notes

### Architecture Patterns
- **State Management**: Use a TypeScript `Map` or strict Object definition to enforce transition rules (e.g., `ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]>`).
- **Security**: The `PATCH` endpoint is critical. Ensure `auth.guard` and `@Roles` are correctly applied. RLS is mandatory—never use `update` without `where: { tenantId }`.
- **Scanning UX**: Physical scanners emulate typing.
  - Use an invisible or off-screen input that keeps focus (handle `onBlur` to refocus).
  - Detect the 'Enter' key (code 13) as the signal that scanning is complete.
  - Debounce input if necessary to prevent partial reads.
- **Code Reuse**: Reuse `OrdersService` from Epic 4. Do not create a new service unless absolutely necessary.

### Source Tree
- Backend: `src/modules/orders/` (OrdersService, OrdersController, Dto, Enum)
- Frontend: `src/app/(dashboard)/workflow/page.tsx`
- Frontend: `src/services/orders.service.ts` (Update if needed)

### Testing
- Unit test the `OrderStatus` transition logic (ensure invalid transitions throw `BadRequestException`).
- Integration test the `PATCH` endpoint with Tenant isolation checks.
- E2E test the scan-to-update flow.

## Dev Agent Record

### Agent Model Used
- {{agent_model_name_version}}

### File List
- `backend/src/orders/orders.controller.ts`
- `backend/src/orders/orders.service.ts`
- `backend/src/orders/dto/update-order-status.dto.ts`
- `backend/src/orders/enums/order-status.enum.ts`
- `frontend/src/app/(dashboard)/workflow/page.tsx`
- `frontend/src/services/orders.service.ts`
