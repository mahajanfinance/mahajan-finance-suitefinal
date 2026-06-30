import React, { useState, useRef } from "react";
import { parseBankStatementClient, calculateRiskAssessment, calculateEMI, type ClientParseResult } from "../lib/parseBankClient";
import { formatIndianCurrency, type RiskAssessment, type EMICalculation, type AdminSettings } from "../lib/bankingTypes";
import { downloadBankingPDF } from "../lib/generateBankPdf";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

// pdfjs-dist - dynamic import for Vite compatibility
let pdfjsLib: any = null;

declare global { interface Window { Razorpay: any; } }

const PRICING: Record<number, number> = { 1: 19, 3: 39, 6: 69, 12: 99 };
const ALL_BANKS = [
  "State Bank of India", "Punjab National Bank", "Bank of Baroda", "Canara Bank",
  "Union Bank of India", "Indian Bank", "Bank of India", "UCO Bank",
  "Central Bank of India", "Bank of Maharashtra", "Punjab & Sind Bank",
  "Indian Overseas Bank", "HDFC Bank", "ICICI Bank", "Axis Bank",
  "Kotak Mahindra Bank", "IndusInd Bank", "YES Bank", "IDFC FIRST Bank",
  "Federal Bank", "South Indian Bank", "RBL Bank", "Bandhan Bank",
  "CSB Bank", "DCB Bank", "Tamilnad Mercantile Bank", "Karur Vysya Bank",
  "Karnataka Bank", "City Union Bank", "Dhanlaxmi Bank",
  "AU Small Finance Bank", "Ujjivan Small Finance Bank", "Equitas Small Finance Bank",
  "ESAF Small Finance Bank", "Fincare Small Finance Bank", "Suryoday Small Finance Bank",
  "Jana Small Finance Bank", "North East Small Finance Bank", "Unity Small Finance Bank",
  "Saraswat Co-operative Bank", "Cosmos Co-operative Bank",
  "Shamrao Vithal Co-operative Bank", "Abhyudaya Co-operative Bank",
  "NKGSB Co-operative Bank", "Apna Sahakari Bank", "TJSB Sahakari Bank",
  "Janata Sahakari Bank", "Rajkot Nagrik Sahakari Bank",
  "India Post Payments Bank", "Airtel Payments Bank", "Paytm Payments Bank",
  "Fino Payments Bank", "NSDL Payments Bank", "Other"
];

/** Indian currency formatting for display */
const fmt = (n: number) => (n === 0 || isNaN(n)) ? "N/A" : formatIndianCurrency(n);
const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

export default function BankingSurrogate() {
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [customerLocation, setCustomerLocation] = useState("");
  const [bankName, setBankName] = useState("India Post Payments Bank");
  const [period, setPeriod] = useState(6);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClientParseResult | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [paid, setPaid] = useState(false);
  const [tab, setTab] = useState<"upload" | "autofetch">("upload");
  const fileRef = useRef<HTMLInputElement>(null);
  const [pdfPassword, setPdfPassword] = useState("");
  const [needPassword, setNeedPassword] = useState(false);
  const [diag, setDiag] = useState("");

  // Admin configurable settings
  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
    loanMultiplier: 20,
    interestRate: 14,
    defaultTenure: 6,
  });

  async function extractText(file: File): Promise<string> {
    if (!pdfjsLib) {
      // Wait for dynamic import to complete
      const mod = await import("pdfjs-dist");
      pdfjsLib = mod;
      const ver = mod.version || "6.1.200";
      mod.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@" + ver + "/build/pdf.worker.min.mjs";
    }
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
          text += tc.items.map((it: any) => it.str).join(" ") + "\n";
        }
        console.log("Strategy " + (i + 1) + " OK: " + text.length + " chars");
        console.log("PDF TEXT PREVIEW:\n" + text.slice(0, 800));
        return text;
      } catch (e: any) {
        if (e.name === "PasswordException") { setNeedPassword(true); throw new Error("PASSWORD_REQUIRED"); }
        console.log("Strategy " + (i + 1) + " failed: " + e.message);
      }
    }
    throw new Error("All PDF loading strategies failed.");
  }

  const handleCalculate = async () => {
    if (!file) { setError("Please upload a bank statement PDF."); return; }
    setError(""); setSuccess(""); setResult(null); setPaid(false);
    setNeedPassword(false); setDiag(""); setLoading(true);
    try {
      const text = await extractText(file);
      if (!text || text.length < 50) {
        setError("Could not extract text from PDF. If this is a scanned/image PDF, OCR is required.");
        setLoading(false); return;
      }

      const parseResult = parseBankStatementClient(text);

      // Diagnostics
      const d = parseResult.diagnostics;
      const bank = parseResult.bankName ? "[" + parseResult.bankName + "] " : "";
      const info = d
        ? "rows=" + d.totalTxnRows +
          ", withBalance=" + d.rowsWithBalance +
          ", uniqueDates=" + d.uniqueDates +
          (d.firstDate ? ", first=" + d.firstDate : "") +
          (d.lastDate ? ", last=" + d.lastDate : "")
        : "";
      console.log("[Diagnostics] " + info);
      if (d?.samplePreview) {
        console.log("[Sample rows]");
        d.samplePreview.forEach((s, i) => console.log("  " + (i + 1) + ". " + s));
      }
      setDiag(bank + info);

      if (!parseResult.monthsData || parseResult.monthsData.length === 0) {
        const warns = (parseResult.parseWarnings || []).join(" ");
        setError(
          bank + "No valid banking data found. " + (warns || "Parser found 0 month buckets.") +
          " | " + info + ". Check DevTools console."
        );
        setLoading(false); return;
      }

      // FIX: Dynamic period detection - use detected period, not hardcoded
      const detectedPeriod = parseResult.detectedPeriod;
      const effectivePeriod = detectedPeriod;
      setPeriod(effectivePeriod);

      // Update admin tenure to match detected period
      setAdminSettings(prev => ({ ...prev, defaultTenure: effectivePeriod }));

      // Use ALL months found in statement - no clamping
      const selectedMonths = parseResult.monthsData;
      const withABB = selectedMonths.filter(m => m.monthlyABB > 0);
      const overallABB = withABB.length > 0
        ? withABB.reduce((s, m) => s + m.monthlyABB, 0) / withABB.length
        : 0;

      setResult({
        ...parseResult,
        monthsData: selectedMonths,
        overallABB,
        totalMonthsFound: selectedMonths.length,
        detectedPeriod: effectivePeriod,
      });

      setSuccess(
        bank + "Found " + selectedMonths.length + " month(s). Detected Period: " +
        (effectivePeriod === 1 ? "1 Month" : effectivePeriod + " Months") +
        ". Overall ABB: " + fmt(overallABB) + " | " + info
      );
    } catch (err: any) {
      if (err.message === "PASSWORD_REQUIRED") {
        setError("This PDF is password-protected. Please enter the password.");
      } else {
        setError("Failed to parse PDF: " + (err.message || "Unknown error"));
      }
    }
    setLoading(false);
  };

  const handleDownload = async () => {
    if (!result) { setError("Calculate ABB first."); return; }
    const amount = PRICING[period] || 39;
    const pLabel = period === 1 ? "1 Month" : period + " Months";
    const options = {
      key: "rzp_test_T4KRRFabwHv6dz", amount: amount * 100, currency: "INR",
      name: "Mahajan Finance", description: "Banking Surrogate - " + pLabel,
      handler: function (response: any) {
        if (result) downloadBankingPDF(
          result, period, customerName, customerMobile, customerLocation, bankName,
          riskAssessment, emiCalculation, adminSettings
        );
        setPaid(true);
      },
      // NOTE: Removed prefill.contact (mobile) from payment page per requirement #8
      prefill: { name: customerName },
      theme: { color: "#1E40AF" },
    };
    if (!(window as any).Razorpay) {
      await new Promise<void>((res, rej) => {
        const s = document.createElement("script");
        s.src = "https://checkout.razorpay.com/v1/checkout.js";
        s.onload = () => res();
        s.onerror = rej;
        document.head.appendChild(s);
      });
    }
    const rzp = new (window as any).Razorpay(options);
    rzp.on("payment.failed", function (resp: any) {
      setError("Payment failed: " + (resp.error?.description || "Unknown"));
    });
    rzp.open();
  };

  // Computed values
  const riskAssessment: RiskAssessment = result
    ? calculateRiskAssessment(result, adminSettings.loanMultiplier)
    : { riskScore: 0, healthGrade: "C", lendingRemarks: "Not assessed", suggestedMaxLoan: 0 };

  const emiCalculation: EMICalculation = result
    ? calculateEMI(Math.round(result.overallABB * adminSettings.loanMultiplier), adminSettings.interestRate, adminSettings.defaultTenure)
    : { loanAmount: 0, interestRate: adminSettings.interestRate, tenure: adminSettings.defaultTenure, monthlyEMI: 0, totalInterest: 0, totalRepayment: 0 };

  const summaryStats = result ? (() => {
    const all = result.monthsData.flatMap(m => m.dayBalances.filter(d => d.balance > 0).map(d => d.balance));
    return {
      avg: all.length > 0 ? all.reduce((a, b) => a + b, 0) / all.length : 0,
      max: all.length > 0 ? Math.max(...all) : 0,
      min: all.length > 0 ? Math.min(...all) : 0,
      best: result.monthsData.reduce((b, m) => m.monthlyABB > (b?.monthlyABB || 0) ? m : b, result.monthsData[0]),
      low: result.monthsData.reduce((l, m) => m.monthlyABB < (l?.monthlyABB || Infinity) ? m : l, result.monthsData[0]),
    };
  })() : null;

  // Chart data for Cash Flow Trend
  const chartData = result
    ? result.monthsData.map(m => ({
        month: m.monthLabel,
        closingBalance: m.closingBalance,
        monthlyABB: m.monthlyABB,
        credits: m.totalCredits,
        debits: m.totalDebits,
      }))
    : [];

  const gradeColor = (grade: string) => {
    if (grade === "A+") return "text-green-600 bg-green-50 border-green-200";
    if (grade === "A") return "text-green-500 bg-green-50 border-green-200";
    if (grade === "B+") return "text-yellow-600 bg-yellow-50 border-yellow-200";
    if (grade === "B") return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-8 text-white shadow-xl">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -right-4 top-16 h-24 w-24 rounded-full bg-white/5" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-3xl font-bold shadow-lg">M</div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Banking Surrogate / ABB Calculator</h1>
              <p className="text-blue-100 text-sm mt-1">Mahajan Finance - Upload bank statement to calculate ABB and check loan eligibility</p>
            </div>
          </div>
        </div>

        {/* Tab buttons */}
        <div className="flex gap-2">
          <button onClick={() => setTab("upload")} className={"px-6 py-3 rounded-xl font-semibold text-sm transition-all " + (tab === "upload" ? "bg-blue-600 text-white shadow-lg" : "bg-white text-gray-600 border hover:bg-gray-50")}>Upload Bank Statement</button>
          <button onClick={() => setTab("autofetch")} className={"px-6 py-3 rounded-xl font-semibold text-sm transition-all " + (tab === "autofetch" ? "bg-blue-600 text-white shadow-lg" : "bg-white text-gray-600 border hover:bg-gray-50")}>Auto Fetch (Coming Soon)</button>
        </div>

        {tab === "autofetch" ? (
          <div className="rounded-2xl bg-white p-10 shadow-lg border text-center">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Auto Bank Fetch</h3>
            <p className="text-gray-500 max-w-md mx-auto">Account Aggregator (AA) framework integration required. Needs RBI-approved AA partnership, customer consent, and secure API integration.</p>
            <p className="text-blue-600 font-medium mt-4">Coming Soon - Contact Mahajan Finance for updates</p>
          </div>
        ) : (<>

          {/* Customer Information */}
          <div className="rounded-2xl bg-white p-6 shadow-lg border border-blue-100">
            <h2 className="text-lg font-semibold text-blue-800 mb-4">Customer Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition" placeholder="Enter full name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile <span className="text-red-500">*</span></label>
                <input type="tel" value={customerMobile} onChange={e => setCustomerMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition" placeholder="10-digit mobile" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input type="text" value={customerLocation} onChange={e => setCustomerLocation(e.target.value)} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition" placeholder="City or district" />
              </div>
            </div>
          </div>

          {/* Bank & Analysis Period */}
          <div className="rounded-2xl bg-white p-6 shadow-lg border border-blue-100">
            <h2 className="text-lg font-semibold text-blue-800 mb-4">Bank & Analysis Period</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Bank (type to search)</label>
                <input type="text" list="bank-list" value={bankName} onChange={e => setBankName(e.target.value)} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition" placeholder="Search bank..." />
                <datalist id="bank-list">{ALL_BANKS.map(b => <option key={b} value={b} />)}</datalist>
                <p className="text-xs text-gray-400 mt-1">{ALL_BANKS.length} banks available</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Analysis Period (Auto-detected from statement)</label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 3, 6, 12].map(p => (
                    <button key={p} type="button" onClick={() => setPeriod(p)} className={"rounded-xl py-2.5 text-sm font-semibold transition-all " + (period === p ? "bg-blue-600 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>{p === 1 ? "1 Month" : p + " Months"}</button>
                  ))}
                </div>
                <div className="text-xs text-gray-600 mt-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
                  <span className="font-semibold text-amber-700">Note:</span> Period is automatically detected from the uploaded statement. No hardcoded value.
                </div>
                <div className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="font-semibold text-gray-700 mb-1">Pricing:</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                    <span>1 Month - Rs.19</span><span>3 Months - Rs.39</span>
                    <span>6 Months - Rs.69</span><span>12 Months - Rs.99</span>
                  </div>
                  <div className="mt-1 text-green-600 font-semibold">Detected: {period === 1 ? "1 Month" : period + " Months"} = Rs.{PRICING[period] || 39}</div>
                </div>
              </div>
            </div>
            {needPassword && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">PDF Password</label>
                <input type="password" value={pdfPassword} onChange={e => setPdfPassword(e.target.value)} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition" placeholder="Enter PDF password" />
              </div>
            )}
          </div>

          {/* Admin Configurable Settings */}
          <div className="rounded-2xl bg-white p-6 shadow-lg border border-blue-100">
            <h2 className="text-lg font-semibold text-blue-800 mb-4">Loan Settings (Configurable)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loan Multiplier</label>
                <div className="flex gap-2">
                  {[15, 20, 25, 30].map(m => (
                    <button key={m} type="button" onClick={() => setAdminSettings(s => ({ ...s, loanMultiplier: m }))} className={"rounded-lg px-3 py-2 text-sm font-semibold transition-all " + (adminSettings.loanMultiplier === m ? "bg-blue-600 text-white shadow" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>{m}x</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (% p.a.)</label>
                <input type="number" value={adminSettings.interestRate} onChange={e => setAdminSettings(s => ({ ...s, interestRate: parseFloat(e.target.value) || 14 }))} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition" step="0.5" min="1" max="36" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tenure (Months)</label>
                <input type="number" value={adminSettings.defaultTenure} onChange={e => setAdminSettings(s => ({ ...s, defaultTenure: parseInt(e.target.value) || 6 }))} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition" min="1" max="60" />
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div onClick={() => fileRef.current?.click()} className={"relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all " + (file ? "border-green-400 bg-green-50" : "border-blue-300 bg-blue-50/50 hover:border-blue-500 hover:bg-blue-50")}>
            <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setNeedPassword(false); setError(""); setDiag(""); } }} />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-xl">&#x2705;</div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-800 truncate max-w-xs">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button type="button" onClick={e => { e.stopPropagation(); setFile(null); setResult(null); setPaid(false); setDiag(""); }} className="ml-2 text-gray-400 hover:text-red-500 text-xl">&times;</button>
              </div>
            ) : (
              <>
                <p className="text-4xl mb-2">&#x1F4C4;</p>
                <p className="text-sm font-medium text-blue-700">Click to upload bank statement (PDF)</p>
                <p className="text-xs text-gray-400 mt-1">Supports all major Indian banks | Period will be auto-detected</p>
              </>
            )}
          </div>

          {/* Calculate Button - Dynamic period label */}
          <button type="button" onClick={handleCalculate} disabled={loading || !file} className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white font-semibold text-lg shadow-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3">
            {loading ? (
              <><span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span> Processing...</>
            ) : (
              <>Calculate ABB - Auto-detect Period from Statement</>
            )}
          </button>

          {/* Diagnostics */}
          {diag && (
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs font-mono text-blue-800">
              <span className="font-semibold">Parser diagnostics: </span>{diag}
            </div>
          )}
          {error && <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">{error}</div>}
          {success && <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-700">{success}</div>}

          {/* ─── RESULTS ─── */}
          {result && result.monthsData?.length > 0 && (
            <div className="space-y-6">

              {/* Key Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-2xl p-5 bg-blue-50 border border-blue-200">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">OVERALL ABB</p>
                  <p className="text-xl font-bold mt-1 text-blue-700">{fmt(result.overallABB || 0)}</p>
                </div>
                <div className="rounded-2xl p-5 bg-green-50 border border-green-200">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">ELIGIBLE LOAN ({adminSettings.loanMultiplier}x)</p>
                  <p className="text-xl font-bold mt-1 text-green-700">{fmt(emiCalculation.loanAmount)}</p>
                </div>
                <div className="rounded-2xl p-5 bg-amber-50 border border-amber-200">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">MONTHLY EMI @{adminSettings.interestRate}%</p>
                  <p className="text-xl font-bold mt-1 text-amber-700">{fmt(emiCalculation.monthlyEMI)}</p>
                </div>
                <div className="rounded-2xl p-5 bg-purple-50 border border-purple-200">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">PERIOD DETECTED</p>
                  <p className="text-xl font-bold mt-1 text-purple-700">{result.detectedPeriod === 1 ? "1 Month" : result.detectedPeriod + " Months"}</p>
                </div>
              </div>

              {/* Risk Assessment Card */}
              <div className="rounded-2xl bg-white p-6 shadow-lg border border-blue-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Risk Assessment & Banking Health</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
                    <p className="text-xs text-gray-500 uppercase">Risk Score</p>
                    <p className={`text-3xl font-bold mt-1 ${riskAssessment.riskScore >= 70 ? "text-green-600" : riskAssessment.riskScore >= 45 ? "text-yellow-600" : "text-red-600"}`}>{riskAssessment.riskScore}<span className="text-sm text-gray-400">/100</span></p>
                  </div>
                  <div className="text-center p-4 rounded-xl border">
                    <p className="text-xs text-gray-500 uppercase">Health Grade</p>
                    <p className={`text-3xl font-bold mt-1 p-2 rounded-lg ${gradeColor(riskAssessment.healthGrade)}`}>{riskAssessment.healthGrade}</p>
                  </div>
                  <div className="md:col-span-2 p-4 rounded-xl bg-gray-50 border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase">AI Lending Remarks</p>
                    <p className="text-sm font-semibold mt-2 text-gray-800">{riskAssessment.lendingRemarks}</p>
                    <p className="text-xs mt-2 text-gray-500">Suggested Max Loan: {fmt(riskAssessment.suggestedMaxLoan)}</p>
                  </div>
                </div>
              </div>

              {/* Overall Summary */}
              {summaryStats && (
                <div className="rounded-2xl bg-white p-6 shadow-lg border border-blue-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Overall Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div><p className="text-gray-500 text-xs">Avg Balance</p><p className="font-bold text-gray-800">{fmt(summaryStats.avg)}</p></div>
                    <div><p className="text-gray-500 text-xs">Highest Balance</p><p className="font-bold text-green-700">{fmt(summaryStats.max)}</p></div>
                    <div><p className="text-gray-500 text-xs">Lowest Balance</p><p className="font-bold text-red-600">{fmt(summaryStats.min)}</p></div>
                    <div><p className="text-gray-500 text-xs">Best Month</p><p className="font-bold text-blue-700">{summaryStats.best?.monthLabel || "N/A"}</p></div>
                    <div><p className="text-gray-500 text-xs">Lowest Month</p><p className="font-bold text-orange-600">{summaryStats.low?.monthLabel || "N/A"}</p></div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4 pt-4 border-t">
                    <div><p className="text-gray-500 text-xs">Avg Monthly Credit</p><p className="font-bold text-green-700">{fmt(result.monthsData.reduce((s, m) => s + m.totalCredits, 0) / result.monthsData.length)}</p></div>
                    <div><p className="text-gray-500 text-xs">Avg Monthly Debit</p><p className="font-bold text-red-600">{fmt(result.monthsData.reduce((s, m) => s + m.totalDebits, 0) / result.monthsData.length)}</p></div>
                    <div><p className="text-gray-500 text-xs">Cheque Bounces</p><p className="font-bold text-orange-600">{result.monthsData.reduce((s, m) => s + m.chequeBounces, 0)}</p></div>
                    <div><p className="text-gray-500 text-xs">EMI Bounces</p><p className="font-bold text-red-600">{result.monthsData.reduce((s, m) => s + m.emiBounces, 0)}</p></div>
                  </div>
                </div>
              )}

              {/* Cash Flow Trend Chart */}
              {chartData.length > 0 && (
                <div className="rounded-2xl bg-white p-6 shadow-lg border border-blue-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Cash Flow Trend</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis tickFormatter={(v: number) => fmt(v)} tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(value: number) => fmt(value)} />
                        <Legend />
                        <Line type="monotone" dataKey="closingBalance" stroke="#1E40AF" strokeWidth={2} name="Closing Balance" />
                        <Line type="monotone" dataKey="monthlyABB" stroke="#16A34A" strokeWidth={2} strokeDasharray="5 5" name="Monthly ABB" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Credit vs Debit Chart */}
              {chartData.length > 0 && (
                <div className="rounded-2xl bg-white p-6 shadow-lg border border-blue-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Monthly Credits vs Debits</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis tickFormatter={(v: number) => fmt(v)} tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(value: number) => fmt(value)} />
                        <Legend />
                        <Bar dataKey="credits" fill="#16A34A" name="Credits" />
                        <Bar dataKey="debits" fill="#DC2626" name="Debits" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Month-Wise Closing Balance Table (Detailed per requirement #3) */}
              <div className="rounded-2xl bg-white shadow-lg border overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                  <h3 className="text-white font-semibold">Month-Wise Closing Balance Table</h3>
                  <p className="text-blue-100 text-xs mt-1">Day 5, 10, 15, 20, 25, 30/Last Working Day | Monthly Average</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-blue-50">
                        <th className="px-4 py-3 text-left font-semibold text-blue-800">Month</th>
                        <th className="px-3 py-3 text-right font-semibold text-blue-800">Day 5</th>
                        <th className="px-3 py-3 text-right font-semibold text-blue-800">Day 10</th>
                        <th className="px-3 py-3 text-right font-semibold text-blue-800">Day 15</th>
                        <th className="px-3 py-3 text-right font-semibold text-blue-800">Day 20</th>
                        <th className="px-3 py-3 text-right font-semibold text-blue-800">Day 25</th>
                        <th className="px-3 py-3 text-right font-semibold text-blue-800">Day 30</th>
                        <th className="px-3 py-3 text-right font-semibold text-purple-700 bg-purple-50">Monthly Avg</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.monthsData.map((m, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="px-4 py-2.5 font-semibold text-gray-800">{m.monthLabel}</td>
                          {[5, 10, 15, 20, 25, 30].map(td => {
                            const db = m.dayBalances.find(d => d.day === td);
                            return (
                              <td key={td} className={"px-3 py-2.5 text-right " + (db && db.balance > 0 ? "text-gray-700" : "text-orange-400 text-xs")}>
                                {db && db.balance > 0 ? fmt(db.balance) : "-"}
                              </td>
                            );
                          })}
                          <td className="px-3 py-2.5 text-right font-bold text-purple-700 bg-purple-50/50">{fmt(m.monthlyABB)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-blue-100 border-t-2 border-blue-300">
                        <td className="px-4 py-3 font-bold text-blue-800">Overall ABB ({result.totalMonthsFound} Months)</td>
                        <td colSpan={6} />
                        <td className="px-3 py-3 text-right font-bold text-blue-800 bg-blue-50">{fmt(result.overallABB || 0)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* ABB Calculation Details */}
              <div className="rounded-2xl bg-white shadow-lg border overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                  <h3 className="text-white font-semibold">ABB Calculation Details</h3>
                  <p className="text-green-100 text-xs mt-1">Formula: Monthly Average = (Day5 + Day10 + Day15 + Day20 + Day25 + Day30) / 6 | Overall ABB = Sum of Monthly Averages / Number of Months</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-green-50">
                        <th className="px-4 py-3 text-left font-semibold text-green-800">Month</th>
                        {(result.monthsData[0]?.sampleDays || [5, 10, 15, 20, 25, 30]).map((d: number) => (
                          <th key={d} className="px-3 py-3 text-right font-semibold text-green-800">{ordinal(d)}</th>
                        ))}
                        <th className="px-3 py-3 text-right font-semibold text-orange-600">Min</th>
                        <th className="px-3 py-3 text-right font-semibold text-blue-700">Max</th>
                        <th className="px-3 py-3 text-right font-semibold text-purple-700">Avg</th>
                        <th className="px-4 py-3 text-right font-semibold text-green-700 bg-green-50">ABB</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.monthsData.map((m, idx) => {
                        const pos = m.dayBalances.filter(d => d.balance > 0);
                        const mn = pos.length > 0 ? Math.min(...pos.map(d => d.balance)) : 0;
                        const mx = pos.length > 0 ? Math.max(...pos.map(d => d.balance)) : 0;
                        const av = pos.length > 0 ? pos.reduce((s, d) => s + d.balance, 0) / pos.length : 0;
                        return (
                          <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="px-4 py-2.5 font-semibold text-gray-800">{m.monthLabel}</td>
                            {m.dayBalances.map((db, di) => (
                              <td key={di} className={"px-3 py-2.5 text-right " + (db.balance > 0 ? "text-gray-700" : "text-orange-400 text-xs")}>
                                {db.balance > 0 ? fmt(db.balance) : "-"}
                              </td>
                            ))}
                            <td className="px-3 py-2.5 text-right text-orange-600 font-medium">{mn > 0 ? fmt(mn) : "-"}</td>
                            <td className="px-3 py-2.5 text-right text-blue-700 font-medium">{mx > 0 ? fmt(mx) : "-"}</td>
                            <td className="px-3 py-2.5 text-right text-purple-700 font-medium">{av > 0 ? fmt(av) : "-"}</td>
                            <td className="px-4 py-2.5 text-right font-bold text-green-700 bg-green-50/50">{fmt(m.monthlyABB)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-green-100 border-t-2 border-green-300">
                        <td className="px-4 py-3 font-bold text-green-800">{result.totalMonthsFound} Months Average</td>
                        <td colSpan={(result.monthsData[0]?.sampleDays || []).length + 3} />
                        <td className="px-4 py-3 text-right font-bold text-green-800">{fmt(result.overallABB || 0)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Loan Eligibility Section */}
              <div className="rounded-2xl bg-white p-6 shadow-lg border border-blue-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Loan Eligibility</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Average Bank Balance (ABB)</span><span className="font-bold">{fmt(result.overallABB)}</span></div>
                    <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Loan Multiplier</span><span className="font-bold">{adminSettings.loanMultiplier}x</span></div>
                    <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Formula</span><span className="font-bold text-blue-700">ABB x {adminSettings.loanMultiplier}</span></div>
                    <div className="flex justify-between py-2 bg-green-50 rounded-lg px-3"><span className="text-green-700 font-semibold">Eligible Loan Amount</span><span className="font-bold text-green-700 text-lg">{fmt(emiCalculation.loanAmount)}</span></div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Suggested Max Loan (from risk assessment)</span><span className="font-bold">{fmt(riskAssessment.suggestedMaxLoan)}</span></div>
                    <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Risk Grade</span><span className={`font-bold px-2 py-0.5 rounded ${gradeColor(riskAssessment.healthGrade)}`}>{riskAssessment.healthGrade}</span></div>
                    <div className="flex justify-between py-2 border-b"><span className="text-gray-500">AI Remarks</span><span className="font-semibold text-sm">{riskAssessment.lendingRemarks}</span></div>
                  </div>
                </div>
              </div>

              {/* EMI Schedule */}
              <div className="rounded-2xl bg-white p-6 shadow-lg border border-blue-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">EMI Schedule (Reducing Balance)</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <div className="p-3 bg-blue-50 rounded-lg"><p className="text-xs text-gray-500">Loan Amount</p><p className="font-bold text-blue-700">{fmt(emiCalculation.loanAmount)}</p></div>
                  <div className="p-3 bg-blue-50 rounded-lg"><p className="text-xs text-gray-500">Interest Rate</p><p className="font-bold text-blue-700">{emiCalculation.interestRate}% p.a.</p></div>
                  <div className="p-3 bg-blue-50 rounded-lg"><p className="text-xs text-gray-500">Tenure</p><p className="font-bold text-blue-700">{emiCalculation.tenure} months</p></div>
                  <div className="p-3 bg-amber-50 rounded-lg"><p className="text-xs text-gray-500">Monthly EMI</p><p className="font-bold text-amber-700">{fmt(emiCalculation.monthlyEMI)}</p></div>
                  <div className="p-3 bg-red-50 rounded-lg"><p className="text-xs text-gray-500">Total Interest</p><p className="font-bold text-red-600">{fmt(emiCalculation.totalInterest)}</p></div>
                  <div className="p-3 bg-green-50 rounded-lg"><p className="text-xs text-gray-500">Total Repayment</p><p className="font-bold text-green-700">{fmt(emiCalculation.totalRepayment)}</p></div>
                </div>
              </div>

              {/* Download Buttons - NO MOBILE NUMBER in payment per requirement #8 */}
              {!paid ? (
                <button type="button" onClick={handleDownload} className="w-full rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 text-white font-semibold text-lg shadow-lg hover:from-green-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-3">
                  Download PDF Report - Rs.{PRICING[period] || 39}
                </button>
              ) : (
                <div className="rounded-2xl bg-green-50 border border-green-200 p-4 text-center text-green-700 font-medium">PDF Downloaded Successfully!</div>
              )}

              <button type="button" onClick={() => {
                if (result) downloadBankingPDF(result, period, customerName, customerMobile, customerLocation, bankName, riskAssessment, emiCalculation, adminSettings);
              }} className="w-full rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-3 text-white font-medium hover:from-blue-600 hover:to-indigo-700 transition flex items-center justify-center gap-2">
                Download Sample PDF (Free)
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-xs text-gray-400 mt-6 pb-4">
            <p className="font-medium">Mahajan Finance | Sandeep Mahajan | +91 9730540215 | Pan India Service</p>
            <p className="mt-1">Indicative calculation only. Final approval depends on bank policy, CIBIL score and verification.</p>
          </div>
        </>)}
      </div>
    </div>
  );
}
