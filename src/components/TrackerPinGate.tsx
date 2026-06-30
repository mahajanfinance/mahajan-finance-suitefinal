import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, KeyRound } from "lucide-react";
import { toast } from "sonner";

const PIN_KEY = "mf_tracker_pin";
const SESSION_KEY = "mf_tracker_unlocked";

interface Props {
  userId: string;
  children: React.ReactNode;
}

const TrackerPinGate = ({ userId, children }: Props) => {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isSetup, setIsSetup] = useState(false);
  const [showForget, setShowForget] = useState(false);

  const storageKey = `${PIN_KEY}_${userId}`;
  const sessionKey = `${SESSION_KEY}_${userId}`;

  useEffect(() => {
    const existing = localStorage.getItem(storageKey);
    setIsSetup(!existing);
    if (sessionStorage.getItem(sessionKey) === "1") setUnlocked(true);
  }, [storageKey, sessionKey]);

  const handleSetup = () => {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) { toast.error("PIN must be 4 digits"); return; }
    if (pin !== confirmPin) { toast.error("PINs don't match"); return; }
    localStorage.setItem(storageKey, btoa(pin + userId));
    sessionStorage.setItem(sessionKey, "1");
    toast.success("PIN set! Cash Flow Manager unlocked.");
    setUnlocked(true);
  };

  const handleUnlock = () => {
    const stored = localStorage.getItem(storageKey);
    if (stored === btoa(pin + userId)) {
      sessionStorage.setItem(sessionKey, "1");
      setUnlocked(true);
      toast.success("Welcome back!");
    } else {
      toast.error("Wrong PIN");
      setPin("");
    }
  };

  const handleForget = () => {
    localStorage.removeItem(storageKey);
    sessionStorage.removeItem(sessionKey);
    setIsSetup(true);
    setPin(""); setConfirmPin(""); setShowForget(false);
    toast.info("PIN reset. Please set a new 4-digit PIN.");
  };

  if (unlocked) return <>{children}</>;

  return (
    <section className="min-h-[70vh] flex items-center justify-center bg-background py-12">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-card rounded-2xl border-2 border-golden/40 p-7 shadow-xl text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
          {isSetup ? <KeyRound size={26} className="text-primary" /> : <Lock size={26} className="text-primary" />}
        </div>
        <h2 className="text-xl font-extrabold font-display text-foreground">
          {isSetup ? "Set up your 4-digit PIN" : "Enter your PIN"}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {isSetup ? "Protect your Cash Flow data with a quick PIN" : "Quick access to your Cash Flow Manager"}
        </p>

        <div className="mt-5 space-y-3">
          <input
            type="password" inputMode="numeric" maxLength={4}
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="••••"
            className="w-full text-center text-2xl tracking-[0.5em] tabular-nums px-4 py-3 rounded-lg border-2 border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          {isSetup && (
            <input
              type="password" inputMode="numeric" maxLength={4}
              value={confirmPin}
              onChange={e => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="confirm PIN"
              className="w-full text-center text-2xl tracking-[0.5em] tabular-nums px-4 py-3 rounded-lg border-2 border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          )}
          <button
            onClick={isSetup ? handleSetup : handleUnlock}
            className="btn-accent w-full !py-3 rounded-lg hover:scale-[1.02] transition-transform"
          >
            {isSetup ? "Save PIN & Unlock" : "Unlock"}
          </button>

          {!isSetup && !showForget && (
            <button onClick={() => setShowForget(true)} className="text-xs text-primary hover:underline">
              Forgot PIN?
            </button>
          )}
          {showForget && (
            <div className="text-xs space-y-2 p-3 bg-muted/50 rounded-lg">
              <p>Reset will remove your local PIN. Your saved entries stay safe.</p>
              <div className="flex gap-2 justify-center">
                <button onClick={handleForget} className="px-3 py-1.5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold">Reset PIN</button>
                <button onClick={() => setShowForget(false)} className="px-3 py-1.5 rounded-full border border-border text-xs">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </section>
  );
};

export default TrackerPinGate;
