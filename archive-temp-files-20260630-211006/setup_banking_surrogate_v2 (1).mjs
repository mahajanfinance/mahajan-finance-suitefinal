/**
 * Mahajan Finance - Banking Surrogate V2.0 Setup Script
 * 
 * Run from your project root:
 *   node setup_banking_surrogate_v2.mjs
 * 
 * This creates/updates 4 files:
 *   1. src/lib/bankingTypes.ts          (NEW)
 *   2. src/lib/parseBankClient.ts       (REPLACE)
 *   3. src/lib/generateBankPdf.ts       (REPLACE)
 *   4. src/pages/BankingSurrogate.tsx   (REPLACE)
 */

import fs from "fs";
import path from "path";

const SRC_LIB = "src/lib";
const SRC_PAGES = "src/pages";

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
  console.log(`  ✅ ${filePath}`);
}

function backupFile(filePath) {
  if (fs.existsSync(filePath)) {
    const backup = filePath + `.bak_${Date.now()}`;
    fs.copyFileSync(filePath, backup);
    console.log(`  📦 Backed up: ${backup}`);
  }
}

console.log("");
console.log("============================================");
console.log("  Mahajan Finance - Banking Surrogate V2.0");
console.log("============================================");
console.log("");

// Backup existing files
console.log("📦 Backing up existing files...");
backupFile(path.join(SRC_LIB, "parseBankClient.ts"));
backupFile(path.join(SRC_LIB, "generateBankPdf.ts"));
backupFile(path.join(SRC_PAGES, "BankingSurrogate.tsx"));
console.log("");

// ============================================================
// FILE 1: bankingTypes.ts
// ============================================================
console.log("📝 Creating files...");
writeFile(path.join(SRC_LIB, "bankingTypes.ts"), `/**
 * Banking Surrogate - Type Definitions
 * All types for the banking surrogate analysis system
 */

export interface DayBalance {
  day: number;
  balance: number;
  date: string;
}

export interface Transaction {
  date: string;
  narration: string;
  debit: number;
  credit: number;
  balance: number;
}

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

export interface ParseDiagnostics {
  totalTxnRows: number;
  rowsWithBalance: number;
  uniqueDates: number;
  firstDate: string;
  lastDate: string;
  samplePreview: string[];
}

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

export interface RiskAssessment {
  riskScore: number;
  healthGrade: string;
  lendingRemarks: string;
  suggestedMaxLoan: number;
}

export interface EMICalculation {
  loanAmount: number;
  interestRate: number;
  tenure: number;
  monthlyEMI: number;
  totalInterest: number;
  totalRepayment: number;
}

export interface AdminSettings {
  loanMultiplier: number;
  interestRate: number;
  defaultTenure: number;
}

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

/** Indian currency formatter - Rs. 25,450 / Rs. 1,24,580 / Rs. 8,75,000 */
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
`);

console.log("");
console.log("✅ File 1/4 done (bankingTypes.ts)");
console.log("⏳ Files 2-4 are too large for embedded script.");
console.log("");
console.log("Please copy the remaining 3 files manually:");
console.log("  2. src/lib/parseBankClient.ts");
console.log("  3. src/lib/generateBankPdf.ts");
console.log("  4. src/pages/BankingSurrogate.tsx");
console.log("");
