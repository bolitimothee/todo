@echo off
REM Script de demarrage pour TO_DO_LIST_PRO avec ouverture automatique du pare-feu

echo.
echo ============================================================
echo   TO_DO_LIST_PRO - Demarrage serveur de developpement
echo ============================================================
echo.

REM Verifier si PowerShell est disponible
where powershell >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Erreur: PowerShell non trouve
    pause
    exit /b 1
)

REM Executer le script de pare-feu avec elevation
echo Configuration du pare-feu Windows...
echo (Une fenetre d'elevation peut s'afficher)
echo.
call "%~dp0open-firewall-elevated.bat"

REM Demarrer Vite
echo.
echo ============================================================
echo Demarrage du serveur Vite...
echo ============================================================
echo.
cd /d "%~dp0"
call npm run dev

pause
