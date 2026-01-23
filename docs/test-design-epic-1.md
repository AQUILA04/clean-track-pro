# Test Design: Epic 1 - Foundation & Identity Access Management

**Status**: DRAFT
**Version**: 1.0
**Epic**: Epic 1 (Foundation & Identity Access Management)
**Scope**: Epic-Level Mode (Phase 4)

---

## 1. Risk Assessment

Based on `risk-governance.md` and `probability-impact.md`.

| Risk ID | Category | Requirement/Story | Description | Probability (1-3) | Impact (1-3) | Score (1-9) | Priority | Mitigation Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **R-E1-001** | **SEC** | Story 1.2 / FR1 | **Auth Bypass**: Failure to enforce role-based access allows unauthorized users to access admin features. | 3 (Likely complexity) | 3 (Critical) | **9** | **CRITICAL** | Comprehensive API tests for all role permutations; Security headers scan. |
| **R-E1-002** | **DATA** | Story 1.4 / NFR1 | **RLS Leak**: Tenant isolation failure allows User A to see User B's data from another tenant. | 2 (Possible RLS misconfig) | 3 (Critical) | **6** | **HIGH** | Database-level integration tests asserting row visibility per tenant user; Negative testing. |
| **R-E1-003** | **BUS** | Story 1.1 | **Onboarding Failure**: Superadmin cannot create new tenants, blocking revenue/expansion. | 2 (Possible) | 3 (Critical) | **6** | **HIGH** | E2E smoke test for Tenant Onboarding flow. |
| **R-E1-004** | **TECH** | Story 1.0 (Implicit) | **Foundation Instability**: Application fails to bootstrap or connect to DB/Keycloak in CI/CD. | 2 (Possible) | 3 (Critical - Blocked) | **6** | **HIGH** | Smoke verification of infrastructure (Docker/Env) before running suite. |
| **R-E1-005** | **SEC** | Story 1.2 | **Token Manipulation**: JWT claims (`tenant_id`, `site_ids`) are spoofable or missing. | 1 (Unlikely with Keycloak) | 3 (Critical) | **3** | MEDIUM | Verify JWT signature and claim structure in API tests. |
| **R-E1-006** | **BUS** | Story 1.3 | **Agency Config Error**: Admin_Tenant cannot update branding or invite managers. | 2 (Possible) | 2 (Degraded) | **4** | MEDIUM | Integration tests for Agency settings updates. |

### Risk Summary
*   **Critical (9)**: 1 (Security Auth)
*   **High (6)**: 3 (RLS, Onboarding, Foundation)
*   **Medium (3-4)**: 2
*   **Low (1-2)**: 0

---

## 2. Coverage Plan

Mapping Acceptance Criteria (AC) to Test Levels based on `test-levels-framework.md` and `test-priorities-matrix.md`.

### Story 1.1: Superadmin Tenant Onboarding
| ID | Scenario | Level | Priority | Risk Ref | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1.1-E2E-01** | **Happy Path**: Superadmin logs in, creates Tenant, verifies Tenant ID and Keycloak Realm. | **E2E** | **P0** (Blocker) | R-E1-003 | Verifies full stack + Keycloak integration. |
| **1.1-INT-01** | **Validation**: Attempt to create Tenant with duplicate subdomain/ID. | **API** | **P1** | - | Error handling. |
| **1.1-INT-02** | **Validation**: Attempt to create Tenant with missing fields. | **API** | **P2** | - | Input validation. |

### Story 1.2: User Authentication & Role Mapping
| ID | Scenario | Level | Priority | Risk Ref | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1.2-E2E-01** | **Happy Path**: User logs in and is redirected to correct dashboard based on Role. | **E2E** | **P0** (Blocker) | R-E1-001 | Verifies UI routing + Auth guard. |
| **1.2-API-01** | **RBAC Enforcement**: Verify `Superadmin` can access `/admin`, `Admin_Tenant` cannot. | **API** | **P0** (Blocker) | R-E1-001 | Security control validation. |
| **1.2-API-02** | **RBAC Enforcement**: Verify `Admin_Tenant` can access Tenant Settings, `User_Site` cannot. | **API** | **P0** (Blocker) | R-E1-001 | Security control validation. |
| **1.2-API-03** | **Claim Verification**: Decode JWT and assert `tenant_id` and `site_ids` presence. | **API** | **P1** | R-E1-005 | Contract testing for Auth. |
| **1.2-E2E-02** | **Login Failure**: Invalid credentials display correct error message. | **E2E** | **P1** | - | UX validation. |

### Story 1.3: Admin_Tenant Agency Management
| ID | Scenario | Level | Priority | Risk Ref | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1.3-API-01** | **Update Settings**: Admin_Tenant updates logo/name, changes persist. | **API** | **P1** | R-E1-006 | |
| **1.3-API-02** | **Invite User**: Admin_Tenant invites new Admin_Site, user created in Keycloak. | **API** | **P1** | R-E1-006 | Integration with Identity Provider. |
| **1.3-UNIT-01**| **Form Validation**: Validate agency update payload constraints. | **Unit** | **P2** | - | Fast feedback on logic. |

### Story 1.4: RLS Security Enforcement
| ID | Scenario | Level | Priority | Risk Ref | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1.4-INT-01** | **Isolation (Happy)**: User A queries `clients`, receives only User A's tenant clients. | **Integration** | **P0** (Blocker) | R-E1-002 | Database-level test (TestContainers). |
| **1.4-INT-02** | **Isolation (Attack)**: User A attempts to query User B's client by explicit ID. | **Integration** | **P0** (Blocker) | R-E1-002 | Verify RLS blocks direct ID access. |
| **1.4-INT-03** | **Cross-Tenant Prevention**: Admin_Tenant A cannot list Sites of Tenant B. | **Integration** | **P0** (Blocker) | R-E1-002 | |

---

## 3. Execution Strategy

### Test Execution Order
1.  **Smoke (P0 Subset)** (< 5 min):
    *   1.1-E2E-01 (Tenant Creation)
    *   1.2-E2E-01 (Login Flow)
2.  **Critical Security (P0)** (< 10 min):
    *   1.2-API-01, 1.2-API-02 (RBAC)
    *   1.4-INT-01, 1.4-INT-02 (RLS)
3.  **High Priority (P1)** (< 20 min):
    *   1.1-INT-01, 1.3-API-01, 1.3-API-02

### Resource Estimates
*   **P0 Scenarios**: 6 tests * 1.5h (avg implementation) = ~9 hours
*   **P1 Scenarios**: 5 tests * 1h = ~5 hours
*   **P2 Scenarios**: 2 tests * 0.5h = ~1 hour
*   **Total Effort**: ~15 hours (~2 days)

### Quality Gate Criteria
*   **P0 Pass Rate**: 100% (Mandatory)
*   **P1 Pass Rate**: >= 95%
*   **High Risk (Score >= 6) Mitigation**: 100% coverage
*   **Code Coverage**: >= 80% for Auth & RLS modules

---

## 4. Next Steps & Recommendations

1.  **Immediate**: Implement **Story 1.0 (Foundation)** (Next.js/NestJS/Docker setup) to enable testing.
2.  **Setup**: Configure `TestContainers` for PostgreSQL to support RLS testing (Story 1.4).
3.  **Setup**: Configure a Keycloak mock or container for reproducible Auth testing.
4.  **Execute**: Run `*atdd` workflow to implement failing P0 tests for Story 1.4 (RLS) before implementation.
