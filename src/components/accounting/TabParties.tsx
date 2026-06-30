import { useEffect, useState, useRef, useCallback } from "react";
import { acc, fmtINR } from "@/lib/accounting";
import { toast } from "sonner";
import { Plus, Trash2, Users, Upload, X, Search, Download, Sparkles, UserPlus } from "lucide-react";

const inputClass = "w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

const TabParties = ({ userId }: { userId: string }) => {
  const [list, setList] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [search, setSearch] = useState("");
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkPreview, setBulkPreview] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", party_type: "customer", gstin: "", phone: "", email: "", address: "", opening_balance: 0 });
  const [autoSaved, setAutoSaved] = useState(false);
  const autoTimer = useRef<any>(null);

  const downloadSample = () => {
    const csv = "Name,Type,GSTIN,Phone,Email,Address,Balance\nRAM KUMAR,customer,22AAAAA0000A1Z5,9876543210,ram@email.com,123 Main Street,5000\nSITA DEVI,vendor,,9876543211,,45 Market Road,\nAMIT TRADERS,both,,9876543212,amit@traders.com,Shop No 5,10000\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "parties_sample.csv"; a.click(); URL.revokeObjectURL(a.href);
    toast.success("Sample CSV downloaded!");
  };

  const load = useCallback(async () => {
    const { data } = await acc("acc_parties").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    setList(data || []);
  }, [userId]);
  useEffect(() => { load(); }, [load]);

  // Auto-save draft
  useEffect(() => {
    if (!show) return;
    if (autoTimer.current) clearTimeout(autoTimer.current);
    autoTimer.current = setTimeout(() => {
      if (form.name) {
        localStorage.setItem("tracker_party_draft", JSON.stringify(form));
        setAutoSaved(true);
        setTimeout(() => setAutoSaved(false), 2000);
      }
    }, 800);
    return () => { if (autoTimer.current) clearTimeout(autoTimer.current); };
  }, [form, show]);

  // Restore draft
  useEffect(() => {
    const draft = localStorage.getItem("tracker_party_draft");
    if (draft) {
      try {
        const d = JSON.parse(draft);
        if (d.name) { setForm(d); setShow(true); }
      } catch {}
      localStorage.removeItem("tracker_party_draft");
    }
  }, []);

  const save = async () => {
    if (!form.name) { toast.error("Name required"); return; }
    const { error } = await acc("acc_parties").insert({ ...form, user_id: userId, name: form.name.toUpperCase() });
    if (error) { toast.error(error.message); return; }
    toast.success("Party added!");
    setForm({ name: "", party_type: "customer", gstin: "", phone: "", email: "", address: "", opening_balance: 0 });
    setShow(false); localStorage.removeItem("tracker_party_draft"); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this party?")) return;
    await acc("acc_parties").delete().eq("id", id);
    toast.success("Deleted"); load();
  };

  const parseBulk = () => {
    const rows = bulkText.trim().split("\n").filter(l => l.trim());
    const parsed: any[] = [];
    for (const row of rows) {
      const cols = row.split("\t").map(c => c.trim());
      if (cols.length >= 1 && cols[0]) parsed.push({ name: cols[0], type: cols[1] || "customer", gstin: cols[2] || "", phone: cols[3] || "", email: cols[4] || "", balance: Number(cols[5]) || 0 });
    }
    setBulkPreview(parsed);
  };

  const saveBulk = async () => {
    if (!bulkPreview.length) return;
    const rows = bulkPreview.map(b => ({ user_id: userId, name: b.name.toUpperCase(), party_type: b.type, gstin: b.gstin.toUpperCase(), phone: b.phone, email: b.email, address: "", opening_balance: b.balance }));
    const { error } = await acc("acc_parties").insert(rows);
    if (error) { toast.error(error.message); return; }
    toast.success(bulkPreview.length + " parties added!");
    setBulkMode(false); setBulkText(""); setBulkPreview([]); load();
  };

  const filtered = list.filter((p: any) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.phone || "").includes(search));
  const customerCount = list.filter((p: any) => p.party_type === "customer" || p.party_type === "both").length;
  const vendorCount = list.filter((p: any) => p.party_type === "vendor" || p.party_type === "both").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-extrabold font-display">Customers & Vendors</h3>
            {autoSaved && <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 animate-in fade-in"><Sparkles size={10} /> Draft saved</span>}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{customerCount} customers | {vendorCount} vendors</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={downloadSample} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-all"><Download size={14} /> Sample CSV</button>
          <button onClick={() => { setBulkMode(!bulkMode); setShow(false); }} className={"flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold transition-all " + (bulkMode ? "bg-violet-500 text-white shadow-lg shadow-violet-500/30" : "bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100")}><Upload size={14} /> Bulk Add</button>
          <button onClick={() => { setShow(!show); setBulkMode(false); }} className={"flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all " + (show ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "bg-accent text-accent-foreground hover:scale-105")}><UserPlus size={14} /> Add Party</button>
        </div>
      </div>

      {list.length > 0 && (
        <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or phone..." className={inputClass + " pl-9"} /></div>
      )}

      {show && (
        <div className="bg-card rounded-2xl border-2 border-golden/30 p-5 space-y-4 shadow-lg shadow-golden/5 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-2 gap-3">
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value.toUpperCase() }))} placeholder="NAME *" className={inputClass + " uppercase"} />
            <select value={form.party_type} onChange={e => setForm(p => ({ ...p, party_type: e.target.value }))} className={inputClass}><option value="customer">Customer</option><option value="vendor">Vendor</option><option value="both">Both</option></select>
            <input value={form.gstin} onChange={e => setForm(p => ({ ...p, gstin: e.target.value.toUpperCase() }))} placeholder="GSTIN" className={inputClass + " uppercase"} />
            <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, "") }))} placeholder="Phone" className={inputClass} />
            <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="Email" className={inputClass} />
            <input type="number" value={form.opening_balance} onChange={e => setForm(p => ({ ...p, opening_balance: Number(e.target.value) }))} placeholder="Opening balance" className={inputClass} />
          </div>
          <textarea value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Full Address" className={inputClass} rows={2} />
          <button onClick={save} className="btn-accent w-full !py-2.5 rounded-lg font-bold">Save Party</button>
        </div>
      )}

      {bulkMode && (
        <div className="bg-gradient-to-r from-violet-50 to-purple-50 border-2 border-violet-300 rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-violet-500 flex items-center justify-center"><Upload size={16} className="text-white" /></div><div><h4 className="font-extrabold text-violet-900">Bulk Party Import</h4><p className="text-xs text-violet-700">Tab-separated: Name, Type, GSTIN, Phone, Email, Balance</p></div></div>
            <div className="flex gap-2">
              <button onClick={downloadSample} className="p-2 rounded-lg bg-white border border-violet-200 hover:bg-violet-100 transition-colors"><Download size={14} className="text-violet-600" /></button>
              <button onClick={() => { setBulkMode(false); setBulkText(""); setBulkPreview([]); }} className="p-2 rounded-lg hover:bg-violet-200"><X size={16} /></button>
            </div>
          </div>
          <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} placeholder={"RAM KUMAR\tcustomer\t22AAAAA0000A1Z5\t9876543210\tram@email.com\t5000\nSITA DEVI\tvendor\t\t9876543211"} rows={4} className={inputClass + " font-mono text-xs"} />
          <div className="flex gap-2">
            <button onClick={parseBulk} className="px-4 py-2 rounded-lg bg-violet-500 text-white font-bold text-sm hover:bg-violet-600 transition-colors">Preview ({bulkText.trim().split("\n").filter(l => l.trim()).length} rows)</button>
            {bulkPreview.length > 0 && <button onClick={saveBulk} className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-sm hover:shadow-lg transition-all">Import {bulkPreview.length} Parties</button>}
          </div>
          {bulkPreview.length > 0 && (
            <div className="overflow-x-auto rounded-lg border max-h-48 overflow-y-auto">
              <table className="w-full text-xs"><thead className="bg-violet-100 sticky top-0"><tr><th className="px-3 py-2 text-left">Name</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Phone</th><th className="px-3 py-2 text-right">Balance</th></tr></thead><tbody>
                {bulkPreview.map((b: any, i: number) => <tr key={i} className="border-b"><td className="px-3 py-1.5 font-medium">{b.name}</td><td className="px-3 py-1.5 text-center">{b.type}</td><td className="px-3 py-1.5 text-center">{b.phone || "-"}</td><td className="px-3 py-1.5 text-right font-bold">{fmtINR(b.balance)}</td></tr>)}
              </tbody></table>
            </div>
          )}
        </div>
      )}

      <div className="bg-card rounded-2xl border-2 border-golden/20 overflow-hidden shadow-sm">
        {list.length === 0 ? (
          <div className="p-12 text-center"><div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3"><Users size={28} className="text-muted-foreground" /></div><p className="text-muted-foreground text-sm">No parties yet.</p><p className="text-muted-foreground text-xs mt-1">Add your first customer or vendor</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-muted/80 to-muted/40"><tr>
                <th className="px-3 py-2.5 text-left text-xs font-bold text-muted-foreground">Name</th>
                <th className="px-3 py-2.5 text-center text-xs font-bold text-muted-foreground">Type</th>
                <th className="px-3 py-2.5 text-left text-xs font-bold text-muted-foreground">Phone</th>
                <th className="px-3 py-2.5 text-left text-xs font-bold text-muted-foreground">GSTIN</th>
                <th className="px-3 py-2.5 text-right text-xs font-bold text-muted-foreground">Op. Balance</th>
                <th className="px-3 py-2.5 w-10"></th>
              </tr></thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground text-sm">No matching parties.</td></tr>}
                {filtered.map((p: any) => (
                  <tr key={p.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-2.5 font-bold">{p.name}</td>
                    <td className="px-3 py-2.5 text-center"><span className={"text-xs px-2 py-0.5 rounded-full font-bold " + (p.party_type === "customer" ? "bg-blue-100 text-blue-700" : p.party_type === "vendor" ? "bg-orange-100 text-orange-700" : "bg-purple-100 text-purple-700")}>{p.party_type}</span></td>
                    <td className="px-3 py-2.5 tabular-nums text-sm">{p.phone || "---"}</td>
                    <td className="px-3 py-2.5 text-xs font-mono text-muted-foreground">{p.gstin || "---"}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-bold">{fmtINR(p.opening_balance)}</td>
                    <td className="px-3 py-2.5 text-right"><button onClick={() => remove(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"><Trash2 size={14} /></button></td>
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

export default TabParties;
