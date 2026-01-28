# Story 4.2: Express Mode Toggling & Calculation

Status: done

## Story

As a **User_Site** (Reception Operator),
I want to **toggle "Express" mode for the current order draft**,
so that **the Price and Due Date update instantly based on the tenant's configuration**.

## Acceptance Criteria

### AC1: Express Toggle UI
- **Given** I am on the Fast-Scan Order Interface (Order Draft view)
- **When** I look at the order summary or header
- **Then** I see a prominent "Express Mode" toggle switch
- **And** It defaults to `OFF` (Normal mode) for new orders

### AC2: Price Recalculation
- **Given** An active Order Draft with items (e.g., Total: 10€)
- **And** The Tenant's `express_multiplier` is set to `1.5`
- **When** I toggle Express Mode to `ON`
- **Then** The Order Total updates instantly to 15€ (10 * 1.5)
- **And** A visual indicator shows that the Express Surcharge is applied
- **When** I toggle it back to `OFF`
- **Then** The price reverts to 10€

### AC3: Due Date Recalculation
- **Given** The Tenant's `express_sla_hours` is set to `24`
- **When** I toggle Express Mode to `ON`
- **Then** The Order's `due_date` is updated to `NOW + 24 hours` (rounded to next open hour if necessary, or just simple addition for MVP)
- **When** I toggle it back to `OFF`
- **Then** The `due_date` reverts to the standard calculation (e.g., +48h or specific logic)

### AC4: Persistence
- **Given** I have validated an order with Express Mode `ON`
- **When** The order is saved to the database
- **Then** The `orders.service_level` column is stored as `'EXPRESS'`
- **And** The `orders.total_price` includes the surcharge
- **And** The `orders.due_date` reflects the expedited timeline

## Dev Notes

### Architecture & Components
- **Frontend State**:
  - Update `OrderDraftContext` to include `isExpress` state.
  - **Refactor**: Extract pricing logic into a pure utility function `calculateOrderTotal(items, isExpress, config)` in `src/utils/pricing.utils.ts`. The Context/Hook should delegate to this utility to ensure testability.
  - **Robustness**: Ensure graceful handling of missing configuration. If `tenantConfig.express_multiplier` is undefined, default to `1.0`. If `express_sla_hours` is missing, fallback to standard SLA calculation.
- **Backend Data**:
  - The `orders` table already has `service_level` and `due_date`.
  - Ensure the backend validation accepts the calculated price (or recalculates it to be safe - **Decision**: Client sends `service_level`, Backend SHOULD recalculate final price to prevent tampering, but for MVP strict checks might be loose. Ideally, Client sends `items` + `service_level`, Backend computes Total). *Correction*: AC says frontend updates instantly. Backend must trust or verify. Best practice: Backend uses `TenantConfig` to re-calculate total on `POST /orders`.
- **Configuration Source**:
  - Frontend needs access to `Tenant` config. Ensure `AuthContext` or a `TenantProvider` exposes `express_multiplier` and `express_sla_hours` (added in Story 3.3).

### Technical Requirements
- **Library**: Use standard React state/context. No new libs needed.
- **UI/UX**: The toggle should use the Semantic Color for Express (Orange/Red) as defined in NFR4.
- **Date Math**: Use `date-fns` for robust date addition.

### Verification Guide
- **Manual**:
  1. Login as User_Site.
  2. Create order with 1 item (10€).
  3. Toggle Express -> Verify Price = 15€ (if 1.5x).
  4. Save Order.
  5. Check DB `orders` table: `service_level`='EXPRESS', price correct.
- **Automated**:
  - Unit test `src/utils/pricing.utils.ts` -> `calculateOrderTotal(items, isExpress, multiplier)`.
  - Integration test for `OrderDraftContext`.

## Dependencies
- **Story 3.3**: Express Mode Configuration (Must be deployed so `express_multiplier` exists on Tenant).
- **Story 4.1**: Fast-Scan Interface (Must be ready to add the toggle to).

## References
- [Architecture.md](file:///c:/Users/kahonsu/Documents/GitHub/clean-track-pro/docs/planning-artifacts/architecture.md): See `orders` table schema.
- [PRD.md](file:///c:/Users/kahonsu/Documents/GitHub/clean-track-pro/docs/planning-artifacts/prd.md): Section 4 (Gestion des Services & Prix).

## Dev Agent Record
- **Agent**: sm (Scrum Master)
- **Date**: 2026-01-28
- **File List**:
  - `frontend/src/utils/pricing.utils.ts`
  - `frontend/src/context/order-draft.context.tsx`
  - `frontend/src/components/orders/OrderDraftSummary.tsx`
  - `backend/src/orders/orders.module.ts`
  - `backend/src/orders/orders.controller.ts`
  - `backend/src/orders/orders.service.ts`
  - `backend/src/orders/entities/order.entity.ts`
  - `backend/src/orders/dto/create-order.dto.ts`
  - `backend/src/tenant/tenant.controller.ts`
  - `backend/src/tenant/tenant.service.ts`
