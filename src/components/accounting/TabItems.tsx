import { useEffect, useState, useRef, useCallback } from "react";
import { acc, fmtINR } from "@/lib/accounting";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Package, Upload, X, Search, Download, Sparkles, Zap, Tag, Box } from "lucide-react";

const inputClass = "w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

// Sector-specific service/item templates
const sectorTemplates: Record<string, { name: string; sac?: string; hsn?: string; sale_price: number; gst_rate: number; unit?: string; purchase_price?: number; stock_qty?: number }[]> = {
  service: [
    { name: "PAN Card Service", sac: "9972", sale_price: 100, gst_rate: 18 },
    { name: "Aadhaar Print Service", sac: "9972", sale_price: 30, gst_rate: 18 },
    { name: "Voter ID Service", sac: "9972", sale_price: 50, gst_rate: 18 },
    { name: "Ayushman Card Service", sac: "9972", sale_price: 0, gst_rate: 0 },
    { name: "Domicile Certificate", sac: "9972", sale_price: 200, gst_rate: 18 },
    { name: "Income Certificate", sac: "9972", sale_price: 150, gst_rate: 18 },
    { name: "Caste Certificate", sac: "9972", sale_price: 200, gst_rate: 18 },
    { name: "Passport Application", sac: "9972", sale_price: 500, gst_rate: 18 },
    { name: "GST Registration", sac: "9983", sale_price: 999, gst_rate: 18 },
    { name: "ITR Filing", sac: "9983", sale_price: 499, gst_rate: 18 },
    { name: "Driving License", sac: "9972", sale_price: 300, gst_rate: 18 },
    { name: "Ration Card Service", sac: "9972", sale_price: 100, gst_rate: 0 },
  ],
  trader: [
    { name: "General Trading Item", hsn: "8471", unit: "pcs", sale_price: 100, purchase_price: 60, gst_rate: 18, stock_qty: 50 },
    { name: "Wholesale Item", hsn: "8471", unit: "box", sale_price: 500, purchase_price: 350, gst_rate: 18, stock_qty: 20 },
  ],
  manufacturer: [
    { name: "Finished Product", hsn: "8471", unit: "pcs", sale_price: 200, purchase_price: 80, gst_rate: 18, stock_qty: 100 },
    { name: "Raw Material", hsn: "8471", unit: "kg", sale_price: 0, purchase_price: 50, gst_rate: 18, stock_qty: 500 },
  ],
  professional: [
    { name: "Consultation Fee", sac: "9983", sale_price: 500, gst_rate: 18 },
    { name: "Follow-up Visit", sac: "9983", sale_price: 200, gst_rate: 18 },
    { name: "Report Preparation", sac: "9983", sale_price: 1000, gst_rate: 18 },
    { name: "Home Visit Charge", sac: "9983", sale_price: 800, gst_rate: 18 },
    { name: "Retainer Fee (Monthly)", sac: "9983", sale_price: 5000, gst_rate: 18 },
    { name: "Document Drafting", sac: "9983", sale_price: 1500, gst_rate: 18 },
    { name: "Legal Opinion", sac: "9983", sale_price: 3000, gst_rate: 18 },
    { name: "Audit Fee", sac: "9983", sale_price: 10000, gst_rate: 18 },
  ],
};

const sectorLabels: Record<string, string> = { service: "Services", trader: "Products", manufacturer: "Products & Materials", professional: "Professional Services" };

const TabItems = ({ userId }: { userId: string }) => {
  const [list, setList] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [search, setSearch] = useState("");
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkPreview, setBulkPreview] = useState<any[]>([]);
  const [sector, setSector] = useState<string>("service");
  const [loading, setLoading] = useState(true);
  const [autoSaved, setAutoSaved] = useState(false);
  const autoTimer = useRef<any>(null);

  const isService = sector === "service" || sector === "professional";
  const templates = sectorTemplates[sector] || [];
  const emptyForm = isService
    ? { name: "", sac: "", sale_price: 0, gst_rate: 18 }
    : { name: "", sku: "", hsn: "", unit: "pcs", sale_price: 0, purchase_price: 0, gst_rate: 18, stock_qty: 0 };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    const [itemsRes, profileRes] = await Promise.all([
      acc("acc_items").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("tracker_business_profile").select("business_sector").eq("user_id", userId).maybeSingle(),
    ]);
    const s = profileRes.data?.business_sector || "service";
    setSector(s);
    if (s === "service" || s === "professional") setForm({ name: "", sac: "", sale_price: 0, gst_rate: 18 });
    else setForm({ name: "", sku: "", hsn: "", unit: "pcs", sale_price: 0, purchase_price: 0, gst_rate: 18, stock_qty: 0 });
    setList(itemsRes.data || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  // Auto-save draft
  useEffect(() => {
    if (autoTimer.current) clearTimeout(autoTimer.current);
    autoTimer.current = setTimeout(() => {
      if (form.name) {
        localStorage.setItem("tracker_items_draft", JSON.stringify({ sector, form }));
        setAutoSaved(true);
        setTimeout(() => setAutoSaved(false), 2000);
      }
    }, 800);
    return () => { if (autoTimer.current) clearTimeout(autoTimer.current); };
  }, [form, sector]);

  // Restore draft
  useEffect(() => {
    const draft = localStorage.getItem("tracker_items_draft");
    if (draft) {
      try {
        const d = JSON.parse(draft);
        if (d.form?.name) { setForm(d.form); if (d.sector === sector) setShow(true); }
      } catch {}
      localStorage.removeItem("tracker_items_draft");
    }
  }, []);

  const quickAdd = async (tmpl: any) => {
    const row: any = { user_id: userId, name: tmpl.name.toUpperCase(), sale_price: Number(tmpl.sale_price), gst_rate: Number(tmpl.gst_rate) };
    if (isService) { row.sac = tmpl.sac || ""; row.hsn = ""; row.sku = ""; row.unit = "service"; row.purchase_price = 0; row.stock_qty = 0; }
    else { row.sku = (tmpl.sku || "").toUpperCase(); row.hsn = tmpl.hsn || ""; row.unit = tmpl.unit || "pcs"; row.purchase_price = Number(tmpl.purchase_price) || 0; row.stock_qty = Number(tmpl.stock_qty) || 0; row.sac = ""; }
    const { error } = await acc("acc_items").insert(row);
    if (error) { toast.error(error.message); return; }
    toast.success(tmpl.name + " added!");
    load();
  };

  const save = async () => {
    if (!form.name) { toast.error(isService ? "Service name required" : "Item name required"); return; }
    const row: any = { user_id: userId, name: form.name.toUpperCase(), sale_price: Number(form.sale_price), gst_rate: Number(form.gst_rate) };
    if (isService) { row.sac = form.sac; row.hsn = ""; row.sku = ""; row.unit = "service"; row.purchase_price = 0; row.stock_qty = 0; }
    else { row.sku = (form as any).sku?.toUpperCase() || ""; row.hsn = (form as any).hsn || ""; row.unit = (form as any).unit || "pcs"; row.purchase_price = Number((form as any).purchase_price) || 0; row.stock_qty = Number((form as any).stock_qty) || 0; row.sac = ""; }
    const { error } = await acc("acc_items").insert(row);
    if (error) { toast.error(error.message); return; }
    toast.success(isService ? "Service added!" : "Item added!");
    setForm(isService ? { name: "", sac: "", sale_price: 0, gst_rate: 18 } : { name: "", sku: "", hsn: "", unit: "pcs", sale_price: 0, purchase_price: 0, gst_rate: 18, stock_qty: 0 });
    setShow(false); localStorage.removeItem("tracker_items_draft"); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this " + (isService ? "service" : "item") + "?")) return;
    await acc("acc_items").delete().eq("id", id);
    toast.success("Deleted"); load();
  };

  const downloadSample = () => {
    let csv: string;
    if (isService) csv = "Service Name,SAC Code,Price,GST%\nPAN Card Service,9972,100,18\nAadhaar Print Service,9972,30,18\nVoter ID Service,9972,50,18\nAyushman Card,9972,0,0\n";
    else csv = "Item Name,SKU,HSN,Unit,Sale Price,Purchase Price,GST%,Stock\nWidget A,SKU001,8471,pcs,100,60,18,50\nService B,,9983,hour,500,,18,0\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = isService ? "services_sample.csv" : "items_sample.csv";
    a.click(); URL.revokeObjectURL(a.href);
    toast.success("Sample CSV downloaded!");
  };

  const parseBulk = () => {
    const rows = bulkText.trim().split("\n").filter(l => l.trim());
    const parsed: any[] = [];
    for (const row of rows) {
      const cols = row.split("\t").map(c => c.trim());
      if (cols.length < 1 || !cols[0]) continue;
      if (isService) parsed.push({ name: cols[0], sac: cols[1] || "", sale: Number(cols[2]) || 0, gst: Number(cols[3]) || 18 });
      else parsed.push({ name: cols[0], sku: cols[1] || "", hsn: cols[2] || "", unit: cols[3] || "pcs", sale: Number(cols[4]) || 0, purchase: Number(cols[5]) || 0, gst: Number(cols[6]) || 18, stock: Number(cols[7]) || 0 });
    }
    setBulkPreview(parsed);
  };

  const saveBulk = async () => {
    if (!bulkPreview.length) return;
    const rows = bulkPreview.map(b => {
      const r: any = { user_id: userId, name: b.name.toUpperCase(), sale_price: b.sale, gst_rate: b.gst };
      if (isService) { r.sac = b.sac; r.hsn = ""; r.sku = ""; r.unit = "service"; r.purchase_price = 0; r.stock_qty = 0; }
      else { r.sku = b.sku?.toUpperCase() || ""; r.hsn = b.hsn; r.unit = b.unit; r.purchase_price = b.purchase; r.stock_qty = b.stock; r.sac = ""; }
      return r;
    });
    const { error } = await acc("acc_items").insert(rows);
    if (error) { toast.error(error.message); return; }
    toast.success(bulkPreview.length + " " + (isService ? "services" : "items") + " added!");
    setBulkMode(false); setBulkText(""); setBulkPreview([]); load();
  };

  const stockValue = list.reduce((s, i) => s + Number(i.stock_qty || 0) * Number(i.purchase_price || 0), 0);
  const totalRevenue = list.reduce((s, i) => s + Number(i.sale_price || 0), 0);
  const filtered = list.filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()) || (i.sku || "").toLowerCase().includes(search.toLowerCase()) || (i.sac || "").toLowerCase().includes(search.toLowerCase()));

  // Check which templates are already added
  const existingNames = new Set(list.map((i: any) => i.name?.toUpperCase()));
  const availableTemplates = templates.filter(t => !existingNames.has(t.name.toUpperCase()));

  if (loading) return <div className="text-center py-10 animate-pulse text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-extrabold font-display">{sectorLabels[sector] || "Items & Services"}</h3>
            {autoSaved && <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 animate-in fade-in"><Sparkles size={10} /> Draft saved</span>}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{list.length} {isService ? "services" : "items"} | {isService ? fmtINR(totalRevenue) + " total service value" : fmtINR(stockValue) + " stock value"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={downloadSample} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-all">
            <Download size={14} /> Sample CSV
          </button>
          <button onClick={() => { setBulkMode(!bulkMode); setShow(false); }} className={"flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold transition-all " + (bulkMode ? "bg-violet-500 text-white shadow-lg shadow-violet-500/30" : "bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100")}>
            <Upload size={14} /> Bulk Add
          </button>
          <button onClick={() => { setShow(!show); setBulkMode(false); }} className={"flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all " + (show ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "bg-accent text-accent-foreground hover:scale-105")}>
            <Plus size={14} /> {isService ? "Add Service" : "Add Item"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl p-4 text-white">
          {isService ? <Tag size={18} className="mb-1 opacity-80" /> : <Package size={18} className="mb-1 opacity-80" />}
          <p className="text-2xl font-extrabold">{list.length}</p>
          <p className="text-xs opacity-80">Total {isService ? "Services" : "Items"}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-4 text-white">
          {isService ? <Sparkles size={18} className="mb-1 opacity-80" /> : <Box size={18} className="mb-1 opacity-80" />}
          <p className="text-2xl font-extrabold">{isService ? fmtINR(totalRevenue) : fmtINR(stockValue)}</p>
          <p className="text-xs opacity-80">{isService ? "Service Value" : "Stock Value"}</p>
        </div>
      </div>

      {/* Sector-specific quick-add templates */}
      {availableTemplates.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center"><Zap size={16} className="text-white" /></div>
            <div>
              <h4 className="font-extrabold text-amber-900 text-sm">Quick Add -- {sectorLabels[sector]}</h4>
              <p className="text-xs text-amber-700">Click to instantly add common {isService ? "services" : "products"}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableTemplates.map((t, i) => (
              <button key={i} onClick={() => quickAdd(t)}
                className="px-3 py-1.5 rounded-lg bg-white border border-amber-200 text-xs font-bold text-amber-900 hover:bg-amber-100 hover:border-amber-300 hover:shadow-sm transition-all flex items-center gap-1.5">
                <Plus size={12} className="text-amber-500" />
                {t.name}
                {t.sale_price > 0 && <span className="text-amber-600 font-mono">({fmtINR(t.sale_price)})</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {list.length > 0 && (
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={"Search " + (isService ? "services..." : "items or SKU...")} className={inputClass + " pl-9"} />
        </div>
      )}

      {show && (
        <div className="bg-card rounded-2xl border-2 border-golden/30 p-5 space-y-4 shadow-lg shadow-golden/5 animate-in fade-in slide-in-from-top-2 duration-300">
          {isService ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder={"SERVICE NAME * (e.g. PAN Card, Voter ID)"} className={inputClass + " uppercase"} />
              <input value={form.sac || ""} onChange={e => setForm(p => ({ ...p, sac: e.target.value }))} placeholder="SAC Code (e.g. 9972)" className={inputClass} />
              <input type="number" value={form.sale_price} onChange={e => setForm(p => ({ ...p, sale_price: Number(e.target.value) }))} placeholder="Price (Rs.)" className={inputClass} />
              <input type="number" value={form.gst_rate} onChange={e => setForm(p => ({ ...p, gst_rate: Number(e.target.value) }))} placeholder="GST %" className={inputClass} />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <input value={form.name} onChange={e => setForm((p: any) => ({ ...p, name: e.target.value }))} placeholder="ITEM NAME *" className={inputClass + " uppercase"} />
              <input value={(form as any).sku || ""} onChange={e => setForm((p: any) => ({ ...p, sku: e.target.value }))} placeholder="SKU" className={inputClass + " uppercase"} />
              <input value={(form as any).hsn || ""} onChange={e => setForm((p: any) => ({ ...p, hsn: e.target.value }))} placeholder="HSN/SAC" className={inputClass} />
              <input value={(form as any).unit || ""} onChange={e => setForm((p: any) => ({ ...p, unit: e.target.value }))} placeholder="Unit" className={inputClass} />
              <input type="number" value={form.sale_price} onChange={e => setForm(p => ({ ...p, sale_price: Number(e.target.value) }))} placeholder="Sale price" className={inputClass} />
              <input type="number" value={(form as any).purchase_price || 0} onChange={e => setForm((p: any) => ({ ...p, purchase_price: Number(e.target.value) }))} placeholder="Purchase price" className={inputClass} />
              <input type="number" value={form.gst_rate} onChange={e => setForm(p => ({ ...p, gst_rate: Number(e.target.value) }))} placeholder="GST %" className={inputClass} />
              <input type="number" value={(form as any).stock_qty || 0} onChange={e => setForm((p: any) => ({ ...p, stock_qty: Number(e.target.value) }))} placeholder="Opening stock" className={inputClass} />
            </div>
          )}
          <button onClick={save} className="btn-accent w-full !py-2.5 rounded-lg font-bold">Save {isService ? "Service" : "Item"}</button>
        </div>
      )}

      {bulkMode && (
        <div className="bg-gradient-to-r from-violet-50 to-purple-50 border-2 border-violet-300 rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-500 flex items-center justify-center"><Upload size={16} className="text-white" /></div>
              <div><h4 className="font-extrabold text-violet-900">Bulk {isService ? "Service" : "Item"} Import</h4><p className="text-xs text-violet-700">{isService ? "Tab-separated: Service Name, SAC, Price, GST%" : "Tab-separated: Name, SKU, HSN, Unit, Sale, Purchase, GST%, Stock"}</p></div>
            </div>
            <div className="flex gap-2">
              <button onClick={downloadSample} className="p-2 rounded-lg bg-white border border-violet-200 hover:bg-violet-100 transition-colors"><Download size={14} className="text-violet-600" /></button>
              <button onClick={() => { setBulkMode(false); setBulkText(""); setBulkPreview([]); }} className="p-2 rounded-lg hover:bg-violet-200"><X size={16} /></button>
            </div>
          </div>
          <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} placeholder={isService ? "PAN Card Service\t9972\t100\t18\nAadhaar Print\t9972\t30\t18\nVoter ID Service\t9972\t50\t18" : "WIDGET A\tSKU001\t8471\tpcs\t100\t60\t18\t50\nSERVICE B\t\t9983\thour\t500\t\t18\t0"} rows={4} className={inputClass + " font-mono text-xs"} />
          <div className="flex gap-2">
            <button onClick={parseBulk} className="px-4 py-2 rounded-lg bg-violet-500 text-white font-bold text-sm hover:bg-violet-600 transition-colors">Preview ({bulkText.trim().split("\n").filter(l => l.trim()).length} rows)</button>
            {bulkPreview.length > 0 && <button onClick={saveBulk} className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-sm hover:shadow-lg transition-all">Import {bulkPreview.length} {isService ? "Services" : "Items"}</button>}
          </div>
          {bulkPreview.length > 0 && (
            <div className="overflow-x-auto rounded-lg border max-h-48 overflow-y-auto">
              <table className="w-full text-xs"><thead className="bg-violet-100 sticky top-0"><tr>
                <th className="px-3 py-2 text-left">{isService ? "Service" : "Item"}</th>
                {isService ? <th className="px-3 py-2">SAC</th> : <><th className="px-3 py-2">SKU</th><th className="px-3 py-2 text-right">Stock</th></>}
                <th className="px-3 py-2 text-right">Price</th><th className="px-3 py-2">GST%</th>
              </tr></thead><tbody>
                {bulkPreview.map((b: any, i: number) => <tr key={i} className="border-b"><td className="px-3 py-1.5 font-medium">{b.name}</td>{isService ? <td className="px-3 py-1.5 text-center">{b.sac || "-"}</td> : <><td className="px-3 py-1.5 text-center">{b.sku || "-"}</td><td className="px-3 py-1.5 text-right">{b.stock} {b.unit}</td></>}<td className="px-3 py-1.5 text-right font-bold">{fmtINR(b.sale)}</td><td className="px-3 py-1.5 text-center">{b.gst}%</td></tr>)}
              </tbody></table>
            </div>
          )}
        </div>
      )}

      <div className="bg-card rounded-2xl border-2 border-golden/20 overflow-hidden shadow-sm">
        {list.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3"><Package size={28} className="text-muted-foreground" /></div>
            <p className="text-muted-foreground text-sm">No {isService ? "services" : "items"} yet.</p>
            <p className="text-muted-foreground text-xs mt-1">{isService ? "Add services like PAN Card, Voter ID, Ayushman Card" : "Add your products or services"}</p>
            {availableTemplates.length > 0 && (
              <button onClick={() => quickAdd(availableTemplates[0])} className="mt-3 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:shadow-lg transition-all">
                <Zap size={14} className="inline mr-1" /> Quick Add: {availableTemplates[0].name}
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-muted/80 to-muted/40"><tr>
                <th className="px-3 py-2.5 text-left text-xs font-bold text-muted-foreground">{isService ? "Service Name" : "Item"}</th>
                {!isService && <th className="px-3 py-2.5 text-left text-xs font-bold text-muted-foreground">HSN</th>}
                <th className="px-3 py-2.5 text-right text-xs font-bold text-muted-foreground">Price</th>
                <th className="px-3 py-2.5 text-right text-xs font-bold text-muted-foreground">GST</th>
                {!isService && <th className="px-3 py-2.5 text-right text-xs font-bold text-muted-foreground">Stock</th>}
                <th className="px-3 py-2.5 w-10"></th>
              </tr></thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={isService ? 4 : 6} className="p-6 text-center text-muted-foreground text-sm">No matching {isService ? "services" : "items"}.</td></tr>}
                {filtered.map((i: any) => (
                  <tr key={i.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-2.5 font-bold">{i.name} {(i.sac || i.sku) && <span className="text-xs text-muted-foreground font-normal">({i.sac || i.sku})</span>}</td>
                    {!isService && <td className="px-3 py-2.5 text-xs font-mono text-muted-foreground">{i.hsn || "---"}</td>}
                    <td className="px-3 py-2.5 text-right tabular-nums font-bold">{fmtINR(i.sale_price)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{i.gst_rate}%</td>
                    {!isService && <td className="px-3 py-2.5 text-right tabular-nums"><span className={Number(i.stock_qty || 0) <= 5 ? "text-red-600 font-bold" : ""}>{i.stock_qty || 0} {i.unit}</span></td>}
                    <td className="px-3 py-2.5 text-right">
                      <button onClick={() => remove(i.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TabItems;
