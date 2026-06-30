/**
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
  label: string;         // e.g. "3 Months - Rs. 39"
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
