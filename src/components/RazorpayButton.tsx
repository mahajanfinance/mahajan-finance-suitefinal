import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window { Razorpay: any }
}

interface Props {
  amount: number; // in INR rupees
  label?: string;
  description?: string;
  notes?: Record<string, string>;
  prefill?: { name?: string; email?: string; contact?: string };
  onSuccess: (paymentId: string) => void | Promise<void>;
  className?: string;
  disabled?: boolean;
  /** Optional greeting message shown after successful payment */
  greetingMessage?: string;
}

const loadScript = () =>
  new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

const RazorpayButton = ({ amount, label, description, notes, prefill, onSuccess, className, disabled, greetingMessage }: Props) => {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    if (amount < 1) { toast.error("Invalid amount"); return; }
    setLoading(true);
    try {
      const ok = await loadScript();
      if (!ok) throw new Error("Failed to load payment gateway");

      const { data, error } = await supabase.functions.invoke("razorpay-create-order", {
        body: { amount: Math.round(amount * 100), currency: "INR", notes },
      });
      if (error || !data?.order) throw new Error(data?.error || "Order creation failed");

      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.order.amount,
        currency: data.order.currency,
        name: "Mahajan Finance",
        description: description || label || "Payment",
        order_id: data.order.id,
        prefill,
        theme: { color: "#1e40af" },
        handler: async (resp: any) => {
          try {
            const { data: vd, error: ve } = await supabase.functions.invoke("razorpay-verify", {
              body: {
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature: resp.razorpay_signature,
              },
            });
            if (ve || !vd?.verified) throw new Error("Payment verification failed");
            setLoading(false);
            toast.success("✅ Payment successful! Thank you for choosing Mahajan Finance.");
            if (greetingMessage) {
              setTimeout(() => toast.success(greetingMessage, { duration: 6000 }), 500);
            }
            await onSuccess(resp.razorpay_payment_id);
          } catch (e: any) {
            setLoading(false);
            toast.error(e.message || "Payment verification failed");
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      });
      rzp.on("payment.failed", (r: any) => {
        setLoading(false);
        toast.error("❌ Payment failed: " + (r.error?.description || "Please try again."));
      });
      rzp.open();
    } catch (e: any) {
      setLoading(false);
      toast.error(e.message || "Payment error");
    }
  };

  return (
    <button
      onClick={handlePay}
      disabled={loading || disabled}
      className={className || "btn-accent w-full !py-3 rounded-lg disabled:opacity-60 hover:scale-[1.02] transition-transform"}
    >
      {loading ? "Processing..." : (label || `Pay ₹${amount} Securely`)}
    </button>
  );
};

export default RazorpayButton;
