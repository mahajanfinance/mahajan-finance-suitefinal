/**
 * Banking Surrogate - Client-Side Bank Statement Parser
 */
import type {
  MonthData, DayBalance, DayBalanceRow, Transaction,
  RiskAssessment, EMICalculation, AmortizationRow,
  AdminSettings, BankingReportData,
} from "./bankingTypes";

const SAMPLE_DAYS = [5, 10, 15, 20, 25, 30];
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function parseAmount(s: string): number {
  if (!s) return 0;
  const cleaned = s.replace(/[,;\s]/g, "").replace(/Cr\.?/i, "").replace(/Dr\.?/i, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function parseDate(str: string): Date | null {
  if (!str) return null;
  const s = str.trim().replace(/['"]/g, "");
  let m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (m) {
    const d = parseInt(m[1]), mo = parseInt(m[2]) - 1;
    let y = parseInt(m[3]); if (y < 100) y += 2000;
    return new Date(y, mo, d);
  }
  m = s.match(/^(\d{1,2})[\/\-\s]+([A-Za-z]{3,9})[\/\-\s]+(\d{2,4})$/i);
  if (m) {
    const d = parseInt(m[1]);
    const moIdx = MONTH_NAMES.findIndex(n => m[2].toLowerCase().startsWith(n.toLowerCase()));
    let y = parseInt(m[3]); if (y < 100) y += 2000;
    if (moIdx >= 0) return new Date(y, moIdx, d);
  }
  m = s.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
  if (m) return new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
  return null;
}

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

export function parseBankStatementClient(text: string): BankingReportData {
  const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
  const bankName = detectBankName(text);
  const transactions: Transaction[] = [];
  const rowPatterns = [
    /^(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})\s+(.+?)\s+([\d,]+\.\d{2})?\s*([\d,]+\.\d{2})?\s+([\d,]+\.\d{2})\s*(Cr|Dr)?/i,
    /^(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})\s+(.+?)\s+([\d,]+(?:\.\d{2})?)\s*$/,
  ];
  let totalTxnRows = 0; let rowsWithBalance = 0;
  const dateSet = new Set<string>();
  for (const line of lines) {
    for (const pat of rowPatterns) {
      const match = line.match(pat);
      if (match) {
        totalTxnRows++;
        const dateStr = match[1]; const date = parseDate(dateStr);
        if (!date) continue;
        const dateKey = date.toISOString().slice(0, 10);
        dateSet.add(dateKey);
        let debit = 0, credit = 0, balance = 0;
        const narration = match[2] || "";
        if (match[5]) {
          const val3 = parseAmount(match[3]); const val4 = parseAmount(match[4]);
          balance = parseAmount(match[5]);
          const isDr = (match[6] || "").toUpperCase() === "DR";
          if (val3 > 0 && val4 === 0) {
            if (/credit|cr|received|refund|cash\s*dep/i.test(narration)) credit = val3; else debit = val3;
          } else if (val3 > 0 && val4 > 0) {
            if (/credit|cr|received|refund/i.test(narration)) credit = val4;
            else { debit = val3; credit = val4; }
          }
          if (isDr) balance = -Math.abs(balance);
          rowsWithBalance++;
        } else if (match[3]) {
          const amount = parseAmount(match[3]);
          if (/credit|cr|received|refund|cash\s*dep/i.test(narration)) credit = amount; else debit = amount;
        }
        transactions.push({ date: dateKey, narration, debit, credit, balance: Math.abs(balance) });
        break;
      }
    }
  }
  if (transactions.length === 0) {
    for (const line of lines) {
      const dateMatch = line.match(/(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/);
      if (!dateMatch) continue;
      const date = parseDate(dateMatch[1]); if (!date) continue;
      const dateKey = date.toISOString().slice(0, 10);
      dateSet.add(dateKey);
      const numMatches = line.match(/[\d,]+\.\d{2}/g) || [];
      const lastNum = numMatches.length > 0 ? parseAmount(numMatches[numMatches.length - 1]) : 0;
      if (lastNum > 0) { totalTxnRows++; rowsWithBalance++;
        transactions.push({ date: dateKey, narration: line.replace(dateMatch[1], "").trim().substring(0, 60), debit: 0, credit: 0, balance: lastNum });
      }
    }
  }
  const monthMap = new Map<string, Transaction[]>();
  for (const txn of transactions) {
    const d = new Date(txn.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthMap.has(key)) monthMap.set(key, []);
    monthMap.get(key)!.push(txn);
  }
  const sortedMonthKeys = Array.from(monthMap.keys()).sort();
  const months: MonthData[] = [];
  for (const mk of sortedMonthKeys) {
    const [yearStr, monthStr] = mk.split("-");
    const year = parseInt(yearStr); const monthNum = parseInt(monthStr);
    const monthTxns = monthMap.get(mk) || [];
    monthTxns.sort((a, b) => a.date.localeCompare(b.date));
    const dayBalances: DayBalance[] = [];
    const lastDayOfMonth = new Date(year, monthNum, 0).getDate();
    const adjustedSampleDays = SAMPLE_DAYS.map(d => Math.min(d, lastDayOfMonth));
    const dayBalanceRow: DayBalanceRow = { day5: 0, day10: 0, day15: 0, day20: 0, day25: 0, day30: 0 };
    for (const targetDay of adjustedSampleDays) {
      let bestTxn: Transaction | null = null; let bestDiff = Infinity;
      for (const txn of monthTxns) {
        const txnDate = new Date(txn.date);
        const diff = Math.abs(txnDate.getDate() - targetDay);
        if (diff < bestDiff && txn.balance > 0) { bestDiff = diff; bestTxn = txn; }
      }
      const bal = bestTxn ? bestTxn.balance : 0;
      dayBalances.push({ day: targetDay, balance: bal, date: bestTxn ? bestTxn.date : `${year}-${String(monthNum).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}` });
      const dayKey = `day${targetDay}` as keyof DayBalanceRow;
      if (dayKey in dayBalanceRow) { (dayBalanceRow as any)[dayKey] = bal; }
    }
    const validDayBalances = dayBalances.filter(d => d.balance > 0);
    const monthlyAverage = validDayBalances.length > 0 ? validDayBalances.reduce((s, d) => s + d.balance, 0) / validDayBalances.length : 0;
    const openingBalance = monthTxns.length > 0 ? monthTxns[0].balance : 0;
    const closingBalance = monthTxns.length > 0 ? monthTxns[monthTxns.length - 1].balance : 0;
    const balancesWithValues = monthTxns.filter(t => t.balance > 0).map(t => t.balance);
    const maxBalance = balancesWithValues.length > 0 ? Math.max(...balancesWithValues) : 0;
    const minBalance = balancesWithValues.length > 0 ? Math.min(...balancesWithValues) : 0;
    const totalCredits = monthTxns.reduce((s, t) => s + t.credit, 0);
    const totalDebits = monthTxns.reduce((s, t) => s + t.debit, 0);
    const creditCount = monthTxns.filter(t => t.credit > 0).length;
    const debitCount = monthTxns.filter(t => t.debit > 0).length;
    const chequeBounces = monthTxns.filter(t => /chq\s*bounce|cheque\s*return|dishono|bounce|ret\s*chq/i.test(t.narration)).length;
    const emiBounces = monthTxns.filter(t => /emi\s*bounce|emi\s*return|ecs\s*return|ecs\s*bounce|bounce\s*emi/i.test(t.narration)).length;
    months.push({ month: `${MONTH_NAMES[monthNum - 1]} ${year}`, year, monthNum, dayBalances, dayBalanceRow, monthlyAverage, openingBalance, closingBalance, minBalance, maxBalance, totalCredits, totalDebits, creditCount, debitCount, chequeBounces, emiBounces, transactions: monthTxns });
  }
  const monthsWithABB = months.filter(m => m.monthlyAverage > 0);
  const abb = monthsWithABB.length > 0 ? monthsWithABB.reduce((s, m) => s + m.monthlyAverage, 0) / monthsWithABB.length : 0;
  const riskAssessment = calculateRiskAssessment(months, abb);
  const eligibleLoan = Math.round(abb * 20);
  const emiCalculation: EMICalculation = { loanAmount: eligibleLoan, interestRate: 14, tenureMonths: 36, monthlyEMI: 0, totalInterest: 0, totalPayment: 0, amortizationSchedule: [] };
  return { customerName: "", bankName, periodMonths: months.length, selectedPeriodMonths: months.length, abb, totalMonthsFound: months.length, months, filteredMonths: months, transactions, riskAssessment, eligibleLoan, emiCalculation };
}

export function calculateABBForPeriod(allMonths: MonthData[], selectedMonths: number): { filteredMonths: MonthData[]; abb: number } {
  const filteredMonths = allMonths.slice(-selectedMonths);
  const monthsWithABB = filteredMonths.filter(m => m.monthlyAverage > 0);
  const abb = monthsWithABB.length > 0 ? monthsWithABB.reduce((s, m) => s + m.monthlyAverage, 0) / monthsWithABB.length : 0;
  return { filteredMonths, abb };
}

export function calculateRiskAssessment(months: MonthData[], abb: number, loanMultiplier: number = 20): RiskAssessment {
  if (months.length === 0) return { score: 0, grade: "C", remarks: ["Insufficient data"], cashFlowTrend: "stable", chequeBounces: 0, emiBounces: 0, suggestedMaxLoan: 0 };
  let score = 50; const remarks: string[] = [];
  let cashFlowTrend: "improving" | "stable" | "declining" = "stable";
  if (months.length >= 2) {
    const firstHalf = months.slice(0, Math.ceil(months.length / 2));
    const secondHalf = months.slice(Math.ceil(months.length / 2));
    const firstAvg = firstHalf.reduce((s, m) => s + m.monthlyAverage, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, m) => s + m.monthlyAverage, 0) / secondHalf.length;
    const trendPct = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
    if (trendPct > 20) { score += 15; cashFlowTrend = "improving"; remarks.push("Strong upward balance trend"); }
    else if (trendPct > 5) { score += 8; cashFlowTrend = "improving"; remarks.push("Positive balance trend"); }
    else if (trendPct < -20) { score -= 15; cashFlowTrend = "declining"; remarks.push("Significant balance decline"); }
    else if (trendPct < -5) { score -= 8; cashFlowTrend = "declining"; remarks.push("Slight balance decline"); }
    else { cashFlowTrend = "stable"; remarks.push("Balance trend is stable"); }
  }
  const abbs = months.filter(m => m.monthlyAverage > 0).map(m => m.monthlyAverage);
  if (abbs.length >= 2) {
    const avgABB = abbs.reduce((a, b) => a + b, 0) / abbs.length;
    const variance = abbs.reduce((s, a) => s + Math.pow(a - avgABB, 2), 0) / abbs.length;
    const cv = avgABB > 0 ? Math.sqrt(variance) / avgABB : 1;
    if (cv < 0.2) { score += 15; remarks.push("Very consistent balance"); }
    else if (cv < 0.4) { score += 8; remarks.push("Reasonably consistent balance"); }
    else if (cv > 0.7) { score -= 10; remarks.push("High balance variability"); }
  }
  const totalChequeBounces = months.reduce((s, m) => s + m.chequeBounces, 0);
  const totalEmiBounces = months.reduce((s, m) => s + m.emiBounces, 0);
  score -= totalChequeBounces * 10; score -= totalEmiBounces * 15;
  if (totalChequeBounces > 0) remarks.push(`${totalChequeBounces} cheque bounce(s) detected`);
  if (totalEmiBounces > 0) remarks.push(`${totalEmiBounces} EMI bounce(s) detected`);
  if (totalChequeBounces === 0 && totalEmiBounces === 0) remarks.push("No cheque/EMI bounces - excellent discipline");
  const avgCredits = months.reduce((s, m) => s + m.creditCount, 0) / months.length;
  if (avgCredits >= 5) { score += 10; remarks.push("Regular income credits"); }
  else if (avgCredits >= 2) { score += 5; }
  else { score -= 5; remarks.push("Low credit activity"); }
  if (abb > 50000) { score += 10; remarks.push("Strong average bank balance"); }
  else if (abb > 20000) { score += 5; remarks.push("Moderate average bank balance"); }
  else if (abb < 5000) { score -= 5; remarks.push("Low average bank balance"); }
  score = Math.max(0, Math.min(100, Math.round(score)));
  let grade: string;
  if (score >= 85) grade = "A+"; else if (score >= 70) grade = "A"; else if (score >= 55) grade = "B+"; else if (score >= 40) grade = "B"; else grade = "C";
  if (score >= 80) remarks.unshift("Excellent Banking Profile - Highly recommended");
  else if (score >= 65) remarks.unshift("Good Banking Profile - Suitable for lending");
  else if (score >= 45) remarks.unshift("Moderate Banking Profile - Lending with caution");
  else remarks.unshift("High Risk Profile - Improvement required");
  return { score, grade, remarks: remarks.slice(0, 8), cashFlowTrend, chequeBounces: totalChequeBounces, emiBounces: totalEmiBounces, suggestedMaxLoan: Math.round(abb * loanMultiplier) };
}

export function calculateEMI(loanAmount: number, annualRate: number, tenureMonths: number): EMICalculation {
  if (loanAmount <= 0 || annualRate <= 0 || tenureMonths <= 0) return { loanAmount, interestRate: annualRate, tenureMonths, monthlyEMI: 0, totalInterest: 0, totalPayment: 0, amortizationSchedule: [] };
  const monthlyRate = annualRate / 12 / 100;
  const emi = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  const totalPayment = Math.round(emi * tenureMonths);
  const totalInterest = totalPayment - loanAmount;
  const amortizationSchedule: AmortizationRow[] = [];
  let balance = loanAmount;
  for (let i = 1; i <= tenureMonths; i++) {
    const interest = Math.round(balance * monthlyRate);
    const principal = Math.round(emi) - interest;
    balance = Math.max(Math.round(balance - principal), 0);
    amortizationSchedule.push({ month: i, emi: Math.round(emi), principal: Math.max(principal, 0), interest: Math.max(interest, 0), balance });
  }
  return { loanAmount, interestRate: annualRate, tenureMonths, monthlyEMI: Math.round(emi), totalInterest, totalPayment, amortizationSchedule };
}
