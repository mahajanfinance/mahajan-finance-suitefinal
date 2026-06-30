import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Wallet, Lock, Mail, ShieldCheck, BarChart3, FileText, 
  ArrowLeft, Sparkles, Eye, EyeOff, UserPlus
} from "lucide-react";
import { toast } from "sonner";

interface TempUserInfo {
  id: string;
  email: string;
  full_name: string;
  user_id?: string;
}

const TrackerLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Check if already logged in on mount
  useState(() => {
    const checkAuth = async () => {
      // Check Supabase auth first
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        window.location.href = "/tracker";
        return;
      }
      
      // Check for existing temp user session
      const existingTempUser = sessionStorage.getItem('tracker_temp_user');
      if (existingTempUser) {
        try {
          const parsed = JSON.parse(existingTempUser);
          if (parsed && parsed.email) {
            window.location.href = "/tracker";
            return;
          }
        } catch (e) {
          sessionStorage.removeItem('tracker_temp_user');
        }
      }
    };
    
    checkAuth();
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (mode === "signup" && !fullName) {
      toast.error("Please enter your full name");
      return;
    }

    setLoading(true);
    
    try {
      if (mode === "login") {
        await handleLogin();
      } else {
        await handleSignup();
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      // Query tracker_users table
      const { data: tempUser, error } = await supabase
        .from("tracker_users")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      if (error && !error.message.includes('no rows')) {
        console.warn("DB Error:", error.message);
      }

      // If temp user found with password
      if (tempUser && tempUser.password_hash) {
        const userInfo: TempUserInfo = {
          id: tempUser.id,
          email: tempUser.email,
          full_name: tempUser.full_name || "",
          user_id: tempUser.user_id || undefined,
        };

        // Store in multiple locations
        try {
          sessionStorage.setItem('tracker_temp_user', JSON.stringify(userInfo));
          localStorage.setItem('tracker_temp_email', tempUser.email);
          localStorage.setItem('tracker_temp_user_backup', JSON.stringify(userInfo));
          (window as any).__temp_tracker_user = userInfo;
        } catch (e) {
          throw new Error("Failed to save login data");
        }

        toast.success("Login successful! Redirecting...");
        
        // Navigate after short delay
        setTimeout(() => {
          window.location.href = "/tracker";
        }, 500);
        
        return; // Success! Don't reset loading
      }

      // Try Supabase Auth as fallback
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (authError) {
        if (authError.message.includes("Invalid login credentials")) {
          throw new Error("Invalid email or password");
        }
        throw new Error(authError.message);
      }

      // Clear temp user data for real auth users
      sessionStorage.removeItem('tracker_temp_user');
      localStorage.removeItem('tracker_temp_email');
      localStorage.removeItem('tracker_temp_user_backup');
      delete (window as any).__temp_tracker_user;
      
      toast.success("Welcome back!");
      
      setTimeout(() => {
        window.location.href = "/tracker";
      }, 500);

    } catch (err: any) {
      throw err;
    }
  };

  const handleSignup = async () => {
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (signUpError) {
      if (signUpError.message.includes("already registered")) {
        throw new Error("Account already exists. Try signing in instead.");
      }
      throw new Error(signUpError.message);
    }

    // Insert into tracker_users table
    if (authData.user) {
      await supabase.from("tracker_users").insert({
        user_id: authData.user.id,
        full_name: fullName,
        email: email,
        password_hash: "SUPABASE_AUTH_USER",
        email_confirmed_at: new Date().toISOString(),
      }).catch((err) => console.warn("Insert warning:", err));
    }

    toast.success("Account created successfully! 🎉", {
      duration: 5000,
      description: "Please check your email to verify your account.",
    });

    setTimeout(() => {
      setLoading(false);
      setMode("login");
      toast.info("You can now sign in with your credentials");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />

      {/* Back link */}
      <div className="relative container py-6">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-emerald-100/80 hover:text-white text-sm transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Mahajan Finance
        </Link>
      </div>

      {/* Main content */}
      <div className="relative container grid lg:grid-cols-2 gap-10 items-center pb-16">
        
        {/* Left — Brand Pitch */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }} 
          animate={{ opacity: 1, x: 0 }} 
          className="text-white space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-400/15 border border-emerald-300/30 text-emerald-200 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" /> Cash Flow · Accounting Pro
          </div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold font-display leading-tight">
            Run your business books like a <span className="text-amber-300">Pro CA</span>.
          </h1>
          
          <p className="text-emerald-50/80 text-lg max-w-md">
            GST-ready invoicing, expense tracking, party ledgers, inventory, and P&L — all in one secure dashboard.
          </p>

          <div className="grid grid-cols-2 gap-3 max-w-md pt-2">
            {[
              { i: FileText, t: "GST Invoicing" },
              { i: BarChart3, t: "Reports & P&L" },
              { i: Wallet, t: "Cash & Bank Book" },
              { i: ShieldCheck, t: "PIN-protected" },
            ].map(({ i: Icon, t }) => (
              <div key={t} className="flex items-center gap-2 bg-white/5 backdrop-blur border border-white/10 rounded-xl px-3 py-2.5">
                <Icon className="h-4 w-4 text-amber-300 flex-shrink-0" />
                <span className="text-sm font-medium">{t}</span>
              </div>
            ))}
          </div>

          <div className="text-xs text-emerald-100/60 pt-4">
            Dedicated Cash Flow login — separate from Mahajan Finance customer portal.
          </div>
        </motion.div>

        {/* Right — Login Form */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-md mx-auto"
        >
          <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-bold text-white">
                {mode === "login" ? "Welcome Back" : "Create Account"}
              </CardTitle>
              <CardDescription className="text-emerald-100/70">
                {mode === "login" ? "Sign in to access your Cash Flow dashboard" : "Start managing your business finances today"}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Full Name (Signup only) */}
                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-emerald-100 text-sm font-medium">
                      <UserPlus className="inline h-4 w-4 mr-1.5" /> Full Name
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required={mode === "signup"}
                      autoComplete="name"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-emerald-400"
                    />
                  </div>
                )}

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-emerald-100 text-sm font-medium">
                    <Mail className="inline h-4 w-4 mr-1.5" /> Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@business.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-emerald-400"
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-emerald-100 text-sm font-medium">
                    <Lock className="inline h-4 w-4 mr-1.5" /> Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="•••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-emerald-400 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  
                  {mode === "signup" && (
                    <p className="text-xs text-emerald-100/50">Minimum 6 characters</p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 rounded-lg transition-all shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 0 12h4z" />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    mode === "login" ? "Sign In" : "Create Account"
                  )}
                </Button>

                {/* Toggle Mode */}
                <p className="text-center text-sm text-emerald-100/60 pt-2">
                  {mode === "login" ? (
                    <>
                      Don't have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setMode("signup")}
                        className="text--amber-300 hover:text-amber-200 font-medium underline transition-colors"
                      >
                        Sign up
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setMode("login")}
                        className="text-amber-300 hover:text-amber-200 font-medium underline transition-colors"
                      >
                        Sign in
                      </button>
                    </>
                  )}
                </p>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default TrackerLogin;
