@echo off
setlocal enabledelayedexpansion

echo ========================================
echo    CleanTrack Pro - Start All Services
echo ========================================
echo.

REM Check if Docker containers are running
echo [INFO] Checking Docker services...
docker ps | findstr cleantrack-postgres >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker services are not running. Please run setup-final.bat first
    pause
    exit /b 1
)

echo [SUCCESS] Docker services are running
echo.

REM Check if backend is already running
echo [INFO] Checking if backend is already running...
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARNING] Backend is already running on port 3000
) else (
    echo [INFO] Starting backend on port 3000...
    start "CleanTrack Backend" cmd /c "cd backend && npm run start:dev"
    
    echo [INFO] Waiting for backend to start...
    timeout /t 15 /nobreak >nul
    
    curl -s http://localhost:3000 >nul 2>&1
    if %errorlevel% equ 0 (
        echo [SUCCESS] Backend started successfully
    ) else (
        echo [WARNING] Backend may still be starting...
    )
)

echo.

REM Check if frontend is already running
echo [INFO] Checking if frontend is already running...
curl -s http://localhost:3001 >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARNING] Frontend is already running on port 3001
) else (
    echo [INFO] Starting frontend on port 3001...
    start "CleanTrack Frontend" cmd /c "cd frontend && set PORT=3001 && npm run dev"
    
    echo [INFO] Waiting for frontend to start...
    timeout /t 15 /nobreak >nul
    
    curl -s http://localhost:3001 >nul 2>&1
    if %errorlevel% equ 0 (
        echo [SUCCESS] Frontend started successfully
    ) else (
        echo [WARNING] Frontend may still be starting...
    )
)

echo.
echo ========================================
echo [SUCCESS] All services are running!
echo ========================================
echo.
echo Services Status:
echo   - PostgreSQL:  localhost:5432
echo   - Keycloak:    http://localhost:8080
echo   - Redis:       localhost:6379
echo   - MailDev UI:  http://localhost:1080
echo   - Backend API: http://localhost:3000
echo   - Frontend:    http://localhost:3001
echo.
echo Test Users:
echo   - superadmin / password123
echo   - admin_tenant / password123
echo.
echo Logs:
echo   Backend and Frontend are running in separate windows
echo   Check those windows for logs and errors
echo.
echo Open your browser:
echo   Frontend: http://localhost:3001
echo.

pause
