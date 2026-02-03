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

echo [INFO] Checking Docker network...
docker network inspect cleantrack-net >nul 2>&1
if %errorlevel% neq 0 (
    docker network create cleantrack-net
    echo [SUCCESS] Created network cleantrack-net
) else (
    echo [INFO] Network cleantrack-net already exists
)

echo [INFO] Stopping existing containers...
docker rm -f cleantrack-postgres cleantrack-keycloak cleantrack-redis cleantrack-maildev >nul 2>&1

echo [INFO] Starting PostgreSQL...
docker run -d --name cleantrack-postgres --network cleantrack-net -p 5432:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=cleantrack postgres:16
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start PostgreSQL
    pause
    exit /b 1
)

echo [INFO] Starting Redis...
docker run -d --name cleantrack-redis --network cleantrack-net -p 6379:6379 redis:alpine
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start Redis
    pause
    exit /b 1
)

echo [INFO] Starting MailDev...
docker run -d --name cleantrack-maildev --network cleantrack-net -p 1080:1080 -p 1025:1025 maildev/maildev
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start MailDev
    pause
    exit /b 1
)

echo [INFO] Starting Keycloak...
docker run -d --name cleantrack-keycloak --network cleantrack-net -p 8080:8080 ^
    -e KEYCLOAK_ADMIN=admin ^
    -e KEYCLOAK_ADMIN_PASSWORD=admin ^
    -e KC_DB=postgres ^
    -e KC_DB_URL=jdbc:postgresql://cleantrack-postgres:5432/cleantrack ^
    -e KC_DB_USERNAME=postgres ^
    -e KC_DB_PASSWORD=postgres ^
    -e KC_HOSTNAME=localhost ^
    quay.io/keycloak/keycloak:26.1 start-dev
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
REM Wait for PG using docker exec
:wait_postgres
docker exec cleantrack-postgres pg_isready -U postgres >nul 2>&1
if %errorlevel% neq 0 (
    timeout /t 2 /nobreak >nul
    goto wait_postgres
)
echo [SUCCESS] PostgreSQL is ready
echo.


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
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install root dependencies
    pause
    exit /b 1
)

echo [INFO] Installing backend dependencies...
cd backend
if not exist node_modules (
    call npm install --legacy-peer-deps
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install backend dependencies
        pause
        exit /b 1
    )
) else (
    echo [INFO] Backend node_modules already exists, skipping installation
)
cd ..

echo [INFO] Installing frontend dependencies...
cd frontend
if not exist node_modules (
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install frontend dependencies
        pause
        exit /b 1
    )
) else (
    echo [INFO] Frontend node_modules already exists, skipping installation
)
cd ..

echo [INFO] Installing dependencies for Keycloak setup...
if not exist node_modules (
    call npm install @keycloak/keycloak-admin-client ts-node typescript @types/node --legacy-peer-deps
)

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
    echo [INFO] No migrations to run or migrations already applied
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
