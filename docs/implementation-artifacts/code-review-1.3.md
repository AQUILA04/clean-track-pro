# Code Review Findings: Story 1.3

## 🔴 CRITICAL ISSUES
- **Security Check Missing**: `UserService.inviteUser` explicitly skips the AC-required security check: "Verify requested `siteId` belongs to current `tenantId`". The code has a comment `// Security: In a real app...` admitting this.
- **AC Violation**: `UserService` hardcodes realm to `master`/env, ignoring the AC requirement: "Use the Tenant's Realm (extracted from JWT iss or context)".

## 🟡 MEDIUM ISSUES
- **UX/AC Partial Implementation**: Frontend "Invite User" modal uses a text input for `Site ID` instead of a dropdown. AC explicitly requires: "Fetch available Sites for the dropdown".
- **Error Handling**: `TenantController` uses generic `Error` classes which result in 500 Internal Server Error instead of appropriate 400/403 NestJS exceptions.

## 🟢 LOW ISSUES
- **Documentation**: Tests are mock-heavy and just confirm the incorrect implementation.
