import { useEffect, useState, useRef, useCallback } from "react";
import { acc, fmtINR, todayISO } from "@/lib/accounting";
import { toast } from "sonner";
import { Plus, Trash2, Receipt, Upload, X, Search, TrendingDown, Download, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const inputClass = "w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";
const cats = ["Rent", "Salary", "Utilities", "Travel", "Office Supplies", "Marketing", "Professional Fees", "Bank Charges", "Repairs", "Tax", "Other"];

const TabExpenses = ({ userId }: { userId: string }) => {
  const [list, setList] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [search, setSearch] = useState("");
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkPreview, setBulkPreview] = useState<any[]>([]);
  const [form, setForm] = useState({ category: "Office Supplies", amount: 0, gst: 0, expense_date: todayISO(), mode: "cash", notes: "" });
  const [file, setFile] = useState<File | null>(null);
  const [autoSaved, setAutoSaved] = useState(false);
  const autoTimer = useRef<any>(null);

  const downloadSample = () => {
    const csv = "Date,Category,Amount,GST,Mode,Notes\n2025-01-15,Rent,15000,0,bank,Office rent January\n2025-01-16,Utilities,3500,630,bank,Electricity bill\n2025-01-17,Travel,2000,0,cash,Client visit\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "expenses_sample.csv"; a.click(); URL.revokeObjectURL(a.href);
    toast.success("Sample CSV downloaded!");
  };

  const load = useCallback(async () => {
    const { data } = await acc("acc_expenses").select("*").eq("user_id", userId).order("expense_date", { ascending: false });
    setList(data || []);
  }, [userId]);
  useEffect(() => { load(); }, [load]);

  // Auto-save draft
  useEffect(() => {
    if (!show) return;
    if (autoTimer.current) clearTimeout(autoTimer.current);
    autoTimer.current = setTimeout(() => {
      if (form.amount > 0) {
        localStorage.setItem("tracker_expense_draft", JSON.stringify(form));
        setAutoSaved(true);
        setTimeout(() => setAutoSaved(false), 2000);
      }
    }, 800);
    return () => { if (autoTimer.current) clearTimeout(autoTimer.current); };
  }, [form, show]);

  // Restore draft
  useEffect(() => {
    const draft = localStorage.getItem("tracker_expense_draft");
    if (draft) {
      try {
        const d = JSON.parse(draft);
        if (d.amount > 0) { setForm(d); setShow(true); }
      } catch {}
      localStorage.removeItem("tracker_expense_draft");
    }
  }, []);

  const save = async () => {
    if (!form.amount) { toast.error("Enter amount"); return; }
    let receipt_url: string | null = null;
    if (file) { const path = userId + "/receipts/" + Date.now() + "-" + file.name; const { error: upErr } = await supabase.storage.from("receipts").upload(path, file); if (!upErr) receipt_url = path; }
    const { error } = await acc("acc_expenses").insert({ ...form, user_id: userId, notes: form.notes.toUpperCase(), receipt_url });
    if (error) { toast.error(error.message); return; }
    toast.success("Expense recorded!");
    setForm({ category: "Office Supplies", amount: 0, gst: 0, expense_date: todayISO(), mode: "cash", notes: "" });
    setFile(null); setShow(false); localStorage.removeItem("tracker_expense_draft"); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    await acc("acc_expenses").delete().eq("id", id);
    toast.success("Deleted"); load();
  };

  const parseBulk = () => {
    const rows = bulkText.trim().split("\n").filter(l => l.trim());
    const parsed: any[] = [];
    for (const row of rows) {
      const cols = row.split("\t").map(c => c.trim());
      if (cols.length >= 2) parsed.push({ date: cols[0], category: cols[1], amount: Number(cols[2]) || 0, gst: Number(cols[3]) || 0, mode: cols[4] || "cash", notes: cols[5] || "" });
    }
    setBulkPreview(parsed);
  };

  const saveBulk = async () => {
    if (!bulkPreview.length) return;
    const rows = bulkPreview.map(b => ({ user_id: userId, expense_date: b.date, category: b.category, amount: b.amount, gst: b.gst, mode: b.mode, notes: b.notes.toUpperCase() }));
    const { error } = await acc("acc_expenses").insert(rows);
    if (error) { toast.error(error.message); return; }
    toast.success(bulkPreview.length + " expenses added!");
    setBulkMode(false); setBulkText(""); setBulkPreview([]); load();
  };

  const total = list.reduce((s, e) => s + Number(e.amount) + Number(e.gst), 0);
  const totalGST = list.reduce((s, e) => s + Number(e.gst), 0);
  const filtered = list.filter((e: any) => !search || (e.category || "").toLowerCase().includes(search.toLowerCase()) || (e.notes || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-extrabold font-display">Expenses</h3>
            {autoSaved && <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 animate-in fade-in"><Sparkles size={10} /> Draft saved</span>}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{list.length} recorded | Total: <b className="text-foreground">{fmtINR(total)}</b></p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={downloadSample} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-all"><Download size={14} /> Sample CSV</button>
          <button onClick={() => { setBulkMode(!bulkMode); setShow(false); }} className={"flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold transition-all " + (bulkMode ? "bg-violet-500 text-white shadow-lg shadow-violet-500/30" : "bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100")}><Upload size={14} /> Bulk Add</button>
          <button onClick={() => { setShow(!show); setBulkMode(false); }} className={"flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all " + (show ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "bg-accent text-accent-foreground hover:scale-105")}><Plus size={14} /> Add Expense</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl p-4 text-white shadow-lg shadow-red-500/20"><TrendingDown size={18} className="mb-1 opacity-80" /><p className="text-2xl font-extrabold">{fmtINR(total)}</p><p className="text-xs opacity-80">Total Spent</p></div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl p-4 text-white shadow-lg shadow-amber-500/20"><Receipt size={18} className="mb-1 opacity-80" /><p className="text-2xl font-extrabold">{list.length}</p><p className="text-xs opacity-80">Entries</p></div>
        <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl p-4 text-white shadow-lg shadow-indigo-500/20 hidden md:block"><Receipt size={18} className="mb-1 opacity-80" /><p className="text-2xl font-extrabold">{fmtINR(totalGST)}</p><p className="text-xs opacity-80">Total GST</p></div>
      </div>

      {list.length > 0 && (
        <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by category or notes..." className={inputClass + " pl-9"} /></div>
      )}

      {show && (
        <div className="bg-card rounded-2xl border-2 border-golden/30 p-5 space-y-4 shadow-lg shadow-golden/5 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={inputClass}>{cats.map(c => <option key={c}>{c}</option>)}</select>
            <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: Number(e.target.value) }))} placeholder="Amount" className={inputClass} />
            <input type="number" value={form.gst} onChange={e => setForm(p => ({ ...p, gst: Number(e.target.value) }))} placeholder="GST" className={inputClass} />
            <input type="date" value={form.expense_date} onChange={e => setForm(p => ({ ...p, expense_date: e.target.value }))} className={inputClass} />
            <select value={form.mode} onChange={e => setForm(p => ({ ...p, mode: e.target.value }))} className={inputClass}><option value="cash">Cash</option><option value="bank">Bank</option><option value="upi">UPI</option><option value="card">Card</option></select>
            <input type="file" accept="image/*,application/pdf" onChange={e => setFile(e.target.files?.[0] || null)} className={inputClass} />
          </div>
          <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value.toUpperCase() }))} placeholder="NOTES" className={inputClass + " uppercase"} />
          <button onClick={save} className="btn-accent w-full !py-2.5 rounded-lg font-bold">Save Expense</button>
        </div>
      )}

      {bulkMode && (
        <div className="bg-gradient-to-r from-violet-50 to-purple-50 border-2 border-violet-300 rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-violet-500 flex items-center justify-center"><Upload size={16} className="text-white" /></div><div><h4 className="font-extrabold text-violet-900">Bulk Expense Import</h4><p className="text-xs text-violet-700">Tab-separated: Date, Category, Amount, GST, Mode, Notes</p></div></div>
            <div className="flex gap-2">
              <button onClick={downloadSample} className="p-2 rounded-lg bg-white border border-violet-200 hover:bg-violet-100 transition-colors"><Download size={14} className="text-violet-600" /></button>
              <button onClick={() => { setBulkMode(false); setBulkText(""); setBulkPreview([]); }} className="p-2 rounded-lg hover:bg-violet-200"><X size={16} /></button>
            </div>
          </div>
          <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} placeholder={"2025-01-15\tRent\t15000\t0\tbank\tOffice rent\n2025-01-16\tUtilities\t3500\t630\tbank\tElectricity"} rows={4} className={inputClass + " font-mono text-xs"} />
          <div className="flex gap-2">
            <button onClick={parseBulk} className="px-4 py-2 rounded-lg bg-violet-500 text-white font-bold text-sm hover:bg-violet-600 transition-colors">Preview ({bulkText.trim().split("\n").filter(l => l.trim()).length} rows)</button>
            {bulkPreview.length > 0 && <button onClick={saveBulk} className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-sm hover:shadow-lg transition-all">Import {bulkPreview.length} Expenses</button>}
          </div>
          {bulkPreview.length > 0 && (
            <div className="overflow-x-auto rounded-lg border max-h-48 overflow-y-auto">
              <table className="w-full text-xs"><thead className="bg-violet-100 sticky top-0"><tr><th className="px-3 py-2 text-left">Date</th><th className="px-3 py-2 text-left">Category</th><th className="px-3 py-2 text-right">Amount</th><th className="px-3 py-2 text-right">GST</th><th className="px-3 py-2">Mode</th><th className="px-3 py-2 text-right">Total</th></tr></thead><tbody>
                {bulkPreview.map((b: any, i: number) => <tr key={i} className="border-b"><td className="px-3 py-1.5">{b.date}</td><td className="px-3 py-1.5">{b.category}</td><td className="px-3 py-1.5 text-right">{fmtINR(b.amount)}</td><td className="px-3 py-1.5 text-right">{fmtINR(b.gst)}</td><td className="px-3 py-1.5 text-center">{b.mode}</td><td className="px-3 py-1.5 text-right font-bold text-destructive">{fmtINR(b.amount + b.gst)}</td></tr>)}
              </tbody></table>
            </div>
          )}
        </div>
      )}

      <div className="bg-card rounded-2xl border-2 border-golden/20 overflow-hidden shadow-sm">
        {list.length === 0 ? (
          <div className="p-12 text-center"><div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3"><Receipt size={28} className="text-muted-foreground" /></div><p className="text-muted-foreground text-sm">No expenses yet.</p><p className="text-muted-foreground text-xs mt-1">Track your business expenses here</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-muted/80 to-muted/40"><tr>
                <th className="px-3 py-2.5 text-left text-xs font-bold text-muted-foreground">Date</th>
                <th className="px-3 py-2.5 text-left text-xs font-bold text-muted-foreground">Category</th>
                <th className="px-3 py-2.5 text-center text-xs font-bold text-muted-foreground">Mode</th>
                <th className="px-3 py-2.5 text-left text-xs font-bold text-muted-foreground">Notes</th>
                <th className="px-3 py-2.5 text-right text-xs font-bold text-muted-foreground">Amount</th>
                <th className="px-3 py-2.5 w-10"></th>
              </tr></thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground text-sm">No matching expenses.</td></tr>}
                {filtered.map((e: any) => (
                  <tr key={e.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-2.5 tabular-nums text-xs text-muted-foreground">{e.expense_date}</td>
                    <td className="px-3 py-2.5"><span className={"text-xs px-2 py-0.5 rounded-full font-bold " + (e.category === "Salary" ? "bg-blue-100 text-blue-700" : e.category === "Rent" ? "bg-purple-100 text-purple-700" : "bg-muted/50 text-muted-foreground")}>{e.category}</span></td>
                    <td className="px-3 py-2.5 text-center"><span className="text-xs px-2 py-0.5 rounded-full font-bold bg-muted/50">{e.mode}</span></td>
                    <td className="px-3 py-2.5 text-muted-foreground text-xs max-w-[200px] truncate">{e.notes || "---"}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-bold text-destructive">{fmtINR(Number(e.amount) + Number(e.gst))}</td>
                    <td className="px-3 py-2.5 text-right"><button onClick={() => remove(e.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"><Trash2 size={14} /></button></td>
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

export default TabExpenses;
