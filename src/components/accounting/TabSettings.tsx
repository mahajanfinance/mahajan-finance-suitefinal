import { useEffect, useState, useRef, useCallback } from "react";
import { acc } from "@/lib/accounting";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Building2, Save, Shield, Briefcase, Store, Factory, GraduationCap, CheckCircle2, Sparkles } from "lucide-react";

const inputClass = "w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

const sectors = [
  { value: "service", label: "Service Provider", icon: Briefcase, color: "from-blue-500 to-indigo-600", desc: "Consulting, digital services, agency work", features: ["Generate Invoices", "Track Client Payments", "Recurring Billing", "Project-Based Billing"] },
  { value: "trader", label: "Trader / Dealer", icon: Store, color: "from-emerald-500 to-green-600", desc: "Buy-sell, distribution, wholesale/retail", features: ["GST Billing", "Inventory Management", "Purchase & Sales Register", "Outstanding Receivables"] },
  { value: "manufacturer", label: "Manufacturer", icon: Factory, color: "from-orange-500 to-amber-600", desc: "Production, assembly, fabrication", features: ["Production Billing", "Material Consumption Tracking", "Inventory & Warehouse Management", "GST Compliance"] },
  { value: "professional", label: "Professional", icon: GraduationCap, color: "from-purple-500 to-violet-600", desc: "Doctor, CA, Lawyer, Architect", features: ["Consultation Billing", "Client/Patient Management", "Retainer Billing", "Payment Collection Tracking"] },
];

const TabSettings = ({ userId }: { userId: string }) => {
  const [form, setForm] = useState({
    business_name: "", gstin: "", pan: "", address: "", phone: "", email: "",
    invoice_prefix: "INV", next_invoice_no: 1, business_sector: "service",
  });
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const autoTimer = useRef<any>(null);
  const lastSavedRef = useRef<string>("");

  const load = useCallback(async () => {
    const [bizRes, profileRes] = await Promise.all([
      acc("acc_business").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("tracker_business_profile").select("business_sector").eq("user_id", userId).maybeSingle(),
    ]);
    const biz = bizRes.data;
    const profile = profileRes.data;
    if (biz) setForm(prev => ({ ...prev, ...biz }));
    if (profile?.business_sector) setForm(prev => ({ ...prev, business_sector: profile.business_sector }));
    setLoaded(true);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  // Auto-save with debounce
  useEffect(() => {
    if (!loaded) return;
    if (autoTimer.current) clearTimeout(autoTimer.current);
    const currentSnap = JSON.stringify({ business_name: form.business_name, gstin: form.gstin, pan: form.pan, address: form.address, phone: form.phone, email: form.email, invoice_prefix: form.invoice_prefix, next_invoice_no: form.next_invoice_no, business_sector: form.business_sector });
    if (currentSnap === lastSavedRef.current) return;
    autoTimer.current = setTimeout(async () => {
      try {
        const payload = { user_id: userId, business_name: form.business_name, gstin: form.gstin, pan: form.pan, address: form.address, phone: form.phone, email: form.email, invoice_prefix: form.invoice_prefix, next_invoice_no: form.next_invoice_no, business_sector: form.business_sector };
        const { error } = await acc("acc_business").upsert(payload, { onConflict: "user_id" });
        if (error) { console.error("Auto-save error:", error); return; }
        await supabase.from("tracker_business_profile").upsert({ user_id: userId, business_sector: form.business_sector }, { onConflict: "user_id" });
        lastSavedRef.current = currentSnap;
        setAutoSaved(true);
        setTimeout(() => setAutoSaved(false), 2500);
      } catch (err) { console.error("Auto-save exception:", err); }
    }, 1500);
    return () => { if (autoTimer.current) clearTimeout(autoTimer.current); };
  }, [form, loaded, userId]);

  const save = async () => {
    setSaving(true);
    try {
      const payload = { user_id: userId, business_name: form.business_name, gstin: form.gstin, pan: form.pan, address: form.address, phone: form.phone, email: form.email, invoice_prefix: form.invoice_prefix, next_invoice_no: form.next_invoice_no, business_sector: form.business_sector };
      const { error } = await acc("acc_business").upsert(payload, { onConflict: "user_id" });
      if (error) { toast.error("Save failed: " + error.message); setSaving(false); return; }
      const profErr = await supabase.from("tracker_business_profile").upsert({ user_id: userId, business_sector: form.business_sector }, { onConflict: "user_id" });
      if (profErr.error) { toast.error("Profile save failed: " + profErr.error.message); setSaving(false); return; }
      const currentSnap = JSON.stringify(payload);
      lastSavedRef.current = currentSnap;
      toast.success("Business settings saved!");
    } catch (err: any) {
      toast.error("Save error: " + (err?.message || "Unknown error"));
    }
    setSaving(false);
  };

  if (!loaded) return null;

  const selectedSector = sectors.find(s => s.value === form.business_sector);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Building2 size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold font-display">Business Settings</h3>
            <p className="text-sm text-muted-foreground">Configure your business profile &amp; billing preferences</p>
          </div>
        </div>
        {autoSaved && (
          <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold animate-in fade-in slide-in-from-right-2 duration-300">
            <CheckCircle2 size={14} /> Auto-saved
          </div>
        )}
      </div>

      {/* Sector Selection */}
      <div className="bg-card rounded-2xl border-2 border-golden/30 p-6 shadow-sm">
        <h4 className="font-bold text-base flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center"><Briefcase size={16} className="text-amber-700" /></div>
          Select Your Business Type
        </h4>
        <p className="text-xs text-muted-foreground mb-5 ml-10">This customizes your billing, items, and dashboard</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sectors.map(s => {
            const Icon = s.icon;
            const sel = form.business_sector === s.value;
            return (
              <button key={s.value} onClick={() => setForm(p => ({ ...p, business_sector: s.value }))}
                className={"text-left p-5 rounded-2xl border-2 transition-all duration-200 hover:scale-[1.01] " + (sel ? "border-transparent bg-gradient-to-br " + s.color + " text-white shadow-lg scale-[1.02]" : "border-border bg-card hover:border-primary/30 hover:shadow-md")}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={"w-10 h-10 rounded-xl flex items-center justify-center " + (sel ? "bg-white/20" : "bg-muted/50")}>
                    <Icon size={20} className={sel ? "text-white" : "text-muted-foreground"} />
                  </div>
                  <div>
                    <p className={"font-extrabold text-lg " + (sel ? "text-white" : "")}>{s.label}</p>
                    <p className={"text-xs " + (sel ? "text-white/70" : "text-muted-foreground")}>{s.desc}</p>
                  </div>
                  {sel && <Sparkles size={16} className="text-white/80 ml-auto" />}
                </div>
                <ul className={"space-y-1 mt-3 " + (sel ? "text-white/90" : "text-muted-foreground text-sm")}>
                  {s.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className={"w-1.5 h-1.5 rounded-full " + (sel ? "bg-white/60" : "bg-muted-300")} />
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>
        {selectedSector && (
          <div className="mt-4 p-3 rounded-xl bg-muted/30 border border-border text-xs text-muted-foreground flex items-center gap-2">
            <Sparkles size={14} className="text-amber-500" />
            Active: <b className="text-foreground">{selectedSector.label}</b> -- {selectedSector.features.join(" | ")}
          </div>
        )}
      </div>

      {/* Business Details */}
      <div className="bg-card rounded-2xl border-2 border-golden/30 p-6 shadow-sm space-y-5">
        <h4 className="font-bold text-base flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center"><Shield size={16} className="text-blue-700" /></div>
          Business Details
        </h4>
        <input value={form.business_name || ""} onChange={e => setForm(p => ({ ...p, business_name: e.target.value.toUpperCase() }))} placeholder="BUSINESS NAME" className={inputClass + " uppercase text-lg font-bold"} />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground font-medium mb-1.5 block">GSTIN</label>
            <input value={form.gstin || ""} onChange={e => setForm(p => ({ ...p, gstin: e.target.value.toUpperCase() }))} placeholder="22AAAAA0000A1Z5" className={inputClass + " uppercase"} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-medium mb-1.5 block">PAN</label>
            <input value={form.pan || ""} onChange={e => setForm(p => ({ ...p, pan: e.target.value.toUpperCase() }))} placeholder="AAAAA0000A" className={inputClass + " uppercase"} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Phone</label>
            <input value={form.phone || ""} onChange={e => setForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, "") }))} placeholder="+91 98765 43210" className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Email</label>
            <input value={form.email || ""} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="info@business.com" className={inputClass} />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Address</label>
          <textarea value={form.address || ""} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Full business address" className={inputClass} rows={3} />
        </div>
      </div>

      {/* Invoice Settings */}
      <div className="bg-card rounded-2xl border-2 border-golden/30 p-6 shadow-sm space-y-5">
        <h4 className="font-bold text-base flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><Save size={16} className="text-emerald-700" /></div>
          Invoice Settings
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Invoice Prefix</label>
            <input value={form.invoice_prefix || ""} onChange={e => setForm(p => ({ ...p, invoice_prefix: e.target.value.toUpperCase() }))} placeholder="INV" className={inputClass + " uppercase"} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Next Invoice No</label>
            <input type="number" value={form.next_invoice_no || 1} onChange={e => setForm(p => ({ ...p, next_invoice_no: Number(e.target.value) }))} placeholder="1" className={inputClass} />
          </div>
        </div>
        <button onClick={save} disabled={saving} className={"w-full bg-gradient-to-r from-primary to-indigo-600 text-white !py-3.5 rounded-xl font-extrabold text-lg hover:shadow-lg hover:shadow-primary/30 transition-all hover:scale-[1.01] flex items-center justify-center gap-2 " + (saving ? "opacity-60 cursor-not-allowed" : "")}>
          <Save size={20} /> {saving ? "Saving..." : "Save All Settings"}
        </button>
        <p className="text-xs text-center text-muted-foreground">Settings auto-save as you type. Click Save for confirmation.</p>
      </div>
    </div>
  );
};

export default TabSettings;
