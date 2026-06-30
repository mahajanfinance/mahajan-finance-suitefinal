import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, Upload, X, Search, FileSpreadsheet, Download, Sparkles } from "lucide-react";

interface Props { userId: string }
interface Entry { id: string; date: string; type: string; amount: number; description: string; party_name: string }

const inputClass = "w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";
const types = [
  { val: "cash_in", label: "Cash In", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { val: "cash_out", label: "Cash Out", color: "bg-red-100 text-red-700 border-red-200" },
  { val: "bank_in", label: "Bank In", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { val: "bank_out", label: "Bank Out", color: "bg-orange-100 text-orange-700 border-orange-200" },
];

const TabCashBook = ({ userId }: Props) => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], type: "cash_in", amount: "", description: "", party_name: "" });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [csvMode, setCsvMode] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [autoSaved, setAutoSaved] = useState(false);
  const autoTimer = useRef<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const downloadSample = () => {
    const csv = "Date,Amount,Description,Type,Party\n2025-01-15,5000,Client Payment,cash,Ram Kumar\n2025-01-16,-2500,Office Rent,bank,\n2025-01-17,10000,Service Income,cash,Sita Devi\n2025-01-18,-1500,Electricity Bill,bank,\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "cashbook_sample.csv"; a.click(); URL.revokeObjectURL(a.href);
    toast.success("Sample CSV downloaded!");
  };

  const load = useCallback(async () => {
    const { data } = await supabase.from("tracker_cash_book").select("*").eq("user_id", userId).order("date", { ascending: false });
    setEntries((data as Entry[]) || []); setLoading(false);
  }, [userId]);
  useEffect(() => { load(); }, [load]);

  // Auto-save draft
  useEffect(() => {
    if (autoTimer.current) clearTimeout(autoTimer.current);
    autoTimer.current = setTimeout(() => {
      if (form.amount && Number(form.amount) > 0) {
        localStorage.setItem("tracker_cashbook_draft", JSON.stringify(form));
        setAutoSaved(true);
        setTimeout(() => setAutoSaved(false), 2000);
      }
    }, 800);
    return () => { if (autoTimer.current) clearTimeout(autoTimer.current); };
  }, [form]);

  // Restore draft
  useEffect(() => {
    const draft = localStorage.getItem("tracker_cashbook_draft");
    if (draft) {
      try {
        const d = JSON.parse(draft);
        if (d.amount) setForm(d);
      } catch {}
      localStorage.removeItem("tracker_cashbook_draft");
    }
  }, []);

  const handleAdd = async () => {
    if (!form.amount || Number(form.amount) <= 0) return toast.error("Enter a valid amount");
    const { error } = await supabase.from("tracker_cash_book").insert({ user_id: userId, ...form, amount: Number(form.amount) });
    if (error) toast.error(error.message);
    else {
      toast.success("Entry added");
      setForm({ date: new Date().toISOString().split("T")[0], type: "cash_in", amount: "", description: "", party_name: "" });
      localStorage.removeItem("tracker_cashbook_draft");
      load();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    await supabase.from("tracker_cash_book").delete().eq("id", id); toast.success("Deleted"); load();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader(); reader.onload = (ev) => { setCsvText(ev.target?.result as string || ""); }; reader.readAsText(f);
  };

  const parseCsv = () => {
    const rows = csvText.trim().split("\n").filter(l => l.trim());
    const parsed: any[] = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      let cols = row.includes("\t") ? row.split("\t") : row.includes("|") ? row.split("|") : row.split(",");
      cols = cols.map(c => c.trim().replace(/^[\"']+|[\"']+$/g, ""));
      if (cols.length < 2) continue;
      const amount = Number(cols[1]); if (isNaN(amount)) continue;
      const isIn = amount > 0;
      let typeVal = isIn ? "cash_in" : "cash_out";
      if (cols.length > 3) { const typeStr = (cols[3] || "").toLowerCase(); if (typeStr.includes("bank")) typeVal = isIn ? "bank_in" : "bank_out"; }
      parsed.push({ date: cols[0] || new Date().toISOString().split("T")[0], type: typeVal, amount: Math.abs(amount), description: cols[2] || "", party_name: cols[4] || "" });
    }
    setCsvPreview(parsed);
  };

  const saveCsv = async () => {
    if (!csvPreview.length) return;
    const rows = csvPreview.map(c => ({ user_id: userId, ...c }));
    const { error } = await supabase.from("tracker_cash_book").insert(rows);
    if (error) { toast.error(error.message); return; }
    toast.success(csvPreview.length + " entries imported!");
    setCsvMode(false); setCsvText(""); setCsvPreview([]); load();
  };

  const cashIn = entries.filter(e => e.type === "cash_in").reduce((s, e) => s + e.amount, 0);
  const cashOut = entries.filter(e => e.type === "cash_out").reduce((s, e) => s + e.amount, 0);
  const bankIn = entries.filter(e => e.type === "bank_in").reduce((s, e) => s + e.amount, 0);
  const bankOut = entries.filter(e => e.type === "bank_out").reduce((s, e) => s + e.amount, 0);
  const cashBal = cashIn - cashOut;
  const bankBal = bankIn - bankOut;
  const filtered = entries.filter(e => !search || (e.description || "").toLowerCase().includes(search.toLowerCase()) || (e.party_name || "").toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="text-center py-10 animate-pulse text-muted-foreground">Loading Cash Book...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-extrabold font-display">Cash & Bank Book</h3>
            {autoSaved && <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 animate-in fade-in"><Sparkles size={10} /> Draft saved</span>}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{entries.length} entries tracked</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={downloadSample} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-all"><Download size={14} /> Sample CSV</button>
          <button onClick={() => setCsvMode(!csvMode)} className={"flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold transition-all " + (csvMode ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100")}><FileSpreadsheet size={14} /> Import CSV</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-4 text-white shadow-lg shadow-emerald-500/20"><TrendingUp size={18} className="mb-1 opacity-80" /><p className="text-xl font-extrabold">{cashIn.toLocaleString("en-IN")}</p><p className="text-xs opacity-80">Cash In</p></div>
        <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl p-4 text-white shadow-lg shadow-red-500/20"><TrendingDown size={18} className="mb-1 opacity-80" /><p className="text-xl font-extrabold">{cashOut.toLocaleString("en-IN")}</p><p className="text-xs opacity-80">Cash Out</p></div>
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 text-white shadow-lg shadow-blue-500/20"><Wallet size={18} className="mb-1 opacity-80" /><p className="text-xl font-extrabold">{bankBal.toLocaleString("en-IN")}</p><p className="text-xs opacity-80">Bank Balance</p></div>
        <div className={"bg-gradient-to-br rounded-xl p-4 text-white shadow-lg " + (cashBal >= 0 ? "from-teal-500 to-emerald-600 shadow-teal-500/20" : "from-red-500 to-rose-600 shadow-red-500/20")}><Wallet size={18} className="mb-1 opacity-80" /><p className="text-xl font-extrabold">{cashBal.toLocaleString("en-IN")}</p><p className="text-xs opacity-80">Cash Balance</p></div>
      </div>

      {csvMode && (
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center"><FileSpreadsheet size={16} className="text-white" /></div><div><h4 className="font-extrabold text-emerald-900">Import Bank Statement</h4><p className="text-xs text-emerald-700">Upload CSV or paste: Date, Amount, Description, Type, Party</p></div></div>
            <div className="flex gap-2">
              <button onClick={downloadSample} className="p-2 rounded-lg bg-white border border-emerald-200 hover:bg-emerald-100 transition-colors"><Download size={14} className="text-emerald-600" /></button>
              <button onClick={() => { setCsvMode(false); setCsvText(""); setCsvPreview([]); }} className="p-2 rounded-lg hover:bg-emerald-200"><X size={16} /></button>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
            <button onClick={() => fileRef.current?.click()} className="px-3 py-2 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-sm hover:bg-emerald-200 border border-emerald-200">Upload CSV File</button>
            <span className="text-xs text-muted-foreground">or paste below</span>
          </div>
          <textarea value={csvText} onChange={e => setCsvText(e.target.value)} placeholder={"Date,Amount,Description,Type,Party\n2025-01-15,5000,Client Payment,cash,Ram Kumar\n2025-01-16,-2500,Office Rent,bank,\n2025-01-17,10000,Service Income,cash,Sita Devi"} rows={5} className={inputClass + " font-mono text-xs"} />
          <div className="flex gap-2">
            <button onClick={parseCsv} className="px-4 py-2 rounded-lg bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition-colors">Preview</button>
            {csvPreview.length > 0 && <button onClick={saveCsv} className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold text-sm hover:shadow-lg transition-all">Import {csvPreview.length} Entries</button>}
          </div>
          {csvPreview.length > 0 && (
            <div className="overflow-x-auto rounded-lg border max-h-48 overflow-y-auto">
              <table className="w-full text-xs"><thead className="bg-emerald-100 sticky top-0"><tr><th className="px-3 py-2 text-left">Date</th><th className="px-3 py-2 text-left">Type</th><th className="px-3 py-2 text-left">Description</th><th className="px-3 py-2 text-left">Party</th><th className="px-3 py-2 text-right">Amount</th></tr></thead><tbody>
                {csvPreview.map((c: any, i: number) => { const t = types.find(x => x.val === c.type); return <tr key={i} className="border-b"><td className="px-3 py-1.5">{c.date}</td><td className="px-3 py-1.5"><span className={"px-1.5 py-0.5 rounded text-xs font-bold border " + (t?.color || "")}>{t?.label || c.type}</span></td><td className="px-3 py-1.5">{c.description}</td><td className="px-3 py-1.5">{c.party_name || "-"}</td><td className="px-3 py-1.5 text-right font-bold">{c.amount.toLocaleString("en-IN")}</td></tr>; })}
              </tbody></table>
            </div>
          )}
        </div>
      )}

      <div className="bg-card rounded-2xl border-2 border-golden/30 p-5 space-y-4 shadow-sm">
        <h4 className="font-bold text-sm flex items-center gap-2"><Plus size={16} className="text-primary" /> Quick Add Entry</h4>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className={inputClass} />
          <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className={inputClass}>{types.map(t => <option key={t.val} value={t.val}>{t.label}</option>)}</select>
          <input type="number" placeholder="Amount (Rs.)" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} className={inputClass} />
          <input placeholder="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className={inputClass} />
          <input placeholder="Party (optional)" value={form.party_name} onChange={e => setForm(p => ({ ...p, party_name: e.target.value }))} className={inputClass} />
          <button onClick={handleAdd} className="bg-gradient-to-r from-primary to-indigo-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-primary/30 transition-all">Add</button>
        </div>
      </div>

      {entries.length > 3 && (
        <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search description or party..." className={inputClass + " pl-9"} /></div>
      )}

      <div className="bg-card rounded-2xl border-2 border-golden/20 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-muted/80 to-muted/40"><tr>
              <th className="px-3 py-2.5 text-left text-xs font-bold text-muted-foreground">Date</th>
              <th className="px-3 py-2.5 text-center text-xs font-bold text-muted-foreground">Type</th>
              <th className="px-3 py-2.5 text-left text-xs font-bold text-muted-foreground">Narration</th>
              <th className="px-3 py-2.5 text-left text-xs font-bold text-muted-foreground">Party</th>
              <th className="px-3 py-2.5 text-right text-xs font-bold text-muted-foreground">Amount</th>
              <th className="px-3 py-2.5 w-10"></th>
            </tr></thead>
            <tbody>
              {entries.length === 0 && <tr><td colSpan={6} className="p-12 text-center text-muted-foreground"><div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3"><Wallet size={28} className="text-muted-foreground" /></div><p className="text-sm">No entries yet.</p><p className="text-xs mt-1">Add entries manually or import from CSV</p></td></tr>}
              {filtered.map(e => {
                const t = types.find(x => x.val === e.type);
                return (
                  <tr key={e.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-2.5 tabular-nums text-xs text-muted-foreground">{e.date}</td>
                    <td className="px-3 py-2.5 text-center"><span className={"px-2 py-0.5 rounded-full text-xs font-bold border " + (t?.color || "")}>{t?.label || e.type}</span></td>
                    <td className="px-3 py-2.5">{e.description || "---"}</td>
                    <td className="px-3 py-2.5 text-muted-foreground text-xs">{e.party_name || "---"}</td>
                    <td className="px-3 py-2.5 text-right font-bold tabular-nums">{e.amount.toLocaleString("en-IN")}</td>
                    <td className="px-3 py-2.5 text-right"><button onClick={() => handleDelete(e.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"><Trash2 size={14} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default TabCashBook;
