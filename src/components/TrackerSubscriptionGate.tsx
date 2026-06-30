import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Lock, CheckCircle2, Clock, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import RazorpayButton from "./RazorpayButton";
import { toast } from "sonner";

interface Props { 
  userId: string; 
  userEmail?: string | null; 
  children: React.ReactNode 
}

interface SubRow {
  trial_started_at: string;
  paid_until: string | null;
}

const TRIAL_DAYS = 15;
const PRICE_INR = 499;

const TrackerSubscriptionGate = ({ userId, userEmail, children }: Props) => {
  const [loading, setLoading] = useState(true);
  const [sub, setSub] = useState<SubRow | null>(null);
  const [userMobile, setUserMobile] = useState<string>("");
  const [isTempUserMode, setIsTempUserMode] = useState(false);

  const load = async () => {
    setLoading(true);
    
    // ============================================
    // CHECK FOR TEMP USER FIRST
    // ============================================
    try {
      const storedTempUser = sessionStorage.getItem('tracker_temp_user');
      
      if (storedTempUser) {
        setIsTempUserMode(true);
        setLoading(false);
        
        // Create a fake subscription object so UI shows "Pro" status
        setSub({
          trial_started_at: new Date().toISOString(),
          paid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        });
        return;
      }
    } catch (err) {
      console.warn("Error checking temp user:", err);
    }

    // ============================================
    // REAL USER: Fetch Subscription from Database
    // ============================================
    try {
      const { data, error } = await (supabase as any)
        .from("tracker_subscriptions")
        .select("trial_started_at, paid_until")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Subscription DB Error:", error.message);
        
        // Handle specific errors
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          // Table might not exist yet - create it
          const { data: inserted, error: insertError } = await (supabase as any)
            .from("tracker_subscriptions")
            .insert({ 
              user_id: userId,
              trial_started_at: new Date().toISOString()
            })
            .select("trial_started_at, paid_until")
            .single();
          
          if (!insertError && inserted) {
            setSub(inserted as SubRow);
          } else {
            // Grant access anyway to prevent lockout
            setSub({
              trial_started_at: new Date().toISOString(),
              paid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
            });
          }
        } else {
          // Grant access on other errors too
          setSub({
            trial_started_at: new Date().toISOString(),
            paid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          });
        }
      } else if (data) {
        setSub(data as SubRow);
      } else {
        // No subscription exists - create one with free trial
        const { data: inserted, error: insertError } = await (supabase as any)
          .from("tracker_subscriptions")
          .insert({ 
            user_id: userId,
            trial_started_at: new Date().toISOString()
          })
          .select("trial_started_at, paid_until")
          .single();
        
        if (!insertError && inserted) {
          setSub(inserted as SubRow);
        } else {
          // Fallback: allow access
          setSub({
            trial_started_at: new Date().toISOString(),
            paid_until: null
          });
        }
      }

      // ============================================
      // FETCH MOBILE NUMBER (For Razorpay & WhatsApp)
      // ============================================
      try {
        const { data: profile, error: profileError } = await supabase
          .from("tracker_business_profile")
          .select("mobile_number, whatsapp_number")
          .eq("user_id", userId)
          .maybeSingle();

        if (profileError) {
          console.warn("Profile fetch error:", profileError.message);
        } else if (profile) {
          const finalMobile = profile.whatsapp_number || profile.mobile_number || "9999999999";
          setUserMobile(finalMobile.replace(/\D/g, '').slice(-10));
        } else {
          setUserMobile("9999999999");
        }
      } catch (profileErr) {
        console.warn("Profile error:", profileErr);
        setUserMobile("9999999999");
      }

    } catch (err) {
      console.error("CRITICAL ERROR:", err);
      
      // Don't block the user on critical errors
      setSub({
        trial_started_at: new Date().toISOString(),
        paid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [userId]);

  // WhatsApp Notification Function
  const sendWhatsAppReceipt = async (paymentId: string) => {
    if (!userMobile || userMobile === "9999999999") {
      return;
    }

    const message = `🎉 *Mahajan Finance - Cash Flow Pro*\n\nPayment of *₹${PRICE_INR}* received successfully!\n\n🆔 Payment ID: ${paymentId}\n⏳ Valid for: 30 Days\n\nThank you for your subscription!`;

    window.open(`https://wa.me/91${userMobile}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full mx-auto" />
          <p className="text-muted-foreground font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!sub) return null;

  // ============================================
  // CALCULATE ACCESS STATUS
  // ============================================
  const now = Date.now();
  const trialEnd = new Date(sub.trial_started_at).getTime() + TRIAL_DAYS * 86400000;
  const paidUntil = sub.paid_until ? new Date(sub.paid_until).getTime() : 0;
  
  const inTrial = !isTempUserMode && now < trialEnd;
  const isPaid = paidUntil > now;
  const hasAccess = isTempUserMode || inTrial || isPaid;

  const trialDaysLeft = Math.max(0, Math.ceil((trialEnd - now) / 86400000));
  const paidDaysLeft = Math.max(0, Math.ceil((paidUntil - now) / 86400000));

  // Payment Handler
  const handlePaid = async (paymentId: string) => {
    toast.info("Processing payment...");
    
    const base = paidUntil > now ? paidUntil : now;
    const newPaidUntil = new Date(base + 30 * 86400000).toISOString();
    
    const { error } = await (supabase as any)
      .from("tracker_subscriptions")
      .update({ 
        paid_until: newPaidUntil, 
        last_payment_id: paymentId, 
        last_payment_amount: PRICE_INR * 100 
      })
      .eq("user_id", userId);
      
    if (error) { 
      console.error("Payment update failed:", error);
      toast.error("Couldn't activate subscription. Please contact support."); 
      return; 
    }
    
    await sendWhatsAppReceipt(paymentId);
    
    toast.success("💳 Payment successful! Subscription activated for 30 days.");
    await load(); // Refresh subscription data
  };

  // Razorpay prefill
  const rzpPrefill = {
    email: userEmail || undefined,
    contact: userMobile
  };

  // ============================================
  // NO ACCESS - SHOW PAYMENT WALL
  // ============================================
  if (!hasAccess) {
    return (
      <section className="min-h-[80vh] py-12 bg-gradient-to-b from-background to-muted/40">
        <div className="container max-w-xl">
          <motion.div 
            initial={{ opacity: 0, y: 14 }} 
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border-2 border-golden/30 p-8 shadow-xl text-center"
          >
            {/* Lock Icon */}
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Lock className="text-primary" size={28} />
            </div>
            
            <h1 className="text-2xl font-extrabold font-display">Your free trial has ended</h1>
            <p className="text-muted-foreground mt-2">
              Continue using the Cash Flow Manager with a monthly subscription.
            </p>

            {/* Pricing Card */}
            <div className="my-6 p-5 rounded-xl bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-lg">
              <p className="text-sm opacity-80">Cash Flow Manager Pro</p>
              <p className="text-4xl font-extrabold mt-1">
                ₹{PRICE_INR}
                <span className="text-base font-normal opacity-80">/month</span>
              </p>
              
              <ul className="text-sm mt-4 space-y-1.5 text-left max-w-xs mx-auto">
                {[
                  "Unlimited income & expense entries",
                  "Daily / weekly / monthly / yearly reports",
                  "Profit & loss summary",
                  "Secure PIN-protected vault"
                ].map(t => (
                  <li key={t} className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-accent flex-shrink-0" /> 
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            {/* Payment Button */}
            <RazorpayButton
              amount={PRICE_INR}
              label={`Subscribe – Pay ₹${PRICE_INR} for 30 days`}
              description="Cash Flow Manager – 30 days access"
              notes={{ purpose: "tracker_subscription", user_id: userId }}
              prefill={rzpPrefill}
              onSuccess={handlePaid}
            />
            
            <p className="text-xs text-muted-foreground mt-3">
              One-time charge for 30 days. Renew anytime.
            </p>
          </motion.div>
        </div>
      </section>
    );
  }

  // ============================================
  // HAS ACCESS - RENDER CHILDREN WITH STATUS BAR
  // ============================================
  return (
    <>
      {/* Status Bar - Simplified without debug info */}
      <div className={`border-b ${isTempUserMode ? 'bg-amber-500/10 border-amber-500/30' : 'bg-accent/10 border-accent/30'}`}>
        <div className="container py-2 flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2 font-medium">
            {isTempUserMode ? (
              <>
                <Shield size={14} className="text-amber-500" />
                <span className="text-amber-600 dark:text-amber-400">
                  Temp Access Mode
                </span>
              </>
            ) : isPaid ? (
              <>
                <Sparkles size={14} className="text-accent" />
                <span className="text-accent">
                  Pro active – {paidDaysLeft} day{paidDaysLeft !== 1 ? "s" : ""} left
                </span>
              </>
            ) : (
              <>
                <Clock size={14} className="text-primary" />
                <span className="text-primary">
                  Free trial – {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} left
                </span>
              </>
            )}
          </div>
          
          {!isTempUserMode && !isPaid && (
            <RazorpayButton
              amount={PRICE_INR}
              label={`Upgrade ₹${PRICE_INR}/mo`}
              description="Cash Flow Manager – 30 days access"
              notes={{ purpose: "tracker_subscription", user_id: userId }}
              prefill={rzpPrefill}
              onSuccess={handlePaid}
              className="px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-bold hover:scale-105 transition-transform"
            />
          )}
        </div>
      </div>
      
      {/* Main Content */}
      {children}
    </>
  );
};

export default TrackerSubscriptionGate;
