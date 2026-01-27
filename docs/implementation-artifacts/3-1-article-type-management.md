# Story 3.1: Article Type Management

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **Admin_Tenant**,
I want to **define types of articles (e.g., Shirt, Pants, Duvet)**,
so that **they are available for selection in orders**.

## Acceptance Criteria

1.  **Create Article Type**:
    *   **Given** I am on the Service Configuration page (`/settings/catalog`).
    *   **When** I click "Add Article Type" and enter a Label (e.g., "Shirt") and Category (e.g., "Clothing").
    *   **Then** The article type is saved to the database.
    *   **And** The `tenant_id` is automatically associated from my session.
    *   **And** The system prevents duplicate labels for the same Tenant.

2.  **List Article Types**:
    *   **Given** I have created multiple article types.
    *   **When** I view the list.
    *   **Then** I see all article types for **my tenant only** (RLS check).
    *   **And** I do NOT see article types from other tenants.

3.  **Update/Deactivate**:
    *   **Given** An existing article type.
    *   **When** I edit its Label or toggle "Active" status.
    *   **Then** The changes are saved.
    *   **And** Deactivating it prevents it from being selected in *new* orders (but preserves history).

## Tasks / Subtasks

- [x] **Backend: Catalog Module & Core Implementation** (AC: 1, 2, 3)
  - [x] Initialize `CatalogModule`, `CatalogController`, `CatalogService`.
  - [x] Create `ArticleType` entity (id, tenant_id, label, category, is_active, created_at, updated_at).
    - *Note: Consider extracting or adhering to a `BaseEntity` pattern for common fields.*
  - [x] Create Migration: `CreateArticleTypesTable` with RLS policy enabled.
  - [x] Implement `create()` endpoint with uniqueness check (Label + Tenant).
  - [x] Implement `findAll()` endpoint with implicit RLS filtering.
  - [x] Implement `update()` endpoint (Label, Active Status) with `tenant_id` immutability check.
  - [x] Add DTOs with `class-validator` for all inputs.

- [x] **Frontend: Foundation & Dependencies** (AC: 1, 2)
  - [x] **Install `axios`** (missing in package.json).
  - [x] Create `ArticleTypeService` in `frontend/src/services`.
  - [x] Define `ArticleType` interface in `frontend/src/types`.
  - [x] Create reusable `Table` component using Tailwind CSS (if not exists).
  - [x] Create reusable `Modal` component using Tailwind CSS (if not exists).

- [x] **Frontend: Management UI** (AC: 1, 2, 3)
  - [x] Create page `app/(dashboard)/settings/catalog/page.tsx`.
  - [x] Implement Data Table to list article types (use reusable Table component).
  - [x] Create "Add / Edit" Form using **`react-hook-form`** and **`zod`** for validation.
  - [x] Integrate Form into Modal/Sidepanel.
  - [x] Connect UI to `ArticleTypeService` with proper error handling.

## Dev Notes

- **Architecture Patterns**:
    - **RLS**: The migration MUST enable Row Level Security on `article_types`. Verify policies against `shared/database/rls/rls.service.ts` patterns if applicable.
    - **Entity Strategy**: All entities should standardly have `id` (UUID), `created_at`, `updated_at`. If a shared `BaseEntity` does not exist, define one or ensure strict adherence to this schema.
    - **Auth**: Protect all routes with `@Roles(['ADMIN_TENANT'])`.
    - **Tenant Isolation**: NEVER rely solely on `WHERE tenant_id = ?` in service; rely on RLS + Context for security.

- **Source Components**:
    - `backend/src/catalog/*` (NEW)
    - `frontend/src/app/(dashboard)/settings/catalog/*` (NEW)
    - `frontend/src/services/article-type.service.ts` (NEW)
    - `frontend/src/components/*` (Reusable UI)

- **Testing Standards**:
    - Backend: Unit tests for Service (mock Repository).
    - Backend: E2E test for Controller (verify RLS - attempt access as different tenant).

### Project Structure Notes

- **Module Naming**: Use `catalog` for the module, as it will likely house `Service` and `Price` entities in future stories (Epic 3).
- **Route**: `settings/catalog` is consistent with `settings/agency`.

### Reference Material

- [PRD Section 4: Gestion des Services](docs/planning-artifacts/prd.md)
- [Architecture Section 2: Modèle de Données](docs/planning-artifacts/architecture.md)
- [Epic 3: Service Configuration](docs/planning-artifacts/epics.md)

## Dev Agent Record

### Agent Model Used

Antigravity (Google DeepMind)

### Debug Log References

### Completion Notes List

### File List
