// handleCalculate v2 — shows parser diagnostics in the UI so you can see exactly
// what was found, even when result is empty.
//
// Replace your existing handleCalculate function body with this.

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
    const d = parseResult.diagnostics;
    const bank = parseResult.detectedBank ? `[${parseResult.detectedBank}] ` : "";
    const info = d
      ? ` | rows=${d.totalTxnRows}, withBalance=${d.rowsWithBalance}, uniqueDates=${d.uniqueDates}` +
        (d.firstDate ? `, first=${d.firstDate}` : "") +
        (d.lastDate ? `, last=${d.lastDate}` : "")
      : "";

    console.log("[Diagnostics]" + info);
    if (d?.samplePreview) {
      console.log("[Sample rows]");
      d.samplePreview.forEach((s, i) => console.log("  " + (i + 1) + ". " + s));
    }

    if (!parseResult.monthsData || parseResult.monthsData.length === 0) {
      const warns = (parseResult.parseWarnings || []).join(" ");
      setError(
        bank + "No valid banking data found. " + (warns || "Parser found 0 month buckets.") + info +
        ". Check console → [Sample rows] for the first 5 parsed transaction rows."
      );
      setLoading(false);
      return;
    }

    const selectedMonths = parseResult.monthsData.slice(0, period);
    if (selectedMonths.length === 0) {
      setError(
        bank + `PDF only contains ${parseResult.monthsData.length} month(s) of data, ` +
        `but you selected ${period} months. Try a shorter period.` + info
      );
      setLoading(false);
      return;
    }

    const withABB = selectedMonths.filter(m => m.monthlyABB > 0);
    const overallABB = withABB.length > 0
      ? withABB.reduce((s, m) => s + m.monthlyABB, 0) / withABB.length
      : 0;
    setResult({ monthsData: selectedMonths, overallABB, totalMonthsFound: selectedMonths.length });
    setSuccess(
      bank + "Found " + selectedMonths.length + " month(s). Overall ABB: Rs." +
      overallABB.toFixed(0) + info
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
