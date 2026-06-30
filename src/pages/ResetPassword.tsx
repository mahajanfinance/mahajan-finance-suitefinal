import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";

const inputClass = "w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // When users click the recovery link, Supabase fires a PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    // Also allow if user already has a session from the recovery link
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (password !== confirm) { toast.error("Passwords don't match"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated. Please sign in.");
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <section className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border-2 border-golden/30 p-6 sm:p-8 shadow-xl w-full max-w-md">
        <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <Lock className="text-primary" size={24} />
        </div>
        <h1 className="text-2xl font-extrabold font-display text-center">Reset your password</h1>
        <p className="text-xs text-muted-foreground text-center mt-1">
          {ready ? "Enter a new password below." : "Open the reset link from your email to continue."}
        </p>
        <form onSubmit={submit} className="space-y-3 mt-5">
          <div>
            <label className="block text-xs font-semibold mb-1">New Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" className={inputClass} minLength={6} disabled={!ready} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Confirm Password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat password" className={inputClass} minLength={6} disabled={!ready} />
          </div>
          <button type="submit" disabled={loading || !ready}
            className="w-full !py-3 rounded-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-all">
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </motion.div>
    </section>
  );
};

export default ResetPassword;
