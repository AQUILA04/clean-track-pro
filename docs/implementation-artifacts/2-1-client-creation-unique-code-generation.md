# Story 2.1: Client Creation & Unique Code Generation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

**As a** User_Site (Agency Operator),
**I want** to register a new client and automatically generate a unique, printable code,
**So that** they can be identified for future orders and cross-agency recognition.

## Acceptance Criteria

1.  **Client Registration Form**
    *   **Given** I am on the Client Registration page or modal.
    *   **When** I enter a **First Name**, **Last Name**, and **Phone Number**.
    *   **And** The Phone Number is in a valid format (E.164 validation required).
    *   **Then** The "Create Client" button becomes active.

2.  **Unique Code Generation**
    *   **Given** Valid client details are submitted.
    *   **When** The backend processes the creation request.
    *   **Then** An **8-character alphanumeric Unique Code** is automatically generated.
    *   **And** The system ensures this code is unique within the Tenant (or globally if possible/preferred for simplicity).
    *   **And** The code is stored with the client record.

3.  **Persistence & RLS**
    *   **Given** The user belongs to Tenant A.
    *   **When** The client is saved.
    *   **Then** The record is persisted in the `clients` table.
    *   **And** The `tenant_id` is correctly set to Tenant A's ID (derived from the authenticated user's token/context).
    *   **And** Users from Tenant B CANNOT see or access this client (RLS enforcement).

4.  **Success Feedback**
    *   **Given** The client is successfully created.
    *   **When** The response returns.
    *   **Then** The UI displays a success message.
    *   **And** The new Client's details (Code, Name, Phone) are shown or the user is redirected to the new client's file/order creation.

## Technical Requirements

### Database Schema (New Table: `clients`)
*   **Table Name**: `clients`
*   **Columns**:
    *   `id` (UUID, Primary Key)
    *   `tenant_id` (UUID, Not Null, Foreign Key to `tenants.id` if exists, or just ID) - **CRITICAL for RLS**
    *   `created_at`, `updated_at` (Timestamps)
    *   `first_name` (VARCHAR)
    *   `last_name` (VARCHAR)
    *   `phone` (VARCHAR, Indexed)
    *   `email` (VARCHAR, Optional)
    *   `unique_code` (VARCHAR(8), Unique Index per Tenant, Not Null)
    *   `notes` (Text, Optional)

### Backend (NestJS)
*   **Module**: `ClientModule` (New)
*   **Controller**: `ClientController`
    *   `POST /clients`: DTO with validation (class-validator).
*   **Service**: `ClientService`
    *   Logic to generate 8-char code.
    *   Retry logic if code collision occurs (though rare with 8 chars).
    *   **MANDATORY**: Use custom alphabet `23456789ABCDEFGHJKLMNPQRSTUVWXYZ` (excludes I/L/1, O/0) to ensure readability.
    *   Note: Add `nanoid` (or similar) to `package.json` if missing.
*   **Security**:
    *   Use existing RLS mechanism (set session config before query).
    *   Role Guards: `User_Site`, `Admin_Site`, `Admin_Tenant`, `Superadmin`.

### Frontend (Next.js)
*   **Page/Component**: `/clients/new` or a `ClientCreateModal`.
*   **Validation**: Zod schema for form validation (especially Phone E.164).
*   **UI**: Use standard TailWind components defined in previous stories.

## Tasks / Subtasks

- [x] Database Migration <!-- id: 1 -->
  - [x] Create `clients` table with RLS policy enabled. <!-- id: 1.1 -->
  - [x] Add index on `tenant_id` and `unique_code`. <!-- id: 1.2 -->
- [x] Backend Implementation <!-- id: 2 -->
  - [x] Generate `ClientModule`, `ClientController`, `ClientService`. <!-- id: 2.1 -->
  - [x] Implement `create` DTO and method. <!-- id: 2.2 -->
  - [x] Implement unique code generator utility (alphanumeric 8 chars). <!-- id: 2.3 -->
  - [x] Add RLS context integration tests. <!-- id: 2.4 -->
- [x] Frontend Implementation <!-- id: 3 -->
  - [x] Create `ClientService` (API client). <!-- id: 3.1 -->
  - [x] Build `ClientRegistrationForm` component. <!-- id: 3.2 -->
  - [x] Implement E.164 phone validation logic (use strict regex or library). <!-- id: 3.3 -->
  - [x] Integrate form with API and handle success/error states. <!-- id: 3.4 -->
- [x] Verification <!-- id: 4 -->
  - [x] Manual test: Create client, verify DB record and RLS isolation. <!-- id: 4.1 -->
  - [x] Automated test: Unit tests for code generation and service logic (must mock collision to verify retry). <!-- id: 4.2 -->

## Dev Notes

*   **RLS IS MANDATORY**: You MUST apply the standard tenant-isolation RLS policy to the `clients` table. See `1-4-rls-security-enforcement`.
*   **Code Legibility**: The custom alphabet is a STRICT requirement. Do not use full alphanumeric.
*   **Phone Formatting**: Store in E.164 format (+33...) to ensure global uniqueness and SMS capability later.

### Project Structure Notes
*   Follow the modular architecture in NestJS (`src/modules/client`).
*   Frontend: `src/app/dashboard/clients/new/page.tsx` or similar.

### References
*   [Planning - Epics (Story 2.1)](file:///c:/Users/kahonsu/Documents/GitHub/clean-track-pro/docs/planning-artifacts/epics.md)
*   [Planning - PRD (Section 2)](file:///c:/Users/kahonsu/Documents/GitHub/clean-track-pro/docs/planning-artifacts/prd.md)
*   [Architecture - Database](file:///c:/Users/kahonsu/Documents/GitHub/clean-track-pro/docs/planning-artifacts/architecture.md)

## Dev Agent Record

### Agent Model Used
Matches 'sm' agent context.

### Debug Log References
None.

### Completion Notes List
- Story created based on PRD FR3/FR5 and Epic 2.

### File List
- backend/src/clients/client.module.ts
- backend/src/clients/client.service.ts
- backend/src/clients/client.controller.ts
- backend/src/clients/entities/client.entity.ts
- backend/src/clients/dto/create-client.dto.ts
- backend/src/clients/client.service.spec.ts
- backend/src/migrations/1769350752783-CreateClientsTableAndRLS.ts
- backend/src/app.module.ts
- frontend/src/app/dashboard/clients/new/page.tsx
- frontend/src/components/clients/ClientRegistrationForm.tsx
- frontend/src/services/client.service.ts
- frontend/src/lib/validations/client.ts
- frontend/package.json
- backend/package.json

## Senior Developer Review (AI)

**Review Date:** 2026-01-25
**Outcome:** Approved (with automatic fixes)

### Findings Summary
- **Critical Issues:** 2 (Auth Header Missing, Task Status Mismatch) - FIXED
- **High Issues:** 1 (Empty File List) - FIXED
- **Medium Issues:** 1 (Weak Validation) - FIXED

### Action Items
- [x] Implement Auth Header in ClientService [FIXED]
- [x] Enable strict phone validation in DTO [FIXED]
- [x] Mark all completed tasks [FIXED]
- [x] Populate File List [FIXED]
