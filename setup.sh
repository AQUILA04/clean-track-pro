#!/bin/bash

set -e

echo "🚀 CleanTrack Pro - Setup Script"
echo "================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored messages
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

# Check if Docker is running
if ! sudo docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

print_success "Docker is running"

# Stop any existing containers
print_info "Stopping any existing containers..."
sudo docker-compose down -v 2>/dev/null || true

# Start infrastructure services
print_info "Starting infrastructure services (PostgreSQL, Keycloak, Redis, MailDev)..."
sudo docker-compose up -d

# Wait for PostgreSQL to be ready
print_info "Waiting for PostgreSQL to be ready..."
until sudo docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
    sleep 2
done
print_success "PostgreSQL is ready"

# Wait for Keycloak to be ready
print_info "Waiting for Keycloak to be ready (this may take a minute)..."
max_attempts=60
attempt=0
until curl -s http://localhost:8080/health/ready > /dev/null 2>&1; do
    attempt=$((attempt + 1))
    if [ $attempt -ge $max_attempts ]; then
        print_error "Keycloak failed to start after $max_attempts attempts"
        exit 1
    fi
    sleep 2
done
print_success "Keycloak is ready"

# Install backend dependencies
print_info "Installing backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
else
    print_warning "Backend node_modules already exists, skipping installation"
fi
cd ..
print_success "Backend dependencies installed"

# Install frontend dependencies
print_info "Installing frontend dependencies..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
else
    print_warning "Frontend node_modules already exists, skipping installation"
fi
cd ..
print_success "Frontend dependencies installed"

# Setup Keycloak
print_info "Configuring Keycloak (realm, client, roles, users)..."
cd backend
npm run keycloak:setup
cd ..
print_success "Keycloak configured"

# Run database migrations
print_info "Running database migrations..."
cd backend
npm run migration:run || print_warning "No migrations to run or migrations already applied"
cd ..
print_success "Database migrations completed"

echo ""
echo "================================="
print_success "Setup completed successfully!"
echo "================================="
echo ""
echo "📋 Services Status:"
echo "  - PostgreSQL:  http://localhost:5432"
echo "  - Keycloak:    http://localhost:8080 (admin/admin)"
echo "  - Redis:       http://localhost:6379"
echo "  - MailDev UI:  http://localhost:1080"
echo "  - MailDev SMTP: localhost:1025"
echo ""
echo "👤 Test Users:"
echo "  - superadmin / password123"
echo "  - admin_tenant / password123"
echo ""
echo "🚀 To start the application:"
echo "  Backend:  cd backend && npm run start:dev"
echo "  Frontend: cd frontend && npm run dev"
echo ""
echo "📧 Email Testing:"
echo "  All emails will be captured by MailDev"
echo "  View them at: http://localhost:1080"
echo ""
