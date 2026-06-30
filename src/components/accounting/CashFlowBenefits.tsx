import { motion } from "framer-motion";
import { X } from "lucide-react";
import { benefits } from "@/lib/accounting";

const CashFlowBenefits = ({ onClose }: { onClose: () => void }) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }}
        className="bg-card rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border-2 border-golden/30"
        onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-card border-b border-border p-5 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-extrabold font-display">💰 About Cash Flow Pro</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Full accounting software for Indian small businesses</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-center">
          <p className="text-sm opacity-90">Try free for</p>
          <p className="text-3xl font-extrabold">15 Days</p>
          <p className="text-sm opacity-90 mt-1">then ₹499/month · cancel anytime</p>
        </div>

        <div className="p-5 grid sm:grid-cols-2 gap-3">
          {benefits.map((b, i) => (
            <div key={i} className="flex gap-3 p-3 rounded-lg border border-border hover:border-golden/40 hover:bg-muted/30 transition-all">
              <div className="text-2xl shrink-0">{b.icon}</div>
              <div>
                <p className="font-bold text-sm">{b.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{b.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-5 border-t border-border bg-muted/30 text-center text-xs text-muted-foreground">
          Trusted by 1,000+ small businesses across India · Secure 256-bit encryption · Hosted on Indian servers
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CashFlowBenefits;
