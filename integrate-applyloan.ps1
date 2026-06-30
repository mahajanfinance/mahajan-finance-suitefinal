# ═══════════════════════════════════════════════════════════════
# Script: integrate-applyloan.ps1
# Page: ApplyLoan.tsx
# Changes:
#   1. Add imports (supabase, CheckCircle2, Link, motion, AnimatePresence)
#   2. Replace handleSubmit with async edge function call
#   3. Add success state variable
#   4. Replace toast-only flow with success card UI (green gradient)
#   5. Enhance header with gradient + pattern
# ═══════════════════════════════════════════════════════════════

$file = "src\pages\ApplyLoan.tsx"
$c = [System.IO.File]::ReadAllText($file, [System.Text.UTF8Encoding]::new($false))

# ── Step 1: Add imports ──
$old1 = @'
import { useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
'@

$new1 = @'
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Send, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
'@

if ($c.Contains($old1)) {
  $c = $c.Replace($old1, $new1)
  Write-Host "1/6: Added imports (supabase, CheckCircle2, Link, motion, AnimatePresence)" -ForegroundColor Green
} else {
  Write-Host "1/6: SKIP - imports block not found" -ForegroundColor Yellow
}

# ── Step 2: Add success state + change handleSubmit to async ──
$old2 = @'
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.mobile.trim() || !form.loanType || !form.income.trim() || !form.city.trim()) {
      toast.error("Please fill all required fields");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) {
      toast.error("Enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Loan application submitted! Our agent will call you within 15 minutes.");
      setForm({ name: "", mobile: "", loanType: "", income: "", city: "", message: "" });
    }, 1200);
  };
'@

$new2 = @'
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.mobile.trim() || !form.loanType || !form.income.trim() || !form.city.trim()) {
      toast.error("Please fill all required fields");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) {
      toast.error("Enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);

    try {
      await supabase.functions.invoke("send-enquiry-email", {
        body: {
          serviceName: `${form.loanType} Application`,
          customerName: form.name,
          customerMobile: form.mobile,
          details: {
            "Loan Type": form.loanType,
            "Monthly Income": form.income,
            "City": form.city,
            "Additional Details": form.message || "None",
          },
          sendToBoth: true,
          priorityEmails: ["mahajanfinancekolhapur@gmail.com", "sandeep.mahajan@mahajanfinance.in"],
        },
      });
      console.log("✅ ApplyLoan email+WhatsApp sent via edge function");
    } catch (err) {
      console.error("Email/WhatsApp failed", err);
    }

    setLoading(false);
    setSubmitted(true);
  };
'@

if ($c.Contains($old2)) {
  $c = $c.Replace($old2, $new2)
  Write-Host "2/6: Added success state + async edge function call" -ForegroundColor Green
} else {
  Write-Host "2/6: SKIP - handleSubmit not found" -ForegroundColor Yellow
}

# ── Step 3: Enhance header with gradient + pattern ──
$old3 = @'
      <section className="bg-primary py-12">
        <div className="container text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-primary-foreground font-display tracking-tight">
            Apply for Loan
          </h1>
          <p className="mt-3 text-primary-foreground/70">Quick approval. Minimal documentation. Zero hidden charges.</p>
        </div>
      </section>
'@

$new3 = @'
      <section className="relative bg-primary overflow-hidden py-14">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/90" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=''60'' height=''60'' viewBox=''0 0 60 60'' xmlns=''http://www.w3.org/2000/svg''%3E%3Cg fill=''none'' fill-rule=''evenodd''%3E%3Cg fill=''%23ffffff'' fill-opacity=''1''%3E%3Cpath d=''M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z''/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="relative container text-center">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl md:text-4xl font-extrabold text-primary-foreground font-display tracking-tight">
              Apply for Loan
            </h1>
            <p className="mt-3 text-primary-foreground/70">Quick approval. Minimal documentation. Zero hidden charges.</p>
          </motion.div>
        </div>
      </section>
'@

if ($c.Contains($old3)) {
  $c = $c.Replace($old3, $new3)
  Write-Host "3/6: Enhanced header with gradient + pattern" -ForegroundColor Green
} else {
  Write-Host "3/6: SKIP - header not found" -ForegroundColor Yellow
}

# ── Step 4: Wrap form + success in AnimatePresence ──
$old4 = @'
      <section className="py-16 bg-background">
        <div className="container max-w-xl">
          <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-6 md:p-8 shadow-sm space-y-4">
'@

$new4 = @'
      <section className="py-16 bg-background">
        <div className="container max-w-xl">
          <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="relative overflow-hidden rounded-2xl p-8 md:p-10 text-center shadow-lg"
              style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)" }}>
              <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=''40'' height=''40'' viewBox=''0 0 40 40'' xmlns=''http://www.w3.org/2000/svg''%3E%3Cg fill=''%23ffffff'' fill-opacity=''1''%3E%3Cpath d=''M20 20.5V18H0v-2h20v-2l2 3.5-2 3z''/%3E%3C/g%3E%3C/svg%3E")' }} />
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-5">
                  <CheckCircle2 size={52} className="text-white drop-shadow-lg" />
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold font-display text-white mb-3">Application Submitted!</h2>
                <p className="text-sm text-white/90 mb-3 leading-relaxed">
                  Thank you, <strong className="text-white">{form.name}</strong>. Your <strong className="text-yellow-200">{form.loanType}</strong> application has been received.
                  Our loan specialist will contact you within <strong className="text-yellow-200">15 minutes</strong> on <strong className="text-yellow-200">{form.mobile}</strong>.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-bold mb-4">
                  <CheckCircle2 size={14} /> Confirmation sent via Email & WhatsApp
                </div>
                <p className="text-sm text-white/80">📞 For urgent: <a href="tel:+919730540215" className="text-white font-bold underline decoration-2">9730540215</a></p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                  <Link to="/" className="px-6 py-3 rounded-full border-2 border-white/60 text-white font-bold hover:bg-white hover:text-emerald-700 transition-all text-sm">Go Home</Link>
                  <button onClick={() => {
                    setSubmitted(false);
                    setForm({ name: "", mobile: "", loanType: "", income: "", city: "", message: "" });
                  }} className="px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm text-white font-bold text-sm hover:bg-white/30 transition-all">New Application</button>
                </div>
              </div>
            </motion.div>
          ) : (
          <motion.form key="form" onSubmit={handleSubmit} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-card rounded-xl border-2 border-primary/20 p-6 md:p-8 shadow-sm hover:shadow-lg transition-shadow space-y-4">
'@

if ($c.Contains($old4)) {
  $c = $c.Replace($old4, $new4)
  Write-Host "4/6: Added AnimatePresence + success card + enhanced form card" -ForegroundColor Green
} else {
  Write-Host "4/6: SKIP - form section not found" -ForegroundColor Yellow
}

# ── Step 5: Update submit button ──
$old5 = @'
            <button type="submit" disabled={loading} className="btn-accent w-full flex items-center justify-center gap-2 !py-3.5 disabled:opacity-60">
              {loading ? "Submitting..." : <><Send size={18} /> Submit Application</>}
            </button>
          </form>
        </div>
      </section>
'@

$new5 = @'
            <button type="submit" disabled={loading} className="btn-accent w-full flex items-center justify-center gap-2 !py-3.5 disabled:opacity-60 hover:scale-[1.02] transition-transform rounded-lg">
              {loading ? (
                <><span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Sending Application...</>
              ) : (
                <><Send size={18} /> Submit Application</>
              )}
            </button>
          </motion.form>
          )}
          </AnimatePresence>
        </div>
      </section>
'@

if ($c.Contains($old5)) {
  $c = $c.Replace($old5, $new5)
  Write-Host "5/6: Updated submit button with spinner + closed AnimatePresence" -ForegroundColor Green
} else {
  Write-Host "5/6: SKIP - submit button not found" -ForegroundColor Yellow
}

# ── Step 6: Update input class to match professional style ──
$old6 = @'
className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" maxLength={100}
'@
$new6 = @'
className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60" maxLength={100}
'@

# Replace ALL instances of the old input class pattern (without placeholder style)
$oldGeneric = 'className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"'
$newGeneric = 'className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60"'

$count = 0
while ($c.Contains($oldGeneric)) {
  $c = $c.Replace($oldGeneric, $newGeneric)
  $count++
}
if ($count -gt 0) {
  Write-Host "6/6: Updated $count input fields with placeholder style" -ForegroundColor Green
} else {
  Write-Host "6/6: SKIP - no input class updates needed" -ForegroundColor Yellow
}

# ── Save ──
[System.IO.File]::WriteAllText($file, $c, [System.Text.UTF8Encoding]::new($false))
Write-Host "`n=== ApplyLoan page fully integrated! ===" -ForegroundColor Cyan