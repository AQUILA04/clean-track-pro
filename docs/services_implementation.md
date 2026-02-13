# Implementation Plan - Services Integration

## Goal
Connect the "Services" tab in the Catalogue to the real backend.
Enable Create, Read, Update, Delete (CRUD) operations for Services.

## Current State
- **Backend**:
    - `ServiceDefinitionController` exists with `GET`, `POST`, `PATCH`.
    - Missing `DELETE` endpoint.
- **Frontend**:
    - `page.tsx` uses `MOCK_SERVICES`.
    - `AddServiceModal.tsx` supports creation only.
    - No dedicated service file for API calls (currently Mocks or inline).

## Proposed Changes

### 1. Backend Updates

#### [MODIFY] [service-definition.service.ts](file:///c:/Users/kahonsu/Documents/GitHub/clean-track-pro/backend/src/catalog/services/service-definition.service.ts)
- Add `delete(id: string, tenantId: string)` method.
- Update `findAll` to accept optional `query: string`.
- Implement `ILike` filtering for `label` (name) and `description` if `query` is provided.

#### [MODIFY] [service-definition.controller.ts](file:///c:/Users/kahonsu/Documents/GitHub/clean-track-pro/backend/src/catalog/controllers/service-definition.controller.ts)
- Add `@Delete(':id')` endpoint.
- Update `@Get()` to accept `@Query('q') query?: string`.

### 2. Frontend Updates

#### [NEW] [laundry-service.service.ts](file:///c:/Users/kahonsu/Documents/GitHub/clean-track-pro/frontend/src/services/laundry-service.service.ts)
- Create a new service file.
- Methods: `findAll(query?: string)`, `create()`, `update()`, `delete()`.

#### [MODIFY] [page.tsx](file:///c:/Users/kahonsu/Documents/GitHub/clean-track-pro/frontend/src/app/(dashboard)/catalogue/page.tsx)
- **Logic**:
    - Update `findAll` call to pass `searchQuery`.
    - Ensure debounce logic triggers service fetch for active tab.

## Verification Plan

### Manual Verification Steps
1.  **List**: Open "Services" tab. Verify loading spinner and data fetch from DB.
2.  **Search**: Type in search bar. Verify backend request with `?q=...` and filtered results.
3.  **Create**: Add a new service.
4.  **Edit**: Edit a service.
5.  **Delete**: Delete a service.
