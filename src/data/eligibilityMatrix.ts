// Eligibility multiplier tables based on salary slab, category, and tenure
// Values represent maximum loan amount as a multiple of net salary
// null = Not Applicable (loan not available for this combination)

export type SalarySlab = "lt25k" | "25k_35k" | "35k_50k" | "50k_75k" | "gte75k";
export type EligCategory = "SCATA" | "CATGA" | "CATGB" | "CATGC" | "CATGD" | "GA" | "GB";
export type TenureBucket = "12_23" | "24_35" | "36_47" | "48_59" | "60";

export const salarySlabs: { key: SalarySlab; label: string; min: number; max: number }[] = [
  { key: "lt25k", label: "Below ₹25,000", min: 0, max: 24999 },
  { key: "25k_35k", label: "₹25,000 – ₹34,999", min: 25000, max: 34999 },
  { key: "35k_50k", label: "₹35,000 – ₹49,999", min: 35000, max: 49999 },
  { key: "50k_75k", label: "₹50,000 – ₹74,999", min: 50000, max: 74999 },
  { key: "gte75k", label: "₹75,000 & above", min: 75000, max: Infinity },
];

export const tenureBuckets: { key: TenureBucket; label: string; months: number }[] = [
  { key: "12_23", label: "12–23 Months", months: 18 },
  { key: "24_35", label: "24–35 Months", months: 30 },
  { key: "36_47", label: "36–47 Months", months: 42 },
  { key: "48_59", label: "48–59 Months", months: 54 },
  { key: "60", label: "60 Months", months: 60 },
];

// eligibilityMatrix[salarySlab][category][tenureBucket] = multiplier | null
export const eligibilityMatrix: Record<SalarySlab, Record<EligCategory, Record<TenureBucket, number | null>>> = {
  lt25k: {
    SCATA: { "12_23": 6, "24_35": 10, "36_47": 16, "48_59": 16, "60": 20 },
    CATGA: { "12_23": 6, "24_35": 10, "36_47": 14, "48_59": 17, "60": 20 },
    CATGB: { "12_23": 5, "24_35": 9, "36_47": 13, "48_59": 15, "60": 18 },
    CATGC: { "12_23": 5, "24_35": 7, "36_47": 9, "48_59": 11, "60": null },
    CATGD: { "12_23": 5, "24_35": 7, "36_47": 9, "48_59": 11, "60": null },
    GA:    { "12_23": null, "24_35": null, "36_47": null, "48_59": null, "60": null },
    GB:    { "12_23": 5, "24_35": 7, "36_47": 9, "48_59": 11, "60": null },
  },
  "25k_35k": {
    SCATA: { "12_23": 5, "24_35": 10, "36_47": 14, "48_59": 16, "60": 19 },
    CATGA: { "12_23": 5, "24_35": 10, "36_47": 14, "48_59": 16, "60": 19 },
    CATGB: { "12_23": 5, "24_35": 9, "36_47": 13, "48_59": 15, "60": null },
    CATGC: { "12_23": 5, "24_35": 7, "36_47": 9, "48_59": 11, "60": null },
    CATGD: { "12_23": 5, "24_35": 7, "36_47": 9, "48_59": null, "60": null },
    GA:    { "12_23": null, "24_35": null, "36_47": null, "48_59": null, "60": null },
    GB:    { "12_23": 5, "24_35": 9, "36_47": 12, "48_59": 14, "60": null },
  },
  "35k_50k": {
    SCATA: { "12_23": 6, "24_35": 10, "36_47": 16, "48_59": 16, "60": 20 },
    CATGA: { "12_23": 6, "24_35": 10, "36_47": 14, "48_59": 17, "60": 20 },
    CATGB: { "12_23": 5, "24_35": 9, "36_47": 13, "48_59": 15, "60": 18 },
    CATGC: { "12_23": 5, "24_35": 7, "36_47": 9, "48_59": 11, "60": null },
    CATGD: { "12_23": 5, "24_35": 7, "36_47": 9, "48_59": 11, "60": null },
    GA:    { "12_23": 6, "24_35": 10, "36_47": 15, "48_59": 18, "60": 20 },
    GB:    { "12_23": 5, "24_35": 9, "36_47": 12, "48_59": 14, "60": null },
  },
  "50k_75k": {
    SCATA: { "12_23": 7, "24_35": 13, "36_47": 18, "48_59": 23, "60": 27 },
    CATGA: { "12_23": 7, "24_35": 13, "36_47": 18, "48_59": 21, "60": 27 },
    CATGB: { "12_23": 7, "24_35": 11, "36_47": 15, "48_59": 18, "60": 20 },
    CATGC: { "12_23": 7, "24_35": 11, "36_47": 13, "48_59": 15, "60": 15 },
    CATGD: { "12_23": 5, "24_35": 7, "36_47": 9, "48_59": 11, "60": null },
    GA:    { "12_23": 7, "24_35": 13, "36_47": 18, "48_59": 21, "60": 24 },
    GB:    { "12_23": null, "24_35": null, "36_47": null, "48_59": null, "60": null },
  },
  gte75k: {
    SCATA: { "12_23": 7, "24_35": 13, "36_47": 18, "48_59": 22, "60": 27 },
    CATGA: { "12_23": 7, "24_35": 13, "36_47": 18, "48_59": 22, "60": 27 },
    CATGB: { "12_23": 7, "24_35": 13, "36_47": 18, "48_59": 22, "60": 24 },
    CATGC: { "12_23": 7, "24_35": 13, "36_47": 18, "48_59": 22, "60": null },
    CATGD: { "12_23": 5, "24_35": 7, "36_47": 18, "48_59": null, "60": null },
    GA:    { "12_23": 7, "24_35": 10, "36_47": 15, "48_59": 17, "60": 19 },
    GB:    { "12_23": null, "24_35": null, "36_47": null, "48_59": null, "60": null },
  },
};

// Max FOIR by category
export const maxFOIR: Record<EligCategory, number> = {
  SCATA: 0.65,
  CATGA: 0.60,
  CATGB: 0.55,
  CATGC: 0.50,
  CATGD: 0.45,
  GA: 0.50,
  GB: 0.45,
};

export function getSalarySlab(salary: number): SalarySlab {
  if (salary < 25000) return "lt25k";
  if (salary < 35000) return "25k_35k";
  if (salary < 50000) return "35k_50k";
  if (salary < 75000) return "50k_75k";
  return "gte75k";
}

export function getTenureBucket(months: number): TenureBucket {
  if (months < 24) return "12_23";
  if (months < 36) return "24_35";
  if (months < 48) return "36_47";
  if (months < 60) return "48_59";
  return "60";
}

export function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
  if (principal <= 0 || tenureMonths <= 0) return 0;
  const r = annualRate / 12 / 100;
  if (r === 0) return principal / tenureMonths;
  return (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
}

export function generateRepaymentSchedule(principal: number, annualRate: number, tenureMonths: number) {
  const r = annualRate / 12 / 100;
  const emi = calculateEMI(principal, annualRate, tenureMonths);
  const schedule = [];
  let balance = principal;

  for (let month = 1; month <= tenureMonths; month++) {
    const interest = balance * r;
    const principalPart = emi - interest;
    balance = Math.max(0, balance - principalPart);
    schedule.push({
      month,
      emi: Math.round(emi),
      principal: Math.round(principalPart),
      interest: Math.round(interest),
      balance: Math.round(balance),
    });
  }
  return schedule;
}

export interface EligibilityResult {
  eligible: boolean;
  maxLoan: number;
  maxEMI: number;
  foir: number;
  maxFoirAllowed: number;
  multiplier: number | null;
  category: string;
  salarySlab: string;
}

export function calculateEligibility(
  netSalary: number,
  existingEMI: number,
  category: EligCategory,
  tenureMonths: number,
  interestRate: number = 10.5
): EligibilityResult {
  const slab = getSalarySlab(netSalary);
  const bucket = getTenureBucket(tenureMonths);
  const multiplier = eligibilityMatrix[slab]?.[category]?.[bucket] ?? null;
  const maxFoirAllowed = maxFOIR[category] ?? 0.50;

  if (multiplier === null) {
    return { eligible: false, maxLoan: 0, maxEMI: 0, foir: 0, maxFoirAllowed, multiplier: null, category, salarySlab: slab };
  }

  // Max loan based on multiplier
  const maxLoanByMultiplier = netSalary * multiplier;

  // Max EMI based on FOIR
  const maxEMIByFOIR = (netSalary * maxFoirAllowed) - existingEMI;

  if (maxEMIByFOIR <= 0) {
    return { eligible: false, maxLoan: 0, maxEMI: 0, foir: existingEMI / netSalary, maxFoirAllowed, multiplier, category, salarySlab: slab };
  }

  // Calculate max loan from FOIR-constrained EMI
  const r = interestRate / 12 / 100;
  let maxLoanByFOIR: number;
  if (r === 0) {
    maxLoanByFOIR = maxEMIByFOIR * tenureMonths;
  } else {
    maxLoanByFOIR = (maxEMIByFOIR * (Math.pow(1 + r, tenureMonths) - 1)) / (r * Math.pow(1 + r, tenureMonths));
  }

  const maxLoan = Math.min(maxLoanByMultiplier, maxLoanByFOIR);
  const emi = calculateEMI(maxLoan, interestRate, tenureMonths);
  const foir = (existingEMI + emi) / netSalary;

  return {
    eligible: maxLoan > 0,
    maxLoan: Math.round(maxLoan),
    maxEMI: Math.round(emi),
    foir: Math.round(foir * 10000) / 100,
    maxFoirAllowed: maxFoirAllowed * 100,
    multiplier,
    category,
    salarySlab: slab,
  };
}
