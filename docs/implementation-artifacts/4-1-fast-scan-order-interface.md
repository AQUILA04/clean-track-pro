# Story 4.1: Fast-Scan Order Interface

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an User_Site,
I want a streamlined POS interface to quickly add items to an order for a selected client,
so that I can handle queues efficiently.

## Acceptance Criteria

1. **Given** A client is selected in the Omnibox, **When** I tap an Article Icon (e.g., Shirt), **Then** It is legally added to the current Order Draft with the default service (e.g., "Full Wash") immediately.
2. **And** I can adjust quantity or service type if needed.
3. **And** The system **persistently saves** the draft to local storage, so if I refresh the page, the order is not lost.

## Tasks / Subtasks

- [x] Code Review Findings Fixed (Dynamic Pricing, Tenant Storage Key, Tests)
- [x] Verified
- [x] Implement Order Draft State Management (Frontend) <!-- id: 1 -->
  - [x] Create `OrderDraftContext` or Store (Zustand/Context API) to hold selected client and items.
  - [x] Define types for `OrderItemDraft` (Article ID, Service ID, Quantity, Price).
  - [x] **Critical**: Implement `localStorage` persistence for the active draft (Key: `tenant_{id}_draft`).
- [x] Implement Article Grid Component <!-- id: 2 -->
  - [x] **Backend Update**: Add `icon` column (String, nullable) to `ArticleType` entity and migration.
  - [x] Fetch configured Article Types for the current Tenant.
  - [x] Render a grid of clickable Article Icons/Cards.
  - [x] Handle click events to add items to the draft.
- [x] Implement Order Draft Summary Component <!-- id: 3 -->
  - [x] Display list of added items with quantities and prices.
  - [x] Allow modifying quantity (+/-) or removing items.
  - [x] Allow changing Service Type (e.g., Wash -> Iron only).
- [x] Integrate with Client Search (Omnibox) <!-- id: 4 -->
  - [x] **Reuse**: Use the existing `ClientOmnibox` component from Story 2.2 (`src/components/clients/ClientOmnibox.tsx`).
  - [x] Ensure the "Fast-Scan" UI is visible/active only when a client is selected.
  - [x] connect `OrderDraftContext` with the selected client.
- [ ] Implement Backend "Draft" Support (Optional/If needed) <!-- id: 5 -->
  - [ ] *Analysis*: Story 4.3 handles "Persistence". Story 4.1 focuses on the *Interface* and *Adding items*. The actual saving is 4.3.
  - [ ] Ensure `ServiceService` and `ArticleService` endpoints exist to populate the grid.

## Dev Notes

- **Architecture**:
    - Frontend: Next.js 14 App Router. Use a client-side store (e.g., separate context or Zustand) for the Order Draft to ensure snappy "Fast-Scan" performance without waiting for backend roundtrips on every click.
    - Backend: NestJS. Ensure `ArticleController` and `ServiceController` (from Epic 3) expose necessary `findAll` endpoints for the UI to load the catalog.
- **UX**:
    - "Fast-Scan" implies speed. Avoid complex modals for simple adds. Defaults should apply immediately.
    - Visual feedback on click is crucial.
- **Dependencies**:
    - Depends on Epic 3 (Service/Article configuration) to populate the grid.
    - Depends on Epic 2 (Client Selection) to associate the order.

### Project Structure Notes

- Components should live in `libs/client/order/feature` or `ui` (if relying on Nx libs) or `components/order` (if standard Next.js).
- Follow the project's existing pattern for Feature-based or Domain-based folder structure.

### References

- [Epics Source: docs/planning-artifacts/epics.md#Story-4.1-Fast-Scan-Order-Interface](#Story-4.1:-Fast-Scan-Order-Interface)
- [Architecture: docs/planning-artifacts/architecture.md](#Frontend-Stack)

## Dev Agent Record

### Agent Model Used

Antigravity (Gemini 2.0 Pro)

### Debug Log References

### Completion Notes List

- Implemented `OrderDraftContext` with localStorage persistence.
- Added `icon` column to `ArticleType` schema and ran migrations.
- Created `ArticleGrid` and `OrderDraftSummary` components.
- Integrated `ClientOmnibox` and created `/dashboard/orders/page.tsx`.
- Updated DTOs and fixed lints.
- Fixed migration conflicts left from previous runs.

### File List
- backend/src/catalog/entities/article-type.entity.ts
- backend/src/catalog/dto/create-article-type.dto.ts
- backend/src/migrations/1769544149390-AddExpressConfig.ts
- backend/src/migrations/1769545761984-AddIconToArticleTypes.ts
- frontend/src/types/article-type.ts
- frontend/src/types/service-definition.ts
- frontend/src/context/order-draft.context.tsx
- frontend/src/components/orders/ArticleGrid.tsx
- frontend/src/components/orders/OrderDraftSummary.tsx
- frontend/src/app/dashboard/orders/page.tsx
