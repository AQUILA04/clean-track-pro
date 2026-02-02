# Roadmap Phase 2: Growth & Excellence (M2 - M4)

This roadmap details the parallel execution of three major initiatives: **Audit**, **Subscriptions**, and **Visual Identity**.

## Strategy
We will advance all three streams concurrently to ensure balanced progress:
- **Audit**: Security & Compliance foundation.
- **Subscriptions**: Revenue generation engine.
- **Visual Identity**: Premium User Experience transformation.

---

## Milestone 2 (M2): Foundation & Core
**Focus**: Establish backend structures and the new Design System.

### 1. Audit Management (Stream A)
- **Goal**: Capture "Who did What and When".
- **Deliverables**:
    - `AuditLog` entity and Database Schema.
    - NestJS Interceptor/Middleware for automatic action logging.
    - Superadmin view of global logs (Raw list).

### 2. Subscription Management (Stream B)
- **Goal**: Define what we sell.
- **Deliverables**:
    - `SubscriptionPlan` configuration (Name, Price, Limits).
    - Manual assignment of Plans to Tenants by Superadmin.
    - Database constraints based on active plan (e.g. limit number of sites).

### 3. Visual Identity (Stream C)
- **Goal**: The "Face" of the new platform.
- **Deliverables**:
    - **Design System**: Implementation of tokens, typography (Inter), and colors (#1A5AD7) in Tailwind.
    - **Shell Refactor**: New Sidebar, Layout, and Navigation.
    - **Authentication**: Login/Register pages restyled to match "Blue Trust" spec.
    - **Superadmin Portal**: Full UI conversion for Superadmin journey.

---

## Milestone 3 (M3): Operational Value
**Focus**: Customer-facing workflows and monetization.

### 1. Audit Management (Stream A)
- **Goal**: Visibility for Tenants.
- **Deliverables**:
    - Tenant-scoped Audit UI (Admin_Tenant views their users' actions).
    - Filtering and Export of logs (CSV/PDF).

### 2. Subscription Management (Stream B)
- **Goal**: Self-service & Enforcement.
- **Deliverables**:
    - Tenant Dashboard "My Subscription" view.
    - Automated Expiry checks and "Service Suspension" logic.
    - Basic Payment Integration (e.g. Stripe Link or proof of transfer).

### 3. Visual Identity (Stream C)
- **Goal**: The "Fast-Scan" Experience.
- **Deliverables**:
    - **Reception UI**: Complete rewrite of the Order Intake (Omnibox, Icons, Cart) to match specs.
    - **Processing UI**: Workflow tracking screens (Washing, Ironing status).
    - **Ticket Design**: Thermal printer layout update (Giant QR).

---

## Milestone 4 (M4): Scale & Refinement
**Focus**: Mobile, Reporting, and Advanced Features.

### 1. Audit Management (Stream A)
- **Goal**: Intelligence.
- **Deliverables**:
    - Specific User Activity Reports.
    - Suspicious activity alerts (e.g. bulk deletions).

### 2. Subscription Management (Stream B)
- **Goal**: Reliability & Flexibility.
- **Deliverables**:
    - Proration logic (Upgrades/Downgrades mid-month).
    - Invoicing generation (PDF).
    - Yearly vs Monthly toggles with discounts.

### 3. Visual Identity (Stream C)
- **Goal**: 360° Experience.
- **Deliverables**:
    - **Dashboard**: High-fidelity Charts and CSS Grid layouts.
    - **Mobile App**: React Native Client App implementation matching Mobile Specs.
    - **Storage & Delivery**: Final UI polish for shelf management.

---

## Proposed Epics

### Epic 8: Visual Identity System
*Refactoring the entire UI to match the "Blue Trust" Premium Specs.*

### Epic 9: Audit & Security Logging
*Comprehensive tracking of all system actions for compliance and security.*

### Epic 10: SaaS Subscription Engine
*Monetization infrastructure for multi-tenant billing and plan management.*
