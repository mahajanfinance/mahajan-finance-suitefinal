import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { allLoanOffers, loanOffersMeta, type LoanTypeOffer } from "@/data/loanOffers";

const accentColorMap: Record<string, string> = {
  blue: "border-t-blue-700 text-blue-700 bg-blue-50",
  orange: "border-t-orange-600 text-orange-700 bg-orange-50",
  burgundy: "border-t-red-900 text-red-900 bg-red-50",
  indigo: "border-t-indigo-700 text-indigo-700 bg-indigo-50",
  red: "border-t-red-600 text-red-700 bg-red-50",
  sky: "border-t-sky-600 text-sky-700 bg-sky-50",
  teal: "border-t-teal-600 text-teal-700 bg-teal-50",
  amber: "border-t-amber-600 text-amber-700 bg-amber-50",
  green: "border-t-emerald-600 text-emerald-700 bg-emerald-50",
};

const BankCard = ({ offer, index }: { offer: LoanTypeOffer; index: number }) => {
  const [expanded, setExpanded] = useState(false);
  const accent = accentColorMap[offer.accent || "blue"];
  const visibleFeatures = expanded ? offer.features : offer.features.slice(0, 2);
  const hiddenCount = offer.features.length - 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.25, delay: (index % 6) * 0.04 }}
      className="bg-card rounded-lg border border-border hover:border-golden hover:shadow-lg transition-all flex flex-col h-full"
    >
      <div className={`rounded-t-md border-t-4 px-2 py-1.5 font-extrabold text-[11px] font-display text-center ${accent}`}>
        {offer.lender}
      </div>
      <div className="p-2.5 text-[11px] space-y-1.5 flex-1">
        {/* ── Min Salary Box ── */}
        <div className="text-center bg-muted/60 rounded py-1.5 px-1 border border-border">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Min Salary</p>
          {offer.minSalaryLines.map((line, i) => (
            <p key={i} className="text-[10px] font-bold text-foreground leading-tight">{line}</p>
          ))}
        </div>

        {/* ── Core Details ── */}
        <div className="space-y-1">
          <div>
            <p className="font-bold text-foreground">Loan</p>
            <p className="text-muted-foreground text-[10px] leading-tight">{offer.amount}</p>
          </div>
          <div>
            <p className="font-bold text-foreground">Rate*</p>
            <p className="text-muted-foreground text-[10px] leading-tight">{offer.rate} p.a.</p>
          </div>
          <div>
            <p className="font-bold text-foreground">Tenure</p>
            <p className="text-muted-foreground text-[10px] leading-tight">{offer.tenure}</p>
          </div>
        </div>

        {/* ── Features ── */}
        <ul className="space-y-0.5 text-[10px] text-muted-foreground mt-auto pt-1.5 border-t border-border">
          {visibleFeatures.map((f) => (
            <li key={f} className="flex items-start gap-1">
              <span className="text-golden mt-px shrink-0">✓</span> {f}
            </li>
          ))}
        </ul>

        {offer.features.length > 2 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[10px] font-bold text-primary hover:text-golden text-center mt-1 transition-colors w-full"
          >
            {expanded ? "Less ↑" : `+${hiddenCount} more`}
          </button>
        )}
      </div>
    </motion.div>
  );
};

const loanTypeLabels: Record<string, string> = {
  personal: "Personal Loan",
  home: "Home Loan",
  lap: "Loan Against Property",
  vehicle: "Vehicle Loan",
  business: "Business Loan",
  gold: "Gold Loan",
  education: "Education Loan",
  agri: "Agri / Tractor",
  commercial: "Commercial Vehicle",
  construction: "Construction Equip.",
  shg: "SHG Loan",
  nri: "NRI Loan",
};

interface BankLoanOffersProps {
  loanType: string;
}

const BankLoanOffers = ({ loanType }: BankLoanOffersProps) => {
  const meta = loanOffersMeta[loanType] || loanOffersMeta.personal;
  const offers = allLoanOffers[loanType] || allLoanOffers.personal;

  return (
    <div className="w-full my-10">
      <div className="max-w-7xl mx-auto px-4">
        {/* ── Hero Strip ── */}
        <div className="rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4 md:p-5 mb-6 text-center shadow-md">
          <p className="uppercase text-xs md:text-sm tracking-widest opacity-90">
            {loanTypeLabels[loanType] || "Loan"} up to
          </p>
          <h2 className="text-3xl md:text-5xl font-extrabold font-display text-golden mt-1">
            {meta.maxAmount}
          </h2>
          <div className="inline-flex flex-wrap justify-center gap-x-3 gap-y-1 mt-3 text-xs md:text-sm font-bold">
            {meta.highlights.map((h) => (
              <span key={h} className="px-3 py-1 rounded-full bg-primary-foreground/10 border border-primary-foreground/20">
                {h.toUpperCase()}
              </span>
            ))}
          </div>
        </div>

        {/* ── Bank Grid ── */}
        <h3 className="text-center text-base md:text-lg font-extrabold font-display text-primary mb-4 flex items-center justify-center gap-2">
          <Sparkles size={18} className="text-golden" /> BANK-WISE {((loanTypeLabels[loanType] || "LOAN").toUpperCase())} OFFERS
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 w-full">
          {offers.map((offer, i) => (
            <BankCard key={offer.lender} offer={offer} index={i} />
          ))}
        </div>

        <p className="text-[10px] text-center text-muted-foreground mt-4 italic">
          *Interest rates are subject to change as per bank/NBFC guidelines and customer profile. T&amp;C Apply.
        </p>
      </div>
    </div>
  );
};

export default BankLoanOffers;
