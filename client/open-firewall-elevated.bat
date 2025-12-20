@echo off
REM Elevation VBScript wrapper
REM Ce script demande l'elevation admin et execute le PowerShell

setlocal enabledelayedexpansion

:: Verifier si en mode admin
net.exe session >nul 2>&1
if %errorlevel% neq 0 (
    echo Requesting administrator privileges...
    
    :: Creer un script VBS temporaire pour l'elevation
    set "tempVBS=%temp%\elevate.vbs"
    (
        echo Set objShell = CreateObject("Shell.Application"^)
        echo objShell.ShellExecute "cmd.exe", "/c powershell -ExecutionPolicy Bypass -File ""%~dp0..\scripts\open-firewall.ps1""", "", "runas", 1
    ) > "%tempVBS%"
    
    cscript.exe "%tempVBS%"
    del "%tempVBS%"
) else (
    :: Deja en admin, executer directement
    powershell -ExecutionPolicy Bypass -File "%~dp0..\scripts\open-firewall.ps1"
)

endlocal
