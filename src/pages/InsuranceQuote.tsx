import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Send, CheckCircle2, Upload, ShieldCheck, X, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import RazorpayButton from "@/components/RazorpayButton";
import { uploadDocsToStorage } from '@/utils/uploadDocs';

const INSURANCE_FEE = 299;

const insuranceTypes = [
  "Car Insurance",
  "Bike Insurance",
  "Health Insurance",
  "Life Insurance",
  "Commercial Vehicle Insurance",
  "Personal Accident Insurance",
  "Fire Insurance",
];

interface DynamicField {
  key: string;
  label: string;
  placeholder?: string;
  type: "text" | "number" | "select" | "tel";
  options?: string[];
  maxLength?: number;
  transform?: "upper" | "digits-only" | "digits-10";
}

const dynamicFieldsByType: Record<string, DynamicField[]> = {
  default: [],
  "Car Insurance": [
    { key: "registrationNo", label: "Vehicle Registration Number *", placeholder: "e.g. MH12AB1234", type: "text", transform: "upper", maxLength: 15 },
    { key: "makeModel", label: "Make & Model *", placeholder: "e.g. Maruti Swift VXI", type: "text", maxLength: 80 },
    { key: "mfgYear", label: "Manufacturing Year *", placeholder: "e.g. 2022", type: "number", maxLength: 4 },
    { key: "fuelType", label: "Fuel Type *", type: "select", options: ["Petrol", "Diesel", "CNG", "Electric", "Hybrid"] },
    { key: "prevPolicyNo", label: "Previous Policy Number", placeholder: "If renewal", type: "text" },
    { key: "prevInsurer", label: "Previous Insurer", placeholder: "e.g. ICICI Lombard", type: "text" },
    { key: "ncb", label: "No Claim Bonus (NCB) %", placeholder: "e.g. 20", type: "number", maxLength: 3 },
  ],
  "Bike Insurance": [
    { key: "registrationNo", label: "Vehicle Registration Number *", placeholder: "e.g. MH12AB1234", type: "text", transform: "upper", maxLength: 15 },
    { key: "makeModel", label: "Make & Model *", placeholder: "e.g. Honda Activa 6G", type: "text", maxLength: 80 },
    { key: "mfgYear", label: "Manufacturing Year *", placeholder: "e.g. 2023", type: "number", maxLength: 4 },
    { key: "engineCC", label: "Engine CC", placeholder: "e.g. 110", type: "number", maxLength: 4 },
    { key: "prevPolicyNo", label: "Previous Policy Number", placeholder: "If renewal", type: "text" },
    { key: "ncb", label: "No Claim Bonus (NCB) %", placeholder: "e.g. 20", type: "number", maxLength: 3 },
  ],
  "Health Insurance": [
    { key: "ageEldest", label: "Age of Eldest Member *", placeholder: "e.g. 45", type: "number", maxLength: 3 },
    { key: "memberCount", label: "Number of Members to Cover *", placeholder: "e.g. 4", type: "number", maxLength: 2 },
    { key: "preExisting", label: "Pre-existing Diseases", placeholder: "e.g. Diabetes, Hypertension (or None)", type: "text", maxLength: 200 },
    { key: "sumInsured", label: "Sum Insured Preference", type: "select", options: ["3 Lakh", "5 Lakh", "7 Lakh", "10 Lakh", "15 Lakh", "20 Lakh", "25 Lakh", "50 Lakh", "1 Crore"] },
    { key: "cityResidence", label: "City of Residence *", placeholder: "YOUR CITY", type: "text", transform: "upper", maxLength: 50 },
  ],
  "Life Insurance": [
    { key: "age", label: "Your Age *", placeholder: "e.g. 32", type: "number", maxLength: 3 },
    { key: "incomeRange", label: "Annual Income Range *", type: "select", options: ["Below ₹5 Lakh", "₹5–10 Lakh", "₹10–20 Lakh", "₹20–50 Lakh", "₹50 Lakh – 1 Crore", "Above 1 Crore"] },
    { key: "sumAssured", label: "Sum Assured Preference *", type: "select", options: ["25 Lakh", "50 Lakh", "75 Lakh", "1 Crore", "1.5 Crore", "2 Crore", "Above 2 Crore"] },
    { key: "policyTerm", label: "Policy Term (Years)", placeholder: "e.g. 30", type: "number", maxLength: 2 },
    { key: "smoking", label: "Smoking Habits *", type: "select", options: ["Non-Smoker", "Smoker"] },
  ],
  "Commercial Vehicle Insurance": [
    { key: "registrationNo", label: "Vehicle Registration Number *", placeholder: "e.g. MH12AB1234", type: "text", transform: "upper", maxLength: 15 },
    { key: "vehicleType", label: "Vehicle Type *", type: "select", options: ["Truck", "Bus", "Tempo/Traveller", "Auto Rickshaw", "Tipper", "Tanker", "Container", "Other"] },
    { key: "gvw", label: "Gross Vehicle Weight (GVW)", placeholder: "e.g. 12000 kg", type: "text", maxLength: 20 },
    { key: "seatingCapacity", label: "Seating Capacity", placeholder: "e.g. 40", type: "number", maxLength: 3 },
    { key: "permitType", label: "Permit Type", type: "select", options: ["National", "State", "Contract Carriage", "Goods", "Tourist", "Other"] },
    { key: "prevPolicyNo", label: "Previous Policy Number", placeholder: "If renewal", type: "text" },
  ],
  "Personal Accident Insurance": [
    { key: "occupation", label: "Occupation *", placeholder: "e.g. Office Executive, Driver, Businessman", type: "text", maxLength: 80 },
    { key: "age", label: "Your Age *", placeholder: "e.g. 35", type: "number", maxLength: 3 },
    { key: "incomeRange", label: "Annual Income *", type: "select", options: ["Below ₹3 Lakh", "₹3–5 Lakh", "₹5–10 Lakh", "₹10–20 Lakh", "Above ₹20 Lakh"] },
    { key: "sumInsured", label: "Sum Insured Preference *", type: "select", options: ["10 Lakh", "25 Lakh", "50 Lakh", "75 Lakh", "1 Crore", "2 Crore"] },
  ],
  "Fire Insurance": [
    { key: "propertyType", label: "Property Type *", type: "select", options: ["Residential – Individual", "Residential – Society/Apartment", "Commercial – Shop/Office", "Commercial – Godown/Warehouse", "Industrial – Factory", "Industrial – Storage"] },
    { key: "sumInsured", label: "Sum Insured (Approx.) *", placeholder: "e.g. 5000000", type: "number", maxLength: 15 },
    { key: "propertyAddress", label: "Property Address *", placeholder: "Full address of the property", type: "text", maxLength: 250 },
    { key: "constructionType", label: "Construction Type *", type: "select", options: ["Pucca (RCC/Brick)", "Kutcha (Mud/Thatch)", "Mixed"] },
    { key: "yearOfConstruction", label: "Year of Construction", placeholder: "e.g. 2010", type: "number", maxLength: 4 },
    { key: "businessType", label: "Business Type (if commercial/industrial)", placeholder: "e.g. Textile, Electronics, General Store", type: "text", maxLength: 100 },
  ],
};

const docsByType: Record<string, string[]> = {
  default: ["Aadhaar Card", "PAN Card", "Passport-size Photo"],
  "Car Insurance": ["RC Book (Front & Back)", "Previous Policy Copy", "Aadhaar Card", "PAN Card", "Driving Licence"],
  "Bike Insurance": ["RC Book (Front & Back)", "Previous Policy Copy", "Aadhaar Card"],
  "Commercial Vehicle Insurance": ["RC Book", "Permit Copy", "Fitness Certificate", "Previous Policy Copy", "Aadhaar Card", "PAN Card"],
  "Health Insurance": ["Aadhaar Card", "PAN Card", "Medical Reports (if any)", "Existing Policy Card (if porting)"],
  "Life Insurance": ["Aadhaar Card", "PAN Card", "Income Proof (ITR/Salary Slip)", "Bank Passbook / Cancelled Cheque", "Passport-size Photo"],
  "Fire Insurance": ["Property Ownership Proof", "Property Tax Receipt", "Aadhaar Card", "PAN Card", "Stock / Inventory Details (if business)"],
};

const inputClass = "w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

const InsuranceQuote = () => {
  const [form, setForm] = useState({ name: "", mobile: "", city: "", email: "", type: "", message: "" });
  const [dynamicFields, setDynamicFields] = useState<Record<string, string>>({});
  const [docFiles, setDocFiles] = useState<Record<string, File | null>>({});
  const [showPayment, setShowPayment] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = (key: string, value: string) => setForm({ ...form, [key]: value });
  const autoCapital = (value: string) => value.toUpperCase();

  const docs = docsByType[form.type] || docsByType.default;
  const fields = dynamicFieldsByType[form.type] || dynamicFieldsByType.default;

  const handleTypeChange = (value: string) => {
    update("type", value);
    setDynamicFields({});
    setDocFiles({});
  };

  const updateDynamic = (key: string, value: string, transform?: string) => {
    let processed = value;
    if (transform === "upper") processed = value.toUpperCase();
    else if (transform === "digits-only") processed = value.replace(/\D/g, "");
    else if (transform === "digits-10") processed = value.replace(/\D/g, "").slice(0, 10);
    setDynamicFields(prev => ({ ...prev, [key]: processed }));
  };

  const handleDocUpload = (docName: string, file: File | null) => {
    setDocFiles(prev => ({ ...prev, [docName]: file }));
  };

  const removeDoc = (docName: string) => {
    setDocFiles(prev => ({ ...prev, [docName]: null }));
  };

  const validateAndPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.mobile.trim() || !form.type) {
      toast.error("Please fill Name, Mobile & Insurance Type");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) {
      toast.error("Enter a valid 10-digit mobile number");
      return;
    }
    // Check required dynamic fields
    const requiredFields = fields.filter(f => f.label.endsWith(" *"));
    for (const rf of requiredFields) {
      if (!dynamicFields[rf.key]?.trim()) {
        toast.error(`Please fill: ${rf.label.replace(" *", "")}`);
        return;
      }
    }
    setShowPayment(true);
  };

  const handleAfterPayment = async (paymentId: string) => {
    const dynamicDetails: Record<string, string> = {};
    fields.forEach(f => {
      if (dynamicFields[f.key]) {
        dynamicDetails[f.label.replace(" *", "")] = dynamicFields[f.key];
      }
    });

    const docNames: string[] = [];
    Object.entries(docFiles).forEach(([name, file]) => {
      if (file) docNames.push(`${name}: ${file.name}`);
    });

    try {
      const docFilesArr = Object.values(docFiles).filter(Boolean) as File[];
      const docUrls = await uploadDocsToStorage(supabase, docFilesArr, "INS");
      await supabase.functions.invoke("send-enquiry-email", {
        body: {
          serviceName: `${form.type} Quote`,
          customerName: form.name,
          customerMobile: form.mobile,
          details: {
            City: form.city,
            Email: form.email,
            ...dynamicDetails,
            "Documents Uploaded": docNames.length > 0 ? docNames.join(" | ") : "None",
            Notes: form.message,
            "Advisors": "Dipali Sandeep Mahajan (ICICI Lombard) & Sandeep Shrikant Mahajan (IRDAI Authorized)",
          },
          paymentInfo: `Quote fee paid ₹${INSURANCE_FEE} (${paymentId})`,
          documentUrls: docUrls,
          priorityEmails: ["sandeepmahajan9@gmail.com", "info@mahajanfinance.com"],
        },
      });
    } catch (err) {
      console.error("Email/WhatsApp failed", err);
    }

    setShowPayment(false);
    setSubmitted(true);
  };

  const totalDocFiles = Object.values(docFiles).filter(Boolean).length;

  return (
    <>
      {/* Hero */}
      <section className="bg-primary py-12">
        <div className="container text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-primary-foreground font-display tracking-tight">
            Get Insurance Quote
          </h1>
          <p className="mt-3 text-primary-foreground/70">Compare plans from top insurers. Best rates guaranteed.</p>
        </div>
      </section>

      {/* Advisor Badge Strip */}
      <section className="bg-gradient-to-r from-golden/10 via-golden/20 to-golden/10 border-y border-golden/20 py-5">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-center gap-5 md:gap-10 text-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-golden/20 flex items-center justify-center flex-shrink-0 border border-golden/30">
                <ShieldCheck className="text-golden" size={24} />
              </div>
              <div className="text-left">
                <p className="text-sm font-extrabold text-foreground leading-tight">Dipali Sandeep Mahajan</p>
                <p className="text-[11px] text-muted-foreground font-medium">ICICI Lombard · Authorized Insurance Advisor</p>
              </div>
            </div>
            <div className="hidden md:block w-px h-10 bg-border" />
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
                <ShieldCheck className="text-primary" size={24} />
              </div>
              <div className="text-left">
                <p className="text-sm font-extrabold text-foreground leading-tight">Sandeep Shrikant Mahajan</p>
                <p className="text-[11px] text-muted-foreground font-medium">IRDAI Authorized Insurance Advisor · Turtlemint</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="py-16 bg-background">
        <div className="container max-w-2xl">
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="relative overflow-hidden rounded-2xl p-8 md:p-10 text-center shadow-lg"
                style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)" }}>
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-5">
                    <CheckCircle2 size={52} className="text-white drop-shadow-lg" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-extrabold font-display text-white mb-3">Quote Request Submitted!</h2>
                  <p className="text-sm text-white/90 mb-3 leading-relaxed">
                    Thank you, <strong className="text-white">{form.name}</strong>. Our advisors
                    <strong className="underline decoration-2"> Dipali Sandeep Mahajan</strong> (ICICI Lombard) &
                    <strong className="underline decoration-2"> Sandeep Shrikant Mahajan</strong> (IRDAI Authorized) will share the best
                    <strong className="text-yellow-200"> {form.type}</strong> quotes shortly.
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-bold mb-4">
                    <CheckCircle2 size={14} /> Confirmation sent via Email & WhatsApp
                  </div>
                  <p className="text-sm text-white/80">📞 For urgent: <a href="tel:+919730540215" className="text-primary font-bold">9730540215</a></p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                  <Link to="/" className="px-6 py-3 rounded-full border-2 border-white/60 text-white font-bold hover:bg-white hover:text-emerald-700 transition-all text-sm">Go Home</Link>
                  <button onClick={() => {
                    setSubmitted(false);
                    setForm({ name: "", mobile: "", city: "", email: "", type: "", message: "" });
                    setDynamicFields({});
                    setDocFiles({});
                  }} className="px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm text-white font-bold text-sm hover:bg-white/30 transition-all">New Quote</button>
                </div>
                </div>
              </motion.div>
            ) : showPayment ? (
              <motion.div key="payment" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-card rounded-xl border-2 border-golden/30 p-6 md:p-8 shadow-sm text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-golden/10 border border-golden/20 text-[11px] font-bold text-golden">
                  <ShieldCheck size={13} /> Dipali Sandeep Mahajan & Sandeep Shrikant Mahajan — Authorized Advisors
                </div>
                <h3 className="font-bold text-foreground">💳 Quote Processing Fee</h3>
                <p className="text-3xl font-extrabold text-golden">₹{INSURANCE_FEE}</p>
                <p className="text-xs text-muted-foreground">Pay securely via UPI / Card / Netbanking</p>
                <RazorpayButton
                  amount={INSURANCE_FEE}
                  label={`Pay ₹${INSURANCE_FEE} & Get Quote`}
                  description={`${form.type} Quote`}
                  notes={{ name: form.name, mobile: form.mobile, type: form.type, advisors: "Dipali Sandeep Mahajan (ICICI Lombard), Sandeep Shrikant Mahajan (IRDAI Authorized)" }}
                  prefill={{ name: form.name, contact: form.mobile, email: form.email }}
                  onSuccess={handleAfterPayment}
                />
                <button onClick={() => setShowPayment(false)} className="text-sm text-muted-foreground hover:text-foreground">← Back to form</button>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={validateAndPay} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-card rounded-xl border-2 border-golden/30 p-6 md:p-8 shadow-sm hover:shadow-lg transition-shadow">

                {/* Advisor Trust Card */}
                <div className="flex items-center gap-3 p-3.5 rounded-lg bg-gradient-to-r from-golden/5 to-primary/5 border border-golden/15 mb-5">
                  <div className="flex -space-x-2 flex-shrink-0">
                    <img src="https://ui-avatars.com/api/?name=Dipali+Mahajan&background=d97706&color=fff&size=36&font-size=0.38&bold=true" alt="Dipali" className="w-9 h-9 rounded-full border-2 border-card" />
                    <img src="https://ui-avatars.com/api/?name=Sandeep+Mahajan&background=2563eb&color=fff&size=36&font-size=0.38&bold=true" alt="Sandeep" className="w-9 h-9 rounded-full border-2 border-card" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-extrabold text-foreground leading-tight">Dipali Sandeep Mahajan & Sandeep Shrikant Mahajan</p>
                    <p className="text-[11px] text-muted-foreground">ICICI Lombard & IRDAI Authorized Insurance Advisors</p>
                  </div>
                </div>

                {/* Common Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Full Name *</label>
                    <input type="text" value={form.name} onChange={(e) => update("name", autoCapital(e.target.value))} placeholder="ENTER YOUR FULL NAME" className={inputClass} maxLength={100} />
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold mb-1.5">Mobile Number *</label>
                      <input type="tel" value={form.mobile} onChange={(e) => update("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit mobile" className={`${inputClass} tabular-nums`} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1.5">Email</label>
                      <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="you@example.com" className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">City</label>
                    <input type="text" value={form.city} onChange={(e) => update("city", autoCapital(e.target.value))} placeholder="YOUR CITY" className={inputClass} maxLength={50} />
                  </div>

                  {/* Insurance Type Selector */}
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Insurance Type *</label>
                    <select value={form.type} onChange={(e) => handleTypeChange(e.target.value)} className={inputClass}>
                      <option value="">Select insurance type</option>
                      {insuranceTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  {/* Dynamic Fields by Insurance Type */}
                  {form.type && fields.length > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-4 pt-1">
                      <div className="flex items-center gap-2 pb-1 border-b border-border">
                        <FileText size={14} className="text-golden" />
                        <span className="text-sm font-bold text-foreground">{form.type} Details</span>
                      </div>
                      {fields.map((field) => (
                        <div key={field.key}>
                          <label className="block text-sm font-semibold mb-1.5">{field.label}</label>
                          {field.type === "select" ? (
                            <select
                              value={dynamicFields[field.key] || ""}
                              onChange={(e) => updateDynamic(field.key, e.target.value)}
                              className={inputClass}
                            >
                              <option value="">Select {field.label.replace(" *", "")}</option>
                              {field.options?.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={field.type === "number" ? "number" : "text"}
                              inputMode={field.type === "number" ? "numeric" : "text"}
                              value={dynamicFields[field.key] || ""}
                              onChange={(e) => updateDynamic(field.key, e.target.value, field.transform)}
                              placeholder={field.placeholder}
                              className={`${inputClass} ${field.type === "number" ? "tabular-nums" : ""}`}
                              maxLength={field.maxLength}
                            />
                          )}
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {/* Additional Notes */}
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Additional Details</label>
                    <textarea value={form.message} onChange={(e) => update("message", e.target.value)} rows={2} placeholder="Any special requirements or notes..." className={`${inputClass} resize-none`} maxLength={500} />
                  </div>

                  {/* Documents with Individual Upload */}
                  {form.type && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="pt-1">
                      <div className="flex items-center gap-2 pb-2 border-b border-border mb-3">
                        <FileText size={14} className="text-golden" />
                        <span className="text-sm font-bold text-foreground">Required Documents — {form.type}</span>
                        {totalDocFiles > 0 && (
                          <span className="ml-auto text-[11px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">{totalDocFiles} uploaded</span>
                        )}
                      </div>
                      <div className="space-y-0">
                        {docs.map((doc) => {
                          const file = docFiles[doc];
                          return (
                            <div key={doc} className="flex items-center gap-2 py-2.5 border-b border-border/50 last:border-0">
                              <span className="text-xs text-muted-foreground flex-1 min-w-0 truncate">• {doc}</span>
                              {file ? (
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  <span className="text-[10px] text-success font-medium max-w-[120px] truncate" title={file.name}>
                                    ✓ {file.name}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removeDoc(doc)}
                                    className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors flex-shrink-0"
                                    title="Remove"
                                  >
                                    <X size={12} className="text-destructive" />
                                  </button>
                                  <label className="w-6 h-6 rounded-full bg-golden/10 flex items-center justify-center hover:bg-golden/20 transition-colors cursor-pointer flex-shrink-0" title="Replace">
                                    <Upload size={11} className="text-golden" />
                                    <input type="file" accept=".jpg,.jpeg,.png,.pdf,.webp" className="hidden"
                                      onChange={(e) => {
                                        const f = e.target.files?.[0] || null;
                                        if (f) handleDocUpload(doc, f);
                                      }}
                                    />
                                  </label>
                                </div>
                              ) : (
                                <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-dashed border-golden/40 text-[11px] font-semibold text-golden cursor-pointer hover:bg-golden/10 hover:border-golden/60 transition-colors flex-shrink-0">
                                  <Upload size={12} /> Upload
                                  <input type="file" accept=".jpg,.jpeg,.png,.pdf,.webp" className="hidden"
                                    onChange={(e) => {
                                      const f = e.target.files?.[0] || null;
                                      if (f) handleDocUpload(doc, f);
                                    }}
                                  />
                                </label>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* Submit */}
                  <button type="submit" className="btn-accent w-full flex items-center justify-center gap-2 !py-3.5 hover:scale-[1.02] transition-transform rounded-lg mt-2">
                    <Send size={18} /> Proceed to Pay ₹{INSURANCE_FEE}
                  </button>

                  {/* Compliance Footer */}
                  <div className="pt-3 border-t border-border">
                    <p className="text-[10px] text-center text-muted-foreground leading-relaxed">
                      Insurance facilitated by <strong>Dipali Sandeep Mahajan</strong> (ICICI Lombard) & <strong>Sandeep Shrikant Mahajan</strong> (IRDAI Authorized Insurance Advisor – Turtlemint).
                      <br />Quotes sourced from ICICI Lombard and 25+ IRDAI-registered insurers. Insurance is subject to terms and conditions of the respective insurance company.
                    </p>
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </section>
    </>
  );
};

export default InsuranceQuote;
