@echo off
echo ===================================================
echo    Packing Report System - Deployment Helper
echo ===================================================
echo.
echo This script will help you deploy the application to a shared hosting environment.
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed. Please install Node.js before running this script.
    goto :EOF
)

REM Build the React application
echo Building the React application...
cd client
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to build the React application.
    goto :EOF
)
cd ..

REM Create a deployment directory
echo Creating deployment directory...
if exist deploy rmdir /s /q deploy
mkdir deploy
mkdir deploy\api
mkdir deploy\dist

REM Copy PHP files
echo Copying PHP API files...
copy api\*.php deploy\api\
copy index.php deploy\index.php
copy .htaccess deploy\.htaccess

REM Copy built React files
echo Copying built React files...
xcopy /s /i client\dist\* deploy\dist\

REM Copy company logo
echo Copying company logo...
mkdir deploy\attached_assets
copy attached_assets\MCT_GRS_LOGO_NEW.1-removebg-preview.png deploy\attached_assets\

echo.
echo ===================================================
echo Deployment package created successfully!
echo.
echo The deployment package is in the 'deploy' directory.
echo.
echo Next steps:
echo 1. Upload all files in the 'deploy' directory to your web hosting
echo 2. Edit 'api/config.php' with your database details
echo 3. Visit your-domain.com/api/setup.php to set up the database tables
echo 4. Optional: Visit your-domain.com/api/seed.php to add sample data
echo ===================================================