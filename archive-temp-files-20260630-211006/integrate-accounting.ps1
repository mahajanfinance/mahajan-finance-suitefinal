# ═══════════════════════════════════════════════════════════════
# Script: integrate-accounting.ps1
# Page: AccountingServices.tsx (AccountingServices)
# Changes:
#   1. Add supabase import
#   2. Add submitted state to ServiceForm
#   3. Replace handleSubmit: WhatsApp window.open -> edge function
#   4. Add success UI (green gradient) inside each service card
# ═══════════════════════════════════════════════════════════════

$file = "src\pages\AccountingServices.tsx"
$c = [System.IO.File]::ReadAllText($file, [System.Text.UTF8Encoding]::new($false))

# ── Step 1: Add supabase import ──
$old1 = @'
import { toast } from "sonner";
'@

$new1 = @'
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
'@

if ($c.Contains($old1)) {
  $c = $c.Replace($old1, $new1)
  Write-Host "1/5: Added supabase import" -ForegroundColor Green
} else {
  Write-Host "1/5: SKIP - toast import not found" -ForegroundColor Yellow
}

# ── Step 2: Add submitted state ──
$old2 = @'
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, boolean>>({});
'@

$new2 = @'
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
'@

if ($c.Contains($old2)) {
  $c = $c.Replace($old2, $new2)
  Write-Host "2/5: Added submitted state" -ForegroundColor Green
} else {
  Write-Host "2/5: SKIP - uploadedDocs state not found" -ForegroundColor Yellow
}

# ── Step 3: Replace handleSubmit (WhatsApp window.open -> edge function) ──
$old3 = @'
  const handleSubmit = () => {
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

    const lines = [
      `📋 *${service.title}* — Enquiry`,
      `━━━━━━━━━━━━━━━━━━`,
      ...service.fields
        .filter((f) => form[f.key]?.trim())
        .map((f) => `• *${f.label}:* ${form[f.key]}`),
      `━━━━━━━━━━━━━━━━━━`,
      `Documents uploaded: ${uploadedCount}/${totalDocs}`,
      `Source: Accounting Services Portal`,
    ];

    const msg = encodeURIComponent(lines.join("\n"));
    window.open(`https://wa.me/919730540215?text=${msg}`, "_blank");

    setTimeout(() => {
      setLoading(false);
      toast.success("Enquiry submitted successfully! Check WhatsApp.");
    }, 1200);
  };
'@

$new3 = @'
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
          serviceName: `${service.title} — Enquiry`,
          customerName: form.name || "Customer",
          customerMobile: form.mobile,
          details: details,
          sendToBoth: true,
          priorityEmails: ["mahajanfinancekolhapur@gmail.com", "sandeep.mahajan@mahajanfinance.in"],
        },
      });
      console.log(`✅ ${service.key} email+WhatsApp sent via edge function`);
    } catch (err) {
      console.error("Email/WhatsApp failed", err);
    }

    setLoading(false);
    setSubmitted(true);
  };
'@

if ($c.Contains($old3)) {
  $c = $c.Replace($old3, $new3)
  Write-Host "3/5: Replaced handleSubmit with edge function call" -ForegroundColor Green
} else {
  Write-Host "3/5: SKIP - handleSubmit not found" -ForegroundColor Yellow
}

# ── Step 4: Add success UI + wrap form in conditional ──
# Replace the opening of expandable content to add conditional + success state
$old4 = @'
            <div className="px-5 sm:px-6 pb-6 border-t border-border/60 pt-5 space-y-5">
              {/* Info Box */}
              {service.infoText && <InfoBox>{service.infoText}</InfoBox>}
'@

$new4 = @'
            <div className="px-5 sm:px-6 pb-6 border-t border-border/60 pt-5">
              {submitted ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="relative overflow-hidden rounded-xl p-6 md:p-8 text-center"
                  style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)" }}>
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={40} className="text-white drop-shadow-lg" />
                  </div>
                  <h4 className="text-lg font-extrabold font-display text-white mb-2">{service.title} — Enquiry Sent!</h4>
                  <p className="text-xs text-white/90 mb-2 leading-relaxed">
                    Thank you, <strong className="text-white">{form.name || "Customer"}</strong>.
                    Our team will contact you shortly on <strong className="text-yellow-200">{form.mobile}</strong>.
                  </p>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[11px] font-bold mb-3">
                    <CheckCircle2 size={12} /> Confirmation sent via Email & WhatsApp
                  </div>
                  <div className="flex flex-col sm:flex-row justify-center gap-2 mt-3">
                    <a href="tel:+919730540215" className="px-4 py-2 rounded-full border-2 border-white/60 text-white text-xs font-bold hover:bg-white hover:text-emerald-700 transition-all">📞 Call 9730540215</a>
                    <button onClick={() => { setSubmitted(false); setForm({}); }} className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-bold hover:bg-white/30 transition-all">New Enquiry</button>
                  </div>
                </motion.div>
              ) : (
              <div className="space-y-5">
              {/* Info Box */}
              {service.infoText && <InfoBox>{service.infoText}</InfoBox>}
'@

if ($c.Contains($old4)) {
  $c = $c.Replace($old4, $new4)
  Write-Host "4/5: Added success UI + conditional wrapper opening" -ForegroundColor Green
} else {
  Write-Host "4/5: SKIP - expandable content opening not found" -ForegroundColor Yellow
}

# ── Step 5: Close the conditional wrapper ──
$old5 = @'
                <p className="text-center text-xs text-muted-foreground">
                  Your details will be sent securely to our team for a callback.
                </p>
              </div>
            </div>
'@

$new5 = @'
                <p className="text-center text-xs text-muted-foreground">
                  Your details will be sent securely to our team for a callback.
                </p>
              </div>
              </div>
              )}
            </div>
'@

if ($c.Contains($old5)) {
  $c = $c.Replace($old5, $new5)
  Write-Host "5/5: Closed conditional wrapper" -ForegroundColor Green
} else {
  Write-Host "5/5: SKIP - closing wrapper not found" -ForegroundColor Yellow
}

# ── Save ──
[System.IO.File]::WriteAllText($file, $c, [System.Text.UTF8Encoding]::new($false))
Write-Host "`n=== Accounting page fully integrated! ===" -ForegroundColor Cyan