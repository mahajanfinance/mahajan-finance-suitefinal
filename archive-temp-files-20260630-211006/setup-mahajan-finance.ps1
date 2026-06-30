# ============================================================
# Mahajan Finance Banking Surrogate - PowerShell Setup
# ============================================================
# Run from your project root (where package.json is):
#   powershell -ExecutionPolicy Bypass -File .\setup-mahajan-finance.ps1
#
# Or simply:  node setup-mahajan-finance.mjs
# ============================================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Mahajan Finance - Banking Surrogate Setup " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js not found! Install from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check package.json
if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: Run this from project root (where package.json is)" -ForegroundColor Red
    exit 1
}

# Look for the .mjs script (same folder or current directory)
$mjsScript = $null
if (Test-Path ".\setup-mahajan-finance.mjs") {
    $mjsScript = ".\setup-mahajan-finance.mjs"
} elseif (Test-Path ".\quick-setup.mjs") {
    $mjsScript = ".\quick-setup.mjs"
}

if ($mjsScript) {
    Write-Host "Running setup script: $mjsScript" -ForegroundColor Yellow
    node $mjsScript
} else {
    Write-Host ""
    Write-Host "ERROR: Setup script not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please download ONE of these files to your project root:" -ForegroundColor Yellow
    Write-Host "  1. setup-mahajan-finance.mjs  (recommended)" -ForegroundColor White
    Write-Host "  2. quick-setup.mjs            (alternative)" -ForegroundColor White
    Write-Host ""
    Write-Host "Then run:  node setup-mahajan-finance.mjs" -ForegroundColor Green
    Write-Host "   or:     node quick-setup.mjs" -ForegroundColor Green
}
