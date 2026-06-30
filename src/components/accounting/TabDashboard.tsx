import { useEffect, useState } from "react";
import { acc, fmtINR } from "@/lib/accounting";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, Wallet, Users, Receipt, ArrowUpRight, ArrowDownRight, IndianRupee, Clock, Calendar, CreditCard, AlertTriangle, BarChart3, Briefcase, Store, Factory, GraduationCap, Sparkles } from "lucide-react";

const sectorIcons: Record<string, any> = { service: Briefcase, trader: Store, manufacturer: Factory, professional: GraduationCap };
const sectorLabels: Record<string, string> = { service: "Service Provider", trader: "Trader / Dealer", manufacturer: "Manufacturer", professional: "Professional" };

const TabDashboard = ({ userId }: { userId: string }) => {
  const [stats, setStats] = useState({ incomeMTD: 0, expenseMTD: 0, profit: 0, receivables: 0, payables: 0, cash: 0, parties: 0, overdue: 0, invoiceCount: 0, expenseCount: 0, paymentsMTD: 0, expectedNext30: 0 });
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [sector, setSector] = useState("service");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const monthStart = new Date(); monthStart.setDate(1);
      const msi = monthStart.toISOString().split("T")[0];
      const today = new Date().toISOString().split("T")[0];
      const next30 = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

      const [invMTD, expMTD, invAll, partyCount, payIn, payOut, recentInv, profRes] = await Promise.all([
        acc("acc_invoices").select("total,paid,due_date,status,doc_type,invoice_date,invoice_no").eq("user_id", userId).gte("invoice_date", msi),
        acc("acc_expenses").select("amount,gst").eq("user_id", userId).gte("expense_date", msi),
        acc("acc_invoices").select("total,paid,due_date,status,doc_type").eq("user_id", userId).neq("status", "cancelled"),
        acc("acc_parties").select("id", { count: "exact", head: true }).eq("user_id", userId),
        acc("acc_payments").select("amount").eq("user_id", userId).eq("direction", "in"),
        acc("acc_payments").select("amount").eq("user_id", userId).eq("direction", "out"),
        acc("acc_invoices").select("invoice_no,invoice_date,total,paid,status,doc_type,due_date,acc_parties(name,phone,address)").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
        supabase.from("tracker_business_profile").select("business_sector").eq("user_id", userId).maybeSingle(),
      ]);

      if (profRes.data?.business_sector) setSector(profRes.data.business_sector);

      const sumInv = (invMTD.data || []).filter((i: any) => i.doc_type === "invoice").reduce((s: number, i: any) => s + Number(i.total || 0), 0);
      const expVal = (expMTD.data || []).reduce((s: number, e: any) => s + Number(e.amount || 0) + Number(e.gst || 0), 0);
      const billsMTD = (invMTD.data || []).filter((i: any) => i.doc_type === "bill").reduce((s: number, i: any) => s + Number(i.total || 0), 0);
      const payMTDVal = (payIn.data || []).reduce((s: number, p: any) => s + Number(p.amount || 0), 0);

      let receivables = 0, payables = 0, overdue = 0, expectedNext30 = 0;
      for (const i of invAll.data || []) {
        const due = Number(i.total || 0) - Number(i.paid || 0);
        if (due <= 0) continue;
        if (i.doc_type === "invoice") { receivables += due; if (i.due_date && i.due_date <= today) overdue++; if (i.due_date && i.due_date > today && i.due_date <= next30) expectedNext30 += due; }
        else payables += due;
      }
      const cash = (payIn.data || []).reduce((s: number, p: any) => s + Number(p.amount), 0) - (payOut.data || []).reduce((s: number, p: any) => s + Number(p.amount), 0);

      setStats({ incomeMTD: sumInv, expenseMTD: expVal + billsMTD, profit: sumInv - expVal - billsMTD, receivables, payables, cash, parties: partyCount.count || 0, overdue, invoiceCount: (invAll.data || []).filter((i: any) => i.doc_type === "invoice").length, expenseCount: (expMTD.data || []).length, paymentsMTD: payMTDVal, expectedNext30 });
      setRecentInvoices((recentInv.data || []) as any[]);
      setLoading(false);
    };
    load();
  }, [userId]);

  if (loading) return <div className="text-center py-10 animate-pulse text-muted-foreground">Loading Dashboard...</div>;

  const SectorIcon = sectorIcons[sector] || Briefcase;
  const incomePct = (stats.incomeMTD + stats.expenseMTD) > 0 ? (stats.incomeMTD / (stats.incomeMTD + stats.expenseMTD)) * 100 : 50;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-extrabold font-display">Dashboard</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Your business at a glance</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
          <SectorIcon size={14} /> {sectorLabels[sector] || "Service Provider"}
        </div>
      </div>

      {/* Billing & Collections - Hero Cards */}
      <div>
        <h4 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2"><CreditCard size={14} /> Billing & Collections</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-4 text-white shadow-lg shadow-emerald-500/20">
            <div className="flex justify-between items-start"><ArrowUpRight size={20} className="opacity-80" /><span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full font-bold">MTD</span></div>
            <p className="text-xl md:text-2xl font-extrabold mt-2">{fmtINR(stats.incomeMTD)}</p>
            <p className="text-xs opacity-80 mt-1">Invoices Raised</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 text-white shadow-lg shadow-blue-500/20">
            <div className="flex justify-between items-start"><Wallet size={20} className="opacity-80" /><span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full font-bold">MTD</span></div>
            <p className="text-xl md:text-2xl font-extrabold mt-2">{fmtINR(stats.paymentsMTD)}</p>
            <p className="text-xs opacity-80 mt-1">Payments Received</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-4 text-white shadow-lg shadow-amber-500/20">
            <div className="flex justify-between items-start"><IndianRupee size={20} className="opacity-80" /><span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full font-bold">TOTAL</span></div>
            <p className="text-xl md:text-2xl font-extrabold mt-2">{fmtINR(stats.receivables)}</p>
            <p className="text-xs opacity-80 mt-1">Outstanding</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-4 text-white shadow-lg shadow-purple-500/20">
            <div className="flex justify-between items-start"><Calendar size={20} className="opacity-80" /><span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full font-bold">30D</span></div>
            <p className="text-xl md:text-2xl font-extrabold mt-2">{fmtINR(stats.expectedNext30)}</p>
            <p className="text-xs opacity-80 mt-1">Expected Collections</p>
          </div>
          <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-4 text-white shadow-lg shadow-rose-500/20 col-span-2 md:col-span-1">
            <div className="flex justify-between items-start"><AlertTriangle size={20} className="opacity-80" /><span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full font-bold">ALERT</span></div>
            <p className="text-xl md:text-2xl font-extrabold mt-2">{stats.overdue}</p>
            <p className="text-xs opacity-80 mt-1">Overdue Invoices</p>
          </div>
        </div>
      </div>

      {/* Cash Flow Forecast */}
      <div>
        <h4 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2"><BarChart3 size={14} /> Cash Flow Forecast</h4>
        <div className="bg-card rounded-2xl border-2 border-border p-5">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Monthly Income</p>
              <p className="text-xl font-extrabold text-emerald-600">{fmtINR(stats.incomeMTD)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Monthly Expense</p>
              <p className="text-xl font-extrabold text-red-600">{fmtINR(stats.expenseMTD)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Net Cash Flow</p>
              <p className={"text-xl font-extrabold " + (stats.profit >= 0 ? "text-blue-600" : "text-red-600")}>{fmtINR(Math.abs(stats.profit))} {stats.profit < 0 ? "(Loss)" : ""}</p>
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-5 overflow-hidden flex shadow-inner">
            {stats.incomeMTD > 0 && <div className="bg-gradient-to-r from-emerald-500 to-green-400 h-full transition-all flex items-center justify-center text-white text-[10px] font-bold" style={{ width: Math.min(incomePct, 100) + "%" }}>
              {incomePct > 15 ? incomePct.toFixed(0) + "%" : ""}
            </div>}
            {stats.expenseMTD > 0 && <div className="bg-gradient-to-r from-red-400 to-rose-500 h-full transition-all flex items-center justify-center text-white text-[10px] font-bold" style={{ width: Math.min(100 - incomePct, 100) + "%" }}>
              {(100 - incomePct) > 15 ? (100 - incomePct).toFixed(0) + "%" : ""}
            </div>}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Income ({incomePct.toFixed(0)}%)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Expenses ({(100 - incomePct).toFixed(0)}%)</span>
          </div>
        </div>
      </div>

      {/* Business Overview - Sector-Specific */}
      <div>
        <h4 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2"><SectorIcon size={14} /> {sectorLabels[sector]} Overview</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-2xl border-2 border-border p-5 hover:border-blue-300 hover:shadow-md transition-all group">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Receipt size={20} className="text-blue-600" /></div>
            <p className="text-2xl font-extrabold tabular-nums">{stats.invoiceCount}</p>
            <p className="text-xs text-muted-foreground mt-1">{sector === "service" || sector === "professional" ? "Service Invoices" : sector === "trader" ? "Sales Invoices" : "Production Invoices"}</p>
          </div>
          <div className="bg-card rounded-2xl border-2 border-border p-5 hover:border-amber-300 hover:shadow-md transition-all group">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><IndianRupee size={20} className="text-amber-600" /></div>
            <p className="text-2xl font-extrabold tabular-nums">{fmtINR(stats.payables)}</p>
            <p className="text-xs text-muted-foreground mt-1">{sector === "professional" ? "Vendor Payables" : "Purchase Payables"}</p>
          </div>
          <div className="bg-card rounded-2xl border-2 border-border p-5 hover:border-emerald-300 hover:shadow-md transition-all group">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Wallet size={20} className="text-emerald-600" /></div>
            <p className="text-2xl font-extrabold tabular-nums">{fmtINR(stats.cash)}</p>
            <p className="text-xs text-muted-foreground mt-1">{sector === "service" ? "Service Revenue Balance" : sector === "professional" ? "Practice Cash" : "Net Cash Position"}</p>
          </div>
          <div className="bg-card rounded-2xl border-2 border-border p-5 hover:border-purple-300 hover:shadow-md transition-all group">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Users size={20} className="text-purple-600" /></div>
            <p className="text-2xl font-extrabold tabular-nums">{stats.parties}</p>
            <p className="text-xs text-muted-foreground mt-1">{sector === "service" || sector === "professional" ? "Active Clients" : sector === "trader" ? "Suppliers & Buyers" : "Vendors & Customers"}</p>
          </div>
        </div>
      </div>

      {/* Sector-Specific Insights */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-2xl p-5">
        <h4 className="text-xs font-bold text-indigo-900 mb-3 uppercase tracking-wider flex items-center gap-2"><Sparkles size={14} className="text-indigo-600" /> Smart Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {sector === "service" && (
            <>
              <div className="bg-white rounded-xl p-3 border border-indigo-100">
                <p className="text-xs font-bold text-indigo-900">Collection Efficiency</p>
                <p className="text-lg font-extrabold text-indigo-600 mt-1">{stats.incomeMTD > 0 ? ((stats.paymentsMTD / stats.incomeMTD) * 100).toFixed(0) : 0}%</p>
                <p className="text-[10px] text-muted-foreground">of MTD invoices collected</p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-indigo-100">
                <p className="text-xs font-bold text-indigo-900">Avg Invoice Value</p>
                <p className="text-lg font-extrabold text-indigo-600 mt-1">{fmtINR(stats.invoiceCount > 0 ? stats.incomeMTD / stats.invoiceCount : 0)}</p>
                <p className="text-[10px] text-muted-foreground">per service invoice this month</p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-indigo-100">
                <p className="text-xs font-bold text-indigo-900">Overdue Rate</p>
                <p className="text-lg font-extrabold mt-1">{stats.invoiceCount > 0 ? ((stats.overdue / stats.invoiceCount) * 100).toFixed(0) : 0}%</p>
                <p className="text-[10px] text-muted-foreground">{stats.overdue} of {stats.invoiceCount} invoices overdue</p>
              </div>
            </>
          )}
          {sector === "trader" && (
            <>
              <div className="bg-white rounded-xl p-3 border border-indigo-100">
                <p className="text-xs font-bold text-indigo-900">Gross Margin</p>
                <p className="text-lg font-extrabold text-indigo-600 mt-1">{(stats.incomeMTD + stats.expenseMTD) > 0 ? (((stats.incomeMTD - stats.expenseMTD) / stats.incomeMTD) * 100).toFixed(1) : 0}%</p>
                <p className="text-[10px] text-muted-foreground">sales minus purchases</p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-indigo-100">
                <p className="text-xs font-bold text-indigo-900">Expense Ratio</p>
                <p className="text-lg font-extrabold text-indigo-600 mt-1">{stats.incomeMTD > 0 ? ((stats.expenseMTD / stats.incomeMTD) * 100).toFixed(0) : 0}%</p>
                <p className="text-[10px] text-muted-foreground">of revenue spent on purchases</p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-indigo-100">
                <p className="text-xs font-bold text-indigo-900">Cash Turnover</p>
                <p className="text-lg font-extrabold text-indigo-600 mt-1">{fmtINR(stats.cash)}</p>
                <p className="text-[10px] text-muted-foreground">net cash available for trading</p>
              </div>
            </>
          )}
          {sector === "manufacturer" && (
            <>
              <div className="bg-white rounded-xl p-3 border border-indigo-100">
                <p className="text-xs font-bold text-indigo-900">Production Revenue</p>
                <p className="text-lg font-extrabold text-indigo-600 mt-1">{fmtINR(stats.incomeMTD)}</p>
                <p className="text-[10px] text-muted-foreground">{stats.invoiceCount} production invoices MTD</p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-indigo-100">
                <p className="text-xs font-bold text-indigo-900">Material Cost Ratio</p>
                <p className="text-lg font-extrabold text-indigo-600 mt-1">{stats.incomeMTD > 0 ? ((stats.expenseMTD / stats.incomeMTD) * 100).toFixed(0) : 0}%</p>
                <p className="text-[10px] text-muted-foreground">of revenue spent on raw materials</p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-indigo-100">
                <p className="text-xs font-bold text-indigo-900">Net Margin</p>
                <p className="text-lg font-extrabold mt-1">{fmtINR(stats.profit)}</p>
                <p className="text-[10px] text-muted-foreground">{stats.profit >= 0 ? "profitable this month" : "loss this month"}</p>
              </div>
            </>
          )}
          {sector === "professional" && (
            <>
              <div className="bg-white rounded-xl p-3 border border-indigo-100">
                <p className="text-xs font-bold text-indigo-900">Consultation Revenue</p>
                <p className="text-lg font-extrabold text-indigo-600 mt-1">{fmtINR(stats.incomeMTD)}</p>
                <p className="text-[10px] text-muted-foreground">{stats.invoiceCount} invoices raised MTD</p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-indigo-100">
                <p className="text-xs font-bold text-indigo-900">Realization Rate</p>
                <p className="text-lg font-extrabold text-indigo-600 mt-1">{stats.incomeMTD > 0 ? ((stats.paymentsMTD / stats.incomeMTD) * 100).toFixed(0) : 0}%</p>
                <p className="text-[10px] text-muted-foreground">billed vs collected</p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-indigo-100">
                <p className="text-xs font-bold text-indigo-900">Pending Receivables</p>
                <p className="text-lg font-extrabold text-indigo-600 mt-1">{fmtINR(stats.receivables)}</p>
                <p className="text-[10px] text-muted-foreground">{stats.overdue} overdue client payments</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Invoices -- with customer details */}
      {recentInvoices.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2"><Sparkles size={14} /> Recent {sector === "service" || sector === "professional" ? "Service" : "Sales"} Invoices</h4>
          <div className="bg-card rounded-2xl border-2 border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-muted/80 to-muted/40"><tr>
                  <th className="px-4 py-2.5 text-left text-xs font-bold text-muted-foreground">Invoice</th>
                  <th className="px-4 py-2.5 text-left text-xs font-bold text-muted-foreground">Customer</th>
                  <th className="px-4 py-2.5 text-left text-xs font-bold text-muted-foreground">Date</th>
                  <th className="px-4 py-2.5 text-right text-xs font-bold text-muted-foreground">Amount</th>
                  <th className="px-4 py-2.5 text-right text-xs font-bold text-muted-foreground">Due</th>
                  <th className="px-4 py-2.5 text-center text-xs font-bold text-muted-foreground">Status</th>
                </tr></thead>
                <tbody>
                  {recentInvoices.map((inv: any) => {
                    const p = inv.acc_parties;
                    return (
                      <tr key={inv.id} className="border-b border-border/30 hover:bg-muted/20">
                        <td className="px-4 py-2.5 font-mono text-xs font-bold">{inv.invoice_no}</td>
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-sm">{p?.name || "---"}</p>
                          {p?.phone && <p className="text-[10px] text-muted-foreground">{p.phone}</p>}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">{inv.invoice_date}</td>
                        <td className="px-4 py-2.5 text-right font-bold tabular-nums">{fmtINR(inv.total)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-destructive">{fmtINR(Number(inv.total) - Number(inv.paid))}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={"text-xs px-2.5 py-1 rounded-full font-bold " + (inv.status === "paid" ? "bg-emerald-100 text-emerald-700" : inv.status === "partial" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>{inv.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TabDashboard;
