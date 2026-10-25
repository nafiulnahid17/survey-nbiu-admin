@echo off
setlocal
echo NBIU Admin UI patch: remove demo data and add official logo
if not exist "index.html" (
  echo ERROR: Run this script from the admin project root containing index.html.
  pause
  exit /b 1
)
if not exist "admin.js" (
  echo ERROR: admin.js not found in this folder.
  pause
  exit /b 1
)
set "BACKUP=_backup_before_patch"
if not exist "%BACKUP%" mkdir "%BACKUP%"
copy /Y "index.html" "%BACKUP%\index.html" >nul
copy /Y "admin.css" "%BACKUP%\admin.css" >nul
copy /Y "admin.js" "%BACKUP%\admin.js" >nul
copy /Y "nbiu-logo.jpg" "%BACKUP%\nbiu-logo.jpg" >nul 2>&1
copy /Y "%~dp0index.html" "index.html" >nul
copy /Y "%~dp0admin.css" "admin.css" >nul
copy /Y "%~dp0admin.js" "admin.js" >nul
copy /Y "%~dp0nbiu-logo.jpg" "nbiu-logo.jpg" >nul
if errorlevel 1 (
  echo ERROR: Patch copy failed. Review the folder paths and try again.
  pause
  exit /b 1
)
echo.
echo Patch applied. Backup saved in %BACKUP%.
echo Note: Supabase is not connected yet; dashboard will show an empty state, not fake records.
pause
