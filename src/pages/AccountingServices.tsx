"use client";

import React, { useState, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Send,
  Upload,
  ChevronDown,
  ChevronUp,
  FileText,
  CheckCircle2,
  Circle,
  Info,
  Clock,
  IndianRupee,
  CalendarDays,
  ShieldCheck,
  Building2,
  Landmark,
  Users,
  Leaf,
  HandHelping,
  Briefcase,
  X,
  Sparkles,
} from "lucide-react";

/* ─── Shared helpers ─── */

const inputClass =
  "w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60";

const autoCapital = (v: string) => v.replace(/\b\w/g, (c) => c.toUpperCase());

/* ─── Tiny UI atoms ─── */

const Badge = ({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "info" | "gold";
}) => {
  const cls: Record<string, string> = {
    default: "bg-muted text-muted-foreground",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    info: "bg-sky-50 text-sky-700 border-sky-200",
    gold: "bg-amber-50 text-amber-800 border-amber-300",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls[variant]}`}
    >
      {children}
    </span>
  );
};

const InfoBox = ({ children }: { children: ReactNode }) => (
  <div className="flex gap-2.5 p-3 bg-muted/50 rounded-lg border border-border/60 text-sm text-muted-foreground">
    <Info size={15} className="shrink-0 mt-0.5 text-primary" />
    <span>{children}</span>
  </div>
);

const InputField = ({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) => (
  <div>
    <label className="block text-sm font-semibold text-foreground mb-1.5">
      {label}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </label>
    {hint && (
      <p className="text-xs text-muted-foreground mb-1.5">{hint}</p>
    )}
    {children}
  </div>
);

const SectionLabel = ({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children: ReactNode;
}) => (
  <div className="flex items-center gap-2 text-sm font-bold text-foreground mb-3 pt-1">
    <Icon size={15} className="text-primary" />
    {children}
  </div>
);

/* ─── Document upload row ─── */

const ACCEPTED_FORMATS = ".jpg,.jpeg,.png,.pdf";
const MAX_FILE_MB = 5;

const DocumentUploadItem = ({ doc, docHint, onFileChange }: { doc: string; docHint?: string; onFileChange?: (file: File | null) => void }) => {
  const [file, setFile] = useState<File | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const updateFile = (f: File | null) => {
    setFile(f);
    onFileChange?.(f);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`${f.name} exceeds ${MAX_FILE_MB} MB limit`);
      e.target.value = "";
      return;
    }
    updateFile(f);
    toast.success(`${doc} uploaded`);
  };

  const removeFile = () => {
    updateFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <li className="flex items-center justify-between gap-3 text-sm text-foreground py-2.5 border-b border-border/30 last:border-0">
      <div className="flex items-start gap-2.5 min-w-0">
        {file ? (
          <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-500" />
        ) : (
          <Circle size={16} className="shrink-0 mt-0.5 text-muted-foreground/40" />
        )}
        <div className="min-w-0">
          <span className="block font-medium leading-tight">{doc}</span>
          {docHint && (
            <span className="block text-xs text-muted-foreground mt-0.5">
              {docHint}
            </span>
          )}
        </div>
      </div>

      {file ? (
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs text-emerald-600 font-medium truncate max-w-[100px]">
            {file.name}
          </span>
          <button
            type="button"
            onClick={removeFile}
            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            aria-label={`Remove ${doc}`}
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <label className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 text-xs font-semibold text-foreground cursor-pointer hover:bg-muted/60 transition-colors">
          <Upload size={13} />
          Upload
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_FORMATS}
            className="hidden"
            onChange={handleFile}
          />
        </label>
      )}
    </li>
  );
};

/* ─── Custom icons (not in older lucide-react versions) ─── */

function ReceiptText(props: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size || 24}
      height={props.size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <path d="M12 17.5v-11" />
    </svg>
  );
}

function ClipboardList(props: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size || 24}
      height={props.size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  );
}

/* ─── Service configuration types ─── */

interface ServiceField {
  label: string;
  key: string;
  type?: string;
  options?: string[];
  required?: boolean;
  hint?: string;
  capitalise?: boolean;
}

interface ServiceDoc {
  name: string;
  hint?: string;
}

interface ServiceConfig {
  key: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  fields: ServiceField[];
  docs: ServiceDoc[];
  badges: { icon: React.ComponentType<{ size?: number; className?: string }>; text: string; variant?: "default" | "success" | "warning" | "info" | "gold" }[];
  infoText?: string;
}
/* ─── Service definitions (updated with latest official info) ─── */

const accountingServices: ServiceConfig[] = [
  {
    key: "itr",
    title: "Income Tax Return (ITR) Filing",
    subtitle: "File your returns for AY 2025-26 & AY 2026-27 with expert assistance",
    icon: FileText,
    color: "text-blue-600",
    fields: [
      { label: "Full Name", key: "name", required: true, capitalise: true },
      { label: "Mobile Number", key: "mobile", required: true, hint: "10-digit Indian mobile number" },
      { label: "PAN Number", key: "pan", required: true, hint: "e.g. ABCDE1234F" },
      { label: "Date of Birth", key: "dob", type: "date" },
      { label: "Email ID", key: "email", type: "email" },
      {
        label: "Assessment Year",
        key: "assessmentYear",
        options: ["AY 2025-26 (FY 2024-25)", "AY 2026-27 (FY 2025-26)", "Earlier (Belated / Revised)"],
        required: true,
      },
      {
        label: "Tax Regime",
        key: "taxRegime",
        options: ["New Regime (Default — Sec 115BAC)", "Old Regime (Opt-in)"],
        hint: "New Regime: 0 tax up to \u20B97.75L | Old Regime: allows 80C, HRA, etc.",
      },
      {
        label: "Income Type",
        key: "incomeType",
        options: [
          "Salary (ITR-1 / ITR-2)",
          "Business / Profession (ITR-3 / ITR-4)",
          "Capital Gains (ITR-2)",
          "House Property + Other (ITR-2)",
          "Company / Firm (ITR-5 / ITR-6)",
        ],
        required: true,
      },
      { label: "Filed ITR Last Year?", key: "filedLastYear", options: ["Yes", "No", "First-time Filer"] },
    ],
    docs: [
      { name: "PAN Card", hint: "Mandatory for all taxpayers" },
      { name: "Aadhaar Card", hint: "Must be linked with PAN" },
      { name: "Form 16 (for salaried individuals)", hint: "TDS certificate from employer" },
      { name: "Form 26AS / AIS / TIS", hint: "Available on incometax.gov.in" },
      { name: "Bank Statements (all accounts)", hint: "For the full financial year" },
      { name: "Investment Proofs (LIC, PPF, ELSS, 80C)", hint: "If claiming Old Regime deductions" },
      { name: "Capital Gains Statement", hint: "From broker / depository (if applicable)" },
      { name: "Home Loan Interest Certificate", hint: "From bank (if applicable)" },
      { name: "Previous Year ITR / Acknowledgement", hint: "If available" },
    ],
    badges: [
      { icon: Clock, text: "Due: 15 Sep 2025 (AY 2025-26, extended)", variant: "warning" },
      { icon: ShieldCheck, text: "New Regime: 0 tax up to \u20B97.75L", variant: "success" },
      { icon: Info, text: "ITR-1 now allows equity LTCG (AY 2025-26)", variant: "info" },
    ],
    infoText: "AY 2025-26 deadline extended to 15 Sep 2025 via CBDT Circular 06/2025. New Tax Regime is the default from AY 2024-25 onwards. Standard deduction increased to \u20B975,000 (FY 2024-25) and \u20B91,00,000 (FY 2025-26).",
  },
  {
    key: "gst",
    title: "GST Return Filing",
    subtitle: "GSTR-1, GSTR-3B, Annual Returns \u2014 monthly, quarterly & annual",
    icon: ReceiptText,
    color: "text-orange-600",
    fields: [
      { label: "Full Name", key: "name", required: true, capitalise: true },
      { label: "Business / Trade Name", key: "businessName", required: true, capitalise: true },
      { label: "Mobile Number", key: "mobile", required: true, hint: "10-digit Indian mobile number" },
      { label: "GSTIN (GST Number)", key: "gstNumber", required: true, hint: "15-digit GST Identification Number" },
      {
        label: "Return Type",
        key: "returnType",
        options: [
          "GSTR-1 (Outward Supplies)",
          "GSTR-3B (Summary Return)",
          "GSTR-9 (Annual Return)",
          "GSTR-9C (Reconciliation Statement)",
          "GSTR-4 (Composition Scheme)",
          "Multiple Returns",
        ],
        required: true,
      },
      {
        label: "Filing Frequency",
        key: "filingFrequency",
        options: ["Monthly", "Quarterly (QRMP Scheme)", "Annual"],
        hint: "QRMP: GSTR-1 by 13th, GSTR-3B by 22nd/24th after quarter",
      },
      { label: "Approx. Monthly Turnover (\u20B9)", key: "turnover", hint: "For reference purposes" },
      { label: "Filing Period / Month", key: "filingPeriod", hint: "e.g. May 2025, Q1 FY 2025-26" },
    ],
    docs: [
      { name: "GST Certificate / Registration", hint: "GSTIN details" },
      { name: "Sales Register / Invoices", hint: "Outward supply details" },
      { name: "Purchase Register", hint: "Inward supply details" },
      { name: "GSTR-2B (Auto-populated ITC)", hint: "Available on GST portal" },
      { name: "Expense Details / Bills", hint: "Input Tax Credit supporting docs" },
      { name: "Bank Statements", hint: "For reconciliation" },
      { name: "Previous GST Returns", hint: "If filing for past periods" },
    ],
    badges: [
      { icon: CalendarDays, text: "GSTR-1: 11th | GSTR-3B: 20th of following month", variant: "info" },
      { icon: Clock, text: "GSTR-9 FY 2024-25: Due 31 Dec 2025", variant: "warning" },
      { icon: Info, text: "GST 2.0 reforms effective 22 Sep 2025", variant: "info" },
    ],
    infoText: "Major GST reform from 22 Sep 2025: 12% & 28% slabs abolished, simplified to mainly 5% and 18%. GSTR-2B is now auto-populated from supplier GSTR-1 data \u2014 use it for accurate ITC claims. 3-year filing block rule allows filing pending returns.",
  },
  {
    key: "project",
    title: "Project Report (Bank-Standard)",
    subtitle: "Comprehensive CMA-compliant report for loan applications \u2014 \u20B94,999",
    icon: Briefcase,
    color: "text-purple-600",
    fields: [
      { label: "Proprietor / Promoter Name", key: "name", required: true, capitalise: true },
      { label: "Mobile Number", key: "mobile", required: true, hint: "10-digit Indian mobile number" },
      { label: "Business / Enterprise Name", key: "businessName", required: true, capitalise: true },
      { label: "PAN of Proprietor", key: "pan", required: true, hint: "PAN of the applicant" },
      { label: "Nature of Business Activity", key: "activity", required: true, capitalise: true, hint: "e.g. Manufacturing, Trading, Services" },
      { label: "Experience in Field (years)", key: "experience" },
      { label: "Location of Business", key: "address", capitalise: true },
      { label: "Total Project Cost (\u20B9)", key: "projectCost", hint: "Including land, machinery, working capital" },
      { label: "Loan Amount Required (\u20B9)", key: "loanAmount", required: true, hint: "Term loan amount sought from bank" },
      { label: "Own Contribution (\u20B9)", key: "ownContribution", hint: "Minimum 10-25% of project cost" },
      { label: "Interest Rate (%)", key: "interestRate", hint: "As quoted by bank (if known)" },
      { label: "Repayment Period (months)", key: "repayPeriod", hint: "Total loan tenure" },
      { label: "Monthly EMI (\u20B9)", key: "installment", hint: "If already quoted by bank" },
      { label: "Moratorium / Grace Period (months)", key: "gracePeriod", hint: "Period before EMI starts" },
      { label: "Government Scheme (if any)", key: "govtScheme", options: ["MUDRA Loan", "PMEGP", "Stand-Up India", "CGTMSE", "None"] },
    ],
    docs: [
      { name: "PAN of Proprietor", hint: "Mandatory" },
      { name: "Aadhaar Card", hint: "KYC requirement" },
      { name: "Business / Shop Act / Udyam Registration", hint: "Business proof" },
      { name: "Itemised Quotations (all machinery/equipment)", hint: "From suppliers \u2014 itemised with GST" },
      { name: "Land Document / Rent Agreement", hint: "For business premises" },
      { name: "Bank Statement (last 6-12 months)", hint: "For existing businesses" },
      { name: "Educational / Experience Certificates", hint: "Promoter profile" },
      { name: "ITR (last 2-3 years, if applicable)", hint: "For existing businesses" },
      { name: "Property Documents (for collateral)", hint: "If collateral is being offered" },
    ],
    badges: [
      { icon: IndianRupee, text: "\u20B94,999 all-inclusive", variant: "gold" },
      { icon: ShieldCheck, text: "CMA-compliant format", variant: "success" },
      { icon: Info, text: "Includes: P&L, B/S, Cash Flow, DSCR, SWOT", variant: "info" },
    ],
    infoText: "Banks typically require DSCR \u2265 1.5 and Debt-Equity \u2264 2:1. CMA Data is mandatory for loans above \u20B925 lakh. Report covers: Promoter Profile, Cost of Project, Means of Finance, 3-5 year Projections, Repayment Schedule, Financial Ratios, and SWOT Analysis.",
  },
  {
    key: "company",
    title: "Private Limited Company Registration",
    subtitle: "Incorporate via SPICe+ \u2014 PAN, TAN, GSTIN, EPFO, ESIC included",
    icon: Building2,
    color: "text-indigo-600",
    fields: [
      { label: "Applicant Name", key: "name", required: true, capitalise: true },
      { label: "Mobile Number", key: "mobile", required: true, hint: "10-digit Indian mobile number" },
      { label: "Proposed Company Name", key: "companyName", required: true, hint: "Suggest 2 preferred names", capitalise: true },
      { label: "Number of Directors (min 2)", key: "directors", hint: "Minimum 2, maximum 15" },
      { label: "Business Activity", key: "activity", capitalise: true, hint: "Main objects of the company" },
      { label: "Registered Office Address", key: "address", capitalise: true, hint: "Full address with pincode" },
      { label: "State", key: "state", options: [
        "Andhra Pradesh", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
        "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Odisha", "Punjab",
        "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Other",
      ]},
    ],
    docs: [
      { name: "PAN Card (All Directors)", hint: "Mandatory for DIN application" },
      { name: "Aadhaar Card (All Directors)", hint: "Mandatory for KYC" },
      { name: "Passport Size Photographs", hint: "All directors & subscribers" },
      { name: "Address Proof (Utility Bill / Rent Agreement)", hint: "For registered office" },
      { name: "NOC from Property Owner", hint: "Required if office is rented" },
      { name: "Email & Mobile of All Directors", hint: "For MCA correspondence" },
      { name: "Digital Signature Certificate (DSC)", hint: "For at least 1 director \u2014 we can arrange" },
    ],
    badges: [
      { icon: IndianRupee, text: "Govt fee: \u20B96,000-15,000 | All-in: \u20B97,000-30,000+", variant: "info" },
      { icon: Clock, text: "7-15 working days via SPICe+", variant: "info" },
      { icon: ShieldCheck, text: "PAN + TAN + GSTIN + EPFO + ESIC in 1 form", variant: "success" },
    ],
    infoText: "Registered via SPICe+ (Simplified Proforma for Incorporating Company Electronically). Minimum 2 directors & 2 shareholders required. No minimum authorized capital prescribed. At least 1 director must be an Indian resident (182+ days in India). DIN and DSC are mandatory.",
  },
  {
    key: "llp",
    title: "LLP Registration (Limited Liability Partnership)",
    subtitle: "Lower compliance burden with limited liability protection",
    icon: Users,
    color: "text-teal-600",
    fields: [
      { label: "Partner Name(s)", key: "name", required: true, capitalise: true, hint: "All partner names (comma-separated)" },
      { label: "Mobile Number", key: "mobile", required: true, hint: "10-digit Indian mobile number" },
      { label: "Proposed LLP Name", key: "llpName", required: true, hint: "Must end with 'LLP'", capitalise: true },
      { label: "Number of Partners (min 2)", key: "partnerCount" },
      { label: "Business Activity", key: "activity", capitalise: true, hint: "Main objects of the LLP" },
      { label: "Registered Office Address", key: "address", capitalise: true, hint: "Full address with pincode" },
    ],
    docs: [
      { name: "PAN + Aadhaar (All Partners)", hint: "For DPIN/DIN application" },
      { name: "Address Proof", hint: "Utility bill / rent agreement for registered office" },
      { name: "Passport Size Photographs", hint: "All designated partners" },
      { name: "Rent Agreement / Property Proof", hint: "For registered office premises" },
      { name: "Digital Signature Certificate (DSC)", hint: "Mandatory for all designated partners" },
      { name: "Email ID & Mobile (All Partners)", hint: "For MCA correspondence" },
    ],
    badges: [
      { icon: IndianRupee, text: "Govt fee: \u20B92,000-15,000 | All-in: \u20B94,000-20,000+", variant: "info" },
      { icon: Clock, text: "10-15 working days via FiLLiP", variant: "info" },
      { icon: ShieldCheck, text: "No minimum capital | Lower compliance than Pvt Ltd", variant: "success" },
    ],
    infoText: "Registered via FiLLiP (Flawless Incorporation of LLP). Minimum 2 partners required with no upper limit. At least 1 designated partner must be an Indian resident (182+ days). LLP Agreement must be filed within 30 days of incorporation. PAN & TAN auto-applied via FiLLiP.",
  },
  {
    key: "fpc",
    title: "Farmer Producer Company (FPC) Registration",
    subtitle: "Register under Companies Act Part IXA for agricultural enterprises",
    icon: Leaf,
    color: "text-green-600",
    fields: [
      { label: "Group / FPC Name", key: "name", required: true, capitalise: true },
      { label: "Mobile Number", key: "mobile", required: true, hint: "10-digit Indian mobile number" },
      { label: "Number of Farmer Members", key: "farmers", hint: "Minimum 10 individual farmers or 2 producer institutions" },
      {
        label: "Primary Activity",
        key: "activity",
        options: [
          "Crop Production",
          "Dairy & Dairy Products",
          "Poultry & Animal Husbandry",
          "Horticulture & Floriculture",
          "Procurement, Grading & Marketing",
          "Processing & Value Addition",
          "Other Agricultural Activity",
        ],
        required: true,
      },
      { label: "Area / District of Operation", key: "area", capitalise: true, hint: "Primary geographical area of operation" },
      { label: "Proposed Authorized Capital (\u20B9)", key: "capital", hint: "Minimum \u20B95,00,000 required" },
    ],
    docs: [
      { name: "Aadhaar + PAN (All Directors / Members)", hint: "Mandatory for all board members" },
      { name: "Farmer Proof (7/12 Extract / Land Record)", hint: "Proof of being a primary producer" },
      { name: "Passport Size Photographs", hint: "All directors" },
      { name: "Address Proof (Registered Office)", hint: "Utility bill / rent agreement" },
      { name: "MOA & AOA Draft", hint: "Memorandum and Articles of Association" },
      { name: "Bank Account Details", hint: "For the proposed FPC" },
      { name: "Digital Signature Certificate (DSC)", hint: "For at least 1 director" },
    ],
    badges: [
      { icon: Users, text: "Min 10 farmers or 2 producer institutions", variant: "info" },
      { icon: ShieldCheck, text: "Min 5 directors | Min capital: \u20B95 Lakh", variant: "success" },
      { icon: IndianRupee, text: "Tax benefits + Govt scheme access", variant: "gold" },
    ],
    infoText: "FPC is registered under Part IXA of the Companies Act, 2013. Minimum 10 individual farmers OR 2 producer institutions (or combination). Minimum 5 directors, all must be members. Minimum authorized capital: \u20B95,00,000. Members must be primary producers engaged in agricultural/allied activities.",
  },
  {
    key: "trust",
    title: "Trust Registration",
    subtitle: "Public Charitable & Private Trust registration with compliance support",
    icon: HandHelping,
    color: "text-rose-600",
    fields: [
      { label: "Trust Name", key: "name", required: true, capitalise: true },
      { label: "Mobile Number", key: "mobile", required: true, hint: "10-digit Indian mobile number" },
      {
        label: "Type of Trust",
        key: "trustType",
        options: ["Public Charitable Trust", "Private Trust"],
        required: true,
        hint: "Public Charitable: eligible for 12A & 80G exemption",
      },
      { label: "Number of Trustees (min 2)", key: "trustees" },
      { label: "Trust Objective / Purpose", key: "objective", capitalise: true, hint: "e.g. Education, Medical Relief, Poverty Alleviation" },
      { label: "Registered Office Address", key: "address", capitalise: true, hint: "Full address with pincode" },
    ],
    docs: [
      { name: "Aadhaar + PAN (All Trustees & Settlor)", hint: "Mandatory for all" },
      { name: "Passport Size Photographs", hint: "All trustees & settlor" },
      { name: "Address Proof (Registered Office)", hint: "Utility bill / property document" },
      { name: "Trust Deed Draft", hint: "On non-judicial stamp paper (state-specific value)" },
      { name: "NOC from Property Owner", hint: "If registered office is rented" },
      { name: "Identity Proof (Voter ID / Passport / DL)", hint: "Of all trustees" },
    ],
    badges: [
      { icon: IndianRupee, text: "Registration fee: \u20B9500-5,000 (varies by state)", variant: "info" },
      { icon: ShieldCheck, text: "Post-registration: 12A + 80G + ITR-7 filing", variant: "success" },
      { icon: Landmark, text: "Registered with Sub-Registrar of Assurances", variant: "info" },
    ],
    infoText: "Public Charitable Trusts are registered with the Sub-Registrar of Assurances under state-specific acts or the Indian Trusts Act, 1882. Minimum 2 trustees recommended (3 for charitable). 2 witnesses required at registration. Post-registration compliance includes 12A (tax exemption) and 80G (donor deduction) registration with the Income Tax department.",
  },
];
/* ─── Individual Service Form ─── */

const ServiceForm = ({ service, index }: { service: ServiceConfig; index: number }) => {
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  const u = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const handleDocChange = useCallback((docName: string) => (file: File | null) => {
    setUploadedDocs((p) => {
      const next = { ...p };
      if (file) next[docName] = true;
      else delete next[docName];
      return next;
    });
  }, []);

  /* Validation */
  const requiredFields = service.fields.filter((f) => f.required);
  const filledRequired = requiredFields.filter((f) => form[f.key]?.trim()).length;
  const totalDocs = service.docs.length;
  const uploadedCount = Object.keys(uploadedDocs).length;
  const progressPct = Math.round((filledRequired / requiredFields.length) * 100);

  const handleSubmit = async () => {
    const missing = requiredFields.filter((f) => !form[f.key]?.trim());
    if (missing.length > 0) {
      toast.error(`Please fill: ${missing.map((f) => f.label).join(", ")}`);
      return;
    }
    if (form.mobile && !/^[6-9]\d{9}$/.test(form.mobile)) {
      toast.error("Enter a valid 10-digit Indian mobile number");
      return;
    }

    setLoading(true);

    const details: Record<string, string> = {};
    service.fields
      .filter((f) => form[f.key]?.trim())
      .forEach((f) => { details[f.label] = form[f.key]; });
    details["Documents Uploaded"] = `${uploadedCount}/${totalDocs}`;
    details["Source"] = "Accounting Services Portal";

    try {
      await supabase.functions.invoke("send-enquiry-email", {
        body: {
          serviceName: `${service.title} - Enquiry`,
          customerName: form.name || "Customer",
          customerMobile: form.mobile,
          details: details,
          sendToBoth: true,
          priorityEmails: ["sandeepmahajan9@gmail.com", "info@mahajanfinance.com"],
        },
      });
      console.log(`${service.key} email+WhatsApp sent`);
    } catch (err) {
      console.error("Email/WhatsApp failed", err);
    }

    setLoading(false);
    setSubmitted(true);
  };

  const Icon = service.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04, duration: 0.4 }}
      className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow"
    >
      {/* ── Accordion Header ── */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start sm:items-center justify-between gap-4 p-5 sm:p-6 text-left hover:bg-muted/20 transition-colors rounded-2xl"
      >
        <div className="flex items-start gap-4 min-w-0">
          <div
            className={`shrink-0 w-11 h-11 rounded-xl bg-muted/70 flex items-center justify-center ${service.color}`}
          >
            <Icon size={22} />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold font-display text-foreground text-base sm:text-lg leading-tight">
              {service.title}
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2 hidden sm:block">
              {service.subtitle}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {service.badges.slice(0, 2).map((b, i) => (
                <Badge key={i} variant={b.variant}>
                  <b.icon size={11} />
                  {b.text.length > 40 ? b.text.slice(0, 38) + "..." : b.text}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="shrink-0 mt-1">
          {open ? <ChevronUp size={20} className="text-muted-foreground" /> : <ChevronDown size={20} className="text-muted-foreground" />}
        </div>
      </button>

      {/* ── Expandable Content ── */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 sm:px-6 pb-6 border-t border-border/60 pt-5">
              {submitted ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="relative overflow-hidden rounded-xl p-6 md:p-8 text-center"
                  style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)" }}>
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={40} className="text-white drop-shadow-lg" />
                  </div>
                  <h4 className="text-lg font-extrabold font-display text-white mb-2">{service.title} - Enquiry Sent!</h4>
                  <p className="text-xs text-white/90 mb-2 leading-relaxed">
                    Thank you, <strong className="text-white">{form.name || "Customer"}</strong>.
                    Our team will contact you shortly on <strong className="text-yellow-200">{form.mobile}</strong>.
                  </p>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[11px] font-bold mb-3">
                    <CheckCircle2 size={12} /> Confirmation sent via Email & WhatsApp
                  </div>
                  <div className="flex flex-col sm:flex-row justify-center gap-2 mt-3">
                    <a href="tel:+919730540215" className="px-4 py-2 rounded-full border-2 border-white/60 text-white text-xs font-bold hover:bg-white hover:text-emerald-700 transition-all">Call 9730540215</a>
                    <button onClick={() => { setSubmitted(false); setForm({}); }} className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-bold hover:bg-white/30 transition-all">New Enquiry</button>
                  </div>
                </motion.div>
              ) : (
              <div className="space-y-5">
              {/* Info Box */}
              {service.infoText && <InfoBox>{service.infoText}</InfoBox>}

              {/* Badges Row (full) */}
              <div className="flex flex-wrap gap-2">
                {service.badges.map((b, i) => (
                  <Badge key={i} variant={b.variant}>
                    <b.icon size={12} />
                    {b.text}
                  </Badge>
                ))}
              </div>

              {/* ── Form Fields ── */}
              <div>
                <SectionLabel icon={ClipboardList}>
                  Application Details
                </SectionLabel>
                <div className="grid sm:grid-cols-2 gap-x-4 gap-y-3">
                  {service.fields.map((f) => (
                    <InputField
                      key={f.key}
                      label={f.label}
                      required={f.required}
                      hint={f.hint}
                    >
                      {f.options ? (
                        <select
                          value={form[f.key] || ""}
                          onChange={(e) => u(f.key, e.target.value)}
                          className={`${inputClass} cursor-pointer`}
                        >
                          <option value="">Select {f.label}</option>
                          {f.options.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      ) : f.type === "date" ? (
                        <input
                          type="date"
                          value={form[f.key] || ""}
                          onChange={(e) => u(f.key, e.target.value)}
                          className={inputClass}
                        />
                      ) : f.type === "email" ? (
                        <input
                          type="email"
                          value={form[f.key] || ""}
                          onChange={(e) => u(f.key, e.target.value.toLowerCase())}
                          placeholder="email@example.com"
                          className={inputClass}
                        />
                      ) : f.key === "mobile" ? (
                        <input
                          type="tel"
                          value={form[f.key] || ""}
                          onChange={(e) =>
                            u(f.key, e.target.value.replace(/\D/g, "").slice(0, 10))
                          }
                          placeholder="10-digit mobile number"
                          className={`${inputClass} tabular-nums`}
                        />
                      ) : f.key === "pan" ? (
                        <input
                          type="text"
                          value={form[f.key] || ""}
                          onChange={(e) => u(f.key, e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))}
                          placeholder="ABCDE1234F"
                          className={`${inputClass} uppercase tracking-wider font-mono text-sm`}
                        />
                      ) : (
                        <input
                          type="text"
                          value={form[f.key] || ""}
                          onChange={(e) =>
                            u(f.key, f.capitalise ? autoCapital(e.target.value) : e.target.value)
                          }
                          placeholder={f.label}
                          className={inputClass}
                        />
                      )}
                    </InputField>
                  ))}
                </div>
              </div>

              {/* ── Document Uploads ── */}
              <div>
                <SectionLabel icon={FileText}>
                  Documents Required
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    (Accepted: JPG, PNG, PDF — max {MAX_FILE_MB} MB each)
                  </span>
                </SectionLabel>
                <div className="bg-muted/30 rounded-xl border border-border/40 overflow-hidden">
                  <ul>
                    {service.docs.map((d) => (
                      <DocumentUploadItem key={d.name} doc={d.name} docHint={d.hint} onFileChange={handleDocChange(d.name)} />
                    ))}
                  </ul>
                </div>
              </div>

              {/* ── Submit Bar ── */}
              <div className="space-y-3 pt-1">
                {/* Progress */}
                {requiredFields.length > 0 && (
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>
                    <span className="shrink-0 font-medium tabular-nums">
                      {filledRequired}/{requiredFields.length} required fields
                    </span>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="btn-accent w-full flex items-center justify-center gap-2.5 !py-3.5 rounded-xl font-bold text-sm hover:scale-[1.01] active:scale-[0.99] transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Submitting Enquiry...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Submit Enquiry via WhatsApp
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-muted-foreground">
                  Your details will be sent securely to our team for a callback.
                </p>
              </div>
              </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ─── Main Page Component ─── */

const AccountingServices = () => (
  <>
    {/* Hero */}
    <section className="relative bg-primary overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/90" />
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />
      <div className="relative container py-14 sm:py-16 text-center">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground/80 text-xs font-semibold mb-5">
            <Sparkles size={13} />
            Trusted by Businesses Across India
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary-foreground font-display tracking-tight leading-tight">
            Accounting & Registration
            <br className="hidden sm:block" />
            {" "}Services
          </h1>
          <p className="mt-4 text-primary-foreground/70 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            ITR Filing, GST Returns, Company & LLP Registration, Project Reports, and more — all handled by experienced professionals with latest compliance updates.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            {[
              "ITR Filing",
              "GST Returns",
              "Company Registration",
              "LLP Registration",
              "FPC Registration",
              "Trust Registration",
              "Project Reports",
            ].map((s) => (
              <span
                key={s}
                className="px-3 py-1 rounded-full bg-primary-foreground/10 text-primary-foreground/80 text-xs font-medium"
              >
                {s}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>

    {/* Services List - 2 Column Grid */}
    <section className="py-10 sm:py-14 bg-slate-50">
      <div className="container max-w-6xl">
        {/* Added items-start so cards don't stretch vertically when one expands */}
        <div className="grid md:grid-cols-2 gap-6 items-start">
          {accountingServices.map((s, i) => (
            <ServiceForm key={s.key} service={s} index={i} />
          ))}
        </div>
      </div>
    </section>

    {/* Footer Disclaimer */}
    <section className="py-6 bg-muted/30 border-t border-border/40">
      <div className="container max-w-6xl text-center">
        <p className="text-xs text-muted-foreground leading-relaxed">
          All information is based on official government sources (incometax.gov.in, gst.gov.in, mca.gov.in) as of June 2025.
          Tax laws and regulations are subject to change. Fees shown are indicative and may vary by state and service provider.
          Always verify with official portals before filing.
        </p>
      </div>
    </section>
  </>
);

export default AccountingServices;