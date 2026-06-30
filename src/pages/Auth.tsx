import { useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Handshake, ShieldCheck, Briefcase, BadgePercent, FileText, 
  Coins, TrendingUp, Mail, Smartphone, Eye, EyeOff, Loader2,
  ArrowRight, CheckCircle2, AlertCircle, KeyRound, Building2
} from "lucide-react";
import logo from "@/assets/logo.png";

const autoCapital = (v: string) => v.toUpperCase();
const inputClass = "w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:bg-white transition-all placeholder:text-slate-400";

type Role = "customer" | "partner";
type LoginMethod = "password" | "otp";

const benefitsMap: Record<Role, { icon: any; text: string }[]> = {
  customer: [
    { icon: FileText, text: "Track all your loan, insurance & service applications" },
    { icon: Coins, text: "Free EMI calculator + investment tips PDFs" },
    { icon: ShieldCheck, text: "Secure document vault for KYC papers" },
    { icon: TrendingUp, text: "Access the Cash Flow accounting suite (15-day free)" },
  ],
  partner: [
    { icon: Handshake, text: "Earn commission on every successful loan/insurance referral" },
    { icon: BadgePercent, text: "Live commission tracker & monthly payout reports" },
    { icon: Briefcase, text: "Marketing kit, training resources & branded referral link" },
    { icon: ShieldCheck, text: "Verified partner badge after KYC approval" },
  ],
};

const getAuthErrorMessage = (error: any): string => {
  const msg = error?.message || "";
  if (msg.includes("Signups not allowed for otp") || msg.includes("422")) {
    return "Security Alert: OTP Signups are disabled in the backend. Please ask the admin to enable 'Email Signup' & 'Confirm Email' in Supabase Auth settings.";
  }
  if (msg.includes("Database error querying schema")) return "Server database error. Please contact admin.";
  if (msg.includes("Invalid login credentials")) return "Invalid email or password.";
  if (msg.includes("Email not confirmed")) return "Please verify your email first.";
  if (msg.includes("already registered")) return "An account with this email already exists.";
  if (msg.includes("Invalid or expired OTP")) return "Invalid or expired OTP. Please request a new one.";
  if (msg.includes("rate limit") || msg.includes("Too many requests")) return "Too many attempts. Please wait a moment.";
  if (msg.includes("Password should be at least")) return "Password must be at least 6 characters long.";
  return msg || "Something went wrong. Please try again.";
};

// --- Custom 6-Digit OTP Input Component ---
const OtpInput = ({ value, onChange, length = 6 }: { value: string, onChange: (val: string) => void, length?: number }) => {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handlechange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value.replace(/\D/g, "");
    if (!val) return;
    const newOtp = value.split("");
    newOtp[index] = val.charAt(val.length - 1);
    onChange(newOtp.join(""));
    if (index < length - 1 && val) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    onChange(pasted);
    if (pasted.length === length) inputs.current[length - 1]?.focus();
  };

  return (
    <div className="flex justify-between gap-2">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={el => inputs.current[i] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ""}
          onChange={e => handlechange(e, i)}
          onKeyDown={e => handleKeyDown(e, i)}
          onPaste={handlePaste}
          className="w-12 h-14 text-center text-xl font-bold rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
        />
      ))}
    </div>
  );
};

const Auth = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  
  const [role, setRole] = useState<Role>((params.get("role") as Role) || "customer");
  const [isLogin, setIsLogin] = useState(true);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("password");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [form, setForm] = useState({ email: "", password: "", fullName: "", mobile: "", city: "" });

  // Signup OTP States (Email Only)
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);

  // Login OTP States (Email Only)
  const [loginOtpSent, setLoginOtpSent] = useState(false);
  const [loginOtp, setLoginOtp] = useState("");

  const updateField = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const verifyRoleAndRedirect = async (userId: string) => {
    try {
      const { data: roleRows } = await (supabase as any).from("user_roles").select("role").eq("user_id", userId);
      const roles: string[] = (roleRows || []).map((r: any) => r.role);
      
      if (roles.length > 0 && !roles.includes(role)) {
        await supabase.auth.signOut();
        toast.error(`This account is registered as ${roles.join(", ")}. Switch tabs or contact support.`);
        return false;
      }
      if (roles.length === 0) {
        await (supabase as any).from("user_roles").insert({ user_id: userId, role });
        await (supabase as any).from('profiles').upsert({ id: userId, user_type: role, email: form.email }, { onConflict: 'id' });
      }
      toast.success(`Welcome! Logged in successfully.`);
      setTimeout(() => navigate("/dashboard", { replace: true }), 500);
      return true;
    } catch (err) {
      console.error("Role verification error:", err);
      toast.error("Verification failed. Please try again.");
      return false;
    }
  };

  // --- LOGIN HANDLERS ---
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error("Please enter email and password");
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: form.email.trim(), password: form.password });
      if (error) throw error;
      await verifyRoleAndRedirect(data.user.id);
    } catch (err: any) {
      toast.error(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSendLoginOtp = async () => {
    if (!form.email) return toast.error("Please enter your email address");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: form.email.trim(), options: { shouldCreateUser: false } });
      if (error) throw error;
      setLoginOtpSent(true);
      toast.success(`OTP sent to ${form.email}`);
    } catch (err: any) {
      toast.error(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLoginOtp = async () => {
    if (loginOtp.length !== 6) return toast.error("Please enter the complete 6-digit OTP");
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({ email: form.email.trim(), token: loginOtp, type: "email" });
      if (error) throw error;
      await verifyRoleAndRedirect(data.user.id);
    } catch (err: any) {
      toast.error(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // --- SIGNUP EMAIL OTP HANDLER ---
  const handleSendSignupEmailOtp = async () => {
    if (!form.email) return toast.error("Enter your email address");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: form.email.trim(), options: { shouldCreateUser: true } });
      if (error) throw error;
      setEmailOtpSent(true);
      toast.success(`Verification code sent to ${form.email}`);
    } catch (err: any) {
      toast.error(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySignupEmailOtp = async () => {
    if (emailOtp.length !== 6) return toast.error("Please enter the complete 6-digit OTP");
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email: form.email.trim(), token: emailOtp, type: "email" });
      if (error) throw error;
      setEmailVerified(true);
      toast.success("Email verified successfully!");
    } catch (err: any) {
      toast.error(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // --- FINAL SIGNUP SUBMISSION ---
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.password) return toast.error("Please fill all fields");
    if (form.password.length < 6) return toast.error("Password must be at least 6 characters");
    if (!emailVerified) return toast.error("Please verify your Email to continue");

    setLoading(true);
    try {
      // Because they verified via OTP, a session might already exist. We update the profile with password & metadata.
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error: updateError } = await supabase.auth.updateUser({
          password: form.password,
          data: { full_name: form.fullName.trim().toUpperCase(), mobile: form.mobile, city: form.city.toUpperCase(), user_type: role }
        });
        if (updateError) throw updateError;
        await verifyRoleAndRedirect(user.id);
      } else {
        // Fallback if OTP session expired
        const { data, error } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: { data: { full_name: form.fullName.trim().toUpperCase(), mobile: form.mobile, city: form.city.toUpperCase(), user_type: role } }
        });
        if (error) throw error;
        if (data.user) await verifyRoleAndRedirect(data.user.id);
      }
    } catch (err: any) {
      toast.error(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const accent = role === "partner" ? "bg-golden text-foreground" : "bg-primary text-primary-foreground";
  const primaryBtn = role === "partner" ? "bg-golden text-foreground hover:bg-golden/90" : "bg-primary text-primary-foreground hover:bg-primary/90";
  const benefits = benefitsMap[role];

  return (
    <section className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-golden/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-stretch relative z-10">
        
        {/* LEFT PANEL */}
        <motion.aside 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }}
          className={`hidden md:flex flex-col rounded-3xl p-8 shadow-xl ${
            role === "partner" ? "bg-gradient-to-br from-amber-50 to-yellow-100" : "bg-gradient-to-br from-blue-50 to-indigo-100"
          }`}
        >
          <div className="flex flex-col items-center mb-8">
            <img src={logo} alt="Mahajan Finance" className="h-20 w-auto mb-3 drop-shadow-lg" />
            <h3 className="text-xl font-bold font-display text-slate-800">Mahajan Finance</h3>
            <p className="text-xs text-slate-500">Your Trusted Financial Partner</p>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-extrabold font-display text-slate-800 leading-tight">
              {role === "partner" ? "Become a Partner" : "Customer Portal"}
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              {role === "partner" ? "Grow your income by referring loans & financial products." : "Apply for loans, insurance & manage finances securely."}
            </p>
          </div>

          <ul className="space-y-4 flex-1">
            {benefits.map((b, i) => (
              <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${accent} shadow-sm`}>
                  <b.icon size={16} />
                </div>
                <span className="text-sm font-medium pt-1 text-slate-700">{b.text}</span>
              </motion.li>
            ))}
          </ul>
        </motion.aside>

        {/* RIGHT PANEL */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-2xl p-6 sm:p-8 flex flex-col"
        >
          {/* Role Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 mb-6">
            {(["customer", "partner"] as Role[]).map(r => (
              <button key={r} onClick={() => setRole(r)}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  role === r ? (r === "partner" ? "bg-golden text-foreground shadow" : "bg-primary text-white shadow") : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {r === "partner" ? <Handshake size={16} /> : <User size={16} />}
                {r === "partner" ? "Partner" : "Customer"}
              </button>
            ))}
          </div>

          {/* Auth Mode Switcher */}
          <div className="flex justify-center gap-4 mb-6 text-sm font-bold">
            <button onClick={() => setIsLogin(true)} className={`px-4 py-1 ${isLogin ? "text-primary border-b-2 border-primary" : "text-slate-400"}`}>Login</button>
            <button onClick={() => setIsLogin(false)} className={`px-4 py-1 ${!isLogin ? "text-primary border-b-2 border-primary" : "text-slate-400"}`}>Sign Up</button>
          </div>

          <AnimatePresence mode="wait">
            {/* --- LOGIN VIEW --- */}
            {isLogin ? (
              <motion.div key="login" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 mb-6 text-xs font-bold">
                  <button onClick={() => setLoginMethod("password")} className={`py-2 rounded-lg ${loginMethod === "password" ? "bg-white shadow text-primary" : "text-slate-500"}`}>Password</button>
                  <button onClick={() => setLoginMethod("otp")} className={`py-2 rounded-lg ${loginMethod === "otp" ? "bg-white shadow text-primary" : "text-slate-500"}`}>Email OTP</button>
                </div>

                {loginMethod === "password" ? (
                  <form onSubmit={handlePasswordLogin} className="space-y-4">
                    <input type="email" value={form.email} onChange={e => updateField("email", e.target.value)} placeholder="Email Address" className={inputClass} />
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} value={form.password} onChange={e => updateField("password", e.target.value)} placeholder="Password" className={`${inputClass} pr-10`} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <button type="submit" disabled={loading} className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg disabled:opacity-50 ${primaryBtn}`}>
                      {loading ? <Loader2 className="animate-spin mx-auto" /> : "Login Securely"}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="email" value={form.email} onChange={e => updateField("email", e.target.value)} placeholder="Email Address" className={`${inputClass} pl-10`} disabled={loginOtpSent} />
                    </div>
                    
                    {loginOtpSent && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                        <OtpInput value={loginOtp} onChange={setLoginOtp} />
                      </motion.div>
                    )}

                    {!loginOtpSent ? (
                      <button onClick={handleSendLoginOtp} disabled={loading} className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg disabled:opacity-50 ${primaryBtn}`}>
                        {loading ? <Loader2 className="animate-spin mx-auto" /> : "Send OTP"}
                      </button>
                    ) : (
                      <button onClick={handleVerifyLoginOtp} disabled={loading} className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg disabled:opacity-50 ${primaryBtn}`}>
                        {loading ? <Loader2 className="animate-spin mx-auto" /> : "Verify & Login"}
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              /* --- SIGNUP VIEW --- */
              <motion.div key="signup" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" value={form.fullName} onChange={e => updateField("fullName", autoCapital(e.target.value))} placeholder="Full Name" className={`${inputClass} uppercase`} />
                  <input type="text" value={form.city} onChange={e => updateField("city", autoCapital(e.target.value))} placeholder="City" className={`${inputClass} uppercase`} />
                </div>

                {/* Mobile Number Input (Standard, no OTP) */}
                <div className="relative">
                  <Smartphone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <div className="flex">
                    <span className="px-4 py-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 text-sm font-bold">+91</span>
                    <input type="tel" value={form.mobile} onChange={e => updateField("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="Mobile Number" className={`${inputClass} rounded-l-none pl-10`} maxLength={10} />
                  </div>
                </div>

                {/* Email Verification Block */}
                <div className={`p-4 rounded-xl border ${emailVerified ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200"}`}>
                  <div className="flex items-center gap-2">
                    <Mail size={16} className={emailVerified ? "text-green-600" : "text-slate-400"} />
                    <input type="email" value={form.email} onChange={e => updateField("email", e.target.value)} placeholder="Email Address" className="bg-transparent flex-1 text-sm focus:outline-none" disabled={emailVerified} />
                    {emailVerified ? (
                      <CheckCircle2 className="text-green-600" size={20} />
                    ) : (
                      <button type="button" onClick={handleSendSignupEmailOtp} disabled={loading || !form.email} className="text-xs font-bold text-primary hover:underline disabled:opacity-50">
                        {emailOtpSent ? "Resend" : "Verify"}
                      </button>
                    )}
                  </div>
                  {emailOtpSent && !emailVerified && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4">
                      <OtpInput value={emailOtp} onChange={setEmailOtp} />
                      <button type="button" onClick={handleVerifySignupEmailOtp} disabled={loading} className={`w-full mt-3 py-2 rounded-lg text-xs font-bold text-white ${primaryBtn}`}>
                        Confirm Email OTP
                      </button>
                    </motion.div>
                  )}
                </div>

                <div className="relative">
                  <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type={showPassword ? "text" : "password"} value={form.password} onChange={e => updateField("password", e.target.value)} placeholder="Create Password (min 6 chars)" className={`${inputClass} pl-10`} />
                </div>

                <button onClick={handleSignup} disabled={loading || !emailVerified} className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${primaryBtn}`}>
                  {loading ? <Loader2 className="animate-spin" /> : <>Create Account <ArrowRight size={16} /></>}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <a href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800">
              <Building2 size={12} /> Back to Mahajan Finance Home
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Auth;