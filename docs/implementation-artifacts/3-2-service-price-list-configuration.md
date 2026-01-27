# Story 3.2: Service & Price List Configuration

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **Admin_Tenant**,
I want to **configure available Services (e.g., Wash, Iron) and set their Prices for each Article Type**,
so that **the system can calculate order totals correctly based on my specific business rules**.

## Acceptance Criteria

1.  **Manage Service Definition** (The "Columns"):
    *   **Given** I am on the Service Configuration page (`/settings/catalog`).
    *   **When** I create a Service (e.g., "Repassage Hand", "Dry Clean").
    *   **Then** It is saved with a Label and optional Description.
    *   **And** It is scoped to **my tenant only** (RLS).

2.  **Configure Pricing Matrix** (The "Intersection"):
    *   **Given** I have defined Article Types (from Story 3.1) and Services.
    *   **When** I select an Article (e.g., "Shirt") and a Service (e.g., "Ironing").
    *   **Then** I can define a **Base Price** (e.g., 5.00 €).
    *   **And** The system validates the price is positive.
    *   **And** I can update this price later.

3.  **Price Versioning Impact (Safety Check)**:
    *   **Given** An existing price for "Shirt - Ironing" is 5.00 €.
    *   **When** I change it to 6.00 €.
    *   **Then** New orders will use 6.00 €.
    *   **And** *Implicit Implementation Requirement*: This change MUST NOT retroactively alter the total of past `CREATED` or `PAID` orders (handled via snapshotting in Epic 4, but the data structure here must support single-source-of-truth updates).

4.  **Bulk/Matrix View (UX)**:
    *   **Given** Multiple articles and services.
    *   **When** I view the Catalog Pricing tab.
    *   **Then** I see a clear list or matrix showing which Articles have prices for which Services.

## Tasks / Subtasks

- [x] **Backend: Service & Pricing Entities** (AC: 1, 2, 3)
    - [x] **Entity `ServiceDefinition`**:
        - Fields: `id` (UUID), `tenant_id`, `label` (String), `is_active` (Boolean).
        - RLS: Enable implementation.
    - [x] **Entity `ServicePrice`**:
        - Fields: `id` (UUID), `tenant_id`, `article_type_id` (FK), `service_definition_id` (FK), `price` (Decimal/Numeric).
        - Constraint: Unique combination of `article_type_id` + `service_definition_id` per Tenant.
    - [x] **Migrations**: Create tables `service_definitions` and `service_prices` with RLS policies enabled.
    - [x] **API Endpoints (`CatalogController`)**:
        - `POST /catalog/services`: Create service.
        - `GET /catalog/services`: List services.
        - `POST /catalog/prices`: Upsert price (Create or Update).
        - `GET /catalog/prices`: List all configured prices.
    - [x] **Data Seeding**: Create a script or fixture to seed standard services (Wash, Iron, Dry Clean) to speed up testing and Manual Validation.

- [x] **Frontend: Services Management** (AC: 1)
    - [x] Update `ArticleTypeService` -> Rename to `CatalogService` or extend it to handle Services and Prices.
    - [x] Add "Services" tab to `settings/catalog/page.tsx`.
    - [x] Implement CRUD for `ServiceDefinition` using existing `Table` and `Modal` components.

- [x] **Frontend: Pricing Configuration** (AC: 2, 4)
    - [x] Add "Pricing" tab to `settings/catalog`.
    - [x] **UI Implementation**:
        - Fetch Articles and Services.
        - Fetch Articles and Services.
        - Render a **Pivot Table / Grid Layout** (Articles as Rows, Services as Columns) for better UX than a long list.
        - Implement "Save" functionality for prices.
        - Implement "Save" functionality for prices.
        - Use `react-hook-form` and `zod` schema (Price > 0).

## Dev Notes

- **Architecture Patterns**:
    - **Module Cohesion**: Continue working within `backend/src/catalog`. Do NOT create a new module `pricing` unless complexity explodes. Keep it cohesive.
    - **Numeric Precision**: Use `Decimal(10, 2)` for prices in Postgres. In TypeScript, handle carefully (return as string or number, ensure no floating point math errors).
    - **Entity Naming**:
        - `ServiceDefinition`: Represents the abstract service (e.g., "Washing").
        - `ServicePrice`: Represents the link and cost (Article A + Service B = Cost X).
    - **RLS Enforcement**: Ensure `tenant_id` is mandatory on BOTH new tables.

- **Frontend Reuse**:
    - **Reuse**: `Table` and `Modal` components from Story 3.1.
    - **State Management**: Use a specialized hook or local state to manage the grid edits before saving. The Pivot Table pattern requires careful state management to handle the [Article x Service] intersection.

- **Data Integrity & Precision**:
    - **Pricing Snapshot Strategy**: `ServicePrice` is mutable and represents the *current* catalog price. Changes here MUST NOT strictly ripple to existing orders without control. Note that `order_items` (Task 4) will require a `unit_price` snapshot column to freeze the price at the moment of creation.
    - **Strict Decimal Handling**: Use a custom DTO/transformer for the Price field to ensure it always flows to Frontend as a `number` (float) or `string` consistently. Avoid the common PostgreSQL `numeric` -> JS `string` type confusion in NestJS/TypeORM by explicitly casting or transforming in the DTO.

- **Potential Pitfalls**:
    - **N+1 Problems**: When fetching prices, do not run one query per article. Use `JOIN`s or fetch all prices in one go (`findAll`) can map them in memory if dataset is small (< 1000 items), or use proper pagination.
    - **Orphaned Prices**: If an `ArticleType` is deleted (soft delete), what happens to `ServicePrice`?
        - Decision: Cascade soft-delete or check generic constraints.

### Reference Material

- [Story 3.1: Article Type Management](docs/implementation-artifacts/3-1-article-type-management.md) (Previous work)
- [Architecture: Database Schema](docs/planning-artifacts/architecture.md)

## Dev Agent Record

### Agent Model Used
Antigravity (Google DeepMind)

## Change Log

- **[Date]**: Code Review performed.
    - Fixed: Marked completed tasks in story file.
    - Fixed: Deleted empty duplicate migration file.
    - Fixed: Added unit tests for `PricingService`.
- **[Date]**: Story moved to `review` status.
