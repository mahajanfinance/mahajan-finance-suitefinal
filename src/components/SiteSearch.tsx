import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, CornerDownLeft, FileSearch } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Search Data & Logic Merged Directly for Instant Functionality ---
export interface SearchItem {
  title: string;
  desc: string;
  path: string;
  keywords?: string[];
}

const searchIndex: SearchItem[] = [
  // LOANS
  { title: "Personal Loan", desc: "Quick personal loans for any need", path: "/apply-loan?type=personal", keywords: ["personal", "cash"] },
  { title: "Business Loan", desc: "Grow your business with unsecured loans", path: "/apply-loan?type=business", keywords: ["business", "msme", "working capital"] },
  { title: "ABB Calculator", desc: "Banking surrogate calculator", path: "/banking-surrogate", keywords: ["abb", "banking", "surrogate", "calculator"] },
  { title: "Home Loan", desc: "Buy or build your dream home", path: "/apply-loan?type=home", keywords: ["home", "house", "property"] },
  { title: "Loan Against Property", desc: "Get funds against your property", path: "/apply-loan?type=lap", keywords: ["lap", "mortgage", "property"] },
  { title: "Vehicle Loan", desc: "Finance your car or bike", path: "/apply-loan?type=vehicle", keywords: ["car", "bike", "auto", "vehicle"] },
  { title: "Gold Loan", desc: "Instant funds against gold", path: "/apply-loan?type=gold", keywords: ["gold", "jewelry"] },
  { title: "Education Loan", desc: "Fund your studies", path: "/apply-loan?type=education", keywords: ["education", "student", "study"] },
  { title: "Agri / Tractor Loan", desc: "Loans for farming and tractors", path: "/apply-loan?type=agri", keywords: ["agri", "tractor", "farming", "krishi"] },
  { title: "Commercial Vehicle", desc: "Finance trucks and commercial vehicles", path: "/apply-loan?type=commercial", keywords: ["truck", "lorry", "commercial"] },
  { title: "Construction Equip.", desc: "Finance JCB and construction machinery", path: "/apply-loan?type=construction", keywords: ["jcb", "construction", "machinery"] },
  { title: "SHG Loan", desc: "Loans for Self Help Groups", path: "/apply-loan?type=shg", keywords: ["shg", "group", "women"] },
  { title: "NRI Loan", desc: "Special loans for NRIs", path: "/apply-loan?type=nri", keywords: ["nri", "foreign"] },

  // CSC SERVICES
  { title: "PAN Card", desc: "New PAN card application (₹250)", path: "/csc-services", keywords: ["pan", "pancard", "income tax", "nsdl", "aadhaar"] },
  { title: "Shop Act License", desc: "Gumasta license registration (₹500)", path: "/csc-services", keywords: ["shop", "gumasta", "license", "establishment"] },
  { title: "GST Registration", desc: "New GST number application (₹1000)", path: "/csc-services", keywords: ["gst", "tax", "goods"] },
  { title: "Food License (FSSAI)", desc: "FSSAI food safety license (₹1000)", path: "/csc-services", keywords: ["fssai", "food", "hotel", "license"] },
  { title: "Udyam / MSME", desc: "MSME / Udyam registration (₹300)", path: "/csc-services", keywords: ["udyam", "msme", "udyog"] },
  { title: "Voter ID", desc: "New voter ID card (₹200)", path: "/csc-services", keywords: ["voter", "epic", "election"] },
  { title: "Passport", desc: "Passport application assistance (₹3000)", path: "/csc-services", keywords: ["passport", "travel", "international"] },
  { title: "Life Certificate", desc: "Jeevan Pramaan for pensioners (₹100)", path: "/csc-services", keywords: ["life certificate", "jeevan pramaan", "pension"] },
  { title: "Ayushman Card", desc: "PMJAY Ayushman Bharat card (₹100)", path: "/csc-services", keywords: ["ayushman", "pmjay", "health card"] },
  { title: "Pension Scheme", desc: "Govt pension scheme application", path: "/csc-services", keywords: ["pension", "retirement"] },

  // INSURANCE
  { title: "Car Insurance", desc: "Comprehensive car insurance", path: "/insurance", keywords: ["car", "auto"] },
  { title: "Bike Insurance", desc: "Two-wheeler insurance", path: "/insurance", keywords: ["bike", "two wheeler"] },
  { title: "Health Insurance", desc: "Medical insurance for family", path: "/insurance", keywords: ["health", "medical", "mediclaim"] },
  { title: "Personal Accident", desc: "Accident coverage", path: "/insurance", keywords: ["accident", "pa"] },
  { title: "Fire Insurance", desc: "Protect property from fire", path: "/insurance", keywords: ["fire", "property"] },

  // ACCOUNTING
  { title: "ITR Filing", desc: "Income tax return filing", path: "/accounting", keywords: ["itr", "tax", "return"] },
  { title: "GST Return Filing", desc: "Monthly/Annual GST returns", path: "/accounting", keywords: ["gst return", "gstr"] },
  { title: "Project Reports", desc: "Detailed project reports for loans", path: "/accounting", keywords: ["project", "report", "dpr"] },
  { title: "Company Registration", desc: "Pvt Ltd / LLP incorporation", path: "/accounting", keywords: ["company", "registration", "incorporation"] },

  // INVESTMENTS
  { title: "SIP", desc: "Systematic Investment Plans", path: "/investments", keywords: ["sip", "mutual fund"] },
  { title: "Mutual Funds", desc: "Invest in top mutual funds", path: "/investments", keywords: ["mutual fund", "mf"] },
  { title: "Fixed Deposits", desc: "High-interest FDs", path: "/investments", keywords: ["fd", "fixed deposit"] },

  // GOVT SCHEMES
  { title: "PM Awas Yojana", desc: "Subsidized home loans", path: "/govt-schemes", keywords: ["pmay", "awas", "housing"] },
  { title: "CMEGP", desc: "Capital subsidy for manufacturing", path: "/govt-schemes", keywords: ["cmegp", "subsidy", "manufacturing"] },
  { title: "PM Suraksha Bima", desc: "Accident insurance scheme", path: "/govt-schemes", keywords: ["suraksha", "bsby"] },
  { title: "PM Jeevan Jyoti", desc: "Life insurance scheme", path: "/govt-schemes", keywords: ["jeevan jyoti", "pmjjby"] },
];

const searchSite = (query: string): SearchItem[] => {
  if (!query) return [];
  const q = query.toLowerCase();
  return searchIndex.filter(item => 
    item.title.toLowerCase().includes(q) || 
    item.desc.toLowerCase().includes(q) ||
    item.keywords?.some(k => k.includes(q))
  ).slice(0, 6); // Return top 6 results
};
// --- End Search Data ---


const SiteSearch = () => {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchItem[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => { 
    setResults(searchSite(q)); 
    setActiveIdx(0);
  }, [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return;
    
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx(prev => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx(prev => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[activeIdx]) {
        navigate(results[activeIdx].path);
        setOpen(false);
        setQ("");
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={ref} className="relative w-full md:w-auto">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search services..."
          className="w-full md:w-64 pl-9 pr-9 py-2 rounded-xl border border-slate-200 bg-slate-50 text-foreground text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all"
        />
        {q ? (
          <button 
            onClick={() => { setQ(""); inputRef.current?.focus(); }} 
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        ) : (
          <kbd className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 items-center justify-center h-5 px-1.5 text-[10px] font-bold text-slate-400 bg-slate-100 border border-slate-200 rounded">
            ⌘K
          </kbd>
        )}
      </div>

      <AnimatePresence>
        {open && q && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-screen md:w-96 max-w-[calc(100vw-2rem)] max-h-[70vh] overflow-y-auto bg-white border border-slate-100 rounded-2xl shadow-2xl z-[9999] overflow-hidden"
          >
            {results.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center gap-2">
                <FileSearch className="w-8 h-8 text-slate-300" />
                <p className="text-sm font-bold text-slate-700">No results found</p>
                <p className="text-xs text-slate-500">Try searching for "loan", "PAN", or "GST"</p>
              </div>
            ) : (
              <div className="p-2">
                <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Quick Links
                </p>
                <ul className="space-y-1">
                  {results.map((r, idx) => (
                    <li key={r.path + idx}>
                      <button
                        onClick={() => { navigate(r.path); setOpen(false); setQ(""); }}
                        onMouseEnter={() => setActiveIdx(idx)}
                        className={`w-full text-left flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg transition-colors ${
                          activeIdx === idx ? "bg-primary/5" : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold ${activeIdx === idx ? "text-primary" : "text-slate-800"}`}>
                            {r.title}
                          </p>
                          <p className="text-xs text-slate-500 truncate">{r.desc}</p>
                        </div>
                        {activeIdx === idx && (
                          <div className="flex items-center justify-center w-6 h-6 text-slate-400">
                            <CornerDownLeft size={14} />
                          </div>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SiteSearch;