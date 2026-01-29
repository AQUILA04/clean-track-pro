# Story 6.2: Order Storage Assignment

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->


## Story

As an User_Site,
I want to scan a READY order and assign it to a specific Shelf Slot,
so that we know exactly where to find it for retrieval.

## Acceptance Criteria

1.  **Scan & Link Workflow**
    *   **Given** An Order in `READY` status and a physical slot (e.g., "A-01") in `FREE` status
    *   **When** I scan the Order Ticket followed by the Slot Label (or enter manually)
    *   **Then** The Order is linked to that Slot in the database
    *   **And** The Order status updates to `STORED` (if not already stored)
    *   **And** The Slot status updates to `OCCUPIED`
    *   **And** The timestamp `stored_at` is recorded

2.  **Multi-Slot Support**
    *   **Given** An Order with multiple large items
    *   **When** I assign it to Slot A and Slot B
    *   **Then** Both slots are marked `OCCUPIED` and linked to the same Order.

3.  **Validation & Error Handling**
    *   **DTO Validation:** Input payload provided to API is strictly validated for UUID format.
    *   **Business Logic:**
        *   Order MUST be in `READY` status (Exception: `BadRequestException`).
        *   Slot MUST be `FREE` (Exception: `ConflictException`).
        *   **Idempotency:** If Order is *already* assigned to *this exact* Slot, return success (idempotent) to prevent workflow interruption.
    *   **Security:** RLS validation ensures both Order and Slot belong to the current user's Tenant/Site.

## Tasks / Subtasks

- [x] Backend: OrderStorage Entity & Logic (AC: 1, 2, 3)
  - [x] Create `OrderStorage` entity with Composite Primary Key (`order_id`, `shelf_slot_id`).
  - [x] Create `AssignOrderDto` with `@IsUUID` validation.
  - [x] Update `StorageService` with `assignOrderToSlot(dto: AssignOrderDto)`.
  - [x] **Transaction:** Use `RlsService` transaction to atomicaly:
    - [x] Insert into `order_storage`.
    - [x] Update `ShelfSlot` status to `OCCUPIED`.
    - [x] Update `Order` status to `STORED` (if current status is `READY`).

- [x] Frontend: Storage Scanner UI (AC: 1, 3)
  - [x] Create `StorageScanner` page/component at `/storage/scan`.
  - [x] Implement dual-input interface: "Scan Order" (auto-focus first) -> "Scan Slot".
  - [x] **UX Optimization:**
    - [x] Auto-refocus "Scan Order" input after successful assignment for rapid batch processing.
    - [x] Handle Scanner Input characters (Enter/Tab terminators) robustly.
  - [x] Add visual feedback: Order details card (shows items, client) after scan.

## Dev Notes

-   **Architecture Compliance:**
    -   **Entity:** `OrderStorage` must use **Composite Primary Key**. Use `@PrimaryColumn()` for both `order_id` and `shelf_slot_id`.
    -   **API:** `POST /storage/assign` accepting valid `AssignOrderDto`.
    -   **RLS:** Ensure `OrderStorage` table has `tenant_id` column to simplify RLS policies and maintain strict security isolation.

-   **Library/Version Specifics:**
    -   **Scanner Input:** Standard barcode scanners act as keyboard input. Ensure `onKeyDown` or form submission handles the `Enter` key correctly without refreshing the page if not desired.
    -   **Focus Management:** Use React `useRef` to programmatically move focus between Order Input -> Slot Input -> Order Input (after success).

-   **Previous Story (6.1) Learnings:**
    -   RLS `wrapTransaction` works well. Re-use this pattern.
    -   `StorageService` already exists; extend it.

### Project Structure Notes

-   **Backend:**
    -   `backend/src/storage/entities/order-storage.entity.ts`
    -   `backend/src/storage/dto/assign-order.dto.ts`
-   **Frontend:** `frontend/src/app/storage/scan/page.tsx`

### References

-   Architecture: Core Tables (`order_storage`) [Source: docs/planning-artifacts/architecture.md#2-modèle-de-données-core-tables]
-   Story 6.1: Shelf Implementation [Source: docs/implementation-artifacts/6-1-shelf-slot-management.md]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
- `backend/src/storage/entities/order-storage.entity.ts`
- `backend/src/storage/dto/assign-order.dto.ts`
- `backend/src/storage/storage.service.ts`
- `backend/src/storage/storage.controller.ts`
- `backend/src/migrations/1769600000000-AddIndexToOrders.ts` (Modified)
- `backend/src/migrations/1769627626948-OrderStorage.ts`
- `frontend/src/app/storage/scan/page.tsx`
- `frontend/src/services/storage.service.ts`
- `backend/src/storage/storage.service.spec.ts`
