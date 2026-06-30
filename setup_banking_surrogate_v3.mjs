/**
 * Mahajan Finance — Banking Surrogate Report v3
 * Complete Setup Script — Run: node setup_banking_surrogate_v3.mjs
 *
 * What's NEW in v3:
 * - ABB Period Selector with pricing (3M/Rs.39, 6M/Rs.69, 12M/Rs.99, 24M/Rs.139)
 * - Razorpay payment amount matches selected period
 * - Auto-download PDF after successful Razorpay payment
 * - Razorpay key configurable + error handling
 * - filteredMonths used for period-based ABB calculation
 * - Charts use filteredMonths (selected period only)
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const FILES = {};

// ═══════════════════════════════════════════════════════════════════
// FILE 1: src/lib/bankingTypes.ts
// ═══════════════════════════════════════════════════════════════════
FILES["src/lib/bankingTypes.ts"] = `/**
 * Banking Surrogate - Unified Type Definitions
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

/** Day-wise balances for a month (used in UI table) */
export interface DayBalanceRow {
  day5: number;
  day10: number;
  day15: number;
  day20: number;
  day25: number;
  day30: number;
}

/** Monthly data bucket */
export interface MonthData {
  month: string;            // e.g. "Jan 2025" (label for display)
  year: number;
  monthNum: number;         // 1-12
  dayBalances: DayBalance[];
  dayBalanceRow: DayBalanceRow;  // Convenience access for UI table
  monthlyAverage: number;   // Average balance for this month
  openingBalance: number;
  closingBalance: number;
  minBalance: number;
  maxBalance: number;
  totalCredits: number;
  totalDebits: number;
  creditCount: number;
  debitCount: number;
  chequeBounces: number;
  emiBounces: number;
  transactions: Transaction[];
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

/** Risk assessment result (matches UI expectations) */
export interface RiskAssessment {
  score: number;              // 0-100
  grade: string;              // A+, A, B+, B, C
  remarks: string[];          // AI lending remarks array
  cashFlowTrend: "improving" | "stable" | "declining";
  chequeBounces: number;
  emiBounces: number;
  suggestedMaxLoan: number;
}

/** Single row in amortization schedule */
export interface AmortizationRow {
  month: number;
  emi: number;
  principal: number;
  interest: number;
  balance: number;
}

/** EMI Calculation result (matches UI expectations) */
export interface EMICalculation {
  loanAmount: number;
  interestRate: number;
  tenureMonths: number;
  monthlyEMI: number;
  totalInterest: number;
  totalPayment: number;
  amortizationSchedule: AmortizationRow[];
}

/** Admin configurable settings */
export interface AdminSettings {
  loanMultiplier: number;   // e.g. 15, 20, 25, 30
  interestRate: number;     // e.g. 14
  defaultTenure: number;    // months
}

/** ABB Period selection option with pricing */
export interface ABBPeriodOption {
  months: number;        // 3, 6, 12, 24
  price: number;         // Price in paise (for Razorpay)
  label: string;         // e.g. "3 Months"
  priceDisplay: string;  // e.g. "Rs. 39"
}

/** Available ABB period options */
export const ABB_PERIOD_OPTIONS: ABBPeriodOption[] = [
  { months: 3,  price: 3900,  label: "3 Months",  priceDisplay: "Rs. 39" },
  { months: 6,  price: 6900,  label: "6 Months",  priceDisplay: "Rs. 69" },
  { months: 12, price: 9900,  label: "12 Months", priceDisplay: "Rs. 99" },
  { months: 24, price: 13900, label: "24 Months", priceDisplay: "Rs. 139" },
];

/** Full report data (used by UI and PDF generator) */
export interface BankingReportData {
  customerName: string;
  bankName: string;
  periodMonths: number;
  selectedPeriodMonths: number;  // User-selected period (3, 6, 12, 24)
  abb: number;                   // ABB for selected period
  totalMonthsFound: number;      // Total months detected in statement
  months: MonthData[];           // All month data
  filteredMonths: MonthData[];   // Months used for ABB calculation (based on selected period)
  transactions: Transaction[];   // All transactions
  riskAssessment: RiskAssessment;
  eligibleLoan: number;
  emiCalculation: EMICalculation;
  diagnostics?: ParseDiagnostics;
}

/** Indian currency formatter: Rs. 25,450 / Rs. 1,24,580 / Rs. 8,75,000 */
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
`;

// ═══════════════════════════════════════════════════════════════════
// FILE 2: src/lib/parseBankClient.ts
// ═══════════════════════════════════════════════════════════════════
FILES["src/lib/parseBankClient.ts"] = `/**
 * Banking Surrogate - Client-Side Bank Statement Parser
 *
 * Parses text extracted from bank statement PDFs.
 * - Dynamically detects statement period (no hardcoded values)
 * - Calculates ABB based on actual data
 * - Extracts day-wise closing balances for Day 5, 10, 15, 20, 25, 30
 * - Detects cheque bounces and EMI bounces
 * - Returns types matching the UI component expectations
 */

import type {
  MonthData,
  DayBalance,
  DayBalanceRow,
  Transaction,
  RiskAssessment,
  EMICalculation,
  AmortizationRow,
  AdminSettings,
  BankingReportData,
} from "./bankingTypes";

const SAMPLE_DAYS = [5, 10, 15, 20, 25, 30];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Try to extract a numeric amount from a string */
function parseAmount(s: string): number {
  if (!s) return 0;
  const cleaned = s.replace(/[,;\\s]/g, "").replace(/Cr\\.?/i, "").replace(/Dr\\.?/i, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/** Parse a date from various Indian bank formats */
function parseDate(str: string): Date | null {
  if (!str) return null;
  const s = str.trim().replace(/['"]/g, "");

  // DD/MM/YYYY or DD-MM-YYYY
  let m = s.match(/^(\\d{1,2})[\\/\\-.](\\d{1,2})[\\/\\-.](\\d{2,4})$/);
  if (m) {
    const d = parseInt(m[1]), mo = parseInt(m[2]) - 1;
    let y = parseInt(m[3]);
    if (y < 100) y += 2000;
    return new Date(y, mo, d);
  }

  // DD Mon YYYY or DD-Mon-YYYY
  m = s.match(/^(\\d{1,2})[\\/\\-\\s]+([A-Za-z]{3,9})[\\/\\-\\s]+(\\d{2,4})$/i);
  if (m) {
    const d = parseInt(m[1]);
    const moIdx = MONTH_NAMES.findIndex(n => m[2].toLowerCase().startsWith(n.toLowerCase()));
    let y = parseInt(m[3]);
    if (y < 100) y += 2000;
    if (moIdx >= 0) return new Date(y, moIdx, d);
  }

  // YYYY-MM-DD
  m = s.match(/^(\\d{4})[\\/\\-.](\\d{1,2})[\\/\\-.](\\d{1,2})$/);
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
export function parseBankStatementClient(text: string): BankingReportData {
  const lines = text.split(/\\n/).map(l => l.trim()).filter(Boolean);
  const bankName = detectBankName(text);
  const transactions: Transaction[] = [];

  // --- Phase 1: Extract transactions from text ---
  const rowPatterns = [
    /^(\\d{1,2}[\\/\\-.]\\d{1,2}[\\/\\-.]\\d{2,4})\\s+(.+?)\\s+([\\d,]+\\.\\d{2})?\\s*([\\d,]+\\.\\d{2})?\\s+([\\d,]+\\.\\d{2})\\s*(Cr|Dr)?/i,
    /^(\\d{1,2}[\\/\\-.]\\d{1,2}[\\/\\-.]\\d{2,4})\\s+(.+?)\\s+([\\d,]+(?:\\.\\d{2})?)\\s*$/,
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
            if (/credit|cr|received|refund|cash\\s*dep/i.test(narration)) {
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
          if (/credit|cr|received|refund|cash\\s*dep/i.test(narration)) {
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
      const dateMatch = line.match(/(\\d{1,2}[\\/\\-.]\\d{1,2}[\\/\\-.]\\d{2,4})/);
      if (!dateMatch) continue;
      const date = parseDate(dateMatch[1]);
      if (!date) continue;
      const dateKey = date.toISOString().slice(0, 10);
      dateSet.add(dateKey);
      const numMatches = line.match(/[\\d,]+\\.\\d{2}/g) || [];
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

  // --- Phase 3: Group transactions by month ---
  const monthMap = new Map<string, Transaction[]>();
  for (const txn of transactions) {
    const d = new Date(txn.date);
    const key = \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, "0")}\`;
    if (!monthMap.has(key)) monthMap.set(key, []);
    monthMap.get(key)!.push(txn);
  }

  const sortedMonthKeys = Array.from(monthMap.keys()).sort();
  const months: MonthData[] = [];

  for (const mk of sortedMonthKeys) {
    const [yearStr, monthStr] = mk.split("-");
    const year = parseInt(yearStr);
    const monthNum = parseInt(monthStr);
    const monthTxns = monthMap.get(mk) || [];
    monthTxns.sort((a, b) => a.date.localeCompare(b.date));

    // Day-wise closing balances
    const dayBalances: DayBalance[] = [];
    const lastDayOfMonth = new Date(year, monthNum, 0).getDate();
    const adjustedSampleDays = SAMPLE_DAYS.map(d => Math.min(d, lastDayOfMonth));

    const dayBalanceRow: DayBalanceRow = { day5: 0, day10: 0, day15: 0, day20: 0, day25: 0, day30: 0 };

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
      const bal = bestTxn ? bestTxn.balance : 0;
      dayBalances.push({
        day: targetDay,
        balance: bal,
        date: bestTxn ? bestTxn.date : \`\${year}-\${String(monthNum).padStart(2, "0")}-\${String(targetDay).padStart(2, "0")}\`,
      });
      // Fill dayBalanceRow
      const dayKey = \`day\${targetDay}\` as keyof DayBalanceRow;
      if (dayKey in dayBalanceRow) {
        (dayBalanceRow as any)[dayKey] = bal;
      }
    }

    // Monthly Average = (Day5 + Day10 + Day15 + Day20 + Day25 + Day30) / 6
    const validDayBalances = dayBalances.filter(d => d.balance > 0);
    const monthlyAverage = validDayBalances.length > 0
      ? validDayBalances.reduce((s, d) => s + d.balance, 0) / validDayBalances.length
      : 0;

    // Opening, closing, min, max
    const openingBalance = monthTxns.length > 0 ? monthTxns[0].balance : 0;
    const closingBalance = monthTxns.length > 0 ? monthTxns[monthTxns.length - 1].balance : 0;
    const balancesWithValues = monthTxns.filter(t => t.balance > 0).map(t => t.balance);
    const maxBalance = balancesWithValues.length > 0 ? Math.max(...balancesWithValues) : 0;
    const minBalance = balancesWithValues.length > 0 ? Math.min(...balancesWithValues) : 0;

    // Credits and debits
    const totalCredits = monthTxns.reduce((s, t) => s + t.credit, 0);
    const totalDebits = monthTxns.reduce((s, t) => s + t.debit, 0);
    const creditCount = monthTxns.filter(t => t.credit > 0).length;
    const debitCount = monthTxns.filter(t => t.debit > 0).length;

    // Bounce detection
    const chequeBounces = monthTxns.filter(t =>
      /chq\\s*bounce|cheque\\s*return|dishono|bounce|ret\\s*chq/i.test(t.narration)
    ).length;
    const emiBounces = monthTxns.filter(t =>
      /emi\\s*bounce|emi\\s*return|ecs\\s*return|ecs\\s*bounce|bounce\\s*emi/i.test(t.narration)
    ).length;

    months.push({
      month: \`\${MONTH_NAMES[monthNum - 1]} \${year}\`,
      year,
      monthNum,
      dayBalances,
      dayBalanceRow,
      monthlyAverage,
      openingBalance,
      closingBalance,
      minBalance,
      maxBalance,
      totalCredits,
      totalDebits,
      creditCount,
      debitCount,
      chequeBounces,
      emiBounces,
      transactions: monthTxns,
    });
  }

  // --- Phase 4: Calculate overall ABB ---
  const monthsWithABB = months.filter(m => m.monthlyAverage > 0);
  const abb = monthsWithABB.length > 0
    ? monthsWithABB.reduce((s, m) => s + m.monthlyAverage, 0) / monthsWithABB.length
    : 0;

  // --- Phase 5: Build risk assessment ---
  const riskAssessment = calculateRiskAssessment(months, abb);

  // --- Phase 6: Calculate loan eligibility ---
  const eligibleLoan = Math.round(abb * 20); // Default 20x, will be recalculated

  // --- Phase 7: EMI calculation (placeholder, will be recalculated) ---
  const emiCalculation: EMICalculation = {
    loanAmount: eligibleLoan,
    interestRate: 14,
    tenureMonths: 36,
    monthlyEMI: 0,
    totalInterest: 0,
    totalPayment: 0,
    amortizationSchedule: [],
  };

  return {
    customerName: "",
    bankName,
    periodMonths: months.length,
    selectedPeriodMonths: months.length,
    abb,
    totalMonthsFound: months.length,
    months,
    filteredMonths: months,
    transactions,
    riskAssessment,
    eligibleLoan,
    emiCalculation,
  };
}

/**
 * Calculate ABB for a specific selected period (e.g. last 3, 6, 12, 24 months).
 * Takes the most recent N months from the data.
 */
export function calculateABBForPeriod(
  allMonths: MonthData[],
  selectedMonths: number
): { filteredMonths: MonthData[]; abb: number } {
  // Take the LAST N months (most recent)
  const filteredMonths = allMonths.slice(-selectedMonths);
  const monthsWithABB = filteredMonths.filter(m => m.monthlyAverage > 0);
  const abb = monthsWithABB.length > 0
    ? monthsWithABB.reduce((s, m) => s + m.monthlyAverage, 0) / monthsWithABB.length
    : 0;
  return { filteredMonths, abb };
}

/**
 * Calculate risk score and health grade based on banking behavior
 */
export function calculateRiskAssessment(
  months: MonthData[],
  abb: number,
  loanMultiplier: number = 20
): RiskAssessment {
  if (months.length === 0) {
    return {
      score: 0,
      grade: "C",
      remarks: ["Insufficient data for risk assessment"],
      cashFlowTrend: "stable",
      chequeBounces: 0,
      emiBounces: 0,
      suggestedMaxLoan: 0,
    };
  }

  let score = 50;
  const remarks: string[] = [];

  // Factor 1: ABB trend
  let cashFlowTrend: "improving" | "stable" | "declining" = "stable";
  if (months.length >= 2) {
    const firstHalf = months.slice(0, Math.ceil(months.length / 2));
    const secondHalf = months.slice(Math.ceil(months.length / 2));
    const firstAvg = firstHalf.reduce((s, m) => s + m.monthlyAverage, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, m) => s + m.monthlyAverage, 0) / secondHalf.length;
    const trendPct = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
    if (trendPct > 20) { score += 15; cashFlowTrend = "improving"; remarks.push("Strong upward balance trend detected"); }
    else if (trendPct > 5) { score += 8; cashFlowTrend = "improving"; remarks.push("Positive balance trend"); }
    else if (trendPct < -20) { score -= 15; cashFlowTrend = "declining"; remarks.push("Significant balance decline detected - requires attention"); }
    else if (trendPct < -5) { score -= 8; cashFlowTrend = "declining"; remarks.push("Slight balance decline observed"); }
    else { cashFlowTrend = "stable"; remarks.push("Balance trend is stable"); }
  }

  // Factor 2: Consistency (low variance = better)
  const abbs = months.filter(m => m.monthlyAverage > 0).map(m => m.monthlyAverage);
  if (abbs.length >= 2) {
    const avgABB = abbs.reduce((a, b) => a + b, 0) / abbs.length;
    const variance = abbs.reduce((s, a) => s + Math.pow(a - avgABB, 2), 0) / abbs.length;
    const cv = avgABB > 0 ? Math.sqrt(variance) / avgABB : 1;
    if (cv < 0.2) { score += 15; remarks.push("Very consistent balance maintenance"); }
    else if (cv < 0.4) { score += 8; remarks.push("Reasonably consistent balance"); }
    else if (cv > 0.7) { score -= 10; remarks.push("High balance variability - risky pattern"); }
  }

  // Factor 3: Cheque/EMI bounces
  const totalChequeBounces = months.reduce((s, m) => s + m.chequeBounces, 0);
  const totalEmiBounces = months.reduce((s, m) => s + m.emiBounces, 0);
  score -= totalChequeBounces * 10;
  score -= totalEmiBounces * 15;
  if (totalChequeBounces > 0) remarks.push(\`\${totalChequeBounces} cheque bounce(s) detected - negative indicator\`);
  if (totalEmiBounces > 0) remarks.push(\`\${totalEmiBounces} EMI bounce(s) detected - high risk signal\`);
  if (totalChequeBounces === 0 && totalEmiBounces === 0) remarks.push("No cheque/EMI bounces - excellent payment discipline");

  // Factor 4: Credit activity
  const avgCredits = months.reduce((s, m) => s + m.creditCount, 0) / months.length;
  if (avgCredits >= 5) { score += 10; remarks.push("Regular income credits observed"); }
  else if (avgCredits >= 2) { score += 5; }
  else { score -= 5; remarks.push("Low credit activity"); }

  // Factor 5: Overall ABB level
  if (abb > 50000) { score += 10; remarks.push("Strong average bank balance"); }
  else if (abb > 20000) { score += 5; remarks.push("Moderate average bank balance"); }
  else if (abb < 5000) { score -= 5; remarks.push("Low average bank balance"); }

  // Clamp
  score = Math.max(0, Math.min(100, Math.round(score)));

  // Grade
  let grade: string;
  if (score >= 85) grade = "A+";
  else if (score >= 70) grade = "A";
  else if (score >= 55) grade = "B+";
  else if (score >= 40) grade = "B";
  else grade = "C";

  // Add summary remark
  if (score >= 80) remarks.unshift("Excellent Banking Profile - Highly recommended for lending");
  else if (score >= 65) remarks.unshift("Good Banking Profile - Suitable for standard lending");
  else if (score >= 45) remarks.unshift("Moderate Banking Profile - Lending with caution advised");
  else remarks.unshift("High Risk Profile - Improvement required before lending");

  const suggestedMaxLoan = Math.round(abb * loanMultiplier);

  return {
    score,
    grade,
    remarks: remarks.slice(0, 8),
    cashFlowTrend,
    chequeBounces: totalChequeBounces,
    emiBounces: totalEmiBounces,
    suggestedMaxLoan,
  };
}

/**
 * Calculate EMI using reducing balance method with full amortization schedule
 */
export function calculateEMI(
  loanAmount: number,
  annualRate: number,
  tenureMonths: number
): EMICalculation {
  if (loanAmount <= 0 || annualRate <= 0 || tenureMonths <= 0) {
    return {
      loanAmount,
      interestRate: annualRate,
      tenureMonths,
      monthlyEMI: 0,
      totalInterest: 0,
      totalPayment: 0,
      amortizationSchedule: [],
    };
  }

  const monthlyRate = annualRate / 12 / 100;
  const emi = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  const totalPayment = Math.round(emi * tenureMonths);
  const totalInterest = totalPayment - loanAmount;

  // Build amortization schedule
  const amortizationSchedule: AmortizationRow[] = [];
  let balance = loanAmount;
  for (let i = 1; i <= tenureMonths; i++) {
    const interest = Math.round(balance * monthlyRate);
    const principal = Math.round(emi) - interest;
    balance = Math.max(Math.round(balance - principal), 0);
    amortizationSchedule.push({
      month: i,
      emi: Math.round(emi),
      principal: Math.max(principal, 0),
      interest: Math.max(interest, 0),
      balance,
    });
  }

  return {
    loanAmount,
    interestRate: annualRate,
    tenureMonths,
    monthlyEMI: Math.round(emi),
    totalInterest,
    totalPayment,
    amortizationSchedule,
  };
}
`;

// ═══════════════════════════════════════════════════════════════════
// FILE 3: src/lib/generateBankPdf.ts
// ═══════════════════════════════════════════════════════════════════
FILES["src/lib/generateBankPdf.ts"] = `/**
 * Banking Surrogate - Professional PDF Generator
 *
 * Features:
 * - Multi-page support with auto page breaks
 * - Mahajan Finance transparent watermark on every page (6% opacity, 45 deg)
 * - Indian currency formatting everywhere
 * - 11 report sections with professional design
 * - Dynamic period detection
 * - Risk Score, Banking Health Grade
 * - EMI Schedule with amortization table
 * - Page numbers
 * - Professional header/footer branding
 * - Filename: MahajanFinance_Banking_Report_<Name>_<DD-MM-YYYY>.pdf
 */

import jsPDF from "jspdf";
import type { BankingReportData, AdminSettings, AmortizationRow } from "./bankingTypes";
import { formatIndianCurrency } from "./bankingTypes";

const BRAND_COLOR = [30, 64, 175] as const;
const ACCENT_COLOR = [22, 163, 74] as const;
const DARK_TEXT = [31, 41, 55] as const;
const LIGHT_TEXT = [107, 114, 128] as const;
const TABLE_HEADER_BG = [219, 234, 254] as const;
const TABLE_ALT_BG = [249, 250, 251] as const;

/** Indian currency format for PDF */
function fmtRs(amount: number): string {
  if (amount === 0 || isNaN(amount)) return "Rs. 0";
  return formatIndianCurrency(amount);
}

/**
 * Generate and download the Banking Surrogate PDF report.
 * Called from BankingSurrogate.tsx as: generateBankPdf(reportData, settings)
 */
export function generateBankPdf(
  reportData: BankingReportData,
  settings: AdminSettings
): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentW = pageW - 2 * margin;
  let y = 0;
  let pageNum = 0;

  const { months, filteredMonths, abb, riskAssessment, emiCalculation, eligibleLoan } = reportData;
  const periodLabel = reportData.selectedPeriodMonths === 1 ? "1 Month" : \`\${reportData.selectedPeriodMonths} Months\`;
  const generatedDate = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

  // --- Helper Functions ---

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
    doc.setFillColor(...BRAND_COLOR);
    doc.rect(0, 0, pageW, 22, "F");
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("MAHAJAN FINANCE", margin, 10);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Banking Surrogate Analysis Report", margin, 16);
    doc.setFontSize(7);
    doc.text(generatedDate, pageW - margin, 10, { align: "right" });
    doc.text(\`Period: \${periodLabel}\`, pageW - margin, 16, { align: "right" });
    y = 28;
  }

  function addFooter() {
    doc.setFillColor(...BRAND_COLOR);
    doc.rect(0, pageH - 15, pageW, 15, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(255, 255, 255);
    doc.text("Mahajan Finance | Sandeep Mahajan | +91 9730540215 | Pan India Service", margin, pageH - 7);
    doc.text(\`Page \${pageNum}\`, pageW - margin, pageH - 7, { align: "right" });
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
    if (y + Math.min((rows.length + 1) * rowH, 40) > pageH - 20) {
      addFooter();
      newPage();
    }

    // Header row
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

    // Data rows
    rows.forEach((row, ri) => {
      if (y + rowH > pageH - 20) {
        addFooter();
        newPage();
        // Re-draw header on new page
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

  // --- PAGE 1: Cover + Customer + Bank Info ---

  newPage();

  // Cover section
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
  doc.text(\`Report Generated: \${generatedDate} | Analysis Period: \${periodLabel}\`, margin + 10, y + 28);
  y += 40;

  // Section 1: Customer Information
  sectionTitle("1. Customer Information");
  labelValue("Full Name", reportData.customerName || "N/A");
  labelValue("Report Date", generatedDate);
  y += 3;

  // Section 2: Bank Information
  sectionTitle("2. Bank Information");
  labelValue("Bank Name", reportData.bankName || "N/A");
  labelValue("Statement Period", periodLabel);
  labelValue("Months Analysed", String(reportData.totalMonthsFound));
  labelValue("ABB Period Selected", \`\${reportData.selectedPeriodMonths} Months\`);
  y += 3;

  // Section 3: Statement Analysis Summary
  sectionTitle("3. Statement Analysis Summary");
  labelValue("Overall ABB", fmtRs(abb));
  labelValue("Opening Balance", fmtRs(months[0]?.openingBalance || 0));
  labelValue("Closing Balance", fmtRs(months[months.length - 1]?.closingBalance || 0));
  labelValue("Total Credits", fmtRs(months.reduce((s, m) => s + m.totalCredits, 0)));
  labelValue("Total Debits", fmtRs(months.reduce((s, m) => s + m.totalDebits, 0)));
  labelValue("Highest Balance", fmtRs(months.length > 0 ? Math.max(...months.map(m => m.maxBalance)) : 0));
  labelValue("Lowest Balance", fmtRs(months.length > 0 ? Math.min(...months.filter(m => m.minBalance > 0).map(m => m.minBalance)) : 0));
  labelValue("Avg Monthly Credit", fmtRs(months.reduce((s, m) => s + m.totalCredits, 0) / Math.max(months.length, 1)));
  labelValue("Avg Monthly Debit", fmtRs(months.reduce((s, m) => s + m.totalDebits, 0) / Math.max(months.length, 1)));
  labelValue("Cheque Bounces", String(riskAssessment.chequeBounces));
  labelValue("EMI Bounces", String(riskAssessment.emiBounces));
  y += 3;

  // Section 4: Risk Assessment
  sectionTitle("4. Risk Assessment & Banking Health");
  const scoreColor = riskAssessment.score >= 70 ? ACCENT_COLOR : riskAssessment.score >= 45 ? [234, 179, 8] as const : [220, 38, 38] as const;
  doc.setFillColor(...scoreColor);
  doc.roundedRect(margin + 2, y, 30, 20, 2, 2, "F");
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(String(riskAssessment.score), margin + 17, y + 13, { align: "center" });
  doc.setFontSize(6);
  doc.text("/100", margin + 17, y + 17, { align: "center" });

  doc.setFillColor(...BRAND_COLOR);
  doc.roundedRect(margin + 36, y, 20, 20, 2, 2, "F");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(riskAssessment.grade, margin + 46, y + 13, { align: "center" });
  doc.setFontSize(5);
  doc.text("Grade", margin + 46, y + 17, { align: "center" });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK_TEXT);
  const trendLabel = riskAssessment.cashFlowTrend.charAt(0).toUpperCase() + riskAssessment.cashFlowTrend.slice(1);
  doc.text(\`Cash Flow Trend: \${trendLabel}\`, margin + 60, y + 8);
  doc.text(\`Suggested Max Loan: \${fmtRs(riskAssessment.suggestedMaxLoan)}\`, margin + 60, y + 15);
  y += 25;

  // AI Remarks
  subTitle("AI Lending Remarks");
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK_TEXT);
  riskAssessment.remarks.forEach(r => {
    checkPage(6);
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(margin + 2, y - 3, contentW - 4, 5, 1, 1, "F");
    doc.text(\`- \${r}\`, margin + 5, y);
    y += 6;
  });
  y += 3;

  // Section 5: Month-Wise Closing Figures
  sectionTitle("5. Month-Wise Closing Balance Table");

  const closingHeaders = ["Month", "Day 5", "Day 10", "Day 15", "Day 20", "Day 25", "Day 30", "Monthly Avg"];
  const closingColWidths = [28, 22, 22, 22, 22, 22, 22, contentW - 160];
  const closingRows = filteredMonths.map(m => [
    m.month,
    fmtRs(m.dayBalanceRow.day5),
    fmtRs(m.dayBalanceRow.day10),
    fmtRs(m.dayBalanceRow.day15),
    fmtRs(m.dayBalanceRow.day20),
    fmtRs(m.dayBalanceRow.day25),
    fmtRs(m.dayBalanceRow.day30),
    fmtRs(m.monthlyAverage),
  ]);
  drawTable(closingHeaders, closingRows, closingColWidths);

  // Overall ABB row
  checkPage(8);
  doc.setFillColor(219, 234, 254);
  doc.rect(margin, y, contentW, 7, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND_COLOR);
  doc.text("Overall Average Bank Balance (ABB)", margin + 2, y + 5);
  doc.text(fmtRs(abb), pageW - margin - 2, y + 5, { align: "right" });
  y += 10;

  // Section 6: ABB Calculation Sheet
  sectionTitle("6. ABB Calculation Sheet");
  subTitle("Formula: Monthly Average = (Day5 + Day10 + Day15 + Day20 + Day25 + Day30) / 6");
  subTitle("Overall ABB = Sum of Monthly Averages / Number of Months");

  const abbHeaders = ["Month", "Day 5", "Day 10", "Day 15", "Day 20", "Day 25", "Day 30", "Sum", "Monthly ABB"];
  const abbColWidths = [24, 20, 20, 20, 20, 20, 20, 24, contentW - 168];
  const abbRows = filteredMonths.map(m => {
    const dayVals = [m.dayBalanceRow.day5, m.dayBalanceRow.day10, m.dayBalanceRow.day15, m.dayBalanceRow.day20, m.dayBalanceRow.day25, m.dayBalanceRow.day30];
    const sum = dayVals.reduce((s, v) => s + Math.round(v), 0);
    return [m.month, ...dayVals.map(v => String(Math.round(v))), String(sum), fmtRs(m.monthlyAverage)];
  });
  drawTable(abbHeaders, abbRows, abbColWidths);

  checkPage(8);
  doc.setFillColor(...ACCENT_COLOR);
  doc.roundedRect(margin, y, contentW, 8, 1, 1, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(\`Overall ABB (\${reportData.selectedPeriodMonths} Months) = \${fmtRs(abb)}\`, margin + 3, y + 5.5);
  y += 12;

  // --- NEW PAGE ---

  addFooter();
  newPage();

  // Section 7: Loan Eligibility
  sectionTitle("7. Loan Eligibility");
  labelValue("Average Bank Balance (ABB)", fmtRs(abb));
  labelValue("Loan Multiplier", \`\${settings.loanMultiplier}x\`);
  labelValue("Eligible Loan Amount", fmtRs(eligibleLoan));
  labelValue("Formula", \`ABB x \${settings.loanMultiplier} = \${fmtRs(abb)} x \${settings.loanMultiplier}\`);
  y += 3;

  // Section 8: EMI Schedule
  sectionTitle("8. EMI Schedule");
  labelValue("Loan Amount", fmtRs(emiCalculation.loanAmount));
  labelValue("Interest Rate (p.a.)", \`\${emiCalculation.interestRate}%\`);
  labelValue("Tenure", \`\${emiCalculation.tenureMonths} months\`);
  labelValue("Monthly EMI", fmtRs(emiCalculation.monthlyEMI));
  labelValue("Total Interest Payable", fmtRs(emiCalculation.totalInterest));
  labelValue("Total Repayment Amount", fmtRs(emiCalculation.totalPayment));
  labelValue("Method", "Reducing Balance EMI");
  y += 3;

  // EMI amortization table
  subTitle("EMI Amortization Schedule");
  const amortHeaders = ["Month", "EMI", "Principal", "Interest", "Balance"];
  const amortColWidths = [20, 30, 30, 30, contentW - 110];
  const displayMonths = Math.min(emiCalculation.amortizationSchedule.length, 24);
  const amortRows = emiCalculation.amortizationSchedule.slice(0, displayMonths).map((row: AmortizationRow) => [
    String(row.month),
    fmtRs(row.emi),
    fmtRs(row.principal),
    fmtRs(row.interest),
    fmtRs(row.balance),
  ]);
  if (emiCalculation.tenureMonths > 24) {
    amortRows.push([\`...\`, \`+ \${emiCalculation.tenureMonths - 24} more months\`, "", "", ""]);
  }
  drawTable(amortHeaders, amortRows, amortColWidths);
  y += 5;

  // Section 9: Key Financial Insights
  checkPage(50);
  sectionTitle("9. Key Financial Insights");

  const insights: string[] = [];
  const avgCredit = filteredMonths.reduce((s, m) => s + m.totalCredits, 0) / Math.max(filteredMonths.length, 1);
  const avgDebit = filteredMonths.reduce((s, m) => s + m.totalDebits, 0) / Math.max(filteredMonths.length, 1);
  const totalBounces = riskAssessment.chequeBounces + riskAssessment.emiBounces;

  insights.push(\`Average Monthly Credit: \${fmtRs(avgCredit)} - \${avgCredit > 30000 ? "Healthy income flow" : "Moderate income flow"}\`);
  insights.push(\`Average Monthly Debit: \${fmtRs(avgDebit)} - \${avgDebit < avgCredit * 0.9 ? "Spending within limits" : "Spending close to income"}\`);
  insights.push(\`Overall ABB (\${reportData.selectedPeriodMonths} Months): \${fmtRs(abb)} - \${abb > 25000 ? "Good maintained balance" : "Low maintained balance"}\`);

  if (filteredMonths.length >= 2) {
    const firstMonth = filteredMonths[0].monthlyAverage;
    const lastMonth = filteredMonths[filteredMonths.length - 1].monthlyAverage;
    const trend = lastMonth > firstMonth ? "Upward" : lastMonth < firstMonth ? "Downward" : "Stable";
    insights.push(\`Balance Trend: \${trend} - \${trend === "Upward" ? "Positive sign" : trend === "Downward" ? "Needs attention" : "Consistent"}\`);
  }

  if (totalBounces > 0) {
    insights.push(\`Bounce Count: \${totalBounces} - This may affect loan eligibility negatively\`);
  } else {
    insights.push("No cheque/EMI bounces detected - Excellent payment discipline");
  }

  insights.push(\`Eligible Loan Amount: \${fmtRs(eligibleLoan)} at \${settings.loanMultiplier}x multiplier\`);
  insights.push(\`Risk Grade: \${riskAssessment.grade} (Score: \${riskAssessment.score}/100)\`);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK_TEXT);
  insights.forEach(insight => {
    checkPage(7);
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(margin + 2, y - 3, contentW - 4, 6, 1, 1, "F");
    doc.text(\`- \${insight}\`, margin + 5, y);
    y += 7;
  });
  y += 3;

  // Section 10: Cash Flow Summary
  checkPage(40);
  sectionTitle("10. Cash Flow Summary");
  const cashHeaders = ["Month", "Credits", "Debits", "Net Flow", "Opening Bal", "Closing Bal"];
  const cashColWidths = [28, 32, 32, 32, 32, contentW - 156];
  const cashRows = filteredMonths.map(m => [
    m.month,
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

  addFooter();

  // --- Generate filename ---
  const safeName = (reportData.customerName || "Customer").replace(/[^a-zA-Z0-9]/g, "_");
  const dateStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\\//g, "-");
  const filename = \`MahajanFinance_Banking_Report_\${safeName}_\${dateStr}.pdf\`;

  doc.save(filename);
}
`;

// ═══════════════════════════════════════════════════════════════════
// FILE 4: src/pages/BankingSurrogate.tsx
// ═══════════════════════════════════════════════════════════════════
FILES["src/pages/BankingSurrogate.tsx"] = `import { useState, useRef, useCallback } from "react";
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
 * RAZORPAY KEY CONFIGURATION
 * Replace with your actual Razorpay Key ID from https://dashboard.razorpay.com/#/access-keys
 * Example: "rzp_live_XXXXXXXXXXXX" (production) or "rzp_test_XXXXXXXXXXXX" (test mode)
 */
const RAZORPAY_KEY = "rzp_test_T4KRRFabwHv6dz";

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
      fullText += pageText + "\\n";
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
        "Razorpay Not Configured\\n\\n" +
        "To enable payments, please update the RAZORPAY_KEY in BankingSurrogate.tsx\\n\\n" +
        "Steps:\\n" +
        "1. Go to https://dashboard.razorpay.com/#/access-keys\\n" +
        "2. Copy your Key ID (starts with rzp_live_ or rzp_test_)\\n" +
        "3. Replace RAZORPAY_KEY value in src/pages/BankingSurrogate.tsx"
      );
      return;
    }

    // Check if Razorpay SDK is loaded
    if (typeof (window as any).Razorpay === "undefined") {
      alert(
        "Razorpay SDK Not Loaded\\n\\n" +
        "Please add this script tag to your index.html inside <head>:\\n\\n" +
        '<script src="https://checkout.razorpay.com/v1/checkout.js"></script>'
      );
      return;
    }

    const options: any = {
      key: RAZORPAY_KEY,
      amount: selectedPeriod.price, // amount in paise (3900, 6900, 9900, 13900)
      currency: "INR",
      name: "Mahajan Finance",
      description: \`Banking Surrogate Report - \${selectedPeriod.label} ABB\`,
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
        alert("Payment Successful!\\nPayment ID: " + response.razorpay_payment_id + "\\nYour Banking Report PDF is downloading...");
      },
    };
    try {
      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        alert("Payment failed: " + (response.error.description || "Unknown error"));
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
                    className={\`px-4 py-2 rounded-lg font-semibold text-sm transition-all \${
                      settings.loanMultiplier === m ? "bg-blue-600 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }\`}
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
                    className={\`relative rounded-xl p-4 border-2 transition-all text-center \${
                      selectedPeriod.months === opt.months
                        ? "border-blue-600 bg-blue-50 shadow-lg"
                        : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50"
                    }\`}
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
                        strokeDasharray={\`\${(reportData.riskAssessment.score / 100) * 351.86} 351.86\`}
                      />
                    </svg>
                    <span className="absolute text-3xl font-bold text-gray-800">{reportData.riskAssessment.score}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Risk Score (0-100)</p>
                </div>
                <div className="flex flex-col justify-center">
                  <div className="mb-3">
                    <span className="text-sm text-gray-500">Grade:</span>
                    <span className={\`ml-2 text-2xl font-bold \${
                      reportData.riskAssessment.grade.startsWith("A") ? "text-green-600"
                      : reportData.riskAssessment.grade.startsWith("B") ? "text-yellow-600" : "text-red-600"
                    }\`}>{reportData.riskAssessment.grade}</span>
                  </div>
                  <div className="mb-3">
                    <span className="text-sm text-gray-500">Category:</span>
                    <span className="ml-2 font-semibold text-gray-700">
                      {reportData.riskAssessment.score >= 70 ? "Low Risk" : reportData.riskAssessment.score >= 40 ? "Medium Risk" : "High Risk"}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Cash Flow Trend:</span>
                    <span className={\`ml-2 font-semibold \${
                      reportData.riskAssessment.cashFlowTrend === "improving" ? "text-green-600"
                      : reportData.riskAssessment.cashFlowTrend === "declining" ? "text-red-600" : "text-yellow-600"
                    }\`}>
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
`;

// ═══════════════════════════════════════════════════════════════════
// WRITE ALL FILES
// ═══════════════════════════════════════════════════════════════════
console.log("\n🚀 Mahajan Finance — Banking Surrogate Report v3 Setup\n");

for (const [relPath, content] of Object.entries(FILES)) {
  const dir = join(".", ...relPath.split("/").slice(0, -1));
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    console.log(`  📁 Created directory: ${dir}`);
  }
  writeFileSync(relPath, content, "utf-8");
  console.log(`  ✅ Written: ${relPath}`);
}

console.log("\n✅ All 4 files written successfully!");
console.log("\n📋 What's NEW in v3:");
console.log("   • ABB Period Selector: 3M/Rs.39, 6M/Rs.69, 12M/Rs.99, 24M/Rs.139");
console.log("   • Razorpay amount matches selected period (not hardcoded Rs.499)");
console.log("   • Auto-download PDF after successful Razorpay payment");
console.log("   • Charts & tables use filteredMonths (selected period only)");
console.log("   • Razorpay error handling (key check, SDK check, payment.failed)");
console.log("\n⚠️  IMPORTANT: Add Razorpay script to index.html <head>:");
console.log('   <script src="https://checkout.razorpay.com/v1/checkout.js"></script>');
console.log("\n🏁 Run: npm run dev\n");
