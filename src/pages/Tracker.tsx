import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, FileText, ShoppingCart, Users, Package, Receipt, BarChart3, Settings as SettingsIcon, Info, Wallet, UserCheck, Bell, LogOut } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import TrackerPinGate from "@/components/TrackerPinGate";
import TrackerSubscriptionGate from "@/components/TrackerSubscriptionGate";
import CashFlowBenefits from "@/components/accounting/CashFlowBenefits";
import TabDashboard from "@/components/accounting/TabDashboard";
import TabInvoices from "@/components/accounting/TabInvoices";
import TabParties from "@/components/accounting/TabParties";
import TabItems from "@/components/accounting/TabItems";
import TabExpenses from "@/components/accounting/TabExpenses";
import TabReports from "@/components/accounting/TabReports";
import TabCashBook from "@/components/accounting/TabCashBook";
import TabSettings from "@/components/accounting/TabSettings";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "sales", label: "Sales", icon: FileText },
  { id: "purchases", label: "Purchases", icon: ShoppingCart },
  { id: "parties", label: "Parties", icon: Users },
  { id: "prospects", label: "Prospects", icon: UserCheck },
  { id: "items", label: "Items", icon: Package },
  { id: "cashbook", label: "Cash/Bank", icon: Wallet },
  { id: "expenses", label: "Expenses", icon: Receipt },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "reminders", label: "Reminders", icon: Bell },
  { id: "settings", label: "Settings", icon: SettingsIcon },
] as const;

const Tracker = () => {
  const navigate = useNavigate();
  
  const [user, setUser] = useState<User | null>(null);
  const [tempUser, setTempUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [tab, setTab] = useState<string>("dashboard");
  const [showBenefits, setShowBenefits] = useState(false);
  const [businessName, setBusinessName] = useState<string>("");
  const [ownerName, setOwnerName] = useState<string>("");

  const effectiveUserId = user?.id || tempUser?.id || tempUser?.user_id;
  const effectiveEmail = user?.email || tempUser?.email;
  const isAuthenticated = !!user || !!tempUser;
  const isTempUserMode = !user && !!tempUser;

  // ============================================
  // ✅ AUTHENTICATION WITH AUTO-REDIRECT (NO ERROR SCREEN!)
  // ============================================
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // Method 1: Check Supabase Auth Session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && mounted) {
          setUser(session.user);
          setTempUser(null);
          setIsLoading(false);
          return;
        }

        // Method 2: Check sessionStorage
        const sessData = sessionStorage.getItem('tracker_temp_user');
        
        if (sessData) {
          try {
            const parsed = JSON.parse(sessData);
            if (parsed && parsed.email && parsed.id && mounted) {
              setTempUser(parsed);
              setIsLoading(false);
              return;
            }
          } catch (e) {
            sessionStorage.removeItem('tracker_temp_user');
          }
        }

        // Method 3: Check localStorage backup
        const localData = localStorage.getItem('tracker_temp_user_backup');
        
        if (localData) {
          try {
            const parsed = JSON.parse(localData);
            if (parsed && parsed.email && parsed.id && mounted) {
              sessionStorage.setItem('tracker_temp_user', localData);
              setTempUser(parsed);
              setIsLoading(false);
              return;
            }
          } catch (e) {
            localStorage.removeItem('tracker_temp_user_backup');
          }
        }

        // Method 4: Check window object
        const winData = (window as any).__temp_tracker_user;
        
        if (winData && winData.email && winData.id && mounted) {
          sessionStorage.setItem('tracker_temp_user', JSON.stringify(winData));
          localStorage.setItem('tracker_temp_user_backup', JSON.stringify(winData));
          setTempUser(winData);
          setIsLoading(false);
          return;
        }

        // ❌ NO AUTH FOUND → INSTANT REDIRECT TO LOGIN
        if (mounted) {
          setIsLoading(false);
          window.location.href = "/tracker/login"; // ⚡ INSTANT REDIRECT - NO ERROR PAGE!
        }

      } catch (error) {
        console.error("Auth error:", error);
        
        if (mounted) {
          setIsLoading(false);
          window.location.href = "/tracker/login"; // Redirect on error too
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user && mounted) {
        setUser(session.user);
        setTempUser(null);
      } else if (event === 'SIGNED_OUT' && mounted) {
        setUser(null);
        setTempUser(null);
      }
      
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Fetch Business Details
  useEffect(() => {
    if (!effectiveUserId) return;

    supabase.from("tracker_business_profile")
      .select("owner_name, shop_name")
      .eq("user_id", effectiveUserId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setOwnerName(data.owner_name || "");
          setBusinessName(data.shop_name || "");
        }
      });
  }, [effectiveUserId]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    
    sessionStorage.removeItem('tracker_temp_user');
    localStorage.removeItem('tracker_temp_email');
    localStorage.removeItem('tracker_temp_user_backup');
    delete (window as any).__temp_tracker_user;
    
    setUser(null);
    setTempUser(null);
    setBusinessName("");
    setOwnerName("");
    
    toast.success("Logged out successfully");
    window.location.href = "/tracker/login";
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-6 px-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30"
          >
            <span className="text-3xl font-bold text-white">₹</span>
          </motion.div>
          <div className="animate-spin h-10 w-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full mx-auto" />
          <p className="text-xl font-semibold text-white">Loading Cash Flow...</p>
          <p className="text-sm text-emerald-200/60">Preparing your dashboard</p>
        </div>
      </div>
    );
  }

  // ❌ NOT AUTHENTICATED → This should NEVER show because we redirect above
  // But just in case, return null (blank page)
  if (!isAuthenticated) {
    return null; // Silent fail - no ugly error screens!
  }

  // ============================================
  // ✅ MAIN DASHBOARD RENDER
  // ============================================
  return (
    <TrackerPinGate userId={effectiveUserId!}>
      <TrackerSubscriptionGate userId={effectiveUserId!} userEmail={effectiveEmail}>
        
        {/* Header */}
        <section className="relative bg-gradient-to-br from-primary via-primary to-primary/80 py-10 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          <div className="relative container flex items-start md:items-center justify-between flex-col md:flex-row gap-4">
            <div>
              {businessName ? (
                <motion.h1 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="text-3xl md:text-4xl font-extrabold text-primary-foreground font-display tracking-tight"
                >
                  {businessName}
                </motion.h1>
              ) : (
                <motion.h1 
                  initial={{ opacity: 0, y: 8 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="text-2xl md:text-3xl font-extrabold text-primary-foreground font-display"
                >
                  💰 Cash Flow — Accounting Pro
                </motion.h1>
              )}
              
              {ownerName ? (
                <p className="text-primary-foreground/80 text-lg mt-1">
                  Welcome back, {ownerName}
                  {isTempUserMode && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 bg-amber-500/25 text-amber-200 text-xs rounded-full font-medium border border-amber-400/30">
                      ⚡ Temp Access
                    </span>
                  )}
                </p>
              ) : (
                <p className="text-sm text-primary-foreground/75 mt-1">
                  Full GST-ready accounting for your small business
                  {isTempUserMode && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 bg-amber-500/25 text-amber-200 text-xs rounded-full font-medium border border-amber-400/30">
                      ⚡ Temp Access Mode
                    </span>
                  )}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button 
                onClick={() => setShowBenefits(true)} 
                className="flex-1 md:flex-initial flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/15 hover:bg-white/25 text-primary-foreground text-sm font-bold border border-white/20 transition-all"
              >
                <Info size={16} /> Benefits
              </button>
              <Button 
                onClick={handleLogout} 
                variant="destructive" 
                size="sm" 
                className="flex items-center gap-2 font-bold shadow-lg"
              >
                <LogOut size={16} /> Logout
              </Button>
            </div>
          </div>
        </section>

        {/* Tab Bar */}
        <div className="bg-card border-b border-border sticky top-0 z-20 shadow-sm">
          <div className="container overflow-x-auto">
            <div className="flex gap-1 py-2 min-w-max scrollbar-hide">
              {tabs.map(t => {
                const Icon = t.icon;
                const isActive = tab === t.id;
                
                return (
                  <button 
                    key={t.id} 
                    onClick={() => setTab(t.id)} 
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-md scale-105" 
                        : "text-foreground/70 hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon size={15} className={isActive ? "animate-pulse" : ""} /> 
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <section className="py-8 bg-background min-h-[60vh]">
          <div className="container">
            {tab === "dashboard" && <TabDashboard userId={effectiveUserId!} />}
            {tab === "sales" && <TabInvoices userId={effectiveUserId!} docType="invoice" />}
            {tab === "purchases" && <TabInvoices userId={effectiveUserId!} docType="bill" />}
            {tab === "parties" && <TabParties userId={effectiveUserId!} />}
            {tab === "prospects" && (
              <div className="text-muted-foreground p-12 text-center border-2 border-dashed rounded-xl bg-muted/20">
                <div className="space-y-3">
                  <UserCheck className="h-12 w-12 mx-auto text-muted-foreground/40" />
                  <h3 className="text-lg font-semibold text-muted-foreground">Prospects & Lead Management</h3>
                  <p className="text-sm text-muted-foreground/60">Coming Soon</p>
                </div>
              </div>
            )}
            {tab === "items" && <TabItems userId={effectiveUserId!} />}
            {tab === "cashbook" && <TabCashBook userId={effectiveUserId!} />}
            {tab === "expenses" && <TabExpenses userId={effectiveUserId!} />}
            {tab === "reports" && <TabReports userId={effectiveUserId!} />}
            {tab === "reminders" && (
              <div className="text-muted-foreground p-12 text-center border-2 border-dashed rounded-xl bg-muted/20">
                <div className="space-y-3">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground/40" />
                  <h3 className="text-lg font-semibold text-muted-foreground">WhatsApp & SMS Reminders</h3>
                  <p className="text-sm text-muted-foreground/60">Coming Soon</p>
                </div>
              </div>
            )}
            {tab === "settings" && <TabSettings userId={effectiveUserId!} />}
          </div>
        </section>

        {/* Benefits Modal */}
        <AnimatePresence>
          {showBenefits && <CashFlowBenefits onClose={() => setShowBenefits(false)} />}
        </AnimatePresence>
      </TrackerSubscriptionGate>
    </TrackerPinGate>
  );
};

export default Tracker;
