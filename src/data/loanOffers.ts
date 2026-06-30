export interface LoanTypeOffer {
  lender: string;
  accent: string;
  minSalaryLines: string[];
  amount: string;
  rate: string;
  tenure: string;
  features: string[];
}

export interface LoanMeta {
  maxAmount: string;
  highlights: string[];
}

export const loanOffersMeta: Record<string, LoanMeta> = {
  personal: { maxAmount: "₹1 Crore", highlights: ["Fast Approval", "Minimum Documents", "Maximum Eligibility"] },
  home: { maxAmount: "₹5 Crore", highlights: ["Lowest Rates", "Longest Tenure", "Balance Transfer"] },
  lap: { maxAmount: "₹10 Crore", highlights: ["Residential & Commercial", "Business & Personal Use", "Top-up Available"] },
  vehicle: { maxAmount: "₹1 Crore", highlights: ["New & Used Cars", "Two Wheelers", "100% Ex-showroom"] },
  business: { maxAmount: "₹50 Lakhs", highlights: ["Unsecured Options", "Working Capital", "Machinery Finance"] },
  gold: { maxAmount: "₹25 Lakhs", highlights: ["Instant Disbursement", "Minimal Documents", "Agri/Business/Personal"] },
  education: { maxAmount: "₹1 Crore", highlights: ["India & Abroad", "Collateral-free up to 7.5L", "Moratorium Period"] },
  agri: { maxAmount: "₹25 Lakhs", highlights: ["Tractor & Equipment", "Kisan Credit Card", "Land Development"] },
  commercial: { maxAmount: "₹50 Lakhs", highlights: ["New & Used Trucks", "Buses & Tempo", "100% Finance"] },
  construction: { maxAmount: "₹1 Crore", highlights: ["JCB & Cranes", "New & Used", "Low Processing Fee"] },
  shg: { maxAmount: "₹5 Lakhs", highlights: ["Group Business", "Govt Subsidy", "Low Interest"] },
  nri: { maxAmount: "₹5 Crore", highlights: ["Home Purchase India", "Power of Attorney", "NRI Personal Loan"] },
};

export const allLoanOffers: Record<string, LoanTypeOffer[]> = {
  personal: [
    { lender: "HDFC Bank", accent: "blue", minSalaryLines: ["Min ₹25,000"], amount: "₹50,000 – ₹1 Crore", rate: "10.49% onwards", tenure: "12 – 72 Months (84 for Top 6)", features: ["Up to 4 Balance Transfers", "Top-up after 3 Months"] },
    { lender: "ICICI Bank", accent: "orange", minSalaryLines: ["Min ₹25,000"], amount: "₹1 Lakh – ₹1 Crore", rate: "10.75% onwards", tenure: "12 – 72 Months (84 for Top 6)", features: ["Up to 5 Balance Transfers", "100% Digital Process"] },
    { lender: "Axis Bank", accent: "burgundy", minSalaryLines: ["Min ₹25,000"], amount: "₹1 Lakh – ₹40 Lakh", rate: "11.49% onwards", tenure: "12 – 60 Months", features: ["Up to 3 Balance Transfers", "Top-up after 6 Months"] },
    { lender: "Yes Bank", accent: "green", minSalaryLines: ["Min ₹15,000"], amount: "₹50,000 – ₹50 Lakh", rate: "12.49% onwards", tenure: "12 – 60 Months (72 for Sal ≥ 50K)", features: ["Up to 5 Balance Transfers", "Top-up after 3 Months"] },
    { lender: "IDFC FIRST Bank", accent: "teal", minSalaryLines: ["Min ₹20,000"], amount: "₹1 Lakh – ₹50 Lakh", rate: "11.99% onwards", tenure: "12 – 60 Months", features: ["Up to 3 Balance Transfers", "No Top-up"] },
    { lender: "Aditya Birla Capital", accent: "sky", minSalaryLines: ["Min ₹20,000"], amount: "₹1 Lakh – ₹50 Lakh", rate: "13.49% onwards", tenure: "12 – 84 Months", features: ["Up to 7 Balance Transfers", "Top-up after 6 EMIs"] },
    { lender: "Axis Finance", accent: "burgundy", minSalaryLines: ["Min ₹30,000"], amount: "₹2 Lakh – ₹50 Lakh", rate: "13.49% onwards", tenure: "12 – 60 Months", features: ["Up to 8 Balance Transfers", "Zero Foreclosure after 18 EMIs"] },
    { lender: "InCred Finance", accent: "indigo", minSalaryLines: ["Min ₹30,000"], amount: "₹1 Lakh – ₹50 Lakh", rate: "13.75% onwards", tenure: "12 – 60 Months", features: ["Self Employed / Pvt Ltd / LLP / Govt", "Quick TAT – 24 Hours"] },
    { lender: "Finnable", accent: "sky", minSalaryLines: ["Min ₹15,000"], amount: "₹1 Lakh – ₹10 Lakh", rate: "13.99% onwards", tenure: "36 – 60 Months", features: ["Unlimited Balance Transfers", "No Top-up"] },
    { lender: "Piramal Finance", accent: "amber", minSalaryLines: ["Min ₹28,000"], amount: "₹1 Lakh – ₹12 Lakh", rate: "14.25% onwards", tenure: "12 – 60 Months", features: ["No Balance Transfer", "No Top-up"] },
    { lender: "Kotak Mahindra Bank", accent: "red", minSalaryLines: ["Min ₹30,000"], amount: "₹1 Lakh – ₹50 Lakh", rate: "12.75% onwards", tenure: "12 – 60 Months", features: ["Up to 4 Balance Transfers", "Top-up after 6 Months"] },
    { lender: "Bajaj Finserv", accent: "sky", minSalaryLines: ["Min ₹27,000"], amount: "₹1 Lakh – ₹35 Lakh", rate: "13.49% onwards", tenure: "36 – 72 Months (OD up to 96)", features: ["Up to 4 Balance Transfers", "Top-up after 6 Months"] },
    { lender: "Bandhan Bank", accent: "red", minSalaryLines: ["Min ₹25,000"], amount: "₹1 Lakh – ₹50 Lakh", rate: "13.99% onwards", tenure: "12 – 60 Months", features: ["No Balance Transfer", "No Top-up"] },
    { lender: "Poonawalla Fincorp", accent: "amber", minSalaryLines: ["Min ₹30,000"], amount: "₹1 Lakh – ₹30 Lakh", rate: "14.49% onwards", tenure: "12 – 60 Months (OD up to 96)", features: ["Up to 3 Balance Transfers", "Top-up after 6 EMIs"] },
    { lender: "L&T Finance", accent: "blue", minSalaryLines: ["No Min Salary (CIBIL Based)"], amount: "₹50,000 – ₹7 Lakh", rate: "15.49% onwards", tenure: "24 – 48 Months", features: ["CIBIL Based Approval", "Quick Disbursement"] },
  ],
  home: [
    { lender: "SBI", accent: "indigo", minSalaryLines: ["Salary As Per Norms"], amount: "Up to ₹5 Cr", rate: "8.50% – 10.15%", tenure: "Up to 30 years", features: ["Lowest Interest Rates", "No Processing Fee"] },
    { lender: "HDFC Ltd", accent: "blue", minSalaryLines: ["Salary As Per Norms"], amount: "Up to ₹5 Cr", rate: "8.50% – 9.90%", tenure: "Up to 30 years", features: ["Quick Disbursement", "Doorstep Service"] },
    { lender: "ICICI Bank", accent: "orange", minSalaryLines: ["Salary As Per Norms"], amount: "Up to ₹3 Cr", rate: "8.75% – 10.30%", tenure: "Up to 30 years", features: ["Balance Transfer + Top-up", "Digital Process"] },
    { lender: "Bank of Baroda", accent: "green", minSalaryLines: ["Salary As Per Norms"], amount: "Up to ₹5 Cr", rate: "8.40% – 10.10%", tenure: "Up to 30 years", features: ["No Processing Fee", "Low EMI"] },
    { lender: "LIC HFL", accent: "red", minSalaryLines: ["Salary As Per Norms"], amount: "Up to ₹5 Cr", rate: "8.50% – 10.50%", tenure: "Up to 30 years", features: ["Best for Govt Employees", "Quick Approval"] },
    { lender: "Axis Bank", accent: "burgundy", minSalaryLines: ["Salary As Per Norms"], amount: "Up to ₹3 Cr", rate: "8.75% – 10.30%", tenure: "Up to 30 years", features: ["Doorstep Service", "Balance Transfer"] },
  ],
  lap: [
    { lender: "HDFC Ltd", accent: "blue", minSalaryLines: ["Salary As Per Norms"], amount: "Up to ₹10 Cr", rate: "9.50% – 11.50%", tenure: "Up to 15 years", features: ["Residential & Commercial", "Business & Personal Use"] },
    { lender: "ICICI Bank", accent: "orange", minSalaryLines: ["Salary As Per Norms"], amount: "Up to ₹5 Cr", rate: "9.50% – 11.75%", tenure: "Up to 15 years", features: ["Top-up Available", "Quick Processing"] },
    { lender: "SBI", accent: "indigo", minSalaryLines: ["Salary As Per Norms"], amount: "Up to ₹5 Cr", rate: "9.65% – 11.50%", tenure: "Up to 15 years", features: ["Lowest EMI Options", "No Hidden Charges"] },
    { lender: "Kotak Mahindra", accent: "red", minSalaryLines: ["Salary As Per Norms"], amount: "Up to ₹7 Cr", rate: "9.50% – 11.90%", tenure: "Up to 12 years", features: ["Quick 7-day Processing", "Flexi Disbursement"] },
    { lender: "Axis Bank", accent: "burgundy", minSalaryLines: ["Salary As Per Norms"], amount: "Up to ₹5 Cr", rate: "9.70% – 11.75%", tenure: "Up to 15 years", features: ["Top-up Loan Available", "Digital Approval"] },
    { lender: "Bajaj Finserv", accent: "sky", minSalaryLines: ["Salary As Per Norms"], amount: "Up to ₹5 Cr", rate: "9.75% – 12.00%", tenure: "Up to 18 years", features: ["Flexi Loan Facility", "Online Management"] },
  ],
  vehicle: [
    { lender: "SBI", accent: "indigo", minSalaryLines: ["Salary As Per Norms"], amount: "Up to ₹1 Cr", rate: "8.65% – 10.15%", tenure: "Up to 7 years", features: ["Zero Processing Fee", "100% Ex-showroom"] },
    { lender: "HDFC Bank", accent: "blue", minSalaryLines: ["Salary As Per Norms"], amount: "Up to ₹1 Cr", rate: "8.75% – 10.50%", tenure: "Up to 7 years", features: ["Pre-approved Offers", "Quick Disbursement"] },
    { lender: "ICICI Bank", accent: "orange", minSalaryLines: ["Salary As Per Norms"], amount: "Up to ₹80L", rate: "8.80% – 10.75%", tenure: "Up to 7 years", features: ["Pre-approved Offers", "Digital Process"] },
    { lender: "Mahindra Finance", accent: "red", minSalaryLines: ["Salary As Per Norms"], amount: "Up to ₹50L", rate: "9.00% – 12.50%", tenure: "Up to 5 years", features: ["Best for Used Cars", "Flexible Tenure"] },
    { lender: "Bank of Baroda", accent: "green", minSalaryLines: ["Salary As Per Norms"], amount: "Up to ₹1 Cr", rate: "8.55% – 10.00%", tenure: "Up to 7 years", features: ["Lowest Rates", "Quick Processing"] },
    { lender: "Bajaj Auto Fin", accent: "sky", minSalaryLines: ["Salary As Per Norms"], amount: "Up to ₹40L", rate: "8.50% – 11.00%", tenure: "Up to 5 years", features: ["Two Wheeler Specialist", "Instant Approval"] },
  ],
  business: [
    { lender: "HDFC Bank", accent: "blue", minSalaryLines: ["Income As Per ITR"], amount: "Up to ₹50L", rate: "11.50% – 16.50%", tenure: "12 – 48 months", features: ["Unsecured Business Loan", "Quick Disbursement"] },
    { lender: "ICICI Bank", accent: "orange", minSalaryLines: ["Income As Per ITR"], amount: "Up to ₹40L", rate: "12.00% – 17.00%", tenure: "12 – 60 months", features: ["Working Capital Finance", "Digital Process"] },
    { lender: "SBI", accent: "indigo", minSalaryLines: ["Income As Per ITR"], amount: "Up to ₹25L", rate: "11.50% – 15.00%", tenure: "12 – 60 months", features: ["Mudra Loan Available", "Lowest Rates"] },
    { lender: "Axis Bank", accent: "burgundy", minSalaryLines: ["Income As Per ITR"], amount: "Up to ₹50L", rate: "12.00% – 16.50%", tenure: "12 – 48 months", features: ["Machinery Purchase", "Collateral Free"] },
    { lender: "Bajaj Finserv", accent: "sky", minSalaryLines: ["Income As Per ITR"], amount: "Up to ₹35L", rate: "12.00% – 18.00%", tenure: "12 – 60 months", features: ["Flexi Loan Facility", "Business Expansion"] },
    { lender: "Kotak Mahindra", accent: "red", minSalaryLines: ["Income As Per ITR"], amount: "Up to ₹40L", rate: "11.99% – 16.49%", tenure: "12 – 60 months", features: ["Quick Disbursement", "Working Capital"] },
  ],
  gold: [
    { lender: "Canara Bank", accent: "green", minSalaryLines: ["No Min Salary (Gold Based)"], amount: "Up to ₹25L", rate: "7.35% – 9.50%", tenure: "Up to 3 years", features: ["Lowest Govt Bank Rate", "Agri Gold Special"] },
    { lender: "Muthoot Finance", accent: "amber", minSalaryLines: ["No Min Salary (Gold Based)"], amount: "Up to ₹25L", rate: "9.00% – 14.00%", tenure: "Up to 2 years", features: ["Instant Cash in Minutes", "No Income Proof"] },
    { lender: "Manappuram", accent: "red", minSalaryLines: ["No Min Salary (Gold Based)"], amount: "Up to ₹20L", rate: "9.00% – 15.00%", tenure: "Up to 1 year", features: ["Maximum LTV Ratio", "Quick Processing"] },
    { lender: "HDFC Bank", accent: "blue", minSalaryLines: ["No Min Salary (Gold Based)"], amount: "Up to ₹15L", rate: "9.50% – 12.00%", tenure: "Up to 2 years", features: ["Doorstep Evaluation", "Digital Approval"] },
    { lender: "SBI", accent: "indigo", minSalaryLines: ["No Min Salary (Gold Based)"], amount: "Up to ₹20L", rate: "7.50% – 9.50%", tenure: "Up to 3 years", features: ["Agri Gold Loan Special", "Lowest Interest"] },
    { lender: "IIFL Finance", accent: "sky", minSalaryLines: ["No Min Salary (Gold Based)"], amount: "Up to ₹20L", rate: "9.50% – 13.00%", tenure: "Up to 2 years", features: ["Online Approval", "Instant Disbursement"] },
  ],
  education: [
    { lender: "SBI", accent: "indigo", minSalaryLines: ["Co-applicant Income Req."], amount: "Up to ₹1 Cr", rate: "8.15% – 10.50%", tenure: "Up to 15 years", features: ["Collateral-free up to 7.5L", "India & Abroad"] },
    { lender: "Bank of Baroda", accent: "green", minSalaryLines: ["Co-applicant Income Req."], amount: "Up to ₹80L", rate: "8.35% – 10.25%", tenure: "Up to 15 years", features: ["India & Abroad Studies", "Quick Sanction"] },
    { lender: "HDFC Credila", accent: "blue", minSalaryLines: ["Co-applicant Income Req."], amount: "Up to ₹1 Cr", rate: "9.50% – 12.00%", tenure: "Up to 12 years", features: ["Specialized Edu Lender", "Custom Loans"] },
    { lender: "ICICI Bank", accent: "orange", minSalaryLines: ["Co-applicant Income Req."], amount: "Up to ₹50L", rate: "9.50% – 11.75%", tenure: "Up to 10 years", features: ["Quick Sanction", "Moratorium Period"] },
    { lender: "Axis Bank", accent: "burgundy", minSalaryLines: ["Co-applicant Income Req."], amount: "Up to ₹40L", rate: "9.70% – 12.00%", tenure: "Up to 10 years", features: ["Moratorium Period", "Tax Benefits"] },
    { lender: "Prodigy Fin", accent: "sky", minSalaryLines: ["No Co-applicant Req."], amount: "Up to ₹60L", rate: "9.50% – 13.50%", tenure: "Up to 10 years", features: ["No Co-applicant Needed", "Abroad Specialist"] },
  ],
  agri: [
    { lender: "SBI", accent: "indigo", minSalaryLines: ["Income As Per Land"], amount: "Up to ₹25L", rate: "9.95% – 11.50%", tenure: "Up to 7 years", features: ["Kisan Credit Card", "Land Development"] },
    { lender: "Mahindra Finance", accent: "red", minSalaryLines: ["Income As Per Land"], amount: "Up to ₹20L", rate: "10.00% – 13.50%", tenure: "Up to 5 years", features: ["Tractor Specialist", "Equipment Finance"] },
    { lender: "HDFC Bank", accent: "blue", minSalaryLines: ["Income As Per Land"], amount: "Up to ₹15L", rate: "10.00% – 13.00%", tenure: "Up to 5 years", features: ["Equipment Finance", "Quick Processing"] },
    { lender: "Bank of Baroda", accent: "green", minSalaryLines: ["Income As Per Land"], amount: "Up to ₹20L", rate: "9.50% – 11.00%", tenure: "Up to 7 years", features: ["Land Development", "Low Interest"] },
    { lender: "Muthoot Finance", accent: "amber", minSalaryLines: ["No Min Salary (Gold Based)"], amount: "Up to ₹10L", rate: "10.50% – 14.00%", tenure: "Up to 3 years", features: ["Quick Agri Gold Loan", "No Income Proof"] },
    { lender: "Cholamandalam", accent: "sky", minSalaryLines: ["Income As Per Land"], amount: "Up to ₹15L", rate: "10.50% – 14.00%", tenure: "Up to 5 years", features: ["Used Tractor Finance", "Flexible Tenure"] },
  ],
  commercial: [
    { lender: "Mahindra Finance", accent: "red", minSalaryLines: ["Income As Per ITR"], amount: "Up to ₹50L", rate: "10.50% – 14.00%", tenure: "Up to 5 years", features: ["New & Used Trucks", "100% Finance"] },
    { lender: "Tata Capital", accent: "teal", minSalaryLines: ["Income As Per ITR"], amount: "Up to ₹40L", rate: "10.50% – 14.50%", tenure: "Up to 5 years", features: ["Buses & Tempo Finance", "Quick Processing"] },
    { lender: "SBI", accent: "indigo", minSalaryLines: ["Income As Per ITR"], amount: "Up to ₹50L", rate: "10.00% – 12.50%", tenure: "Up to 7 years", features: ["Lowest Bank Rates", "Long Tenure"] },
    { lender: "HDFC Bank", accent: "blue", minSalaryLines: ["Income As Per ITR"], amount: "Up to ₹40L", rate: "10.75% – 13.50%", tenure: "Up to 5 years", features: ["Quick Processing", "Digital Approval"] },
    { lender: "Cholamandalam", accent: "sky", minSalaryLines: ["Income As Per ITR"], amount: "Up to ₹30L", rate: "11.00% – 15.00%", tenure: "Up to 4 years", features: ["Used CV Specialist", "Flexible Payment"] },
    { lender: "Shriram Finance", accent: "amber", minSalaryLines: ["Income As Per ITR"], amount: "Up to ₹25L", rate: "11.50% – 15.50%", tenure: "Up to 4 years", features: ["Flexible Repayment", "Quick Disbursement"] },
  ],
  construction: [
    { lender: "Tata Capital", accent: "teal", minSalaryLines: ["Income As Per ITR"], amount: "Up to ₹1 Cr", rate: "11.00% – 14.00%", tenure: "Up to 5 years", features: ["JCB & Crane Finance", "Top-up Available"] },
    { lender: "SREI Equipment", accent: "burgundy", minSalaryLines: ["Income As Per ITR"], amount: "Up to ₹80L", rate: "11.50% – 14.50%", tenure: "Up to 5 years", features: ["New & Used Equipment", "Flexible Terms"] },
    { lender: "L&T Finance", accent: "blue", minSalaryLines: ["Income As Per ITR"], amount: "Up to ₹1 Cr", rate: "11.00% – 14.00%", tenure: "Up to 5 years", features: ["Top-up Available", "Quick Processing"] },
    { lender: "Mahindra Finance", accent: "red", minSalaryLines: ["Income As Per ITR"], amount: "Up to ₹50L", rate: "11.50% – 15.00%", tenure: "Up to 4 years", features: ["Quick Disbursement", "Easy Docs"] },
    { lender: "Cholamandalam", accent: "sky", minSalaryLines: ["Income As Per ITR"], amount: "Up to ₹50L", rate: "11.50% – 15.00%", tenure: "Up to 4 years", features: ["Used Equipment", "Flexible Tenure"] },
    { lender: "SBI", accent: "indigo", minSalaryLines: ["Income As Per ITR"], amount: "Up to ₹50L", rate: "10.50% – 13.00%", tenure: "Up to 7 years", features: ["Low Processing Fee", "Long Tenure"] },
  ],
  shg: [
    { lender: "SBI", accent: "indigo", minSalaryLines: ["No Min Salary (Group Based)"], amount: "Up to ₹5L", rate: "10.00% – 12.00%", tenure: "Up to 3 years", features: ["Govt Subsidy Schemes", "Low Interest"] },
    { lender: "Bank of Baroda", accent: "green", minSalaryLines: ["No Min Salary (Group Based)"], amount: "Up to ₹4L", rate: "10.00% – 12.50%", tenure: "Up to 3 years", features: ["Group Lending Model", "Quick Approval"] },
    { lender: "Bandhan Bank", accent: "red", minSalaryLines: ["No Min Salary (Group Based)"], amount: "Up to ₹5L", rate: "10.50% – 13.00%", tenure: "Up to 3 years", features: ["Micro Finance Leader", "Easy EMI"] },
    { lender: "Utkarsh SFB", accent: "sky", minSalaryLines: ["No Min Salary (Group Based)"], amount: "Up to ₹3L", rate: "11.00% – 14.00%", tenure: "Up to 2 years", features: ["Income Generation", "Quick Disbursement"] },
    { lender: "HDFC Bank", accent: "blue", minSalaryLines: ["No Min Salary (Group Based)"], amount: "Up to ₹3L", rate: "11.50% – 14.00%", tenure: "Up to 2 years", features: ["Quick Processing", "Digital Payment"] },
    { lender: "ICICI Bank", accent: "orange", minSalaryLines: ["No Min Salary (Group Based)"], amount: "Up to ₹4L", rate: "11.00% – 13.50%", tenure: "Up to 3 years", features: ["Rural Lending", "Doorstep Service"] },
  ],
  nri: [
    { lender: "SBI", accent: "indigo", minSalaryLines: ["NRI Income As Per Norms"], amount: "Up to ₹5 Cr", rate: "8.50% – 10.15%", tenure: "Up to 30 years", features: ["NRI Home Purchase", "Lowest Rates"] },
    { lender: "HDFC Ltd", accent: "blue", minSalaryLines: ["NRI Income As Per Norms"], amount: "Up to ₹5 Cr", rate: "8.50% – 9.90%", tenure: "Up to 30 years", features: ["Power of Attorney", "Doorstep Service"] },
    { lender: "ICICI Bank", accent: "orange", minSalaryLines: ["NRI Income As Per Norms"], amount: "Up to ₹3 Cr", rate: "8.75% – 10.30%", tenure: "Up to 30 years", features: ["NRI Personal Loan", "Quick Processing"] },
    { lender: "Axis Bank", accent: "burgundy", minSalaryLines: ["NRI Income As Per Norms"], amount: "Up to ₹3 Cr", rate: "8.75% – 10.30%", tenure: "Up to 30 years", features: ["Doorstep NRI Service", "Balance Transfer"] },
    { lender: "Kotak Mahindra", accent: "red", minSalaryLines: ["NRI Income As Per Norms"], amount: "Up to ₹2 Cr", rate: "9.00% – 10.50%", tenure: "Up to 25 years", features: ["NRI Corner Service", "Digital Process"] },
    { lender: "Bank of Baroda", accent: "green", minSalaryLines: ["NRI Income As Per Norms"], amount: "Up to ₹5 Cr", rate: "8.40% – 10.10%", tenure: "Up to 30 years", features: ["Gulf NRI Specials", "Low Processing Fee"] },
  ],
};
