export interface LoanOffer {
  lender: string;
  badge?: string;
  minSalary: string;
  loanAmount: string;
  interestRate: string;
  tenure: string;
  features: string[];
  accent?: "blue" | "orange" | "red" | "green" | "purple" | "gold";
}

// Bank-wise Personal Loan offers (from Mahajan Finance poster)
export const personalLoanOffers: LoanOffer[] = [
  {
    lender: "HDFC Bank",
    accent: "blue",
    minSalary: "Internal: 25K\nExternal: 50K\nGovt: 35K",
    loanAmount: "₹50,000 – ₹1 Crore",
    interestRate: "10.49% onwards",
    tenure: "12 – 72 Months\n(84 Months for Top 6 Companies)",
    features: ["Up to 4 Balance Transfers", "Top-up after 3 Months"],
  },
  {
    lender: "ICICI Bank",
    accent: "orange",
    minSalary: "Pvt (Listed): 30K\nGovt: 25K\nOpen Market: 40K",
    loanAmount: "₹1 Lakh – ₹1 Crore",
    interestRate: "10.75% onwards",
    tenure: "12 – 72 Months\n(84 Months for Top 6 Companies)",
    features: ["Up to 5 Balance Transfers", "100% Digital Process"],
  },
  {
    lender: "Axis Bank",
    accent: "red",
    minSalary: "Internal: 25K\nExternal: 35K\nCAT D: 60K",
    loanAmount: "₹1 Lakh – ₹40 Lakh",
    interestRate: "11.49% onwards",
    tenure: "12 – 60 Months",
    features: ["Up to 3 Balance Transfers", "Top-up after 6 Months"],
  },
  {
    lender: "Yes Bank",
    accent: "blue",
    minSalary: "20K\n(Except HYD: 15K)",
    loanAmount: "₹50,000 – ₹50 Lakh",
    interestRate: "12.49% onwards",
    tenure: "12 – 60 Months\n(72 for Sal ≥ ₹50K)",
    features: ["Up to 5 Balance Transfers", "Top-up after 3 Months"],
  },
  {
    lender: "IDFC FIRST Bank",
    accent: "red",
    minSalary: "20K",
    loanAmount: "₹1 Lakh – ₹50 Lakh",
    interestRate: "11.99% onwards",
    tenure: "12 – 60 Months",
    features: ["Up to 3 Balance Transfers", "No Top-up"],
  },
  {
    lender: "Aditya Birla Capital",
    accent: "gold",
    minSalary: "20K",
    loanAmount: "₹1 Lakh – ₹50 Lakh",
    interestRate: "13.49% onwards",
    tenure: "12 – 84 Months",
    features: ["Up to 7 Balance Transfers", "Top-up after 6 EMIs"],
  },
  {
    lender: "Axis Finance",
    accent: "red",
    minSalary: "Hyderabad: 40K\nROH: 30K",
    loanAmount: "₹2 Lakh – ₹50 Lakh",
    interestRate: "13.49% onwards",
    tenure: "12 – 60 Months",
    features: ["Up to 8 Balance Transfers", "Zero Foreclosure after 18 EMIs"],
  },
  {
    lender: "InCred Finance",
    accent: "purple",
    minSalary: "50K Gross\n(SCB Sal: 30K)",
    loanAmount: "₹1 Lakh – ₹50 Lakh",
    interestRate: "13.75% onwards",
    tenure: "12 – 60 Months",
    features: ["Self Employed / Pvt Ltd / LLP / Govt", "Quick TAT – 24 Hours"],
  },
  {
    lender: "Finnable",
    accent: "blue",
    minSalary: "Prime: 20K\nEmerging: 15K",
    loanAmount: "₹1 Lakh – ₹10 Lakh",
    interestRate: "13.99% onwards",
    tenure: "36 – 60 Months",
    features: ["Unlimited Balance Transfers", "No Top-up"],
  },
  {
    lender: "Piramal Finance",
    accent: "orange",
    minSalary: "28K",
    loanAmount: "₹1 Lakh – ₹12 Lakh",
    interestRate: "14.25% onwards",
    tenure: "12 – 60 Months",
    features: ["No Balance Transfer", "No Top-up"],
  },
  {
    lender: "Kotak Mahindra Bank",
    accent: "red",
    minSalary: "30K",
    loanAmount: "₹1 Lakh – ₹50 Lakh",
    interestRate: "12.75% onwards",
    tenure: "12 – 60 Months",
    features: ["Up to 4 Balance Transfers", "Top-up after 6 Months"],
  },
  {
    lender: "Bajaj Finserv",
    accent: "blue",
    minSalary: "Prime: 36K\nGrowth: 27K\n(Open Market: 40K / 30K)",
    loanAmount: "₹1 Lakh – ₹35 Lakh",
    interestRate: "13.49% onwards",
    tenure: "36 – 72 Months\n(OD up to 96 Months)",
    features: ["Up to 4 Balance Transfers", "Top-up after 6 Months"],
  },
  {
    lender: "Bandhan Bank",
    accent: "red",
    minSalary: "CAT A & B: 25K\nCAT C: 30K\nCAT D: 40K",
    loanAmount: "₹1 Lakh – ₹50 Lakh",
    interestRate: "13.99% onwards",
    tenure: "12 – 60 Months",
    features: ["No Balance Transfer", "No Top-up"],
  },
  {
    lender: "Poonawalla Fincorp",
    accent: "purple",
    minSalary: "30K",
    loanAmount: "₹1 Lakh – ₹30 Lakh",
    interestRate: "14.49% onwards",
    tenure: "12 – 60 Months\n(OD up to 96 Months)",
    features: ["Up to 3 Balance Transfers", "Top-up after 6 EMIs"],
  },
  {
    lender: "L&T Finance",
    accent: "gold",
    minSalary: "NA (CIBIL Based)",
    loanAmount: "₹50,000 – ₹7 Lakh",
    interestRate: "15.49% onwards",
    tenure: "24 – 48 Months",
    features: ["No Income Proof Required", "Quick & Simple Process"],
  },
];

export const accentColorMap: Record<string, string> = {
  blue: "border-blue-500 text-blue-700 bg-blue-50",
  orange: "border-orange-500 text-orange-700 bg-orange-50",
  red: "border-red-500 text-red-700 bg-red-50",
  green: "border-green-500 text-green-700 bg-green-50",
  purple: "border-purple-500 text-purple-700 bg-purple-50",
  gold: "border-yellow-500 text-yellow-700 bg-yellow-50",
};
