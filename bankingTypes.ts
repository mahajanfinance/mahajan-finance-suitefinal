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
