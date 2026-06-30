import { useEffect, useMemo, useState, useRef } from "react";
import { acc, fmtINR, todayISO } from "@/lib/accounting";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, FileDown, Share2, Search, Zap, Upload, X, FileText, IndianRupee, Clock, CheckCircle, User, Phone, MapPin, Download, Eye, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import jsPDF from "jspdf";

const inputClass = "w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

interface LineItem { description: string; hsn: string; qty: number; rate: number; gst_rate: number; }

const TabInvoices = ({ userId, docType }: { userId: string; docType: "invoice" | "bill" }) => {
  const [list, setList] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [business, setBusiness] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sector, setSector] = useState("service");
  const [quickBill, setQuickBill] = useState(false);
  const [qbParty, setQbParty] = useState("");
  const [qbItem, setQbItem] = useState("");
  const [qbQty, setQbQty] = useState(1);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkPreview, setBulkPreview] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [autoSaved, setAutoSaved] = useState(false);
  const autoTimer = useRef<any>(null);

  const isServiceSector = sector === "service" || sector === "professional";
  const emptyLine: LineItem = { description: "", hsn: "", qty: 1, rate: 0, gst_rate: 18 };
  const [lines, setLines] = useState<LineItem[]>([{ ...emptyLine }]);
  const [form, setForm] = useState({ party_id: "", invoice_no: "", invoice_date: todayISO(), due_date: "", discount: 0, notes: "" });

  const load = async () => {
    const [listRes, partyRes, itemRes, bizRes, profRes] = await Promise.all([
      acc("acc_invoices").select("*,acc_parties(name,phone,address,gstin,email)").eq("user_id", userId).eq("doc_type", docType).order("created_at", { ascending: false }),
      acc("acc_parties").select("*").eq("user_id", userId).order("name"),
      acc("acc_items").select("*").eq("user_id", userId),
      acc("acc_business").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("tracker_business_profile").select("business_sector").eq("user_id", userId).maybeSingle(),
    ]);
    setList(listRes.data || []);
    setParties(partyRes.data || []);
    setItems(itemRes.data || []);
    setBusiness(bizRes.data);
    if (profRes.data?.business_sector) setSector(profRes.data.business_sector);
  };
  useEffect(() => { load(); }, [userId]);

  // Auto-save invoice draft
  useEffect(() => {
    if (!show) return;
    if (autoTimer.current) clearTimeout(autoTimer.current);
    autoTimer.current = setTimeout(() => {
      if (form.party_id || lines[0]?.description) {
        localStorage.setItem("tracker_invoice_draft", JSON.stringify({ form, lines, docType }));
        setAutoSaved(true);
        setTimeout(() => setAutoSaved(false), 2000);
      }
    }, 1000);
    return () => { if (autoTimer.current) clearTimeout(autoTimer.current); };
  }, [form, lines, show]);

  // Restore draft
  useEffect(() => {
    const draft = localStorage.getItem("tracker_invoice_draft");
    if (draft) {
      try {
        const d = JSON.parse(draft);
        if (d.docType === docType && (d.form?.party_id || d.lines?.[0]?.description)) {
          setForm(d.form); setLines(d.lines); setShow(true);
        }
      } catch {}
      localStorage.removeItem("tracker_invoice_draft");
    }
  }, []);

  const filteredParties = parties.filter((p: any) => docType === "invoice" ? p.party_type !== "vendor" : p.party_type !== "customer");

  const addLine = () => setLines(l => [...l, { ...emptyLine }]);
  const removeLine = (i: number) => setLines(l => l.filter((_, idx) => idx !== i));
  const updateLine = (i: number, key: string, val: any) => setLines(l => l.map((ln, idx) => idx === i ? { ...ln, [key]: val } : ln));
  const fillFromItem = (i: number, itemId: string) => {
    const it = items.find(x => x.id === itemId);
    if (!it) return;
    setLines(l => l.map((ln, idx) => idx === i ? { ...ln, description: it.name, hsn: it.hsn || it.sac || "", rate: it.sale_price, gst_rate: it.gst_rate } : ln));
  };

  const totals = useMemo(() => {
    const subtotal = lines.reduce((s, l) => s + l.qty * l.rate, 0);
    const tax = lines.reduce((s, l) => { const base = l.qty * l.rate; return s + base * l.gst_rate / 100; }, 0);
    const total = subtotal + tax - Number(form.discount);
    return { subtotal, tax, total };
  }, [lines, form.discount]);

  const selectedParty = parties.find((p: any) => p.id === form.party_id);

  const handleQuickBill = async () => {
    if (!qbParty || !qbItem) { toast.error("Select customer and service"); return; }
    const party = parties.find(p => p.id === qbParty);
    const item = items.find(i => i.id === qbItem);
    if (!party || !item) return;
    const subtotal = item.sale_price * qbQty;
    const tax = subtotal * item.gst_rate / 100;
    const total = subtotal + tax;
    const { data: biz } = await acc("acc_business").select("invoice_prefix,next_invoice_no").eq("user_id", userId).maybeSingle();
    const prefix = biz?.invoice_prefix || "INV";
    const num = String(biz?.next_invoice_no || 1).padStart(4, "0");
    const invNo = prefix + "-" + num;
    const { error } = await acc("acc_invoices").insert({
      user_id: userId, doc_type: docType, party_id: qbParty, invoice_no: invNo,
      invoice_date: todayISO(), due_date: "", subtotal, tax_total: tax, discount: 0, total, paid: 0, status: "unpaid", notes: "",
    });
    if (error) { toast.error(error.message); return; }
    await acc("acc_invoice_items").insert({ user_id: userId, invoice_no: invNo, description: item.name, hsn: item.hsn || item.sac || "", qty: qbQty, rate: item.sale_price, gst_rate: item.gst_rate, amount: subtotal });
    await acc("acc_business").update({ next_invoice_no: (biz?.next_invoice_no || 1) + 1 }).eq("user_id", userId);
    toast.success("Invoice " + invNo + " created!");
    setQbParty(""); setQbItem(""); setQbQty(1); setQuickBill(false); load();
  };

  const save = async () => {
    if (!form.party_id || !lines[0]?.description) { toast.error("Party and at least one line required"); return; }
    const { data: biz } = await acc("acc_business").select("invoice_prefix,next_invoice_no").eq("user_id", userId).maybeSingle();
    const prefix = biz?.invoice_prefix || "INV";
    const num = String(biz?.next_invoice_no || 1).padStart(4, "0");
    const invNo = form.invoice_no || prefix + "-" + num;
    const { error } = await acc("acc_invoices").insert({
      user_id: userId, doc_type: docType, party_id: form.party_id, invoice_no: invNo,
      invoice_date: form.invoice_date, due_date: form.due_date, subtotal: totals.subtotal,
      tax_total: totals.tax, discount: Number(form.discount), total: totals.total, paid: 0, status: "unpaid", notes: form.notes,
    });
    if (error) { toast.error(error.message); return; }
    const lineRows = lines.filter(l => l.description).map(l => ({ user_id: userId, invoice_no: invNo, description: l.description, hsn: l.hsn, qty: l.qty, rate: l.rate, gst_rate: l.gst_rate, amount: l.qty * l.rate }));
    if (lineRows.length) await acc("acc_invoice_items").insert(lineRows);
    if (!form.invoice_no) await acc("acc_business").update({ next_invoice_no: (biz?.next_invoice_no || 1) + 1 }).eq("user_id", userId);
    toast.success(docType === "invoice" ? "Invoice saved!" : "Bill saved!");
    setForm({ party_id: "", invoice_no: "", invoice_date: todayISO(), due_date: "", discount: 0, notes: "" });
    setLines([{ ...emptyLine }]); setShow(false); localStorage.removeItem("tracker_invoice_draft"); load();
  };

  const remove = async (id: string) => { if (!confirm("Delete?")) return; await acc("acc_invoices").delete().eq("id", id); toast.success("Deleted"); load(); };
  const recordPayment = async (inv: any) => {
    const due = Number(inv.total) - Number(inv.paid);
    const amt = prompt("Payment amount:", String(due));
    if (!amt || Number(amt) <= 0) return;
    const newPaid = Number(inv.paid) + Number(amt);
    const newStatus = newPaid >= Number(inv.total) ? "paid" : "partial";
    await acc("acc_invoices").update({ paid: newPaid, status: newStatus }).eq("id", inv.id);
    await acc("acc_payments").insert({ user_id: userId, direction: "in", amount: Number(amt), invoice_id: inv.id, payment_date: todayISO(), mode: "" });
    toast.success("Payment recorded!"); load();
  };

  const downloadPdf = async (inv: any) => {
    const party = parties.find((p: any) => p.id === inv.party_id);
    const { data: lineRows } = await acc("acc_invoice_items").select("*").eq("invoice_no", inv.invoice_no).eq("user_id", userId);
    const biz = business || {};
    const pdf = new jsPDF();
    // Business header
    pdf.setFontSize(16); pdf.text(String(biz.business_name || "Your Business").toUpperCase(), 14, 16);
    pdf.setFontSize(8); pdf.setTextColor(100);
    if (biz.address) pdf.text(String(biz.address), 14, 22);
    pdf.text("GSTIN: " + (biz.gstin || "-") + "  |  Ph: " + (biz.phone || "-") + "  |  " + (biz.email || "-"), 14, biz.address ? 27 : 22);
    // Invoice title
    pdf.setTextColor(0); pdf.setFontSize(14); pdf.text(docType === "invoice" ? "TAX INVOICE" : "PURCHASE BILL", 150, 16);
    pdf.setFontSize(9);
    pdf.text("No: " + inv.invoice_no, 150, 22);
    pdf.text("Date: " + inv.invoice_date, 150, 27);
    pdf.text("Due: " + (inv.due_date || "-"), 150, 32);
    // Customer details - PROMINENT
    let y = 38;
    pdf.setFillColor(245, 245, 255); pdf.rect(14, y - 3, 182, 22, "F");
    pdf.setDrawColor(200, 200, 240); pdf.rect(14, y - 3, 182, 22, "S");
    pdf.setFontSize(10); pdf.setTextColor(0, 51, 153);
    pdf.text("BILL TO", 14, y + 2);
    pdf.setFontSize(13); pdf.setFont(undefined, "bold"); pdf.setTextColor(0);
    pdf.text(String(party?.name || "N/A").toUpperCase(), 14, y + 8);
    pdf.setFont(undefined, "normal"); pdf.setFontSize(9); pdf.setTextColor(80);
    let infoY = y + 13;
    if (party?.address) { pdf.text(String(party.address), 14, infoY); infoY += 4; }
    if (party?.phone) { pdf.text("Mobile: " + party.phone + (party?.email ? "  |  " + party.email : ""), 14, infoY); infoY += 4; }
    if (party?.gstin) pdf.text("GSTIN: " + party.gstin, 14, infoY);
    y = infoY + 5;
    // Table header
    pdf.setTextColor(0); pdf.setFontSize(8);
    pdf.setFillColor(230, 230, 245);
    pdf.rect(14, y - 3, 182, 8, "F");
    pdf.text("#", 16, y);
    pdf.text("Description", 24, y);
    pdf.text("HSN/SAC", 90, y);
    pdf.text("Qty", 110, y);
    pdf.text("Rate", 125, y);
    pdf.text("GST%", 142, y);
    pdf.text("Amount", 165, y);
    pdf.line(14, y + 2, 196, y + 2); y += 7;
    // Table rows
    let idx = 1;
    for (const l of lineRows || []) {
      pdf.text(String(idx++), 16, y);
      pdf.text(String(l.description || "").slice(0, 40), 24, y);
      pdf.text(String(l.hsn || ""), 90, y); pdf.text(String(l.qty), 110, y);
      pdf.text(String(l.rate), 125, y); pdf.text(String(l.gst_rate) + "%", 142, y);
      pdf.text(String((l.amount || l.qty * l.rate).toFixed(2)), 165, y);
      y += 6; if (y > 270) { pdf.addPage(); y = 20; }
    }
    // Totals
    y += 3; pdf.line(140, y, 196, y); y += 6;
    pdf.setFontSize(9);
    pdf.text("Subtotal:", 145, y); pdf.text(fmtINR(inv.subtotal), 170, y); y += 5;
    pdf.text("Tax:", 145, y); pdf.text(fmtINR(inv.tax_total), 170, y); y += 5;
    if (inv.discount > 0) { pdf.text("Discount:", 145, y); pdf.text(fmtINR(inv.discount), 170, y); y += 5; }
    pdf.setFontSize(12); pdf.setFont(undefined, "bold");
    pdf.setFillColor(0, 51, 153); pdf.setTextColor(255);
    pdf.roundedRect(140, y - 4, 56, 10, 2, 2, "F");
    pdf.text("TOTAL: " + fmtINR(inv.total), 143, y + 3);
    pdf.setFont(undefined, "normal"); pdf.setFontSize(8); pdf.setTextColor(120);
    y += 14;
    const balance = Number(inv.total) - Number(inv.paid);
    if (balance > 0) { pdf.setTextColor(200, 0, 0); pdf.setFontSize(10); pdf.text("Balance Due: " + fmtINR(balance), 14, y); y += 8; }
    if (inv.notes) { pdf.setTextColor(100); pdf.setFontSize(8); pdf.text("Note: " + String(inv.notes), 14, y); y += 5; }
    pdf.setTextColor(150); pdf.setFontSize(7);
    pdf.text("Generated by Mahajan Finance Suite", 14, y + 5);
    pdf.save(inv.invoice_no + ".pdf");
  };

  const sharePdf = (inv: any) => {
    const party = parties.find((p: any) => p.id === inv.party_id);
    const msg = "Hi " + (party?.name || "") + ",\nSharing " + docType + " " + inv.invoice_no + "\nAmount: " + fmtINR(inv.total) + "\nBalance: " + fmtINR(Number(inv.total) - Number(inv.paid)) + "\nThank you!";
    window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank");
  };

  const downloadSample = () => {
    const csv = "Party Name,Item/Service,Qty,Rate,GST%,HSN/SAC\nRAM KUMAR,PAN Card Service,1,100,18,9972\nSITA DEVI,Voter ID Service,1,50,18,9972\nAMIT TRADERS,Widget A,5,100,18,8471\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "invoices_sample.csv"; a.click(); URL.revokeObjectURL(a.href);
    toast.success("Sample CSV downloaded!");
  };

  const parseBulk = () => {
    const rows = bulkText.trim().split("\n").filter(l => l.trim());
    const parsed: any[] = [];
    for (const row of rows) {
      const cols = row.split("\t").map(c => c.trim());
      if (cols.length >= 4 && cols[0]) parsed.push({ party: cols[0], item: cols[1], qty: Number(cols[2]) || 1, rate: Number(cols[3]) || 0, gst: Number(cols[4]) || 18, hsn: cols[5] || "" });
    }
    setBulkPreview(parsed);
  };
  const saveBulk = async () => {
    if (!bulkPreview.length) return;
    const { data: biz } = await acc("acc_business").select("invoice_prefix,next_invoice_no").eq("user_id", userId).maybeSingle();
    const prefix = biz?.invoice_prefix || "INV";
    let nextNo = biz?.next_invoice_no || 1;
    const rows = bulkPreview.map(b => {
      const num = String(nextNo++).padStart(4, "0");
      const invNo = prefix + "-" + num;
      const sub = b.rate * b.qty; const tax = sub * b.gst / 100;
      return { invNo, party: b.party, item: b.item, qty: b.qty, rate: b.rate, gst: b.gst, hsn: b.hsn, subtotal: sub, tax, total: sub + tax };
    });
    let created = 0;
    for (const r of rows) {
      const p = parties.find(x => x.name?.toUpperCase() === r.party.toUpperCase());
      if (!p) continue;
      await acc("acc_invoices").insert({ user_id: userId, doc_type: docType, party_id: p.id, invoice_no: r.invNo, invoice_date: todayISO(), due_date: "", subtotal: r.subtotal, tax_total: r.tax, discount: 0, total: r.total, paid: 0, status: "unpaid", notes: "" });
      await acc("acc_invoice_items").insert({ user_id: userId, invoice_no: r.invNo, description: r.item, hsn: r.hsn, qty: r.qty, rate: r.rate, gst_rate: r.gst, amount: r.subtotal });
      created++;
    }
    await acc("acc_business").update({ next_invoice_no: nextNo }).eq("user_id", userId);
    toast.success(created + " invoices created!"); setBulkMode(false); setBulkText(""); setBulkPreview([]); load();
  };

  const filtered = list.filter((i: any) => {
    if (statusFilter !== "all" && i.status !== statusFilter) return false;
    if (search && !(i.invoice_no || "").toLowerCase().includes(search.toLowerCase()) && !(i.acc_parties?.name || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const totalAmount = list.reduce((s, i) => s + Number(i.total), 0);
  const totalPaid = list.reduce((s, i) => s + Number(i.paid), 0);
  const paidCount = list.filter((i: any) => i.status === "paid").length;
  const overdueCount = list.filter((i: any) => i.status !== "paid" && i.due_date && i.due_date < new Date().toISOString().split("T")[0]).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-extrabold font-display">{docType === "invoice" ? "Billing & Collections" : "Purchase Bills"}</h3>
            {autoSaved && <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 animate-in fade-in"><Sparkles size={10} /> Draft saved</span>}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{list.length} total | {fmtINR(totalAmount)} gross | {fmtINR(totalAmount - totalPaid)} outstanding</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={downloadSample} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-all">
            <Download size={14} /> Sample CSV
          </button>
          <button onClick={() => setQuickBill(!quickBill)} className={"flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold transition-all " + (quickBill ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30" : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100")}>
            <Zap size={14} /> Quick Bill
          </button>
          <button onClick={() => { setBulkMode(!bulkMode); setShow(false); setQuickBill(false); }} className={"flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold transition-all " + (bulkMode ? "bg-violet-500 text-white shadow-lg shadow-violet-500/30" : "bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100")}>
            <Upload size={14} /> Bulk Import
          </button>
          <button onClick={() => { setShow(!show); setBulkMode(false); setQuickBill(false); }} className={"flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all " + (show ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "bg-accent text-accent-foreground hover:scale-105")}>
            <Plus size={14} /> New {docType === "invoice" ? "Invoice" : "Bill"}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 text-white shadow-lg shadow-blue-500/20">
          <FileText size={18} className="mb-1 opacity-80" /><p className="text-2xl font-extrabold">{list.length}</p><p className="text-xs opacity-80">Total {docType === "invoice" ? "Invoices" : "Bills"}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-4 text-white shadow-lg shadow-emerald-500/20">
          <CheckCircle size={18} className="mb-1 opacity-80" /><p className="text-2xl font-extrabold">{paidCount}</p><p className="text-xs opacity-80">Paid</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl p-4 text-white shadow-lg shadow-amber-500/20">
          <IndianRupee size={18} className="mb-1 opacity-80" /><p className="text-2xl font-extrabold">{fmtINR(totalAmount - totalPaid)}</p><p className="text-xs opacity-80">Amount Due</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl p-4 text-white shadow-lg shadow-red-500/20">
          <Clock size={18} className="mb-1 opacity-80" /><p className="text-2xl font-extrabold">{overdueCount}</p><p className="text-xs opacity-80">Overdue</p>
        </div>
      </div>

      {/* Quick Bill */}
      {quickBill && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center"><Zap size={16} className="text-white" /></div>
            <div><h4 className="font-extrabold text-amber-900">Quick Bill</h4><p className="text-xs text-amber-700">Create invoice in 3 seconds</p></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select value={qbParty} onChange={e => setQbParty(e.target.value)} className={inputClass}><option value="">Select Customer *</option>{filteredParties.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
            <select value={qbItem} onChange={e => setQbItem(e.target.value)} className={inputClass}><option value="">Select {isServiceSector ? "Service" : "Item"} *</option>{items.map((it: any) => <option key={it.id} value={it.id}>{it.name} - {fmtINR(it.sale_price)}</option>)}</select>
            <input type="number" value={qbQty} onChange={e => setQbQty(Number(e.target.value))} placeholder="Quantity" min="1" className={inputClass} />
            <button onClick={handleQuickBill} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold rounded-lg hover:shadow-lg hover:shadow-amber-500/30 transition-all hover:scale-[1.02]">Create Bill</button>
          </div>
        </div>
      )}

      {/* Bulk Import */}
      {bulkMode && (
        <div className="bg-gradient-to-r from-violet-50 to-purple-50 border-2 border-violet-300 rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-violet-500 flex items-center justify-center"><Upload size={16} className="text-white" /></div><div><h4 className="font-extrabold text-violet-900">Bulk Invoice Import</h4><p className="text-xs text-violet-700">Tab-separated: PartyName, Item, Qty, Rate, GST%, HSN</p></div></div>
            <div className="flex gap-2">
              <button onClick={downloadSample} className="p-2 rounded-lg bg-white border border-violet-200 hover:bg-violet-100 transition-colors"><Download size={14} className="text-violet-600" /></button>
              <button onClick={() => { setBulkMode(false); setBulkText(""); setBulkPreview([]); }} className="p-2 rounded-lg hover:bg-violet-200"><X size={16} /></button>
            </div>
          </div>
          <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} placeholder={"RAM KUMAR\tPAN Card Service\t1\t100\t18\t9972\nSITA DEVI\tVoter ID Service\t1\t50\t18\t9972\nAMIT TRADERS\tWidget A\t5\t100\t18\t8471"} rows={5} className={inputClass + " font-mono text-xs"} />
          <div className="flex gap-2">
            <button onClick={parseBulk} className="px-4 py-2 rounded-lg bg-violet-500 text-white font-bold text-sm hover:bg-violet-600 transition-colors">Preview ({bulkText.trim().split("\n").filter(l => l.trim()).length} rows)</button>
            {bulkPreview.length > 0 && <button onClick={saveBulk} className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-sm hover:shadow-lg transition-all">Import {bulkPreview.length} Invoices</button>}
          </div>
          {bulkPreview.length > 0 && (
            <div className="overflow-x-auto rounded-lg border max-h-48 overflow-y-auto">
              <table className="w-full text-xs"><thead className="bg-violet-100 sticky top-0"><tr><th className="px-3 py-2 text-left">Party</th><th className="px-3 py-2 text-left">Item</th><th className="px-3 py-2">Qty</th><th className="px-3 py-2 text-right">Rate</th><th className="px-3 py-2">GST%</th><th className="px-3 py-2 text-right">Amount</th></tr></thead><tbody>
                {bulkPreview.map((b: any, i: number) => <tr key={i} className="border-b"><td className="px-3 py-1.5">{b.party}</td><td className="px-3 py-1.5">{b.item}</td><td className="px-3 py-1.5 text-center">{b.qty}</td><td className="px-3 py-1.5 text-right">{fmtINR(b.rate)}</td><td className="px-3 py-1.5 text-center">{b.gst}%</td><td className="px-3 py-1.5 text-right font-bold">{fmtINR(b.rate * b.qty)}</td></tr>)}
              </tbody></table>
            </div>
          )}
        </div>
      )}

      {/* New Invoice Form -- with customer details on TOP */}
      {show && (
        <div className="bg-card rounded-2xl border-2 border-golden/30 p-5 space-y-5 shadow-lg shadow-golden/5 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Customer Info Header - PROMINENT */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <User size={16} className="text-blue-600" />
              <h4 className="font-extrabold text-blue-900 text-sm">Customer Details</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select value={form.party_id} onChange={e => setForm(p => ({ ...p, party_id: e.target.value }))} className={inputClass + " font-bold"}>
                <option value="">Select Customer *</option>
                {filteredParties.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <div className="flex gap-2">
                <input type="date" value={form.invoice_date} onChange={e => setForm(p => ({ ...p, invoice_date: e.target.value }))} className={inputClass + " flex-1"} />
                <input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} className={inputClass + " flex-1"} placeholder="Due Date" />
              </div>
            </div>
            {selectedParty && (
              <div className="mt-3 p-3 bg-white rounded-lg border border-blue-100 space-y-1.5 animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-sm">
                    {selectedParty.name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <p className="font-extrabold text-base">{selectedParty.name}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {selectedParty.phone && <span className="flex items-center gap-1"><Phone size={10} className="text-emerald-600" />{selectedParty.phone}</span>}
                      {selectedParty.email && <span className="flex items-center gap-1">{selectedParty.email}</span>}
                    </div>
                  </div>
                </div>
                {selectedParty.address && <p className="text-xs text-muted-foreground flex items-start gap-1 mt-1"><MapPin size={10} className="text-red-400 mt-0.5 shrink-0" />{selectedParty.address}</p>}
                {selectedParty.gstin && <p className="text-xs font-mono text-muted-foreground">GSTIN: {selectedParty.gstin}</p>}
              </div>
            )}
          </div>

          {/* Invoice Number */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Invoice Number</label>
              <input value={form.invoice_no} onChange={e => setForm(p => ({ ...p, invoice_no: e.target.value }))} placeholder="Auto-generated if blank" className={inputClass} />
            </div>
            <div className="flex items-end">
              <div className="w-full p-2 rounded-lg bg-muted/30 text-xs text-muted-foreground">
                {isServiceSector ? "Service Provider Mode" : "Trader/Manufacturer Mode"} -- {sector === "service" ? "SAC codes used" : sector === "professional" ? "Professional billing" : "HSN + GST"}
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <h4 className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider flex items-center gap-1">
              <FileText size={12} /> {isServiceSector ? "Services" : "Items"}
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50"><tr>
                  <th className="px-2 py-1.5 text-left">{isServiceSector ? "Service" : "Item"}</th>
                  <th className="px-2 py-1.5 text-left">HSN/SAC</th>
                  <th className="px-2 py-1.5">Qty</th>
                  <th className="px-2 py-1.5">Rate</th>
                  <th className="px-2 py-1.5">GST%</th>
                  <th className="px-2 py-1.5 text-right">Amount</th><th></th>
                </tr></thead>
                <tbody>
                  {lines.map((l, i) => (
                    <tr key={i} className="border-b border-border/30">
                      <td className="px-1 py-1">
                        <select onChange={e => fillFromItem(i, e.target.value)} className={inputClass + " text-xs px-2 py-1"}><option value="">Pick {isServiceSector ? "Service" : "Item"}</option>{items.map((it: any) => <option key={it.id} value={it.id}>{it.name} ({fmtINR(it.sale_price)})</option>)}</select>
                        <input value={l.description} onChange={e => updateLine(i, "description", e.target.value)} className={inputClass + " text-xs px-2 py-1 uppercase w-full mt-1"} placeholder={isServiceSector ? "PAN Card Service" : "Item name"} />
                      </td>
                      <td className="px-1 py-1"><input value={l.hsn} onChange={e => updateLine(i, "hsn", e.target.value)} className={inputClass + " text-xs px-2 py-1 w-16"} placeholder={isServiceSector ? "SAC" : "HSN"} /></td>
                      <td className="px-1 py-1"><input type="number" value={l.qty} onChange={e => updateLine(i, "qty", Number(e.target.value))} className={inputClass + " text-xs px-2 py-1 w-14"} /></td>
                      <td className="px-1 py-1"><input type="number" value={l.rate} onChange={e => updateLine(i, "rate", Number(e.target.value))} className={inputClass + " text-xs px-2 py-1 w-20"} /></td>
                      <td className="px-1 py-1"><input type="number" value={l.gst_rate} onChange={e => updateLine(i, "gst_rate", Number(e.target.value))} className={inputClass + " text-xs px-2 py-1 w-14"} /></td>
                      <td className="px-1 py-1 text-right tabular-nums font-bold">{fmtINR(l.qty * l.rate)}</td>
                      <td className="px-1 py-1"><button onClick={() => removeLine(i)} className="text-destructive p-1 hover:bg-destructive/10 rounded"><Trash2 size={12} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={addLine} className="text-xs text-primary font-bold hover:underline flex items-center gap-1 mt-2"><Plus size={12} /> Add line</button>
          </div>

          {/* Totals */}
          <div className="flex flex-wrap items-end justify-between gap-3 pt-3 border-t border-border">
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notes / terms" className={inputClass + " max-w-sm"} rows={2} />
            <div className="text-sm space-y-1 bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl p-4 border border-border">
              <div className="flex justify-between gap-8"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums font-bold">{fmtINR(totals.subtotal)}</span></div>
              <div className="flex justify-between gap-8"><span className="text-muted-foreground">Tax</span><span className="tabular-nums font-bold">{fmtINR(totals.tax)}</span></div>
              <div className="flex items-center justify-between gap-8"><span className="text-muted-foreground">Discount</span><input type="number" value={form.discount} onChange={e => setForm(p => ({ ...p, discount: Number(e.target.value) }))} className="w-24 text-xs px-2 py-1 rounded border border-input bg-background text-right tabular-nums" /></div>
              <div className="flex justify-between gap-8 text-lg pt-2 border-t mt-2">
                <span className="font-extrabold">Total</span>
                <span className="tabular-nums font-extrabold text-primary">{fmtINR(totals.total)}</span>
              </div>
            </div>
          </div>
          <button onClick={save} className="btn-accent w-full !py-3 rounded-xl text-base font-bold">Save {docType === "invoice" ? "Invoice" : "Bill"}</button>
        </div>
      )}

      {/* Search & Filter */}
      {list.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px]"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoice no or customer..." className={inputClass + " pl-9"} /></div>
          <div className="flex gap-1.5">{["all", "unpaid", "partial", "paid"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={"px-3 py-1.5 rounded-lg text-xs font-bold transition-all " + (statusFilter === s ? "bg-primary text-primary-foreground shadow" : "bg-muted/50 text-muted-foreground hover:bg-muted")}>{s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}</button>
          ))}</div>
        </div>
      )}

      {/* Invoice List with customer details */}
      <div className="bg-card rounded-2xl border-2 border-golden/20 overflow-hidden shadow-sm">
        {list.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3"><FileText size={28} className="text-muted-foreground" /></div>
            <p className="text-muted-foreground text-sm">No {docType}s yet.</p>
            <p className="text-muted-foreground text-xs mt-1">Click "New {docType === "invoice" ? "Invoice" : "Bill"}" or try "Quick Bill"</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-muted/80 to-muted/40"><tr>
                <th className="px-3 py-2.5 text-left text-xs font-bold text-muted-foreground">Invoice</th>
                <th className="px-3 py-2.5 text-left text-xs font-bold text-muted-foreground">Customer</th>
                <th className="px-3 py-2.5 text-left text-xs font-bold text-muted-foreground">Date</th>
                <th className="px-3 py-2.5 text-right text-xs font-bold text-muted-foreground">Total</th>
                <th className="px-3 py-2.5 text-right text-xs font-bold text-muted-foreground">Due</th>
                <th className="px-3 py-2.5 text-center text-xs font-bold text-muted-foreground">Status</th>
                <th className="px-3 py-2.5 text-right text-xs font-bold text-muted-foreground">Actions</th>
              </tr></thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground text-sm">No matching invoices.</td></tr>}
                {filtered.map((i: any) => {
                  const p = i.acc_parties;
                  const isExpanded = expandedId === i.id;
                  return (
                    <tr key={i.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                      <td className="px-3 py-2.5 font-mono text-xs font-bold">{i.invoice_no}</td>
                      <td className="px-3 py-2.5">
                        <button onClick={() => setExpandedId(isExpanded ? null : i.id)} className="text-left font-medium hover:text-primary transition-colors flex items-center gap-1">
                          {p?.name || "---"}
                          {p?.phone || p?.address ? (isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : null}
                        </button>
                        {isExpanded && p && (
                          <div className="mt-1.5 p-2 bg-blue-50/50 rounded-lg space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-200 text-xs">
                            {p.name && <p className="font-bold text-sm">{p.name}</p>}
                            {p.address && <p className="text-muted-foreground flex items-center gap-1"><MapPin size={10} />{p.address}</p>}
                            {p.phone && <p className="text-muted-foreground flex items-center gap-1"><Phone size={10} className="text-emerald-600" />{p.phone}</p>}
                            {p.gstin && <p className="text-muted-foreground font-mono">GSTIN: {p.gstin}</p>}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums text-xs text-muted-foreground">{i.invoice_date}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums font-bold">{fmtINR(i.total)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-destructive">{fmtINR(Number(i.total) - Number(i.paid))}</td>
                      <td className="px-3 py-2.5 text-center"><span className={"text-xs px-2.5 py-1 rounded-full font-bold " + (i.status === "paid" ? "bg-emerald-100 text-emerald-700" : i.status === "partial" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>{i.status}</span></td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1 justify-end">
                          {i.status !== "paid" && <button onClick={() => recordPayment(i)} className="text-xs px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 border border-emerald-200 transition-colors">Pay</button>}
                          <button onClick={() => downloadPdf(i)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="Download PDF"><FileDown size={14} /></button>
                          <button onClick={() => sharePdf(i)} className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors" title="Share on WhatsApp"><Share2 size={14} /></button>
                          <button onClick={() => remove(i.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Delete"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TabInvoices;
