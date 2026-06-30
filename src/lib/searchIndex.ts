export type SearchItem = {
  title: string;
  desc: string;
  path: string;
  category: string;
  keywords: string[];
};

export const SEARCH_INDEX: SearchItem[] = [
  // ─── HOME ──────────────────────────────────────────
  { title: "Home", desc: "Mahajan Finance — your trusted financial partner in Ashta & Sangli", path: "/", category: "Company", keywords: ["home", "main", "landing", "homepage", "mahajan finance"] },

  // ─── LOANS ─────────────────────────────────────────
  { title: "Apply for Loan", desc: "Compare & apply for all loan types — fast processing, best rates", path: "/apply-loan", category: "Loans", keywords: ["loan", "apply", "borrow", "finance", "credit", "emi", "cibil", "eligibility"] },
  { title: "Personal Loan", desc: "Instant personal loans up to ₹40 Lakh — minimal docs, 24hr approval", path: "/apply-loan#personal-loan", category: "Loans", keywords: ["personal loan", "unsecured", "instant loan", "emergency", "cash loan", "wedding", "medical", "travel loan"] },
  { title: "Home Loan", desc: "Home loans starting 8.35% p.a. — tenure up to 30 years, top-up available", path: "/apply-loan#home-loan", category: "Loans", keywords: ["home loan", "housing loan", "mortgage", "property loan", "buy house", "flat", "apartment", "emi calculator", "balance transfer"] },
  { title: "Business Loan", desc: "Collateral-free business loans up to ₹50 Lakh for working capital & expansion", path: "/apply-loan#business-loan", category: "Loans", keywords: ["business loan", "msme loan", "working capital", "startup loan", "commercial loan", "enterprise", "shop loan"] },
  { title: "Vehicle Loan / Car Loan", desc: "Up to 100% on-road financing for new & used cars — rates from 9.15%", path: "/apply-loan#vehicle-loan", category: "Loans", keywords: ["car loan", "vehicle loan", "auto loan", "four wheeler", "new car", "used car", "car finance"] },
  { title: "Two Wheeler Loan", desc: "Bike & scooter loans — up to 100% ex-showroom, quick disbursal", path: "/apply-loan#two-wheeler-loan", category: "Loans", keywords: ["bike loan", "two wheeler", "scooter loan", "motorcycle", "bike finance"] },
  { title: "Gold Loan", desc: "Instant gold loans up to ₹50 Lakh against jewellery — low interest rates", path: "/apply-loan#gold-loan", category: "Loans", keywords: ["gold loan", "jewellery loan", "ornament loan", "gold finance", "gold mortgage"] },
  { title: "Loan Against Property (LAP)", desc: "Leverage residential/commercial property for loans up to ₹5 Crore", path: "/apply-loan#loan-against-property", category: "Loans", keywords: ["lap", "loan against property", "property mortgage", "mortgage loan", "commercial property"] },
  { title: "Education Loan", desc: "Fund higher studies in India or abroad — loans up to ₹1.5 Crore with moratorium", path: "/apply-loan#education-loan", category: "Loans", keywords: ["education loan", "student loan", "study loan", "abroad study", "college", "university", "tuition"] },
  { title: "NRI Loan", desc: "Special loan products for Non-Resident Indians — home, personal & investment", path: "/apply-loan#nri-loan", category: "Loans", keywords: ["nri loan", "non resident", "overseas", "pio", "oci", "nri home loan"] },
  { title: "Agri / Tractor Loan", desc: "Agricultural and tractor loans for farmers — low interest rates & govt subsidy support", path: "/apply-loan#agri-tractor-loan", category: "Loans", keywords: ["agri loan", "tractor loan", "kishan loan", "agriculture finance", "farm loan", "krushi loan"] },
  { title: "Commercial Vehicle Loan", desc: "Finance for trucks, buses, and commercial transport vehicles with flexible tenure", path: "/apply-loan#commercial-vehicle-loan", category: "Loans", keywords: ["commercial vehicle", "truck loan", "cv loan", "transport loan", "heavy vehicle", "tempo"] },
  { title: "Construction Equipment Loan", desc: "Loans for JCB, excavators, cranes & heavy construction machinery", path: "/apply-loan#construction-equipment-loan", category: "Loans", keywords: ["construction loan", "equipment finance", "jcb loan", "machinery loan", "heavy equipment", "poclain"] },
  { title: "SHG Loan", desc: "Self Help Group loans for women empowerment & rural entrepreneurship", path: "/apply-loan#shg-loan", category: "Loans", keywords: ["shg loan", "self help group", "women loan", "micro finance", "bachat gat", "mahila loan"] },

  // ─── INSURANCE ─────────────────────────────────────
  { title: "Insurance Quote", desc: "Compare & buy insurance — instant quotes from top insurers", path: "/insurance", category: "Insurance", keywords: ["insurance", "policy", "premium", "cover", "claim", "insurer", "protection"] },
  { title: "Car Insurance", desc: "Comprehensive & third-party car insurance — instant policy, quick claims", path: "/insurance#car", category: "Insurance", keywords: ["car insurance", "motor insurance", "vehicle insurance", "auto insurance", "third party", "comprehensive", "zero dep"] },
  { title: "Bike Insurance", desc: "Two-wheeler insurance from ₹538/year — own damage + third party", path: "/insurance#bike", category: "Insurance", keywords: ["bike insurance", "two wheeler insurance", "scooter insurance", "motorcycle insurance", "bike policy"] },
  { title: "Health Insurance", desc: "Health cover ₹3L–₹1Cr — cashless at 10,000+ hospitals, family floater", path: "/insurance#health", category: "Insurance", keywords: ["health insurance", "medical insurance", "mediclaim", "hospitalization", "cashless", "family floater", "critical illness"] },
  { title: "Term Insurance (Life)", desc: "₹1 Crore life cover at ₹500/month — protect your family's future", path: "/insurance#term-life", category: "Insurance", keywords: ["term insurance", "life insurance", "term plan", "life cover", "death benefit", "sum assured"] },
  { title: "Commercial Insurance", desc: "Protect your business assets — shop, factory, warehouse & liability covers", path: "/insurance#commercial", category: "Insurance", keywords: ["commercial insurance", "business insurance", "shop insurance", "factory insurance", "liability"] },
  { title: "Fire Insurance", desc: "Fire & burglary cover for property, stock, and machinery", path: "/insurance#fire", category: "Insurance", keywords: ["fire insurance", "burglary", "property damage", "fire cover", "stock insurance"] },
  { title: "Travel Insurance", desc: "Domestic & international travel cover — medical, baggage, trip cancellation", path: "/insurance#travel", category: "Insurance", keywords: ["travel insurance", "trip insurance", "overseas", "flight", "baggage", "schengen"] },
  { title: "Personal Accident Insurance", desc: "Accident cover up to ₹1 Crore — death, disability & medical expense protection", path: "/insurance#personal-accident", category: "Insurance", keywords: ["accident insurance", "personal accident", "pa cover", "disability cover", "accidental death"] },

  // ─── INVESTMENTS ───────────────────────────────────
  { title: "Investments", desc: "Plan your wealth journey — SIP, Mutual Funds, FD, retirement & more", path: "/investments", category: "Investments", keywords: ["investment", "invest", "wealth", "saving", "grow money", "financial planning"] },
  { title: "SIP — Systematic Investment Plan", desc: "Start SIP with ₹500/month — rupee cost averaging + compounding", path: "/investments#sip", category: "Investments", keywords: ["sip", "systematic investment", "monthly investment", "mutual fund sip", "rupee cost averaging", "sip calculator"] },
  { title: "Mutual Funds", desc: "1000+ schemes across equity, debt, hybrid — compare NAV & returns", path: "/investments#mutual-funds", category: "Investments", keywords: ["mutual fund", "mf", "nav", "scheme", "equity fund", "debt fund", "balanced fund", "index fund", "elss"] },
  { title: "Fixed Deposit (FD)", desc: "Guaranteed returns up to 7.75% p.a. — flexible tenure, safe investment", path: "/investments#fixed-deposit", category: "Investments", keywords: ["fd", "fixed deposit", "term deposit", "fd calculator", "fd rates", "cumulative", "safe investment"] },
  { title: "PPF — Public Provident Fund", desc: "7.1% p.a. guaranteed + EEE tax benefit — 15-year lock-in", path: "/investments#ppf", category: "Investments", keywords: ["ppf", "provident fund", "tax saving", "eee", "15 year", "ppf calculator"] },
  { title: "NPS — National Pension System", desc: "Retirement planning + extra ₹50,000 deduction under 80CCD(1B)", path: "/investments#nps", category: "Investments", keywords: ["nps", "pension", "retirement", "80ccd", "tier 1", "tier 2", "pran", "retirement planning"] },
  { title: "ULIP Plans", desc: "Insurance + investment in one plan — market-linked returns with life cover", path: "/investments#ulip", category: "Investments", keywords: ["ulip", "unit linked", "insurance investment", "market linked", "dual benefit"] },
  { title: "Child Plans", desc: "Secure your child's future — education & marriage planning with guaranteed returns", path: "/investments#child-plans", category: "Investments", keywords: ["child plan", "education planning", "marriage planning", "child future", "kids investment"] },
  { title: "Retirement Planning", desc: "Build a retirement corpus — pension, annuity & SWP strategies", path: "/investments#retirement", category: "Investments", keywords: ["retirement", "pension", "annuity", "swp", "corpus", "old age planning", "superannuation"] },
  { title: "Sovereign Gold Bonds", desc: "Invest in digital gold with 2.5% annual interest — govt backed", path: "/investments#sovereign-gold-bonds", category: "Investments", keywords: ["gold bond", "sgb", "digital gold", "government gold", "gold investment"] },
  { title: "Tax Saving Investments (80C)", desc: "Save up to ₹1.5 Lakh under 80C — ELSS, PPF, NPS, FD, insurance", path: "/investments#tax-saving", category: "Investments", keywords: ["tax saving", "80c", "elss", "tax deduction", "1.5 lakh", "chapter vi", "save tax investment"] },

  // ─── ACCOUNTING ────────────────────────────────────
  { title: "Accounting Services", desc: "Complete CA & compliance solutions — ITR, GST, PAN, registrations", path: "/accounting", category: "Accounting", keywords: ["accounting", "ca", "compliance", "tax return", "filing", "bookkeeping", "audit"] },
  { title: "ITR Filing", desc: "File ITR-1 to ITR-7 online with expert CA assistance — maximize refund", path: "/accounting#itr-filing", category: "Accounting", keywords: ["itr", "income tax return", "tax filing", "tax refund", "ay 2025", "sahaj", "itr 1", "efiling"] },
  { title: "GST Returns & Filing", desc: "Monthly/quarterly GSTR filing — GSTR-1, GSTR-3B, annual return", path: "/accounting#gst-returns", category: "Accounting", keywords: ["gst return", "gstr 1", "gstr 3b", "gst filing", "gstr 9", "gstr 10", "gst compliance"] },
  { title: "GST Registration", desc: "New GST registration in 3-5 days — mandatory above ₹20 Lakh turnover", path: "/accounting#gst-registration", category: "Accounting", keywords: ["gst registration", "gstin", "gst number", "new gst", "mandatory gst", "gst threshold"] },
  { title: "PAN Card Application", desc: "New PAN card or corrections — NSDL/UTIITSL online application", path: "/accounting#pan-card", category: "Accounting", keywords: ["pan", "pan card", "permanent account number", "nsdl", "utiitsl", "pan application", "pan correction"] },
  { title: "FSSAI License", desc: "Food license registration — Basic, State, or Central FSSAI in 7 days", path: "/accounting#fssai", category: "Accounting", keywords: ["fssai", "food license", "food safety", "food business", "fbo", "food registration"] },
  { title: "Udyam / MSME Registration", desc: "Register as Micro, Small or Medium Enterprise — access govt benefits", path: "/accounting#udyam", category: "Accounting", keywords: ["udyam", "msme", "sme", "micro enterprise", "small business", "udyog aadhaar", "msme registration"] },
  { title: "Shop & Establishment Act", desc: "Shop Act registration & renewal — mandatory for commercial establishments", path: "/accounting#shop-act", category: "Accounting", keywords: ["shop act", "establishment", "commercial registration", "gumasta", "trade license"] },
  { title: "TDS Returns", desc: "Quarterly TDS filing — 24Q, 26Q, 27Q, 27EQ — avoid penalties", path: "/accounting#tds-returns", category: "Accounting", keywords: ["tds", "tax deducted at source", "24q", "26q", "quarterly", "form 16", "form 16a"] },
  { title: "Bookkeeping & Audit", desc: "Professional bookkeeping, statutory audit & financial statements", path: "/accounting#bookkeeping", category: "Accounting", keywords: ["bookkeeping", "audit", "statutory audit", "financial statement", "balance sheet", "p&l", "ledger"] },
  { title: "Company Registration", desc: "Private Limited, LLP, OPC incorporation in 7-10 days with MCA", path: "/accounting#company-registration", category: "Accounting", keywords: ["company registration", "private limited", "llp", "opc", "incorporation", "mca", "cin"] },
  { title: "Trademark Registration", desc: "Protect your brand name & logo — register under Trade Marks Act 1999", path: "/accounting#trademark", category: "Accounting", keywords: ["trademark", "tm", "brand registration", "logo protection", "intellectual property", "ip"] },
  { title: "Project Reports", desc: "Professional project reports for bank loans, PMEGP, Mudra & CMEGP", path: "/accounting#project-reports", category: "Accounting", keywords: ["project report", "bank report", "pmegp report", "mudra report", "dpr", "detailed project report", "viability report"] },
  { title: "LLP Registration", desc: "Limited Liability Partnership registration with MCA — protect personal assets", path: "/accounting#llp-registration", category: "Accounting", keywords: ["llp", "limited liability partnership", "llp registration", "partnership firm", "llp formation"] },
  { title: "FPC Registration", desc: "Farmer Producer Company registration — combine farming strength", path: "/accounting#fpc-registration", category: "Accounting", keywords: ["fpc", "farmer producer company", "fpc registration", "fpo", "agriculture company"] },
  { title: "Trust Registration", desc: "Register charitable or religious trust — 12A & 80G for tax exemption", path: "/accounting#trust-registration", category: "Accounting", keywords: ["trust registration", "charitable trust", "80g registration", "12a registration", "ngo registration"] },

  // ─── GOVT SCHEMES ─────────────────────────────────
  { title: "Govt Schemes", desc: "Apply for PMEGP, Mudra, Stand-Up India & subsidy programs", path: "/govt-schemes", category: "Govt Schemes", keywords: ["government scheme", "subsidy", "yojana", "sarkari", "pm scheme", "benefit"] },
  { title: "PMEGP", desc: "Up to ₹25 Lakh loan + 15-35% subsidy for new micro enterprises", path: "/govt-schemes#pmegp", category: "Govt Schemes", keywords: ["pmegp", "employment generation", "25 lakh", "subsidy loan", "kvib", "dic", "margin money"] },
  { title: "Mudra Loan (PMMY)", desc: "Business loans up to ₹10 Lakh — Shishu, Kishore, Tarun categories", path: "/govt-schemes#mudra", category: "Govt Schemes", keywords: ["mudra", "pmmy", "shishu", "kishore", "tarun", "micro loan", "small business loan"] },
  { title: "Stand-Up India", desc: "Loans ₹10 Lakh to ₹1 Crore for SC/ST & women entrepreneurs", path: "/govt-schemes#stand-up-india", category: "Govt Schemes", keywords: ["stand up india", "sc st", "women entrepreneur", "1 crore loan", "dalit", "tribal"] },
  { title: "PM Jan Dhan Yojana", desc: "Zero-balance account + ₹2 Lakh accident insurance + overdraft", path: "/govt-schemes#jan-dhan", category: "Govt Schemes", keywords: ["jan dhan", "zero balance", "pmjdy", "financial inclusion", "rupay card"] },
  { title: "Ayushman Bharat (PMJAY)", desc: "Free health cover up to ₹5 Lakh/family/year for hospitalization", path: "/govt-schemes#ayushman-bharat", category: "Govt Schemes", keywords: ["ayushman", "pmjay", "health card", "5 lakh", "free treatment"] },
  { title: "Atal Pension Yojana (APY)", desc: "Guaranteed ₹1,000–₹5,000 monthly pension after age 60", path: "/govt-schemes#atal-pension", category: "Govt Schemes", keywords: ["apy", "atal pension", "monthly pension", "5000 pension", "unorganized sector"] },
  { title: "Sukanya Samriddhi Yojana", desc: "8.2% p.a. for girl child — highest small savings rate, EEE benefit", path: "/govt-schemes#sukanya-samriddhi", category: "Govt Schemes", keywords: ["sukanya", "ssy", "girl child", "daughter savings", "8.2 percent"] },
  { title: "Agri Subsidy Loan (2Cr @ 9%)", desc: "Agriculture infrastructure loan up to ₹2 Crore at 9% with subsidy", path: "/govt-schemes#agri-subsidy", category: "Govt Schemes", keywords: ["agri subsidy", "2 crore", "9 percent", "agriculture infrastructure", "aidis", "agri infra"] },
  { title: "CMEGP (50 Lakh)", desc: "Chief Minister Employment Generation Programme — up to ₹50 Lakh with 25-35% subsidy", path: "/govt-schemes#cmegp", category: "Govt Schemes", keywords: ["cmegp", "chief minister", "50 lakh", "subsidy", "maharashtra", "employment generation"] },
  { title: "PM Awas Yojana", desc: "Interest subsidy up to ₹2.67 Lakh on home loans", path: "/govt-schemes#pm-awas-yojana", category: "Govt Schemes", keywords: ["pmay", "awas yojana", "home subsidy", "interest subsidy", "housing for all", "gharkul"] },
  { title: "PM Suraksha Bima Yojana", desc: "₹2 Lakh accidental cover at just ₹20/year auto-debited from bank", path: "/govt-schemes#pm-suraksha-bima", category: "Govt Schemes", keywords: ["suraksha bima", "pmsby", "20 rupees", "accident cover", "2 lakh"] },
  { title: "PM Jeevan Jyoti Bima Yojana", desc: "₹2 Lakh life cover at ₹436/year auto-debited from bank", path: "/govt-schemes#pm-jeevan-jyoti", category: "Govt Schemes", keywords: ["jeevan jyoti", "pmjjby", "life insurance", "436 rupees", "2 lakh cover"] },
  { title: "Arthik Vikas Mahamandal", desc: "Financial assistance for backward classes & entrepreneurs", path: "/govt-schemes#arthik-vikas-mahamandal", category: "Govt Schemes", keywords: ["avml", "arthik vikas", "maharashtra finance", "backward class", "loan subsidy", "mahamandal"] },

  // ─── CSC SERVICES ─────────────────────────────────
  { title: "CSC Services", desc: "Common Service Centre — utility bills, govt services, certifications", path: "/services", category: "CSC Services", keywords: ["csc", "common service centre", "utility", "government service", "vle"] },
  { title: "Bill Payments", desc: "Electricity, gas, water, DTH, mobile recharge — pay all bills", path: "/services#bill-payment", category: "CSC Services", keywords: ["bill payment", "electricity bill", "gas bill", "water bill", "dth", "recharge", "mobile recharge"] },
  { title: "Aadhaar Services", desc: "Aadhaar enrollment, update, download — link with PAN, bank, mobile", path: "/services#aadhaar", category: "CSC Services", keywords: ["aadhaar", "uidai", "aadhaar update", "aadhaar download", "ekyc", "link aadhaar"] },
  { title: "Passport Application", desc: "New passport or renewal — form filling & appointment booking", path: "/services#passport", category: "CSC Services", keywords: ["passport", "passport application", "renewal", "tatkal", "passport seva"] },
  { title: "Certificates — Income, Caste, Domicile", desc: "Apply for income, caste, domicile, birth & death certificates", path: "/services#certificates", category: "CSC Services", keywords: ["certificate", "income certificate", "caste certificate", "domicile", "birth certificate", "death certificate"] },
  { title: "Voter ID", desc: "Apply for new Voter ID or make corrections — election card registration", path: "/services#voter-id", category: "CSC Services", keywords: ["voter id", "election card", "voter registration", "epic card", "matdata"] },
  { title: "Life Certificate (Jeevan Pramaan)", desc: "Digital life certificate for pensioners — no bank visit needed", path: "/services#life-certificate", category: "CSC Services", keywords: ["jeevan pramaan", "life certificate", "pension certificate", "digital life certificate", "bhavishma patra"] },
  { title: "Ayushman Card (PMJAY)", desc: "Create Ayushman Bharat health card — free treatment up to ₹5 Lakh", path: "/services#ayushman-card", category: "CSC Services", keywords: ["ayushman card", "pmjay card", "health card", "5 lakh health card", "aushadhi"] },
  { title: "Pension Scheme", desc: "Apply for government pension schemes — NPS, Atal Pension Yojana", path: "/services#pension-scheme", category: "CSC Services", keywords: ["pension scheme", "nps", "apy", "retirement pension", "old age pension", "vruddha pension"] },

  // ─── PARTNER ───────────────────────────────────────
  { title: "Partner Program", desc: "Become a DSA/referral partner — earn commission on every loan & insurance", path: "/partner", category: "Partner", keywords: ["partner", "agent", "dsa", "referral", "commission", "franchise", "earn", "associate"] },

  // ─── SHOPPING ──────────────────────────────────────
  { title: "Deals & Shop", desc: "Best deals from Amazon, Flipkart & Tally — exclusive affiliate offers", path: "/shopping", category: "Shopping", keywords: ["deals", "shop", "offer", "discount", "amazon", "flipkart", "tally", "affiliate", "coupon"] },

  // ─── TOOLS ─────────────────────────────────────────
  { title: "Cash Flow Manager", desc: "Track daily income & expenses — profit/loss, reports, visual charts", path: "/tracker", category: "Tools", keywords: ["tracker", "cash flow", "income expense", "profit loss", "daily tracking", "bookkeeping", "budget"] },
  { title: "Banking Surrogate (ABB)", desc: "Average Bank Balance calculator — determine loan eligibility", path: "/banking-surrogate", category: "Tools", keywords: ["abb", "banking surrogate", "average balance", "loan eligibility", "bank statement", "odcc", "cash credit"] },

  // ─── CREDIT SCORE ──────────────────────────────────
  { title: "Check Credit Score (CIBIL)", desc: "Free CIBIL score check — understand factors affecting 300-900 rating", path: "/apply-loan#credit-score", category: "Credit Score", keywords: ["cibil", "credit score", "credit report", "credit history", "credit rating", "experian", "equifax", "crif"] },
  { title: "How to Improve Credit Score", desc: "5 proven strategies to boost CIBIL from poor (550) to excellent (800+)", path: "/apply-loan#credit-score", category: "Credit Score", keywords: ["improve cibil", "increase score", "credit repair", "boost credit", "fix credit score", "build credit"] },

  // ─── CALCULATORS (link to relevant category pages) ──
  { title: "EMI Calculator", desc: "Calculate monthly EMI for any loan with amortization table", path: "/apply-loan#emi-calculator", category: "Calculators", keywords: ["emi calculator", "emi", "monthly installment", "loan emi", "amortization", "repayment"] },
  { title: "SIP Calculator", desc: "Plan SIP returns — see how ₹5,000/month can grow to ₹1 Crore+", path: "/investments#sip-calculator", category: "Calculators", keywords: ["sip calculator", "sip return", "mutual fund calculator", "wealth calculator", "compound interest"] },
  { title: "Income Tax Calculator", desc: "Calculate tax under old & new regime — AY 2025-26", path: "/accounting#income-tax-calculator", category: "Calculators", keywords: ["tax calculator", "income tax", "old vs new regime", "ay 2025", "salary tax", "tax liability"] },
  { title: "GST Calculator", desc: "Compute GST amounts — 5%, 12%, 18%, 28% with CGST/SGST split", path: "/accounting#gst-calculator", category: "Calculators", keywords: ["gst calculator", "gst computation", "cgst sgst", "gst rate", "tax amount"] },
  { title: "FD Calculator", desc: "Fixed deposit maturity & interest calculator", path: "/investments#fd-calculator", category: "Calculators", keywords: ["fd calculator", "fd maturity", "fd interest", "deposit calculator"] },
  { title: "PPF Calculator", desc: "PPF maturity value after 15 years at 7.1% rate", path: "/investments#ppf-calculator", category: "Calculators", keywords: ["ppf calculator", "ppf maturity", "provident fund calculator", "15 year ppf"] },
  { title: "Home Loan Eligibility Calculator", desc: "How much home loan can you get?", path: "/apply-loan#home-loan-eligibility", category: "Calculators", keywords: ["eligibility calculator", "how much loan", "foir", "loan amount", "home loan eligibility"] },
  { title: "Compound Interest Calculator", desc: "Visualize the power of compounding", path: "/investments#compound-interest", category: "Calculators", keywords: ["compound interest", "ci calculator", "power of compounding", "double money", "rule of 72"] },
  { title: "Salary / CTC Calculator", desc: "CTC to in-hand salary breakdown", path: "/accounting#salary-calculator", category: "Calculators", keywords: ["salary calculator", "in hand salary", "ctc breakdown", "hra", "basic salary", "net pay"] },

  // ─── COMPANY ───────────────────────────────────────
  { title: "About Us", desc: "About Mahajan Finance — founded by Sandeep Mahajan, serving Ashta & Sangli", path: "/about", category: "Company", keywords: ["about", "our story", "sandeep mahajan", "mahajan finance", "who we are", "mission", "team"] },
  { title: "Contact Us", desc: "Call, email or WhatsApp — we respond within 24 hours", path: "/contact", category: "Company", keywords: ["contact", "phone", "email", "whatsapp", "address", "ashta", "sangli", "customer care", "support"] },
  { title: "Privacy Policy", desc: "Our data collection, usage & protection practices", path: "/privacy", category: "Company", keywords: ["privacy", "data protection", "cookie policy", "personal data"] },
  { title: "Terms of Service", desc: "Terms & conditions governing website & tool usage", path: "/terms", category: "Company", keywords: ["terms", "conditions", "disclaimer", "legal notice"] },
  { title: "Login / Dashboard", desc: "Customer & partner login portal", path: "/auth", category: "Company", keywords: ["login", "signup", "register", "account", "dashboard", "sign in"] },
];

/* ═══════════════════════════════════════════════════════
   SEARCH ENGINE (unchanged)
   ═══════════════════════════════════════════════════════ */

const SYNONYMS: Record<string, string[]> = {
  loan: ["credit", "finance", "borrow", "advance", "lend", "mortgage"],
  insurance: ["cover", "protection", "policy", "shield"],
  investment: ["invest", "saving", "deposit", "grow money"],
  tax: ["duty", "levy", "cess"],
  emi: ["installment", "monthly payment", "repayment"],
  interest: ["rate", "roi", "yield", "return"],
  save: ["saving", "thrift"],
  calculate: ["calculator", "compute", "estimate"],
  register: ["registration", "apply", "enroll", "sign up"],
  file: ["filing", "submit", "return"],
  buy: ["purchase", "get", "own"],
  money: ["fund", "cash", "rupee", "amount"],
  business: ["enterprise", "company", "firm", "startup", "shop"],
  home: ["house", "property", "residence", "flat", "apartment"],
  car: ["vehicle", "auto", "automobile", "four wheeler"],
  bike: ["two wheeler", "motorcycle", "scooter"],
  health: ["medical", "hospital", "wellness"],
  retirement: ["pension", "old age", "superannuation"],
  income: ["salary", "earnings", "pay", "wage"],
  student: ["education", "study", "academic"],
  online: ["digital", "internet", "web"],
  gold: ["jewellery", "ornament", "sona"],
};

function expandSynonyms(query: string): string[] {
  const ql = query.toLowerCase();
  const terms = [ql];
  for (const [key, syns] of Object.entries(SYNONYMS)) {
    if (ql.includes(key) || key.includes(ql)) terms.push(...syns);
  }
  return terms;
}

function fuzzyMatch(text: string, query: string): boolean {
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  if (t.includes(q)) return true;
  const chars = q.replace(/\s+/g, "").split("");
  let idx = 0;
  for (const word of t.split(/\s+/)) {
    if (word.startsWith(chars[idx] || "")) idx++;
    if (idx >= chars.length) return true;
  }
  if (q.length >= 3) {
    let ci = 0;
    for (let i = 0; i < t.length && ci < q.length; i++) {
      if (t[i] === q[ci]) ci++;
    }
    if (ci === q.length) return true;
  }
  return false;
}

function scoreItem(item: SearchItem, query: string): number {
  const ql = query.toLowerCase();
  let score = 0;
  if (item.title.toLowerCase() === ql) score += 100;
  else if (item.title.toLowerCase().startsWith(ql)) score += 80;
  else if (item.title.toLowerCase().includes(ql)) score += 60;
  else if (fuzzyMatch(item.title, ql)) score += 30;
  for (const kw of item.keywords) {
    if (kw.toLowerCase() === ql) score += 50;
    else if (kw.toLowerCase().startsWith(ql)) score += 35;
    else if (kw.toLowerCase().includes(ql)) score += 25;
  }
  if (item.desc.toLowerCase().includes(ql)) score += 15;
  for (const syn of expandSynonyms(query).slice(1)) {
    for (const kw of item.keywords) { if (kw.toLowerCase().includes(syn)) score += 10; }
    if (item.title.toLowerCase().includes(syn)) score += 8;
    if (item.desc.toLowerCase().includes(syn)) score += 5;
  }
  return score;
}

export function searchSite(query: string): SearchItem[] {
  const term = query.trim().toLowerCase();
  if (!term) return [];
  return SEARCH_INDEX
    .map(item => ({ item, score: scoreItem(item, term) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}

export function searchByCategory(query: string): Record<string, SearchItem[]> {
  const results = searchSite(query);
  const grouped: Record<string, SearchItem[]> = {};
  const categoryOrder = [
    "Loans", "Insurance", "Investments", "Calculators", "Tools",
    "Accounting", "Govt Schemes", "CSC Services",
    "Credit Score", "Partner", "Shopping", "Company",
  ];
  for (const cat of categoryOrder) {
    const items = results.filter(r => r.category === cat);
    if (items.length > 0) grouped[cat] = items;
  }
  return grouped;
}