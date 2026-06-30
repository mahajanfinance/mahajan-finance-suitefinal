# ═══════════════════════════════════════════════════════════════
# Script: integrate-insurance.ps1
# Page: InsuranceQuote.tsx
# Changes:
#   1. Add sendToBoth + priorityEmails to edge function body
#   2. Remove WhatsApp window.open block (edge function handles it)
#   3. Enhance success card with green gradient
# ═══════════════════════════════════════════════════════════════

$file = "src\pages\InsuranceQuote.tsx"
$c = [System.IO.File]::ReadAllText($file, [System.Text.UTF8Encoding]::new($false))

# ── Step 1: Add sendToBoth + priorityEmails + improve error handling ──
$old1 = @'
          paymentInfo: `Quote fee paid ₹`${INSURANCE_FEE} (`${paymentId})`,
        },
      });
    } catch (err) {
      console.error("Email send failed", err);
    }
'@

$new1 = @'
          paymentInfo: `Quote fee paid ₹`${INSURANCE_FEE} (`${paymentId})`,
          sendToBoth: true,
          priorityEmails: ["mahajanfinancekolhapur@gmail.com", "sandeep.mahajan@mahajanfinance.in"],
        },
      });
      console.log("✅ Insurance email+WhatsApp sent via edge function");
    } catch (err) {
      console.error("Email/WhatsApp failed", err);
    }
'@

if ($c.Contains($old1)) {
  $c = $c.Replace($old1, $new1)
  Write-Host "1/3: Added sendToBoth + priorityEmails to edge function" -ForegroundColor Green
} else {
  Write-Host "1/3: SKIP - sendToBoth block not found (may already be added)" -ForegroundColor Yellow
}

# ── Step 2: Remove WhatsApp window.open block ──
$old2 = @'
    let waText = `🛡️ New Insurance Quote\nName: `${form.name}\nMobile: `${form.mobile}\nCity: `${form.city}\nType: `${form.type}`;
    fields.forEach(f => {
      if (dynamicFields[f.key]) {
        waText += `\n`${f.label.replace(" *", "")}: `${dynamicFields[f.key]}`;
      }
    });
    if (docNames.length > 0) waText += `\nDocs: `${docNames.join(", ")}`;
    if (form.message) waText += `\nNotes: `${form.message}`;
    waText += `\nFee Paid: ₹`${INSURANCE_FEE}\nPayment ID: `${paymentId}\nAdvisors: Dipali Sandeep Mahajan (ICICI Lombard) & Sandeep Shrikant Mahajan (IRDAI Authorized)`;

    window.open(`https://wa.me/919730540215?text=`${encodeURIComponent(waText)}`, "_blank");
'@

if ($c.Contains($old2)) {
  $c = $c.Replace($old2, "")
  Write-Host "2/3: Removed WhatsApp window.open block" -ForegroundColor Green
} else {
  Write-Host "2/3: SKIP - WhatsApp block not found" -ForegroundColor Yellow
}

# ── Step 3: Enhance success card with green gradient ──
$old3 = @'
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-card rounded-xl border-2 border-success/30 p-8 text-center">
                <CheckCircle2 size={64} className="text-success mx-auto mb-4" />
                <h2 className="text-2xl font-extrabold font-display text-foreground mb-3">Quote Request Submitted! 🎉</h2>
                <p className="text-sm text-muted-foreground mb-2">
                  Thank you, <strong>{form.name}</strong>. Our advisors <strong className="text-golden">Dipali Sandeep Mahajan</strong> (ICICI Lombard) & <strong className="text-primary">Sandeep Shrikant Mahajan</strong> (IRDAI Authorized) will share the best <strong>{form.type}</strong> quotes shortly.
                </p>
                <p className="text-sm text-muted-foreground">📞 For urgent: <a href="tel:+919730540215" className="text-primary font-bold">9730540215</a></p>
'@

$new3 = @'
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="relative overflow-hidden rounded-2xl p-8 md:p-10 text-center shadow-lg"
                style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)" }}>
                <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=''40'' height=''40'' viewBox=''0 0 40 40'' xmlns=''http://www.w3.org/2000/svg''%3E%3Cg fill=''%23ffffff'' fill-opacity=''1''%3E%3Cpath d=''M20 20.5V18H0v-2h20v-2l2 3.5-2 3z''/%3E%3C/g%3E%3C/svg%3E")' }} />
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
                  <p className="text-sm text-white/80">📞 For urgent: <a href="tel:+919730540215" className="text-white font-bold underline decoration-2">9730540215</a></p>
'@

if ($c.Contains($old3)) {
  $c = $c.Replace($old3, $new3)
  Write-Host "3/3: Enhanced success card with green gradient" -ForegroundColor Green
} else {
  Write-Host "3/3: SKIP - success card not found" -ForegroundColor Yellow
}

# ── Step 3b: Fix success card closing buttons for white-on-green ──
$old3b = @'
                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                  <Link to="/" className="px-6 py-3 rounded-full border-2 border-primary text-primary font-bold hover:bg-primary hover:text-primary-foreground transition-all text-sm">Go Home</Link>
                  <button onClick={() => {
                    setSubmitted(false);
                    setForm({ name: "", mobile: "", city: "", email: "", type: "", message: "" });
                    setDynamicFields({});
                    setDocFiles({});
                  }} className="px-6 py-3 rounded-full bg-accent text-accent-foreground font-bold text-sm">New Quote</button>
                </div>
'@

$new3b = @'
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
'@

if ($c.Contains($old3b)) {
  $c = $c.Replace($old3b, $new3b)
  Write-Host "3b: Updated success card buttons for white-on-green" -ForegroundColor Green
}

# ── Save ──
[System.IO.File]::WriteAllText($file, $c, [System.Text.UTF8Encoding]::new($false))
Write-Host "`n=== Insurance page fully integrated! ===" -ForegroundColor Cyan