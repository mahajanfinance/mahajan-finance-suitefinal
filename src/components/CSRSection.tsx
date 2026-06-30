import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeartHandshake, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import RazorpayButton from "./RazorpayButton";

const autoCapital = (v: string) => v.toUpperCase();
const inputClass = "w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all uppercase";
const DONATE_AMOUNTS = [101, 251, 501, 1001, 2100];

const CSRSection = () => {
  const [showDonate, setShowDonate] = useState(false);
  const [donateForm, setDonateForm] = useState<Record<string, string>>({});
  const [showPaymentQR, setShowPaymentQR] = useState(false);
  const [amount, setAmount] = useState<number>(501);

  const u = (k: string, v: string) => setDonateForm(p => ({ ...p, [k]: v }));

  const handleDonateSubmit = () => {
    if (!donateForm.name || !donateForm.mobile || !donateForm.city) {
      toast.error("Please fill Name, Mobile & Location");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(donateForm.mobile)) {
      toast.error("Enter valid 10-digit mobile");
      return;
    }
    setShowPaymentQR(true);
  };

  const handleAfterDonation = (paymentId: string) => {
    const msg = encodeURIComponent(
      `🙏 New Donation Received\nName: ${donateForm.name}\nMobile: ${donateForm.mobile}\nLocation: ${donateForm.city}\nAmount: ₹${amount}\nPayment ID: ${paymentId}`
    );
    window.open(`https://wa.me/919730540215?text=${msg}`, "_blank");
    toast.success(`🙏 Heartfelt Thanks, ${donateForm.name}! Your support means a lot.`);
    setShowDonate(false);
    setShowPaymentQR(false);
    setDonateForm({});
  };

  return (
    <section className="py-14 bg-gradient-to-b from-background to-primary/5">
      <div className="container max-w-5xl">
        <motion.h2 initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-2xl md:text-3xl font-extrabold text-center font-display text-foreground mb-8 hover:text-golden transition-colors cursor-default">
          🏛️ Social Responsibility & Education
        </motion.h2>
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-card rounded-xl border-2 border-golden/30 p-6 hover:shadow-xl hover:border-golden transition-all hover:-translate-y-1"
            style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}>
            <div className="flex items-center gap-3 mb-4">
              <HeartHandshake size={28} className="text-golden" />
              <h3 className="font-bold font-display text-foreground text-lg">Kay Kawe Kailas Foundation</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">"Service to humanity is service to God"</p>
            <ul className="space-y-1.5 text-sm text-foreground mb-5">
              {["Social welfare initiatives", "Education support", "Financial awareness programs", "Rural development"].map(i => (
                <li key={i} className="flex items-center gap-2"><span className="text-golden">•</span>{i}</li>
              ))}
            </ul>

            <AnimatePresence mode="wait">
              {!showDonate ? (
                <motion.div key="btn" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <button onClick={() => setShowDonate(true)}
                    className="btn-accent w-full flex items-center justify-center gap-2 !py-3 rounded-lg hover:scale-[1.02] transition-transform">
                    <HeartHandshake size={16} /> Donate Now 🙏
                  </button>
                </motion.div>
              ) : showPaymentQR ? (
                <motion.div key="rzp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center space-y-3">
                  <p className="font-bold text-foreground text-sm">💝 Choose donation amount</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {DONATE_AMOUNTS.map(a => (
                      <button key={a} onClick={() => setAmount(a)}
                        className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition-all ${amount === a ? "bg-golden text-golden-foreground border-golden" : "border-border text-foreground hover:border-golden"}`}>
                        ₹{a}
                      </button>
                    ))}
                  </div>
                  <RazorpayButton
                    amount={amount}
                    label={`🙏 Donate ₹${amount} Securely`}
                    description="Kay Kawe Kailas Foundation Donation"
                    notes={{ name: donateForm.name, mobile: donateForm.mobile, city: donateForm.city, purpose: "Donation" }}
                    prefill={{ name: donateForm.name, contact: donateForm.mobile }}
                    onSuccess={handleAfterDonation}
                  />
                  <button onClick={() => { setShowPaymentQR(false); setShowDonate(false); }} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                  <input value={donateForm.name || ""} onChange={e => u("name", autoCapital(e.target.value))} placeholder="YOUR NAME *" className={inputClass} />
                  <input value={donateForm.mobile || ""} onChange={e => u("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="MOBILE NUMBER *" className={`${inputClass} tabular-nums`} />
                  <input value={donateForm.city || ""} onChange={e => u("city", autoCapital(e.target.value))} placeholder="LOCATION *" className={inputClass} />
                  <button onClick={handleDonateSubmit} className="btn-accent w-full !py-3 rounded-lg hover:scale-[1.02] transition-transform">
                    Proceed to Payment 🙏
                  </button>
                  <button onClick={() => setShowDonate(false)} className="text-xs text-muted-foreground hover:text-foreground w-full text-center">Cancel</button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="bg-card rounded-xl border-2 border-border p-6 hover:shadow-xl hover:border-golden transition-all relative overflow-hidden hover:-translate-y-1"
            style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}>
            <span className="absolute top-3 right-3 bg-golden text-golden-foreground text-xs font-bold px-3 py-1 rounded-full animate-pulse">Coming Soon</span>
            <div className="flex items-center gap-3 mb-4">
              <GraduationCap size={28} className="text-primary" />
              <h3 className="font-bold font-display text-foreground text-lg">🎓 Bal Sanskar Gurukul</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Value-based Pre-School Education</p>
            <ul className="space-y-1.5 text-sm text-foreground">
              {["संस्कार + Education", "Activity-based learning", "Moral & cultural development", "Building future leaders"].map(i => (
                <li key={i} className="flex items-center gap-2"><span className="text-primary">•</span>{i}</li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CSRSection;
