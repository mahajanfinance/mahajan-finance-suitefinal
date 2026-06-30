# Step 1: Add watermark function to loanApplicationPdf.ts
# Insert addWatermark function BEFORE the generateLoanApplicationPdf export

$file = "src\lib\loanApplicationPdf.ts"
$content = [System.IO.File]::ReadAllText($file, [System.Text.UTF8Encoding]::new($false))

# The watermark function to insert
$watermarkFunc = @'

// Watermark function - adds transparent Mahajan Finance text on every page
const addWatermarkToAllPages = (doc: jsPDF): void => {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.saveGraphicsState();
    doc.setGState(new (doc as any).GState({ opacity: 0.06 }));
    doc.setFontSize(52);
    doc.setFont('helvetica', 'bold');
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const centerX = pageWidth / 2;
    const centerY = pageHeight / 2;
    
    // Diagonal watermark
    doc.text('MAHAJAN FINANCE', centerX, centerY, {
      angle: 45,
      align: 'center'
    });
    
    // Second lighter layer for depth effect
    doc.setFontSize(36);
    doc.setGState(new (doc as any).GState({ opacity: 0.03 }));
    doc.text('MAHAJAN FINANCE', centerX + 5, centerY + 5, {
      angle: 45,
      align: 'center'
    });
    
    doc.restoreGraphicsState();
  }
};

'@

# Insert the watermark function right before "export const generateLoanApplicationPdf"
$insertBefore = "export const generateLoanApplicationPdf"
if ($content -notmatch "addWatermarkToAllPages") {
    $content = $content.Replace($insertBefore, $watermarkFunc + $insertBefore)
    [System.IO.File]::WriteAllText($file, $content, [System.Text.UTF8Encoding]::new($false))
    Write-Host "✅ Watermark function added"
} else {
    Write-Host "ℹ️  Watermark function already exists"
}

# Step 2: Call watermark before returning the doc
# Find the last "return doc;" in generateLoanApplicationPdf function
# and add watermark call before it

$content = [System.IO.File]::ReadAllText($file, [System.Text.UTF8Encoding]::new($false))

# In generateLoanApplicationPdf, add watermark call before "return doc;"
# We look for the pattern near the end of the function
$target = "  return doc;`n};`n`nexport const generateLoanApplicationPdfBase64"
$replacement = "  // Add watermark to all pages
  addWatermarkToAllPages(doc);

  return doc;
};

export const generateLoanApplicationPdfBase64"

if ($content -match "addWatermarkToAllPages\(doc\)") {
    Write-Host "ℹ️  Watermark call already exists"
} else {
    $content = $content.Replace($target, $replacement)
    [System.IO.File]::WriteAllText($file, $content, [System.Text.UTF8Encoding]::new($false))
    Write-Host "✅ Watermark call added before return"
}

Write-Host "`nStep 1 complete!"
