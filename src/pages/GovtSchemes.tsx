import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Send, ExternalLink, CheckCircle2, Upload, 
         FileText, ListChecks, FolderOpen, Briefcase, Landmark, Coins, Paperclip, 
         ChevronRight, User } from "lucide-react";
import { toast } from "sonner";
import RazorpayButton from "@/components/RazorpayButton";
import { supabase } from "@/integrations/supabase/client";
// import { uploadDocsToStorage } from '@/utils/uploadDocs'; // Uncomment if you have this util

const AVM_SCHEME_FEE = 2499;

type GovtScheme = {
  name: string;
  fee: number;
  category: "Business / MSME" | "Agriculture" | "Housing" | "Welfare / Insurance" | "Education / Skill" | "Women";
  desc: string;
  loanAmount?: string;
  interest?: string;
  subsidy?: string;
  benefits?: string[];
  eligibility?: string[];
  docs: string[];
  link?: string;
  logoUrl?: string; 
  icon: string;     
};

const govtSchemes: GovtScheme[] = [
  // ─────────── BUSINESS / MSME ───────────
  {
    name: "PMMY – Pradhan Mantri MUDRA Yojana",
    fee: 499, category: "Business / MSME", icon: "🏦", logoUrl: "/logos/mudra-logo.png",
    desc: "Collateral-free business loans for non-corporate, non-farm micro/small enterprises under Shishu, Kishor & Tarun categories.",
    loanAmount: "Up to ₹10 Lakh (₹20 Lakh under Tarun Plus)",
    interest: "8% – 12% p.a. (bank-linked)",
    benefits: ["No collateral required", "Loan in 3 categories – Shishu (₹50k), Kishor (₹5L), Tarun (₹10L)", "Working capital + term loan", "Credit Guarantee via CGFMU"],
    eligibility: ["Indian citizen, 18+ years", "Non-corporate small business", "No loan default history"],
    docs: ["Aadhaar Card", "PAN Card", "Passport Size Photo", "Business Proof / Udyam Registration", "Bank Statement (6 months)", "Quotation of Machinery", "Project Report", "Address Proof"],
    link: "https://www.mudra.org.in/",
  },
  {
    name: "PMEGP – PM Employment Generation Programme",
    fee: 749, category: "Business / MSME", icon: "🏭", logoUrl: "/logos/pmegp-logo.png",
    desc: "KVIC-administered credit-linked subsidy scheme for setting up new micro-enterprises in manufacturing & services.",
    loanAmount: "Up to ₹50 Lakh (Mfg) / ₹20 Lakh (Service)",
    subsidy: "15% – 35% margin money subsidy",
    benefits: ["High margin money subsidy (up to 35% rural SC/ST/Women)", "No collateral up to ₹10 Lakh", "Online application via KVIC portal"],
    eligibility: ["18+ years", "8th pass for projects above ₹10L", "New units only"],
    docs: ["Aadhaar Card", "PAN Card", "Project Report (MANDATORY)", "Education Certificate", "Caste Certificate (if applicable)", "Address Proof", "Passport Size Photo", "Quotation of Machinery"],
    link: "https://www.kviconline.gov.in/pmegpeportal/",
  },
  {
    name: "CMEGP – Chief Minister Employment Generation Programme",
    fee: 749, category: "Business / MSME", icon: "🧑‍💼", logoUrl: "/logos/cmegp-logo.png",
    desc: "Maharashtra state credit-linked subsidy for new micro & small enterprises with focus on local employment.",
    loanAmount: "Up to ₹50 Lakh (Mfg) / ₹10 Lakh (Service)",
    subsidy: "15% – 35% margin money subsidy",
    benefits: ["Higher subsidy for Women/SC/ST/OBC/Minority", "Bank tie-up made by DIC", "EDP training provided"],
    eligibility: ["Maharashtra domicile", "18 – 45 years (relaxed for reserved)", "7th pass for higher amounts"],
    docs: ["Aadhaar Card", "PAN Card", "Project Report", "Education Proof", "Domicile Proof", "Caste Certificate", "Address Proof", "Bank Statement", "Quotation", "Passport Size Photo"],
    link: "https://maha-cmegp.gov.in/",
  },
  {
    name: "Stand-Up India",
    fee: 999, category: "Business / MSME", icon: "🤝", logoUrl: "/logos/standup-logo.png",
    desc: "Bank loan for greenfield enterprises by SC/ST and Women entrepreneurs.",
    loanAmount: "₹10 Lakh to ₹1 Crore",
    interest: "MCLR + 3% + tenor premium",
    benefits: ["7-year tenure with up to 18-month moratorium", "Composite loan", "RuPay debit card", "Credit guarantee via CGFSI"],
    eligibility: ["SC/ST and/or Woman entrepreneur, 18+ years", "Greenfield project only"],
    docs: ["Aadhaar Card", "PAN Card", "Caste Certificate (SC/ST)", "Project Report", "Quotation", "Address Proof", "Bank Statement", "Educational Qualification", "Passport Size Photo"],
    link: "https://www.standupmitra.in/",
  },
  {
    name: "CGTMSE – Credit Guarantee for MSE",
    fee: 999, category: "Business / MSME", icon: "🛡️", logoUrl: "/logos/cgtmse-logo.png",
    desc: "Collateral-free credit guarantee cover for MSE loans extended by member lending institutions.",
    loanAmount: "Up to ₹5 Crore",
    benefits: ["No collateral / third-party guarantee", "Guarantee cover up to 85%", "Available for new & existing MSEs"],
    eligibility: ["Registered MSE", "Loan from CGTMSE member bank/NBFC"],
    docs: ["Udyam Registration", "Aadhaar & PAN", "Project Report", "Financials", "Bank Statement", "GST Registration", "KYC of Promoters"],
    link: "https://www.cgtmse.in/",
  },

  // ─────────── AGRICULTURE ───────────
  {
    name: "KCC – Kisan Credit Card",
    fee: 499, category: "Agriculture", icon: "🌾", logoUrl: "/logos/kcc-logo.png",
    desc: "Short-term credit for cultivation, post-harvest, consumption and allied activities at concessional interest.",
    loanAmount: "Based on cropping pattern & land holding",
    interest: "4% effective (with prompt repayment)",
    benefits: ["2% interest subvention + 3% prompt repayment incentive", "Personal accident insurance cover", "Flexible withdrawal via RuPay KCC card"],
    eligibility: ["Farmers – individual, joint, tenant, oral lessees, SHGs / JLGs"],
    docs: ["Aadhaar Card", "PAN Card", "7/12 & 8A Extract", "Passport Size Photo", "Bank Passbook", "Crop Pattern Declaration"],
    link: "https://pmkisan.gov.in/Documents/Kcc.pdf",
  },
  {
    name: "Agri Infrastructure Fund (AIF)",
    fee: 2499, category: "Agriculture", icon: "🚜", logoUrl: "/logos/aif-logo.png",
    desc: "Medium-long term debt financing for post-harvest management infrastructure and community farming assets.",
    loanAmount: "Up to ₹2 Crore (per project)",
    interest: "3% interest subvention (effective ~6–7%)",
    subsidy: "Credit guarantee fee covered under CGTMSE",
    benefits: ["3% interest subvention up to 7 years", "Convergence with other subsidies", "Cold storage, warehouse, etc."],
    eligibility: ["Farmers, FPOs, PACS, SHGs, Agri-entrepreneurs, Startups"],
    docs: ["Aadhaar Card", "PAN Card", "7/12 & 8A Extract", "Bank Passbook", "Photo", "DPR", "Quotation", "GST / Udyam"],
    link: "https://agriinfra.dac.gov.in/",
  },
  {
    name: "PM-KUSUM – Solar Pump & Power Subsidy",
    fee: 1499, category: "Agriculture", icon: "☀️", logoUrl: "/logos/pmkusum-logo.png",
    desc: "Solarisation of agriculture – standalone solar pumps, grid-connected pumps & decentralised solar power plants.",
    subsidy: "Up to 60% central + state subsidy (farmer pays ~10%)",
    benefits: ["Reduced diesel/electricity cost", "Additional income by selling surplus power", "Bank loan for balance 30%"],
    eligibility: ["Individual farmers, FPOs, cooperatives, panchayats"],
    docs: ["Aadhaar Card", "PAN Card", "7/12 Extract", "Bank Passbook", "Electricity Bill", "Photo", "Land Ownership Proof"],
    link: "https://pmkusum.mnre.gov.in/",
  },
  {
    name: "PMFBY – Pradhan Mantri Fasal Bima Yojana",
    fee: 199, category: "Agriculture", icon: "🌧️", logoUrl: "/logos/pmfby-logo.png",
    desc: "Comprehensive crop insurance against natural calamities, pests and diseases for notified crops.",
    benefits: ["Premium: 2% Kharif / 1.5% Rabi / 5% Horticulture", "Coverage for pre-sowing to post-harvest losses", "Direct claim settlement"],
    eligibility: ["All farmers (loanee & non-loanee) growing notified crops"],
    docs: ["Aadhaar Card", "Bank Passbook", "7/12 Extract & Sowing Certificate", "Land Record", "Crop Declaration Form"],
    link: "https://pmfby.gov.in/",
  },
  {
    name: "NABARD Dairy Entrepreneurship Development",
    fee: 999, category: "Agriculture", icon: "🐄", logoUrl: "/logos/nabard-logo.png",
    desc: "Capital subsidy for dairy units, calf rearing, milking machines, cold-chain and processing infrastructure.",
    loanAmount: "Up to ₹7 Lakh (10 animal unit) and beyond",
    subsidy: "25% (33.33% for SC/ST) back-ended capital subsidy",
    benefits: ["Bank loan with NABARD refinance", "Self-employment in rural areas"],
    eligibility: ["Farmers, individual entrepreneurs, SHGs, dairy cooperatives"],
    docs: ["Aadhaar Card", "PAN Card", "Project Report", "Land Document", "Caste Certificate", "Quotation", "Bank Passbook"],
    link: "https://www.nabard.org/",
  },

  // ─────────── HOUSING ───────────
  {
    name: "PMAY-U – Pradhan Mantri Awas Yojana (Urban)",
    fee: 299, category: "Housing", icon: "🏙️", logoUrl: "/logos/pmay-logo.png",
    desc: "Affordable housing for urban poor through Credit Linked Subsidy, BLC, AHP and ISSR verticals.",
    subsidy: "Interest subsidy up to ₹2.67 Lakh (CLSS)",
    benefits: ["6.5% interest subsidy for EWS/LIG", "4% for MIG-I, 3% for MIG-II", "Women co-ownership mandatory"],
    eligibility: ["EWS/LIG/MIG-I/MIG-II annual income criteria", "No pucca house in family name anywhere in India"],
    docs: ["Aadhaar Card", "PAN Card", "Income Certificate / ITR", "Property Documents", "Bank Passbook", "Affidavit", "Caste Certificate"],
    link: "https://pmaymis.gov.in/",
  },
  {
    name: "PMAY-G – Pradhan Mantri Awas Yojana (Gramin)",
    fee: 299, category: "Housing", icon: "🏠", logoUrl: "/logos/pmayg-logo.png",
    desc: "Rural housing assistance for construction of pucca house with basic amenities.",
    subsidy: "₹1.20 Lakh (Plain) / ₹1.30 Lakh (Hilly)",
    benefits: ["Convergence with MGNREGA", "Toilet under SBM-G, LPG under Ujjwala"],
    eligibility: ["Households identified as per SECC 2011 + Awaas+ list", "No pucca house earlier"],
    docs: ["Aadhaar Card", "Bank Passbook", "Job Card (MGNREGA)", "SECC ID / Awaas+ Reg. No.", "Land / Plot Document", "Photo"],
    link: "https://pmayg.nic.in/",
  },

  // ─────────── EDUCATION / SKILL ───────────
  {
    name: "PM Vidya Lakshmi – Education Loan Portal",
    fee: 499, category: "Education / Skill", icon: "🎓", logoUrl: "/logos/vidyalakshmi-logo.png",
    desc: "Single window portal for education loans from 40+ banks for higher studies in India & abroad.",
    loanAmount: "₹4 Lakh – ₹1.5 Crore",
    interest: "8.55% – 11.5% (with CSIS subsidy for EWS)",
    benefits: ["Single CELAF form for multiple banks", "Interest subsidy under CSIS for EWS", "Moratorium = course period + 6 months"],
    eligibility: ["Indian citizen with confirmed admission"],
    docs: ["Aadhaar Card", "PAN Card", "Marksheets", "Admission Letter", "Fee Structure", "Income Certificate", "Bank Statement", "Address Proof", "Photo"],
    link: "https://www.vidyalakshmi.co.in/",
  },
  {
    name: "Skill Loan Scheme",
    fee: 299, category: "Education / Skill", icon: "🛠️", logoUrl: "/logos/skillindia-logo.png",
    desc: "Loan for skill development courses run by Industrial Training Institutes, Polytechnics or NSDC-affiliated institutes.",
    loanAmount: "₹5,000 – ₹1.5 Lakh",
    interest: "Base rate + 1.5% (no margin, no collateral)",
    benefits: ["No collateral / margin money", "Moratorium up to 6 months after course", "Repayment up to 7 years"],
    eligibility: ["Indian national admitted to NSQF aligned institute"],
    docs: ["Aadhaar Card", "PAN Card", "Admission / Course Letter", "Fee Structure", "10th/12th Marksheet", "Bank Passbook", "Photo"],
    link: "https://www.education.gov.in/",
  },

  // ─────────── WELFARE / INSURANCE ───────────
  {
    name: "PM Suraksha Bima Yojana (PMSBY)",
    fee: 20, category: "Welfare / Insurance", icon: "🩹", logoUrl: "/logos/pmsby-logo.png",
    desc: "Accidental death & disability insurance of ₹2 Lakh at ₹20/year premium.",
    benefits: ["₹2 Lakh accidental death cover", "₹2 Lakh permanent total disability", "₹1 Lakh permanent partial disability", "Auto-debit from bank account"],
    eligibility: ["Age 18–70 years with savings bank/Jan Dhan account"],
    docs: ["Aadhaar Card", "Bank Account & Passbook", "Mobile Number", "Nominee Details"],
    link: "https://www.jansuraksha.gov.in/",
  },
  {
    name: "PM Jeevan Jyoti Bima Yojana (PMJJBY)",
    fee: 436, category: "Welfare / Insurance", icon: "❤️", logoUrl: "/logos/pmjjby-logo.png",
    desc: "Life insurance cover of ₹2 Lakh at ₹436/year premium – payable on death due to any cause.",
    benefits: ["₹2 Lakh life cover (any cause)", "Premium auto-debited", "Renewable annually till age 55"],
    eligibility: ["Age 18–50 years with savings bank account"],
    docs: ["Aadhaar Card", "Bank Account", "Mobile Number", "Age Proof", "Nominee Details", "Good Health Declaration"],
    link: "https://www.jansuraksha.gov.in/",
  },
  {
    name: "Atal Pension Yojana (APY)",
    fee: 99, category: "Welfare / Insurance", icon: "👴", logoUrl: "/logos/apy-logo.png",
    desc: "Guaranteed monthly pension of ₹1,000 – ₹5,000 after age 60 for unorganised sector workers.",
    benefits: ["Guaranteed pension ₹1k–₹5k/month at 60", "Same pension to spouse", "Return of corpus to nominee"],
    eligibility: ["Age 18–40 years, savings bank account holder, non-tax payer"],
    docs: ["Aadhaar Card", "Bank Account", "Mobile Number", "Nominee Details"],
    link: "https://www.npscra.nsdl.co.in/scheme-details.php",
  },
  {
    name: "PM Shram Yogi Maan-dhan (PM-SYM)",
    fee: 99, category: "Welfare / Insurance", icon: "👷", logoUrl: "/logos/pmsym-logo.png",
    desc: "Voluntary pension scheme for unorganised workers – ₹3,000/month pension after age 60.",
    benefits: ["Assured ₹3,000 monthly pension", "Equal contribution by Govt. of India", "50% family pension to spouse"],
    eligibility: ["Unorganised worker, age 18–40, monthly income up to ₹15,000", "Not covered under ESIC/EPFO/NPS"],
    docs: ["Aadhaar Card", "Bank Account", "Mobile Number", "Income Declaration"],
    link: "https://maandhan.in/",
  },

  // ─────────── WOMEN ───────────
  {
    name: "Mahila Samman Savings Certificate",
    fee: 99, category: "Women", icon: "👩", logoUrl: "/logos/mssc-logo.png",
    desc: "Small-savings deposit scheme for women & girls with 7.5% interest – tenure 2 years.",
    loanAmount: "Deposit ₹1,000 to ₹2 Lakh",
    interest: "7.5% p.a. (compounded quarterly)",
    benefits: ["Partial withdrawal (40%) after 1 year", "Available at Post Offices & eligible banks"],
    eligibility: ["Woman of any age / Guardian on behalf of minor girl"],
    docs: ["Aadhaar Card", "PAN Card", "Passport Size Photo", "Address Proof", "Bank/Post-Office KYC"],
    link: "https://www.indiapost.gov.in/",
  },
  {
    name: "Sukanya Samriddhi Yojana (SSY)",
    fee: 99, category: "Women", icon: "👧", logoUrl: "/logos/ssy-logo.png",
    desc: "Long-term savings scheme for girl child under Beti Bachao Beti Padhao – tax-free returns.",
    interest: "8.2% p.a. (quarterly notified, EEE tax status)",
    benefits: ["Section 80C deduction up to ₹1.5 Lakh", "Maturity at 21 yrs / marriage after 18", "Partial withdrawal for higher education at 18"],
    eligibility: ["Girl child below 10 years – account by parent/guardian"],
    docs: ["Girl child Birth Certificate", "Aadhaar of Guardian", "PAN of Guardian", "Address Proof", "Passport Size Photo"],
    link: "https://www.nsiindia.gov.in/InternalPage.aspx?Id_Pk=89",
  },
];

const categoryColors: Record<GovtScheme["category"], string> = {
  "Business / MSME": "border-primary",
  "Agriculture": "border-success",
  "Housing": "border-golden",
  "Welfare / Insurance": "border-accent",
  "Education / Skill": "border-cyan-500",
  "Women": "border-pink-500",
};

const avmSchemes = [
  { name: "Annasaheb Patil Arthik Magas Vikas Mahamandal (APAMVM)", color: "border-primary", icon: "🏛️", logoUrl: "/logos/apamvm-logo.png", target: "Maratha Community", loanRange: "₹50,000 to ₹50 Lakh", loanType: "Self-employment / Business", docs: { personal: ["Aadhaar Card", "PAN Card", "Passport size photo"], category: ["Maratha caste certificate or School Leaving Certificate"], business: ["Project Report (MANDATORY)", "Machinery / Shop Quotation", "Experience Certificate (if any)"], financial: ["Bank Passbook (6 months)", "CIBIL Check"], income: ["Tahsildar Income Certificate (MANDATORY)"], other: ["Undertaking", "Guarantor (if required)"] } },
  { name: "Mahatma Phule Backward Class Development Corporation", color: "border-success", icon: "📜", logoUrl: "/logos/mpbcdc-logo.png", target: "OBC Category", loanRange: "As per scheme", loanType: "Business / Self-employment", docs: { personal: ["Aadhaar Card", "PAN Card", "Photo"], category: ["Caste Certificate (OBC)", "Non-Creamy Layer Certificate"], business: ["Project Report", "Quotation", "Shop Act / Udyam"], financial: ["Bank Statement"], income: ["Tahsildar Income Certificate (MANDATORY)"] } },
  { name: "Maharashtra State OBC Finance & Development Corporation", color: "border-golden", icon: "💼", logoUrl: "/logos/obcfdc-logo.png", target: "OBC / SBC", loanRange: "As per scheme", loanType: "Business / Self-employment", docs: { personal: ["Aadhaar Card", "PAN Card"], category: ["Caste Certificate + Non-Creamy Layer"], business: ["Project Report", "Quotation"], financial: ["Bank Passbook"], income: ["Tahsildar Income Certificate (MANDATORY)"], other: ["Residence Proof"] } },
  { name: "Vasantrao Naik VJNT Development Corporation", color: "border-destructive", icon: "🤝", logoUrl: "/logos/vjnt-logo.png", target: "VJNT Category", loanRange: "As per scheme", loanType: "Business / Self-employment", docs: { personal: ["Aadhaar Card", "PAN Card"], category: ["VJNT Caste Certificate", "Caste Validity (if applicable)"], business: ["Project Report", "Quotation"], financial: ["Bank Passbook"], income: ["Tahsildar Income Certificate (MANDATORY)"], other: ["Address Proof"] } },
  { name: "Sant Rohidas Leather Industries Corporation", color: "border-accent", icon: "🧵", logoUrl: "/logos/srlic-logo.png", target: "SC (Leather workers)", loanRange: "As per scheme", loanType: "Leather Business", docs: { personal: ["Aadhaar Card", "PAN Card"], category: ["SC Caste Certificate", "Experience Certificate (IMPORTANT)"], business: ["Project Report", "Machinery Quotation"], financial: ["Bank Passbook"], income: ["Tahsildar Income Certificate (MANDATORY)"] } },
  { name: "Lokshahir Annabhau Sathe Development Corporation", color: "border-purple-500", icon: "🎤", logoUrl: "/logos/lasdc-logo.png", target: "SC Category", loanRange: "As per scheme", loanType: "Business / Self-employment", docs: { personal: ["Aadhaar Card", "PAN Card"], category: ["SC Caste Certificate"], business: ["Project Report", "Quotation"], financial: ["Bank Passbook"], income: ["Tahsildar Income Certificate (MANDATORY)"], other: ["Residence Proof"] } },
  { name: "Maharashtra State Handicapped Finance Corporation", color: "border-foreground/30", icon: "♿", logoUrl: "/logos/mshfc-logo.png", target: "Divyang (Disabled)", loanRange: "As per scheme", loanType: "Business / Self-employment", docs: { personal: ["Aadhaar Card", "PAN Card"], category: ["Disability Certificate (40%+)"], business: ["Project Report", "Quotation"], financial: ["Bank Passbook"], income: ["Tahsildar Income Certificate (MANDATORY)"] } },
  { name: "Maulana Azad Minority Development Corporation", color: "border-primary", icon: "☪️", logoUrl: "/logos/mamdc-logo.png", target: "Minority", loanRange: "As per scheme", loanType: "Business / Education", docs: { personal: ["Aadhaar Card", "PAN Card"], category: ["Minority Declaration / Certificate"], business: ["Project Report / Education Documents"], financial: ["Bank Passbook"], income: ["Tahsildar Income Certificate (MANDATORY)"] } },
  { name: "Mahila Arthik Vikas Mahamandal (MAVIM)", color: "border-pink-500", icon: "👩‍🤝‍👩", logoUrl: "/logos/mavim-logo.png", target: "Women / SHG", loanRange: "As per scheme", loanType: "Women Empowerment / SHG", docs: { personal: ["Aadhaar Card", "PAN Card", "Photo"], category: ["SHG Registration (for groups)", "Group Resolution", "Bank Account"], business: ["Small Project Plan"], income: ["Tahsildar Income Certificate (MANDATORY)"] } },
  { name: "Shamrao Peje Konkan Mahamandal", color: "border-cyan-500", icon: "🌴", logoUrl: "/logos/spkm-logo.png", target: "Konkan OBC", loanRange: "As per scheme", loanType: "Business / Self-employment", docs: { personal: ["Aadhaar Card", "PAN Card"], category: ["Caste Certificate"], business: ["Project Report"], financial: ["Bank Passbook"], income: ["Tahsildar Income Certificate (MANDATORY)"] } },
];

// Professional Icons instead of Emojis for labels
const docSectionLabels: Record<string, React.ReactNode> = {
  personal: <span className="flex items-center gap-1.5"><User size={14} className="text-slate-500"/> Personal</span>,
  category: <span className="flex items-center gap-1.5"><FolderOpen size={14} className="text-slate-500"/> Category</span>,
  business: <span className="flex items-center gap-1.5"><Briefcase size={14} className="text-slate-500"/> Business</span>,
  financial: <span className="flex items-center gap-1.5"><Landmark size={14} className="text-slate-500"/> Financial</span>,
  income: <span className="flex items-center gap-1.5"><Coins size={14} className="text-slate-500"/> Income Proof</span>,
  other: <span className="flex items-center gap-1.5"><Paperclip size={14} className="text-slate-500"/> Other</span>,
};

const autoCapital = (v: string) => v.toUpperCase();
const inputClass = "w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

// Reusable Logo Component with Fallback
const SchemeLogo = ({ src, alt, fallbackIcon }: { src?: string; alt: string; fallbackIcon: string }) => {
  const [imgError, setImgError] = useState(false);
  if (!src || imgError) {
    return (
      <div className="h-12 w-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-2xl shrink-0">
        {fallbackIcon}
      </div>
    );
  }
  return (
    <div className="h-12 w-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 p-1">
      <img src={src} alt={alt} className="max-h-full max-w-full object-contain" onError={() => setImgError(true)} />
    </div>
  );
};

// Reusable Document Row with Upload Option
const DocUploadRow = ({ docName }: { docName: string }) => {
  const [isUploaded, setIsUploaded] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { toast.error("File size must be < 5MB"); return; }
      setIsUploaded(true);
      toast.success(`${docName} attached successfully`);
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 py-1.5 border-b border-dashed border-slate-100 last:border-0 group/doc">
      <div className="flex items-start gap-2 flex-1 min-w-0">
        <ChevronRight size={14} className="text-slate-400 mt-0.5 shrink-0" />
        <span className="text-xs text-foreground">{docName}</span>
      </div>
      <div className="shrink-0">
        {isUploaded ? (
          <span className="text-[10px] font-bold text-green-600 flex items-center gap-0.5 bg-green-50 px-1.5 py-0.5 rounded">
            <CheckCircle2 size={10} /> Done
          </span>
        ) : (
          <label className="cursor-pointer p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-golden transition-all">
            <Upload size={12} />
            <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} />
          </label>
        )}
      </div>
    </div>
  );
};

const GovtSchemeForm = ({ schemeName, fee, onClose }: { schemeName: string; fee: number; onClose: () => void }) => {
  const [form, setForm] = useState({ name: "", mobile: "", city: "", purpose: "" });
  const [showPayment, setShowPayment] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validateAndPay = () => {
    if (!form.name || !form.mobile || !form.city) { toast.error("Please fill all required fields"); return; }
    if (!/^[6-9]\d{9}$/.test(form.mobile)) { toast.error("Enter valid 10-digit mobile"); return; }
    setShowPayment(true);
  };

  const handleAfterPayment = async (paymentId: string) => {
    try {
      await supabase.functions.invoke("send-enquiry-email", {
        body: {
          serviceName: "Govt Scheme - " + schemeName,
          customerName: form.name,
          customerMobile: form.mobile,
          details: { City: form.city, Purpose: form.purpose || "N/A", "Scheme Fee": "Rs." + fee },
          paymentInfo: "Paid Rs." + fee + " - Payment ID: " + paymentId,
          priorityEmails: ["sandeepmahajan9@gmail.com", "info@mahajanfinance.com"],
        },
      });
      toast.success("Application submitted! Emails sent.");
    } catch (e) {
      console.error("Email failed", e);
      toast.error("Submission failed. Please contact manually.");
    }
    setSubmitted(true);
  };

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
      <div className="p-4 border-t border-border space-y-3">
        {submitted ? (
          <div className="text-center py-4 space-y-2">
            <CheckCircle2 size={48} className="text-success mx-auto" />
            <h3 className="font-bold text-foreground">Application Submitted!</h3>
            <p className="text-sm text-muted-foreground">Dear <strong>{form.name}</strong>, your <strong>{schemeName}</strong> application is received.</p>
            <p className="text-xs text-muted-foreground">- Sandeep Mahajan | 9730540215</p>
            <button onClick={onClose} className="mt-2 px-5 py-2 rounded-full bg-primary text-primary-foreground font-bold text-xs hover:scale-105 transition-transform">Close</button>
          </div>
        ) : showPayment ? (
          <div className="text-center space-y-3">
            <p className="text-sm font-semibold text-foreground">💳 Scheme Processing Fee</p>
            <p className="text-2xl font-extrabold text-golden">₹{fee}</p>
            <RazorpayButton
              amount={fee}
              label={`Pay ₹${fee} & Submit`}
              description={`Govt Scheme: ${schemeName}`}
              notes={{ scheme: schemeName, name: form.name, mobile: form.mobile }}
              prefill={{ name: form.name, contact: form.mobile }}
              onSuccess={handleAfterPayment}
            />
            <button onClick={() => setShowPayment(false)} className="text-xs text-muted-foreground hover:text-foreground">← Back</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: autoCapital(e.target.value) })} placeholder="FULL NAME *" className={inputClass} />
              <input type="tel" value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })} placeholder="Mobile *" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input type="text" value={form.city} onChange={e => setForm({ ...form, city: autoCapital(e.target.value) })} placeholder="CITY *" className={inputClass} />
              <input type="text" value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} placeholder="Purpose" className={inputClass} />
            </div>
            <button onClick={validateAndPay} className="btn-accent w-full flex items-center justify-center gap-2 !py-3 rounded-lg text-sm hover:scale-[1.02] transition-transform">
              <Send size={16} /> Proceed to Pay ₹{fee}
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
};

const SchemeCard = ({ scheme }: { scheme: typeof avmSchemes[0] }) => {
  const [expanded, setExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      className={`bg-card rounded-xl border-2 ${scheme.color} shadow-sm hover:shadow-lg transition-all h-full flex flex-col`}
    >
      <button onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left flex items-center gap-3 hover:bg-muted/30 transition-colors rounded-t-xl"
      >
        <SchemeLogo src={scheme.logoUrl} alt={scheme.name} fallbackIcon={scheme.icon} />
        <div className="flex-1 min-w-0">
          <h3 className="font-bold font-display text-foreground text-sm leading-tight hover:text-golden transition-colors">{scheme.name}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Target: <span className="font-semibold text-primary">{scheme.target}</span>
          </p>
        </div>
        {expanded ? <ChevronUp size={18} className="text-muted-foreground shrink-0" /> : <ChevronDown size={18} className="text-muted-foreground shrink-0" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
              <div className="p-2 bg-muted/50 rounded-lg text-xs">
                <span className="font-semibold">Loan Type:</span> {scheme.loanType} • <span className="font-semibold">Range:</span> {scheme.loanRange}
              </div>
              <h4 className="font-bold text-foreground text-xs flex items-center gap-2">
                <ListChecks size={14} className="text-golden" /> Required Documents
              </h4>
              {Object.entries(scheme.docs).map(([key, docs]) => (
                <div key={key} className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    {docSectionLabels[key] || key}
                  </p>
                  {docs.map((doc, i) => (
                    <DocUploadRow key={i} docName={doc} />
                  ))}
                </div>
              ))}
              <button onClick={() => setShowForm(!showForm)}
                className="btn-accent flex items-center justify-center gap-2 w-full !py-2.5 rounded-lg text-xs hover:scale-[1.02] transition-transform"
              >
                <Send size={14} /> Apply for this Scheme
              </button>
              <AnimatePresence>
                {showForm && <GovtSchemeForm schemeName={scheme.name} fee={AVM_SCHEME_FEE} onClose={() => setShowForm(false)} />}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const GovtSchemeCard = ({ scheme }: { scheme: GovtScheme }) => {
  const [expanded, setExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const border = categoryColors[scheme.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`bg-card rounded-xl border-2 ${border} shadow-sm hover:shadow-lg transition-all h-full flex flex-col`}
    >
      <button onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left flex items-start gap-3 hover:bg-muted/30 transition-colors rounded-t-xl"
      >
        <div className="shrink-0 mt-1">
          <SchemeLogo src={scheme.logoUrl} alt={scheme.name} fallbackIcon={scheme.icon} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="inline-block text-[9px] font-bold uppercase tracking-wide bg-muted text-muted-foreground px-1.5 py-0.5 rounded mb-1">
            {scheme.category}
          </span>
          <h3 className="font-bold font-display text-foreground text-sm leading-tight">{scheme.name}</h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{scheme.desc}</p>
          <div className="flex flex-wrap gap-x-2 gap-y-1 mt-2 text-[10px]">
            {scheme.loanAmount && <span className="text-primary font-semibold flex items-center gap-0.5"><Coins size={10}/>{scheme.loanAmount}</span>}
            {scheme.interest && <span className="text-success font-semibold flex items-center gap-0.5"><Landmark size={10}/>{scheme.interest}</span>}
            {scheme.subsidy && <span className="text-accent font-semibold flex items-center gap-0.5"><FileText size={10}/>{scheme.subsidy}</span>}
          </div>
        </div>
        {expanded ? <ChevronUp size={18} className="text-muted-foreground shrink-0 mt-1" /> : <ChevronDown size={18} className="text-muted-foreground shrink-0 mt-1" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
              {scheme.benefits && (
                <div>
                  <h4 className="font-bold text-foreground text-xs mb-1 flex items-center gap-1.5"><CheckCircle2 size={14} className="text-success" /> Key Benefits</h4>
                  <ul className="space-y-0.5">
                    {scheme.benefits.map((b, i) => (
                      <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                        <ChevronRight size={12} className="text-success mt-0.5 shrink-0" /> {b}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {scheme.eligibility && (
                <div>
                  <h4 className="font-bold text-foreground text-xs mb-1 flex items-center gap-1.5"><User size={14} className="text-primary" /> Eligibility</h4>
                  <ul className="space-y-0.5">
                    {scheme.eligibility.map((e, i) => (
                      <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                        <ChevronRight size={12} className="text-primary mt-0.5 shrink-0" /> {e}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h4 className="font-bold text-foreground text-xs mb-1.5 flex items-center gap-1.5">
                  <ListChecks size={14} className="text-golden" /> Required Documents
                </h4>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <div className="grid sm:grid-cols-2 gap-x-4">
                    {scheme.docs.map((d, i) => (
                      <DocUploadRow key={i} docName={d} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
                <p className="text-xs font-extrabold text-golden flex items-center gap-1"><Coins size={12}/> Processing Fee: ₹{scheme.fee}</p>
                {scheme.link && (
                  <a href={scheme.link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                    className="text-[10px] font-semibold text-primary hover:text-golden inline-flex items-center gap-1">
                    Official Site <ExternalLink size={10} />
                  </a>
                )}
              </div>

              <button onClick={() => setShowForm(!showForm)}
                className="btn-accent flex items-center justify-center gap-2 w-full !py-2.5 rounded-lg text-xs hover:scale-[1.02] transition-transform"
              >
                <Send size={14} /> {showForm ? "Close Form" : "Apply for this Scheme"}
              </button>

              <AnimatePresence>
                {showForm && <GovtSchemeForm schemeName={scheme.name} fee={scheme.fee} onClose={() => setShowForm(false)} />}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const CATEGORY_ORDER: GovtScheme["category"][] = [
  "Business / MSME", "Agriculture", "Housing", "Education / Skill", "Welfare / Insurance", "Women",
];

const GovtSchemesGrid = () => {
  const [activeCat, setActiveCat] = useState<GovtScheme["category"] | "All">("All");
  const filtered = activeCat === "All" ? govtSchemes : govtSchemes.filter(s => s.category === activeCat);

  return (
    <>
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {(["All", ...CATEGORY_ORDER] as const).map(cat => (
          <button key={cat} onClick={() => setActiveCat(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              activeCat === cat
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map(scheme => <GovtSchemeCard key={scheme.name} scheme={scheme} />)}
      </div>
    </>
  );
};

const GovtSchemes = () => {
  return (
    <>
      <section className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 py-14 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-50%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-30%] right-[-5%] w-[400px] h-[400px] bg-indigo-400/10 rounded-full blur-3xl"></div>
        </div>
        <div className="container text-center relative z-10">
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-extrabold text-white font-display tracking-tight"
          >
            Government Schemes & Arthik Vikas Mahamandal
          </motion.h1>
          <p className="mt-3 text-blue-200/80 text-lg">सरकारी योजना आणि आर्थिक विकास महामंडळ माहिती</p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-blue-100 text-sm">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            Central & State Schemes | Expert Assistance
          </div>
        </div>
      </section>

      {/* Govt Schemes */}
      <section className="py-12 bg-background">
        <div className="container max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="flex flex-col items-center mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <SchemeLogo src="/logos/govt-header-logo.png" fallbackIcon="🏛️" alt="Government Schemes" />
              <h2 className="section-heading text-center hover:text-golden transition-colors cursor-default">
                Government Loan & Subsidy Schemes
              </h2>
            </div>
            <p className="section-subheading mx-auto text-center">
              Central & State schemes – loans, subsidies, insurance & pension. Tap a card for full details.
            </p>
          </motion.div>

          <GovtSchemesGrid />
        </div>
      </section>

      {/* AVM Schemes - 2 COLUMNS */}
      <section className="py-12 bg-muted">
        <div className="container max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="flex flex-col items-center mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <SchemeLogo src="/logos/avm-header-logo.png" fallbackIcon="🏛️" alt="AVM Schemes" />
              <h2 className="section-heading text-center hover:text-golden transition-colors cursor-default">
                Arthik Vikas Mahamandal Schemes
              </h2>
            </div>
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="section-subheading mx-auto text-center hover:text-foreground transition-colors"
            >आर्थिक मागास विकास महामंडळ योजनांची संपूर्ण माहिती</motion.p>
          </motion.div>
          
          {/* 2-Column Grid Applied Here */}
          <div className="grid md:grid-cols-2 gap-4">
            {avmSchemes.map((scheme) => (
              <SchemeCard key={scheme.name} scheme={scheme} />
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-10 bg-background">
        <div className="container max-w-md text-center">
          <h3 className="font-bold font-display text-foreground mb-3">Need help applying?</h3>
          <a href="https://wa.me/919730540215?text=Hi%20I%20need%20help%20with%20a%20govt%20scheme"
             target="_blank" rel="noopener noreferrer"
             className="inline-block bg-success text-success-foreground px-6 py-3 rounded-full font-bold text-sm hover:brightness-90 hover:scale-105 transition-all">
            💬 Chat on WhatsApp
          </a>
        </div>
      </section>
    </>
  );
};

export default GovtSchemes;