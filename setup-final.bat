@echo off
setlocal enabledelayedexpansion

echo ========================================
echo    CleanTrack Pro - Automated Setup
echo ========================================
echo.

REM Colors are not easily supported in batch, so we'll use simple text

echo [INFO] Starting CleanTrack Pro setup...
echo.

REM Check if Docker is installed
where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed. Please install Docker Desktop for Windows.
    echo Download from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo [SUCCESS] Docker is installed
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running. Please start Docker Desktop.
    pause
    exit /b 1
)

echo [SUCCESS] Docker is running
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 22+
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo [SUCCESS] Node.js is installed
node --version
echo.

REM Step 1: Start Docker containers
echo ========================================
echo Step 1/6: Starting Docker containers
echo ========================================
echo.

echo [INFO] Stopping existing containers...
docker rm -f cleantrack-postgres cleantrack-keycloak cleantrack-redis cleantrack-maildev >nul 2>&1

echo [INFO] Starting PostgreSQL...
docker run -d --name cleantrack-postgres --network host -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=cleantrack postgres:16-alpine
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start PostgreSQL
    pause
    exit /b 1
)

echo [INFO] Starting Redis...
docker run -d --name cleantrack-redis --network host redis:7-alpine
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start Redis
    pause
    exit /b 1
)

echo [INFO] Starting MailDev...
docker run -d --name cleantrack-maildev --network host maildev/maildev
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start MailDev
    pause
    exit /b 1
)

echo [INFO] Starting Keycloak...
docker run -d --name cleantrack-keycloak --network host -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin -e KC_HTTP_PORT=8080 -e KC_HOSTNAME_STRICT=false -e KC_HOSTNAME_STRICT_HTTPS=false -e KC_HTTP_ENABLED=true quay.io/keycloak/keycloak:26.0.7 start-dev
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start Keycloak
    pause
    exit /b 1
)

echo [SUCCESS] All Docker containers started
echo.

REM Step 2: Wait for services
echo ========================================
echo Step 2/6: Waiting for services to be ready
echo ========================================
echo.

echo [INFO] Waiting for PostgreSQL...
timeout /t 10 /nobreak >nul

echo [INFO] Waiting for Keycloak (this may take 1-2 minutes)...
:wait_keycloak
timeout /t 5 /nobreak >nul
curl -s http://localhost:8080/health/ready >nul 2>&1
if %errorlevel% neq 0 goto wait_keycloak

echo [SUCCESS] All services are ready
echo.

REM Step 3: Install dependencies
echo ========================================
echo Step 3/6: Installing dependencies
echo ========================================
echo.

echo [INFO] Installing root dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install root dependencies
    pause
    exit /b 1
)

echo [INFO] Installing backend dependencies...
cd backend
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies
    pause
    exit /b 1
)
cd ..

echo [INFO] Installing frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install frontend dependencies
    pause
    exit /b 1
)
cd ..

echo [SUCCESS] All dependencies installed
echo.

REM Step 4: Configure Keycloak
echo ========================================
echo Step 4/6: Configuring Keycloak
echo ========================================
echo.

echo [INFO] Running Keycloak setup script...
call npx ts-node scripts/setup-keycloak.ts
if %errorlevel% neq 0 (
    echo [ERROR] Failed to configure Keycloak
    pause
    exit /b 1
)

echo [SUCCESS] Keycloak configured
echo.

REM Step 5: Run database migrations
echo ========================================
echo Step 5/6: Running database migrations
echo ========================================
echo.

echo [INFO] Running migrations...
cd backend
call npm run migration:run
if %errorlevel% neq 0 (
    echo [ERROR] Failed to run migrations
    pause
    exit /b 1
)
cd ..

echo [SUCCESS] Migrations completed
echo.

REM Step 6: Summary
echo ========================================
echo Step 6/6: Setup Complete!
echo ========================================
echo.

echo [SUCCESS] CleanTrack Pro is now configured!
echo.
echo Services Status:
echo   - PostgreSQL:  localhost:5432
echo   - Keycloak:    http://localhost:8080
echo   - Redis:       localhost:6379
echo   - MailDev UI:  http://localhost:1080
echo.
echo Test Users:
echo   - superadmin / password123
echo   - admin_tenant / password123
echo.
echo To start the application:
echo   Option 1 - Start all at once:
echo     start-all.bat
echo.
echo   Option 2 - Start manually:
echo     Backend:  cd backend ^&^& npm run start:dev
echo     Frontend: cd frontend ^&^& set PORT=3001 ^&^& npm run dev
echo.
echo Email Testing:
echo   All emails will be captured by MailDev
echo   View them at: http://localhost:1080
echo.

pause
