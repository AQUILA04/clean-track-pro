---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
inputDocuments:
  - docs/prd.md
  - docs/architecture.md
  - docs/ui-ux-spec.md
---

# CleanTrack Pro - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for CleanTrack Pro, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: **IAM Structure**: System must support a single Realm with `tenant_id` and `site_ids[]` in JWT claims.
FR2: **Role Management**: System must support roles: Superadmin, Admin_Tenant, Admin_Site, User_Site, Client.
FR3: **Client Record**: System must maintain unique Client records per Tenant, usable across all network agencies.
FR4: **Hybrid Identification**: System must allow client search via Phone (E.164), Name, Email, or Unique Code.
FR5: **Unique Client Code**: System must generate a unique code for new clients, printable on cards or displayed as QR.
FR6: **Order Lifecycle**: System must track orders through 9 states: CREATED, COLLECTED, IN_PROGRESS, READY, STORED, DELIVERED, CANCELLED, LOST, DELAYED.
FR7: **Service Catalog**: System must support service types (Lavage Complet, Repassage Simple) per linen type.
FR8: **Express Mode**: System must allow "Express" toggle on orders, prioritizing queue and applying specific pricing/deadline.
FR9: **Multi-Item Orders**: System must support multiple items per order, each with its own service type.
FR10: **Shelf Inventory**: System must allow Admin_Site to manage shelf slots (ID, Status).
FR11: **Slot Assignment**: System must allow assigning orders to free slots during `STORED` state (support multi-slot).
FR12: **Thermal Printing**: System must generate 80mm tickets with Giant QR Code and item stickers.

### NonFunctional Requirements

NFR1: **Security (RLS)**: PostgreSQL Row-Level Security (RLS) must be enforced for strict Tenant isolation.
NFR2: **Performance**: Reception interface must support "Fast-Scan" workflows for rapid commercial operations.
NFR3: **Usability (Dashboard)**: Dashboard must provide SaaS-level KPIs (Global CA, Expenses, Net Margin) with site filtering.
NFR4: **UX/UI Consistency**: Visual identity must use "Blue Trust" (#1A5AD7) as primary, with specific semantic colors (Express=Orange/Red, Slot Free=Green, Slot Occupied=Grey).
NFR5: **Printing Latency**: Printing must be handled via a local Node.js Print Proxy (ESC/POS) to minimize latency and dependency on cloud print reliability.

### Additional Requirements

- **Frontend Stack**: Next.js 14 (App Router) with Tailwind CSS.
- **Mobile App**: React Native for the Client Portal.
- **Backend Architecture**: NestJS with Modular Architecture.
- **Authentication**: Keycloak Integration (OIDC) with specific claim mapping.
- **Database**: PostgreSQL with Row-Level Security (RLS) enabled.
- **Caching**: Redis for user sessions and Omnibox search optimization.
- **Ticket Layout**: 80mm thermal ticket, Header (Logo+Info), Center (Giant QR), Footer (SLA).
- **Reception UI**: "Fast-Scan" interface with single Omnibox and item selection by icons.
- **Shelf Management UI**: Visual grid of slots with real-time fill indicators.

### FR Coverage Map

FR1: Epic 1 - IAM Structure & Claims
FR2: Epic 1 - Role Management System
FR3: Epic 2 - Tenant-scoped Client Records
FR4: Epic 2 - Hybrid Search (Omnibox)
FR5: Epic 2 - Unique Code Generation
FR6: Epic 4 (Creation), Epic 5 (Processing), Epic 6 (Delivery) - Full Lifecycle
FR7: Epic 3 - Service Catalog Definition
FR8: Epic 3 - Express Mode Configuration
FR9: Epic 4 - Multi-item Order Intake
FR10: Epic 6 - Shelf/Slot Inventory
FR11: Epic 6 - Slot Assignment
FR12: Epic 4 - Thermal Ticket & Sticker Printing

## Epic List

### Epic 1: Foundation & Identity Access Management
Establish the secure multi-tenant SaaS foundation where Superadmins can onboard Tenants, and Users can authenticate with appropriate roles.
**FRs covered:** FR1, FR2, NFR1

### Epic 2: Client Registry & Digital Identification
Enable agencies to identify customers uniquely across the tenant network using hybrid search (Phone, Name) and assign permanent QR codes.
**FRs covered:** FR3, FR4, FR5

### Epic 3: Service Configuration & Pricing
Empower Tenant Admins to define their service catalog (Laundry, Ironing) and pricing strategies (Express mode) to enforce business rules.
**FRs covered:** FR7, FR8

### Epic 4: Order Reception & Ticketing
Streamline the intake process with a "Fast-Scan" interface that handles multi-item orders and instantly prints thermal receipts with tracking QRs.
**FRs covered:** FR9, FR12, FR6 (Create), NFR2, NFR5

### Epic 5: Operational Workflow Tracking
Enable staff to track and update the status of laundry items through the production cycle (Washing, Drying, Finishing) to ensure SLA compliance.
**FRs covered:** FR6 (Processed -> Ready), NFR3

### Epic 6: Smart Storage & Delivery
Organize finished orders into managed shelf slots and facilitate secure Handover/Delivery verification.
**FRs covered:** FR10, FR11, FR6 (End)

## Epic 1: Foundation & Identity Access Management

Establish the secure multi-tenant SaaS foundation where Superadmins can onboard Tenants, and Users can authenticate with appropriate roles.

### Story 1.0: Project Initialization & Scaffolding

As a Developer,
I want to initialize the project repository and development environment,
So that the team has a stable foundation to build features upon.

**Acceptance Criteria:**

**Given** A fresh git repository
**When** I initialize the Monorepo (or separate projects) for Backend (NestJS) and Frontend (Next.js)
**Then** The basic "Hello World" applications start successfully
**And** Docker Compose is configured to launch PostgreSQL and Keycloak containers locally

### Story 1.1: Superadmin Tenant Onboarding

As a Superadmin,
I want to create a new Tenant (Agency) with a specific sub-domain/ID,
So that I can onboard a new commercial client onto the SaaS platform.

**Acceptance Criteria:**

**Given** I am logged in as a Superadmin
**When** I submit the "Create Tenant" form with Name and Subdomain
**Then** A new Tenant entity is created with a unique UUID
**And** A matching Realm/Config is initialized in Keycloak

### Story 1.2: User Authentication & Role Mapping

As a User,
I want to log in using my credentials and have my specific Role (Superadmin, Admin_Tenant, Admin_Site, etc.) recognized,
So that I can access the correct features.

**Acceptance Criteria:**

**Given** A registered user with assigned roles in Keycloak
**When** They successfully log in via the Login Page
**Then** The JWT token contains the custom `tenant_id` and role claims
**And** The application prevents access to unauthorized routes based on these roles

### Story 1.3: Admin_Tenant Agency Management

As an Admin_Tenant,
I want to configure my agency details and add Admin_Site users,
So that I can delegate management of specific locations.

**Acceptance Criteria:**

**Given** I am logged in as an Admin_Tenant
**When** I access the Agency Settings page
**Then** I can update branding details (Logo, Name)
**And** I can invite new users with the `Admin_Site` role

### Story 1.4: RLS Security Enforcement

As a Tenant Owner,
I want strict data isolation enforced at the database level,
So that my business data is never accessible to other tenants.

**Acceptance Criteria:**

**Given** A multi-tenant database setup
**When** A query is executed by a specific Tenant's user
**Then** The database only returns rows matching that user's `tenant_id`
**And** Direct access to other tenants' data is blocked at the database level

## Epic 2: Client Registry & Digital Identification

Enable agencies to identify customers uniquely across the tenant network using hybrid search (Phone, Name) and assign permanent QR codes.

### Story 2.1: Client Creation & Unique Code Generation

As an User_Site,
I want to register a new client and automatically generate a unique, printable code,
So that they can be identified for future orders.

**Acceptance Criteria:**

**Given** I am on the Client Registration form
**When** I enter a Name and valid Phone Number (E.164) and submit
**Then** A new Client record is created for the Tenant
**And** An 8-character alphanumeric Unique Code is automatically generated (ensuring no duplicates)

### Story 2.2: Hybrid Client Search (Omnibox)

As an User_Site,
I want to find a client by typing their Name, Phone, or Unique Code in a single search box,
So that I can quickly start an order.

**Acceptance Criteria:**

**Given** The Client Search Omnibox
**When** I type a partial Name, Phone number, or exact Unique Code
**Then** The system returns a list of matching clients
**And** I can select the correct client to initiate an order
**And** If no client is found, a "Create New Client" option is displayed

### Story 2.3: Cross-Agency Client Recognition

As an Admin_Tenant,
I want client records to be accessible by all sites within my tenant,
So that a customer can visit any branch.

**Acceptance Criteria:**

**Given** A client created at Site A
**When** A user at Site B (same Tenant) searches for that client's details
**Then** The client record is found and available
**And** A user from a different Tenant CANNOT access this record (RLS check)

## Epic 3: Service Configuration & Pricing

Empower Tenant Admins to define their service catalog (Laundry, Ironing) and pricing strategies (Express mode) to enforce business rules.

### Story 3.1: Article Type Management

As an Admin_Tenant,
I want to define types of articles (e.g., Shirt, Pants, Duvet),
So that they are available for selection in orders.

**Acceptance Criteria:**

**Given** I am on the Service Configuration page
**When** I add a new Article Type (Label, Category)
**Then** It is saved to the database
**And** I can edit or disable existing article types

### Story 3.2: Service & Price List Configuration

As an Admin_Tenant,
I want to set prices for specific services (Wash, Iron, Dry Clean) for each Article Type,
So that the system calculates order totals correctly.

**Acceptance Criteria:**

**Given** An existing Article Type
**When** I assign a Service (e.g., "Full Wash") and set a Base Price
**Then** This combination becomes available for selection in the order screen
**And** Updating the price ONLY affects future orders (price versioning/snapshotting)

### Story 3.3: Express Mode Configuration

As an Admin_Tenant,
I want to configure the surcharge and SLA reduction for "Express" orders,
So that urgent orders are priced and tracked correctly.

**Acceptance Criteria:**

**Given** The Global Tenant Verification Settings
**When** I set the Express Multiplier (e.g., 1.5) and SLA Target (e.g., 24h)
**Then** The system saves these parameters
**And** These values are used to calculate Price and Due Date for new Express orders

## Epic 4: Order Reception & Ticketing

Streamline the intake process with a "Fast-Scan" interface that handles multi-item orders and instantly prints thermal receipts with tracking QRs.

### Story 4.1: Fast-Scan Order Interface

As an User_Site,
I want a streamlined POS interface to quickly add items to an order for a selected client,
So that I can handle queues efficiently.

**Acceptance Criteria:**

**Given** A client is selected in the Omnibox
**When** I tap an Article Icon (e.g., Shirt)
**Then** It is legally added to the current Order Draft with the default service
**And** I can adjust quantity or service type if needed

### Story 4.2: Express Mode Toggling & Calculation

As an User_Site,
I want to toggle "Express" for the entire order,
So that the Price and Due Date update instantly based on configuration.

**Acceptance Criteria:**

**Given** An active Order Draft
**When** I toggle the "Express Mode" switch
**Then** The Total Price increases by the configured logic
**And** The Due Date is recalculated to the Express SLA target (e.g., Tomorrow same time)

### Story 4.3: Order Validation & Persistence

As an User_Site,
I want to validate and save the order,
So that it enters the workflow and financial records.

**Acceptance Criteria:**

**Given** A valid Order Draft with at least 1 item
**When** I click "Validate & Pay" (or just Validate)
**Then** The Order is saved to the database with status `CREATED`
**And** A success confirmation is shown to the operator

### Story 4.4: Thermal Ticket Printing

As an User_Site,
I want the system to automatically print a client receipt and item stickers upon validation,
So that the physical items can be tracked.

**Acceptance Criteria:**

**Given** A successfully validated Order
**When** The system completes persistence
**Then** It sends a print job to the local Print Proxy
**And** The proxy prints 1 Client Receipt (with Giant QR) and N Item Stickers (with Item QRs)

## Epic 5: Operational Workflow Tracking

Enable staff to track and update the status of laundry items through the production cycle (Washing, Drying, Finishing) to ensure SLA compliance.

### Story 5.1: Order Workflow Management

As an User_Site,
I want to scan an item or order to update its status (e.g., from CREATED to IN_PROGRESS to READY),
So that the customer knows the progress.

**Acceptance Criteria:**

**Given** An order or item QR code
**When** I scan it using the workflow scanner
**Then** I can select the new status (e.g., "Ready for Pickup")
**And** The system validates the transition and updates the timestamp

### Story 5.2: Dashboard KPI Visualization

As an Admin_Site,
I want to see real-time KPIs (Orders Received, Ready, Delivered) on my dashboard,
So that I can monitor daily performance.

**Acceptance Criteria:**

**Given** The Admin Dashboard
**When** I load the page
**Then** I see counters for "Orders Today", "Revenue Today", and "Pending Orders"
**And** I can filter these metrics by date range

### Story 5.3: SLA Alerting (Delayed Orders)

As an User_Site,
I want to visually identify orders that are approaching or past their due date,
So that we can prioritize them.

**Acceptance Criteria:**

**Given** The active orders list
**When** An order is within 4 hours of its Due Date
**Then** It is highlighted in Yellow
**And** If the Due Date has passed, it is highlighted in Red

### Story 5.4: Order Status History & Audit Trail [BACKLOG]

As an Admin_Site,
I want to track all status changes for orders with timestamps and user attribution,
So that I can monitor workflow efficiency and maintain an audit trail.

**Acceptance Criteria:**

**Given** An order status is changed by a user
**When** The status transition occurs (e.g., CREATED → IN_PROGRESS)
**Then** A record is created in the order_status_history table with previous status, new status, user ID, and timestamp
**And** I can view the complete history of status changes for any order
**And** The system maintains data isolation per tenant using RLS policies

**Technical Notes:**
- Requires `order_status_history` table migration
- Should be triggered automatically on order status updates
- Enables detailed SLA analysis and workflow optimization

## Epic 6: Smart Storage & Delivery

Organize finished orders into managed shelf slots and facilitate secure Handover/Delivery verification.

### Story 6.1: Shelf Slot Management

As an Admin_Site,
I want to create and manage physical storage slots (e.g., A-01, A-02),
So that we have a digital map of our storage racks.

**Acceptance Criteria:**

**Given** I am on the Storage Configuration page
**When** I create a new slot with ID "A-01"
**Then** The slot is added to the database with status `FREE`
**And** I can view a list of all slots and their status

### Story 6.2: Order Storage Assignment

As an User_Site,
I want to scan a READY order and assign it to a specific Shelf Slot,
So that we know exactly where to find it for retrieval.

**Acceptance Criteria:**

**Given** An Order in `READY` status and a physical slot
**When** I scan the Order Ticket followed by the Slot Label
**Then** The Order is linked to that Slot
**And** The Order status updates to `STORED`
**And** The Slot status updates to `OCCUPIED`

### Story 6.3: Client Pickup & Delivery Verification

As an User_Site,
I want to scan a customer's ticket to locate their package and confirm delivery,
So that the transaction is closed securely.

**Acceptance Criteria:**

**Given** A Customer presenting a ticket for pickup
**When** I scan the QR code
**Then** The system displays the Order details and its Shelf Slot ID
**And** I can click "Confirm Delivery" to mark it as `DELIVERED`
**And** The Shelf Slot status reverts to `FREE`

## Epic 8: Visual Identity System

Refactoring the entire UI to match the "Blue Trust" Premium Specs (#1A5AD7), ensuring a responsive, modern, and consistent experience across all roles.

### Story 8.1: Design System Implementation

As a Developer,
I want to implement the new "Blue Trust" Design System (Tokens, Typography, Colors) in Tailwind,
So that all future components inherit the correct styling automatically.

**Acceptance Criteria:**

**Given** The UI Specs (02-design-system-branding.md)
**When** I configure `tailwind.config.ts` and global CSS
**Then** Colors `primary-500` matches `#1A5AD7`
**And** Typography uses `Inter` font family
**And** I can use global utility classes for "Card", "Button", "Badge"

### Story 8.2: Shell & Navigation Refactor

As a User,
I want a responsive Sidebar and Layout that matches the new design,
So that I can navigate the application intuitively on any device.

**Acceptance Criteria:**

**Given** The Spec `06-spec-visual-journey-04-adminsite.md`
**When** I log in
**Then** I see the new Sidebar with correct icons and active states
**And** The layout responds to mobile (collapsible drawer)

## Epic 9: Audit & Security Logging

Comprehensive tracking of all system actions for compliance, security, and dispute resolution.

### Story 9.1: Audit Logging Backend

As a Superadmin,
I want the system to automatically record every write operation,
So that we have a secure trail of "Who did What".

**Acceptance Criteria:**

**Given** Any API request to create/update/delete data
**When** The request is processed
**Then** An `AuditLog` entry is created (User ID, Endpoint, Payload, Timestamp)
**And** Read operations are NOT logged unless critical

### Story 9.2: Superadmin Audit View

As a Superadmin,
I want to view the global Audit Log,
So that I can investigate issues.

**Acceptance Criteria:**

**Given** The Audit Page
**When** I search for a user or resource ID
**Then** I see a chronological list of actions

## Epic 10: SaaS Subscription Engine

Monetization infrastructure for multi-tenant billing, plan management, usage metering, and access control.

**Design principles:**
- Two limit types: **capacity** (current resource count) vs **usage** (events per time window).
- Multi-window quotas: an operation can have **daily, weekly, monthly, and yearly** limits simultaneously (all must pass).
- Period boundaries use the **tenant timezone** (IANA, default `Europe/Paris`); weeks follow **ISO 8601** (Monday–Sunday).
- Enforcement is **gradual**: warn at 80/90 %, hard block at 100 %; `PAST_DUE` gets a grace period before full suspension.

### Story 10.1: Subscription Plan Configuration

As a Superadmin,
I want to define Subscription Plans (e.g. "Starter", "Pro", "Enterprise"),
So that I can sell different tiers of service.

**Acceptance Criteria:**

**Given** The Plan Management Interface
**When** I create a plan
**Then** I can define Name, Price, Billing Interval (Monthly/Yearly), and operation limits via JSONB
**And** Each operation limit supports multiple time windows (daily, weekly, monthly, yearly)
**And** I can enable/disable feature flags (e.g. remittances, cash_register) per plan

**Technical Notes:**
- `subscription_plans.limits` JSONB structure: `{ "orders.create": { "type": "usage", "windows": [{ "period": "daily", "limit": 20, "enforce": "hard" }, ...] } }`
- Capacity limits use `"period": "none"` (e.g. `sites.capacity`)

### Story 10.2: Tenant Subscription Assignment

As a Superadmin,
I want to assign a Subscription Plan to each Tenant,
So that limits and billing apply from onboarding.

**Acceptance Criteria:**

**Given** A new Tenant is created
**When** Onboarding completes
**Then** A `tenant_subscriptions` record is created (default: Starter or Trial)
**And** The subscription has status, `current_period_start`, and `current_period_end`

**Given** An existing Tenant without subscription
**When** The migration runs
**Then** All tenants receive a default Starter subscription

### Story 10.3: Usage Metering Service

As a System,
I want to count operations per tenant per time window,
So that quotas can be enforced accurately.

**Acceptance Criteria:**

**Given** A metered operation (e.g. `orders.create`)
**When** The operation succeeds
**Then** Usage counters are incremented for **all configured windows** (daily, weekly, monthly, yearly)
**And** Counters are stored in `tenant_usage_periods` with idempotency via resource ID
**And** Period keys respect tenant timezone (`2026-07-29`, `2026-W30`, `2026-07`, `2026`)

### Story 10.4: Quota Service & Multi-Window Enforcement

As a System,
I want to check all applicable quota windows before allowing an operation,
So that tenants cannot exceed any configured limit.

**Acceptance Criteria:**

**Given** A Tenant on Starter plan with orders limits: 20/day, 100/week, 500/month
**When** They attempt their 21st order today
**Then** The system returns `403 QUOTA_EXCEEDED` with window details (`period: daily`, `limit`, `current`, `resetsAt`)
**And** Other window usage is included in the response for UI gauges

**Given** A capacity limit (`sites.capacity: 1`)
**When** They try to add a 2nd Site
**Then** The system blocks the action and prompts to Upgrade

### Story 10.5: Sites Capacity Enforcement

As a System,
I want to enforce max sites per plan,
So that tenants pay for what they use.

**Acceptance Criteria:**

**Given** A Tenant on "Starter" plan (Max 1 Site)
**When** They try to add a 2nd Site
**Then** The system blocks the action with structured quota error

### Story 10.6: Orders Usage Enforcement (Multi-Window)

As a System,
I want to enforce order volume limits across daily, weekly, and monthly windows,
So that usage stays within plan boundaries.

**Acceptance Criteria:**

**Given** A Tenant with monthly limit 500, weekly 100, daily 20
**When** Any single window is exhausted
**Then** Order creation is blocked even if other windows have remaining capacity
**And** Usage is recorded only after successful order persistence

### Story 10.7: Tenant Usage Dashboard

As an Admin_Tenant,
I want to see my current usage against all quota windows,
So that I can anticipate limits and plan upgrades.

**Acceptance Criteria:**

**Given** The Subscription / Usage page
**When** I load it
**Then** I see gauges per operation and window (e.g. Today 18/20, This week 87/100, This month 412/500)
**And** Each gauge shows when the window resets

### Story 10.8: Quota Threshold Alerts

As an Admin_Tenant,
I want to be notified when approaching quota limits,
So that I can upgrade before service disruption.

**Acceptance Criteria:**

**Given** Usage reaches 80 % or 90 % of any window
**When** The threshold is crossed
**Then** An in-app banner is displayed to Admin_Tenant
**And** (Future) An email notification is sent

### Story 10.9: Users & Storage Slots Capacity

As a System,
I want to enforce max users and storage slots per plan,
So that resource usage scales with subscription tier.

**Acceptance Criteria:**

**Given** Plan limits on `users.capacity` and `storage_slots.capacity`
**When** Invite or slot creation would exceed the limit
**Then** The action is blocked with upgrade prompt

### Story 10.10: Enterprise Custom Limits (Superadmin Override)

As a Superadmin,
I want to override plan limits for specific tenants,
So that Enterprise clients get tailored quotas without custom plans.

**Acceptance Criteria:**

**Given** A Tenant with `custom_limits` JSONB on their subscription
**When** Quotas are resolved
**Then** Custom limits merge with (and override) plan defaults per window

### Story 10.11: Subscription Status & Grace Period

As a System,
I want to handle TRIAL, ACTIVE, PAST_DUE, SUSPENDED, and CANCELLED states,
So that billing issues are handled professionally.

**Acceptance Criteria:**

**Given** A subscription in `PAST_DUE` within grace period
**When** The tenant performs read operations
**Then** Access is allowed with a payment warning banner
**And** Write operations on metered resources are blocked after grace expires

### Story 10.12: Stripe Billing Integration [BACKLOG]

As a Superadmin,
I want automated billing via Stripe,
So that subscriptions renew without manual intervention.

### Story 10.13: Superadmin Billing Dashboard [BACKLOG]

As a Superadmin,
I want MRR, churn, and aggregated usage views,
So that I can manage platform monetization.

### Story 10.14: Self-Service Upgrade [BACKLOG]

As an Admin_Tenant,
I want to upgrade my plan from the app,
So that I can increase limits without contacting support.

### Story 10.15: Print & Storage Upload Metering [BACKLOG]

As a System,
I want to meter `prints.ticket` and `storage.upload` per plan,
So that heavy usage can be monetized separately.

### Story 10.16: Usage Reconciliation Job [BACKLOG]

As a System,
I want nightly reconciliation of usage counters,
So that billing records stay accurate.

### Story 10.17: Usage Export for Manual Billing [BACKLOG]

As a Superadmin,
I want CSV export of tenant usage by period,
So that B2B invoicing can be done offline.

### Story 10.18: E2E Quota Tests

As a Developer,
I want automated tests for quota enforcement,
So that regressions are caught before release.

**Acceptance Criteria:**

**Given** E2E tenant on Starter plan
**When** They exceed site or order limits
**Then** API returns `403 QUOTA_EXCEEDED` with correct window metadata

### Story 10.19: Tenant Timezone Configuration

As an Admin_Tenant,
I want my agency timezone configured for quota periods,
So that daily/weekly limits align with my local business day.

**Acceptance Criteria:**

**Given** A tenant with timezone `Indian/Reunion`
**When** Daily quota resets
**Then** Reset occurs at midnight in that timezone, not UTC
**And** Default timezone for new tenants is `Europe/Paris`
