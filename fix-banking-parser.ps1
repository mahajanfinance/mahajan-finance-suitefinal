# =====================================================================
# fix-banking-parser.ps1
# Backs up old BankingSurrogate.tsx + parseBankClient.ts, then drops in
# the v4 parser + patched component.
#
# USAGE:
#   .\fix-banking-parser.ps1                          # auto-detect project
#   .\fix-banking-parser.ps1 -ProjectPath "C:\Code\mahajan-finance"
# =====================================================================

param(
    [string]$ProjectPath = ""
)

$ErrorActionPreference = "Stop"

# ---- 1. Locate project root ----------------------------------------
if (-not $ProjectPath) {
    Write-Host "Auto-detecting project root..." -ForegroundColor Cyan
    $cwd = Get-Location
    while ($cwd -and $cwd.Path -ne $cwd.Parent.Path) {
        if (Test-Path (Join-Path $cwd.Path "package.json")) {
            $ProjectPath = $cwd.Path
            break
        }
        $cwd = $cwd.Parent
    }
}

if (-not $ProjectPath -or -not (Test-Path $ProjectPath)) {
    Write-Host "Could not auto-detect project root." -ForegroundColor Yellow
    $ProjectPath = Read-Host "Enter your project root path (e.g. C:\Code\mahajan-finance)"
}

if (-not (Test-Path $ProjectPath)) {
    Write-Host "Path not found: $ProjectPath" -ForegroundColor Red
    exit 1
}

Write-Host "Project root: $ProjectPath" -ForegroundColor Green

# ---- 2. Find target files ------------------------------------------
# Look for BankingSurrogate.tsx anywhere under src/
$componentCandidates = @(
    Get-ChildItem -Path $ProjectPath -Filter "BankingSurrogate.tsx" -Recurse -File -ErrorAction SilentlyContinue
)
# Look for parseBankClient.ts anywhere under src/ or lib/
$parserCandidates = @(
    Get-ChildItem -Path $ProjectPath -Filter "parseBankClient.ts" -Recurse -File -ErrorAction SilentlyContinue
)

if ($componentCandidates.Count -eq 0) {
    Write-Host "BankingSurrogate.tsx not found under $ProjectPath" -ForegroundColor Red
    exit 1
}
if ($parserCandidates.Count -eq 0) {
    Write-Host "parseBankClient.ts not found under $ProjectPath" -ForegroundColor Red
    exit 1
}

$componentFile = $componentCandidates[0].FullName
$parserFile    = $parserCandidates[0].FullName

Write-Host "Component file: $componentFile" -ForegroundColor Green
Write-Host "Parser file:    $parserFile"    -ForegroundColor Green

# ---- 3. Backup with timestamp --------------------------------------
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$bakDir = Join-Path $ProjectPath ".backup-parser-fix"
if (-not (Test-Path $bakDir)) { New-Item -ItemType Directory -Path $bakDir | Out-Null }

Copy-Item $componentFile (Join-Path $bakDir "BankingSurrogate.tsx.$stamp.bak") -Force
Copy-Item $parserFile    (Join-Path $bakDir "parseBankClient.ts.$stamp.bak")  -Force
Write-Host "Backups saved to: $bakDir" -ForegroundColor Green

# ---- 4. Download new files from local artifacts --------------------
# NOTE: This script expects you to have already copied the new files into
# a sibling folder. Adjust $NewFilesDir if needed.
$NewFilesDir = Read-Host "Enter path to folder containing the NEW BankingSurrogate.tsx and parseBankClient.ts (or press Enter to use current dir)"
if (-not $NewFilesDir) { $NewFilesDir = (Get-Location).Path }

$newComponent = Join-Path $NewFilesDir "BankingSurrogate.tsx"
$newParser    = Join-Path $NewFilesDir "parseBankClient.ts"

if (-not (Test-Path $newComponent)) {
    Write-Host "New BankingSurrogate.tsx not found at: $newComponent" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $newParser)) {
    Write-Host "New parseBankClient.ts not found at: $newParser" -ForegroundColor Red
    exit 1
}

Copy-Item $newComponent $componentFile -Force
Copy-Item $newParser    $parserFile    -Force

Write-Host ""
Write-Host "Files installed successfully." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. cd $ProjectPath"
Write-Host "  2. npm run dev   (or npm run build to type-check)"
Write-Host "  3. Open http://localhost:8080/banking-surrogate"
Write-Host "  4. Upload your IPPB statement again"
Write-Host "  5. Open DevTools (F12) -> Console"
Write-Host "  6. Click 'Calculate ABB'"
Write-Host "  7. Look for these console lines:"
Write-Host "       PDF TEXT PREVIEW:    (first 800 chars of extracted text)"
Write-Host "       [Diagnostics] rows=N, withBalance=N, uniqueDates=N, first=..., last=..."
Write-Host "       [Sample rows]        (first 5 parsed transaction rows)"
Write-Host ""
Write-Host "If it still fails, paste the [Sample rows] output back to me." -ForegroundColor Yellow
