import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { LogOut, FileText, Users, TrendingUp, Wallet, Copy, GraduationCap, Award, Briefcase, Coins } from "lucide-react";
import type { User } from "@supabase/supabase-js";

const statusColors: Record<string, string> = {
  pending: "bg-golden/20 text-golden",
  processing: "bg-primary/20 text-primary",
  approved: "bg-success/20 text-success",
  done: "bg-success/20 text-success",
  rejected: "bg-destructive/20 text-destructive",
  skipped: "bg-muted text-muted-foreground",
};
const paymentColors: Record<string, string> = {
  paid: "bg-success/20 text-success",
  unpaid: "bg-destructive/20 text-destructive",
  failed: "bg-destructive/20 text-destructive",
};

const Stat = ({ icon, label, value, color }: any) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
    className="bg-card rounded-xl border-2 border-border p-4 text-center hover:border-golden hover:shadow-lg transition-all">
    <div className={`${color} mb-2 flex justify-center`}>{icon}</div>
    <p className="text-2xl font-extrabold tabular-nums">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </motion.div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session?.user) { navigate("/auth"); return; }
      setUser(session.user);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) { navigate("/auth"); return; }
      setUser(session.user);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [profRes, appRes, refRes] = await Promise.all([
        (supabase as any).from("profiles").select("*").eq("id", user.id).maybeSingle(),
        (supabase as any).from("service_applications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        (supabase as any).from("partner_referrals").select("*").eq("partner_id", user.id).order("created_at", { ascending: false }),
      ]);
      setProfile(profRes.data);
      setApplications(appRes.data || []);
      setReferrals(refRes.data || []);
      setLoading(false);
    })();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out");
    navigate("/");
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const isPartner = profile?.user_type === "partner";


  return (
    <section className="py-10 bg-background min-h-[80vh]">
      <div className="container max-w-6xl">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold mb-1 ${isPartner ? "bg-golden/20 text-amber-700" : "bg-primary/15 text-primary"}`}>
              {isPartner ? "🤝 Partner" : "👤 Customer"}
            </div>
            <h1 className="text-2xl font-extrabold font-display">Welcome, {profile?.full_name || user?.email}</h1>
            <p className="text-xs text-muted-foreground">{profile?.mobile} · {profile?.city || "—"}</p>
          </motion.div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-destructive text-destructive text-sm font-bold hover:bg-destructive hover:text-destructive-foreground transition-all">
            <LogOut size={16} /> Logout
          </button>
        </div>

        {isPartner ? (
          /* ============ PARTNER DASHBOARD ============ */
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat icon={<Users size={22} />} label="Total Referrals" value={referrals.length} color="text-primary" />
              <Stat icon={<TrendingUp size={22} />} label="Approved" value={referrals.filter((r: any) => r.status === "approved" || r.status === "done").length} color="text-success" />
              <Stat icon={<Wallet size={22} />} label="Commission Paid" value={referrals.filter((r: any) => r.commission_status === "paid").length} color="text-amber-600" />
              <Stat icon={<FileText size={22} />} label="Pending" value={referrals.filter((r: any) => r.status === "pending").length} color="text-golden" />
            </div>



            <h2 className="text-lg font-bold font-display">Quick Services</h2>
<div className="grid md:grid-cols-4 gap-4">
              <Link to="/apply-loan" className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-xl p-5 hover:scale-[1.02] transition-transform">
                <p className="text-2xl">🏦</p><p className="font-bold mt-1">Loans</p><p className="text-xs opacity-80 mt-1">Personal, home, business loans</p>
              </Link>
              <Link to="/insurance" className="bg-gradient-to-br from-emerald-600 to-emerald-500 text-white rounded-xl p-5 hover:scale-[1.02] transition-transform">
                <p className="text-2xl">🛡️</p><p className="font-bold mt-1">Insurance</p><p className="text-xs opacity-80 mt-1">Health, life, motor cover</p>
              </Link>
              <Link to="/investments" className="bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-xl p-5 hover:scale-[1.02] transition-transform">
                <p className="text-2xl">📈</p><p className="font-bold mt-1">Investments</p><p className="text-xs opacity-80 mt-1">FD, mutual funds, SIP plans</p>
              </Link>
              <Link to="/accounting" className="bg-gradient-to-br from-violet-600 to-violet-500 text-white rounded-xl p-5 hover:scale-[1.02] transition-transform">
                <p className="text-2xl">📊</p><p className="font-bold mt-1">Accounting</p><p className="text-xs opacity-80 mt-1">GST, ITR, bookkeeping</p>
              </Link>
              <Link to="/services" className="bg-gradient-to-br from-orange-500 to-orange-400 text-white rounded-xl p-5 hover:scale-[1.02] transition-transform">
                <p className="text-2xl">🧾</p><p className="font-bold mt-1">CSC Services</p><p className="text-xs opacity-80 mt-1">PAN, Aadhaar, Shop Act and more</p>
              </Link>
              <Link to="/govt-schemes" className="bg-gradient-to-br from-teal-600 to-teal-500 text-white rounded-xl p-5 hover:scale-[1.02] transition-transform">
                <p className="text-2xl">🏛️</p><p className="font-bold mt-1">Govt Schemes</p><p className="text-xs opacity-80 mt-1">AVM, PMEGP, Mudra and more</p>
              </Link>
              <Link to="/tracker" className="bg-gradient-to-br from-golden to-amber-500 text-foreground rounded-xl p-5 hover:scale-[1.02] transition-transform">
                <p className="text-2xl">💰</p><p className="font-bold mt-1">Cash Flow</p><p className="text-xs opacity-80 mt-1">15-day free accounting trial</p>
              </Link>
            </div>

            <div className="bg-card rounded-xl border-2 border-golden/20 overflow-hidden">
              <div className="p-4 bg-primary/5 border-b border-border"><h2 className="font-bold font-display">👥 My Referrals</h2></div>
              {referrals.length === 0 ? <p className="p-8 text-center text-muted-foreground">No referrals yet. Share your link to start earning!</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50"><tr>
                      <th className="px-4 py-3 text-left">Date</th><th className="px-4 py-3 text-left">Lead</th>
                      <th className="px-4 py-3 text-left">Service</th><th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Commission</th>
                    </tr></thead>
                    <tbody>
                      {referrals.map((r: any) => (
                        <tr key={r.id} className="border-b border-border/40 hover:bg-muted/30">
                          <td className="px-4 py-3 tabular-nums">{new Date(r.created_at).toLocaleDateString("en-IN")}</td>
                          <td className="px-4 py-3 font-medium">{r.lead_name}</td>
                          <td className="px-4 py-3">{r.service}</td>
                          <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColors[r.status] || ""}`}>{r.status}</span></td>
                          <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${paymentColors[r.commission_status] || ""}`}>{r.commission_status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ============ CUSTOMER DASHBOARD ============ */
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat icon={<FileText size={22} />} label="Applications" value={applications.length} color="text-primary" />
              <Stat icon={<TrendingUp size={22} />} label="Approved" value={applications.filter((a: any) => a.status === "approved" || a.status === "done").length} color="text-success" />
              <Stat icon={<Coins size={22} />} label="Paid" value={applications.filter((a: any) => a.payment_status === "paid").length} color="text-amber-600" />
              <Stat icon={<FileText size={22} />} label="Pending" value={applications.filter((a: any) => a.status === "pending").length} color="text-golden" />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <Link to="/apply-loan" className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-xl p-5 hover:scale-[1.02] transition-transform">
                <p className="text-2xl">🏦</p><p className="font-bold mt-1">Apply Loan</p><p className="text-xs opacity-80 mt-1">Personal, home, business loans</p>
              </Link>
              <Link to="/insurance" className="bg-gradient-to-br from-emerald-600 to-emerald-500 text-white rounded-xl p-5 hover:scale-[1.02] transition-transform">
                <p className="text-2xl">🛡️</p><p className="font-bold mt-1">Get Insurance</p><p className="text-xs opacity-80 mt-1">Health, life, motor cover</p>
              </Link>
              <Link to="/tracker" className="bg-gradient-to-br from-golden to-amber-500 text-foreground rounded-xl p-5 hover:scale-[1.02] transition-transform">
                <p className="text-2xl">💰</p><p className="font-bold mt-1">Cash Flow Pro</p><p className="text-xs opacity-80 mt-1">15-day free accounting trial</p>
              </Link>
            </div>

            <div className="bg-card rounded-xl border-2 border-golden/20 overflow-hidden">
              <div className="p-4 bg-primary/5 border-b border-border"><h2 className="font-bold font-display">📋 My Applications</h2></div>
              {applications.length === 0 ? <p className="p-8 text-center text-muted-foreground">No applications yet. Apply for a loan or insurance to get started!</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50"><tr>
                      <th className="px-4 py-3 text-left">Date</th><th className="px-4 py-3 text-left">Service</th>
                      <th className="px-4 py-3 text-left">Amount</th><th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Payment</th>
                    </tr></thead>
                    <tbody>
                      {applications.map((app: any) => (
                        <tr key={app.id} className="border-b border-border/40 hover:bg-muted/30">
                          <td className="px-4 py-3 tabular-nums">{new Date(app.created_at).toLocaleDateString("en-IN")}</td>
                          <td className="px-4 py-3 font-medium">{app.service_name}</td>
                          <td className="px-4 py-3 tabular-nums">{app.loan_amount ? `₹${Number(app.loan_amount).toLocaleString("en-IN")}` : "—"}</td>
                          <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColors[app.status] || ""}`}>{app.status}</span></td>
                          <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${paymentColors[app.payment_status] || ""}`}>{app.payment_status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Dashboard;
