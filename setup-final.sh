#!/bin/bash

set -e

echo "🚀 CleanTrack Pro - Setup Script (Version Finale)"
echo "=================================================="
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

# Check if Docker is running
if ! sudo docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Starting Docker..."
    sudo systemctl start docker
    sleep 3
fi

print_success "Docker is running"

# Create network if not exists
print_info "Checking Docker network..."
if ! sudo docker network inspect cleantrack-net >/dev/null 2>&1; then
    sudo docker network create cleantrack-net
    print_success "Created network cleantrack-net"
else
    print_info "Network cleantrack-net already exists"
fi

# Clean up any existing containers
print_info "Cleaning up existing containers..."
sudo docker rm -f cleantrack-postgres cleantrack-keycloak cleantrack-redis cleantrack-maildev 2>/dev/null || true

# Start PostgreSQL
print_info "Starting PostgreSQL..."
sudo docker run -d --name cleantrack-postgres --network cleantrack-net -p 5432:5432 \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_DB=cleantrack \
    postgres:16

# Start Redis
print_info "Starting Redis..."
sudo docker run -d --name cleantrack-redis --network cleantrack-net -p 6379:6379 redis:alpine

# Start MailDev
print_info "Starting MailDev..."
sudo docker run -d --name cleantrack-maildev --network cleantrack-net -p 1080:1080 -p 1025:1025 maildev/maildev

# Wait for PostgreSQL to be ready
print_info "Waiting for PostgreSQL to be ready..."
sleep 5
until sudo docker exec cleantrack-postgres pg_isready -U postgres > /dev/null 2>&1; do
    sleep 2
done
print_success "PostgreSQL is ready"

# Start Keycloak
print_info "Starting Keycloak..."
sudo docker run -d --name cleantrack-keycloak --network cleantrack-net -p 8080:8080 \
    -e KEYCLOAK_ADMIN=admin \
    -e KEYCLOAK_ADMIN_PASSWORD=admin \
    -e KC_DB=postgres \
    -e KC_DB_URL=jdbc:postgresql://cleantrack-postgres:5432/cleantrack \
    -e KC_DB_USERNAME=postgres \
    -e KC_DB_PASSWORD=postgres \
    -e KC_HOSTNAME=localhost \
    quay.io/keycloak/keycloak:26.1 start-dev

# Wait for Keycloak to be ready
print_info "Waiting for Keycloak to be ready (this may take 1-2 minutes)..."
max_attempts=60
attempt=0
until curl -s http://localhost:8080/health/ready > /dev/null 2>&1; do
    attempt=$((attempt + 1))
    if [ $attempt -ge $max_attempts ]; then
        print_error "Keycloak failed to start after $max_attempts attempts"
        exit 1
    fi
    sleep 5
done
print_success "Keycloak is ready"

# Install backend dependencies
print_info "Installing backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install --legacy-peer-deps
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

# Install root dependencies for Keycloak setup script
print_info "Installing dependencies for Keycloak setup..."
if [ ! -d "node_modules" ]; then
    npm install @keycloak/keycloak-admin-client ts-node typescript @types/node --legacy-peer-deps
fi

# Setup Keycloak
print_info "Configuring Keycloak (realm, client, roles, users)..."
npx ts-node scripts/setup-keycloak.ts
print_success "Keycloak configured"

# Run database migrations
print_info "Running database migrations..."
cd backend
npm run migration:run || print_warning "No migrations to run or migrations already applied"
cd ..
print_success "Database migrations completed"

echo ""
echo "=================================================="
print_success "Setup completed successfully!"
echo "=================================================="
echo ""
echo "📋 Services Status:"
echo "  - PostgreSQL:  localhost:5432"
echo "  - Keycloak:    http://localhost:8080 (admin/admin)"
echo "  - Redis:       localhost:6379"
echo "  - MailDev UI:  http://localhost:1080"
echo "  - MailDev SMTP: localhost:1025"
echo ""
echo "👤 Test Users:"
echo "  - superadmin / password123"
echo "  - admin_tenant / password123"
echo ""
echo "🚀 To start the application:"
echo "  Option 1 - Start all at once:"
echo "    ./start-all.sh"
echo ""
echo "  Option 2 - Start manually:"
echo "    Backend:  cd backend && npm run start:dev"
echo "    Frontend: cd frontend && PORT=3001 npm run dev"
echo ""
echo "📧 Email Testing:"
echo "  All emails will be captured by MailDev"
echo "  View them at: http://localhost:1080"
echo ""
echo "📊 Backend API:"
echo "  The backend will start on: http://localhost:3000"
echo "  Note: Most endpoints require authentication"
echo ""
