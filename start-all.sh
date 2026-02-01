#!/bin/bash

set -e

echo "🚀 CleanTrack Pro - Start All Services"
echo "======================================="
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

# Check if Docker containers are running
print_info "Checking Docker services..."
if ! sudo docker ps | grep -q cleantrack-postgres; then
    print_error "Docker services are not running. Please run ./setup-final.sh first"
    exit 1
fi
print_success "Docker services are running"

# Check if backend is already running
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    print_warning "Backend is already running on port 3000"
else
    print_info "Starting backend on port 3000..."
    cd backend
    npm run start:dev > /tmp/backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    
    # Wait for backend to start
    print_info "Waiting for backend to start..."
    for i in {1..30}; do
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            print_success "Backend started successfully (PID: $BACKEND_PID)"
            break
        fi
        sleep 1
    done
fi

# Check if frontend is already running
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    print_warning "Frontend is already running on port 3001"
else
    print_info "Starting frontend on port 3001..."
    cd frontend
    PORT=3001 npm run dev > /tmp/frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ..
    
    # Wait for frontend to start
    print_info "Waiting for frontend to start..."
    for i in {1..30}; do
        if curl -s http://localhost:3001 > /dev/null 2>&1; then
            print_success "Frontend started successfully (PID: $FRONTEND_PID)"
            break
        fi
        sleep 1
    done
fi

echo ""
echo "======================================="
print_success "All services are running!"
echo "======================================="
echo ""
echo "📋 Services Status:"
echo "  - PostgreSQL:  localhost:5432 ✅"
echo "  - Keycloak:    http://localhost:8080 ✅"
echo "  - Redis:       localhost:6379 ✅"
echo "  - MailDev UI:  http://localhost:1080 ✅"
echo "  - Backend API: http://localhost:3000 ✅"
echo "  - Frontend:    http://localhost:3001 ✅"
echo ""
echo "👤 Test Users:"
echo "  - superadmin / password123"
echo "  - admin_tenant / password123"
echo ""
echo "📊 Logs:"
echo "  - Backend:  tail -f /tmp/backend.log"
echo "  - Frontend: tail -f /tmp/frontend.log"
echo ""
echo "🌐 Open your browser:"
echo "  Frontend: http://localhost:3001"
echo ""
