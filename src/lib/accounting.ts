import { supabase } from "@/integrations/supabase/client";

export const fmtINR = (n: number) =>
  "₹" + (Number(n) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

export const todayISO = () => new Date().toISOString().split("T")[0];

// ✅ FIXED: Clean, simple CRUD wrapper
export const acc = (table: string) => ({
  select: (columns: string = "*") => supabase.from(table).select(columns),
  insert: (values: object) => supabase.from(table).insert(values).select().single(),
  update: (updates: any) => supabase.from(table).update(updates).eq("id", updates.id),
  delete: (id: string) => supabase.from(table).delete().eq("id", id)
});

export const periodRange = (
  period: "daily" | "weekly" | "monthly" | "quarterly" | "yearly",
  base: string
) => {
  const d = new Date(base);
  const start = new Date(d);
  const end = new Date(d);
  
  if (period === "weekly") { 
    start.setDate(d.getDate() - d.getDay()); 
    end.setDate(start.getDate() + 6); 
  } 
  else if (period === "monthly") { 
    start.setDate(1); 
    end.setMonth(d.getMonth() + 1, 0); 
  } 
  else if (period === "quarterly") { 
    const m = Math.floor(d.getMonth() / 3) * 3; 
    start.setMonth(m, 1); 
    end.setMonth(m + 3, 0); 
  } 
  else if (period === "yearly") { 
    start.setMonth(0, 1); 
    end.setMonth(11, 31); 
  } 
  
  return { 
    start: start.toISOString().split("T")[0], 
    end: end.toISOString().split("T")[0] 
  };
};

// ✅ ADDED: Benefits data for CashFlowBenefits component
export const benefits = [
  {
    icon: "📊",
    title: "Real-time Cash Flow Tracking",
    body: "Monitor money in and out with live dashboards updated instantly"
  },
  {
    icon: "📱",
    title: "Mobile Friendly",
    body: "Access your accounts from any device - phone, tablet or desktop"
  },
  {
    icon: "📎",
    title: "Invoice Management",
    body: "Create, send and track professional GST-compliant invoices"
  },
  {
    icon: "🏦",
    title: "Bank Reconciliation",
    body: "Auto-match bank transactions with your records in one click"
  },
  {
    icon: "📈",
    title: "Financial Reports",
    body: "P&L, Balance Sheet, Cash Flow statements - all auto-generated"
  },
  {
    icon: "🧾",
    title: "GST Compliance",
    body: "Auto-calculate GST, generate GSTR-1, GSTR-3B reports"
  },
  {
    icon: "👥",
    title: "Multi-user Access",
    body: "Add your CA, accountant or team members with role-based access"
  },
  {
    icon: "🔒",
    title: "Bank-grade Security",
    body: "256-bit encryption with data hosted securely on Indian servers"
  }
];
