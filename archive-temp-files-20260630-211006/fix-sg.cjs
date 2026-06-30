const fs = require("fs");
const p = "D:\\mahajan-finance-suite-main cashflow added\\src\\components\\ServicesGrid.tsx";

const code = `\
"use client";

import { useState, useRef, useCallback } from "react";
import { uploadDocsToStorage } from '@/utils/uploadDocs';
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Send, Upload, ChevronDown, ChevronUp, FileText, CheckCircle2,
  X, CreditCard, IndianRupee, Clock, ShieldCheck, User, MapPin,
  Mail, Phone, UtensilsCrossed, Factory, FileCheck, Receipt,
  Globe, Building2, Users, Landmark, Shield, Briefcase,
  GraduationCap, Car, Heart, Wifi, Smartphone, Stamp,
} from "lucide-react";

const inputClass = "w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60";
const autoCapital = (v) => v.replace(/\\b\\w/g, (c) => c.toUpperCase());

function Storefront(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
      <path d="M2 7h20" />
      <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" />
    </svg>
  );
}

const cscServices = [
  { key: "pan-card", title: "PAN Card", price: 250, icon: FileText, color: "text-blue-600", subtitle: "New / Correction / Duplicate - NSDL/UTIITSL", requiredDocs: ["Aadhaar Card", "Date of Birth Proof", "Passport Size Photo"] },
  { key: "aadhaar", title: "Aadhaar Services", price: 100, icon: User, color: "text-green-600", subtitle: "Update / Enrollment / Print - UIDAI", requiredDocs: ["Aadhaar Card", "Mobile Number Linked with Aadhaar", "Passport Size Photo"] },
  { key: "shop-act", title: "Shop Act License", price: 1500, icon: Storefront, color: "text-emerald-600", subtitle: "Gumasta License - Municipal Corporation", requiredDocs: ["Aadhaar Card", "Rent Agreement / Ownership Proof", "Passport Size Photo", "NOC from Landlord"] },
  { key: "gst", title: "GST Registration", price: 2000, icon: Receipt, color: "text-violet-600", subtitle: "New GSTIN - State / Central GST", requiredDocs: ["Aadhaar Card", "PAN Card", "Business Address Proof", "Bank Account Details", "Passport Size Photo", "Business Registration Certificate"] },
  { key: "fssai", title: "Food License (FSSAI)", price: 3000, icon: UtensilsCrossed, color: "text-orange-600", subtitle: "Basic / State / Central License", requiredDocs: ["Aadhaar Card", "PAN Card", "Business Address Proof", "Food Safety Plan", "Passport Size Photo", "NOC from FSSAI (if applicable)"] },
  { key: "udyam", title: "Udyam / MSME", price: 500, icon: Factory, color: "text-amber-600", subtitle: "Udyam Registration - MSME Certificate", requiredDocs: ["Aadhaar Card", "PAN Card", "Business Address Proof", "Bank Account Details"] },
  { key: "itr", title: "ITR Filing (Salaried)", price: 499, icon: FileCheck, color: "text-cyan-600", subtitle: "Income Tax Return - AY 2025-26", requiredDocs: ["Form 16 / 16A", "Aadhaar Card", "PAN Card", "Bank Statements", "Investment Proofs (80C/80D)"] },
  { key: "dsc", title: "Digital Signature (DSC)", price: 1500, icon: Shield, color: "text-indigo-600", subtitle: "Class 3 DGFT / MCA Digital Signature", requiredDocs: ["Aadhaar Card", "PAN Card", "Passport Size Photo", "Mobile Number", "Email ID"] },
  { key: "iec", title: "Import/Export Code (IEC)", price: 2000, icon: Globe, color: "text-teal-600", subtitle: "DGFT IEC Code for International Trade", requiredDocs: ["Aadhaar Card", "PAN Card", "Business Address Proof", "Bank Account Details", "Passport Size Photo"] },
  { key: "trade-license", title: "Trade License", price: 1000, icon: Building2, color: "text-rose-600", subtitle: "Municipal Corporation Trade License", requiredDocs: ["Aadhaar Card", "Rent Agreement / Ownership Proof", "Passport Size Photo", "NOC from Landlord", "Business Registration Proof"] },
  { key: "passport", title: "Passport Assistance", price: 2500, icon: Briefcase, color: "text-blue-700", subtitle: "New / Renewal - Passport Seva Kendra", requiredDocs: ["Aadhaar Card", "PAN Card", "Date of Birth Proof", "Address Proof", "Passport Size Photos (2)"] },
  { key: "income-cert", title: "Income Certificate", price: 300, icon: FileText, color: "text-green-700", subtitle: "Tahsil / Collector Office", requiredDocs: ["Aadhaar Card", "Ration Card", "Salary Slip / Income Proof", "Self Declaration"] },
  { key: "caste-cert", title: "Caste Certificate", price: 300, icon: Users, color: "text-purple-600", subtitle: "SC/ST/OBC Certificate - Tahsil Office", requiredDocs: ["Aadhaar Card", "Father/Mother Caste Certificate", "Ration Card", "School Leaving Certificate", "Self Declaration"] },
  { key: "domicile", title: "Domicile Certificate", price: 300, icon: Landmark, color: "text-stone-600", subtitle: "Residence / Domicile Proof", requiredDocs: ["Aadhaar Card", "Ration Card", "Address Proof", "Passport Size Photo", "Self Declaration"] },
  { key: "society", title: "Society / Trust Registration", price: 3000, icon: Users, color: "text-pink-600", subtitle: "Societies Act / Trust Registration", requiredDocs: ["Aadhaar Card (all members)", "PAN Card (all members)", "Address Proof of Registered Office", "MOA and AOA Draft", "Passport Size Photos (all members)"] },
  { key: "trademark", title: "Trademark Registration", price: 1999, icon: Stamp, color: "text-violet-700", subtitle: "Brand / Logo Trademark - MCA", requiredDocs: ["Trademark Logo / Image", "PAN Card", "Business Address Proof", "MSME Certificate (if any)", "First Use Date Proof"] },
  { key: "pf-esi", title: "PF / ESIC Registration", price: 2000, icon: ShieldCheck, color: "text-sky-600", subtitle: "EPFO and ESIC Employee Registration", requiredDocs: ["PAN Card of Business", "Business Registration Certificate", "Bank Account Details", "Address Proof", "List of Employees"] },
  { key: "prof-tax", title: "Professional Tax Registration", price: 500, icon: Receipt, color: "text-lime-600", subtitle: "State Professional Tax Enrollment", requiredDocs: ["PAN Card", "Aadhaar Card", "Business Address Proof", "Bank Account Details", "Registration Certificate"] },
  { key: "driving", title: "Driving License", price: 500, icon: Car, color: "text-red-600", subtitle: "New / Renewal - RTO", requiredDocs: ["Aadhaar Card", "Address Proof", "Date of Birth Proof", "Medical Certificate", "Passport Size Photos (2)", "Learning License (if renewal)"] },
  { key: "voter-id", title: "Voter ID / Election Card", price: 100, icon: Heart, color: "text-orange-700", subtitle: "New / Correction - Election Commission", requiredDocs: ["Aadhaar Card", "Address Proof", "Date of Birth Proof", "Passport Size Photo"] },
];

const ServicesGrid = () => {
  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-extrabold font-display text-foreground">All Government and Legal Services</h2>
        <p className="mt-2 text-muted-foreground">Quick, affordable, and trusted - 20+ services available</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch">
        {cscServices.map((service, index) => (
          <ServiceCard key={service.key} service={service} index={index} />
        ))}
      </div>
    </div>
  );
};

const ServiceCard = ({ service, index }) => {
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState({ name: "", mobile: "", city: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState({});
  const docInputRefs = useRef({});

  const Icon = service.icon;
  const totalDocs = service.requiredDocs.length;
  const uploadedCount = Object.values(uploadedDocs).filter((f) => f !== null).length;

  const handleDocSelect = useCallback((docName, file) => {
    if (file) {
      const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
      if (!allowed.includes(file.type)) { toast.error(docName + ": Only JPG, PNG, or PDF allowed"); return; }
      if (file.size > 5 * 1024 * 1024) { toast.error(docName + ": File must be under 5 MB"); return; }
    }
    setUploadedDocs((prev) => ({ ...prev, [docName]: file }));
  }, []);

  const removeDoc = useCallback((docName) => {
    setUploadedDocs((prev) => ({ ...prev, [docName]: null }));
    const inputEl = docInputRefs.current[docName];
    if (inputEl) inputEl.value = "";
  }, []);

  const submitForm = async (paymentId) => {
    if (!form.name.trim()) { toast.error("Please enter your full name"); return; }
    if (!/^[6-9]\\d{9}$/.test(form.mobile)) { toast.error("Enter a valid 10-digit Indian mobile number"); return; }
    if (!form.city.trim()) { toast.error("Please enter your city"); return; }
    setLoading(true);
    const details = { "Full Name": form.name, "Mobile": form.mobile, "City": form.city, "Source": "CSC Services Portal" };
    if (form.email.trim()) details["Email"] = form.email;
    if (paymentId) details["Payment ID"] = paymentId;
    details["Amount"] = "Rs " + service.price.toLocaleString("en-IN");
    details["Documents Uploaded"] = uploadedCount + "/" + totalDocs;
    service.requiredDocs.forEach((d) => { details[d] = uploadedDocs[d] ? "Uploaded: " + uploadedDocs[d].name : "Not uploaded"; });
    try {
      const docFilesArr = Object.values(uploadedDocs).filter((f) => f instanceof File);
      let docUrls = [];
      if (docFilesArr.length > 0) { docUrls = await uploadDocsToStorage(supabase, docFilesArr, "CSC"); }
      await supabase.functions.invoke("send-enquiry-email", {
        body: { serviceName: service.title + " - CSC Application", customerName: form.name, customerMobile: form.mobile, details: details, documentUrls: docUrls, priorityEmails: ["sandeepmahajan9@gmail.com", "info@mahajanfinance.com"] },
      });
      toast.success("Application submitted! We will contact you shortly.");
      setSubmitted(true);
    } catch (err) { console.error("Submission failed", err); toast.error("Something went wrong. Please try again or call us."); }
    setLoading(false);
  };

  const handlePayment = async () => {
    if (!form.name.trim()) { toast.error("Please enter your full name"); return; }
    if (!/^[6-9]\\d{9}$/.test(form.mobile)) { toast.error("Enter a valid 10-digit Indian mobile number"); return; }
    if (!form.city.trim()) { toast.error("Please enter your city"); return; }
    setLoading(true);
    try {
      const rzpKey = (typeof window !== "undefined" && window.NEXT_PUBLIC_RAZORPAY_KEY_ID) || "";
      if (!rzpKey) { toast.error("Payment not configured. Please call us directly."); setLoading(false); return; }
      const options = {
        key: rzpKey, amount: service.price * 100, currency: "INR",
        name: "Mahajan Finance", description: service.title + " - CSC Service", image: "/logo.png",
        handler: async (response) => {
          toast.success("Payment of Rs " + service.price + " received!");
          await submitForm(response.razorpay_payment_id);
        },
        prefill: { name: form.name, contact: form.mobile },
        theme: { color: "#1e3a5f" },
        modal: { ondismiss: function() { setLoading(false); } },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Razorpay error", err);
      toast.error("Payment error. Please try again or call us.");
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-2xl border-2 border-emerald-300 shadow-lg p-6 flex flex-col items-center justify-center text-center min-h-[320px]">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center mb-4 shadow-md">
          <CheckCircle2 className="text-white" size={32} />
        </div>
        <h3 className="text-lg font-extrabold font-display text-foreground mb-1">Application Submitted!</h3>
        <p className="text-sm text-muted-foreground mb-4">{service.title} - We will call you within 30 minutes</p>
        <a href="tel:+919730540215" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-bold text-sm hover:scale-[1.03] transition-transform">
          <Phone size={14} /> Call: 9730540215
        </a>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.03, duration: 0.3 }}
      className={"bg-card rounded-2xl border-2 shadow-sm flex flex-col transition-all duration-200 " + (expanded ? "border-golden/60 shadow-lg ring-1 ring-golden/20 col-span-1 sm:col-span-2 lg:col-span-2 xl:col-span-2" : "border-border hover:border-golden/30 hover:shadow-md")}
    >
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between gap-3 p-4 sm:p-5 text-left hover:bg-muted/20 transition-colors rounded-t-2xl">
        <div className="flex items-center gap-3 min-w-0">
          <div className={"shrink-0 w-10 h-10 rounded-xl bg-muted/70 flex items-center justify-center " + service.color}>
            <Icon size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold font-display text-foreground text-sm sm:text-base leading-tight truncate">{service.title}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-extrabold text-golden flex items-center gap-0.5">
                <IndianRupee size={11} className="text-golden" />{service.price.toLocaleString("en-IN")}
              </span>
              <span className="text-[10px] text-muted-foreground hidden sm:inline">{service.subtitle.split("-")[0]?.trim()}</span>
            </div>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {!expanded && (<span className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold">Apply &#x2192;</span>)}
          {expanded ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-border/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: autoCapital(e.target.value) })} placeholder="FULL NAME *" className={inputClass + " pl-9"} />
                </div>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="tel" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\\D/g, "").slice(0, 10) })} placeholder="MOBILE *" className={inputClass + " pl-9 tabular-nums"} />
                </div>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: autoCapital(e.target.value) })} placeholder="CITY *" className={inputClass + " pl-9"} />
                </div>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="EMAIL (optional)" className={inputClass + " pl-9"} />
                </div>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <FileCheck size={15} className="text-golden" /> Required Documents
                  </h4>
                  <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{uploadedCount}/{totalDocs} uploaded</span>
                </div>
                <div className="space-y-2">
                  {service.requiredDocs.map((doc, idx) => {
                    const hasFile = uploadedDocs[doc] instanceof File;
                    return (
                      <div key={doc} className="flex items-center gap-3 p-2.5 rounded-xl border bg-muted/20 border-border/60 hover:border-golden/30 transition-colors">
                        <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{doc}</p>
                          {hasFile ? (<p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5"><CheckCircle2 size={10} /> {uploadedDocs[doc].name}</p>) : (<p className="text-[11px] text-muted-foreground mt-0.5">JPG, PNG, PDF (max 5 MB)</p>)}
                        </div>
                        <div className="shrink-0">
                          <input ref={(el) => { docInputRefs.current[doc] = el; }} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" className="hidden" onChange={(e) => { handleDocSelect(doc, e.target.files?.[0] || null); }} />
                          {hasFile ? (
                            <button onClick={() => removeDoc(doc)} className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors border border-red-200"><X size={11} /> Remove</button>
                          ) : (
                            <button onClick={() => docInputRefs.current[doc]?.click()} className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-golden/10 text-golden text-xs font-semibold hover:bg-golden/20 transition-colors border border-golden/30"><Upload size={11} /> Upload</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5">
                <button onClick={handlePayment} disabled={loading} className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:scale-[1.01] active:scale-[0.99] transition-transform disabled:opacity-60 disabled:cursor-not-allowed">
                  <CreditCard size={16} />{loading ? "Processing..." : "Pay Rs " + service.price.toLocaleString("en-IN") + " & Apply"}
                </button>
              </div>

              <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><ShieldCheck size={12} /> Secure Razorpay</span>
                <span className="flex items-center gap-1"><Clock size={12} /> 30 Min Response</span>
                <span className="flex items-center gap-1"><CheckCircle2 size={12} /> 5000+ Done</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ServicesGrid;
`;

fs.writeFileSync(p, code, "utf8");
console.log("Done: " + code.split("\\n").length + " lines");
