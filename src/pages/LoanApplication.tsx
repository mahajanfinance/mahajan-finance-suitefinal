import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Send,
  Calculator,
  Search,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Upload,
  Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  sortedCompanies as companies,
  categoryLabels,
  type CompanyCategory,
} from "@/data/companies";
import { banks, bankCategoryLabels } from "@/data/banks";
import {
  calculateEligibility,
  generateRepaymentSchedule,
  type EligibilityResult,
} from "@/data/eligibilityMatrix";
import { supabase } from "@/integrations/supabase/client";
import { downloadEmiPdf } from "@/lib/emiPdf";
import {
  generateLoanApplicationPdf,
  generateLoanApplicationPdfBase64,
  generateRefId,
  type LoanApplicationData,
} from "@/lib/loanApplicationPdf";
import RazorpayButton from "@/components/RazorpayButton";
import BankLoanOffers from "@/components/BankLoanOffers";

/* ═══════════════════════════════════════════════════════
   LOAN TYPES
   ═══════════════════════════════════════════════════════ */
const loanTypes = [
  { key: "personal", label: "Personal Loan", icon: "💼", hasBankOffers: true },
  { key: "home", label: "Home Loan", icon: "🏠", hasBankOffers: true },
  { key: "lap", label: "Loan Against Property", icon: "🏦", hasBankOffers: true },
  { key: "vehicle", label: "Vehicle Loan", icon: "🚗", hasBankOffers: true },
  { key: "business", label: "Business Loan", icon: "💰", hasBankOffers: true },
  { key: "gold", label: "Gold Loan", icon: "🪙", hasBankOffers: true },
  { key: "education", label: "Education Loan", icon: "🎓", hasBankOffers: true },
  { key: "agri", label: "Agri / Tractor", icon: "🚜", hasBankOffers: true },
  { key: "commercial", label: "Commercial Vehicle", icon: "🚛", hasBankOffers: true },
  { key: "construction", label: "Construction Equip.", icon: "🏗️", hasBankOffers: true },
  { key: "shg", label: "SHG Loan", icon: "👥", hasBankOffers: false },
  { key: "nri", label: "NRI Loan", icon: "🌍", hasBankOffers: true },
];

const eligibilityLoanTypes = ["personal", "home", "lap", "vehicle", "business"];
const cibilEligibleTypes = ["personal", "home", "vehicle", "nri"];

/* ═══════════════════════════════════════════════════════
   LOAN PURPOSES
   ═══════════════════════════════════════════════════════ */
const loanPurposes: Record<string, string[]> = {
  personal: ["Marriage / Wedding", "Medical Emergency", "Home Renovation / Repair", "Education / Fees", "Travel / Vacation", "Debt Consolidation", "Family Function / Ceremony", "Festival / Religious", "Personal Use", "Credit Card Payoff", "Other"],
  home: ["Purchase New Home", "Home Construction", "Home Renovation / Repair", "Home Extension / Addition", "Plot Purchase", "Balance Transfer", "NRI Home Purchase", "Other"],
  lap: ["Business Expansion", "Working Capital", "Personal Use", "Debt Consolidation", "Medical Emergency", "Education / Fees", "Property Purchase", "Other"],
  vehicle: ["New Car Purchase", "Used Car Purchase", "Two Wheeler Purchase", "Balance Transfer", "Other"],
  business: ["Business Expansion", "Working Capital", "Machinery Purchase", "Shop Setup / Renovation", "Stock / Inventory Purchase", "Infrastructure Development", "Franchise Purchase", "Debt Consolidation", "Other"],
  gold: ["Agricultural Purpose", "Business Purpose", "Personal Use", "Medical Emergency", "Education / Fees", "Marriage / Wedding", "Other"],
  education: ["Higher Studies – India", "Higher Studies – Abroad", "Skill Development / Certification", "Coaching Classes", "Executive Education", "Other"],
  agri: ["Tractor Purchase", "Equipment Purchase", "Land Development", "Irrigation Setup", "Seeds & Fertilizers", "Dairy / Poultry Setup", "Other"],
  commercial: ["New Truck Purchase", "Used Truck Purchase", "Bus Purchase", "Tempo / Mini Truck", "Other"],
  construction: ["JCB / Excavator Purchase", "Crane Purchase", "Other Equipment", "Other"],
  shg: ["Group Business", "Income Generation Activity", "Agricultural Activity", "Other"],
  nri: ["Home Purchase (India)", "Home Construction (India)", "Property Investment", "Balance Transfer", "Other"],
};

/* ═══════════════════════════════════════════════════════
   QUALIFICATIONS
   ═══════════════════════════════════════════════════════ */
const qualifications = [
  "Below 10th", "10th Pass (SSC)", "12th Pass (HSC)", "ITI / Diploma",
  "Graduate (BA / BSc / BCom)", "Post Graduate (MA / MSc / MCom)",
  "Engineering (BE / BTech / MTech)", "Medical (MBBS / BDS / MD)",
  "Professional (CA / CS / ICWA)", "Law (LLB / LLM)", "MBA / PGDM", "Other"
];

/* ═══════════════════════════════════════════════════════
   SPECIAL FORM FIELDS
   ═══════════════════════════════════════════════════════ */
const specialFormFields: Record<string, { label: string; placeholder: string; key: string; required?: boolean }[]> = {
  gold: [
    { label: "Gold Weight (grams)", placeholder: "e.g. 50 grams", key: "goldWeight", required: true },
    { label: "Gold Type", placeholder: "e.g. 22K / 24K", key: "goldType", required: true }
  ],
  education: [
    { label: "Student Name", placeholder: "STUDENT FULL NAME", key: "studentName", required: true },
    { label: "Course", placeholder: "e.g. B.Tech, MBA", key: "course", required: true },
    { label: "College Name", placeholder: "COLLEGE NAME", key: "college", required: true },
    { label: "Study Location", placeholder: "e.g. Pune, Abroad", key: "studyLocation" }
  ],
  agri: [
    { label: "Village / City", placeholder: "VILLAGE NAME", key: "village" },
    { label: "Land Area (acres)", placeholder: "e.g. 5 acres", key: "landArea" },
    { label: "Purpose", placeholder: "e.g. Tractor Purchase", key: "purpose", required: true }
  ],
  commercial: [
    { label: "Vehicle Type", placeholder: "e.g. Truck, Bus", key: "vehicleType", required: true },
    { label: "New / Used", placeholder: "New or Used", key: "condition", required: true }
  ],
  construction: [
    { label: "Equipment Type", placeholder: "e.g. JCB, Crane", key: "equipmentType", required: true },
    { label: "New / Used", placeholder: "New or Used", key: "condition", required: true }
  ],
  shg: [
    { label: "Group Name", placeholder: "SHG GROUP NAME", key: "groupName", required: true },
    { label: "Contact Person", placeholder: "CONTACT PERSON NAME", key: "contactPerson", required: true },
    { label: "Number of Members", placeholder: "e.g. 10", key: "members", required: true }
  ]
};

/* ═══════════════════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════════════════ */
const formatINR = (n: number) => "₹" + n.toLocaleString("en-IN");

const InputField = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div>
    <label className="block text-sm font-semibold text-foreground mb-1.5">
      {label} {required && <span className="text-destructive">*</span>}
    </label>
    {children}
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="p-4 bg-muted/50 rounded-lg border border-golden/20 space-y-3">
    <h4 className="font-bold text-sm text-golden">{title}</h4>
    {children}
  </div>
);

const inputClass = "w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

/* ═══════════════════════════════════════════════════════
   REQUIRED DOCUMENTS (kept for DetailedLoanForm only)
   ═══════════════════════════════════════════════════════ */
const requiredDocs: Record<string, { title: string; docs: string[] }> = {
  personal: {
    title: "📑 Required Documents for Personal Loan",
    docs: ["Photo", "PAN Card", "Aadhaar Card", "Company ID Card", "Current Address Proof", "Latest 3 months Salary Slips", "Latest 3 months Banking & Loan details"]
  },
  business: {
    title: "📑 Required Documents for Business Loan",
    docs: ["Photo", "PAN Card", "Aadhaar Card", "Electricity Bill", "Spouse Photo, PAN & Aadhaar", "Business Photo", "Udyam / Shop Act / Food License", "Latest 3 years ITR with CA Stamp & Sign", "Latest 1 Year Bank Statement", "Current Loan Statements"]
  },
  home: {
    title: "📑 Required Documents for Home Loan / Mortgage",
    docs: ["Photo", "PAN Card", "Aadhaar Card", "Electricity Bill", "Spouse Photo, PAN & Aadhaar", "Udyam / Shop Act OR Salary Slips", "Latest 3 years ITR (Businessman / Self Employed)", "Latest 1 Year Bank Statement", "Current Loan Statements"]
  },
  lap: {
    title: "📑 Required Documents for LAP",
    docs: ["Photo", "PAN Card", "Aadhaar Card", "Electricity Bill", "Spouse Photo, PAN & Aadhaar", "Property Documents (7/12, Index II)", "Udyam / Shop Act OR Salary Slips", "Latest 3 years ITR (Businessman / Self Employed)", "Latest 1 Year Bank Statement", "Current Loan Statements"]
  },
  vehicle: {
    title: "📑 Required Documents for Vehicle Loan",
    docs: ["Photo", "PAN Card", "Aadhaar Card", "Latest 3 months Salary Slips OR ITR", "Latest 6 months Bank Statement", "Quotation / Proforma Invoice", "Current Loan Statements (if any)"]
  },
  gold: {
    title: "📑 Required Documents for Gold Loan",
    docs: ["Photo", "PAN Card", "Aadhaar Card", "Gold Ornaments for Evaluation"]
  },
  education: {
    title: "📑 Required Documents for Education Loan",
    docs: ["Student Photo", "PAN Card", "Aadhaar Card", "Mark Sheets", "Admission Letter", "Fee Structure", "Co-applicant (Parent) Documents"]
  },
  agri: {
    title: "📑 Required Documents for Agri / Tractor Loan",
    docs: ["Photo", "PAN Card", "Aadhaar Card", "7/12 Extract", "8A Extract", "Bank Passbook", "Quotation of Equipment / Tractor"]
  },
  commercial: {
    title: "📑 Required Documents for Commercial Vehicle",
    docs: ["Photo", "PAN Card", "Aadhaar Card", "Driving License", "Vehicle Quotation", "Bank Statement (6 months)", "ITR (if available)"]
  },
  construction: {
    title: "📑 Required Documents for Construction Equipment",
    docs: ["Photo", "PAN Card", "Aadhaar Card", "Equipment Quotation", "Bank Statement (6 months)", "ITR / Business Proof"]
  },
  shg: {
    title: "📑 Required Documents for SHG Loan",
    docs: ["Group Registration Certificate", "Resolution Letter", "Bank Account Details", "Member Aadhaar Cards", "Meeting Minutes"]
  },
  nri: {
    title: "📑 Required Documents for NRI Loan",
    docs: ["Passport", "Visa Copy", "PAN Card", "Aadhaar Card", "Income Proof (Abroad)", "Bank Statements (India & Abroad)", "Power of Attorney (if applicable)"]
  },
};

/* Helper to read file as base64 */
function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] || "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ✅ Document Upload Section Component */
const DocumentUploadSection = ({ loanType, uploadedDocs, onDocUpload }: { loanType: string; uploadedDocs: Record<string, File>; onDocUpload: (docName: string, file: File | null) => void }) => {
  const rd = requiredDocs[loanType];
  if (!rd) return null;
  return (
    <div className="p-4 bg-muted/50 rounded-lg border border-golden/20">
      <h4 className="font-bold text-foreground mb-3 text-center">{rd.title}</h4>
      <ul className="space-y-0">
        {rd.docs.map((doc) => {
          const uploadedFile = uploadedDocs[doc];
          return (
            <li key={doc} className="flex items-center justify-between gap-2 text-sm text-foreground py-1.5 border-b border-border/30 last:border-0">
              <span className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✍</span>
                {doc}
                {uploadedFile && <span className="text-xs text-success font-medium ml-2">✅ {uploadedFile.name}</span>}
              </span>
              <label className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-golden/40 text-xs font-semibold text-golden cursor-pointer hover:bg-golden/10 transition-colors">
                <Upload size={14} /> {uploadedFile ? "Change" : "Upload"}
                <input type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={(e) => onDocUpload(doc, e.target.files?.[0] || null)} />
              </label>
            </li>
          );
        })}
      </ul>
      {Object.keys(uploadedDocs).length > 0 && (
        <p className="text-xs text-success font-medium mt-2 text-center">
          ✅ {Object.keys(uploadedDocs).length} document(s) uploaded — will be sent with your application
        </p>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   DETAILED LOAN FORM - ALL FIELDS MANDATORY, AUTO BANK FILL
   ═══════════════════════════════════════════════════════ */
const DetailedLoanForm = ({
  loanType,
  onClose,
  loanLabel,
  initialData,
  selectedBanks,
}: {
  loanType: string;
  onClose: () => void;
  loanLabel: string;
  initialData?: Record<string, string>;
  selectedBanks?: string[];
}) => {
  const isBusinessLoan = loanType === "business";
  const isHomeLoan = loanType === "home" || loanType === "lap";
  const isNRI = loanType === "nri";
  const isEducation = loanType === "education";

  const [form, setForm] = useState<Record<string, string>>(initialData || {});
  const [loading, setLoading] = useState(false);
  const [employmentType, setEmploymentType] = useState("");
  const [paymentReady, setPaymentReady] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sameAsCurrent, setSameAsCurrent] = useState(false);

  // ✅ Document upload tracking for email attachments
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, File>>({});

  const handleDocUpload = (docName: string, file: File | null) => {
    if (file) {
      setUploadedDocs(prev => ({ ...prev, [docName]: file }));
    } else {
      setUploadedDocs(prev => {
        const next = { ...prev };
        delete next[docName];
        return next;
      });
    }
  };

  // ✅ CHANGE #5: Auto-fill banking details from selected bank
  useEffect(() => {
    if (selectedBanks && selectedBanks.length > 0) {
      const bankName = selectedBanks[0];
      setForm(prev => ({
        ...prev,
        bankName: bankName,
      }));
    }
  }, [selectedBanks]);

  const u = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));
  const cap = (v: string) => v.toUpperCase();

  // ✅ CHANGE #4: Copy current address to permanent address
  const handleSameAddress = (checked: boolean) => {
    setSameAsCurrent(checked);
    if (checked) {
      u("permanentAddress", form.currentAddress || "");
    } else {
      u("permanentAddress", "");
    }
  };

  // ✅ CHANGE #3: ALL fields mandatory validation
  const validate = () => {
    const requiredFields: Record<string, string> = {
      "Full Name": form.fullName,
      "Father's Name": form.fatherName,
      "PAN Card": form.pancard,
      "Aadhaar Card": form.aadhaar,
      "Date of Birth": form.dob,
      "Mobile Number": form.mobile,
      "Email": form.email,
      "Religion": form.religion,
      "Marital Status": form.maritalStatus,
      "Caste": form.caste,
      "Dependents": form.dependents,
      "Current Address": form.currentAddress,
      "Address Type (Owned/Rented)": form.addressType,
      "Residing Since": form.residingSince,
      "Permanent Address": form.permanentAddress,
      "Bank Name": form.bankName,
      "Branch": form.branch,
      "Account Type": form.accountType,
      "IFSC Code": form.ifsc,
      "Account Number": form.accountNo,
      "Active Credit Cards": form.activeCards,
      "Active Loans": form.activeLoans,
      "Loan Amount": form.loanAmount,
      "Purpose of Loan": form.purpose,
      "Relative Name": form.relativeName,
      "Relative Mobile": form.relativeMobile,
      "Relative Address": form.relativeAddress,
      "Friend Name": form.friendName,
      "Friend Mobile": form.friendMobile,
      "Friend Address": form.friendAddress,
    };

    // Add employment/business specific required fields
    if (!isBusinessLoan && !isNRI) {
      requiredFields["Company Name"] = form.companyName;
      requiredFields["Designation"] = form.designation;
      requiredFields["Net Monthly Income"] = form.netIncome;
      requiredFields["Qualification"] = form.qualification;
    }
    if (isBusinessLoan) {
      requiredFields["Business Name"] = form.businessName;
      requiredFields["Business Type"] = form.businessType;
      requiredFields["Net Monthly Income"] = form.netIncome;
      requiredFields["Designation"] = form.bizDesignation;
    }
    if (isHomeLoan) {
      requiredFields["Employment Type"] = employmentType;
    }
    if (isNRI) {
      requiredFields["Country"] = form.country;
      requiredFields["City in India"] = form.indiaCity;
    }
    if (form.maritalStatus === "Married") {
      requiredFields["Spouse Name"] = form.spouseName;
    }

    const missing: string[] = [];
    for (const [label, value] of Object.entries(requiredFields)) {
      if (!value || !value.trim()) {
        missing.push(label);
      }
    }

    if (missing.length > 0) {
      toast.error(`Please fill all required fields:\n${missing.slice(0, 5).join(", ")}${missing.length > 5 ? `... and ${missing.length - 5} more` : ""}`);
      return false;
    }

    // Validate mobile
    if (!/^[6-9]\d{9}$/.test(form.mobile)) {
      toast.error("Enter valid 10-digit mobile number");
      return false;
    }

    // Validate PAN
    if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(form.pancard?.toUpperCase() || "")) {
      toast.error("Enter valid PAN Card number (e.g. ABCDE1234F)");
      return false;
    }

    // Validate Aadhaar
    if (form.aadhaar && form.aadhaar.length !== 12) {
      toast.error("Aadhaar must be exactly 12 digits");
      return false;
    }

    return true;
  };

  const proceedToPayment = () => {
    if (!validate()) return;
    setPaymentReady(true);
    setTimeout(() => document.getElementById("loan-payment-section")?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
  };

  /* ✅ FINALIZE: PDF, EMAIL TO CORRECT ADDRESSES, WHATSAPP */
  const finalizeAfterPayment = async (paymentId: string) => {
    setLoading(true);
    const refId = generateRefId();

    /* Build PDF data */
    const pdfData: LoanApplicationData = {
      applicantName: form.fullName || "",
      fatherName: form.fatherName || "",
      motherName: form.motherName || "",
      dob: form.dob || "",
      mobile: form.mobile || "",
      email: form.email || "",
      pancard: form.pancard || "",
      aadhaar: form.aadhaar || "",
      maritalStatus: form.maritalStatus || "",
      religion: form.religion || "",
      caste: form.caste || "",
      spouseName: form.spouseName || "",
      spouseDob: form.spouseDob || "",
      dependents: form.dependents || "",
      city: form.currentAddress || "",
      loanType: loanLabel,
      loanAmount: form.loanAmount || "",
      purpose: form.purpose || "",
      netMonthlyIncome: form.netIncome || "",
      grossMonthlyIncome: form.netIncome || "",
      existingEMI: form.existingEMI || "0",
      preferredBank: selectedBanks?.join(", ") || form.bankName || "",
      companyName: loanType === "business" ? form.businessName || "" : form.companyName || "",
      designation: form.designation || form.bizDesignation || "",
      companyAddress: form.companyAddress || form.businessAddress || "",
      officeEmail: form.officeEmail || "",
      qualification: form.qualification || "",
      currentCompanyExp: form.currentExp || "",
      totalExperience: form.totalExp || "",
      currentAddress: form.currentAddress || "",
      permanentAddress: form.permanentAddress || "",
      stayingSince: form.residingSince || "",
      houseStatus: form.addressType || "",
      yearsInCity: form.yearsInCity || "",
      bankName: form.bankName || "",
      accountNo: form.accountNo || "",
      accountType: form.accountType || "",
      ifscCode: form.ifsc || "",
      branch: form.branch || "",
      activeCreditCards: form.activeCards || "0",
      activeLoans: form.activeLoans || "0",
      reference1Name: form.relativeName || "",
      reference1Relationship: "Relative",
      reference1Mobile: form.relativeMobile || "",
      reference1Address: form.relativeAddress || "",
      reference2Name: form.friendName || "",
      reference2Relationship: "Friend",
      reference2Mobile: form.friendMobile || "",
      reference2Address: form.friendAddress || "",
      paymentId,
      processingFee: "Rs.499",
      referenceId: refId,
    };

    /* Generate & download PDF */
    let pdfBase64 = "";
    try {
      pdfBase64 = generateLoanApplicationPdfBase64(pdfData);
      toast.success("Application PDF generated!");
    } catch (err) {
      console.error("PDF generation failed", err);
      toast.error("PDF generation failed");
    }

    /* === FINALIZE V3-STORAGE === */
    const documentUrls: { filename: string; url: string }[] = [];
    const storageFolder = refId + "_" + Date.now();
    console.log("=== FINALIZE V3-STORAGE ===", "folder:", storageFolder);

    /* Upload PDF to Supabase Storage */
    if (pdfBase64) {
      try {
        const pdfFileName = "LoanApplication_" + refId + ".pdf";
        const pdfBytes = Uint8Array.from(atob(pdfBase64), (c) => c.charCodeAt(0));
        const pdfPath = storageFolder + "/" + pdfFileName;
        await supabase.storage.from("loan-documents").upload(pdfPath, pdfBytes, { contentType: "application/pdf", upsert: true });
        const { data: urlData } = supabase.storage.from("loan-documents").getPublicUrl(pdfPath);
        documentUrls.push({ filename: pdfFileName, url: urlData.publicUrl });
        console.log("PDF uploaded:", urlData.publicUrl);
        toast.success("Application PDF generated!");
      } catch (e) { console.error("PDF upload failed", e); }
    }

    /* Upload user documents to Supabase Storage */
    for (const [docName, file] of Object.entries(uploadedDocs)) {
      try {
        const safeName = docName.replace(/[^a-zA-Z0-9]/g, "_") + "_" + file.name;
        const filePath = storageFolder + "/" + safeName;
        await supabase.storage.from("loan-documents").upload(filePath, file, { upsert: true });
        const { data: urlData } = supabase.storage.from("loan-documents").getPublicUrl(filePath);
        documentUrls.push({ filename: safeName, url: urlData.publicUrl });
        console.log("Doc uploaded:", safeName);
      } catch (e) { console.error("Upload failed for", docName, e); }
    }
    console.log("TOTAL documentUrls:", documentUrls.length);
    if (documentUrls.length > 0) { toast.success(documentUrls.length + " document(s) uploaded!"); }

    /* SEND EMAIL + WHATSAPP via edge function (handles WhatsApp automatically) */
    try {
      await supabase.functions.invoke("send-enquiry-email", {
        body: {
          serviceName: loanLabel + " \u2013 Detailed Application (PAID Rs.499)",
          customerName: form.fullName,
          customerMobile: form.mobile,
          customerEmail: form.email,
          details: {
            ...form,
            "Loan Type": loanLabel,
            "Reference ID": refId,
            "Selected Banks": selectedBanks?.join(", ") || "None specified",
            "Payment ID": paymentId,
            "Documents Attached": documentUrls.map(d => d.filename).join(", ") || "None"
          },
          paymentInfo: "Razorpay Payment ID: " + paymentId + " | Amount: Rs.499 | Ref: " + refId,
          storageFolder: storageFolder,
          documentUrls: documentUrls,
        },
      });
      console.log("Invoking edge function with", documentUrls.length, "documentUrls");
      toast.success("Emails sent with " + documentUrls.length + " downloadable links!");
    } catch (e) {
      console.error("Email failed", e);
      toast.error("Email delivery failed.");
    }

    setSubmitted(true);
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Personal Details */}
      <Section title="👤 Personal Details / वैयक्तिक माहिती">
        <div className="grid md:grid-cols-2 gap-3">
          <InputField label="Applicant Full Name (As Per PAN)" required>
            <input value={form.fullName || ""} onChange={(e) => u("fullName", cap(e.target.value))} placeholder="FULL NAME" className={inputClass} maxLength={100} />
          </InputField>
          <InputField label="Father's Full Name" required>
            <input value={form.fatherName || ""} onChange={(e) => u("fatherName", cap(e.target.value))} placeholder="FATHER'S NAME" className={inputClass} maxLength={100} />
          </InputField>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <InputField label="Mother's Name" required>
            <input value={form.motherName || ""} onChange={(e) => u("motherName", cap(e.target.value))} placeholder="MOTHER'S NAME" className={inputClass} maxLength={100} />
          </InputField>
          <InputField label="PAN Card No." required>
            <input value={form.pancard || ""} onChange={(e) => u("pancard", cap(e.target.value.slice(0, 10)))} placeholder="ABCDE1234F" className={inputClass} maxLength={10} />
          </InputField>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <InputField label="Aadhaar Card No." required>
            <input value={form.aadhaar || ""} onChange={(e) => u("aadhaar", e.target.value.replace(/\D/g, "").slice(0, 12))} placeholder="12-digit Aadhaar" className={`${inputClass} tabular-nums`} maxLength={12} />
          </InputField>
          <InputField label="Date Of Birth" required>
            <input type="date" value={form.dob || ""} onChange={(e) => u("dob", e.target.value)} className={inputClass} />
          </InputField>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <InputField label="Mobile No." required>
            <input value={form.mobile || ""} onChange={(e) => u("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit mobile" className={`${inputClass} tabular-nums`} />
          </InputField>
          <InputField label="Personal Mail ID" required>
            <input type="email" value={form.email || ""} onChange={(e) => u("email", e.target.value)} placeholder="email@example.com" className={inputClass} />
          </InputField>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <InputField label="Religion" required>
            <select value={form.religion || ""} onChange={(e) => u("religion", e.target.value)} className={inputClass}>
              <option value="">Select</option>
              {["Hindu", "Muslim", "Christian", "Buddhist", "Sikh", "Jain", "Other"].map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </InputField>
          <InputField label="Caste" required>
            <input value={form.caste || ""} onChange={(e) => u("caste", cap(e.target.value))} placeholder="CASTE" className={inputClass} />
          </InputField>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <InputField label="Marital Status" required>
            <select value={form.maritalStatus || ""} onChange={(e) => u("maritalStatus", e.target.value)} className={inputClass}>
              <option value="">Select</option>
              {["Single", "Married", "Divorced", "Widowed"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </InputField>
          <InputField label="No. Of Dependents" required>
            <input type="number" value={form.dependents || ""} onChange={(e) => u("dependents", e.target.value)} placeholder="0" className={`${inputClass} tabular-nums`} min={0} />
          </InputField>
        </div>
        {form.maritalStatus === "Married" && (
          <div className="grid md:grid-cols-2 gap-3">
            <InputField label="Spouse Name" required><input value={form.spouseName || ""} onChange={(e) => u("spouseName", cap(e.target.value))} placeholder="SPOUSE NAME" className={inputClass} /></InputField>
            <InputField label="Spouse Date of Birth"><input type="date" value={form.spouseDob || ""} onChange={(e) => u("spouseDob", e.target.value)} className={inputClass} /></InputField>
          </div>
        )}
      </Section>

      {/* Loan Details */}
      <Section title="💰 Loan Details / कर्ज तपशील">
        <div className="grid md:grid-cols-2 gap-3">
          <InputField label="Loan Amount Required" required>
            <input type="number" value={form.loanAmount || ""} onChange={(e) => u("loanAmount", e.target.value)} placeholder="Rs. Amount" className={`${inputClass} tabular-nums`} min={0} />
          </InputField>
          <InputField label="Tenure (Years)" required>
            <input type="number" value={form.tenure || ""} onChange={(e) => u("tenure", e.target.value)} placeholder="Years" className={`${inputClass} tabular-nums`} min={1} max={30} />
          </InputField>
        </div>
        <InputField label="Purpose of Loan" required>
          <select value={form.purpose || ""} onChange={(e) => u("purpose", e.target.value)} className={inputClass}>
            <option value="">-- Select Purpose --</option>
            {(loanPurposes[loanType] || loanPurposes.personal).map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </InputField>
      </Section>

      {/* Employment Type for Home Loan */}
      {isHomeLoan && (
        <Section title="👷 Employment Type">
          <div className="flex flex-wrap gap-2">
            {["Salaried", "Self Employed", "Businessman"].map((t) => (
              <button key={t} onClick={() => setEmploymentType(t)} className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition-all ${employmentType === t ? "bg-accent text-accent-foreground border-golden" : "border-border hover:border-golden"}`}>{t}</button>
            ))}
          </div>
        </Section>
      )}

      {/* NRI Fields */}
      {isNRI && (
        <Section title="🌍 NRI Details">
          <div className="grid md:grid-cols-2 gap-3">
            <InputField label="Country of Residence" required><input value={form.country || ""} onChange={(e) => u("country", cap(e.target.value))} placeholder="COUNTRY" className={inputClass} /></InputField>
            <InputField label="City in India" required><input value={form.indiaCity || ""} onChange={(e) => u("indiaCity", cap(e.target.value))} placeholder="CITY IN INDIA" className={inputClass} /></InputField>
          </div>
          <InputField label="Monthly Income (Foreign Currency)"><input value={form.foreignIncome || ""} onChange={(e) => u("foreignIncome", e.target.value)} placeholder="e.g. $5000" className={inputClass} /></InputField>
        </Section>
      )}

      {/* Employment Details */}
      {(!isBusinessLoan && (!isHomeLoan || employmentType === "Salaried")) && !isNRI && (
        <Section title="🏢 Employment Details / रोजगार तपशील">
          <div className="grid md:grid-cols-2 gap-3">
            <InputField label="Company Name" required><input value={form.companyName || ""} onChange={(e) => u("companyName", cap(e.target.value))} placeholder="COMPANY NAME" className={inputClass} /></InputField>
            <InputField label="Company Address" required><input value={form.companyAddress || ""} onChange={(e) => u("companyAddress", cap(e.target.value))} placeholder="COMPANY ADDRESS" className={inputClass} /></InputField>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <InputField label="Designation" required><input value={form.designation || ""} onChange={(e) => u("designation", cap(e.target.value))} placeholder="DESIGNATION" className={inputClass} /></InputField>
            <InputField label="Office Email ID" required><input type="email" value={form.officeEmail || ""} onChange={(e) => u("officeEmail", e.target.value)} placeholder="office@company.com" className={inputClass} /></InputField>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <InputField label="Qualification" required>
              <select value={form.qualification || ""} onChange={(e) => u("qualification", e.target.value)} className={inputClass}>
                <option value="">-- Select Qualification --</option>
                {qualifications.map((q) => <option key={q} value={q}>{q}</option>)}
              </select>
            </InputField>
            <InputField label="Office No."><input value={form.officeNo || ""} inputMode="numeric" onChange={(e) => u("officeNo", e.target.value.replace(/[^0-9]/g, ""))} placeholder="Office phone number" className={inputClass} /></InputField>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <InputField label="Current Company Experience"><input value={form.currentExp || ""} onChange={(e) => u("currentExp", e.target.value)} placeholder="e.g. 3 Years" className={inputClass} /></InputField>
            <InputField label="Total Experience"><input value={form.totalExp || ""} onChange={(e) => u("totalExp", e.target.value)} placeholder="e.g. 8 Years" className={inputClass} /></InputField>
          </div>
          <InputField label="Net Monthly Income" required><input type="number" value={form.netIncome || ""} onChange={(e) => u("netIncome", e.target.value)} placeholder="Rs. Monthly income" className={`${inputClass} tabular-nums`} min={0} /></InputField>
        </Section>
      )}

      {/* Business Details */}
      {(isBusinessLoan || (isHomeLoan && (employmentType === "Self Employed" || employmentType === "Businessman"))) && (
        <Section title="💼 Business Details / व्यवसाय तपशील">
          <div className="grid md:grid-cols-2 gap-3">
            <InputField label="Business Name" required><input value={form.businessName || ""} onChange={(e) => u("businessName", cap(e.target.value))} placeholder="BUSINESS NAME" className={inputClass} /></InputField>
            <InputField label="Business Address" required><input value={form.businessAddress || ""} onChange={(e) => u("businessAddress", cap(e.target.value))} placeholder="BUSINESS ADDRESS" className={inputClass} /></InputField>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <InputField label="Business Type" required>
              <select value={form.businessType || ""} onChange={(e) => u("businessType", e.target.value)} className={inputClass}>
                <option value="">Select</option>
                {["Service", "Trader", "Manufacturing", "Retail", "Agriculture", "Other"].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </InputField>
            <InputField label="Designation" required><input value={form.bizDesignation || ""} onChange={(e) => u("bizDesignation", cap(e.target.value))} placeholder="PROPRIETOR / PARTNER / DIRECTOR" className={inputClass} /></InputField>
          </div>
          <InputField label="Qualification" required>
            <select value={form.qualification || ""} onChange={(e) => u("qualification", e.target.value)} className={inputClass}>
              <option value="">-- Select --</option>
              {qualifications.map((q) => <option key={q} value={q}>{q}</option>)}
            </select>
          </InputField>
          <InputField label="Net Monthly Income" required><input type="number" value={form.netIncome || ""} onChange={(e) => u("netIncome", e.target.value)} placeholder="Rs. Monthly income" className={`${inputClass} tabular-nums`} min={0} /></InputField>
          <InputField label="GST / ITR Available?">
            <select value={form.gstItrAvailable || ""} onChange={(e) => u("gstItrAvailable", e.target.value)} className={inputClass}>
              <option value="">Select</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </InputField>
        </Section>
      )}

      {/* Address Details */}
      <Section title="🏠 Address Details / पत्ता तपशील">
        <InputField label="Current Residence Address *" required>
          <input
            value={form.currentAddress || ""}
            onChange={(e) => {
              const val = cap(e.target.value);
              u("currentAddress", val);
              // ✅ CHANGE #4: When "Same as Current" is checked, live-copy to permanent
              if (sameAsCurrent) u("permanentAddress", val);
            }}
            placeholder="CURRENT RESIDENCE ADDRESS"
            className={inputClass}
          />
        </InputField>
        <div className="grid md:grid-cols-2 gap-3">
          <InputField label="Owned or Rented" required>
            <select value={form.addressType || ""} onChange={(e) => u("addressType", e.target.value)} className={inputClass}>
              <option value="">Select</option>
              <option value="Owned">Owned / मालकीचा</option>
              <option value="Rented">Rented / भाड्याने</option>
            </select>
          </InputField>
          <InputField label="Residing Since" required><input value={form.residingSince || ""} onChange={(e) => u("residingSince", e.target.value)} placeholder="e.g. 5 Years" className={inputClass} /></InputField>
        </div>
        <InputField label="Permanent Residence Address *" required>
          <div className="space-y-2">
            <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-foreground">
              <input type="checkbox" checked={sameAsCurrent} onChange={(e) => handleSameAddress(e.target.checked)} className="w-4 h-4 rounded border-input text-primary accent-primary" />
              Same as Current Address / सध्याचा पत्ता समान
            </label>
            {!sameAsCurrent && <input value={form.permanentAddress || ""} onChange={(e) => u("permanentAddress", cap(e.target.value))} placeholder="PERMANENT RESIDENCE ADDRESS" className={inputClass} />}
            {sameAsCurrent && <input value={form.permanentAddress || ""} readOnly className={`${inputClass} bg-muted/50`} />}
          </div>
        </InputField>
      </Section>

      {/* ✅ CHANGE #5: Banking Details - auto-filled from selected bank, ALL MANDATORY */}
      <Section title="🏦 Banking Details / बँकिंग तपशील">
        <div className="grid md:grid-cols-2 gap-3">
          <InputField label="Bank Name" required>
            <input value={form.bankName || ""} onChange={(e) => u("bankName", cap(e.target.value))} placeholder="BANK NAME" className={inputClass} />
          </InputField>
          <InputField label="Branch" required>
            <input value={form.branch || ""} onChange={(e) => u("branch", cap(e.target.value))} placeholder="BRANCH" className={inputClass} />
          </InputField>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <InputField label="Account Type" required>
            <select value={form.accountType || ""} onChange={(e) => u("accountType", e.target.value)} className={inputClass}>
              <option value="">Select</option>
              <option value="Savings">Savings</option>
              <option value="Current">Current</option>
              <option value="Salary">Salary</option>
            </select>
          </InputField>
          <InputField label="IFSC Code" required>
            <input value={form.ifsc || ""} onChange={(e) => u("ifsc", cap(e.target.value.slice(0, 11)))} placeholder="IFSC CODE" className={inputClass} maxLength={11} />
          </InputField>
        </div>
        <InputField label="Account No." required>
          <input value={form.accountNo || ""} onChange={(e) => u("accountNo", e.target.value.replace(/\D/g, ""))} placeholder="Account Number" className={`${inputClass} tabular-nums`} />
        </InputField>
        {selectedBanks && selectedBanks.length > 0 && (
          <p className="text-xs text-success font-medium">
            ✅ Bank auto-selected from: {selectedBanks.join(", ")}
          </p>
        )}
      </Section>

      {/* Current Loans */}
      <Section title="📊 Current Loan Details / सध्याचे कर्ज तपशील">
        <div className="grid md:grid-cols-2 gap-3">
          <InputField label="Active Credit Cards" required><input type="number" value={form.activeCards || ""} onChange={(e) => u("activeCards", e.target.value)} placeholder="0" className={`${inputClass} tabular-nums`} min={0} /></InputField>
          <InputField label="Active Loans" required><input type="number" value={form.activeLoans || ""} onChange={(e) => u("activeLoans", e.target.value)} placeholder="0" className={`${inputClass} tabular-nums`} min={0} /></InputField>
        </div>
      </Section>

      {/* References */}
      <Section title="👥 2 References / संदर्भ">
        <h5 className="text-xs font-bold text-muted-foreground">Relative / नातेवाईक</h5>
        <div className="grid md:grid-cols-2 gap-3">
          <InputField label="Relative Full Name" required><input value={form.relativeName || ""} onChange={(e) => u("relativeName", cap(e.target.value))} placeholder="RELATIVE NAME" className={inputClass} /></InputField>
          <InputField label="Relative Mobile No." required><input value={form.relativeMobile || ""} onChange={(e) => u("relativeMobile", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="Mobile" className={`${inputClass} tabular-nums`} /></InputField>
        </div>
        <InputField label="Relative Address" required><input value={form.relativeAddress || ""} onChange={(e) => u("relativeAddress", cap(e.target.value))} placeholder="ADDRESS" className={inputClass} /></InputField>

        <h5 className="text-xs font-bold text-muted-foreground mt-3">Friend / मित्र</h5>
        <div className="grid md:grid-cols-2 gap-3">
          <InputField label="Friend Full Name" required><input value={form.friendName || ""} onChange={(e) => u("friendName", cap(e.target.value))} placeholder="FRIEND NAME" className={inputClass} /></InputField>
          <InputField label="Friend Mobile No." required><input value={form.friendMobile || ""} onChange={(e) => u("friendMobile", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="Mobile" className={`${inputClass} tabular-nums`} /></InputField>
        </div>
        <InputField label="Friend Address" required><input value={form.friendAddress || ""} onChange={(e) => u("friendAddress", cap(e.target.value))} placeholder="ADDRESS" className={inputClass} /></InputField>
      </Section>

      {/* Education Extra Fields */}
      {isEducation && (
        <>
          <Section title="🎓 Student / Co-applicant Contact">
            <div className="grid md:grid-cols-2 gap-3">
              <InputField label="Student Contact No." required><input value={form.studentMobile || ""} onChange={(e) => u("studentMobile", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit mobile" className={`${inputClass} tabular-nums`} /></InputField>
              <InputField label="Student Email ID"><input type="email" value={form.studentEmail || ""} onChange={(e) => u("studentEmail", e.target.value)} placeholder="student@example.com" className={inputClass} /></InputField>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <InputField label="Father's Mobile Number" required><input value={form.fatherMobile || ""} onChange={(e) => u("fatherMobile", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit" className={`${inputClass} tabular-nums`} /></InputField>
              <InputField label="Father's Email ID"><input type="email" value={form.fatherEmail || ""} onChange={(e) => u("fatherEmail", e.target.value)} placeholder="father@example.com" className={inputClass} /></InputField>
            </div>
          </Section>

          <Section title="👥 2 References (Known > 1 year)">
            <h5 className="text-xs font-bold text-muted-foreground">Reference 1</h5>
            <div className="grid md:grid-cols-2 gap-3">
              <InputField label="Reference Name" required><input value={form.eduRef1Name || ""} onChange={(e) => u("eduRef1Name", cap(e.target.value))} placeholder="FULL NAME" className={inputClass} /></InputField>
              <InputField label="Mobile Number" required><input value={form.eduRef1Mobile || ""} onChange={(e) => u("eduRef1Mobile", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="Mobile" className={`${inputClass} tabular-nums`} /></InputField>
            </div>
            <InputField label="Address (in detail)" required><textarea value={form.eduRef1Address || ""} onChange={(e) => u("eduRef1Address", cap(e.target.value))} placeholder="FULL ADDRESS WITH LANDMARK" rows={2} className={inputClass} /></InputField>

            <h5 className="text-xs font-bold text-muted-foreground mt-3">Reference 2</h5>
            <div className="grid md:grid-cols-2 gap-3">
              <InputField label="Reference Name" required><input value={form.eduRef2Name || ""} onChange={(e) => u("eduRef2Name", cap(e.target.value))} placeholder="FULL NAME" className={inputClass} /></InputField>
              <InputField label="Mobile Number" required><input value={form.eduRef2Mobile || ""} onChange={(e) => u("eduRef2Mobile", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="Mobile" className={`${inputClass} tabular-nums`} /></InputField>
            </div>
            <InputField label="Address (in detail)" required><textarea value={form.eduRef2Address || ""} onChange={(e) => u("eduRef2Address", cap(e.target.value))} placeholder="FULL ADDRESS WITH LANDMARK" rows={2} className={inputClass} /></InputField>
          </Section>

          <Section title="🏠 Current Address (with Landmark)">
            <InputField label="Student — Current Address" required><textarea value={form.studentCurrAddr || ""} onChange={(e) => u("studentCurrAddr", cap(e.target.value))} placeholder="ADDRESS + LANDMARK" rows={2} className={inputClass} /></InputField>
            <InputField label="Father — Current Address" required><textarea value={form.fatherCurrAddr || ""} onChange={(e) => u("fatherCurrAddr", cap(e.target.value))} placeholder="ADDRESS + LANDMARK" rows={2} className={inputClass} /></InputField>
            <InputField label="Mother — Current Address" required><textarea value={form.motherCurrAddr || ""} onChange={(e) => u("motherCurrAddr", cap(e.target.value))} placeholder="ADDRESS + LANDMARK" rows={2} className={inputClass} /></InputField>
            <InputField label="No. of Years in Current Address" required><input value={form.yearsInCurrentAddr || ""} onChange={(e) => u("yearsInCurrentAddr", e.target.value)} placeholder="e.g. 5 Years" className={inputClass} /></InputField>
          </Section>

          <Section title="🏡 Permanent Address (with Landmark)">
            <InputField label="Student — Permanent Address"><textarea value={form.studentPermAddr || ""} onChange={(e) => u("studentPermAddr", cap(e.target.value))} placeholder="ADDRESS + LANDMARK" rows={2} className={inputClass} /></InputField>
            <InputField label="Father — Permanent Address"><textarea value={form.fatherPermAddr || ""} onChange={(e) => u("fatherPermAddr", cap(e.target.value))} placeholder="ADDRESS + LANDMARK" rows={2} className={inputClass} /></InputField>
            <InputField label="Mother — Permanent Address"><textarea value={form.motherPermAddr || ""} onChange={(e) => u("motherPermAddr", cap(e.target.value))} placeholder="ADDRESS + LANDMARK" rows={2} className={inputClass} /></InputField>
          </Section>

          <Section title="🏢 Father's Employment Details">
            <InputField label="Office Name" required><input value={form.fatherOfficeName || ""} onChange={(e) => u("fatherOfficeName", cap(e.target.value))} placeholder="OFFICE NAME" className={inputClass} /></InputField>
            <InputField label="Office Address (with Landmark)" required><textarea value={form.fatherOfficeAddr || ""} onChange={(e) => u("fatherOfficeAddr", cap(e.target.value))} placeholder="ADDRESS + LANDMARK" rows={2} className={inputClass} /></InputField>
            <InputField label="No. of Years in Current Employment" required><input value={form.fatherYearsInJob || ""} onChange={(e) => u("fatherYearsInJob", e.target.value)} placeholder="e.g. 10 Years" className={inputClass} /></InputField>
          </Section>
        </>
      )}

      {/* ✅ Required Documents for Loan — with file upload tracking */}
      <DocumentUploadSection loanType={loanType} uploadedDocs={uploadedDocs} onDocUpload={handleDocUpload} />

      {/* Submit / Payment */}
      {submitted ? (
        <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-success/30 p-8 text-center shadow-lg shadow-success/10 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-success/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10"><CheckCircle2 size={56} className="text-success mx-auto mb-3" /></div>
          <h3 className="relative z-10 text-xl font-extrabold font-display text-foreground">🎉 Greetings from Mahajan Finance!</h3>
          <p className="text-sm text-foreground mt-2">Dear <strong>{form.fullName}</strong>, your <strong>{loanLabel}</strong> application has been received successfully.</p>
          <p className="text-sm text-muted-foreground mt-1">Our team will contact you within 24 hours on <strong>{form.mobile}</strong>.</p>
          <p className="text-xs text-muted-foreground mt-2">✅ Application PDF sent to both emails • ✅ Uploaded documents attached to email • ✅ WhatsApp notified on 9730540215</p>
          <p className="text-xs text-muted-foreground mt-3">– Sandeep Mahajan · 9730540215 · PAN India Service</p>
          <button onClick={onClose} className="mt-4 px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-bold text-sm">Close</button>
        </div>
      ) : !paymentReady ? (
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={onClose} className="flex-1 px-6 py-3 rounded-lg border-2 border-primary text-primary font-bold hover:bg-primary hover:text-primary-foreground transition-all text-sm">← Back</button>
          <button onClick={proceedToPayment} disabled={loading} className="flex-1 btn-accent flex items-center justify-center gap-2 !py-3.5 rounded-lg disabled:opacity-60 hover:scale-[1.02] transition-transform">
            <Send size={18} /> Proceed to Pay Rs.499 & Submit
          </button>
        </div>
      ) : (
        <div id="loan-payment-section" className="bg-card rounded-xl border-2 border-golden/40 p-5 space-y-3">
          <h4 className="font-bold text-foreground text-center">💳 Processing Fee — Rs.499</h4>
          <p className="text-xs text-muted-foreground text-center">One-time non-refundable processing fee. Secure payment via Razorpay (UPI / Card / Net Banking).</p>

          {/* RAZORPAY BUTTON - No more "Order creation failed" */}
          <RazorpayButton
            amount={499}
            label={loading ? "Submitting..." : "Pay Rs.499 & Submit Application"}
            description={`${loanLabel} Application Fee`}
            notes={{ loanType, applicant: form.fullName || "", mobile: form.mobile || "" }}
            prefill={{ name: form.fullName, email: form.email, contact: form.mobile }}
            onSuccess={finalizeAfterPayment}
            disabled={loading}
          />

          <button onClick={() => setPaymentReady(false)} className="w-full text-xs text-muted-foreground hover:text-foreground underline">← Edit details</button>
        </div>
      )}
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════
   MAIN LOAN APPLICATION PAGE
   ═══════════════════════════════════════════════════════ */
const LoanApplication = () => {
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get("type") || "personal";

  const [loanType, setLoanType] = useState(initialType);
  const [step, setStep] = useState<"form" | "detailed" | "eligibility" | "enquiry" | "apply">("form");

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [city, setCity] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [companyCategory, setCompanyCategory] = useState<CompanyCategory | "">("");
  const [isCompanyNotListed, setIsCompanyNotListed] = useState(false);
  const [customCompany, setCustomCompany] = useState("");
  const [showCompanyList, setShowCompanyList] = useState(false);
  const [netSalary, setNetSalary] = useState("");
  const [existingEMI, setExistingEMI] = useState("");
  const [tenure, setTenure] = useState(36);
  const [interestRate, setInterestRate] = useState(10.5);
  const [showSchedule, setShowSchedule] = useState(false);
  const [loading, setLoading] = useState(false);
  const [specialFields, setSpecialFields] = useState<Record<string, string>>({});
  const [bankSearch, setBankSearch] = useState("");
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);
  const [showBankList, setShowBankList] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [businessLocation, setBusinessLocation] = useState("");
  const [businessType, setBusinessType] = useState("");

  const isBusinessLoan = loanType === "business";
  const hasEligibility = eligibilityLoanTypes.includes(loanType);
  const isSalariedLoan = ["personal", "home", "lap", "vehicle"].includes(loanType);
  const hasSpecialFields = specialFormFields[loanType] !== undefined;
  const currentLoanType = loanTypes.find(l => l.key === loanType);
  const hasBankOffers = currentLoanType?.hasBankOffers ?? false;

  const filteredCompanies = useMemo(() => {
    if (!companySearch.trim()) return companies.slice(0, 50);
    const q = companySearch.toLowerCase();
    return companies.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 50);
  }, [companySearch]);

  const filteredBanks = useMemo(() => {
    if (!bankSearch.trim()) return banks;
    const q = bankSearch.toLowerCase();
    return banks.filter((b) => b.name.toLowerCase().includes(q));
  }, [bankSearch]);

  const groupedBanks = useMemo(() => {
    return filteredBanks.reduce((acc, b) => {
      if (!acc[b.category]) acc[b.category] = [];
      acc[b.category].push(b);
      return acc;
    }, {} as Record<string, typeof banks>);
  }, [filteredBanks]);

  const toggleBank = (name: string) => {
    setSelectedBanks(prev => prev.includes(name) ? prev.filter((b) => b !== name) : [...prev, name]);
    setShowBankList(false);
  };

  // ✅ CHANGE #1: Auto-select bank from BankLoanOffers click
  const handleBankOfferSelect = useCallback((bankName: string) => {
    setSelectedBanks(prev => {
      if (prev.includes(bankName)) return prev;
      return [...prev, bankName];
    });
    setBankSearch(bankName);
    toast.success(`${bankName} auto-selected!`);
    // Scroll to bank selection section
    setTimeout(() => {
      document.getElementById("bank-selection-section")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 200);
  }, []);

  const selectCompany = useCallback((name: string, category: CompanyCategory) => {
    setSelectedCompany(name);
    setCompanyCategory(category);
    setCompanySearch(name);
    setShowCompanyList(false);
    setIsCompanyNotListed(false);
  }, []);

  const eligibility = useMemo<EligibilityResult | null>(() => {
    const salary = parseFloat(netSalary);
    const emi = parseFloat(existingEMI) || 0;
    if (!salary || salary <= 0 || !companyCategory) return null;
    return calculateEligibility(salary, emi, companyCategory as CompanyCategory, tenure, interestRate);
  }, [netSalary, existingEMI, companyCategory, tenure, interestRate]);

  const schedule = useMemo(() => {
    if (!eligibility?.eligible || !eligibility.maxLoan) return [];
    return generateRepaymentSchedule(eligibility.maxLoan, interestRate, tenure);
  }, [eligibility, interestRate, tenure]);

  const totalInterest = schedule.reduce((s, r) => s + r.interest, 0);
  const autoCapital = (value: string) => value.toUpperCase();
  const loanLabel = loanTypes.find((l) => l.key === loanType)?.label || "";

  const handleCheckEligibility = () => {
    if (!name.trim() || !mobile.trim() || !city.trim()) { toast.error("Please fill Name, Mobile & City"); return; }
    if (!/^[6-9]\d{9}$/.test(mobile.trim())) { toast.error("Enter valid 10-digit mobile"); return; }
    if (hasEligibility) {
      if (isSalariedLoan && !companyCategory) { toast.error("Please select your company"); return; }
      if (!netSalary || parseFloat(netSalary) <= 0) { toast.error("Please enter net take-home salary"); return; }
      if (isBusinessLoan && (!businessName.trim() || !businessType)) { toast.error("Please fill business details"); return; }
      setStep("eligibility");
    } else {
      if (!loanAmount.trim()) { toast.error("Please enter required loan amount"); return; }
      handleApply();
    }
  };

  const handleApply = () => setStep("detailed");

  const handleDownloadEmiPdf = async () => {
    if (!eligibility?.eligible || !schedule.length) return;
    try {
      await downloadEmiPdf({ customerName: name || undefined, loanType: loanLabel, loanAmount: eligibility.maxLoan, tenureMonths: tenure, interestRate, totalInterest, schedule });
      toast.success("EMI schedule downloaded");
    } catch (e) { console.error(e); toast.error("Failed to generate PDF"); }
  };

  /* === FINALIZE FREE FLOW — V3-STORAGE (WhatsApp via edge function) === */
  const finalizeApplication = async (paymentInfo: string) => {
    setLoading(true);

    const refId = generateRefId();
    console.log("=== FINALIZE FREE FLOW ===", "ref:", refId);

    try {
      await supabase.functions.invoke("send-enquiry-email", {
        body: {
          serviceName: loanLabel + " Application (FREE)",
          customerName: name,
          customerMobile: mobile,
          details: {
            fullName: name,
            mobile: mobile,
            loanAmount: loanAmount || (eligibility?.maxLoan ? "Rs." + eligibility.maxLoan.toLocaleString("en-IN") : "As per eligibility"),
            "Reference ID": refId,
            "Selected Banks": selectedBanks.join(", ") || "Not specified",
            ...specialFields,
          },
          paymentInfo,
          documentUrls: [],
        },
      });
      toast.success("Application submitted! We'll contact you soon.");
    } catch (e) {
      console.error("Submission failed", e);
      toast.error("Submission failed. Please try again.");
    }

    setLoading(false);
    setStep("apply");
  };

  return (
    <>
      <section className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 py-14 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-50%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-30%] right-[-5%] w-[400px] h-[400px] bg-indigo-400/10 rounded-full blur-3xl"></div>
          <div className="absolute top-[20%] right-[20%] w-[200px] h-[200px] bg-cyan-400/5 rounded-full blur-2xl"></div>
        </div>
        <div className="container text-center relative z-10">
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl md:text-5xl font-extrabold text-white font-display tracking-tight">
            Loan Application &amp; Eligibility
          </motion.h1>
          <p className="mt-3 text-blue-200/80 text-lg">Check eligibility, calculate EMI &amp; apply instantly</p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-blue-100 text-sm">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            PAN India Service &bull; Instant Processing
          </div>
        </div>
      </section>

      <section className="py-10 bg-gradient-to-b from-slate-50 via-white to-blue-50/20">
        {/* Tabs Container */}
        <div className="container max-w-3xl mx-auto px-4">
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {loanTypes.map(lt => (
              <button
                key={lt.key}
                onClick={() => { setLoanType(lt.key); setStep("form"); setSpecialFields({}); }}
                className={`px-4 py-2.5 rounded-full text-sm font-bold transition-all hover:scale-105 border-2 ${loanType === lt.key ? "bg-accent text-accent-foreground border-golden shadow-md" : "bg-card text-muted-foreground border-border hover:border-golden hover:text-foreground"}`}
              >
                {lt.icon} {lt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ✅ CHANGE #1: BANK-WISE OFFERS with onSelectBank callback */}
        {hasBankOffers && step !== "detailed" && (
          <BankLoanOffers
            loanType={loanType}
            loanLabel={loanLabel}
            onSelectBank={handleBankOfferSelect}
          />
        )}

        {/* Form Container */}
        <div className="container max-w-3xl mx-auto px-4">
          <AnimatePresence mode="wait">
            {step === "detailed" && (
              <motion.div key="detailed" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="bg-card rounded-xl border-2 border-golden/30 p-6 md:p-8 shadow-sm hover:shadow-lg transition-shadow">
                <h2 className="text-xl font-bold font-display text-foreground text-center mb-6 bg-muted/50 py-3 rounded-lg border border-golden/20">
                  📋 {loanLabel} – Detailed Application
                </h2>
                <DetailedLoanForm loanType={loanType} loanLabel={loanLabel} onClose={() => setStep("form")} selectedBanks={selectedBanks} initialData={{
                  fullName: name, mobile, currentAddress: city, loanAmount,
                  companyName: isCompanyNotListed ? customCompany : selectedCompany,
                  netIncome: netSalary, existingEMI, businessName, businessAddress: businessLocation, businessType, ...specialFields
                }} />
              </motion.div>
            )}

            {step === "form" && (
              <motion.div key="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="bg-card rounded-xl border-2 border-golden/30 p-6 md:p-8 shadow-sm space-y-5 hover:shadow-lg transition-shadow">
                <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2 justify-center bg-muted/50 py-3 rounded-lg border border-golden/20">
                  <Calculator size={22} className="text-golden" /> {loanLabel} – {hasEligibility ? "Check Eligibility" : "Apply Now"}
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <InputField label="Full Name" required><input type="text" value={name} onChange={(e) => setName(autoCapital(e.target.value))} placeholder="ENTER FULL NAME" className={inputClass} maxLength={100} /></InputField>
                  <InputField label="Mobile Number" required><input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit mobile" className={`${inputClass} tabular-nums`} /></InputField>
                </div>

                <InputField label="City" required><input type="text" value={city} onChange={(e) => setCity(autoCapital(e.target.value))} placeholder="YOUR CITY" className={inputClass} maxLength={50} /></InputField>

                {/* Company Search */}
                {isSalariedLoan && hasEligibility && (
                  <div>
                    <InputField label="Name of Company" required>
                      <div className="relative">
                        <Search size={16} className="absolute left-3 top-3.5 text-muted-foreground" />
                        <input type="text" value={companySearch} onChange={(e) => { setCompanySearch(autoCapital(e.target.value)); setShowCompanyList(true); if (selectedCompany && autoCapital(e.target.value) !== selectedCompany) { setSelectedCompany(""); setCompanyCategory(""); } }} onFocus={() => setShowCompanyList(true)} placeholder="SEARCH COMPANY NAME..." className={`${inputClass} pl-10`} />
                        {showCompanyList && companySearch.length > 0 && (
                          <div className="absolute z-20 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {filteredCompanies.map((c) => (
                              <button key={c.name} onClick={() => selectCompany(c.name, c.category)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/5 border-b border-border/30"><span className="font-medium">{c.name}</span></button>
                            ))}
                            <button onClick={() => { setIsCompanyNotListed(true); setShowCompanyList(false); setCompanyCategory("CATGC"); setSelectedCompany("NOT_LISTED"); }} className="w-full text-left px-4 py-3 text-sm font-bold text-accent hover:bg-accent/5 border-t-2 border-accent/20">🔍 Company Not Listed – Enter Manually</button>
                          </div>
                        )}
                      </div>
                    </InputField>
                    {isCompanyNotListed && <div className="mt-3"><InputField label="Enter Company Name"><input type="text" value={customCompany} onChange={(e) => setCustomCompany(autoCapital(e.target.value))} placeholder="TYPE YOUR COMPANY NAME" className={inputClass} /></InputField></div>}
                  </div>
                )}

                {/* ✅ Bank Selection with ID for auto-scroll */}
                <div id="bank-selection-section">
                  <InputField label={`Select Bank / NBFC${selectedBanks.length > 0 ? ` (${selectedBanks.length} selected)` : ''}`}>
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-3.5 text-muted-foreground" />
                      <input type="text" value={bankSearch} onChange={(e) => { setBankSearch(e.target.value); setShowBankList(true); }} onFocus={() => setShowBankList(true)} placeholder="Search banks & NBFCs..." className={`${inputClass} pl-10`} />
                      {showBankList && (
                        <div className="absolute z-20 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                          {Object.entries(groupedBanks).map(([cat, catBanks]) => (
                            <div key={cat}>
                              <p className="px-4 py-2 text-xs font-bold text-golden bg-muted/50 sticky top-0">{bankCategoryLabels[cat]}</p>
                              {catBanks.map((b) => (
                                <button key={b.name} onClick={() => toggleBank(b.name)} className={`w-full text-left px-4 py-2 text-sm hover:bg-primary/5 border-b border-border/20 flex justify-between items-center ${selectedBanks.includes(b.name) ? "bg-primary/10" : ""}`}><span>{b.name}</span>{selectedBanks.includes(b.name) && <span className="text-success text-xs font-bold">✓</span>}</button>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </InputField>
                  {selectedBanks.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {selectedBanks.map((b) => (
                        <span key={b} className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">{b} <button onClick={() => toggleBank(b)} className="text-destructive hover:text-destructive/80">×</button></span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Business fields */}
                {isBusinessLoan && (
                  <div className="space-y-4 p-4 bg-muted/50 rounded-lg border border-golden/20">
                    <h3 className="font-bold text-sm text-foreground">Business Details</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <InputField label="Business Name" required><input type="text" value={businessName} onChange={(e) => setBusinessName(autoCapital(e.target.value))} placeholder="BUSINESS NAME" className={inputClass} /></InputField>
                      <InputField label="Business Location" required><input type="text" value={businessLocation} onChange={(e) => setBusinessLocation(autoCapital(e.target.value))} placeholder="BUSINESS LOCATION" className={inputClass} /></InputField>
                    </div>
                    <InputField label="Business Type" required>
                      <select value={businessType} onChange={(e) => setBusinessType(e.target.value)} className={inputClass}>
                        <option value="">Select type</option>
                        {["Service", "Trader", "Manufacturing"].map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </InputField>
                    <InputField label="Net Monthly Income" required><input type="number" value={netSalary} onChange={(e) => setNetSalary(e.target.value)} placeholder="Rs. Monthly income" className={`${inputClass} tabular-nums`} min={0} /></InputField>
                  </div>
                )}

                {/* Special fields */}
                {hasSpecialFields && (
                  <div className="space-y-4 p-4 bg-muted/50 rounded-lg border border-golden/20">
                    <h3 className="font-bold text-sm text-foreground">{loanLabel} Details</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {specialFormFields[loanType].map((f) => (
                        <InputField key={f.key} label={f.label} required={f.required}>
                          <input type="text" value={specialFields[f.key] || ""} onChange={(e) => setSpecialFields({ ...specialFields, [f.key]: ["studentName", "groupName", "contactPerson", "village"].includes(f.key) ? autoCapital(e.target.value) : e.target.value })} placeholder={f.placeholder} className={inputClass} />
                        </InputField>
                      ))}
                    </div>
                  </div>
                )}

                {!hasEligibility && <InputField label="Required Loan Amount (Rs.)" required><input type="number" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} placeholder="Rs. Loan amount" className={`${inputClass} tabular-nums`} min={0} /></InputField>}

                {hasEligibility && !isBusinessLoan && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <InputField label="Net Take Home Salary (Rs.)" required><input type="number" value={netSalary} onChange={(e) => setNetSalary(e.target.value)} placeholder="Rs. Monthly income" className={`${inputClass} tabular-nums`} min={0} /></InputField>
                    <InputField label="Existing Monthly EMIs (Rs.)"><input type="number" value={existingEMI} onChange={(e) => setExistingEMI(e.target.value)} placeholder="Rs. 0" className={`${inputClass} tabular-nums`} min={0} /></InputField>
                  </div>
                )}

                {hasEligibility && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <InputField label={`Loan Tenure: ${tenure} months`}>
                      <input type="range" min={12} max={72} step={6} value={tenure} onChange={(e) => setTenure(Number(e.target.value))} className="w-full accent-golden" />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>12m</span><span>72m</span></div>
                    </InputField>
                    <InputField label={`Interest Rate: ${interestRate}%`}>
                      <input type="range" min={7} max={24} step={0.5} value={interestRate} onChange={(e) => setInterestRate(Number(e.target.value))} className="w-full accent-golden" />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>7%</span><span>24%</span></div>
                    </InputField>
                  </div>
                )}

                <button onClick={handleCheckEligibility} className="btn-accent w-full flex items-center justify-center gap-2 !py-3.5 rounded-lg text-base hover:scale-[1.02] transition-transform">
                  <Calculator size={20} /> {hasEligibility ? "Check Eligibility & Calculate EMI" : "Apply Now"}
                </button>

                {/* ✅ CHANGE #2: REMOVED "Required Documents for all loans" from the main form */}
              </motion.div>
            )}

            {step === "eligibility" && eligibility && (
              <motion.div key="eligibility" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-6">
                <div className={`rounded-2xl border-2 p-6 md:p-8 shadow-lg transition-all ${eligibility.eligible ? "bg-gradient-to-br from-green-50 to-emerald-50 border-success/40 shadow-success/10" : "bg-gradient-to-br from-red-50 to-orange-50 border-destructive/40 shadow-destructive/10"}`}>
                  <div className="text-center mb-6">
                    {eligibility.eligible ? (<><CheckCircle2 size={48} className="text-success mx-auto mb-3" /><h2 className="text-2xl font-extrabold font-display text-foreground">🎉 You are Eligible!</h2></>) : (<><div className="text-4xl mb-3">❌</div><h2 className="text-2xl font-extrabold font-display text-foreground">Not Eligible</h2><p className="text-muted-foreground mt-2">Based on current criteria, eligibility is not available.</p></>)}
                  </div>
                  {eligibility.eligible && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[{ label: "Max Loan Amount", value: formatINR(eligibility.maxLoan), color: "text-primary" }, { label: "Monthly EMI", value: formatINR(eligibility.maxEMI), color: "text-accent" }, { label: "FOIR", value: `${eligibility.foir}%`, color: "text-foreground" }, { label: "Total Interest", value: formatINR(totalInterest), color: "text-foreground" }].map((item) => (
                        <div key={item.label} className="text-center p-3 bg-muted rounded-lg hover:shadow-md transition-shadow"><p className="text-xs text-muted-foreground mb-1">{item.label}</p><p className={`text-lg font-extrabold tabular-nums ${item.color}`}>{item.value}</p></div>
                      ))}
                    </div>
                  )}
                </div>

                {eligibility.eligible && schedule.length > 0 && (
                  <div className="bg-card rounded-xl border-2 border-golden/20 shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between p-4 gap-3 flex-wrap">
                      <button onClick={() => setShowSchedule(!showSchedule)} className="flex items-center gap-2 font-bold font-display text-foreground hover:text-primary transition-colors">📊 EMI Repayment Schedule {showSchedule ? <ChevronUp size={20} /> : <ChevronDown size={20} />} </button>
                      <button onClick={handleDownloadEmiPdf} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-xs font-bold hover:scale-[1.03] transition-transform"><Download size={14} /> Download PDF</button>
                    </div>
                    {showSchedule && (
                      <div className="overflow-x-auto border-t border-border max-h-80 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-primary text-primary-foreground sticky top-0"><tr><th className="px-3 py-2 text-left">Month</th><th className="px-3 py-2 text-right">EMI</th><th className="px-3 py-2 text-right">Principal</th><th className="px-3 py-2 text-right">Interest</th><th className="px-3 py-2 text-right">Balance</th></tr></thead>
                          <tbody>{schedule.map((row) => (<tr key={row.month} className="border-b border-border/50 hover:bg-muted/30"><td className="px-3 py-2 font-medium">{row.month}</td><td className="px-3 py-2 text-right tabular-nums">{formatINR(row.emi)}</td><td className="px-3 py-2 text-right tabular-nums text-primary">{formatINR(row.principal)}</td><td className="px-3 py-2 text-right tabular-nums text-golden">{formatINR(row.interest)}</td><td className="px-3 py-2 text-right tabular-nums">{formatINR(row.balance)}</td></tr>))}</tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={() => setStep("form")} className="flex-1 px-6 py-3.5 rounded-lg border-2 border-primary text-primary font-bold hover:bg-primary hover:text-primary-foreground transition-all text-sm hover:scale-[1.02]">← Back to Edit</button>
                  {eligibility.eligible && <button onClick={handleApply} disabled={loading} className="flex-1 btn-accent flex items-center justify-center gap-2 !py-3.5 rounded-lg text-base disabled:opacity-60 hover:scale-[1.02] transition-transform"><Send size={18} /> {loading ? "Submitting..." : "Apply Now"}</button>}
                </div>
              </motion.div>
            )}

            {step === "apply" && (
              <motion.div key="apply" initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 200, damping: 20 }} className="relative bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-success/30 p-10 text-center shadow-xl shadow-success/10 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-success/5 rounded-full -translate-y-1/2 translate-x-1/2"></div><div className="absolute bottom-0 left-0 w-24 h-24 bg-success/5 rounded-full translate-y-1/2 -translate-x-1/2"></div><div className="relative z-10"><CheckCircle2 size={72} className="text-success mx-auto mb-4" /></div>
                <h2 className="text-2xl font-extrabold font-display text-foreground mb-4">Application Submitted Successfully! 🎉</h2>
                <div className="relative z-10 bg-white/70 backdrop-blur-sm rounded-xl p-6 text-left max-w-md mx-auto space-y-2 text-sm border border-success/20 shadow-sm">
                  <p>Thank you for applying for a <strong>{loanLabel}</strong> with Mahajan Finance.</p>
                  <p>Your request has been received successfully.</p>
                  <p>Our team will contact you shortly.</p>
                  <p className="mt-3">For urgent queries: <a href="tel:+919730540215" className="text-primary font-bold">9730540215</a></p>
                  <p className="font-bold mt-2">– Mahajan Finance - Sandeep Mahajan</p>
                </div>
                <div className="relative z-10 mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                  <Link to="/" className="px-6 py-3 rounded-full border-2 border-primary text-primary font-bold hover:bg-primary hover:text-primary-foreground transition-all text-sm hover:scale-105">Go to Home</Link>
                  <a href={`https://wa.me/919730540215?text=${encodeURIComponent(`Hello Mahajan Finance, I applied for ${loanLabel}. Name: ${name}, Mobile: ${mobile}, City: ${city}`)}`} target="_blank" rel="noopener noreferrer" className="px-6 py-3 rounded-full bg-success text-success-foreground font-bold hover:brightness-90 transition-all text-sm hover:scale-105">💬 WhatsApp Us</a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </>
  );
};

export default LoanApplication;
