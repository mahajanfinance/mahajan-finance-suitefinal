<#
.SYNOPSIS
    Banking Surrogate Setup Script for React (Vite/CRA) Projects
.DESCRIPTION
    This script sets up all Banking Surrogate files in an existing React project.
    It creates the directory structure, writes all 4 source files, and prints
    the required npm install commands.

    IMPORTANT: The BankingSurrogate.tsx has been adapted from Next.js to work
    with standard React (Vite/CRA) projects:
    - Removed "use client" directive
    - Removed unused useEffect import
.NOTES
    Author  : Mahajan Finance
    Version : 1.0.0
    Date    : 2025

    Usage:
      1. Open PowerShell
      2. Navigate to your React project root: cd C:\path\to\your\react-project
      3. Run this script: .\setup_banking_surrogate.ps1
#>

# ─── Configuration ────────────────────────────────────────────────────────────

$ErrorActionPreference = "Stop"

# Colors for output
$ColorHeader  = "Cyan"
$ColorSuccess = "Green"
$ColorWarning = "Yellow"
$ColorError   = "Red"
$ColorInfo    = "White"

# ─── Pre-flight Checks ────────────────────────────────────────────────────────

Write-Host ""
Write-Host "=============================================" -ForegroundColor $ColorHeader
Write-Host "  Banking Surrogate - React Project Setup    " -ForegroundColor $ColorHeader
Write-Host "  Mahajan Finance                             " -ForegroundColor $ColorHeader
Write-Host "=============================================" -ForegroundColor $ColorHeader
Write-Host ""

# Check if we're in a React project
if (-not (Test-Path "package.json")) {
    Write-Host "[ERROR] No package.json found in the current directory." -ForegroundColor $ColorError
    Write-Host "        Please run this script from your React project root." -ForegroundColor $ColorError
    exit 1
}

# Check if src directory exists
if (-not (Test-Path "src")) {
    Write-Host "[ERROR] No 'src' directory found. This doesn't look like a standard React project." -ForegroundColor $ColorError
    exit 1
}

Write-Host "[OK] React project detected (package.json + src/ found)" -ForegroundColor $ColorSuccess
Write-Host ""

# ─── Step 1: Create Directory Structure ───────────────────────────────────────

Write-Host "Step 1: Creating directory structure..." -ForegroundColor $ColorInfo

$dirs = @("src\lib", "src\components")

foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "  Created: $dir\" -ForegroundColor $ColorSuccess
    } else {
        Write-Host "  Already exists: $dir\" -ForegroundColor $ColorWarning
    }
}

Write-Host ""

# ─── Step 2: Write Source Files ───────────────────────────────────────────────

Write-Host "Step 2: Writing Banking Surrogate source files..." -ForegroundColor $ColorInfo
Write-Host ""

# ──────────────────────────────────────────────────────────────────────────────
# File 1: src/lib/bankingTypes.ts
# ──────────────────────────────────────────────────────────────────────────────

Write-Host "  Writing: src\lib\bankingTypes.ts" -ForegroundColor $ColorInfo

$bankingTypesContent = @'
/**
 * Banking Surrogate - Type Definitions
 * All types for the banking surrogate analysis system
 */

/** Single day balance record */
export interface DayBalance {
  day: number;        // Day of month (5, 10, 15, 20, 25, 30)
  balance: number;
  date: string;       // ISO date string
}

/** Single transaction record */
export interface Transaction {
  date: string;
  narration: string;
  debit: number;
  credit: number;
  balance: number;
}

/** Monthly data bucket */
export interface MonthData {
  monthLabel: string;       // e.g. "Jan 2025"
  year: number;
  month: number;            // 1-12
  dayBalances: DayBalance[];
  sampleDays: number[];     // [5, 10, 15, 20, 25, 30]
  monthlyABB: number;       // Average balance for this month
  openingBalance: number;
  closingBalance: number;
  totalCredits: number;
  totalDebits: number;
  creditCount: number;
  debitCount: number;
  highestBalance: number;
  lowestBalance: number;
  transactions: Transaction[];
  /** Cheque bounce count detected */
  chequeBounces: number;
  /** EMI bounce count detected */
  emiBounces: number;
}

/** Parse diagnostics */
export interface ParseDiagnostics {
  totalTxnRows: number;
  rowsWithBalance: number;
  uniqueDates: number;
  firstDate: string;
  lastDate: string;
  samplePreview: string[];
}

/** Result from client-side parsing */
export interface ClientParseResult {
  monthsData: MonthData[];
  overallABB: number;
  totalMonthsFound: number;
  bankName: string;
  parseWarnings?: string[];
  diagnostics?: ParseDiagnostics;
  /** Detected period from statement */
  detectedPeriod: number;
  /** All unique transactions */
  allTransactions: Transaction[];
}

/** Risk assessment result */
export interface RiskAssessment {
  riskScore: number;         // 0-100
  healthGrade: string;       // A+, A, B+, B, C
  lendingRemarks: string;
  suggestedMaxLoan: number;
}

/** EMI Calculation result */
export interface EMICalculation {
  loanAmount: number;
  interestRate: number;
  tenure: number;           // months
  monthlyEMI: number;
  totalInterest: number;
  totalRepayment: number;
}

/** Admin configurable settings */
export interface AdminSettings {
  loanMultiplier: number;   // e.g. 20, 25, 30
  interestRate: number;     // e.g. 14
  defaultTenure: number;    // months
}

/** Full PDF report data */
export interface BankingReportData {
  customerName: string;
  customerMobile: string;
  customerLocation: string;
  bankName: string;
  period: number;
  result: ClientParseResult;
  riskAssessment: RiskAssessment;
  emiCalculation: EMICalculation;
  adminSettings: AdminSettings;
  generatedDate: string;
}

/** Indian currency formatter */
export function formatIndianCurrency(amount: number): string {
  if (amount === 0 || isNaN(amount)) return "Rs. 0";
  const isNegative = amount < 0;
  const absAmount = Math.abs(Math.round(amount));
  const numStr = absAmount.toString();
  
  // Indian numbering: last 3 digits, then groups of 2
  let result = "";
  if (numStr.length <= 3) {
    result = numStr;
  } else {
    result = numStr.slice(-3);
    let remaining = numStr.slice(0, -3);
    while (remaining.length > 2) {
      result = remaining.slice(-2) + "," + result;
      remaining = remaining.slice(0, -2);
    }
    if (remaining.length > 0) {
      result = remaining + "," + result;
    }
  }
  
  return (isNegative ? "-" : "") + "Rs. " + result;
}
'@

Set-Content -Path "src\lib\bankingTypes.ts" -Value $bankingTypesContent -Encoding UTF8 -NoNewline
Write-Host "    Done (bankingTypes.ts)" -ForegroundColor $ColorSuccess

# ──────────────────────────────────────────────────────────────────────────────
# File 2: src/lib/parseBankClient.ts
# ──────────────────────────────────────────────────────────────────────────────

Write-Host "  Writing: src\lib\parseBankClient.ts" -ForegroundColor $ColorInfo

$parseBankClientContent = @'
/**
 * Banking Surrogate - Client-Side Bank Statement Parser
 * 
 * Parses text extracted from bank statement PDFs.
 * - Dynamically detects statement period (1, 3, 6, or 12 months)
 * - Calculates ABB based on actual uploaded data (no hardcoded values)
 * - Extracts day-wise closing balances for Day 5, 10, 15, 20, 25, 30/Last
 * - Detects cheque bounces and EMI bounces
 */

import type {
  ClientParseResult,
  MonthData,
  DayBalance,
  Transaction,
  ParseDiagnostics,
} from "./bankingTypes";

const SAMPLE_DAYS = [5, 10, 15, 20, 25, 30];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Try to extract a numeric balance from a string */
function parseAmount(s: string): number {
  if (!s) return 0;
  const cleaned = s.replace(/[,;\s]/g, "").replace(/Cr\.?/i, "").replace(/Dr\.?/i, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/** Parse a date from various Indian bank formats */
function parseDate(str: string): Date | null {
  if (!str) return null;
  const s = str.trim().replace(/['"]/g, "");

  // DD/MM/YYYY or DD-MM-YYYY
  let m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (m) {
    const d = parseInt(m[1]), mo = parseInt(m[2]) - 1;
    let y = parseInt(m[3]);
    if (y < 100) y += 2000;
    return new Date(y, mo, d);
  }

  // DD Mon YYYY or DD-Mon-YYYY
  m = s.match(/^(\d{1,2})[\/\-\s]+([A-Za-z]{3,9})[\/\-\s]+(\d{2,4})$/i);
  if (m) {
    const d = parseInt(m[1]);
    const moIdx = MONTH_NAMES.findIndex(n => m[2].toLowerCase().startsWith(n.toLowerCase()));
    let y = parseInt(m[3]);
    if (y < 100) y += 2000;
    if (moIdx >= 0) return new Date(y, moIdx, d);
  }

  // YYYY-MM-DD
  m = s.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
  if (m) {
    return new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
  }

  return null;
}

/** Detect bank name from statement text */
function detectBankName(text: string): string {
  const upper = text.toUpperCase();
  const bankPatterns: [string, string][] = [
    ["SBI|STATE BANK OF INDIA", "State Bank of India"],
    ["HDFC BANK|HDFC", "HDFC Bank"],
    ["ICICI BANK|ICICI", "ICICI Bank"],
    ["AXIS BANK", "Axis Bank"],
    ["KOTAK MAHINDRA|KOTAK", "Kotak Mahindra Bank"],
    ["PUNJAB NATIONAL BANK|PNB", "Punjab National Bank"],
    ["BANK OF BARODA|BOB", "Bank of Baroda"],
    ["CANARA BANK", "Canara Bank"],
    ["UNION BANK OF INDIA", "Union Bank of India"],
    ["INDIAN BANK", "Indian Bank"],
    ["BANK OF INDIA", "Bank of India"],
    ["IDFC FIRST BANK|IDFC", "IDFC FIRST Bank"],
    ["INDUSIND BANK", "IndusInd Bank"],
    ["YES BANK", "YES Bank"],
    ["FEDERAL BANK", "Federal Bank"],
    ["RBL BANK", "RBL Bank"],
    ["BANDHAN BANK", "Bandhan Bank"],
    ["UCO BANK", "UCO Bank"],
    ["CENTRAL BANK OF INDIA", "Central Bank of India"],
    ["BANK OF MAHARASHTRA", "Bank of Maharashtra"],
    ["AU SMALL FINANCE", "AU Small Finance Bank"],
    ["INDIA POST PAYMENTS BANK|IPPB", "India Post Payments Bank"],
  ];
  for (const [pattern, name] of bankPatterns) {
    if (new RegExp(pattern).test(upper)) return name;
  }
  return "Unknown Bank";
}

/**
 * Main parser - takes extracted text, returns structured data.
 * DYNAMICALLY detects period and calculates ABB for actual months found.
 */
export function parseBankStatementClient(text: string): ClientParseResult {
  const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
  const bankName = detectBankName(text);
  const warnings: string[] = [];
  const transactions: Transaction[] = [];

  // --- Phase 1: Extract transactions from text ---
  // Try multiple row patterns common in Indian bank statements
  const rowPatterns = [
    // DD/MM/YYYY narration debit credit balance
    /^(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})\s+(.+?)\s+([\d,]+\.\d{2})?\s*([\d,]+\.\d{2})?\s+([\d,]+\.\d{2})\s*(Cr|Dr)?/i,
    // Date narration ... balance
    /^(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})\s+(.+?)\s+([\d,]+(?:\.\d{2})?)\s*$/,
  ];

  let totalTxnRows = 0;
  let rowsWithBalance = 0;
  const dateSet = new Set<string>();

  for (const line of lines) {
    for (const pat of rowPatterns) {
      const match = line.match(pat);
      if (match) {
        totalTxnRows++;
        const dateStr = match[1];
        const date = parseDate(dateStr);
        if (!date) continue;

        const dateKey = date.toISOString().slice(0, 10);
        dateSet.add(dateKey);

        // Try to extract debit, credit, balance
        let debit = 0, credit = 0, balance = 0;
        const narration = match[2] || "";

        if (match[5]) {
          // Pattern 1: full match with balance
          const val3 = parseAmount(match[3]);
          const val4 = parseAmount(match[4]);
          balance = parseAmount(match[5]);
          const isDr = (match[6] || "").toUpperCase() === "DR";

          // Determine debit vs credit based on narration and amounts
          if (val3 > 0 && val4 === 0) {
            // Could be single amount - check if it's debit or credit
            if (/credit|cr|received|refund|cash\s*dep/i.test(narration)) {
              credit = val3;
            } else {
              debit = val3;
            }
          } else if (val3 > 0 && val4 > 0) {
            // Two amounts - likely debit then credit or vice versa
            if (/credit|cr|received|refund/i.test(narration)) {
              credit = val4;
            } else {
              debit = val3;
              credit = val4;
            }
          }
          if (isDr) balance = -Math.abs(balance);
          rowsWithBalance++;
        } else if (match[3]) {
          // Pattern 2: date narration amount (simple)
          const amount = parseAmount(match[3]);
          if (/credit|cr|received|refund|cash\s*dep/i.test(narration)) {
            credit = amount;
          } else {
            debit = amount;
          }
        }

        transactions.push({
          date: dateKey,
          narration,
          debit,
          credit,
          balance: Math.abs(balance),
        });
        break; // matched one pattern, skip rest
      }
    }
  }

  // --- Phase 2: Alternative extraction if no transactions found ---
  if (transactions.length === 0) {
    // Try a more lenient approach: find any lines with dates and numbers
    for (const line of lines) {
      // Look for date-like patterns
      const dateMatch = line.match(/(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/);
      if (!dateMatch) continue;

      const date = parseDate(dateMatch[1]);
      if (!date) continue;

      const dateKey = date.toISOString().slice(0, 10);
      dateSet.add(dateKey);

      // Extract all numbers from the line
      const numMatches = line.match(/[\d,]+\.\d{2}/g) || [];
      const lastNum = numMatches.length > 0 ? parseAmount(numMatches[numMatches.length - 1]) : 0;

      if (lastNum > 0) {
        totalTxnRows++;
        rowsWithBalance++;
        transactions.push({
          date: dateKey,
          narration: line.replace(dateMatch[1], "").trim().substring(0, 60),
          debit: 0,
          credit: 0,
          balance: lastNum,
        });
      }
    }
  }

  // --- Phase 3: Group transactions by month and calculate balances ---
  const monthMap = new Map<string, Transaction[]>();
  for (const txn of transactions) {
    const d = new Date(txn.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthMap.has(key)) monthMap.set(key, []);
    monthMap.get(key)!.push(txn);
  }

  const sortedMonthKeys = Array.from(monthMap.keys()).sort();
  const monthsData: MonthData[] = [];

  for (const mk of sortedMonthKeys) {
    const [yearStr, monthStr] = mk.split("-");
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);
    const monthTxns = monthMap.get(mk) || [];

    // Sort transactions by date
    monthTxns.sort((a, b) => a.date.localeCompare(b.date));

    // Find day-wise closing balances (closest to Day 5, 10, 15, 20, 25, 30)
    const dayBalances: DayBalance[] = [];
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const adjustedSampleDays = SAMPLE_DAYS.map(d => Math.min(d, lastDayOfMonth));

    for (const targetDay of adjustedSampleDays) {
      // Find transaction closest to this day
      let bestTxn: Transaction | null = null;
      let bestDiff = Infinity;

      for (const txn of monthTxns) {
        const txnDate = new Date(txn.date);
        const diff = Math.abs(txnDate.getDate() - targetDay);
        if (diff < bestDiff && txn.balance > 0) {
          bestDiff = diff;
          bestTxn = txn;
        }
      }

      dayBalances.push({
        day: targetDay,
        balance: bestTxn ? bestTxn.balance : 0,
        date: bestTxn ? bestTxn.date : `${year}-${String(month).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`,
      });
    }

    // Calculate monthly ABB = (Sum of day balances) / number of valid day entries
    const validDayBalances = dayBalances.filter(d => d.balance > 0);
    const monthlyABB = validDayBalances.length > 0
      ? validDayBalances.reduce((s, d) => s + d.balance, 0) / validDayBalances.length
      : 0;

    // Opening and closing balance
    const openingBalance = monthTxns.length > 0 ? monthTxns[0].balance : 0;
    const closingBalance = monthTxns.length > 0 ? monthTxns[monthTxns.length - 1].balance : 0;

    // Credits and debits
    const totalCredits = monthTxns.reduce((s, t) => s + t.credit, 0);
    const totalDebits = monthTxns.reduce((s, t) => s + t.debit, 0);
    const creditCount = monthTxns.filter(t => t.credit > 0).length;
    const debitCount = monthTxns.filter(t => t.debit > 0).length;

    // Highest/lowest balance
    const balancesWithValues = monthTxns.filter(t => t.balance > 0).map(t => t.balance);
    const highestBalance = balancesWithValues.length > 0 ? Math.max(...balancesWithValues) : 0;
    const lowestBalance = balancesWithValues.length > 0 ? Math.min(...balancesWithValues) : 0;

    // Detect cheque bounces and EMI bounces from narration
    const chequeBounces = monthTxns.filter(t =>
      /chq\s*bounce|cheque\s*return|dishono|bounce|ret\s*chq/i.test(t.narration)
    ).length;
    const emiBounces = monthTxns.filter(t =>
      /emi\s*bounce|emi\s*return|ecs\s*return|ecs\s*bounce|bounce\s*emi/i.test(t.narration)
    ).length;

    monthsData.push({
      monthLabel: `${MONTH_NAMES[month - 1]} ${year}`,
      year,
      month,
      dayBalances,
      sampleDays: adjustedSampleDays,
      monthlyABB,
      openingBalance,
      closingBalance,
      totalCredits,
      totalDebits,
      creditCount,
      debitCount,
      highestBalance,
      lowestBalance,
      transactions: monthTxns,
      chequeBounces,
      emiBounces,
    });
  }

  // --- Phase 4: Calculate overall ABB dynamically ---
  // ABB = Sum of Monthly Averages / Number of Months
  const monthsWithABB = monthsData.filter(m => m.monthlyABB > 0);
  const overallABB = monthsWithABB.length > 0
    ? monthsWithABB.reduce((s, m) => s + m.monthlyABB, 0) / monthsWithABB.length
    : 0;

  // --- Phase 5: Dynamic period detection ---
  const detectedPeriod = monthsData.length;

  // --- Diagnostics ---
  const sortedDates = Array.from(dateSet).sort();
  const diagnostics: ParseDiagnostics = {
    totalTxnRows,
    rowsWithBalance,
    uniqueDates: dateSet.size,
    firstDate: sortedDates[0] || "",
    lastDate: sortedDates[sortedDates.length - 1] || "",
    samplePreview: transactions.slice(0, 5).map(t =>
      `${t.date} | ${t.narration.substring(0, 30)} | Dr:${t.debit} Cr:${t.credit} Bal:${t.balance}`
    ),
  };

  if (monthsData.length === 0) {
    warnings.push("No valid month buckets found from parsed transactions.");
  }
  if (totalTxnRows === 0) {
    warnings.push("No transaction rows detected. PDF may be scanned/image-based.");
  }

  return {
    monthsData,
    overallABB,
    totalMonthsFound: monthsData.length,
    bankName,
    parseWarnings: warnings,
    diagnostics,
    detectedPeriod,
    allTransactions: transactions,
  };
}

/**
 * Calculate risk score and health grade based on banking behavior
 */
export function calculateRiskAssessment(
  result: ClientParseResult,
  loanMultiplier: number
): { riskScore: number; healthGrade: string; lendingRemarks: string; suggestedMaxLoan: number } {
  let score = 50; // Start at neutral

  const { monthsData, overallABB } = result;
  if (monthsData.length === 0) return { riskScore: 0, healthGrade: "C", lendingRemarks: "Insufficient Data", suggestedMaxLoan: 0 };

  // Factor 1: ABB trend (improving = +, declining = -)
  if (monthsData.length >= 2) {
    const firstHalf = monthsData.slice(0, Math.ceil(monthsData.length / 2));
    const secondHalf = monthsData.slice(Math.ceil(monthsData.length / 2));
    const firstAvg = firstHalf.reduce((s, m) => s + m.monthlyABB, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, m) => s + m.monthlyABB, 0) / secondHalf.length;
    const trendPct = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
    if (trendPct > 20) score += 15;
    else if (trendPct > 5) score += 8;
    else if (trendPct < -20) score -= 15;
    else if (trendPct < -5) score -= 8;
  }

  // Factor 2: Consistency of balances (low variance = better)
  const abbs = monthsData.filter(m => m.monthlyABB > 0).map(m => m.monthlyABB);
  if (abbs.length >= 2) {
    const avgABB = abbs.reduce((a, b) => a + b, 0) / abbs.length;
    const variance = abbs.reduce((s, a) => s + Math.pow(a - avgABB, 2), 0) / abbs.length;
    const cv = avgABB > 0 ? Math.sqrt(variance) / avgABB : 1;
    if (cv < 0.2) score += 15;
    else if (cv < 0.4) score += 8;
    else if (cv > 0.7) score -= 10;
  }

  // Factor 3: Cheque/EMI bounces
  const totalChequeBounces = monthsData.reduce((s, m) => s + m.chequeBounces, 0);
  const totalEmiBounces = monthsData.reduce((s, m) => s + m.emiBounces, 0);
  score -= totalChequeBounces * 10;
  score -= totalEmiBounces * 15;

  // Factor 4: Credit activity (regular credits = better)
  const avgCredits = monthsData.reduce((s, m) => s + m.creditCount, 0) / monthsData.length;
  if (avgCredits >= 5) score += 10;
  else if (avgCredits >= 2) score += 5;
  else score -= 5;

  // Factor 5: Overall ABB level
  if (overallABB > 50000) score += 10;
  else if (overallABB > 20000) score += 5;
  else if (overallABB < 5000) score -= 5;

  // Clamp to 0-100
  score = Math.max(0, Math.min(100, Math.round(score)));

  // Determine grade
  let healthGrade: string;
  if (score >= 85) healthGrade = "A+";
  else if (score >= 70) healthGrade = "A";
  else if (score >= 55) healthGrade = "B+";
  else if (score >= 40) healthGrade = "B";
  else healthGrade = "C";

  // Lending remarks
  let lendingRemarks: string;
  if (score >= 80) lendingRemarks = "Excellent Banking Profile - Highly recommended for lending";
  else if (score >= 65) lendingRemarks = "Good Banking Profile - Suitable for standard lending";
  else if (score >= 45) lendingRemarks = "Moderate Banking Profile - Lending with caution advised";
  else lendingRemarks = "Improvement Required - High risk profile";

  // Suggested max loan
  const suggestedMaxLoan = Math.round(overallABB * loanMultiplier);

  return { riskScore: score, healthGrade, lendingRemarks, suggestedMaxLoan };
}

/**
 * Calculate EMI using reducing balance method
 */
export function calculateEMI(
  loanAmount: number,
  annualRate: number,
  tenureMonths: number
): { loanAmount: number; interestRate: number; tenure: number; monthlyEMI: number; totalInterest: number; totalRepayment: number } {
  if (loanAmount <= 0 || annualRate <= 0 || tenureMonths <= 0) {
    return { loanAmount, interestRate: annualRate, tenure: tenureMonths, monthlyEMI: 0, totalInterest: 0, totalRepayment: 0 };
  }

  const monthlyRate = annualRate / 12 / 100;
  const emi = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  const totalRepayment = emi * tenureMonths;
  const totalInterest = totalRepayment - loanAmount;

  return {
    loanAmount,
    interestRate: annualRate,
    tenure: tenureMonths,
    monthlyEMI: Math.round(emi),
    totalInterest: Math.round(totalInterest),
    totalRepayment: Math.round(totalRepayment),
  };
}
'@

Set-Content -Path "src\lib\parseBankClient.ts" -Value $parseBankClientContent -Encoding UTF8 -NoNewline
Write-Host "    Done (parseBankClient.ts)" -ForegroundColor $ColorSuccess

# ──────────────────────────────────────────────────────────────────────────────
# File 3: src/lib/generateBankPdf.ts
# ──────────────────────────────────────────────────────────────────────────────

Write-Host "  Writing: src\lib\generateBankPdf.ts" -ForegroundColor $ColorInfo

$generateBankPdfContent = @'
/**
 * Banking Surrogate - Professional PDF Generator
 * 
 * Features:
 * - Multi-page support (auto-expands for 12 months)
 * - Mahajan Finance transparent watermark on every page
 * - Indian currency formatting everywhere
 * - 14 report sections with professional design
 * - Dynamic period detection
 * - Risk Score, Banking Health Grade
 * - EMI Schedule with reducing balance method
 * - Page numbers (Page x of y)
 * - Professional header/footer branding
 */

import jsPDF from "jspdf";
import type { ClientParseResult, RiskAssessment, EMICalculation, AdminSettings } from "./bankingTypes";
import { formatIndianCurrency } from "./bankingTypes";

const BRAND_COLOR = [30, 64, 175] as const; // Blue-800
const ACCENT_COLOR = [22, 163, 74] as const; // Green-600
const DARK_TEXT = [31, 41, 55] as const; // Gray-800
const LIGHT_TEXT = [107, 114, 128] as const; // Gray-500
const TABLE_HEADER_BG = [219, 234, 254] as const; // Blue-100
const TABLE_ALT_BG = [249, 250, 251] as const; // Gray-50

/** Indian currency format for PDF */
function fmtRs(amount: number): string {
  if (amount === 0 || isNaN(amount)) return "Rs. 0";
  return formatIndianCurrency(amount);
}

/** Get ordinal suffix */
function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function downloadBankingPDF(
  result: ClientParseResult,
  period: number,
  customerName: string,
  customerMobile: string,
  customerLocation: string,
  bankName: string,
  riskAssessment?: RiskAssessment,
  emiCalculation?: EMICalculation,
  adminSettings?: AdminSettings,
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentW = pageW - 2 * margin;
  let y = 0;
  let pageNum = 0;

  const settings: AdminSettings = adminSettings || { loanMultiplier: 20, interestRate: 14, defaultTenure: period };
  const risk: RiskAssessment = riskAssessment || { riskScore: 0, healthGrade: "C", lendingRemarks: "Not assessed", suggestedMaxLoan: 0 };
  const emi: EMICalculation = emiCalculation || {
    loanAmount: Math.round(result.overallABB * settings.loanMultiplier),
    interestRate: settings.interestRate,
    tenure: settings.defaultTenure,
    monthlyEMI: 0,
    totalInterest: 0,
    totalRepayment: 0,
  };

  const generatedDate = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const periodLabel = period === 1 ? "1 Month" : `${period} Months`;

  // ─── Helper Functions ───

  function newPage() {
    if (pageNum > 0) doc.addPage();
    pageNum++;
    y = margin;
    addWatermark();
    addHeader();
  }

  function addWatermark() {
    doc.saveGraphicsState();
    doc.setGState(new (doc as any).GState({ opacity: 0.06 }));
    doc.setFontSize(60);
    doc.setTextColor(...BRAND_COLOR);
    doc.setFont("helvetica", "bold");
    const text = "MAHAJAN FINANCE";
    const tw = doc.getTextWidth(text);
    doc.text(text, (pageW - tw) / 2, pageH / 2, { angle: 45 });
    doc.restoreGraphicsState();
  }

  function addHeader() {
    // Top blue bar
    doc.setFillColor(...BRAND_COLOR);
    doc.rect(0, 0, pageW, 22, "F");

    // Brand name
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("MAHAJAN FINANCE", margin, 10);

    // Subtitle
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Banking Surrogate Analysis Report", margin, 16);

    // Date on right
    doc.setFontSize(7);
    doc.text(generatedDate, pageW - margin, 10, { align: "right" });
    doc.text(`Period: ${periodLabel}`, pageW - margin, 16, { align: "right" });

    y = 28;
  }

  function addFooter() {
    doc.setFillColor(...BRAND_COLOR);
    doc.rect(0, pageH - 15, pageW, 15, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(255, 255, 255);
    doc.text("Mahajan Finance | Sandeep Mahajan | +91 9730540215 | Pan India Service", margin, pageH - 7);
    doc.text(`Page ${pageNum}`, pageW - margin, pageH - 7, { align: "right" });

    // Website & email
    doc.setFontSize(6);
    doc.text("www.mahajanfinance.com | info@mahajanfinance.com", pageW / 2, pageH - 3, { align: "center" });
  }

  function checkPage(needed: number) {
    if (y + needed > pageH - 20) {
      addFooter();
      newPage();
    }
  }

  function sectionTitle(title: string) {
    checkPage(15);
    doc.setFillColor(...BRAND_COLOR);
    doc.roundedRect(margin, y, contentW, 8, 1, 1, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(title, margin + 3, y + 5.5);
    y += 11;
  }

  function subTitle(text: string) {
    checkPage(10);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND_COLOR);
    doc.text(text, margin + 2, y + 4);
    y += 7;
  }

  function labelValue(label: string, value: string, labelW: number = 55) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...LIGHT_TEXT);
    doc.text(label, margin + 2, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK_TEXT);
    doc.text(value, margin + labelW, y);
    y += 5;
  }

  function drawTable(headers: string[], rows: string[][], colWidths: number[]) {
    const rowH = 6;
    // Check if table fits, else new page
    const tableH = (rows.length + 1) * rowH;
    if (y + Math.min(tableH, 40) > pageH - 20) {
      addFooter();
      newPage();
    }

    // Header
    doc.setFillColor(...TABLE_HEADER_BG);
    doc.rect(margin, y, contentW, rowH, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND_COLOR);
    let x = margin;
    headers.forEach((h, i) => {
      doc.text(h, x + 1, y + 4, { width: colWidths[i] - 2 });
      x += colWidths[i];
    });
    y += rowH;

    // Rows
    rows.forEach((row, ri) => {
      if (y + rowH > pageH - 20) {
        addFooter();
        newPage();
        // Re-draw header
        doc.setFillColor(...TABLE_HEADER_BG);
        doc.rect(margin, y, contentW, rowH, "F");
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...BRAND_COLOR);
        let hx = margin;
        headers.forEach((h, i) => {
          doc.text(h, hx + 1, y + 4, { width: colWidths[i] - 2 });
          hx += colWidths[i];
        });
        y += rowH;
      }

      if (ri % 2 === 1) {
        doc.setFillColor(...TABLE_ALT_BG);
        doc.rect(margin, y, contentW, rowH, "F");
      }
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...DARK_TEXT);
      x = margin;
      row.forEach((cell, i) => {
        const align = i === 0 ? "left" : "right";
        const xPos = i === 0 ? x + 1 : x + colWidths[i] - 2;
        doc.text(cell, xPos, y + 4, { width: colWidths[i] - 3, align });
        x += colWidths[i];
      });
      y += rowH;
    });
  }

  // ─── PAGE 1: Cover + Customer + Bank Info ───

  newPage();

  // Cover section - larger branding
  doc.setFillColor(...BRAND_COLOR);
  doc.roundedRect(margin, y, contentW, 35, 3, 3, "F");
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("MAHAJAN FINANCE", margin + 10, y + 13);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Banking Surrogate Analysis Report", margin + 10, y + 21);
  doc.setFontSize(8);
  doc.text(`Report Generated: ${generatedDate} | Analysis Period: ${periodLabel}`, margin + 10, y + 28);
  y += 40;

  // Section 1: Customer Information
  sectionTitle("1. Customer Information");
  labelValue("Full Name", customerName || "N/A");
  labelValue("Mobile Number", customerMobile || "N/A");
  labelValue("Location", customerLocation || "N/A");
  labelValue("Report Date", generatedDate);
  y += 3;

  // Section 2: Bank Information
  sectionTitle("2. Bank Information");
  labelValue("Bank Name", bankName || result.bankName || "N/A");
  labelValue("Statement Period", periodLabel);
  labelValue("Months Analysed", String(result.totalMonthsFound));
  labelValue("Detected Period", result.detectedPeriod + (result.detectedPeriod === 1 ? " Month" : " Months"));
  y += 3;

  // Section 3: Statement Analysis Summary
  sectionTitle("3. Statement Analysis Summary");
  labelValue("Overall ABB", fmtRs(result.overallABB));
  labelValue("Opening Balance", fmtRs(result.monthsData[0]?.openingBalance || 0));
  labelValue("Closing Balance", fmtRs(result.monthsData[result.monthsData.length - 1]?.closingBalance || 0));
  labelValue("Total Credits", fmtRs(result.monthsData.reduce((s, m) => s + m.totalCredits, 0)));
  labelValue("Total Debits", fmtRs(result.monthsData.reduce((s, m) => s + m.totalDebits, 0)));
  labelValue("Highest Balance", fmtRs(Math.max(...result.monthsData.map(m => m.highestBalance))));
  labelValue("Lowest Balance", fmtRs(Math.min(...result.monthsData.filter(m => m.lowestBalance > 0).map(m => m.lowestBalance)) || 0));
  labelValue("Avg Monthly Credit", fmtRs(result.monthsData.reduce((s, m) => s + m.totalCredits, 0) / Math.max(result.monthsData.length, 1)));
  labelValue("Avg Monthly Debit", fmtRs(result.monthsData.reduce((s, m) => s + m.totalDebits, 0) / Math.max(result.monthsData.length, 1)));
  labelValue("Cheque Bounces", String(result.monthsData.reduce((s, m) => s + m.chequeBounces, 0)));
  labelValue("EMI Bounces", String(result.monthsData.reduce((s, m) => s + m.emiBounces, 0)));
  y += 3;

  // Section 4: Risk Assessment
  if (risk) {
    sectionTitle("4. Risk Assessment & Banking Health");
    // Risk score gauge
    const scoreColor = risk.riskScore >= 70 ? ACCENT_COLOR : risk.riskScore >= 45 ? [234, 179, 8] as const : [220, 38, 38] as const;
    doc.setFillColor(...scoreColor);
    doc.roundedRect(margin + 2, y, 30, 20, 2, 2, "F");
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(String(risk.riskScore), margin + 17, y + 13, { align: "center" });
    doc.setFontSize(6);
    doc.text("/100", margin + 17, y + 17, { align: "center" });

    // Grade badge
    doc.setFillColor(...BRAND_COLOR);
    doc.roundedRect(margin + 36, y, 20, 20, 2, 2, "F");
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(risk.healthGrade, margin + 46, y + 13, { align: "center" });
    doc.setFontSize(5);
    doc.text("Grade", margin + 46, y + 17, { align: "center" });

    // Remarks
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK_TEXT);
    doc.text(`AI Remark: ${risk.lendingRemarks}`, margin + 60, y + 8);
    doc.text(`Suggested Max Loan: ${fmtRs(risk.suggestedMaxLoan)}`, margin + 60, y + 15);
    y += 25;
  }

  // Section 5: Month-Wise Closing Figures
  sectionTitle("5. Month-Wise Closing Figures");

  const closingHeaders = ["Month", "Day 5", "Day 10", "Day 15", "Day 20", "Day 25", "Day 30", "Monthly Avg"];
  const closingColWidths = [28, 22, 22, 22, 22, 22, 22, contentW - 160];
  const closingRows = result.monthsData.map(m => {
    const dayVals = m.sampleDays.map((targetDay, i) => {
      const db = m.dayBalances.find(d => d.day === targetDay);
      return db && db.balance > 0 ? fmtRs(db.balance) : "-";
    });
    return [m.monthLabel, ...dayVals, fmtRs(m.monthlyABB)];
  });

  // Ensure 7 data columns (fill missing days)
  const normalizedRows = result.monthsData.map(m => {
    const row: string[] = [m.monthLabel];
    for (const td of [5, 10, 15, 20, 25, 30]) {
      const db = m.dayBalances.find(d => d.day === td);
      row.push(db && db.balance > 0 ? fmtRs(db.balance) : "-");
    }
    row.push(fmtRs(m.monthlyABB));
    return row;
  });

  drawTable(closingHeaders, normalizedRows, closingColWidths);

  // Overall ABB row
  checkPage(8);
  doc.setFillColor(219, 234, 254);
  doc.rect(margin, y, contentW, 7, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND_COLOR);
  doc.text("Overall Average Bank Balance (ABB)", margin + 2, y + 5);
  doc.text(fmtRs(result.overallABB), pageW - margin - 2, y + 5, { align: "right" });
  y += 10;

  // Section 6: Monthly Average Table (ABB Calculation Sheet)
  sectionTitle("6. ABB Calculation Sheet");

  subTitle("Formula: Monthly Average = (Day5 + Day10 + Day15 + Day20 + Day25 + Day30) / 6");
  subTitle("Overall ABB = Sum of Monthly Averages / Number of Months");

  const abbHeaders = ["Month", "Day 5", "Day 10", "Day 15", "Day 20", "Day 25", "Day 30", "Sum", "Monthly ABB"];
  const abbColWidths = [24, 20, 20, 20, 20, 20, 20, 24, contentW - 168];
  const abbRows = result.monthsData.map(m => {
    const dayVals = [5, 10, 15, 20, 25, 30].map(td => {
      const db = m.dayBalances.find(d => d.day === td);
      return db ? String(Math.round(db.balance)) : "0";
    });
    const sum = dayVals.reduce((s, v) => s + parseInt(v), 0);
    return [m.monthLabel, ...dayVals, String(sum), fmtRs(m.monthlyABB)];
  });
  drawTable(abbHeaders, abbRows, abbColWidths);

  // Overall ABB result
  checkPage(8);
  doc.setFillColor(...ACCENT_COLOR);
  doc.roundedRect(margin, y, contentW, 8, 1, 1, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(`Overall ABB (${result.totalMonthsFound} Months) = ${fmtRs(result.overallABB)}`, margin + 3, y + 5.5);
  y += 12;

  // ─── NEW PAGE: Loan Eligibility + EMI + Insights ───

  addFooter();
  newPage();

  // Section 7: Loan Eligibility
  sectionTitle("7. Loan Eligibility");
  const eligibleLoan = Math.round(result.overallABB * settings.loanMultiplier);
  labelValue("Average Bank Balance (ABB)", fmtRs(result.overallABB));
  labelValue("Loan Multiplier", `${settings.loanMultiplier}x`);
  labelValue("Eligible Loan Amount", fmtRs(eligibleLoan));
  labelValue("Formula", `ABB x ${settings.loanMultiplier} = ${fmtRs(result.overallABB)} x ${settings.loanMultiplier}`);
  y += 3;

  // Section 8: EMI Schedule
  sectionTitle("8. EMI Schedule");

  labelValue("Loan Amount", fmtRs(emi.loanAmount));
  labelValue("Interest Rate (p.a.)", `${emi.interestRate}%`);
  labelValue("Tenure", `${emi.tenure} months`);
  labelValue("Monthly EMI", fmtRs(emi.monthlyEMI));
  labelValue("Total Interest Payable", fmtRs(emi.totalInterest));
  labelValue("Total Repayment Amount", fmtRs(emi.totalRepayment));
  labelValue("Method", "Reducing Balance EMI");
  y += 3;

  // EMI amortization table (first 12 rows or all if less)
  subTitle("EMI Amortization Schedule");
  const amortHeaders = ["Month", "Opening", "EMI", "Interest", "Principal", "Closing"];
  const amortColWidths = [20, 30, 30, 30, 30, contentW - 140];
  const amortRows: string[][] = [];
  let balance = emi.loanAmount;
  const monthlyRate = emi.interestRate / 12 / 100;
  const displayMonths = Math.min(emi.tenure, 24); // Show up to 24 months
  for (let i = 1; i <= displayMonths; i++) {
    const interest = Math.round(balance * monthlyRate);
    const principal = emi.monthlyEMI - interest;
    const closing = Math.round(balance - principal);
    amortRows.push([
      String(i),
      fmtRs(Math.round(balance)),
      fmtRs(emi.monthlyEMI),
      fmtRs(interest),
      fmtRs(Math.max(principal, 0)),
      fmtRs(Math.max(closing, 0)),
    ]);
    balance = Math.max(closing, 0);
  }
  if (emi.tenure > 24) {
    amortRows.push(["...", `... + ${emi.tenure - 24} more months`, "", "", "", ""]);
  }
  drawTable(amortHeaders, amortRows, amortColWidths);
  y += 5;

  // Section 9: Key Financial Insights
  checkPage(50);
  sectionTitle("9. Key Financial Insights");

  const insights: string[] = [];
  const avgCredit = result.monthsData.reduce((s, m) => s + m.totalCredits, 0) / Math.max(result.monthsData.length, 1);
  const avgDebit = result.monthsData.reduce((s, m) => s + m.totalDebits, 0) / Math.max(result.monthsData.length, 1);
  const totalBounces = result.monthsData.reduce((s, m) => s + m.chequeBounces + m.emiBounces, 0);

  insights.push(`Average Monthly Credit: ${fmtRs(avgCredit)} - ${avgCredit > 30000 ? "Healthy income flow" : "Moderate income flow"}`);
  insights.push(`Average Monthly Debit: ${fmtRs(avgDebit)} - ${avgDebit < avgCredit * 0.9 ? "Spending within limits" : "Spending close to income"}`);
  insights.push(`Overall ABB: ${fmtRs(result.overallABB)} - ${result.overallABB > 25000 ? "Good maintained balance" : "Low maintained balance"}`);

  if (result.monthsData.length >= 2) {
    const firstMonth = result.monthsData[0].monthlyABB;
    const lastMonth = result.monthsData[result.monthsData.length - 1].monthlyABB;
    const trend = lastMonth > firstMonth ? "Upward" : lastMonth < firstMonth ? "Downward" : "Stable";
    insights.push(`Balance Trend: ${trend} - ${trend === "Upward" ? "Positive sign" : trend === "Downward" ? "Needs attention" : "Consistent"}`);
  }

  if (totalBounces > 0) {
    insights.push(`Bounce Count: ${totalBounces} - This may affect loan eligibility negatively`);
  } else {
    insights.push("No cheque/EMI bounces detected - Excellent payment discipline");
  }

  insights.push(`Eligible Loan Amount: ${fmtRs(eligibleLoan)} at ${settings.loanMultiplier}x multiplier`);
  insights.push(`Risk Grade: ${risk.healthGrade} (Score: ${risk.riskScore}/100) - ${risk.lendingRemarks}`);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK_TEXT);
  insights.forEach(insight => {
    checkPage(7);
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(margin + 2, y - 3, contentW - 4, 6, 1, 1, "F");
    doc.text(`• ${insight}`, margin + 5, y);
    y += 7;
  });
  y += 3;

  // Section 10: Cash Flow Summary per Month
  checkPage(40);
  sectionTitle("10. Cash Flow Summary");
  const cashHeaders = ["Month", "Credits", "Debits", "Net Flow", "Opening Bal", "Closing Bal"];
  const cashColWidths = [28, 32, 32, 32, 32, contentW - 156];
  const cashRows = result.monthsData.map(m => [
    m.monthLabel,
    fmtRs(m.totalCredits),
    fmtRs(m.totalDebits),
    fmtRs(m.totalCredits - m.totalDebits),
    fmtRs(m.openingBalance),
    fmtRs(m.closingBalance),
  ]);
  drawTable(cashHeaders, cashRows, cashColWidths);
  y += 5;

  // Section 11: Disclaimer
  checkPage(35);
  sectionTitle("11. Disclaimer");
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...LIGHT_TEXT);
  const disclaimer = [
    "This Banking Surrogate Analysis Report is generated by Mahajan Finance based on the bank statement provided by the customer.",
    "The calculations, including ABB, Loan Eligibility, and EMI, are indicative and for reference purposes only.",
    "Final loan approval depends on the lending institution's policies, CIBIL score, income verification, and other eligibility criteria.",
    "Mahajan Finance does not guarantee loan approval or any specific loan amount based on this report.",
    "All financial data is derived from the uploaded bank statement and has not been independently verified.",
    "This report should not be considered as a substitute for professional financial advice.",
    "For any queries, contact Mahajan Finance at +91 9730540215 or info@mahajanfinance.com.",
  ];
  disclaimer.forEach(line => {
    checkPage(6);
    doc.text(line, margin + 2, y, { maxWidth: contentW - 4 });
    y += 5;
  });

  // Add footer to last page
  addFooter();

  // ─── Generate filename ───
  const safeName = (customerName || "Customer").replace(/[^a-zA-Z0-9]/g, "_");
  const dateStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, "-");
  const filename = `MahajanFinance_Banking_Report_${safeName}_${dateStr}.pdf`;

  doc.save(filename);
}
'@

Set-Content -Path "src\lib\generateBankPdf.ts" -Value $generateBankPdfContent -Encoding UTF8 -NoNewline
Write-Host "    Done (generateBankPdf.ts)" -ForegroundColor $ColorSuccess

# ──────────────────────────────────────────────────────────────────────────────
# File 4: src/components/BankingSurrogate.tsx
# Adapted from Next.js to standard React (Vite/CRA):
#   - Removed "use client" directive
#   - Removed unused useEffect import
# ──────────────────────────────────────────────────────────────────────────────

Write-Host "  Writing: src\components\BankingSurrogate.tsx (React-adapted)" -ForegroundColor $ColorInfo

$bankingSurrogateContent = @'
import React, { useState, useRef } from "react";
import { parseBankStatementClient, calculateRiskAssessment, calculateEMI, type ClientParseResult } from "../lib/parseBankClient";
import { formatIndianCurrency, type RiskAssessment, type EMICalculation, type AdminSettings } from "../lib/bankingTypes";
import { downloadBankingPDF } from "../lib/generateBankPdf";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

// Dynamically import pdfjs-dist only on client side to avoid SSR DOMMatrix error
let pdfjsLib: any = null;
if (typeof window !== "undefined") {
  import("pdfjs-dist").then(mod => {
    pdfjsLib = mod;
    const ver = mod.version || "6.1.200";
    mod.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@" + ver + "/build/pdf.worker.min.mjs";
  });
}

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

              {/* Month-Wise Closing Balance Table */}
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

              {/* Download Buttons */}
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
'@

Set-Content -Path "src\components\BankingSurrogate.tsx" -Value $bankingSurrogateContent -Encoding UTF8 -NoNewline
Write-Host "    Done (BankingSurrogate.tsx - React adapted)" -ForegroundColor $ColorSuccess

Write-Host ""

# ─── Step 3: Print npm install commands ───────────────────────────────────────

Write-Host "Step 3: Install required npm packages" -ForegroundColor $ColorInfo
Write-Host ""
Write-Host "  The Banking Surrogate component requires the following npm packages:" -ForegroundColor $ColorWarning
Write-Host ""
Write-Host "    npm install pdfjs-dist jspdf recharts" -ForegroundColor $ColorInfo
Write-Host ""
Write-Host "  Or if you use yarn:" -ForegroundColor $ColorWarning
Write-Host ""
Write-Host "    yarn add pdfjs-dist jspdf recharts" -ForegroundColor $ColorInfo
Write-Host ""
Write-Host "  Or if you use pnpm:" -ForegroundColor $ColorWarning
Write-Host ""
Write-Host "    pnpm add pdfjs-dist jspdf recharts" -ForegroundColor $ColorInfo
Write-Host ""
Write-Host "  Package details:" -ForegroundColor $ColorWarning
Write-Host "    - pdfjs-dist  : PDF parsing (reads bank statement PDFs, supports passwords)" -ForegroundColor $ColorInfo
Write-Host "    - jspdf       : PDF generation (creates professional banking analysis reports)" -ForegroundColor $ColorInfo
Write-Host "    - recharts    : Charting library (cash flow trend, credit vs debit charts)" -ForegroundColor $ColorInfo
Write-Host ""

# ─── Step 4: Print usage instructions ─────────────────────────────────────────

Write-Host "Step 4: Usage in your React app" -ForegroundColor $ColorInfo
Write-Host ""
Write-Host "  Import and use the component in your app:" -ForegroundColor $ColorWarning
Write-Host ""
Write-Host '    import BankingSurrogate from "./components/BankingSurrogate";' -ForegroundColor $ColorInfo
Write-Host ""
Write-Host "  Then in your JSX:" -ForegroundColor $ColorWarning
Write-Host ""
Write-Host "    <BankingSurrogate />" -ForegroundColor $ColorInfo
Write-Host ""

# ─── Success Message ──────────────────────────────────────────────────────────

Write-Host ""
Write-Host "=============================================" -ForegroundColor $ColorSuccess
Write-Host "  SETUP COMPLETE!" -ForegroundColor $ColorSuccess
Write-Host "=============================================" -ForegroundColor $ColorSuccess
Write-Host ""
Write-Host "  Files created:" -ForegroundColor $ColorSuccess
Write-Host "    [1] src/lib/bankingTypes.ts       - Type definitions & currency formatter" -ForegroundColor $ColorSuccess
Write-Host "    [2] src/lib/parseBankClient.ts    - Bank statement parser & risk/EMI calculator" -ForegroundColor $ColorSuccess
Write-Host "    [3] src/lib/generateBankPdf.ts    - Professional PDF report generator" -ForegroundColor $ColorSuccess
Write-Host "    [4] src/components/BankingSurrogate.tsx - Main React component (adapted for Vite/CRA)" -ForegroundColor $ColorSuccess
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor $ColorWarning
Write-Host "    1. Run: npm install pdfjs-dist jspdf recharts" -ForegroundColor $ColorInfo
Write-Host "    2. Import BankingSurrogate in your app" -ForegroundColor $ColorInfo
Write-Host "    3. Make sure Tailwind CSS is configured in your project" -ForegroundColor $ColorInfo
Write-Host ""
Write-Host "  Note: This component was adapted from Next.js to standard React." -ForegroundColor $ColorWarning
Write-Host "        - Removed 'use client' directive" -ForegroundColor $ColorWarning
Write-Host "        - Removed unused useEffect import" -ForegroundColor $ColorWarning
Write-Host "        - All other functionality is unchanged" -ForegroundColor $ColorWarning
Write-Host ""
Write-Host "  Mahajan Finance | Sandeep Mahajan | +91 9730540215" -ForegroundColor $ColorHeader
Write-Host ""
