param(
  [switch]$SkipCaches,
  [switch]$SkipTests,
  [switch]$SkipInstall
)

$ErrorActionPreference = 'Stop'

function Write-Step($message) {
  Write-Host "`n==== $message ====\n" -ForegroundColor Cyan
}

function Get-Listeners([int]$port) {
  try {
    return Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction Stop
  } catch {
    return @()
  }
}

function Stop-PortListener([int]$port) {
  $listeners = Get-Listeners -port $port
  if (!$listeners -or $listeners.Count -eq 0) {
    return
  }

  foreach ($listener in $listeners) {
    try {
      $process = Get-Process -Id $listener.OwningProcess -ErrorAction SilentlyContinue
      if ($process) {
        Write-Host "Stopping process $($process.ProcessName) (PID $($process.Id)) on port $port" -ForegroundColor Yellow
        Stop-Process -Id $process.Id -Force -ErrorAction Stop
      }
    } catch {
      Write-Warning "Unable to stop process listening on port $port. $_"
    }
  }
}

function Ensure-PortFree([int]$port) {
  $connections = Get-Listeners -port $port
  if ($connections -and $connections.Count -gt 0) {
    Write-Host "Port $port is in use; attempting to free it." -ForegroundColor Yellow
    Stop-PortListener -port $port
    Start-Sleep -Seconds 1
    $stillListening = Get-Listeners -port $port
    if ($stillListening -and $stillListening.Count -gt 0) {
      throw "Port $port is still in use. Stop the process manually and re-run the script."
    }
  }
}

function Invoke-Step([string]$label, [ScriptBlock]$action) {
  Write-Step $label
  $global:LASTEXITCODE = 0
  try {
    & $action
  } catch {
    throw "Step '$label' failed: $_"
  }

  if ($LASTEXITCODE -ne $null -and $LASTEXITCODE -ne 0) {
    $code = $LASTEXITCODE
    $global:LASTEXITCODE = 0
    throw "Step '$label' failed with exit code $code"
  }

  $global:LASTEXITCODE = 0
}

$scriptRoot = Split-Path -Parent $PSCommandPath
$repoRoot = Split-Path -Parent $scriptRoot
Set-Location $repoRoot

Write-Host "Starting SmartLead workspace from $repoRoot" -ForegroundColor Green

Invoke-Step "Ensuring port 3000 is free" { Ensure-PortFree 3000 }

if (-not $SkipInstall -and -not (Test-Path node_modules)) {
  Invoke-Step "Installing dependencies" { npm install }
}

if (-not $SkipCaches) {
  Invoke-Step "Building Redfin cache" { npm run redfin:build-cache }
  Invoke-Step "Building Census cache" { npm run census:build-cache }
  Invoke-Step "Building FRED cache" { npm run fred:build-cache }
  Invoke-Step "Building HUD cache" { npm run hud:build-cache }
} else {
  Write-Host "Skipping cache rebuild (use without -SkipCaches to rebuild)" -ForegroundColor Yellow
}

if (-not $SkipTests) {
  Invoke-Step "Running seller API unit checks" { npx vitest run tests/predictions/seller-api.test.ts }
  Invoke-Step "Running Seller Radar smoke test (Chromium)" { npx playwright test tests/predictions/seller-radar.spec.ts --project=chromium }
} else {
  Write-Host "Skipping test suite (use without -SkipTests to run)" -ForegroundColor Yellow
}

Write-Step "Starting Next.js dev server"
Write-Host "Press Ctrl+C to stop the dev server. Use scripts/dev/stop-dev.ps1 to ensure ports are cleared." -ForegroundColor Green
npm run dev
