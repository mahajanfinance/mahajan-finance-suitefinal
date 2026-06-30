# ============================================================
# Mahajan Finance - Banking Surrogate V2.0 Setup Script
# ============================================================
# Run this in your project root folder:
#   D:\mahajan-finance-suite-main cashflow added
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File .\setup_banking_surrogate_v2.ps1
# ============================================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Mahajan Finance - Banking Surrogate V2.0  " -ForegroundColor Cyan
Write-Host "  Setup Script                              " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Pre-flight check
if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: package.json not found. Please run this script from your project root." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "src")) {
    Write-Host "ERROR: src/ folder not found. Please run this script from your project root." -ForegroundColor Red
    exit 1
}

# Create directories
Write-Host "[1/5] Creating directories..." -ForegroundColor Yellow
if (-not (Test-Path "src\lib")) { New-Item -ItemType Directory -Path "src\lib" -Force | Out-Null }
if (-not (Test-Path "src\pages")) { New-Item -ItemType Directory -Path "src\pages" -Force | Out-Null }
Write-Host "  OK - src\lib\ and src\pages\ ready" -ForegroundColor Green

# ============================================================
# FILE 1: src\lib\bankingTypes.ts (NEW FILE)
# ============================================================
Write-Host "[2/5] Creating src\lib\bankingTypes.ts (NEW)..." -ForegroundColor Yellow

$bankingTypes = @'
/**
 * Banking Surrogate - Type Definitions
 * All types for the banking surrogate analysis system
 */

/** Single day balance record */
export interface DayBalance {
  day: number;
  balance: number;
  date: string;
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
  monthLabel: string;
  year: number;
  month: number;
  dayBalances: DayBalance[];
  sampleDays: number[];
  monthlyABB: number;
  openingBalance: number;
  closingBalance: number;
  totalCredits: number;
  totalDebits: number;
  creditCount: number;
  debitCount: number;
  highestBalance: number;
  lowestBalance: number;
  transactions: Transaction[];
  chequeBounces: number;
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
  detectedPeriod: number;
  allTransactions: Transaction[];
}

/** Risk assessment result */
export interface RiskAssessment {
  riskScore: number;
  healthGrade: string;
  lendingRemarks: string;
  suggestedMaxLoan: number;
}

/** EMI Calculation result */
export interface EMICalculation {
  loanAmount: number;
  interestRate: number;
  tenure: number;
  monthlyEMI: number;
  totalInterest: number;
  totalRepayment: number;
}

/** Admin configurable settings */
export interface AdminSettings {
  loanMultiplier: number;
  interestRate: number;
  defaultTenure: number;
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

/** Indian currency formatter - produces Rs. 25,450 / Rs. 1,24,580 / Rs. 8,75,000 */
export function formatIndianCurrency(amount: number): string {
  if (amount === 0 || isNaN(amount)) return "Rs. 0";
  const isNegative = amount < 0;
  const absAmount = Math.abs(Math.round(amount));
  const numStr = absAmount.toString();
  
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

Set-Content -Path "src\lib\bankingTypes.ts" -Value $bankingTypes -Encoding UTF8
Write-Host "  OK - src\lib\bankingTypes.ts created" -ForegroundColor Green

# ============================================================
# FILE 2: src\lib\parseBankClient.ts (REPLACE)
# ============================================================
Write-Host "[3/5] Replacing src\lib\parseBankClient.ts..." -ForegroundColor Yellow

$parseBankClient = @'
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
  const rowPatterns = [
    /^(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})\s+(.+?)\s+([\d,]+\.\d{2})?\s*([\d,]+\.\d{2})?\s+([\d,]+\.\d{2})\s*(Cr|Dr)?/i,
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

        let debit = 0, credit = 0, balance = 0;
        const narration = match[2] || "";

        if (match[5]) {
          const val3 = parseAmount(match[3]);
          const val4 = parseAmount(match[4]);
          balance = parseAmount(match[5]);
          const isDr = (match[6] || "").toUpperCase() === "DR";

          if (val3 > 0 && val4 === 0) {
            if (/credit|cr|received|refund|cash\s*dep/i.test(narration)) {
              credit = val3;
            } else {
              debit = val3;
            }
          } else if (val3 > 0 && val4 > 0) {
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
        break;
      }
    }
  }

  // --- Phase 2: Alternative extraction if no transactions found ---
  if (transactions.length === 0) {
    for (const line of lines) {
      const dateMatch = line.match(/(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/);
      if (!dateMatch) continue;

      const date = parseDate(dateMatch[1]);
      if (!date) continue;

      const dateKey = date.toISOString().slice(0, 10);
      dateSet.add(dateKey);

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

    monthTxns.sort((a, b) => a.date.localeCompare(b.date));

    const dayBalances: DayBalance[] = [];
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const adjustedSampleDays = SAMPLE_DAYS.map(d => Math.min(d, lastDayOfMonth));

    for (const targetDay of adjustedSampleDays) {
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

    const validDayBalances = dayBalances.filter(d => d.balance > 0);
    const monthlyABB = validDayBalances.length > 0
      ? validDayBalances.reduce((s, d) => s + d.balance, 0) / validDayBalances.length
      : 0;

    const openingBalance = monthTxns.length > 0 ? monthTxns[0].balance : 0;
    const closingBalance = monthTxns.length > 0 ? monthTxns[monthTxns.length - 1].balance : 0;

    const totalCredits = monthTxns.reduce((s, t) => s + t.credit, 0);
    const totalDebits = monthTxns.reduce((s, t) => s + t.debit, 0);
    const creditCount = monthTxns.filter(t => t.credit > 0).length;
    const debitCount = monthTxns.filter(t => t.debit > 0).length;

    const balancesWithValues = monthTxns.filter(t => t.balance > 0).map(t => t.balance);
    const highestBalance = balancesWithValues.length > 0 ? Math.max(...balancesWithValues) : 0;
    const lowestBalance = balancesWithValues.length > 0 ? Math.min(...balancesWithValues) : 0;

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
  let score = 50;

  const { monthsData, overallABB } = result;
  if (monthsData.length === 0) return { riskScore: 0, healthGrade: "C", lendingRemarks: "Insufficient Data", suggestedMaxLoan: 0 };

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

  const abbs = monthsData.filter(m => m.monthlyABB > 0).map(m => m.monthlyABB);
  if (abbs.length >= 2) {
    const avgABB = abbs.reduce((a, b) => a + b, 0) / abbs.length;
    const variance = abbs.reduce((s, a) => s + Math.pow(a - avgABB, 2), 0) / abbs.length;
    const cv = avgABB > 0 ? Math.sqrt(variance) / avgABB : 1;
    if (cv < 0.2) score += 15;
    else if (cv < 0.4) score += 8;
    else if (cv > 0.7) score -= 10;
  }

  const totalChequeBounces = monthsData.reduce((s, m) => s + m.chequeBounces, 0);
  const totalEmiBounces = monthsData.reduce((s, m) => s + m.emiBounces, 0);
  score -= totalChequeBounces * 10;
  score -= totalEmiBounces * 15;

  const avgCredits = monthsData.reduce((s, m) => s + m.creditCount, 0) / monthsData.length;
  if (avgCredits >= 5) score += 10;
  else if (avgCredits >= 2) score += 5;
  else score -= 5;

  if (overallABB > 50000) score += 10;
  else if (overallABB > 20000) score += 5;
  else if (overallABB < 5000) score -= 5;

  score = Math.max(0, Math.min(100, Math.round(score)));

  let healthGrade: string;
  if (score >= 85) healthGrade = "A+";
  else if (score >= 70) healthGrade = "A";
  else if (score >= 55) healthGrade = "B+";
  else if (score >= 40) healthGrade = "B";
  else healthGrade = "C";

  let lendingRemarks: string;
  if (score >= 80) lendingRemarks = "Excellent Banking Profile - Highly recommended for lending";
  else if (score >= 65) lendingRemarks = "Good Banking Profile - Suitable for standard lending";
  else if (score >= 45) lendingRemarks = "Moderate Banking Profile - Lending with caution advised";
  else lendingRemarks = "Improvement Required - High risk profile";

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

Set-Content -Path "src\lib\parseBankClient.ts" -Value $parseBankClient -Encoding UTF8
Write-Host "  OK - src\lib\parseBankClient.ts replaced" -ForegroundColor Green
