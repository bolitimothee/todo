# Script pour ouvrir les ports 3000 et 4000 sur le pare-feu Windows
# Execute with administrator rights if necessary

# Check if PowerShell is running as administrator
$isAdmin = [Security.Principal.WindowsIdentity]::GetCurrent() | 
    ForEach-Object { [Security.Principal.WindowsPrincipal]::new($_) } | 
    ForEach-Object { $_.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator) }

if (-not $isAdmin) {
    Write-Host "Warning: This script requires administrator rights." -ForegroundColor Yellow
    Write-Host "Relaunching with elevation..." -ForegroundColor Yellow
    
    # Relaunch as administrator
    $scriptPath = $MyInvocation.MyCommand.Path
    Start-Process PowerShell -ArgumentList "-ExecutionPolicy Bypass -File `"$scriptPath`"" -Verb RunAs
    exit
}

Write-Host "OK - Running with administrator rights" -ForegroundColor Green
Write-Host ""

# Ports to open
$ports = @(
    @{Port=3000; Name="Vite Dev Server (Frontend)"; Direction="Inbound"},
    @{Port=4000; Name="Backend API Server"; Direction="Inbound"}
)

foreach ($portConfig in $ports) {
    $port = $portConfig.Port
    $name = $portConfig.Name
    $direction = $portConfig.Direction
    
    # Check if rule already exists
    $existingRule = Get-NetFirewallRule -DisplayName "TO_DO_LIST_PRO_$port" -ErrorAction SilentlyContinue
    
    if ($existingRule) {
        Write-Host "OK - Firewall rule for port $port already exists ($name)" -ForegroundColor Green
        # Check if enabled
        if ($existingRule.Enabled -eq $false) {
            Enable-NetFirewallRule -DisplayName "TO_DO_LIST_PRO_$port"
            Write-Host "  OK - Rule enabled" -ForegroundColor Green
        }
    } else {
        Write-Host "Creating firewall rule for port $port ($name)..." -ForegroundColor Cyan
        try {
            New-NetFirewallRule `
                -DisplayName "TO_DO_LIST_PRO_$port" `
                -Description "Allow $name - TO_DO_LIST_PRO application" `
                -Direction $direction `
                -Action Allow `
                -Protocol TCP `
                -LocalPort $port `
                -Program Any `
                -ErrorAction Stop | Out-Null
            Write-Host "  OK - Rule created successfully" -ForegroundColor Green
        } catch {
            Write-Host "  Error: $_" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "SUCCESS - Firewall configured!" -ForegroundColor Green
Write-Host ""
Write-Host "Addresses now accessible from other devices:" -ForegroundColor Yellow
Write-Host "   Local: http://localhost:3000/" -ForegroundColor White
Write-Host "   Network: http://<your-ip>:3000/" -ForegroundColor White
Write-Host ""
