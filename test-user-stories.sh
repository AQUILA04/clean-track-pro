#!/bin/bash

set -e

echo "🧪 CleanTrack Pro - User Stories Testing"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_test() {
    echo -e "${YELLOW}🧪 $1${NC}"
}

# Check if backend is running
if ! curl -s http://localhost:3001/health > /dev/null 2>&1; then
    print_error "Backend is not running. Please start it with: cd backend && npm run start:dev"
    exit 1
fi

# Check if frontend is running
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    print_warning "Frontend is not running. Some tests may fail."
    print_info "Start it with: cd frontend && npm run dev"
fi

print_success "Backend is running"

# Test Epic 1: Foundation & Identity Access Management
echo ""
echo "========================================="
echo "Epic 1: Foundation & IAM"
echo "========================================="

print_test "Story 1.1: Superadmin Tenant Onboarding"
print_info "Testing tenant creation endpoint..."
# Test will be implemented based on actual API endpoints

print_test "Story 1.2: User Authentication & Role Mapping"
print_info "Testing authentication with superadmin..."
# Test authentication

print_test "Story 1.3: Admin_Tenant Agency Management"
print_info "Testing agency management endpoints..."

print_test "Story 1.4: RLS Security Enforcement"
print_info "Testing row-level security..."

# Test Epic 2: Client Registry & Digital Identification
echo ""
echo "========================================="
echo "Epic 2: Client Registry"
echo "========================================="

print_test "Story 2.1: Client Creation & Unique Code Generation"
print_info "Testing client creation with unique code..."

print_test "Story 2.2: Hybrid Client Search (Omnibox)"
print_info "Testing client search by phone, name, and code..."

print_test "Story 2.3: Cross-Agency Client Recognition"
print_info "Testing cross-agency client access..."

# Test Epic 3: Service Configuration & Pricing
echo ""
echo "========================================="
echo "Epic 3: Service Configuration"
echo "========================================="

print_test "Story 3.1: Article Type Management"
print_info "Testing article type CRUD operations..."

print_test "Story 3.2: Service & Price List Configuration"
print_info "Testing service pricing configuration..."

print_test "Story 3.3: Express Mode Configuration"
print_info "Testing express mode settings..."

# Test Epic 4: Order Reception & Ticketing
echo ""
echo "========================================="
echo "Epic 4: Order Reception"
echo "========================================="

print_test "Story 4.1: Fast-Scan Order Interface"
print_info "Testing order creation interface..."

print_test "Story 4.2: Express Mode Toggling & Calculation"
print_info "Testing express mode price calculation..."

print_test "Story 4.3: Order Validation & Persistence"
print_info "Testing order validation and save..."

print_test "Story 4.4: Thermal Ticket Printing"
print_info "Testing ticket generation..."

# Test Epic 5: Operational Workflow Tracking
echo ""
echo "========================================="
echo "Epic 5: Workflow Tracking"
echo "========================================="

print_test "Story 5.1: Order Workflow Management"
print_info "Testing order status transitions..."

print_test "Story 5.2: Dashboard KPI Visualization"
print_info "Testing dashboard metrics..."

print_test "Story 5.3: SLA Alerting (Delayed Orders)"
print_info "Testing SLA alerts..."

# Test Epic 6: Smart Storage & Delivery
echo ""
echo "========================================="
echo "Epic 6: Storage & Delivery"
echo "========================================="

print_test "Story 6.1: Shelf Slot Management"
print_info "Testing shelf slot CRUD operations..."

print_test "Story 6.2: Order Storage Assignment"
print_info "Testing order-to-slot assignment..."

print_test "Story 6.3: Client Pickup & Delivery Verification"
print_info "Testing delivery verification..."

echo ""
echo "========================================="
print_info "Test suite execution completed"
print_warning "Detailed API tests need to be implemented based on actual endpoints"
echo "========================================="
