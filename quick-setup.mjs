#!/usr/bin/env node
/**
 * QUICK SETUP - Creates a downloader script, then runs the full setup
 * Paste this entire file content into a file called quick-setup.mjs
 * Then run: node quick-setup.mjs
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { createRequire } from 'module';

const ROOT = process.cwd();
console.log('\n  Mahajan Finance - Quick Setup\n');

if (!fs.existsSync(path.join(ROOT, 'package.json'))) {
  console.error('  ERROR: No package.json found. Run from project root.');
  process.exit(1);
}


// ═══════════════════════════════════════════════════════════════
// EMBEDDED SOURCE FILES
// ═══════════════════════════════════════════════════════════════

const BANKING_TYPES = `/**
 * Banking Surrogate - Unified Type Definitions
 * All types for the banking surrogate analysis system
 *
 * IMPORTANT: 100% Client-Side Parsing - NO Supabase, NO External API
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

/** Single row in amortization schedule */
export interface AmortizationRow {
  month: number;
  emi: number;
  principal: number;
  interest: number;
  balance: number;
}

/** EMI Calculation result */
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

/** Full report data (used by PDF generator) */
export interface BankingReportData {
  customerName: string;
  bankName: string;
  periodMonths: number;
  abb: number;                  // Overall ABB
  months: MonthData[];          // All month data
  transactions: Transaction[];  // All transactions
  riskAssessment: RiskAssessment;
  eligibleLoan: number;
  emiCalculation: EMICalculation;
  diagnostics?: ParseDiagnostics;
}

/** Available ABB period options with pricing */
export interface ABBPeriodOption {
  months: number;
  price: number;         // Price in paise (for Razorpay)
  label: string;
  priceDisplay: string;
}

/** Available ABB period options */
export const ABB_PERIOD_OPTIONS: ABBPeriodOption[] = [
  { months: 3,  price: 3900,  label: "3 Months",  priceDisplay: "Rs. 39" },
  { months: 6,  price: 6900,  label: "6 Months",  priceDisplay: "Rs. 69" },
  { months: 12, price: 9900,  label: "12 Months", priceDisplay: "Rs. 99" },
  { months: 24, price: 13900, label: "24 Months", priceDisplay: "Rs. 139" },
];

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

const PARSE_BANK_CLIENT = `/**
 * Banking Surrogate - Universal Client-Side Bank Statement Parser
 *
 * Parses text extracted from bank statement PDFs.
 * - Supports ALL major Indian banks (40+ banks)
 * - Multiple date formats: DD/MM/YYYY, DD-MM-YYYY, DD Mon YYYY, MM/DD/YYYY, YYYY-MM-DD
 * - Multiple column layouts: debit|credit|balance, withdrawal|deposit|balance, etc.
 * - Handles Cr/Dr suffixes, Indian number formatting (1,24,580.00)
 * - Dynamic period detection with padding for selected period
 * - Day-wise closing balances for Day 5, 10, 15, 20, 25, 30
 * - Cheque bounce and EMI bounce detection
 * - NO Supabase or external API dependency - 100% local parsing
 */

import type {
  ClientParseResult,
  MonthData,
  DayBalance,
  Transaction,
  ParseDiagnostics,
  RiskAssessment,
  EMICalculation,
  AmortizationRow,
} from "./bankingTypes";

const SAMPLE_DAYS = [5, 10, 15, 20, 25, 30];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// ═══════════════════════════════════════════════════════════════
// AMOUNT PARSING - Handles Indian formatting + Cr/Dr suffixes
// ═══════════════════════════════════════════════════════════════

/** Try to extract a numeric amount from a string */
function parseAmount(s: string): number {
  if (!s) return 0;
  let cleaned = s.trim()
    .replace(/[,;\\s]/g, "")
    .replace(/Cr\\.?/i, "")
    .replace(/Dr\\.?/i, "")
    .replace(/INR/i, "")
    .replace(/Rs\\.?/i, "")
    .replace(/[()]/g, "")  // negative amounts sometimes shown as (123.45)
    .trim();
  // Handle case where there's no decimal point but has trailing zeros
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/** Parse amount that might have Cr/Dr indicator */
function parseAmountWithSuffix(s: string): { amount: number; isCredit: boolean | null } {
  if (!s) return { amount: 0, isCredit: null };
  const isCr = /\\bCr\\.?\\s*\$/i.test(s);
  const isDr = /\\bDr\\.?\\s*\$/i.test(s);
  const amount = parseAmount(s);
  return { amount, isCredit: isCr ? true : isDr ? false : null };
}

// ═══════════════════════════════════════════════════════════════
// DATE PARSING - All Indian bank date formats
// ═══════════════════════════════════════════════════════════════

/** Parse a date from various Indian bank formats */
function parseDate(str: string): Date | null {
  if (!str) return null;
  const s = str.trim().replace(/['"]/g, "").replace(/\\s+/g, " ");

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY (most common Indian format)
  let m = s.match(/^(\\d{1,2})[\\/\\-.](\\d{1,2})[\\/\\-.](\\d{2,4})\$/);
  if (m) {
    const d = parseInt(m[1]), mo = parseInt(m[2]) - 1;
    let y = parseInt(m[3]);
    if (y < 100) y += 2000;
    // Sanity check: if month > 12, it might be MM/DD/YYYY (US format from some banks)
    if (mo > 12 && d <= 12) {
      // Swap - likely US format
      return new Date(y, d - 1, mo);
    }
    if (mo >= 0 && mo <= 11 && d >= 1 && d <= 31) return new Date(y, mo, d);
  }

  // DD Mon YYYY or DD-Mon-YYYY or DD Mon, YYYY
  m = s.match(/^(\\d{1,2})[\\/\\-\\s,]+([A-Za-z]{3,9})[\\/\\-\\s,]+(\\d{2,4})\$/i);
  if (m) {
    const d = parseInt(m[1]);
    const moIdx = MONTH_NAMES.findIndex(n => m[2].toLowerCase().startsWith(n.toLowerCase()));
    if (moIdx < 0) {
      // Try full month names
      const fullIdx = MONTH_FULL.findIndex(n => m[2].toLowerCase().startsWith(n.toLowerCase()));
      if (fullIdx >= 0) {
        let y = parseInt(m[3]);
        if (y < 100) y += 2000;
        return new Date(y, fullIdx, d);
      }
    } else {
      let y = parseInt(m[3]);
      if (y < 100) y += 2000;
      return new Date(y, moIdx, d);
    }
  }

  // Mon DD, YYYY (e.g. Jan 15, 2025 - HDFC format)
  m = s.match(/^([A-Za-z]{3,9})\\s+(\\d{1,2})[,\\s]+(\\d{2,4})\$/i);
  if (m) {
    const d = parseInt(m[2]);
    const moIdx = MONTH_NAMES.findIndex(n => m[1].toLowerCase().startsWith(n.toLowerCase()));
    let y = parseInt(m[3]);
    if (y < 100) y += 2000;
    if (moIdx >= 0 && d >= 1 && d <= 31) return new Date(y, moIdx, d);
  }

  // YYYY-MM-DD (Axis Bank, IDFC format)
  m = s.match(/^(\\d{4})[\\/\\-.](\\d{1,2})[\\/\\-.](\\d{1,2})\$/);
  if (m) {
    const y = parseInt(m[1]), mo = parseInt(m[2]) - 1, d = parseInt(m[3]);
    if (mo >= 0 && mo <= 11 && d >= 1 && d <= 31) return new Date(y, mo, d);
  }

  // DD/MM/YYYY HH:MM:SS (some SBI statements)
  m = s.match(/^(\\d{1,2})[\\/\\-.](\\d{1,2})[\\/\\-.](\\d{2,4})\\s+\\d{1,2}:\\d{2}/);
  if (m) {
    const d = parseInt(m[1]), mo = parseInt(m[2]) - 1;
    let y = parseInt(m[3]);
    if (y < 100) y += 2000;
    if (mo >= 0 && mo <= 11 && d >= 1 && d <= 31) return new Date(y, mo, d);
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════
// BANK NAME DETECTION - 40+ Indian banks
// ═══════════════════════════════════════════════════════════════

function detectBankName(text: string): string {
  const upper = text.toUpperCase();
  const bankPatterns: [string, string][] = [
    // Public Sector Banks
    ["SBI|STATE BANK OF INDIA", "State Bank of India"],
    ["PUNJAB NATIONAL BANK|PNB", "Punjab National Bank"],
    ["BANK OF BARODA|BOB", "Bank of Baroda"],
    ["CANARA BANK", "Canara Bank"],
    ["UNION BANK OF INDIA", "Union Bank of India"],
    ["INDIAN BANK", "Indian Bank"],
    ["BANK OF INDIA", "Bank of India"],
    ["UCO BANK", "UCO Bank"],
    ["CENTRAL BANK OF INDIA", "Central Bank of India"],
    ["BANK OF MAHARASHTRA", "Bank of Maharashtra"],
    ["PUNJAB & SIND BANK|PUNJAB AND SIND BANK", "Punjab & Sind Bank"],
    ["INDIAN OVERSEAS BANK|IOB", "Indian Overseas Bank"],
    ["ORIENTAL BANK OF COMMERCE|OBC", "Oriental Bank of Commerce"],
    ["CORPORATION BANK", "Corporation Bank"],
    ["ANDHRA BANK", "Andhra Bank"],
    ["SYNDICATE BANK", "Syndicate Bank"],
    ["ALLAHABAD BANK", "Allahabad Bank"],
    ["UNITED BANK OF INDIA", "United Bank of India"],
    ["DENA BANK", "Dena Bank"],
    ["VIJAYA BANK", "Vijaya Bank"],
    ["ECGC", "ECGC Ltd"],

    // Private Sector Banks
    ["HDFC BANK|HDFC LTD|HDFC", "HDFC Bank"],
    ["ICICI BANK|ICICI", "ICICI Bank"],
    ["AXIS BANK", "Axis Bank"],
    ["KOTAK MAHINDRA BANK|KOTAK MAHINDRA|KOTAK", "Kotak Mahindra Bank"],
    ["IDFC FIRST BANK|IDFC FIRST|IDFC", "IDFC FIRST Bank"],
    ["INDUSIND BANK|INDUSIND", "IndusInd Bank"],
    ["YES BANK", "YES Bank"],
    ["FEDERAL BANK", "Federal Bank"],
    ["RBL BANK|RATNAKAR BANK", "RBL Bank"],
    ["BANDHAN BANK", "Bandhan Bank"],
    ["SOUTH INDIAN BANK|SIB", "South Indian Bank"],
    ["CATHOLIC SYRIAN BANK|CSB BANK|CSB", "CSB Bank"],
    ["DCB BANK|DEVELOPMENT CREDIT BANK", "DCB Bank"],
    ["TAMILNAD MERCANTILE BANK|TMB", "Tamilnad Mercantile Bank"],
    ["KARUR VYSYA BANK|KVB", "Karur Vysya Bank"],
    ["KARNATAKA BANK", "Karnataka Bank"],
    ["CITY UNION BANK|CUB", "City Union Bank"],
    ["DHANLAXMI BANK|DHANALAKSHMI BANK", "Dhanlaxmi Bank"],
    ["NAINITAL BANK", "Nainital Bank"],
    ["JAMMU & KASHMIR BANK|J&K BANK|JAMMU AND KASHMIR", "Jammu & Kashmir Bank"],
    ["LAGHU UDYOG SAHAKARI BANK", "Laghu Udyog Sahakari Bank"],

    // Small Finance Banks
    ["AU SMALL FINANCE BANK|AU SMALL FINANCE|AU BANK", "AU Small Finance Bank"],
    ["UJJIVAN SMALL FINANCE BANK|UJJIVAN", "Ujjivan Small Finance Bank"],
    ["EQUITAS SMALL FINANCE BANK|EQUITAS", "Equitas Small Finance Bank"],
    ["ESAF SMALL FINANCE BANK|ESAF", "ESAF Small Finance Bank"],
    ["FINCARE SMALL FINANCE BANK|FINCARE", "Fincare Small Finance Bank"],
    ["SURYODAY SMALL FINANCE BANK|SURYODAY", "Suryoday Small Finance Bank"],
    ["JANA SMALL FINANCE BANK|JANA", "Jana Small Finance Bank"],
    ["NORTH EAST SMALL FINANCE BANK", "North East Small Finance Bank"],
    ["UNITY SMALL FINANCE BANK", "Unity Small Finance Bank"],
    ["CAPITAL SMALL FINANCE BANK", "Capital Small Finance Bank"],
    ["UTKARSH SMALL FINANCE BANK", "Utkarsh Small Finance Bank"],

    // Payments Banks
    ["INDIA POST PAYMENTS BANK|IPPB|POST PAYMENTS", "India Post Payments Bank"],
    ["AIRTEL PAYMENTS BANK|AIRTEL PAYMENTS", "Airtel Payments Bank"],
    ["PAYTM PAYMENTS BANK|PAYTM PAYMENTS", "Paytm Payments Bank"],
    ["FINO PAYMENTS BANK|FINO PAYMENTS", "Fino Payments Bank"],
    ["NSDL PAYMENTS BANK|NSDL PAYMENTS", "NSDL Payments Bank"],

    // Co-operative Banks
    ["SARASWAT CO-OPERATIVE BANK|SARASWAT BANK", "Saraswat Co-operative Bank"],
    ["COSMOS CO-OPERATIVE BANK|COSMOS BANK", "Cosmos Co-operative Bank"],
    ["SHAMRAO VITHAL CO-OPERATIVE BANK|SHAMRAO VITHAL|SVC BANK|SVC CO-OPERATIVE", "Shamrao Vithal Co-operative Bank"],
    ["ABHYUDAYA CO-OPERATIVE BANK|ABHYUDAYA BANK", "Abhyudaya Co-operative Bank"],
    ["NKGSB CO-OPERATIVE BANK|NKGSB BANK", "NKGSB Co-operative Bank"],
    ["APNA SAHAKARI BANK|APNA BANK", "Apna Sahakari Bank"],
    ["TJSB SAHAKARI BANK|TJSB BANK", "TJSB Sahakari Bank"],
    ["JANATA SAHAKARI BANK|JANATA BANK", "Janata Sahakari Bank"],
    ["RAJKOT NAGRIK SAHAKARI BANK|RNSB", "Rajkot Nagrik Sahakari Bank"],
    ["MUMBAI DISTRICT CENTRAL CO-OP|MUMBAI DCB", "Mumbai District Central Co-op Bank"],
    ["PUNJAB AND MAHARASHTRA CO-OP|PMC BANK", "Punjab & Maharashtra Co-op Bank"],
    ["NEW INDIA CO-OPERATIVE BANK", "New India Co-operative Bank"],
    ["GHANDHI CO-OPERATIVE BANK", "Ghandhi Co-operative Bank"],
  ];
  for (const [pattern, name] of bankPatterns) {
    if (new RegExp(pattern).test(upper)) return name;
  }
  return "Unknown Bank";
}

// ═══════════════════════════════════════════════════════════════
// MONTH PADDING
// ═══════════════════════════════════════════════════════════════

function createEmptyMonth(year: number, monthNum: number): MonthData {
  return {
    monthLabel: \`\${MONTH_NAMES[monthNum - 1]} \${year}\`,
    year,
    month: monthNum,
    dayBalances: SAMPLE_DAYS.map(d => ({
      day: d,
      balance: 0,
      date: \`\${year}-\${String(monthNum).padStart(2, "0")}-\${String(d).padStart(2, "0")}\`,
    })),
    sampleDays: [...SAMPLE_DAYS],
    monthlyABB: 0,
    openingBalance: 0,
    closingBalance: 0,
    totalCredits: 0,
    totalDebits: 0,
    creditCount: 0,
    debitCount: 0,
    highestBalance: 0,
    lowestBalance: 0,
    transactions: [],
    chequeBounces: 0,
    emiBounces: 0,
  };
}

function padMonthsToPeriod(monthsData: MonthData[], targetPeriod: number): MonthData[] {
  if (monthsData.length >= targetPeriod) return monthsData;
  const padded = [...monthsData];
  const earliestMonth = monthsData[0];
  let year = earliestMonth.year;
  let monthNum = earliestMonth.month;
  while (padded.length < targetPeriod) {
    monthNum--;
    if (monthNum <= 0) { monthNum = 12; year--; }
    padded.unshift(createEmptyMonth(year, monthNum));
  }
  return padded;
}

// ═══════════════════════════════════════════════════════════════
// TRANSACTION EXTRACTION - Multi-strategy approach
// ═══════════════════════════════════════════════════════════════

/** Credit keywords for classifying transactions */
const CREDIT_KEYWORDS = /credit|cr\\.?|received|refund|cash\\s*dep|salary|neft\\s*cr|rtgs\\s*cr|imps\\s*cr|upi\\s*cr|inward|deposit|interest\\s*cred|cashback|reversal|overdraft\\s*cr/i;
const DEBIT_KEYWORDS = /debit|dr\\.?|payment|withdrawal|neft\\s*dr|rtgs\\s*dr|imps\\s*dr|upi\\s*dr|outward|emi|atm|pos|ach\\s*dr|ecs\\s*dr|nach|standing\\s*instr/i;

/**
 * Strategy 1: Standard Indian bank format
 * Date | Narration | Debit | Credit | Balance [Cr/Dr]
 */
function extractStrategy1(lines: string[]): Transaction[] {
  const transactions: Transaction[] = [];
  // Pattern: Date | Narration | [ChequeNo] | Debit | Credit | Balance Cr/Dr
  const patterns = [
    // Full format: DD/MM/YYYY Narration Debit Credit Balance Cr/Dr
    /^(\\d{1,2}[\\/\\-.]\\d{1,2}[\\/\\-.]\\d{2,4})\\s+(.+?)\\s+([\\d,]+\\.\\d{2})\\s+([\\d,]+\\.\\d{2})\\s+([\\d,]+\\.\\d{2})\\s*(Cr|Dr)?/i,
    // With cheque number: DD/MM/YYYY ChqNo Narration Debit Credit Balance
    /^(\\d{1,2}[\\/\\-.]\\d{1,2}[\\/\\-.]\\d{2,4})\\s+(\\d{6,8})?\\s*(.+?)\\s+([\\d,]+\\.\\d{2})\\s+([\\d,]+\\.\\d{2})\\s+([\\d,]+\\.\\d{2})\\s*(Cr|Dr)?/i,
    // HDFC/ICICI style: DD/MM/YYYY Narration Amount Balance Cr/Dr (debit/credit in one column)
    /^(\\d{1,2}[\\/\\-.]\\d{1,2}[\\/\\-.]\\d{2,4})\\s+(.+?)\\s+([\\d,]+\\.\\d{2})\\s+([\\d,]+\\.\\d{2})\\s*(Cr|Dr)/i,
  ];

  for (const line of lines) {
    for (let pi = 0; pi < patterns.length; pi++) {
      const match = line.match(patterns[pi]);
      if (match) {
        const dateStr = match[1];
        const date = parseDate(dateStr);
        if (!date) continue;

        const dateKey = date.toISOString().slice(0, 10);
        let debit = 0, credit = 0, balance = 0;
        let narration = "";

        if (pi === 0) {
          // Full: Date | Narration | Debit | Credit | Balance [Cr/Dr]
          narration = (match[2] || "").trim();
          const val3 = parseAmount(match[3]);
          const val4 = parseAmount(match[4]);
          balance = parseAmount(match[5]);
          const suffix = (match[6] || "").toUpperCase();

          if (val3 > 0 && val4 > 0) {
            // Two amounts: debit and credit
            if (CREDIT_KEYWORDS.test(narration)) {
              credit = val4; // credit is usually the 2nd amount
            } else {
              debit = val3;
              credit = val4;
            }
          } else if (val3 > 0) {
            if (CREDIT_KEYWORDS.test(narration) || /cr/i.test(narration)) credit = val3;
            else debit = val3;
          } else if (val4 > 0) {
            if (CREDIT_KEYWORDS.test(narration)) credit = val4;
            else debit = val4;
          }
          if (suffix === "DR") balance = -Math.abs(balance);
        } else if (pi === 1) {
          // With cheque number
          narration = (match[3] || match[2] || "").trim();
          const val4 = parseAmount(match[4]);
          const val5 = parseAmount(match[5]);
          balance = parseAmount(match[6]);
          const suffix = (match[7] || "").toUpperCase();

          if (val4 > 0 && val5 > 0) {
            if (CREDIT_KEYWORDS.test(narration)) credit = val5;
            else { debit = val4; credit = val5; }
          } else if (val4 > 0) {
            if (CREDIT_KEYWORDS.test(narration)) credit = val4;
            else debit = val4;
          }
          if (suffix === "DR") balance = -Math.abs(balance);
        } else if (pi === 2) {
          // HDFC/ICICI: Date | Narration | Amount | Balance Cr/Dr
          narration = (match[2] || "").trim();
          const amount = parseAmount(match[3]);
          const balResult = parseAmountWithSuffix(match[4]);
          balance = balResult.amount;

          // Determine debit vs credit from narration and balance change
          if (CREDIT_KEYWORDS.test(narration)) {
            credit = amount;
          } else if (DEBIT_KEYWORDS.test(narration)) {
            debit = amount;
          } else {
            // Infer from Cr/Dr suffix on balance or amount position
            const amtSuffix = (match[5] || "").toUpperCase();
            if (amtSuffix === "CR" || balResult.isCredit === true) {
              credit = amount;
            } else {
              debit = amount;
            }
          }
        }

        if (debit > 0 || credit > 0 || balance > 0) {
          transactions.push({
            date: dateKey,
            narration: narration.substring(0, 100),
            debit,
            credit,
            balance: Math.abs(balance),
          });
        }
        break; // Found a match for this line, skip other patterns
      }
    }
  }
  return transactions;
}

/**
 * Strategy 2: Flexible extraction - finds dates and amounts in any order
 * Works for: SBI, PNB, BOB, Canara, and many other bank formats
 */
function extractStrategy2(lines: string[]): Transaction[] {
  const transactions: Transaction[] = [];
  const datePattern = /(\\d{1,2}[\\/\\-.]\\d{1,2}[\\/\\-.]\\d{2,4})/;

  for (const line of lines) {
    const dateMatch = line.match(datePattern);
    if (!dateMatch) continue;
    const date = parseDate(dateMatch[1]);
    if (!date) continue;
    const dateKey = date.toISOString().slice(0, 10);

    // Find all numeric amounts in the line (after the date)
    const afterDate = line.substring(line.indexOf(dateMatch[1]) + dateMatch[1].length);
    const amountMatches = afterDate.match(/[\\d,]+\\.\\d{2}\\s*(?:Cr|Dr)?/gi) || [];

    if (amountMatches.length === 0) {
      // Try without decimal (some banks use integer amounts)
      const intAmounts = afterDate.match(/[\\d,]+/g) || [];
      if (intAmounts.length >= 2) {
        const lastNum = parseAmount(intAmounts[intAmounts.length - 1]);
        if (lastNum > 0) {
          const narration = afterDate.replace(/[\\d,]+/g, "").trim().substring(0, 80);
          transactions.push({ date: dateKey, narration, debit: 0, credit: 0, balance: lastNum });
        }
      }
      continue;
    }

    const narration = afterDate.substring(0, afterDate.indexOf(amountMatches[0])).trim().substring(0, 80);

    // Parse the amounts
    const parsedAmounts = amountMatches.map(a => parseAmountWithSuffix(a));

    if (parsedAmounts.length >= 3) {
      // Format: Debit | Credit | Balance
      let debit = 0, credit = 0, balance = 0;
      const amt1 = parsedAmounts[parsedAmounts.length - 3].amount;
      const amt2 = parsedAmounts[parsedAmounts.length - 2].amount;
      const amt3 = parsedAmounts[parsedAmounts.length - 1].amount;
      const balSuffix = parsedAmounts[parsedAmounts.length - 1].isCredit;

      balance = amt3;

      if (amt1 > 0 && amt2 === 0) {
        // Only one of debit/credit has value
        if (CREDIT_KEYWORDS.test(narration)) credit = amt1;
        else debit = amt1;
      } else if (amt1 === 0 && amt2 > 0) {
        if (CREDIT_KEYWORDS.test(narration)) credit = amt2;
        else debit = amt2;
      } else if (amt1 > 0 && amt2 > 0) {
        // Both have values - first is usually debit, second is credit
        if (CREDIT_KEYWORDS.test(narration)) { credit = amt2; }
        else { debit = amt1; credit = amt2; }
      }

      transactions.push({ date: dateKey, narration, debit, credit, balance: Math.abs(balance) });
    } else if (parsedAmounts.length === 2) {
      // Format: Amount | Balance
      const amt = parsedAmounts[0].amount;
      const balance = parsedAmounts[1].amount;
      let debit = 0, credit = 0;
      const isCr = parsedAmounts[0].isCredit;

      if (isCr === true || CREDIT_KEYWORDS.test(narration)) credit = amt;
      else if (isCr === false || DEBIT_KEYWORDS.test(narration)) debit = amt;
      else {
        // Infer from balance direction
        credit = amt; // Default to credit if ambiguous
      }

      transactions.push({ date: dateKey, narration, debit, credit, balance: Math.abs(balance) });
    } else if (parsedAmounts.length === 1) {
      // Single amount - likely balance
      const balance = parsedAmounts[0].amount;
      if (balance > 0) {
        transactions.push({ date: dateKey, narration, debit: 0, credit: 0, balance: Math.abs(balance) });
      }
    }
  }
  return transactions;
}

/**
 * Strategy 3: Table-based extraction
 * Some banks output data in tabular format with columns separated by multiple spaces
 */
function extractStrategy3(lines: string[]): Transaction[] {
  const transactions: Transaction[] = [];
  const datePattern = /(\\d{1,2}[\\/\\-.]\\d{1,2}[\\/\\-.]\\d{2,4}|\\d{1,2}\\s+[A-Za-z]{3}\\s+\\d{2,4})/;

  for (const line of lines) {
    const dateMatch = line.match(datePattern);
    if (!dateMatch) continue;
    const date = parseDate(dateMatch[1]);
    if (!date) continue;
    const dateKey = date.toISOString().slice(0, 10);

    // Split line into tokens by multiple spaces (tabular format)
    const tokens = line.split(/\\s{2,}/).map(t => t.trim()).filter(Boolean);
    if (tokens.length < 2) continue;

    // Find numeric tokens
    const numTokens: { value: number; isCredit: boolean | null; raw: string }[] = [];
    for (const token of tokens) {
      const parsed = parseAmountWithSuffix(token);
      if (parsed.amount > 0) {
        numTokens.push({ value: parsed.amount, isCredit: parsed.isCredit, raw: token });
      }
    }

    if (numTokens.length === 0) continue;

    // Get narration (first non-date, non-amount token)
    const dateIdx = tokens.findIndex(t => dateMatch[1].includes(t) || t.includes(dateMatch[1]));
    let narration = tokens.slice(1, dateIdx >= 0 ? undefined : undefined)
      .filter(t => !/^[\\d,]+\\.\\d{2}\\s*(Cr|Dr)?\$/i.test(t) && t !== dateMatch[1])
      .join(" ")
      .substring(0, 80);

    // Take last amount as balance, others as debit/credit
    const balanceAmt = numTokens[numTokens.length - 1].value;
    let debit = 0, credit = 0;

    if (numTokens.length >= 3) {
      // Likely: debit, credit, balance
      const d = numTokens[numTokens.length - 3];
      const c = numTokens[numTokens.length - 2];
      if (CREDIT_KEYWORDS.test(narration)) {
        credit = c.value;
        if (d.value !== c.value) debit = d.value;
      } else {
        debit = d.value;
        credit = c.value;
      }
    } else if (numTokens.length === 2) {
      // Likely: amount, balance
      const amt = numTokens[0];
      if (amt.isCredit === true || CREDIT_KEYWORDS.test(narration)) credit = amt.value;
      else if (amt.isCredit === false || DEBIT_KEYWORDS.test(narration)) debit = amt.value;
      else debit = amt.value; // Default to debit
    } else {
      // Just one amount - it's the balance
    }

    transactions.push({ date: dateKey, narration, debit, credit, balance: Math.abs(balanceAmt) });
  }
  return transactions;
}

/**
 * Strategy 4: Fallback - extract any date+amount pairs
 */
function extractStrategy4(lines: string[]): Transaction[] {
  const transactions: Transaction[] = [];
  const datePattern = /(\\d{1,2}[\\/\\-.]\\d{1,2}[\\/\\-.]\\d{2,4})/;

  for (const line of lines) {
    const dateMatch = line.match(datePattern);
    if (!dateMatch) continue;
    const date = parseDate(dateMatch[1]);
    if (!date) continue;
    const dateKey = date.toISOString().slice(0, 10);

    const numMatches = line.match(/[\\d,]+\\.\\d{2}/g) || [];
    const lastNum = numMatches.length > 0 ? parseAmount(numMatches[numMatches.length - 1]) : 0;
    if (lastNum > 0) {
      transactions.push({
        date: dateKey,
        narration: line.replace(dateMatch[1], "").trim().substring(0, 80),
        debit: 0,
        credit: 0,
        balance: lastNum,
      });
    }
  }
  return transactions;
}

// ═══════════════════════════════════════════════════════════════
// DEDUPLICATION - Remove duplicate transactions
// ═══════════════════════════════════════════════════════════════

function deduplicateTransactions(transactions: Transaction[]): Transaction[] {
  const seen = new Set<string>();
  return transactions.filter(t => {
    const key = \`\${t.date}|\${t.narration.substring(0, 30)}|\${t.debit}|\${t.credit}|\${t.balance}\`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ═══════════════════════════════════════════════════════════════
// MAIN PARSER - 100% Local, No External API
// ═══════════════════════════════════════════════════════════════

/**
 * Main parser - takes extracted text, returns structured data.
 * DYNAMICALLY detects period and calculates ABB for actual months found.
 * PADS missing months when selectedPeriod > detected months.
 *
 * IMPORTANT: This is 100% client-side parsing. No Supabase, no API calls.
 */
export function parseBankStatementClient(
  text: string,
  selectedPeriod?: number
): ClientParseResult {
  const lines = text.split(/\\n/).map(l => l.trim()).filter(Boolean);
  const bankName = detectBankName(text);
  const warnings: string[] = [];

  // ─── Phase 1: Try multiple extraction strategies ───
  let transactions: Transaction[] = [];
  let totalTxnRows = 0;
  let rowsWithBalance = 0;

  // Strategy 1: Structured row patterns (most accurate)
  const s1 = extractStrategy1(lines);
  console.log("[PARSER] Strategy 1 (Structured):", s1.length, "transactions");

  // Strategy 2: Flexible date+amount extraction
  const s2 = extractStrategy2(lines);
  console.log("[PARSER] Strategy 2 (Flexible):", s2.length, "transactions");

  // Strategy 3: Table-based extraction
  const s3 = extractStrategy3(lines);
  console.log("[PARSER] Strategy 3 (Table):", s3.length, "transactions");

  // Strategy 4: Fallback
  const s4 = extractStrategy4(lines);
  console.log("[PARSER] Strategy 4 (Fallback):", s4.length, "transactions");

  // Pick the strategy that found the most transactions with balances
  const candidates = [
    { txns: s1, name: "Structured" },
    { txns: s2, name: "Flexible" },
    { txns: s3, name: "Table" },
    { txns: s4, name: "Fallback" },
  ].sort((a, b) => {
    // Prefer strategies with more balance entries
    const aBal = a.txns.filter(t => t.balance > 0).length;
    const bBal = b.txns.filter(t => t.balance > 0).length;
    return bBal - aBal;
  });

  transactions = deduplicateTransactions(candidates[0].txns);
  console.log("[PARSER] Selected strategy:", candidates[0].name, "with", transactions.length, "transactions");

  totalTxnRows = transactions.length;
  rowsWithBalance = transactions.filter(t => t.balance > 0).length;

  // ─── Phase 2: Group transactions by month ───
  const dateSet = new Set<string>();
  for (const txn of transactions) {
    dateSet.add(txn.date);
  }

  const monthMap = new Map<string, Transaction[]>();
  for (const txn of transactions) {
    const d = new Date(txn.date);
    const key = \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, "0")}\`;
    if (!monthMap.has(key)) monthMap.set(key, []);
    monthMap.get(key)!.push(txn);
  }

  const sortedMonthKeys = Array.from(monthMap.keys()).sort();
  let monthsData: MonthData[] = [];

  for (const mk of sortedMonthKeys) {
    const [yearStr, monthStr] = mk.split("-");
    const year = parseInt(yearStr);
    const monthNum = parseInt(monthStr);
    const monthTxns = (monthMap.get(mk) || []).sort((a, b) => a.date.localeCompare(b.date));

    // Day-wise closing balances
    const dayBalances: DayBalance[] = [];
    const lastDayOfMonth = new Date(year, monthNum, 0).getDate();
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
        date: bestTxn ? bestTxn.date : \`\${year}-\${String(monthNum).padStart(2, "0")}-\${String(targetDay).padStart(2, "0")}\`,
      });
    }

    // Monthly Average = average of valid day balances
    const validDayBalances = dayBalances.filter(d => d.balance > 0);
    const monthlyABB = validDayBalances.length > 0
      ? validDayBalances.reduce((s, d) => s + d.balance, 0) / validDayBalances.length
      : 0;

    // Opening, closing, highest, lowest
    const openingBalance = monthTxns.length > 0 ? monthTxns[0].balance : 0;
    const closingBalance = monthTxns.length > 0 ? monthTxns[monthTxns.length - 1].balance : 0;
    const balancesWithValues = monthTxns.filter(t => t.balance > 0).map(t => t.balance);
    const highestBalance = balancesWithValues.length > 0 ? Math.max(...balancesWithValues) : 0;
    const lowestBalance = balancesWithValues.length > 0 ? Math.min(...balancesWithValues) : 0;

    // Credits and debits
    const totalCredits = monthTxns.reduce((s, t) => s + t.credit, 0);
    const totalDebits = monthTxns.reduce((s, t) => s + t.debit, 0);
    const creditCount = monthTxns.filter(t => t.credit > 0).length;
    const debitCount = monthTxns.filter(t => t.debit > 0).length;

    // Bounce detection
    const chequeBounces = monthTxns.filter(t =>
      /chq\\s*bounce|cheque\\s*return|dishono|bounce|ret\\s*chq|chq\\s*ret/i.test(t.narration)
    ).length;
    const emiBounces = monthTxns.filter(t =>
      /emi\\s*bounce|emi\\s*return|ecs\\s*return|ecs\\s*bounce|bounce\\s*emi|nach\\s*bounce|nach\\s*return/i.test(t.narration)
    ).length;

    monthsData.push({
      monthLabel: \`\${MONTH_NAMES[monthNum - 1]} \${year}\`,
      year,
      month: monthNum,
      dayBalances,
      sampleDays: [...SAMPLE_DAYS],
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

  // ─── Phase 3: Pad months to selected period if needed ───
  const detectedPeriod = monthsData.length;
  if (selectedPeriod && selectedPeriod > monthsData.length) {
    monthsData = padMonthsToPeriod(monthsData, selectedPeriod);
    if (selectedPeriod > detectedPeriod) {
      warnings.push(
        \`Statement contains only \${detectedPeriod} month(s) of data. \` +
        \`Selected \${selectedPeriod} months - \${selectedPeriod - detectedPeriod} month(s) padded with zero balances.\`
      );
    }
  }

  // ─── Phase 4: Calculate overall ABB dynamically ───
  const monthsWithABB = monthsData.filter(m => m.monthlyABB > 0);
  const overallABB = monthsWithABB.length > 0
    ? monthsWithABB.reduce((s, m) => s + m.monthlyABB, 0) / monthsWithABB.length
    : 0;

  // ─── Phase 5: Diagnostics ───
  const sortedDates = Array.from(dateSet).sort();
  const diagnostics: ParseDiagnostics = {
    totalTxnRows,
    rowsWithBalance,
    uniqueDates: dateSet.size,
    firstDate: sortedDates[0] || "",
    lastDate: sortedDates[sortedDates.length - 1] || "",
    samplePreview: transactions.slice(0, 5).map(t =>
      \`\${t.date} | \${t.narration.substring(0, 30)} | Dr:\${t.debit} Cr:\${t.credit} Bal:\${t.balance}\`
    ),
  };

  if (monthsData.length === 0) {
    warnings.push("No valid month buckets found from parsed transactions.");
  }
  if (totalTxnRows === 0) {
    warnings.push("No transaction rows detected. PDF may be scanned/image-based or encrypted.");
  }

  return {
    monthsData,
    overallABB,
    totalMonthsFound: detectedPeriod,
    bankName,
    parseWarnings: warnings,
    diagnostics,
    detectedPeriod: selectedPeriod || detectedPeriod,
    allTransactions: transactions,
  };
}

// ═══════════════════════════════════════════════════════════════
// RISK ASSESSMENT
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate risk score and health grade based on banking behavior
 */
export function calculateRiskAssessment(
  result: ClientParseResult,
  loanMultiplier: number
): RiskAssessment {
  const { monthsData, overallABB } = result;
  if (monthsData.length === 0) {
    return { riskScore: 0, healthGrade: "C", lendingRemarks: "Insufficient Data", suggestedMaxLoan: 0 };
  }

  let score = 50;

  // Factor 1: ABB trend (improving vs declining)
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

  // Factor 2: Consistency (low variance = better)
  const abbs = monthsData.filter(m => m.monthlyABB > 0).map(m => m.monthlyABB);
  if (abbs.length >= 2) {
    const avgABB = abbs.reduce((a, b) => a + b, 0) / abbs.length;
    const variance = abbs.reduce((s, a) => s + Math.pow(a - avgABB, 2), 0) / abbs.length;
    const cv = avgABB > 0 ? Math.sqrt(variance) / avgABB : 1;
    if (cv < 0.2) score += 15;
    else if (cv < 0.4) score += 8;
    else if (cv > 0.7) score -= 10;
  }

  // Factor 3: Cheque/EMI bounces (heavy penalty)
  const totalChequeBounces = monthsData.reduce((s, m) => s + m.chequeBounces, 0);
  const totalEmiBounces = monthsData.reduce((s, m) => s + m.emiBounces, 0);
  score -= totalChequeBounces * 10;
  score -= totalEmiBounces * 15;

  // Factor 4: Credit activity
  const avgCredits = monthsData.reduce((s, m) => s + m.creditCount, 0) / monthsData.length;
  if (avgCredits >= 5) score += 10;
  else if (avgCredits >= 2) score += 5;
  else score -= 5;

  // Factor 5: Overall ABB level
  if (overallABB > 50000) score += 10;
  else if (overallABB > 20000) score += 5;
  else if (overallABB < 5000) score -= 5;

  // Clamp
  score = Math.max(0, Math.min(100, Math.round(score)));

  // Grade
  let healthGrade: string;
  if (score >= 85) healthGrade = "A+";
  else if (score >= 70) healthGrade = "A";
  else if (score >= 55) healthGrade = "B+";
  else if (score >= 40) healthGrade = "B";
  else healthGrade = "C";

  // Remarks
  let lendingRemarks: string;
  if (score >= 80) lendingRemarks = "Excellent Banking Profile - Highly recommended for lending";
  else if (score >= 65) lendingRemarks = "Good Banking Profile - Suitable for standard lending";
  else if (score >= 45) lendingRemarks = "Moderate Banking Profile - Lending with caution advised";
  else lendingRemarks = "Improvement Required - High risk profile";

  const suggestedMaxLoan = Math.round(overallABB * loanMultiplier);

  return { riskScore: score, healthGrade, lendingRemarks, suggestedMaxLoan };
}

// ═══════════════════════════════════════════════════════════════
// EMI CALCULATION
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate EMI using reducing balance method
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
  const totalPayment = emi * tenureMonths;
  const totalInterest = totalPayment - loanAmount;

  // Build amortization schedule
  const schedule: AmortizationRow[] = [];
  let balance = loanAmount;
  for (let i = 1; i <= tenureMonths; i++) {
    const interest = Math.round(balance * monthlyRate);
    const principal = Math.round(emi - interest);
    balance = Math.max(Math.round(balance - principal), 0);
    schedule.push({
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
    totalInterest: Math.round(totalInterest),
    totalPayment: Math.round(totalPayment),
    amortizationSchedule: schedule,
  };
}
`;

const GENERATE_BANK_PDF = `/**
 * Banking Surrogate - Professional PDF Generator
 *
 * Features:
 * - Multi-page support with auto page breaks
 * - Mahajan Finance transparent logo watermark on every page
 * - Mahajan Finance logo in header on every page
 * - Sandeep Mahajan contact info footer on every page
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

// ─── Embedded Logo Images (Base64 PNG with transparency) ───
const HEADER_LOGO_DATA = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAfQAAABQCAYAAADvLIfGAAAR4ElEQVR4nO3dedxT1Z3H8c8BFRXrhjiYumGtyxDibqKjdSmOvhgVgqh1BK1KXVDBGZVCR8e1SqsWURydFi0drRtq1FG0o7W2Fpu8XCoxVnFF1LgiSAURHj3zx7nxuc8lyZOb3CQP8H2/XnmR3Jzt3vuQX87JueeCiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIhIT2TaVfHWB2ZsrWnnP5luWztFRERWBS0NlGGCeCUK7iIiIitrenCMIohXouAuIiLi9GpWwVsfmLHNDOatqqMaa+0A29Wj1tpQXzKstYdZa5f6ypjWTfrLA3Ve0U368wLpd6qS9oJA2m2jbEsg7wxfvs+jrMdaO9JL95W19vbuzom19oe+srO17oOISE/SlIDe6iDbzqAecCgwqtbE1tp1gOuB9WpMb4DjA5tHWWub9sWs3W1psJ5ewHHApCjbJCLSE0UeCNoVXHtQUJ9sre1bY9pxwPYhyj4A2DawbSvgwBBlRKVVbYminkuttWHSi4isciIL6O0e/u4pbQBi1NAjtNb2By4IWfYJvuevV9jeKq1qSxT19AbusNYOiKZJIiI9z1pRFNIDgmgXWx+YsW2eMHeutXa6MWZelTSXAxvVWqC1dj3gKN+mccAs7/lR1tqxxpiloVtah1a1JeJ6BuCC+hBjzFeNtq2QSS6i8vl7IJ7ODS9kkjOAE4El8XRuA1/eF4DBwIR4OndNmbKHAI8BX8XTuZX+jxYyyTOB0lyL6+Lp3Pgyaequo5BJHg6cCewN9AXeAx4Froqnc/O8NK8AO1bYf4BN4uncoirvi0jEGg7ojQTzWeMnd5tm6NSJdZXdhqBugTnArsC6wM+BY8omtDYBnOLb9CLuw7eaNLCh93yOMeYRa+1zwB7ABsAI4LZ6Gx9Sq9oSRT2Wzqs5DgQuA34SQdtKlgGfBbYtrCFfL+BnhUzymXg696eQdfrnaRxXyCTPjadzHY3WUcgkDXATcKq3qQP4EtgOGOvVNTCezvn3dznl9/frGvZDRCLUUECvJ5jXEsQrpQ8b3Fsc1A1uCP0h7/XR1trvGWPKfZBOwQ0DA/wfMJfuA7p/iHmm7989fO+3KqC3qi1R1DMHF3AP8F5PtNb+2Rgzq0qeMO6Np3M1T4QM6A3cUcgkd42ncx/XkqGQSW4PpIAVuP3qj5uM+XAEdfw7ncH8KuDSeDr3eSGT3A24FngoEMwBnoqnc0NqabuINFckQ+61CBvIq5VRb6+9BXLAncAPvNfXWmv3NMZ801ux1g4HDvZeduA+RM+oVqj326//Q/Nu79+ZQOnAft9a+21jzHvdtHFalcvEdugmb9RtaUU9fYBjgedx8xsMcKu1djdjzPx62xehGPDbQiZ5WDydq6VXO9r798+4OQU/8rZVCug11VHIJDcELvRezoqncxNK78XTub/S+YVIRHqougN6mN55tWBeLThXyjdr/OSag3obht4nAEcC6wO7AScD0+Gby9Su9qW9yRjzkrXdHspRdPboXzDGvAZgjHnTWvs8sDtuePV43FB/Nd+vfVea3pZW1NPLGPOhtfYY4Enc3/ymwExr7f7GmOUNtLFRTwP7AocA/4H7OaA7pdGA+4BXcAF9WCGT3DCezi1uoI5D6ZwT8MuaWi8iPUpds9wbDeZDp0785lFNtXRhevytnLRnjHmHrgHmp9ba0u/A44HveM8XAhfVWOxo3/O7A+/N9D1vxWz3VrUl0nqMMbNxX7ZK9qbrl6t2uA+42Xt+cSGTPKha4kIm+U+437O/Bu7FfUFZgJuzMbLBOnbxPX+525Z32r+QSX7gezwTIq+IRCh0QG8kmNcSxCspl7enBnVcQC8N524OTLDWbkLXy9QuMsZ82l1B1tpdgIRvU7XgNshau3s3Re5sKqBzyLVVbWlpPcaYKYG8Z1trj8ZNnKvX8YVM0voe80LkNcBZuN/5ewG3FzLJapfWlb7kzI6nc+97E+EeCLxXbx3+Gfsf1th+gHWAf/A9+ofIKyIRatoKY+WCeRQaCeqtYoz5gq69wbHA+XTO2H4ZuLHG4k4MvH7dvwYqXa/Nhub20pvVluBlZM3c55NxQ9UlN+MWqqnXMlwALD1qmtxWEk/nluF614txl9bdTpn/l4VMch06r5q4x/fWvd6/BxQyya0bqMM/XL9FiF34fTydM77HtiHyikiEQgX0Wnu5wZnpUU9iC5ZZa1Bv8dD7XcBT3stNAP9B+DdjTLnLjLqw1vbGLV0axnHW2sgnOzahLev7nn8TTJq9z8aYz3HXti/xNn0L99tyve6Np3MDfI+9whYQT+dep/MyxoPo+mWw5HDc3xHA1NKIAJ2T4cotkRumjoLv+S6IyCon8g/+dvWYw0yUa6HxwLO4L06liXkPG2N+V2P+Q3E9qpKb6AxEfuviFgIBN8R/GJ2Xz0Ul6rb8o++5v8fd9H02xvzNWjsGuMNXVlvF07l7CpnkdbjFc8pNXCwNqS8G3gm8tzluqHs0cGWddfwOWIr7onUucFfYfRCR9oo0oDdrmL2SoVMndqmzpwV1Y8xfrbW3AGO8TStwH5a18g8lv2WMqXh5m7V2CJ0rd51A9AE9srZ466oP8m16shn1VGOMudNauw8uuPUU5wFJ7/GNQia5KTDUezk5ns5dGXj/KNww/M6FTHKPeDr3XNg64uncp4VMcgputGKvQiZ5I/DjeDq32BvKn4H7MjGywiI2ItJmNQ+5hx2ublVgrWexmSY1pZIJuID1Hm6ofW4tmbyZ8Uf6Nt3fTRb/+0daazeuuYUtaIu19nBr7X3W2ieAR3zvLwVuiaqebtIHnYe7rKtHiKdzK3C/kwcnSx6Lm3wGkCmT9VHcb/lQeXJcd3UAXELnMT0dWFDIJBcAb+OG6fcBtgzkCc5yLz02QURaKrJJcT1lclpPaUeJMWahMeYgY8yWxpgbQmQ9hq63VS33Qe53v+95HyosO1unKNpyMm4p14PoHOK2wOnepX5R1VMzY0wpuH0UJl8zxdO5+bg5BP7Ff0pB+vfxdO6VMnmW4HrQ4JZnrTryVqGOUrAfAZwEzKZzCP413EpxidJa7j7BWe6lh4i0WM0LrnTXs21kidYohKk/qoVmvNXM3vdt6m+M+aSOcqbR+XvwDcaYs6y1fwS+522bBRzhX3GuTBkG+F/c0KwBZhtj9rPWnodbxrNkZ2PMSkHBK+MCui48MtAYMy+KtuCCwjDcTP+FwF+An3nXh5fyRbXPI+m8PG2uMWanSmV45eyHuzRuCyBnjElVSy8i0hPVFNhqGaZelQI6RBfURUREeoJIhtx72jB3T2uPiIhIs0U6y33zncbQf6cxzBsGv8m8yUXX57vNM3zIVvxi0u707mWY/fzH/Ou5s8umu3HUdLbpV3k0+4EX9mTYrs/W3XYREZFVWVNWijMGTkgPZPAOG1dN13f9tbjgjEH07qXRbxERkUY07fapvYzhknEJRpxV7nbgzvjRO9J/0/Brehz/q7NX2rasY2310EVEZI3VtLXcAfYYtCnDh5RfJnvbb/fl5JHfKftedxYu7bvS44vl63SfUUREZDXVlIC+ZGkHhdcWATDptEGsv27vldJcOHYwa6/ViyVfdPDym+Vu4ywiIiK1akpA79OnN/85NY+1MGCzdRl7/A5d3t9/z80Zsq9brnvaba/y2eLlzWiGiIjIGqMpv6EbA8+99Cn3P/4O6UO24tRjtueuWW/zzvtLWau34aKzBgPwdnEJ02e+zgF7bx6q/OBlaX96dWcmPzIssvaLiIisapr6G/oV//0SS77ooM86vbnwDBfERw/bju9u8y0ALr3hRZavqLgQWCi69lxERNZkkfTQg3c9K/lowTKuv3UuE08dxKH7b0Fql804e7Qbfv/jMx/x+NMf1FVfcJb78q/W4ns7vNylPSIiImuSmnrojSyTOn3mG7z1rrsHxH9dvBf9Nu5DR8fXXDLtxXqLXGmG+5Iv+4TKr2VfV2/ZfLFfNl/cpt3tEBFppaYMufcynUu/r/AF734bu8D768ybvDH/75HVtyoNt2fzxXOy+eIPfK9PyuaL49vZpnbL5oujsvniWd2kCXOcdsbd1a1tsvniPdl8cUCzz6/+fkSkJLJJcUOnTuTZG8svzfqH3Ic89vQHHLLvAD5asIxrZ5S92Vdk7WiFbL44CjgDyANbAz9MJWIfhy0nlYj9uo66E8DluLuWPZ5KxG4NW0bI+voBF6USsXE1pN0IeBM4IpWIRXav8XqOUzneeTsTeAF3m8/Twpy3bL44BBiSSsRq+kPrrt2NnsuojouIrPpqDujzn0ybWu66VjJr/OQuwfWcnz7LwakBvPDyQj5f2hGymdXrCSPi4faZqUTs2my+eBUwKJsvfgKcC2wAPIC77/c+wHtAHDi6lDGbL16Gu6Xo18DGwLIyaY8EjgD6AgOB/VOJ2Je424XekUrE7vDKOg+Yl0rE7snmi3cC5wHDgd2AL4G/+Z7/HLgC+MBr51ivDn89pwNn+/bju8A+2XzxFOAJYBLwKW6E58epRMz/dzEGuAQXNJ/O5otjyuzXzoHjVDomD3nt+QS4B7ged7/y94FXvfRv+LZdnErE6rnm8d5UInZ1Nl+8Etg3my++QTfnLZWIfeUvoMJ+DcQd21eBwV66Ubjz+6S/jlQidptXVPBcDiRwfL1jWTp/WwOnAJ8B9wG3e+U/DlwMvIu7pez8YDmB8yQiq5lIL1v7bW4/zvHdedof1D9f2sGDT7xbPgC/BS+95T6VZlUYPHx7wWYrbQuW1YbJcEOz+eJWwC64XtZSXEBbD8gAdwF/SSVi07P54gxgey/fOCCXSsT+x/vALwmmfRUXXN4ApnjBHOBGYFI2X/wX4JYq7XsmlYjd5A1nl55PA6amErFcNl+ciPvSMNdfD/BiYD8mAf1SidjN2XzxBmARLujuCGwKLADI5ou9gBHAAcBB2Xxxywr7NTdQ/m+8dL/ABfTXgZtxXyQWAr8E9vPSfLOtzmAOMNwLnIuAh3G3Ee7uvM0tU04wzTjgGu/YBu/BHtznUkAPnsujWPn4Quf5GwEch/tCc7ev/POBK1OJ2ByAaudJRFZPkQb0KTNeYcqMV5rym/YZt42p+n6bZrbP8nroxwE/wvWMRuB6UmsH0i7zbZsGnJLNF7eoUG4p7WDgnlQidl/g/SWpRGxiNl9cDxeQSr3KoEVlngdHKCyQ8NeTzRd3DOyHv2e3AngklYj9oUx9w3AjDhd7ecfiht+D+7UdZY5TKhF7Ipsvno8L2kenErGvs/ni7rhA9yDQkUrEritty+aLJ6USsbfLtKM796cSsatLL8rsr9+yMtuCSmnW8cqAlY9z2X1m5XOZJ3B8s/kidJ6/B3E988XAqV6ZJbWeJxFZDYUK6LUOu/svYyv9Wwq4UQTeenvmTZjdfrTXE9sCN8x9OLARUKB6b+hr4Ce43vBDVdItBsZl88WDccHsHG/7idl8cR9gQ+AmYA5wvdfrLL94fqdrgCuy+eKHuCH2a4B/9tcDvB3Yj/nAntl88VRcL3qq11M0wLhUIlZaTOA04NhUIlb0eutPAe/ggovfUCofp0eB5V4wPwo3+vEu8HdgvcC2yvfTDadae8L4FXBpNl/M4n6fr6WO4LnMEji+/kJSiVhHNl+cA/RNJWJLvWAP7m/psmy+OA94jOrnSURWQ6EDXNjf0f3aGcxh1btcLZsvTsANlS4H1k4lYpNW5XpqbMvDwMhUIvZFA2XsB2yfSsRmRNYwEZEerq4A10hQh/oCe6PlrGrBXEREJIy6g1yjQb2kWlCuN1+QgrmIiKzuGgp0UQX1sBTMRUREumrK3dbKKQXhRgK71mgXEREpr+Hea5heelAtwb2RIK7euYiIrCkiCXiNBPVmUTAXEZE1SSQ3Z+lpwbOntUdERKTZIg987eytK5CLiMiaKvLbp7YrqCqYi4jImqwp90NvdXBVMBcRkTVd0wNhM4fgFchFRESclgbEKIK7griIiMjK2hYcwwR3BXERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERkTXQ/wMmIi0OMpuOYQAAAABJRU5ErkJggg==";
const ICON_LOGO_DATA = "data:image/png;base64,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";
const WATERMARK_LOGO_DATA = "data:image/png;base64,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";

// ─── Brand Colors ───
const BRAND_COLOR = [30, 64, 175] as const;       // #1E40AF - Deep Blue
const ACCENT_COLOR = [22, 163, 74] as const;       // #16A34A - Green
const ACCENT_GOLD = [212, 175, 55] as const;       // #D4AF37 - Gold
const DARK_TEXT = [31, 41, 55] as const;            // #1F2937
const LIGHT_TEXT = [107, 114, 128] as const;        // #6B7280
const TABLE_HEADER_BG = [219, 234, 254] as const;   // #DBEAFE
const TABLE_ALT_BG = [249, 250, 251] as const;      // #F9FAFB
const SECTION_BG = [239, 246, 255] as const;        // #EFF6FF

/** Indian currency format for PDF */
function fmtRs(amount: number): string {
  if (amount === 0 || isNaN(amount)) return "Rs. 0";
  return formatIndianCurrency(amount);
}

// ─── Preloaded image data ───
let headerImgData: string | null = null;
let iconImgData: string | null = null;
let watermarkImgData: string | null = null;

/**
 * Preload logo images for use in PDF.
 * Call this before generateBankPdf() to ensure images are ready.
 */
export async function preloadLogoImages(): Promise<void> {
  const loadImg = (dataUrl: string): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject("Canvas not supported"); return; }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => reject("Failed to load logo image");
      img.src = dataUrl;
    });

  try {
    headerImgData = await loadImg(HEADER_LOGO_DATA);
    iconImgData = await loadImg(ICON_LOGO_DATA);
    watermarkImgData = await loadImg(WATERMARK_LOGO_DATA);
  } catch (e) {
    console.warn("Logo preload failed, using text-only headers:", e);
  }
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
  const margin = 14;
  const contentW = pageW - 2 * margin;
  let y = 0;
  let pageNum = 0;

  const { months, abb, riskAssessment, emiCalculation, eligibleLoan } = reportData;
  const periodLabel = reportData.periodMonths === 1 ? "1 Month" : \`\${reportData.periodMonths} Months\`;
  const generatedDate = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

  const totalChequeBounces = months.reduce((s, m) => s + m.chequeBounces, 0);
  const totalEmiBounces = months.reduce((s, m) => s + m.emiBounces, 0);

  // ─── Helper Functions ───

  function newPage() {
    if (pageNum > 0) doc.addPage();
    pageNum++;
    y = margin;
    addWatermark();
    addHeader();
  }

  function addWatermark() {
    // Transparent logo watermark in center
    if (watermarkImgData) {
      doc.saveGraphicsState();
      doc.setGState(new (doc as any).GState({ opacity: 0.06 }));
      const wmSize = 80;
      doc.addImage(watermarkImgData, "PNG", (pageW - wmSize) / 2, (pageH - wmSize) / 2 - 10, wmSize, wmSize);
      doc.restoreGraphicsState();
    }
    // Text watermark as backup
    doc.saveGraphicsState();
    doc.setGState(new (doc as any).GState({ opacity: 0.04 }));
    doc.setFontSize(54);
    doc.setTextColor(...BRAND_COLOR);
    doc.setFont("helvetica", "bold");
    const text = "MAHAJAN FINANCE";
    const tw = doc.getTextWidth(text);
    doc.text(text, (pageW - tw) / 2, pageH / 2 + 25, { angle: 45 });
    doc.restoreGraphicsState();
  }

  function addHeader() {
    // ─── Blue gradient header bar ───
    doc.setFillColor(...BRAND_COLOR);
    doc.rect(0, 0, pageW, 28, "F");

    // ─── Gold accent line under header ───
    doc.setFillColor(...ACCENT_GOLD);
    doc.rect(0, 28, pageW, 1.5, "F");

    // ─── Logo image in header (left side) ───
    if (headerImgData) {
      doc.saveGraphicsState();
      doc.setGState(new (doc as any).GState({ opacity: 0.95 }));
      doc.addImage(headerImgData, "PNG", 6, 1, 62, 10);
      doc.restoreGraphicsState();
    }

    // ─── Company name text ───
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    const logoOffset = headerImgData ? 52 : margin;
    doc.text("MAHAJAN FINANCE", logoOffset + 10, 10);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...ACCENT_GOLD);
    doc.text("Banking Surrogate Analysis Report", logoOffset + 10, 16);

    // ─── Right side: Date & Period ───
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(200, 210, 230);
    doc.text(generatedDate, pageW - margin, 8, { align: "right" });
    doc.text(\`Period: \${periodLabel}\`, pageW - margin, 13, { align: "right" });

    // ─── Contact line in header ───
    doc.setFontSize(6.5);
    doc.setTextColor(180, 200, 230);
    doc.text("Sandeep Mahajan  |  +91 9730540215  |  info@mahajanfinance.com  |  Pan India Service", pageW / 2, 23, { align: "center" });

    y = 34;
  }

  function addFooter() {
    // ─── Gold accent line above footer ───
    doc.setFillColor(...ACCENT_GOLD);
    doc.rect(0, pageH - 17, pageW, 1, "F");

    // ─── Blue footer bar ───
    doc.setFillColor(...BRAND_COLOR);
    doc.rect(0, pageH - 16, pageW, 16, "F");

    // ─── Footer icon ───
    if (iconImgData) {
      doc.saveGraphicsState();
      doc.setGState(new (doc as any).GState({ opacity: 0.3 }));
      doc.addImage(iconImgData, "PNG", margin, pageH - 15, 9, 9);
      doc.restoreGraphicsState();
    }

    // ─── Footer text ───
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    const footerX = iconImgData ? margin + 11 : margin;
    doc.text("Mahajan Finance", footerX, pageH - 10);

    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 200, 230);
    doc.text("Sandeep Mahajan  |  +91 9730540215  |  info@mahajanfinance.com  |  Pan India Service", footerX, pageH - 5);

    // ─── Page number ───
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...ACCENT_GOLD);
    doc.text(\`Page \${pageNum}\`, pageW - margin, pageH - 8, { align: "right" });

    // ─── Website ───
    doc.setFontSize(5.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 170, 200);
    doc.text("www.mahajanfinance.com", pageW - margin, pageH - 3, { align: "right" });
  }

  function checkPage(needed: number) {
    if (y + needed > pageH - 22) {
      addFooter();
      newPage();
    }
  }

  function sectionTitle(title: string) {
    checkPage(15);
    // Blue bar with rounded corners
    doc.setFillColor(...BRAND_COLOR);
    doc.roundedRect(margin, y, contentW, 8, 1.5, 1.5, "F");
    // Gold left accent
    doc.setFillColor(...ACCENT_GOLD);
    doc.roundedRect(margin, y, 3, 8, 1, 1, "F");
    // Title text
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(title, margin + 5, y + 5.5);
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
    // Light background for each label-value pair
    doc.setFillColor(...SECTION_BG);
    doc.rect(margin, y - 3, contentW, 5.5, "F");
    // Label
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...LIGHT_TEXT);
    doc.text(label, margin + 2, y);
    // Value
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK_TEXT);
    doc.text(value, margin + labelW, y);
    y += 5.5;
  }

  function drawTable(headers: string[], rows: string[][], colWidths: number[]) {
    const rowH = 6;
    if (y + Math.min((rows.length + 1) * rowH, 40) > pageH - 22) {
      addFooter();
      newPage();
    }

    // Header row with gradient effect
    doc.setFillColor(...BRAND_COLOR);
    doc.rect(margin, y, contentW, rowH + 1, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    let x = margin;
    headers.forEach((h, i) => {
      doc.text(h, x + 1.5, y + 4.5, { maxWidth: colWidths[i] - 3 });
      x += colWidths[i];
    });
    y += rowH + 1;

    // Data rows
    rows.forEach((row, ri) => {
      if (y + rowH > pageH - 22) {
        addFooter();
        newPage();
        // Re-draw header on new page
        doc.setFillColor(...BRAND_COLOR);
        doc.rect(margin, y, contentW, rowH + 1, "F");
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        let hx = margin;
        headers.forEach((h, i) => {
          doc.text(h, hx + 1.5, y + 4.5, { maxWidth: colWidths[i] - 3 });
          hx += colWidths[i];
        });
        y += rowH + 1;
      }

      // Alternating row colors
      if (ri % 2 === 1) {
        doc.setFillColor(...TABLE_ALT_BG);
        doc.rect(margin, y, contentW, rowH, "F");
      }
      // Left accent for each row
      const accentCol: readonly [number, number, number] = ri % 2 === 0 ? ACCENT_GOLD : BRAND_COLOR;
      doc.setFillColor(accentCol[0], accentCol[1], accentCol[2]);
      doc.rect(margin, y, 1, rowH, "F");

      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...DARK_TEXT);
      x = margin;
      row.forEach((cell, i) => {
        const align = i === 0 ? "left" : "right";
        const xPos = i === 0 ? x + 2 : x + colWidths[i] - 2;
        doc.text(cell, xPos, y + 4, { maxWidth: colWidths[i] - 4, align });
        x += colWidths[i];
      });
      y += rowH;
    });
  }

  // ─── PAGE 1: Cover + Customer + Bank Info ───
  newPage();

  // ─── Cover section with logo ───
  doc.setFillColor(...BRAND_COLOR);
  doc.roundedRect(margin, y, contentW, 40, 3, 3, "F");

  // Cover logo
  if (iconImgData) {
    doc.addImage(iconImgData, "PNG", margin + 8, y + 5, 28, 28);
  }

  const coverTextX = iconImgData ? margin + 42 : margin + 10;
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("MAHAJAN FINANCE", coverTextX, y + 14);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...ACCENT_GOLD);
  doc.text("Banking Surrogate Analysis Report", coverTextX, y + 22);

  doc.setFontSize(8);
  doc.setTextColor(200, 210, 230);
  doc.text(\`Report Generated: \${generatedDate}  |  Analysis Period: \${periodLabel}\`, coverTextX, y + 30);

  // Contact line on cover
  doc.setFontSize(7);
  doc.setTextColor(180, 200, 230);
  doc.text("Sandeep Mahajan  |  +91 9730540215  |  info@mahajanfinance.com  |  Pan India Service", coverTextX, y + 36);

  y += 46;

  // Gold divider
  doc.setFillColor(...ACCENT_GOLD);
  doc.rect(margin, y - 2, contentW, 0.8, "F");
  y += 2;

  // Section 1: Customer Information
  sectionTitle("1. Customer Information");
  labelValue("Full Name", reportData.customerName || "N/A");
  labelValue("Report Date", generatedDate);
  y += 3;

  // Section 2: Bank Information
  sectionTitle("2. Bank Information");
  labelValue("Bank Name", reportData.bankName || "N/A");
  labelValue("Statement Period", periodLabel);
  labelValue("Months Analysed", String(reportData.periodMonths));
  y += 3;

  // Section 3: Statement Analysis Summary
  sectionTitle("3. Statement Analysis Summary");
  labelValue("Overall ABB", fmtRs(abb));
  labelValue("Opening Balance", fmtRs(months[0]?.openingBalance || 0));
  labelValue("Closing Balance", fmtRs(months[months.length - 1]?.closingBalance || 0));
  labelValue("Total Credits", fmtRs(months.reduce((s, m) => s + m.totalCredits, 0)));
  labelValue("Total Debits", fmtRs(months.reduce((s, m) => s + m.totalDebits, 0)));
  labelValue("Highest Balance", fmtRs(months.length > 0 ? Math.max(...months.map(m => m.highestBalance)) : 0));
  labelValue("Lowest Balance", fmtRs(months.length > 0 ? Math.min(...months.filter(m => m.lowestBalance > 0).map(m => m.lowestBalance)) : 0));
  labelValue("Avg Monthly Credit", fmtRs(months.reduce((s, m) => s + m.totalCredits, 0) / Math.max(months.length, 1)));
  labelValue("Avg Monthly Debit", fmtRs(months.reduce((s, m) => s + m.totalDebits, 0) / Math.max(months.length, 1)));
  labelValue("Cheque Bounces", String(totalChequeBounces));
  labelValue("EMI Bounces", String(totalEmiBounces));
  y += 3;

  // Section 4: Risk Assessment
  sectionTitle("4. Risk Assessment & Banking Health");
  const scoreColor: [number, number, number] = riskAssessment.riskScore >= 70 ? [...ACCENT_COLOR] as [number, number, number] : riskAssessment.riskScore >= 45 ? [234, 179, 8] : [220, 38, 38];

  // Score box
  doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.roundedRect(margin + 2, y, 32, 22, 2, 2, "F");
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(String(riskAssessment.riskScore), margin + 18, y + 14, { align: "center" });
  doc.setFontSize(7);
  doc.text("/100", margin + 18, y + 19, { align: "center" });

  // Grade box
  doc.setFillColor(...BRAND_COLOR);
  doc.roundedRect(margin + 38, y, 22, 22, 2, 2, "F");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(riskAssessment.healthGrade, margin + 49, y + 14, { align: "center" });
  doc.setFontSize(6);
  doc.setTextColor(...ACCENT_GOLD);
  doc.text("Grade", margin + 49, y + 19, { align: "center" });

  // Remarks
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK_TEXT);
  doc.text(\`AI Remarks: \${riskAssessment.lendingRemarks}\`, margin + 64, y + 9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND_COLOR);
  doc.text(\`Suggested Max Loan: \${fmtRs(riskAssessment.suggestedMaxLoan)}\`, margin + 64, y + 16);
  y += 27;

  // Section 5: Month-Wise Closing Figures
  sectionTitle("5. Month-Wise Closing Balance Table");

  const closingHeaders = ["Month", "Day 5", "Day 10", "Day 15", "Day 20", "Day 25", "Day 30", "Monthly Avg"];
  const closingColWidths = [28, 22, 22, 22, 22, 22, 22, contentW - 160];
  const closingRows = months.map(m => [
    m.monthLabel,
    fmtRs(m.dayBalances.find(d => d.day === 5)?.balance || 0),
    fmtRs(m.dayBalances.find(d => d.day === 10)?.balance || 0),
    fmtRs(m.dayBalances.find(d => d.day === 15)?.balance || 0),
    fmtRs(m.dayBalances.find(d => d.day === 20)?.balance || 0),
    fmtRs(m.dayBalances.find(d => d.day === 25)?.balance || 0),
    fmtRs(m.dayBalances.find(d => d.day === 30)?.balance || 0),
    fmtRs(m.monthlyABB),
  ]);
  drawTable(closingHeaders, closingRows, closingColWidths);

  // Overall ABB row
  checkPage(10);
  doc.setFillColor(...BRAND_COLOR);
  doc.roundedRect(margin, y, contentW, 8, 1, 1, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("Overall Average Bank Balance (ABB)", margin + 4, y + 5.5);
  doc.setTextColor(...ACCENT_GOLD);
  doc.text(fmtRs(abb), pageW - margin - 4, y + 5.5, { align: "right" });
  y += 12;

  // Section 6: ABB Calculation Sheet
  sectionTitle("6. ABB Calculation Sheet");
  subTitle("Formula: Monthly Average = (Day5 + Day10 + Day15 + Day20 + Day25 + Day30) / 6");
  subTitle("Overall ABB = Sum of Monthly Averages / Number of Months");

  const abbHeaders = ["Month", "Day 5", "Day 10", "Day 15", "Day 20", "Day 25", "Day 30", "Sum", "Monthly ABB"];
  const abbColWidths = [24, 20, 20, 20, 20, 20, 20, 24, contentW - 168];
  const abbRows = months.map(m => {
    const dayVals = [5, 10, 15, 20, 25, 30].map(d => m.dayBalances.find(db => db.day === d)?.balance || 0);
    const sum = dayVals.reduce((s, v) => s + Math.round(v), 0);
    return [m.monthLabel, ...dayVals.map(v => v > 0 ? String(Math.round(v)) : "-"), String(sum), fmtRs(m.monthlyABB)];
  });
  drawTable(abbHeaders, abbRows, abbColWidths);

  checkPage(10);
  doc.setFillColor(...ACCENT_COLOR);
  doc.roundedRect(margin, y, contentW, 9, 1.5, 1.5, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(\`Overall ABB (\${reportData.periodMonths} Months) = \${fmtRs(abb)}\`, margin + 4, y + 6);
  y += 14;

  // ─── NEW PAGE ───
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
  if (emiCalculation.amortizationSchedule && emiCalculation.amortizationSchedule.length > 0) {
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
  }
  y += 5;

  // Section 9: Key Financial Insights
  checkPage(50);
  sectionTitle("9. Key Financial Insights");

  const insights: string[] = [];
  const avgCredit = months.reduce((s, m) => s + m.totalCredits, 0) / Math.max(months.length, 1);
  const avgDebit = months.reduce((s, m) => s + m.totalDebits, 0) / Math.max(months.length, 1);
  const totalBounces = totalChequeBounces + totalEmiBounces;

  insights.push(\`Average Monthly Credit: \${fmtRs(avgCredit)} - \${avgCredit > 30000 ? "Healthy income flow" : "Moderate income flow"}\`);
  insights.push(\`Average Monthly Debit: \${fmtRs(avgDebit)} - \${avgDebit < avgCredit * 0.9 ? "Spending within limits" : "Spending close to income"}\`);
  insights.push(\`Overall ABB: \${fmtRs(abb)} - \${abb > 25000 ? "Good maintained balance" : "Low maintained balance"}\`);

  if (months.length >= 2) {
    const firstMonth = months[0].monthlyABB;
    const lastMonth = months[months.length - 1].monthlyABB;
    const trend = lastMonth > firstMonth ? "Upward" : lastMonth < firstMonth ? "Downward" : "Stable";
    insights.push(\`Balance Trend: \${trend} - \${trend === "Upward" ? "Positive sign" : trend === "Downward" ? "Needs attention" : "Consistent"}\`);
  }

  if (totalBounces > 0) {
    insights.push(\`Bounce Count: \${totalBounces} - This may affect loan eligibility negatively\`);
  } else {
    insights.push("No cheque/EMI bounces detected - Excellent payment discipline");
  }

  insights.push(\`Eligible Loan Amount: \${fmtRs(eligibleLoan)} at \${settings.loanMultiplier}x multiplier\`);
  insights.push(\`Risk Grade: \${riskAssessment.healthGrade} (Score: \${riskAssessment.riskScore}/100)\`);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK_TEXT);
  insights.forEach(insight => {
    checkPage(8);
    // Insight card with left accent
    doc.setFillColor(...SECTION_BG);
    doc.roundedRect(margin + 2, y - 3.5, contentW - 4, 7, 1, 1, "F");
    doc.setFillColor(...BRAND_COLOR);
    doc.rect(margin + 2, y - 3.5, 1.5, 7, "F");
    doc.text(\`  \${insight}\`, margin + 5, y);
    y += 8;
  });
  y += 3;

  // Section 10: Cash Flow Summary
  checkPage(40);
  sectionTitle("10. Cash Flow Summary");
  const cashHeaders = ["Month", "Credits", "Debits", "Net Flow", "Opening Bal", "Closing Bal"];
  const cashColWidths = [28, 32, 32, 32, 32, contentW - 156];
  const cashRows = months.map(m => [
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
  checkPage(40);
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

  // ─── Generate filename ───
  const safeName = (reportData.customerName || "Customer").replace(/[^a-zA-Z0-9]/g, "_");
  const dateStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\\//g, "-");
  const filename = \`MahajanFinance_Banking_Report_\${safeName}_\${dateStr}.pdf\`;

  doc.save(filename);
}
`;

const BANKING_SURROGATE = `"use client";
import React, { useState, useRef } from "react";
import { parseBankStatementClient, calculateRiskAssessment, calculateEMI, type ClientParseResult } from "../lib/parseBankClient";
import { formatIndianCurrency, type RiskAssessment, type EMICalculation, type AdminSettings, type BankingReportData } from "../lib/bankingTypes";
import { generateBankPdf, preloadLogoImages } from "../lib/generateBankPdf";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

// ═══════════════════════════════════════════════════════════════
// IMPORTANT: 100% Client-Side Parsing - NO Supabase, NO External API
// All bank statement parsing happens locally in the browser.
// ═══════════════════════════════════════════════════════════════

// pdfjs-dist - dynamic import for client-side PDF text extraction
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
      console.log("[ABB] Loading pdfjs-dist for client-side PDF parsing...");
      const mod = await import("pdfjs-dist");
      pdfjsLib = mod;
      const ver = mod.version || "6.1.200";
      mod.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@" + ver + "/build/pdf.worker.min.mjs";
      console.log("[ABB] pdfjs-dist v" + ver + " loaded successfully");
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
          // Join with space for same line items, newline between pages
          const pageText = tc.items.map((it: any) => it.str).join(" ");
          text += pageText + "\\n";
        }
        console.log("[ABB] PDF text extraction OK: " + text.length + " chars, " + (text.length > 100 ? "proceeding with local parser" : "WARNING: very little text extracted"));
        console.log("[ABB] PDF TEXT PREVIEW (first 500 chars):\\n" + text.slice(0, 500));
        return text;
      } catch (e: any) {
        if (e.name === "PasswordException") {
          setNeedPassword(true);
          throw new Error("PASSWORD_REQUIRED");
        }
        console.warn("[ABB] PDF loading strategy " + (i + 1) + " failed: " + e.message);
      }
    }
    throw new Error("All PDF loading strategies failed. The PDF may be corrupted or encrypted.");
  }

  const handleCalculate = async () => {
    if (!file) { setError("Please upload a bank statement PDF."); return; }
    setError(""); setSuccess(""); setResult(null); setPaid(false);
    setNeedPassword(false); setDiag(""); setLoading(true);
    try {
      console.log("[ABB] ========== Starting Bank Statement Analysis ==========");
      console.log("[ABB] File: " + file.name + " (" + (file.size / 1024).toFixed(1) + " KB)");
      console.log("[ABB] Mode: 100% Local Client-Side Parsing (No Supabase, No External API)");

      const text = await extractText(file);
      if (!text || text.length < 50) {
        setError("Could not extract text from PDF. If this is a scanned/image PDF, OCR is required. No external API is used.");
        setLoading(false); return;
      }

      console.log("[ABB] Parsing bank statement locally (supports 40+ Indian banks)...");
      const parseResult = parseBankStatementClient(text);

      // Diagnostics
      const d = parseResult.diagnostics;
      const bank = parseResult.bankName && parseResult.bankName !== "Unknown Bank" ? "[" + parseResult.bankName + "] " : "";
      const info = d
        ? "rows=" + d.totalTxnRows +
          ", withBalance=" + d.rowsWithBalance +
          ", uniqueDates=" + d.uniqueDates +
          (d.firstDate ? ", first=" + d.firstDate : "") +
          (d.lastDate ? ", last=" + d.lastDate : "")
        : "";
      console.log("[ABB] Diagnostics: " + bank + info);
      if (d?.samplePreview && d.samplePreview.length > 0) {
        console.log("[ABB] Sample parsed rows:");
        d.samplePreview.forEach((s, i) => console.log("  " + (i + 1) + ". " + s));
      }
      setDiag(bank + info);

      if (!parseResult.monthsData || parseResult.monthsData.length === 0) {
        const warns = (parseResult.parseWarnings || []).join(" ");
        console.error("[ABB] No valid banking data found. Warnings:", warns);
        console.error("[ABB] This is a 100% local parser - no Supabase or external API is involved.");
        console.error("[ABB] If your PDF is scanned/image-based, OCR would be needed (not available client-side).");
        setError(
          bank + "No valid banking data found. " + (warns || "Parser found 0 month buckets.") +
          " | " + info + ". Check DevTools console for details."
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
        ". Overall ABB: " + fmt(overallABB) + " | " + info +
        " | Parsed 100% locally (no Supabase)"
      );
      console.log("[ABB] ========== Analysis Complete ==========");
      console.log("[ABB] Bank: " + (bank || parseResult.bankName));
      console.log("[ABB] Period: " + effectivePeriod + " months");
      console.log("[ABB] Overall ABB: " + fmt(overallABB));
      console.log("[ABB] Months with data: " + withABB.length + "/" + selectedMonths.length);
    } catch (err: any) {
      if (err.message === "PASSWORD_REQUIRED") {
        setError("This PDF is password-protected. Please enter the password.");
      } else {
        console.error("[ABB] Parse error:", err.message);
        setError("Failed to parse PDF: " + (err.message || "Unknown error") + ". All processing is 100% local - no external API is used.");
      }
    }
    setLoading(false);
  };

  /** Build BankingReportData for the PDF generator */
  const buildReportData = (): BankingReportData | null => {
    if (!result) return null;
    return {
      customerName,
      bankName,
      periodMonths: period,
      abb: result.overallABB,
      months: result.monthsData,
      transactions: result.allTransactions,
      riskAssessment,
      eligibleLoan: emiCalculation.loanAmount,
      emiCalculation,
      diagnostics: result.diagnostics,
    };
  };

  const handleDownload = async () => {
    if (!result) { setError("Calculate ABB first."); return; }
    const amount = PRICING[period] || 39;
    const pLabel = period === 1 ? "1 Month" : period + " Months";
    const options = {
      key: "rzp_test_T4KRRFabwHv6dz", amount: amount * 100, currency: "INR",
      name: "Mahajan Finance", description: "Banking Surrogate - " + pLabel,
      handler: function (response: any) {
        const reportData = buildReportData();
        if (reportData) { preloadLogoImages().then(() => generateBankPdf(reportData, adminSettings)); }
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
    : { loanAmount: 0, interestRate: adminSettings.interestRate, tenureMonths: adminSettings.defaultTenure, monthlyEMI: 0, totalInterest: 0, totalPayment: 0, amortizationSchedule: [] };

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
            <img src="/mahajan-finance-icon.png" alt="MF" className="h-14 w-14 rounded-2xl shadow-lg bg-white/20 p-1" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Banking Surrogate / ABB Calculator</h1>
              <p className="text-blue-100 text-sm mt-1">Mahajan Finance - Upload bank statement to calculate ABB and check loan eligibility</p>
              <p className="text-amber-300 text-xs mt-1">Sandeep Mahajan | +91 9730540215 | info@mahajanfinance.com | Pan India Service</p>
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
                <input type="tel" value={customerMobile} onChange={e => setCustomerMobile(e.target.value.replace(/\\D/g, "").slice(0, 10))} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition" placeholder="10-digit mobile" />
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
                    <p className={\`text-3xl font-bold mt-1 \${riskAssessment.riskScore >= 70 ? "text-green-600" : riskAssessment.riskScore >= 45 ? "text-yellow-600" : "text-red-600"}\`}>{riskAssessment.riskScore}<span className="text-sm text-gray-400">/100</span></p>
                  </div>
                  <div className="text-center p-4 rounded-xl border">
                    <p className="text-xs text-gray-500 uppercase">Health Grade</p>
                    <p className={\`text-3xl font-bold mt-1 p-2 rounded-lg \${gradeColor(riskAssessment.healthGrade)}\`}>{riskAssessment.healthGrade}</p>
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
                    <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Risk Grade</span><span className={\`font-bold px-2 py-0.5 rounded \${gradeColor(riskAssessment.healthGrade)}\`}>{riskAssessment.healthGrade}</span></div>
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
                  <div className="p-3 bg-blue-50 rounded-lg"><p className="text-xs text-gray-500">Tenure</p><p className="font-bold text-blue-700">{emiCalculation.tenureMonths} months</p></div>
                  <div className="p-3 bg-amber-50 rounded-lg"><p className="text-xs text-gray-500">Monthly EMI</p><p className="font-bold text-amber-700">{fmt(emiCalculation.monthlyEMI)}</p></div>
                  <div className="p-3 bg-red-50 rounded-lg"><p className="text-xs text-gray-500">Total Interest</p><p className="font-bold text-red-600">{fmt(emiCalculation.totalInterest)}</p></div>
                  <div className="p-3 bg-green-50 rounded-lg"><p className="text-xs text-gray-500">Total Repayment</p><p className="font-bold text-green-700">{fmt(emiCalculation.totalPayment)}</p></div>
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

              <button type="button" onClick={async () => {
                const reportData = buildReportData();
                if (reportData) { await preloadLogoImages(); generateBankPdf(reportData, adminSettings); }
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
`;

// Step 1: Install required packages first (we need jspdf for logo generation)
console.log('  Installing npm packages...');
try {
  execSync('npm install jspdf pdfjs-dist recharts', { cwd: ROOT, stdio: 'pipe', timeout: 120000 });
  console.log('  ✓ npm packages installed');
} catch (e) {
  console.error('  ⚠ npm install failed. Run manually: npm install jspdf pdfjs-dist recharts');
}

// Step 2: Create directories
for (const d of ['src/lib', 'src/components']) {
  fs.mkdirSync(path.join(ROOT, d), { recursive: true });
}

// Step 3: Write bankingTypes.ts
fs.writeFileSync(path.join(ROOT, 'src/lib/bankingTypes.ts'), BANKING_TYPES, 'utf8');
console.log('  ✓ src/lib/bankingTypes.ts');

// Step 4: Write parseBankClient.ts  
fs.writeFileSync(path.join(ROOT, 'src/lib/parseBankClient.ts'), PARSE_BANK_CLIENT, 'utf8');
console.log('  ✓ src/lib/parseBankClient.ts');

// Step 5: Write generateBankPdf.ts
fs.writeFileSync(path.join(ROOT, 'src/lib/generateBankPdf.ts'), GENERATE_BANK_PDF, 'utf8');
console.log('  ✓ src/lib/generateBankPdf.ts');

// Step 6: Write BankingSurrogate.tsx
fs.writeFileSync(path.join(ROOT, 'src/components/BankingSurrogate.tsx'), BANKING_SURROGATE, 'utf8');
console.log('  ✓ src/components/BankingSurrogate.tsx');

// Step 7: Update App.tsx
const appPath = path.join(ROOT, 'src/App.tsx');
const appContent = `import BankingSurrogate from "./components/BankingSurrogate";

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <BankingSurrogate />
    </div>
  );
}

export default App;
`;
fs.writeFileSync(appPath, appContent, 'utf8');
console.log('  ✓ src/App.tsx updated');

console.log('\n  ✅ Setup Complete! Run: npm run dev\n');
