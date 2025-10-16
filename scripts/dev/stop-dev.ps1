param(
  [int[]]$Ports = @(3000, 9323, 9229),
  [switch]$KillNode,
  [switch]$VerboseOutput
)

$ErrorActionPreference = 'Stop'

function Stop-PortListener([int]$port) {
  $listeners = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  if (!$listeners) {
    if ($VerboseOutput) {
      Write-Host "No listeners found on port $port" -ForegroundColor Gray
    }
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
      Write-Warning "Unable to stop process on port $port. $_"
    }
  }
}

Write-Host "Ensuring dev resources are shut down..." -ForegroundColor Cyan

foreach ($port in $Ports) {
  Stop-PortListener -port $port
}

if ($KillNode) {
  Write-Host "Terminating remaining node/npm processes" -ForegroundColor Yellow
  Get-Process node, npm -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
}

Write-Host "Active node/npm processes:" -ForegroundColor Cyan
Get-Process node, npm -ErrorAction SilentlyContinue | Format-Table Id, ProcessName, StartTime

Write-Host "If any unwanted processes remain, stop them with Stop-Process -Id <PID>." -ForegroundColor Yellow
