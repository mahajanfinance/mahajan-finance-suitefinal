import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

const useAutoLogout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let timer: number | undefined;
    let active = true;

    const logout = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await supabase.auth.signOut();
      toast.message("🔒 Logged out due to inactivity");
      navigate("/auth");
    };

    const reset = () => {
      if (!active) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(logout, TIMEOUT_MS);
    };

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      active = false;
      window.clearTimeout(timer);
      events.forEach(e => window.removeEventListener(e, reset));
    };
  }, [navigate]);
};

export default useAutoLogout;
