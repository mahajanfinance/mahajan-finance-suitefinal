import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Send, TrendingUp, ChevronDown, ChevronUp, Download, CheckCircle2, Upload } from "lucide-react";
import { generateInvestmentTipsPDF } from "@/lib/investmentTipsPdf";
import RazorpayButton from "@/components/RazorpayButton";
import { supabase } from "@/integrations/supabase/client";

const autoCapital = (v: string) => v.toUpperCase();
const inputClass = "w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-golden/30 focus:border-golden transition-all uppercase";

const InputField = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div>
    <label className="block text-sm font-semibold text-foreground mb-1.5">{label} {required && <span className="text-destructive">*</span>}</label>
    {children}
  </div>
);

const investmentServices = [
  { key: "sip", icon: "💰", label: "SIP", desc: "Start with ₹500/month" },
  { key: "mutual", icon: "📊", label: "Mutual Funds", desc: "Equity / Debt / Hybrid" },
  { key: "ulip", icon: "🛡️", label: "ULIP Plans", desc: "Insurance + Investment" },
  { key: "fd", icon: "🏦", label: "Fixed Deposit", desc: "Guaranteed returns" },
  { key: "stock", icon: "📈", label: "Stock Market", desc: "Basic advisory" },
  { key: "child", icon: "👶", label: "Child Future", desc: "Secure their future" },
  { key: "retirement", icon: "🧓", label: "Retirement", desc: "Plan golden years" },
  { key: "lumpsum", icon: "💎", label: "Lump Sum", desc: "One-time investment" },
  { key: "goal", icon: "🏠", label: "Goal-Based", desc: "House / Marriage" },
];

const requiredDocs = ["PAN Card", "Aadhaar Card", "Bank Details", "Income Proof (Optional)", "Existing Investment Statement"];

/* ===== SIP Calculator ===== */
const SIPCalculator = () => {
  const [monthly, setMonthly] = useState(5000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(10);
  const totalInvested = monthly * years * 12;
  const r = rate / 100 / 12;
  const n = years * 12;
  const futureValue = r > 0 ? monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r) : totalInvested;
  const wealth = futureValue - totalInvested;
  return (
    <div className="space-y-4">
      <h4 className="font-bold text-foreground text-center">📊 SIP Calculator</h4>
      <InputField label={`Monthly Investment: ₹${monthly.toLocaleString("en-IN")}`}>
        <input type="range" min={500} max={100000} step={500} value={monthly} onChange={e => setMonthly(+e.target.value)} className="w-full accent-golden" />
      </InputField>
      <InputField label={`Expected Return: ${rate}% p.a.`}>
        <input type="range" min={1} max={30} step={0.5} value={rate} onChange={e => setRate(+e.target.value)} className="w-full accent-golden" />
      </InputField>
      <InputField label={`Duration: ${years} Years`}>
        <input type="range" min={1} max={30} step={1} value={years} onChange={e => setYears(+e.target.value)} className="w-full accent-golden" />
      </InputField>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="p-3 bg-slate-50 rounded-lg border"><p className="text-xs text-muted-foreground">Invested</p><p className="font-extrabold text-primary tabular-nums">₹{totalInvested.toLocaleString("en-IN")}</p></div>
        <div className="p-3 bg-slate-50 rounded-lg border"><p className="text-xs text-muted-foreground">Wealth Gained</p><p className="font-extrabold text-golden tabular-nums">₹{Math.round(wealth).toLocaleString("en-IN")}</p></div>
        <div className="p-3 bg-slate-50 rounded-lg border"><p className="text-xs text-muted-foreground">Total Value</p><p className="font-extrabold text-green-600 tabular-nums">₹{Math.round(futureValue).toLocaleString("en-IN")}</p></div>
      </div>
    </div>
  );
};

const Investments = () => {
  const [form, setForm] = useState<Record<string, string>>({});
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, File | null>>({});
  const [showPayment, setShowPayment] = useState(false);
  const [feeAmount, setFeeAmount] = useState(499);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const u = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  const handleDocUpload = (docName: string, file: File | null) => {
    setUploadedDocs(prev => ({ ...prev, [docName]: file }));
    if (file) toast.success(`${docName} attached successfully!`);
  };

  const handleSubmit = () => {
    if (!form.name || !form.mobile || !form.city) { toast.error("Please fill Name, Mobile & City"); return; }
    if (!/^[6-9]\d{9}$/.test(form.mobile)) { toast.error("Enter valid 10-digit mobile"); return; }
    setShowPayment(true);
  };

  const handleAfterPayment = async (paymentId: string) => {
    setLoading(true);
    try {
      await supabase.functions.invoke("send-enquiry-email", {
        body: {
          serviceName: "Investment Enquiry - " + (form.investmentType || "General"),
          customerName: form.name,
          customerMobile: form.mobile,
          details: {
            City: form.city, Email: form.email || "N/A", "Investment Type": form.investmentType || "N/A",
            "Investment Amount": form.investAmount ? "Rs." + form.investAmount : "N/A",
            "Risk Appetite": form.riskAppetite || "N/A", "Duration": form.duration || "N/A",
          },
          paymentInfo: "Paid Rs." + feeAmount + " - Payment ID: " + paymentId,
          priorityEmails: ["sandeepmahajan9@gmail.com", "info@mahajanfinance.com"],
        },
      });
      toast.success("Enquiry submitted! Emails sent.");
    } catch (e) {
      console.error("Email failed", e);
      toast.error("Submission failed. Please contact manually.");
    }
    setSubmitted(true);
    setShowPayment(false);
    setLoading(false);
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 py-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute inset-0" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px'}}></div>
          <div className="absolute top-[-30%] left-[-10%] w-[600px] h-[600px] bg-golden/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-[-30%] right-[-10%] w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container text-center relative z-10">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{duration: 0.5}} className="text-4xl md:text-6xl font-extrabold text-white font-display tracking-tight drop-shadow-lg">
            Smart Investment Solutions
          </motion.h1>
          <p className="mt-4 text-blue-200/90 text-lg max-w-2xl mx-auto">Start your journey towards financial freedom with expert guidance from Mahajan Finance.</p>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { generateInvestmentTipsPDF(form.name || "Valued Customer"); toast.success("📥 Top 10 Investment Tips PDF downloaded!"); }}
            className="mt-8 relative inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-golden to-yellow-500 text-slate-900 font-extrabold text-base shadow-[0_0_25px_rgba(234,179,8,0.5)] hover:shadow-[0_0_35px_rgba(234,179,8,0.7)] transition-all"
          >
            <Download size={20} className="animate-bounce" /> Free Download: Top 10 Investment Tips PDF
          </motion.button>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 bg-slate-50">
        <div className="container max-w-6xl">
          
          {/* Services Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-14">
            {investmentServices.map((s, i) => (
              <motion.div key={s.key} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-slate-100 p-6 text-center cursor-pointer hover:shadow-xl hover:border-golden/50 hover:scale-[1.03] transition-all group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-golden/0 to-golden/0 group-hover:from-golden/5 group-hover:to-yellow-500/5 transition-all"></div>
                <span className="text-4xl block mb-3 group-hover:scale-110 transition-transform relative z-10">{s.icon}</span>
                <h3 className="font-extrabold text-slate-800 relative z-10">{s.label}</h3>
                <p className="text-sm text-slate-500 mt-1 relative z-10">{s.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* SIP Calculator */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-white rounded-2xl border-2 border-golden/20 p-8 shadow-sm mb-14 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-golden/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <SIPCalculator />
          </motion.div>

          {/* Enquiry Form */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xl shadow-slate-100 relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-50/30 pointer-events-none"></div>
            
            <h2 className="text-2xl font-extrabold font-display text-slate-800 text-center mb-8 relative z-10">📈 Investment Enquiry Form</h2>

            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 p-10 text-center shadow-xl overflow-hidden">
                  <CheckCircle2 size={80} className="text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-extrabold font-display text-slate-800">Greetings from Mahajan Finance!</h3>
                  <p className="text-slate-600 mt-2">Dear <strong>{form.name}</strong>, your enquiry is received.</p>
                  <p className="text-slate-500 text-sm mt-1">Our expert will call you within 24 hours on <strong>{form.mobile}</strong>.</p>
                  <p className="text-xs text-slate-400 mt-4">- Sandeep Mahajan | 9730540215 | PAN India Service</p>
                  <button onClick={() => { setSubmitted(false); setShowPayment(false); }} className="mt-6 px-8 py-3 rounded-full bg-slate-800 text-white font-bold text-sm hover:bg-slate-700 transition-colors">New Enquiry</button>
                </motion.div>
              ) : showPayment ? (
                <motion.div key="payment" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center space-y-6 relative z-10 py-10">
                  <h3 className="text-xl font-bold text-slate-800">💳 Investment Consultation Fee</h3>
                  <div className="flex justify-center gap-4">
                    {[199, 499, 999].map(a => (
                      <button key={a} onClick={() => setFeeAmount(a)}
                        className={`px-6 py-3 rounded-xl text-sm font-bold border-2 transition-all ${feeAmount === a ? "bg-golden text-slate-900 border-golden shadow-lg shadow-golden/30" : "border-slate-200 text-slate-600 hover:border-golden"}`}>
                        ₹{a}{a === 499 ? " ⭐" : ""}
                      </button>
                    ))}
                  </div>
                  <RazorpayButton
                    amount={feeAmount}
                    label={`Pay ₹${feeAmount} & Submit`}
                    description="Investment Fee"
                    notes={{ name: form.name, mobile: form.mobile }}
                    prefill={{ name: form.name, contact: form.mobile }}
                    onSuccess={handleAfterPayment}
                  />
                  <button onClick={() => setShowPayment(false)} className="text-sm text-slate-500 hover:text-slate-800 font-medium">← Back to form</button>
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5 relative z-10">
                  <div className="grid md:grid-cols-2 gap-5">
                    <InputField label="Full Name" required><input value={form.name || ""} onChange={e => u("name", autoCapital(e.target.value))} placeholder="FULL NAME" className={inputClass} /></InputField>
                    <InputField label="Mobile Number" required><input value={form.mobile || ""} onChange={e => u("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit mobile" className={`${inputClass} tabular-nums`} /></InputField>
                  </div>
                  <div className="grid md:grid-cols-2 gap-5">
                    <InputField label="City / Location" required><input value={form.city || ""} onChange={e => u("city", autoCapital(e.target.value))} placeholder="YOUR CITY" className={inputClass} /></InputField>
                    <InputField label="Email ID"><input type="email" value={form.email || ""} onChange={e => u("email", e.target.value)} placeholder="email@example.com" className={inputClass} /></InputField>
                  </div>
                  <div className="grid md:grid-cols-2 gap-5">
                    <InputField label="Investment Type">
                      <select value={form.investmentType || ""} onChange={e => u("investmentType", e.target.value)} className={inputClass}>
                        <option value="">Select</option>
                        {["SIP", "Lump Sum", "Retirement", "Child Plan", "Tax Saving", "Wealth Creation"].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </InputField>
                    <InputField label="Investment Amount">
                      <input type="number" value={form.investAmount || ""} onChange={e => u("investAmount", e.target.value)} placeholder="₹ Amount" className={`${inputClass} tabular-nums`} />
                    </InputField>
                  </div>

                  {/* Document Upload Section */}
                  <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
                    <h4 className="font-extrabold text-slate-800 mb-4 flex items-center gap-2">📑 Required Documents</h4>
                    <div className="space-y-3">
                      {requiredDocs.map(d => (
                        <div key={d} className="flex items-center justify-between gap-4 p-3 bg-white rounded-lg border border-slate-100 hover:border-golden/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <span className="text-primary text-lg">📄</span>
                            <span className="text-sm font-medium text-slate-700">{d}</span>
                          </div>
                          <div className="flex-shrink-0">
                            <input 
                              type="file" 
                              id={`doc-${d}`} 
                              className="hidden" 
                              accept="image/*,.pdf"
                              onChange={(e) => handleDocUpload(d, e.target.files?.[0] || null)}
                            />
                            <label 
                              htmlFor={`doc-${d}`}
                              className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
                                uploadedDocs[d] 
                                  ? 'bg-green-50 text-green-700 border-green-200' 
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-golden/10 hover:text-golden hover:border-golden'
                              }`}
                            >
                              <Upload size={14} />
                              {uploadedDocs[d] ? 'Attached ✓' : 'Upload'}
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.02 }} 
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit} 
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-base font-extrabold bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <TrendingUp size={18} /> Proceed to Apply
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Lead Magnet */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mt-12 bg-gradient-to-r from-slate-900 to-indigo-900 rounded-2xl p-8 text-center shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px'}}></div>
            <div className="relative z-10">
              <span className="text-5xl">🎁</span>
              <h3 className="text-2xl font-extrabold text-white mt-4">Free Investment Guide</h3>
              <p className="text-blue-200 mb-6">"Top 10 Investment Tips for Beginners" by Mahajan Finance</p>
              <div className="max-w-sm mx-auto space-y-3">
                <input value={form.guideName || ""} onChange={e => u("guideName", autoCapital(e.target.value))} placeholder="YOUR NAME" className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-golden focus:outline-none" />
                <input value={form.guideMobile || ""} onChange={e => u("guideMobile", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="MOBILE NUMBER" className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-golden focus:outline-none tabular-nums" />
                <button onClick={() => {
                  if (!form.guideName || !form.guideMobile) { toast.error("Enter Name & Mobile"); return; }
                  generateInvestmentTipsPDF(form.guideName);
                  toast.success("📥 PDF Downloaded! WhatsApp message opening...");
                  window.open(`https://wa.me/919730540215?text=${encodeURIComponent(`Hi, I downloaded the Free Investment Guide.\nName: ${form.guideName}\nMobile: ${form.guideMobile}`)}`, "_blank");
                }} className="w-full py-3 rounded-lg bg-golden text-slate-900 font-extrabold hover:shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-all">
                  📥 Download Free Guide
                </button>
              </div>
            </div>
          </motion.div>

          {/* Trust badges */}
          <div className="mt-12 grid grid-cols-3 gap-6 text-center">
            {[
              { icon: "💰", label: "Start with ₹500" },
              { icon: "📊", label: "Expert Guidance" },
              { icon: "🔒", label: "Secure & Trusted" },
            ].map(b => (
              <div key={b.label} className="p-5 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-golden/30 transition-all">
                <span className="text-3xl">{b.icon}</span>
                <p className="text-sm font-bold text-slate-700 mt-2">{b.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Investments;