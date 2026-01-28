# Story 4.3: Order Validation & Persistence

Status: done

## Story

As a **User_Site** (Reception Operator),
I want to **validate and save the current order**,
so that **it enters the workflow and is permanently recorded in the financial records**.

## Acceptance Criteria

### AC1: Validation Prerequisites
- **Given** I am on the Fast-Scan interface
- **When** I attempt to validate an order
- **Then** The system prevents validation if:
  - No Client is selected (Story 2.2)
  - The Order Draft is empty (0 items)
- **And** The "Validate" button is disabled or shows an error in these states

### AC2: Backend Persistence
- **Given** A valid order draft with:
  - Selected Client (UUID)
  - List of Items (Article, Service Type, Quantity)
  - Express Mode state (ON/OFF)
- **When** I click "Validate & Pay"
- **Then** The Frontend sends a payload to `POST /orders`
- **And** The Backend **re-calculates** the Total Price and Due Date using server-side configuration
- **And** The Backend saves the `Order` entity with status `CREATED`
- **And** The Backend saves all `OrderItems` linked to the Order
- **And** All records are tagged with the correct `tenant_id` (RLS)

### AC3: Success Feedback & Reset
- **Given** The backend responds with HTTP 201 (Created)
- **When** The response is received
- **Then** A success notification (Toast) appears: "Order [Order-ID] Created"
- **And** The Order Draft is reset (Client cleared, Items cleared, Express set to default)
- **And** The interface is ready for the next customer immediately

### AC4: Error Handling
- **Given** A technical failure (Database down, Network error)
- **When** The validation request fails
- **Then** An error message is displayed: "Failed to create order. Please try again."
- **And** The draft data is NOT lost (user can retry)

## Dev Notes

### Architecture & Components

- **API Layer (`OrdersController`)**:
  - Endpoint: `POST /orders`
  - **DTO (`CreateOrderDto`)**:
    - `clientId` (UUID): Required.
    - `isExpress` (Boolean): Required. Backend uses this to derive `service_level`, `due_date`, `total_price` via Tenant Config.
    - `items` (Array<`CreateOrderItemDto`>):
      - `articleTypeId` (UUID): Required.
      - `serviceType` (Enum): Required.
      - `quantity` (Int): Min 1.
  - **Security**: Mandatory `@GetUser()` for `tenant_id`/`site_id`. Strict RLS context propagation.

- **Service Layer (`OrdersService`)**:
  - **Transaction**: MANDATORY `EntityManager.transaction` to ensure atomic save of Order + Items.
  - **Pricing Authority**:
    - MUST use authoritative `PricingService` (backend) to calculate final totals and dates.
    - DO NOT trust frontend prices in payload.
    - **Logic**: Fetch `TenantConfig` + `ArticlePrices` -> Compute -> Persist.

- **Frontend State (`OrderDraftContext`)**:
  - Implement `validateOrder()`:
    - Set `isSubmitting = true`.
    - `POST /orders`.
    - On 201: `clearDraft()`, Show Success Toast.
    - On Error: Show Toast, maintain Draft state.

### Testing Standards

- **Backend (`orders.service.spec.ts`)**:
  - **Test Case 1**: "Create Standard Order" - Verify total price, due date (Standard SLA), and DB persistence.
  - **Test Case 2**: "Create Express Order" - Verify 1.5x Multiplier, Express SLA, and `service_level='EXPRESS'`.
  - **Test Case 3**: "Mixed Items" - Verify correct summation of multiple items.
  - **Test Case 4**: "Transaction Rollback" - Simulate `OrderItem` save fail -> Ensure `Order` not created.

- **Frontend Components**:
  - Mock `OrdersService.create`.
  - Verify "Validate" button disabled if Draft Empty or No Client.

## References
- [Architecture.md](file:///c:/Users/kahonsu/Documents/GitHub/clean-track-pro/docs/planning-artifacts/architecture.md#2-modèle-de-données-core-tables): Schema for `orders` and `order_items`.
- [Pricing Utils](file:///c:/Users/kahonsu/Documents/GitHub/clean-track-pro/frontend/src/utils/pricing.utils.ts): Shared logic for price/date calculation.

## Tasks/Subtasks

- [x] **Backend Implementation**
  - [x] Implement `CreateOrderDto` in `backend/src/orders/dto/create-order.dto.ts`
  - [x] Implement `OrdersService.create()` with Transaction & Pricing Logic in `backend/src/orders/orders.service.ts`
  - [x] Integrate `PricingService` for centralized calculation
  - [x] Update `OrdersController.create()` in `backend/src/orders/orders.controller.ts`

- [x] **Frontend Implementation**
  - [x] Create `OrdersService` for API calls
  - [x] Implement `validateOrder` in `frontend/src/context/order-draft.context.tsx`
  - [x] Implement basic feedback (Alerts)

- [x] **Verification**
  - [x] Automated Tests: `orders.service.spec.ts` updated and passing

## Dev Agent Record

### Agent Model Used
- **Agent**: sm (Scrum Master)
- **Workflow**: validate-create-story

### File List
- `backend/src/orders/orders.controller.ts`
- `backend/src/orders/orders.service.ts`
- `backend/src/orders/dto/create-order.dto.ts`
- `backend/src/orders/entities/order-item.entity.ts`
- `backend/src/orders/entities/order.entity.ts`
- `backend/src/orders/orders.service.spec.ts`
- `backend/src/orders/orders.module.ts`
- `backend/src/catalog/services/pricing.service.ts`
- `frontend/src/context/order-draft.context.tsx`
- `frontend/src/services/orders.service.ts`
- `frontend/src/types/create-order.dto.ts`

### Completion Notes
- Implemented strict pricing authority on backend: `OrdersService` recalculates all prices via `PricingService`.
- Backend uses `EntityManager.transaction` to ensure Order and OrderItems are saved atomically.
- Frontend lacks a toast library, so `alert()` was used as a fallback for user feedback. Recommend adding a dedicated toast library (e.g. `sonner`) in future refactors.
- All backend unit tests passed covering pricing logic, transaction context, and validation errors.
