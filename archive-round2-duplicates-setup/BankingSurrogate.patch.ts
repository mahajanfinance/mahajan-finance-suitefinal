// PATCH INSTRUCTIONS for your BankingSurrogate component.
// Replace ONLY your extractText() and handleCalculate() functions with the versions below.
// Everything else stays the same.
//
// Key fixes:
//   1. extractText() now joins items with a SPACE (it already did) AND keeps page breaks
//      so rows don't accidentally merge across pages.
//   2. extractText() logs a snippet of the extracted text so you can verify pdfjs got
//      something usable (text-layer PDFs only — image PDFs need OCR).
//   3. handleCalculate() surfaces parser warnings + detected bank + raw text length
//      in the error/success UI, so you can see WHY it returned 0 months.
//   4. Try a no-password fallback automatically before nagging the user.

async function extractText(file: File): Promise<string> {
  const ab = await file.arrayBuffer();
  const pwd = pdfPassword || undefined;
  const strategies = [
    { data: new Uint8Array(ab), password: pwd },
    { data: ab.slice(0), password: pwd },
    { data: new Uint8Array(ab), password: undefined },
  ];
  for (let i = 0; i < strategies.length; i++) {
    try {
      const doc = await pdfjsLib.getDocument(strategies[i]).promise;
      let text = "";
      for (let p = 1; p <= doc.numPages; p++) {
        const pg = await doc.getPage(p);
        const tc = await pg.getTextContent();
        // Use newline as page separator so transactions don't get merged across pages,
        // and join items within a page with a single space.
        const pageText = tc.items.map((it: any) => it.str).join(" ");
        text += pageText + "\n";
      }
      console.log("Strategy " + (i + 1) + " OK: " + text.length + " chars");
      // Log first 800 chars for debugging
      console.log("PDF TEXT PREVIEW:\n" + text.slice(0, 800));
      return text;
    } catch (e: any) {
      if (e.name === "PasswordException") {
        setNeedPassword(true);
        throw new Error("PASSWORD_REQUIRED");
      }
      console.log("Strategy " + (i + 1) + " failed: " + e.message);
    }
  }
  throw new Error("All PDF loading strategies failed.");
}

const handleCalculate = async () => {
  if (!file) { setError("Please upload a bank statement PDF."); return; }
  setError(""); setSuccess(""); setResult(null); setPaid(false); setNeedPassword(false);
  setLoading(true);
  try {
    const text = await extractText(file);
    if (!text || text.length < 50) {
      setError("Could not extract text from PDF. If this is a scanned/image PDF, OCR is required.");
      setLoading(false);
      return;
    }

    const parseResult = parseBankStatementClient(text, undefined, 12);

    // Surface parser warnings even on failure
    const warns = parseResult.parseWarnings || [];
    const bank = parseResult.detectedBank ? "[" + parseResult.detectedBank + "] " : "";
    const lenInfo = " (extracted " + (parseResult.rawTextLength || 0) + " chars)";

    if (!parseResult.monthsData || parseResult.monthsData.length === 0) {
      const detail = warns.length > 0 ? warns.join(" ") : "Parser found 0 usable month buckets.";
      setError(
        bank + "No valid banking data found. " + detail + lenInfo +
        " Open browser console to see the 'PDF TEXT PREVIEW'. If the preview is garbled or empty, the PDF is image-based and needs OCR."
      );
      setLoading(false);
      return;
    }

    const selectedMonths = parseResult.monthsData.slice(0, period);
    const withABB = selectedMonths.filter(m => m.monthlyABB > 0);
    const overallABB = withABB.length > 0
      ? withABB.reduce((s, m) => s + m.monthlyABB, 0) / withABB.length
      : 0;
    setResult({ monthsData: selectedMonths, overallABB, totalMonthsFound: selectedMonths.length });
    setSuccess(
      bank + "Found " + selectedMonths.length + " month(s). Overall ABB: Rs." +
      overallABB.toFixed(0) + lenInfo
    );
  } catch (err: any) {
    if (err.message === "PASSWORD_REQUIRED") {
      setError("This PDF is password-protected. Please enter the password and try again.");
    } else {
      setError("Failed to parse PDF: " + (err.message || "Unknown error"));
    }
  }
  setLoading(false);
};
