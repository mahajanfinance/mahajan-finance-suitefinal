/**
 * Banking Surrogate - Unified Type Definitions
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
  month: string;
  year: number;
  monthNum: number;
  dayBalances: DayBalance[];
  dayBalanceRow: DayBalanceRow;
  monthlyAverage: number;
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

/** Risk assessment result */
export interface RiskAssessment {
  score: number;
  grade: string;
  remarks: string[];
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
  loanMultiplier: number;
  interestRate: number;
  defaultTenure: number;
}

/** ABB Period selection option with pricing */
export interface ABBPeriodOption {
  months: number;
  price: number;
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

/** Full report data */
export interface BankingReportData {
  customerName: string;
  bankName: string;
  periodMonths: number;
  selectedPeriodMonths: number;
  abb: number;
  totalMonthsFound: number;
  months: MonthData[];
  filteredMonths: MonthData[];
  transactions: Transaction[];
  riskAssessment: RiskAssessment;
  eligibleLoan: number;
  emiCalculation: EMICalculation;
  diagnostics?: ParseDiagnostics;
}

/** Indian currency formatter */
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
