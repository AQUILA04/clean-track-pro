# Story 2.2: Hybrid Client Search (Omnibox)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

**As a** User_Site (Agency Operator),
**I want** to find a client by typing their Name, Phone, or Unique Code in a single search box,
**So that** I can quickly start an order or access their file without asking for repetition.

## Acceptance Criteria

1.  **Hybrid Search Logic**
    *   **Given** I am typing in the Omnibox.
    *   **When** I enter a string (min 3 chars).
    *   **Then** The system searches across `first_name`, `last_name`, `phone`, and `unique_code` fields.
    *   **And** It returns matches where the query is a substring (names) or exact/partial match (phone/code).

2.  **Search Performance (Redis)**
    *   **Given** A high volume of search queries.
    *   **When** A search is executed.
    *   **Then** The result should be cached in Redis (TTL ~5 min) to speed up repeated searches for the same term.
    *   **And** Response time should be < 200ms.

3.  **Omnibox UI Behavior**
    *   **Given** The Omnibox input.
    *   **When** I type "John".
    *   **Then** A dropdown list appears with matching clients (Name + Phone + Code displayed).
    *   **And** Using keyboard up/down arrows allows navigation.
    *   **And** Pressing Enter selects the highlighted client.

4.  **No Results / Creation Flow**
    *   **Given** No clients match the query.
    *   **When** The search completes.
    *   **Then** The dropdown displays "No client found".
    *   **And** Provides a "Create New Client" button/link that redirects to the creation form (Story 2.1) or opens the modal.
    *   **And** **UX Requirement**: The search term is successfully passed (e.g., via URL query params `?phone=...` or `?name=...`) to pre-fill the creation form, avoiding re-entry.

5.  **Security (RLS)**
    *   **Given** I am a user of Tenant A.
    *   **When** I search for a common name like "Smith".
    *   **Then** ONLY clients belonging to Tenant A are returned.
    *   **And** Clients from Tenant B are NEVER leaked.

## Technical Requirements

### Backend (NestJS)
*   **Module**: `ClientModule` (Existing).
*   **Controller**: `ClientController`.
    *   `GET /clients/search?q=...`
    *   Validation: `q` min length 3.
*   **Service**: `ClientService`.
    *   Method `search(tenantId, query)`.
    *   Query Logic:
        ```sql
        WHERE tenant_id = :tenantId
        AND (
            first_name ILIKE :q OR
            last_name ILIKE :q OR
            phone ILIKE :q OR
            unique_code = :q
        )
        ```
*   **Caching**:
    *   Use `CACHE_MANAGER` (NestJS CacheModule) with Redis store.
    *   Cache key: `tenant_{id}_search_{query}`.
    *   **Requirement**: Encapsulate Redis logic in a shared `RedisService` or `CacheModule` to ensure connection reuse across the application.
    *   Invalidation: On Client Create/Update, invalidate tenant-specific search keys (or basic TTL strategy if invalidation is too complex for MVP).

### database (PostgreSQL)
*   Ensure **indexes** exist for:
    *   `tenant_id` (already done).
    *   `last_name` (**CRITICAL**: Use `pg_trgm` extension + GIN index to support efficient `ILIKE '%...%'` substring searches).
    *   *Alternative (MVP)*: If `pg_trgm` cannot be installed, restrict search to **Prefix Only** (`LIKE 'Start%'`) and use a standard B-Tree index. **Substring search without GIN will cause full table scans.**

### Frontend (Next.js)
*   **Component**: `ClientOmnibox.tsx`.
    *   Use `combobox` pattern (e.g., from Headless UI or Radix UI, or Shadcn/ui `Command` component).
    *   Implement **Debounce** (300ms) on input to prevent spamming API. **Recommendation**: Use a standard `useDebounce` hook or library (e.g., `use-debounce`) rather than ad-hoc `setTimeout` logic.
*   **Integration**:
    *   `ClientService.search(query)`.
    *   Handle loading state (spinner).
    *   Handle error state.

## Tasks / Subtasks

- [x] Backend Implementation <!-- id: 1 -->
  - [x] Add `search` method to `ClientController` with validation. <!-- id: 1.1 -->
  - [x] Implement database query in `ClientService` (RLS safe). <!-- id: 1.2 -->
  - [x] Configure Redis Cache for search results. <!-- id: 1.3 -->
  - [x] Add Unit Tests for search logic. <!-- id: 1.4 -->
- [x] Database Optimization <!-- id: 2 -->
  - [x] Create indexes on `last_name` (GIN/trgm), `phone` in `clients` table. <!-- id: 2.1 -->
- [x] Frontend Implementation <!-- id: 3 -->
  - [x] Create `ClientOmnibox` component (UI + Debounce). <!-- id: 3.1 -->
  - [x] Integrate with `ClientService` search API. <!-- id: 3.2 -->
  - [x] Handle "No Results" and "Create Client" navigation. <!-- id: 3.3 -->
- [x] Verification <!-- id: 4 -->
  - [x] Manual Test: Search by Name, Phone, Code. Verify speed. <!-- id: 4.1 -->
  - [x] Manual Test: Verify RLS (create client in Tenant B, ensure not visible in Tenant A). <!-- id: 4.2 -->

- [ ] Review Follow-ups (AI) <!-- id: 5 -->
  - [x] [AI-Review][Medium] Performance (Database): Enable `pg_trgm` and replace B-Tree indexes with GIN for `first_name`, `last_name`, `phone` -> `backend/src/clients/entities/client.entity.ts` <!-- id: 5.1 -->

## Dev Notes

*   **Redis Requirement**: Architecture explicitly mentions Redis for Omnibox. Ensure Redis is running and configured in `app.module.ts`. If not, set it up.
*   **Previous Learning (Story 2.1)**:
    *   Remember to send `Authorization` header in frontend requests (this caused issues in 2.1).
    *   Use the existing `Client` entity and `ClientService`.
*   **RLS Context**: Ensure the `tenant_id` is extracted from the request user (Request context) and passed to the query, OR rely entirely on the RLS policy if it's set at the connection level. *Safer to add `WHERE tenant_id = ?` explicitly in query builder to be double sure.*

### Project Structure Notes
*   Reuse `src/components/clients/` for the Omnibox.
*   Reuse `src/clients/` for backend.

### References
*   [Architecture - Stack](file:///c:/Users/kahonsu/Documents/GitHub/clean-track-pro/docs/planning-artifacts/architecture.md)
*   [Epics - Story 2.2](file:///c:/Users/kahonsu/Documents/GitHub/clean-track-pro/docs/planning-artifacts/epics.md)
*   [Previous Story 2.1](file:///c:/Users/kahonsu/Documents/GitHub/clean-track-pro/docs/implementation-artifacts/2-1-client-creation-unique-code-generation.md)

## Dev Agent Record

### Agent Model Used
Matches 'sm' agent context.

### Debug Log References
None.

### Completion Notes List
- Generated comprehensive requirements including Redis caching and RLS enforcement.
- ✅ Resolved review finding [Medium]: Enabled `pg_trgm` and GIN indexes for efficient substring search. Fixed RLS migration type casting issues.
- ✅ Refactored migrations to be fully automated: Explicitly creates `users`, `tenants`, `clients` tables within migrations, removing reliance on `synchronize: true`. Validated on clean DB.
- ✅ Updated `app.module.ts`: Disabled `synchronize` by default, enabled `migrationsRun: true` for auto-deployment, and matched DB name to `cleantrack`.

### File List
- backend/package.json
- backend/src/app.module.ts
- backend/src/migrations/1769350800000-EnablePgTrgmAndGinIndexes.ts
- backend/src/clients/client.controller.ts
- backend/src/clients/client.service.ts
- backend/src/clients/client.service.spec.ts
- backend/src/clients/entities/client.entity.ts
- frontend/package.json
- frontend/src/services/client.service.ts
- frontend/src/components/clients/ClientOmnibox.tsx
