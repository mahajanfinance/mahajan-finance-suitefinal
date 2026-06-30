# Step 2: Remove auto-download from LoanApplication.tsx
# Find and comment out / remove the doc.save() line

$file = "src\pages\LoanApplication.tsx"
$content = [System.IO.File]::ReadAllText($file, [System.Text.UTF8Encoding]::new($false))

# Remove the auto-download line: doc.save(...)
# It's likely something like: doc.save(`loan-application-${formData.customerName}.pdf`);
# or: const pdfDoc = generateLoanApplicationPdf(data); pdfDoc.save(...);

# Pattern 1: Direct save call
$patterns = @(
    @'\bdoc\.save\([^)]*\);\s*\n'@,
    @'\bpdfDoc\.save\([^)]*\);\s*\n'@
)

$changed = $false
foreach ($pat in $patterns) {
    if ($content -match $pat) {
        Write-Host "Found doc/pdfDoc.save() pattern, removing..."
        $content = $content -replace $pat, ''
        $changed = $true
    }
}

# Also check for: const doc = generateLoanApplicationPdf(data); followed by doc.save
# We want to keep the generateLoanApplicationPdfBase64 call but remove the direct save

if ($changed) {
    [System.IO.File]::WriteAllText($file, $content, [System.Text.UTF8Encoding]::new($false))
    Write-Host "✅ Auto-download removed"
} else {
    Write-Host "ℹ️  No auto-download found - checking for save patterns..."
    # Show lines containing "save" for debugging
    $lines = $content -split "`n"
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match '\.save\(') {
            Write-Host "  Line $($i+1): $($lines[$i].Trim())"
        }
    }
}

Write-Host "`nStep 2 complete!"
