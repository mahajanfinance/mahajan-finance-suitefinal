import { useEffect, useState } from "react";
import { acc, fmtINR, periodRange, todayISO } from "@/lib/accounting";
import { FileDown } from "lucide-react";
import jsPDF from "jspdf";

const TabReports = ({ userId }: { userId: string }) => {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly" | "quarterly" | "yearly">("monthly");
  const [baseDate, setBaseDate] = useState(todayISO());
  const [data, setData] = useState<any>({ income: 0, expense: 0, gstCollected: 0, gstPaid: 0, byCategory: {} as Record<string, number> });

  useEffect(() => {
    const load = async () => {
      const r = periodRange(period, baseDate);
      const [invR, expR] = await Promise.all([
        acc("acc_invoices").select("total,tax_total,doc_type,status").eq("user_id", userId).gte("invoice_date", r.start).lte("invoice_date", r.end).neq("status", "cancelled"),
        acc("acc_expenses").select("amount,gst,category").eq("user_id", userId).gte("expense_date", r.start).lte("expense_date", r.end),
      ]);
      let income = 0, expense = 0, gstCollected = 0, gstPaid = 0;
      const byCategory: Record<string, number> = {};
      for (const i of invR.data || []) {
        if (i.doc_type === "invoice") { income += Number(i.total); gstCollected += Number(i.tax_total); }
        else { expense += Number(i.total); gstPaid += Number(i.tax_total); }
      }
      for (const e of expR.data || []) {
        const amt = Number(e.amount) + Number(e.gst);
        expense += amt;
        gstPaid += Number(e.gst);
        byCategory[e.category] = (byCategory[e.category] || 0) + amt;
      }
      setData({ income, expense, gstCollected, gstPaid, byCategory });
    };
    load();
  }, [userId, period, baseDate]);

  const profit = data.income - data.expense;
  const netGst = data.gstCollected - data.gstPaid;

  const downloadPdf = () => {
    const r = periodRange(period, baseDate);
    const pdf = new jsPDF();
    pdf.setFontSize(16); pdf.text("Financial Report", 14, 18);
    pdf.setFontSize(10); pdf.text(`Period: ${r.start} to ${r.end}`, 14, 25);
    let y = 38;
    const rows: [string, string][] = [
      ["Total Income", fmtINR(data.income)],
      ["Total Expense", fmtINR(data.expense)],
      [profit >= 0 ? "Net Profit" : "Net Loss", fmtINR(Math.abs(profit))],
      ["GST Collected (Output)", fmtINR(data.gstCollected)],
      ["GST Paid (Input)", fmtINR(data.gstPaid)],
      [netGst >= 0 ? "Net GST Payable" : "GST Refund Due", fmtINR(Math.abs(netGst))],
    ];
    for (const [k, v] of rows) {
      pdf.text(k, 14, y); pdf.text(v, 150, y); y += 7;
    }
    y += 5; pdf.setFontSize(12); pdf.text("Expense Breakdown", 14, y); y += 7;
    pdf.setFontSize(10);
    for (const [k, v] of Object.entries(data.byCategory) as [string, number][]) {
      pdf.text(k, 14, y); pdf.text(fmtINR(v), 150, y); y += 6;
    }
    pdf.save(`report-${r.start}-to-${r.end}.pdf`);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <input type="date" value={baseDate} onChange={e => setBaseDate(e.target.value)} className="px-3 py-2 rounded-lg border border-input bg-background text-sm" />
        <div className="flex gap-1.5 flex-wrap">
          {(["daily", "weekly", "monthly", "quarterly", "yearly"] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 capitalize ${period === p ? "bg-accent text-accent-foreground border-golden" : "border-border hover:border-golden"}`}>
              {p}
            </button>
          ))}
        </div>
        <button onClick={downloadPdf} className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:scale-105 transition-transform">
          <FileDown size={14} /> Export PDF
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-card rounded-xl border-2 border-success/30 p-5">
          <p className="text-xs font-bold text-muted-foreground">TOTAL INCOME</p>
          <p className="text-2xl font-extrabold text-success tabular-nums mt-1">{fmtINR(data.income)}</p>
        </div>
        <div className="bg-card rounded-xl border-2 border-destructive/30 p-5">
          <p className="text-xs font-bold text-muted-foreground">TOTAL EXPENSE</p>
          <p className="text-2xl font-extrabold text-destructive tabular-nums mt-1">{fmtINR(data.expense)}</p>
        </div>
        <div className={`bg-card rounded-xl border-2 ${profit >= 0 ? "border-success/30" : "border-destructive/30"} p-5`}>
          <p className="text-xs font-bold text-muted-foreground">{profit >= 0 ? "NET PROFIT" : "NET LOSS"}</p>
          <p className={`text-2xl font-extrabold tabular-nums mt-1 ${profit >= 0 ? "text-success" : "text-destructive"}`}>{fmtINR(Math.abs(profit))}</p>
        </div>
        <div className="bg-card rounded-xl border-2 border-primary/30 p-5">
          <p className="text-xs font-bold text-muted-foreground">GST COLLECTED</p>
          <p className="text-xl font-extrabold tabular-nums text-primary mt-1">{fmtINR(data.gstCollected)}</p>
        </div>
        <div className="bg-card rounded-xl border-2 border-amber-300 p-5">
          <p className="text-xs font-bold text-muted-foreground">GST PAID</p>
          <p className="text-xl font-extrabold tabular-nums text-amber-600 mt-1">{fmtINR(data.gstPaid)}</p>
        </div>
        <div className={`bg-card rounded-xl border-2 ${netGst >= 0 ? "border-destructive/30" : "border-success/30"} p-5`}>
          <p className="text-xs font-bold text-muted-foreground">{netGst >= 0 ? "GST PAYABLE" : "GST REFUND"}</p>
          <p className={`text-xl font-extrabold tabular-nums mt-1 ${netGst >= 0 ? "text-destructive" : "text-success"}`}>{fmtINR(Math.abs(netGst))}</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border-2 border-golden/20 p-5">
        <h4 className="font-bold mb-3">Expense Breakdown by Category</h4>
        {Object.keys(data.byCategory).length === 0 ? <p className="text-sm text-muted-foreground">No expenses in this period.</p> : (
          <div className="space-y-2">
            {Object.entries(data.byCategory).map(([k, v]: any) => {
              const pct = (v / data.expense) * 100;
              return (
                <div key={k}>
                  <div className="flex justify-between text-sm mb-1"><span>{k}</span><span className="tabular-nums font-bold">{fmtINR(v)} <span className="text-xs text-muted-foreground">({pct.toFixed(1)}%)</span></span></div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TabReports;
