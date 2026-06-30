# Step 4: Make LoanApplication.tsx more attractive
# This script applies targeted enhancements to the page

$file = "src\pages\LoanApplication.tsx"
$content = [System.IO.File]::ReadAllText($file, [System.Text.UTF8Encoding]::new($false))

$changed = $false

# --- Enhancement 1: Add gradient background to the main container ---
# Find the outermost div/return and add a gradient background
$oldOuterDiv = 'return ('
if ($content -match 'className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50"') {
    Write-Host "ℹ️  Gradient background already exists"
} elseif ($content -match 'min-h-screen') {
    Write-Host "Checking outer container class..."
    $lines = $content -split "`n"
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match 'min-h-screen' -and $lines[$i] -match 'className') {
            Write-Host "  Found at line $($i+1): $($lines[$i].Trim().Substring(0, [Math]::Min(120, $lines[$i].Trim().Length)))"
        }
    }
}

# --- Enhancement 2: Replace basic header with attractive one ---
# Look for the main heading/title of the form
$oldHeadingPatterns = @(
    'Loan Application',
    'Apply for Loan',
    'Personal Loan Application'
)

foreach ($hp in $oldHeadingPatterns) {
    if ($content -match [regex]::Escape($hp)) {
        Write-Host "Found heading text: '$hp'"
        break
    }
}

# --- Enhancement 3: Add decorative elements + card shadow improvements ---
# Enhance form card styling
if ($content -match 'shadow-lg' -and $content -match 'rounded-2xl') {
    Write-Host "ℹ️  Card has shadow-lg and rounded-2xl - good base"
} else {
    Write-Host "Checking form card styling..."
}

# --- Enhancement 4: Add success animation class ---
# Enhance the success state display
if ($content -match 'isSubmitted.*true' -or $content -match 'submitted.*true') {
    Write-Host "ℹ️  Found submission success state"
}

# Show current form container pattern
$lines = $content -split "`n"
Write-Host "`n--- Key lines in LoanApplication.tsx ---"
$patternMatches = @('className', 'min-h-screen', 'return', 'h1|<h1|heading', 'gradient', 'shadow', 'rounded', 'submit|Submit', 'isSubmitted|submitted')
$lineNum = 0
foreach ($line in $lines) {
    $lineNum++
    foreach ($pm in $patternMatches) {
        if ($line -match $pm) {
            $truncated = $line.Trim()
            if ($truncated.Length -gt 150) { $truncated = $truncated.Substring(0, 150) + "..." }
            Write-Host "  L$lineNum : $truncated"
            break
        }
    }
}

Write-Host "`nNOTE: For UI attractiveness, I'll provide the enhanced page sections below."
Write-Host "Step 4 analysis complete!"
