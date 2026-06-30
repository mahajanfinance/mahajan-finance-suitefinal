import { useState, useRef, useCallback } from "react";
import {
  type BankingReportData,
  type AdminSettings,
  type ABBPeriodOption,
  ABB_PERIOD_OPTIONS,
  formatIndianCurrency,
} from "../lib/bankingTypes";
import {
  parseBankStatementClient,
  calculateRiskAssessment,
  calculateEMI,
  calculateABBForPeriod,
} from "../lib/parseBankClient";
import { generateBankPdf } from "../lib/generateBankPdf";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const DEFAULT_SETTINGS: AdminSettings = {
  loanMultiplier: 20,
  interestRate: 14,
  defaultTenure: 36,
};

/**
 * ⚠️ RAZORPAY KEY CONFIGURATION
 * Replace with your actual Razorpay Key ID from https://dashboard.razorpay.com/#/access-keys
 * Example: "rzp_live_XXXXXXXXXXXX" (production) or "rzp_test_XXXXXXXXXXXX" (test mode)
 */
const RAZORPAY_KEY = "rzp_test_YourKeyHere"; // <-- PASTE YOUR RAZORPAY KEY ID HERE

export default function BankingSurrogate() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<BankingReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_SETTINGS);
  const [selectedPeriod, setSelectedPeriod] = useState<ABBPeriodOption>(ABB_PERIOD_OPTIONS[2]); // default 12 months
  const [isPaid, setIsPaid] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractText = useCallback(async (pdfFile: File): Promise<string> => {
    let pdfjsLib: typeof import("pdfjs-dist");
    try {
      pdfjsLib = await import("pdfjs-dist");
    } catch {
      pdfjsLib = await import("pdfjs-dist/build/pdf.mjs");
    }
    try {
      const workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString();
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
    } catch {
      pdfjsLib.GlobalWorkerOptions.workerSrc = "";
    }
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(" ");
      fullText += pageText + "\n";
    }
    return fullText;
  }, []);

  const recalcWithSettings = useCallback(
    (data: BankingReportData, s: AdminSettings, t: number, period: ABBPeriodOption): BankingReportData => {
      const { filteredMonths, abb } = calculateABBForPeriod(data.months, period.months);
      const eligibleLoan = Math.round(abb * s.loanMultiplier);
      const emiCalculation = calculateEMI(eligibleLoan, s.interestRate, t);
      const riskAssessment = calculateRiskAssessment(filteredMonths, abb, s.loanMultiplier);
      return {
        ...data,
        selectedPeriodMonths: period.months,
        abb,
        filteredMonths,
        eligibleLoan,
        emiCalculation,
        riskAssessment,
      };
    },
    []
  );

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const uploaded = e.target.files?.[0];
      if (!uploaded) return;
      setFile(uploaded);
      setError(null);
      setReportData(null);
      setIsPaid(false);
      setLoading(true);

      try {
        const text = await extractText(uploaded);
        const result = parseBankStatementClient(text);
        if (result.transactions.length === 0) {
          setError("No transactions found. Please upload a valid bank statement PDF.");
          setLoading(false);
          return;
        }
        const enriched = recalcWithSettings(result, settings, settings.defaultTenure, selectedPeriod);
        setReportData(enriched);
      } catch (err: any) {
        setError(err.message || "Failed to parse bank statement.");
      } finally {
        setLoading(false);
      }
    },
    [extractText, settings, selectedPeriod, recalcWithSettings]
  );

  const handlePeriodChange = useCallback(
    (period: ABBPeriodOption) => {
      setSelectedPeriod(period);
      if (!reportData) return;
      setReportData(recalcWithSettings(reportData, settings, settings.defaultTenure, period));
    },
    [reportData, settings, recalcWithSettings]
  );

  const handleRecalculate = useCallback(() => {
    if (!reportData) return;
    setReportData(recalcWithSettings(reportData, settings, settings.defaultTenure, selectedPeriod));
  }, [reportData, settings, selectedPeriod, recalcWithSettings]);

  const handleDownloadPdf = useCallback(() => {
    if (!reportData) return;
    generateBankPdf(reportData, settings);
  }, [reportData, settings]);

  const handleRazorpayPayment = useCallback(() => {
    if (!reportData) return;

    // Check if Razorpay key is still placeholder
    if (!RAZORPAY_KEY || RAZORPAY_KEY === "YOUR_RAZORPAY_KEY" || RAZORPAY_KEY === "rzp_test_YourKeyHere") {
      alert(
        "⚠️ Razorpay Not Configured\n\n" +
        "To enable payments, please update the RAZORPAY_KEY in BankingSurrogate.tsx\n\n" +
        "Steps:\n" +
        "1. Go to https://dashboard.razorpay.com/#/access-keys\n" +
        "2. Copy your Key ID (starts with rzp_live_ or rzp_test_)\n" +
        "3. Replace RAZORPAY_KEY value in src/pages/BankingSurrogate.tsx\n\n" +
        "Also ensure the Razorpay checkout script is in your index.html:\n" +
        '<script src="https://checkout.razorpay.com/v1/checkout.js"></script>'
      );
      return;
    }

    // Check if Razorpay SDK is loaded
    if (typeof (window as any).Razorpay === "undefined") {
      alert(
        "⚠️ Razorpay SDK Not Loaded\n\n" +
        "Please add this script tag to your index.html inside <head>:\n\n" +
        '<script src="https://checkout.razorpay.com/v1/checkout.js"></script>'
      );
      return;
    }

    const options: any = {
      key: RAZORPAY_KEY,
      amount: selectedPeriod.price, // amount in paise
      currency: "INR",
      name: "Mahajan Finance",
      description: `Banking Surrogate Report - ${selectedPeriod.label} ABB`,
      prefill: {
        name: reportData.customerName || "",
        email: "",
      },
      theme: { color: "#1e40af" },
      handler: function (response: any) {
        setIsPaid(true);
        // Auto-download PDF after successful payment
        if (reportData) {
          generateBankPdf(reportData, settings);
        }
        alert("✅ Payment Successful!\nPayment ID: " + response.razorpay_payment_id + "\nYour Banking Report PDF is downloading...");
      },
    };
    try {
      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        alert("❌ Payment failed: " + (response.error.description || "Unknown error"));
      });
      rzp.open();
    } catch (err) {
      alert("Error opening Razorpay: " + (err instanceof Error ? err.message : String(err)));
    }
  }, [reportData, selectedPeriod, settings]);

  const multiplierOptions = [15, 20, 25, 30];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-blue-800">Analyzing Bank Statement...</p>
          <p className="text-sm text-blue-500 mt-2">Detecting period, calculating ABB & risk assessment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">Banking Surrogate Report</h1>
          <p className="text-lg text-blue-600">Mahajan Finance — AI-Powered Banking Analysis</p>
        </div>

        {/* Admin Settings */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-blue-100">
          <h2 className="text-xl font-bold text-blue-900 mb-4">Admin Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loan Multiplier (ABB x ?)</label>
              <div className="flex gap-2">
                {multiplierOptions.map((m) => (
                  <button
                    key={m}
                    onClick={() => setSettings({ ...settings, loanMultiplier: m })}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                      settings.loanMultiplier === m ? "bg-blue-600 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {m}x
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Interest Rate (% p.a.)</label>
              <input
                type="number"
                value={settings.interestRate}
                onChange={(e) => setSettings({ ...settings, interestRate: parseFloat(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                step="0.5" min="1" max="36"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Default Tenure (Months)</label>
              <input
                type="number"
                value={settings.defaultTenure}
                onChange={(e) => setSettings({ ...settings, defaultTenure: parseInt(e.target.value) || 12 })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="3" max="84"
              />
            </div>
          </div>
          {reportData && (
            <button onClick={handleRecalculate} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Recalculate with New Settings
            </button>
          )}
        </div>

        {/* Upload Section */}
        {!reportData && (
          <div className="bg-white rounded-2xl shadow-lg p-10 mb-8 border-2 border-dashed border-blue-300 text-center">
            <div className="mb-6">
              <svg className="mx-auto h-16 w-16 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-blue-800 mb-2">Upload Bank Statement PDF</h3>
            <p className="text-gray-500 mb-6">Supported: PDF bank statements from any Indian bank</p>
            <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl"
            >
              Choose PDF File
            </button>
            {file && <p className="mt-4 text-sm text-gray-600">Selected: {file.name}</p>}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Report Section */}
        {reportData && (
          <>
            {/* ABB Period Selection with Pricing */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-amber-200">
              <h2 className="text-xl font-bold text-blue-900 mb-2">Select ABB Period</h2>
              <p className="text-sm text-gray-500 mb-4">Choose the period for ABB calculation. Price varies by period selected.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {ABB_PERIOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.months}
                    onClick={() => handlePeriodChange(opt)}
                    className={`relative rounded-xl p-4 border-2 transition-all text-center ${
                      selectedPeriod.months === opt.months
                        ? "border-blue-600 bg-blue-50 shadow-lg"
                        : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50"
                    }`}
                  >
                    {selectedPeriod.months === opt.months && (
                      <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">Selected</span>
                    )}
                    <p className="text-2xl font-bold text-blue-900">{opt.months}</p>
                    <p className="text-sm text-gray-500">Months</p>
                    <p className="text-lg font-bold text-green-700 mt-2">{opt.priceDisplay}</p>
                  </button>
                ))}
              </div>
              <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-800">
                  <span className="font-semibold">Selected:</span> {selectedPeriod.label} ABB @ {selectedPeriod.priceDisplay} —
                  ABB will be calculated using the <span className="font-bold">last {selectedPeriod.months} months</span> from your statement.
                  {reportData.totalMonthsFound < selectedPeriod.months && (
                    <span className="text-red-600 font-semibold"> (Only {reportData.totalMonthsFound} months available in statement)</span>
                  )}
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-white rounded-xl shadow p-5 border-l-4 border-blue-500">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Period</p>
                <p className="text-lg font-bold text-blue-900 mt-1">{reportData.selectedPeriodMonths} Month{reportData.selectedPeriodMonths > 1 ? "s" : ""}</p>
              </div>
              <div className="bg-white rounded-xl shadow p-5 border-l-4 border-green-500">
                <p className="text-xs text-gray-500 uppercase tracking-wide">ABB ({reportData.selectedPeriodMonths}M)</p>
                <p className="text-lg font-bold text-green-700 mt-1">{formatIndianCurrency(reportData.abb)}</p>
              </div>
              <div className="bg-white rounded-xl shadow p-5 border-l-4 border-purple-500">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Eligible Loan</p>
                <p className="text-lg font-bold text-purple-700 mt-1">{formatIndianCurrency(reportData.eligibleLoan)}</p>
              </div>
              <div className="bg-white rounded-xl shadow p-5 border-l-4 border-orange-500">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Risk Grade</p>
                <p className="text-lg font-bold text-orange-700 mt-1">{reportData.riskAssessment.grade}</p>
              </div>
              <div className="bg-white rounded-xl shadow p-5 border-l-4 border-gray-500">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Months</p>
                <p className="text-lg font-bold text-gray-700 mt-1">{reportData.totalMonthsFound}</p>
              </div>
            </div>

            {/* Risk Assessment Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-blue-100">
              <h2 className="text-xl font-bold text-blue-900 mb-4">Risk Assessment</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center w-32 h-32">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle cx="64" cy="64" r="56" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                      <circle
                        cx="64" cy="64" r="56"
                        stroke={reportData.riskAssessment.score >= 70 ? "#22c55e" : reportData.riskAssessment.score >= 40 ? "#f59e0b" : "#ef4444"}
                        strokeWidth="8" fill="none"
                        strokeDasharray={`${(reportData.riskAssessment.score / 100) * 351.86} 351.86`}
                      />
                    </svg>
                    <span className="absolute text-3xl font-bold text-gray-800">{reportData.riskAssessment.score}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Risk Score (0-100)</p>
                </div>
                <div className="flex flex-col justify-center">
                  <div className="mb-3">
                    <span className="text-sm text-gray-500">Grade:</span>
                    <span className={`ml-2 text-2xl font-bold ${
                      reportData.riskAssessment.grade.startsWith("A") ? "text-green-600"
                      : reportData.riskAssessment.grade.startsWith("B") ? "text-yellow-600" : "text-red-600"
                    }`}>{reportData.riskAssessment.grade}</span>
                  </div>
                  <div className="mb-3">
                    <span className="text-sm text-gray-500">Category:</span>
                    <span className="ml-2 font-semibold text-gray-700">
                      {reportData.riskAssessment.score >= 70 ? "Low Risk" : reportData.riskAssessment.score >= 40 ? "Medium Risk" : "High Risk"}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Cash Flow Trend:</span>
                    <span className={`ml-2 font-semibold ${
                      reportData.riskAssessment.cashFlowTrend === "improving" ? "text-green-600"
                      : reportData.riskAssessment.cashFlowTrend === "declining" ? "text-red-600" : "text-yellow-600"
                    }`}>
                      {reportData.riskAssessment.cashFlowTrend.charAt(0).toUpperCase() + reportData.riskAssessment.cashFlowTrend.slice(1)}
                    </span>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">AI Lending Remarks</h4>
                  <ul className="space-y-1">
                    {reportData.riskAssessment.remarks.map((r, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start">
                        <span className="text-blue-400 mr-2">&#8226;</span>{r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Cash Flow Trend Chart */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-blue-100">
              <h2 className="text-xl font-bold text-blue-900 mb-4">Cash Flow Trend</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Monthly Balance Trend</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={reportData.filteredMonths.map((m) => ({ month: m.month, Balance: m.monthlyAverage }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(value: number) => formatIndianCurrency(value)} />
                      <Legend />
                      <Line type="monotone" dataKey="Balance" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Credits vs Debits</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.filteredMonths.map((m) => ({ month: m.month, Credits: m.totalCredits, Debits: m.totalDebits }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(value: number) => formatIndianCurrency(value)} />
                      <Legend />
                      <Bar dataKey="Credits" fill="#22c55e" />
                      <Bar dataKey="Debits" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Month-Wise Closing Balance Table */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-blue-100 overflow-x-auto">
              <h2 className="text-xl font-bold text-blue-900 mb-4">
                Month-Wise Closing Balance Table ({reportData.selectedPeriodMonths} Months)
              </h2>
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="px-3 py-2 text-left font-semibold text-blue-800">Month</th>
                    <th className="px-3 py-2 text-right font-semibold text-blue-800">Day 5</th>
                    <th className="px-3 py-2 text-right font-semibold text-blue-800">Day 10</th>
                    <th className="px-3 py-2 text-right font-semibold text-blue-800">Day 15</th>
                    <th className="px-3 py-2 text-right font-semibold text-blue-800">Day 20</th>
                    <th className="px-3 py-2 text-right font-semibold text-blue-800">Day 25</th>
                    <th className="px-3 py-2 text-right font-semibold text-blue-800">Day 30</th>
                    <th className="px-3 py-2 text-right font-semibold text-blue-800 bg-blue-100">Monthly Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.filteredMonths.map((m, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-3 py-2 font-medium text-gray-700">{m.month}</td>
                      <td className="px-3 py-2 text-right text-gray-600">{formatIndianCurrency(m.dayBalanceRow.day5)}</td>
                      <td className="px-3 py-2 text-right text-gray-600">{formatIndianCurrency(m.dayBalanceRow.day10)}</td>
                      <td className="px-3 py-2 text-right text-gray-600">{formatIndianCurrency(m.dayBalanceRow.day15)}</td>
                      <td className="px-3 py-2 text-right text-gray-600">{formatIndianCurrency(m.dayBalanceRow.day20)}</td>
                      <td className="px-3 py-2 text-right text-gray-600">{formatIndianCurrency(m.dayBalanceRow.day25)}</td>
                      <td className="px-3 py-2 text-right text-gray-600">{formatIndianCurrency(m.dayBalanceRow.day30)}</td>
                      <td className="px-3 py-2 text-right font-semibold text-blue-700 bg-blue-50">{formatIndianCurrency(m.monthlyAverage)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-blue-600 text-white font-bold">
                    <td className="px-3 py-2">Overall ABB</td>
                    <td colSpan={6} className="px-3 py-2 text-right text-blue-200">Sum of Monthly Averages / {reportData.selectedPeriodMonths} Months</td>
                    <td className="px-3 py-2 text-right bg-blue-700">{formatIndianCurrency(reportData.abb)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* ABB Calculation Details */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-blue-100">
              <h2 className="text-xl font-bold text-blue-900 mb-4">ABB Calculation Details</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left font-semibold text-gray-700">Month</th>
                      <th className="px-4 py-2 text-right font-semibold text-gray-700">Min Balance</th>
                      <th className="px-4 py-2 text-right font-semibold text-gray-700">Max Balance</th>
                      <th className="px-4 py-2 text-right font-semibold text-gray-700">Monthly Average</th>
                      <th className="px-4 py-2 text-right font-semibold text-gray-700">Total Credits</th>
                      <th className="px-4 py-2 text-right font-semibold text-gray-700">Total Debits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.filteredMonths.map((m, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-4 py-2 font-medium text-gray-700">{m.month}</td>
                        <td className="px-4 py-2 text-right text-red-600">{formatIndianCurrency(m.minBalance)}</td>
                        <td className="px-4 py-2 text-right text-green-600">{formatIndianCurrency(m.maxBalance)}</td>
                        <td className="px-4 py-2 text-right font-semibold text-blue-700">{formatIndianCurrency(m.monthlyAverage)}</td>
                        <td className="px-4 py-2 text-right text-green-600">{formatIndianCurrency(m.totalCredits)}</td>
                        <td className="px-4 py-2 text-right text-red-600">{formatIndianCurrency(m.totalDebits)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">ABB Formula:</span> Monthly Average = (Day5 + Day10 + Day15 + Day20 + Day25 + Day30) / 6
                </p>
                <p className="text-sm text-blue-800 mt-1">
                  <span className="font-semibold">Overall ABB ({reportData.selectedPeriodMonths} Months):</span> Sum of Monthly Averages / {reportData.filteredMonths.length} ={" "}
                  <span className="font-bold">{formatIndianCurrency(reportData.abb)}</span>
                </p>
              </div>
            </div>

            {/* Loan Eligibility */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-blue-100">
              <h2 className="text-xl font-bold text-blue-900 mb-4">Loan Eligibility</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
                  <p className="text-sm text-blue-600 mb-1">Eligible Loan Amount</p>
                  <p className="text-3xl font-bold text-blue-900">{formatIndianCurrency(reportData.eligibleLoan)}</p>
                  <p className="text-xs text-blue-500 mt-2">
                    ABB ({formatIndianCurrency(reportData.abb)}) x Multiplier ({settings.loanMultiplier}x)
                  </p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
                  <p className="text-sm text-green-600 mb-1">Monthly EMI</p>
                  <p className="text-3xl font-bold text-green-900">{formatIndianCurrency(reportData.emiCalculation.monthlyEMI)}</p>
                  <p className="text-xs text-green-500 mt-2">
                    @{settings.interestRate}% p.a. for {settings.defaultTenure} months (Reducing Balance)
                  </p>
                </div>
              </div>
            </div>

            {/* EMI Schedule */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-blue-100">
              <h2 className="text-xl font-bold text-blue-900 mb-4">EMI Schedule</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Loan Amount</p>
                  <p className="font-bold text-gray-800 text-sm">{formatIndianCurrency(reportData.emiCalculation.loanAmount)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Monthly EMI</p>
                  <p className="font-bold text-blue-700 text-sm">{formatIndianCurrency(reportData.emiCalculation.monthlyEMI)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Total Interest</p>
                  <p className="font-bold text-red-600 text-sm">{formatIndianCurrency(reportData.emiCalculation.totalInterest)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Total Payment</p>
                  <p className="font-bold text-gray-800 text-sm">{formatIndianCurrency(reportData.emiCalculation.totalPayment)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Interest Rate</p>
                  <p className="font-bold text-gray-800 text-sm">{reportData.emiCalculation.interestRate}% p.a.</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Tenure</p>
                  <p className="font-bold text-gray-800 text-sm">{reportData.emiCalculation.tenureMonths} months</p>
                </div>
              </div>
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="min-w-full text-xs">
                  <thead className="sticky top-0">
                    <tr className="bg-blue-600 text-white">
                      <th className="px-2 py-2 text-left">Month</th>
                      <th className="px-2 py-2 text-right">EMI</th>
                      <th className="px-2 py-2 text-right">Principal</th>
                      <th className="px-2 py-2 text-right">Interest</th>
                      <th className="px-2 py-2 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.emiCalculation.amortizationSchedule.map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-2 py-1 text-gray-700">{row.month}</td>
                        <td className="px-2 py-1 text-right text-gray-700">{formatIndianCurrency(row.emi)}</td>
                        <td className="px-2 py-1 text-right text-blue-600">{formatIndianCurrency(row.principal)}</td>
                        <td className="px-2 py-1 text-right text-red-500">{formatIndianCurrency(row.interest)}</td>
                        <td className="px-2 py-1 text-right font-medium text-gray-800">{formatIndianCurrency(row.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Overall Summary */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-blue-100">
              <h2 className="text-xl font-bold text-blue-900 mb-4">Overall Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-xs text-green-600 uppercase tracking-wide">Avg Monthly Credits</p>
                  <p className="text-lg font-bold text-green-800 mt-1">
                    {formatIndianCurrency(reportData.filteredMonths.reduce((s, m) => s + m.totalCredits, 0) / reportData.filteredMonths.length)}
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-xs text-red-600 uppercase tracking-wide">Avg Monthly Debits</p>
                  <p className="text-lg font-bold text-red-800 mt-1">
                    {formatIndianCurrency(reportData.filteredMonths.reduce((s, m) => s + m.totalDebits, 0) / reportData.filteredMonths.length)}
                  </p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-xs text-yellow-600 uppercase tracking-wide">Cheque/EMI Bounces</p>
                  <p className="text-lg font-bold text-yellow-800 mt-1">
                    {reportData.riskAssessment.chequeBounces + reportData.riskAssessment.emiBounces}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-xs text-blue-600 uppercase tracking-wide">Total Transactions</p>
                  <p className="text-lg font-bold text-blue-800 mt-1">{reportData.transactions.length}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <button
                onClick={handleDownloadPdf}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF Report
              </button>
              <button
                onClick={handleRazorpayPayment}
                className="bg-indigo-600 text-white px-8 py-3 rounded-xl hover:bg-indigo-700 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Pay {selectedPeriod.priceDisplay} — {selectedPeriod.label} Report
              </button>
              <button
                onClick={() => { setReportData(null); setFile(null); setError(null); setIsPaid(false); }}
                className="bg-gray-200 text-gray-700 px-8 py-3 rounded-xl hover:bg-gray-300 transition-colors font-semibold text-lg flex items-center justify-center gap-2"
              >
                Upload New Statement
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
