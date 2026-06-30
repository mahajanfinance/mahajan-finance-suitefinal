import { useState } from "react";
import { Check, ArrowRight, Send, CheckCircle2, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import RazorpayButton from "@/components/RazorpayButton";
import { supabase } from "@/lib/supabase";

const priceToNum = (p: string) => Number(p.replace(/[^\d]/g, "")) || 0;

const autoCapital = (v: string) => v.toUpperCase();
const inputClass =
  "w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all uppercase";

const plans = [
  { name: "Smart Saver Card", price: "\u20b9299", period: "/year", highlight: false, features: ["Exclusive discounts on all services", "Priority loan processing", "Free financial consultation"] },
  { name: "Referral Partner", price: "\u20b9499", period: "/year", highlight: false, features: ["Earn referral commissions", "Partner dashboard access", "Marketing materials provided", "Monthly payout"] },
  { name: "Basic Partner", price: "\u20b9999", period: "/year", highlight: false, features: ["Full DSA partner benefits", "Higher commission rates", "Dedicated support team", "Quarterly bonuses"] },
  { name: "Silver Partner", price: "\u20b91,999", period: "/year", highlight: false, features: ["Everything in Basic Partner", "Branch-level access", "Co-branded materials", "Priority processing", "Dedicated RM"] },
  { name: "Gold Partner", price: "\u20b94,999", period: "/year", highlight: true, features: ["Everything in Silver Partner", "Highest commission rates", "Exclusive product access", "Annual rewards & bonuses", "Direct bank connect", "Premium support"] },
  { name: "Platinum Partner", price: "\u20b99,999", period: "/year", highlight: false, features: ["Everything in Gold Partner", "White-label solutions", "Regional franchise rights", "VIP bank relationship", "Dedicated account manager", "Annual summit invite"] },
];

/* ───────────────────────── email helper ───────────────────────── */
const sendLeadEmail = async (
  serviceName: string,
  customerName: string,
  customerMobile: string,
  paymentInfo: string,
  details: Record<string, string>
) => {
  try {
    const { data, error } = await supabase.functions.invoke(
      "send-enquiry-email",
      {
        body: {
          serviceName,
          customerName,
          customerMobile,
          paymentInfo,
          details,
        },
      }
    );
    if (error) {
      console.error("Email error:", error);
    } else {
      console.log("Email notification sent:", data);
    }
  } catch (err) {
    console.error("Email send failed:", err);
  }
};

/* ───────────────────────── enquiry form ───────────────────────── */
const PartnerEnquiryForm = ({
  planName,
  planPrice,
  onClose,
}: {
  planName: string;
  planPrice: string;
  onClose: () => void;
}) => {
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentId, setPaymentId] = useState("");

  const u = (key: string, val: string) =>
    setForm((p) => ({ ...p, [key]: val }));

  const handleSubmit = () => {
    if (!form.name || !form.mobile || !form.location) {
      toast.error("Please fill Name, Mobile & Location");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(form.mobile)) {
      toast.error("Enter valid 10-digit mobile");
      return;
    }
    setShowPayment(true);
  };

  /* ── after Razorpay payment succeeds ── */
  const handlePaymentSuccess = async (pId: string) => {
    setPaymentId(pId);
    setLoading(true);

    // Send email + WhatsApp notification (NO WhatsApp redirect)
    await sendLeadEmail(
      `Partner Program \u2014 ${planName}`,
      form.name || "",
      form.mobile || "",
      `Paid ${planPrice} \u2014 Payment ID: ${pId}`,
      {
        Plan: planName,
        Location: form.location || "",
        Profile: form.profile || "N/A",
        "Custom Profile": form.customProfile || "N/A",
      }
    );

    setLoading(false);
    setShowSuccess(true);
    toast.success("Partner application submitted successfully!");
  };

  /* ──── SUCCESS SCREEN ──── */
  if (showSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-6 border-t border-border text-center space-y-3"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.15 }}
        >
          <CheckCircle2 className="mx-auto text-success" size={56} />
        </motion.div>

        <h4 className="font-extrabold text-lg text-foreground">
          Welcome to Mahajan Finance!
        </h4>
        <p className="text-sm text-muted-foreground">
          Thank you <b>{form.name}</b> for joining as{" "}
          <b>{planName}</b>.
        </p>
        <p className="text-xs text-muted-foreground font-mono">
          Payment ID: {paymentId}
        </p>

        <div className="flex items-center justify-center gap-2 text-xs text-success font-semibold">
          <Mail size={14} /> Notification sent to our team
        </div>
        <p className="text-xs text-muted-foreground">
          We will contact you shortly on{" "}
          <b>{form.mobile}</b>.
        </p>

        <button
          onClick={onClose}
          className="mt-3 text-sm text-primary hover:underline font-semibold"
        >
          Close
        </button>
      </motion.div>
    );
  }

  /* ──── PAYMENT SCREEN ──── */
  if (showPayment) {
    const amt = priceToNum(planPrice);
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 space-y-4 border-t border-border"
      >
        <h4 className="font-bold text-center text-foreground">
          &#x1F4B3; Secure Payment &ndash; {planPrice}
        </h4>
        <p className="text-xs text-center text-muted-foreground">
          Pay securely via Razorpay (UPI / Card / Netbanking)
        </p>
        <RazorpayButton
          amount={amt}
          label={loading ? "Processing..." : `Pay ${planPrice} Securely`}
          description={`Partner Program \u2013 ${planName}`}
          notes={{
            plan: planName,
            name: form.name,
            mobile: form.mobile,
            location: form.location,
          }}
          prefill={{ name: form.name, contact: form.mobile }}
          greetingMessage={`Congratulations ${form.name || "Partner"}! You are now a ${planName} \ud83c\udf89`}
          onSuccess={handlePaymentSuccess}
        />
        <button
          onClick={() => setShowPayment(false)}
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Back to form
        </button>
      </motion.div>
    );
  }

  /* ──── FORM SCREEN ──── */
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="p-4 border-t border-border space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1">
              Full Name *
            </label>
            <input
              value={form.name || ""}
              onChange={(e) => u("name", autoCapital(e.target.value))}
              placeholder="FULL NAME"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">
              Mobile *
            </label>
            <input
              value={form.mobile || ""}
              onChange={(e) =>
                u(
                  "mobile",
                  e.target.value.replace(/\D/g, "").slice(0, 10)
                )
              }
              placeholder="Mobile"
              className={`${inputClass} tabular-nums`}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">
            Current Profile *
          </label>
          <select
            value={form.profile || ""}
            onChange={(e) => u("profile", e.target.value)}
            className={inputClass}
          >
            <option value="">Select Profile</option>
            {[
              "Salaried",
              "Businessman",
              "Self Employed",
              "LIC Agent",
              "Pigmi Agent",
              "Consultant",
              "Freelancer",
              "Other",
            ].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        {form.profile === "Other" && (
          <div>
            <label className="block text-xs font-semibold mb-1">
              Mention Profile
            </label>
            <input
              value={form.customProfile || ""}
              onChange={(e) =>
                u("customProfile", autoCapital(e.target.value))
              }
              placeholder="YOUR PROFILE"
              className={inputClass}
            />
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold mb-1">
            Location *
          </label>
          <input
            value={form.location || ""}
            onChange={(e) => u("location", autoCapital(e.target.value))}
            placeholder="LOCATION"
            className={inputClass}
          />
        </div>
        <button
          onClick={handleSubmit}
          className="btn-accent w-full flex items-center justify-center gap-2 !py-3 rounded-lg hover:scale-[1.02] transition-transform"
        >
          <Send size={16} /> Proceed to Payment
        </button>
      </div>
    </motion.div>
  );
};

/* ───────────────────────── main page ───────────────────────── */
const PartnerProgram = () => {
  const [openForm, setOpenForm] = useState<string | null>(null);

  return (
    <>
      <section className="bg-primary py-12">
        <div className="container text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-primary-foreground font-display tracking-tight">
            Partner Program
          </h1>
          <p className="mt-3 text-primary-foreground/70">
            Join our network and earn with every referral
          </p>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className={`rounded-xl border-2 flex flex-col hover:shadow-xl hover:scale-[1.02] transition-all duration-200 ${
                  plan.highlight
                    ? "bg-gradient-to-br from-primary to-foreground text-primary-foreground border-golden shadow-xl relative"
                    : "bg-card border-border shadow-sm hover:border-golden"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-golden text-golden-foreground text-xs font-bold px-4 py-1 rounded-full shadow-md">
                    &#x1F31F; Popular
                  </span>
                )}
                <div className="p-6 flex-1">
                  <h3 className="font-display font-bold text-lg">
                    {plan.name}
                  </h3>
                  <div className="mt-3 mb-6">
                    <span className="text-4xl font-extrabold font-display tabular-nums">
                      {plan.price}
                    </span>
                    <span
                      className={`text-sm ml-1 ${
                        plan.highlight
                          ? "opacity-70"
                          : "text-muted-foreground"
                      }`}
                    >
                      {plan.period}
                    </span>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Check
                          size={16}
                          className={`shrink-0 mt-0.5 ${
                            plan.highlight
                              ? "text-golden"
                              : "text-success"
                          }`}
                        />
                        <span
                          className={
                            plan.highlight
                              ? "opacity-90"
                              : "text-foreground/80"
                          }
                        >
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() =>
                      setOpenForm(
                        openForm === plan.name ? null : plan.name
                      )
                    }
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm transition-all active:scale-95 hover:scale-105 ${
                      plan.highlight
                        ? "bg-golden text-golden-foreground shadow-lg"
                        : "bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    Join Now <ArrowRight size={16} />
                  </button>
                </div>
                <AnimatePresence>
                  {openForm === plan.name && (
                    <PartnerEnquiryForm
                      planName={plan.name}
                      planPrice={plan.price}
                      onClose={() => setOpenForm(null)}
                    />
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default PartnerProgram;