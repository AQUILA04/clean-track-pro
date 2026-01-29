# Story 6.3: Client Pickup & Delivery Verification

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an User_Site,
I want to scan a customer's ticket to locate their package and confirm delivery,
so that the transaction is closed securely and the storage slot is freed.

## Acceptance Criteria

1.  **Ticket Scanning & Retrieval**
    *   **Given** A Customer presenting a ticket (Order QR)
    *   **When** I scan the QR code in the Delivery Interface
    *   **Then** The system retrieves the Order details (Items, Status, Balance Due)
    *   **And** Displays the **Shelf Slot ID** (e.g., "A-01") if the order is currently stored
    *   **And** Alerts if the order is NOT in `READY` or `STORED` state (e.g., "Order is IN_PROGRESS")

2.  **Delivery Confirmation Workflow**
    *   **Given** The Order details are displayed and the operator has retrieved the package
    *   **When** I click "Confirm Delivery"
    *   **Then** The Order status updates to `DELIVERED`
    *   **And** The linked Shelf Slot status updates to `FREE`
    *   **And** The `order_storage` association is removed (or marked specific status) to release the slot linkage
    *   **And** A "Delivery Successful" toast is shown, and the form resets for the next client

3.  **Validation & Security**
    *   **Tenant Isolation:** Users can strictly ONLY retrieve/deliver orders from their own Tenant/Site (RLS enforced).
    *   **State validation:** Cannot deliver a `CANCELLED` or `DELIVERED` order.
    *   **Idempotency:** Scanning an already `DELIVERED` order should show "Already Delivered" info, not error.

## Tasks / Subtasks

- [ ] Frontend: Shared Components
    - [ ] **Refactor:** Extract `ScannerInput` shared component from `StorageScanner` (Story 6.2) to `frontend/src/components/shared/ScannerInput.tsx` to ensure consistent focus handling.

- [ ] Backend: Delivery Logic & Storage Release (AC: 1, 2, 3)
    - [ ] Update `StorageService` to include `processDelivery(orderId: string)`.
    - [ ] Create `StorageController` endpoint: `POST /storage/deliver/:orderId`.
        - [ ] Use `ParseUUIDPipe` for `orderId` parameter validation.
    - [ ] **Transaction Logic:**
        - [ ] Verify Order exists and belongs to tenant.
        - [ ] Find active `OrderStorage` record to identify the slot.
        - [ ] Update `ShelfSlot` status to `FREE` (if slot was assigned).
        - [ ] Delete/Archive the `OrderStorage` record (unlink).
        - [ ] Update `Order` status to `DELIVERED`.
    - [ ] Add endpoint `GET /storage/lookup/:orderId`.
        - [ ] Define and return strict interface `OrderLookupResponse`: `{ order: OrderDto, slot_label: string | null }`.

- [ ] Frontend: Delivery Interface (AC: 1, 2)
    - [ ] Create page `/storage/delivery` (or switch/tab in `/storage` layout).
    - [ ] Implement `ScannerInput` reuse (from shared component).
    - [ ] Create `OrderDeliveryCard` component:
        - [ ] Display Client Name, Order ID, **Huge Slot Label** (e.g., "A-01").
        - [ ] Show list of Items.
        - [ ] "Confirm Delivery" Primary Button.
    - [ ] Integrate `StorageService.deliverOrder(id)`.
    - [ ] Handle success/error feedback (Toast).

## Dev Notes

-   **Architecture Compliance:**
    -   **Transaction:** Crucial to wrap Order Status Update + Slot Release in a single transaction to prevent "Occupied but Empty" slots.
    -   **Response Contracts:** Strictly type the `GET /storage/lookup` response. Avoid returning raw entities.
    -   **Validation:** Use `ParseUUIDPipe` in controller to minimize boilerplate validation code.

-   **Previous Story (6.2) Learnings:**
    -   The Scanner Input component pattern used in 6.2 (`inputRef` + `autoFocus`) is robust. We are refactoring it to `ScannerInput` for reusability.
    -   `RlsService.wrapTransaction` is the standard for multi-entity updates.

-   **Technical Specifics:**
    -   **QR Code Content:** Assume the QR contains the UUID of the Order.
    -   **Slot Release:** Be careful only to release the slot IF one is assigned. Some orders might be `READY` but not `STORED`.

### Project Structure Notes

-   **Backend:**
    -   `backend/src/storage/storage.service.ts` (Update)
    -   `backend/src/storage/storage.controller.ts` (Update)
    -   `backend/src/storage/dto/order-lookup.response.ts` (New)
-   **Frontend:**
    -   `frontend/src/app/storage/delivery/page.tsx` (New)
    -   `frontend/src/components/shared/ScannerInput.tsx` (New - Extracted)

### References

-   Story 6.2: Storage Assignment [Source: docs/implementation-artifacts/6-2-order-storage-assignment.md]
-   Architecture: Stack & DB [Source: docs/planning-artifacts/architecture.md]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- Implemented full delivery workflow with backend transaction safety.
- Extract generic `ScannerInput` for reuse.
- Added unit tests for backend logic.
- [AI-Review] Decoupled response DTO from entity.
- [AI-Review] Updated file list documentation.

### File List

- backend/src/storage/storage.controller.ts
- backend/src/storage/storage.service.ts
- backend/src/storage/storage.service.spec.ts
- backend/src/storage/dto/order-lookup.response.ts
- backend/src/orders/dto/order.dto.ts
- frontend/src/app/storage/scan/page.tsx
- frontend/src/app/storage/delivery/page.tsx
- frontend/src/components/shared/ScannerInput.tsx
- frontend/src/components/storage/OrderDeliveryCard.tsx
- frontend/src/services/storage.service.ts
- docs/implementation-artifacts/sprint-status.yaml
