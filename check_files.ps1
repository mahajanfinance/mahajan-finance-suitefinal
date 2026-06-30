# Quick diagnostics - run this first
Write-Host "=== FILE 1: loanApplicationPdf.ts - Last 20 lines ==="
$lines = Get-Content "src\lib\loanApplicationPdf.ts" -Encoding UTF8
$total = $lines.Count
$start = [Math]::Max(0, $total - 25)
for ($i = $start; $i -lt $total; $i++) {
    Write-Host "$($i+1): $($lines[$i])"
}

Write-Host "`n=== FILE 1: GState import check ==="
Select-String -Path "src\lib\loanApplicationPdf.ts" -Pattern "import.*jspdf|import.*jsPDF|GState" | Select-Object -First 5 | ForEach-Object { Write-Host $_.Line.ToString().Trim() }

Write-Host "`n=== FILE 2: LoanApplication.tsx - save() lines ==="
Select-String -Path "src\pages\LoanApplication.tsx" -Pattern "\.save\(" | ForEach-Object { Write-Host "L$($_.LineNumber): $($_.Line.ToString().Trim())" }

Write-Host "`n=== FILE 2: LoanApplication.tsx - first 5 className lines ==="
Select-String -Path "src\pages\LoanApplication.tsx" -Pattern "className" | Select-Object -First 8 | ForEach-Object { Write-Host "L$($_.LineNumber): $($_.Line.ToString().Trim().Substring(0, [Math]::Min(130, $_.Line.ToString().Trim().Length)))" }

Write-Host "`n=== FILE 2: LoanApplication.tsx - submit/success state ==="
Select-String -Path "src\pages\LoanApplication.tsx" -Pattern "isSubmitted|submitted|Application Submitted|Successfully" | Select-Object -First 10 | ForEach-Object { Write-Host "L$($_.LineNumber): $($_.Line.ToString().Trim().Substring(0, [Math]::Min(130, $_.Line.ToString().Trim().Length)))" }

Write-Host "`n=== FILE 3: Edge Function - current line count ==="
$efLines = (Get-Content "supabase\functions\send-enquiry-email\index.ts" -Encoding UTF8).Count
Write-Host "Edge function lines: $efLines"
