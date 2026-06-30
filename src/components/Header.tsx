import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, MessageCircle, Mail, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SiteSearch from "./SiteSearch";
import logo from "@/assets/logo.png";

// ABB Calc moved under Loans section (accessible from /apply-loan page)
const navLinks = [
  { label: "Home", path: "/" },
  { label: "🏦 Loans", path: "/apply-loan" },
  { label: "🛡️ Insurance", path: "/insurance" },
  { label: "📈 Investments", path: "/investments" },
  { label: "📊 Accounting", path: "/accounting" },
  { label: "🧾 CSC Services", path: "/services" },
  { label: "🏛️ Govt Schemes", path: "/govt-schemes" },
  { label: "🛒 Deals", path: "/shopping" },
  { label: "🤝 Partner", path: "/partner" },
  { label: "💰 Cash Flow", path: "/tracker" },
  { label: "About Us", path: "/about" },
  { label: "Contact", path: "/contact" },
];

const Header = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user || null));
    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-card shadow-md">
      <div className="bg-card border-b border-border text-foreground text-sm py-2">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="https://wa.me/919730540215" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 font-semibold text-success hover:underline hover:scale-105 transition-transform">
              <MessageCircle size={14} /> +91 9730540215
            </a>
            <a href="mailto:info@mahajanfinance.com" className="hidden md:flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <Mail size={14} /> info@mahajanfinance.com
            </a>
          </div>
          <div className="flex items-center gap-2">
            <SiteSearch />
            <Link to={user ? "/dashboard" : "/auth"} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary text-primary text-xs font-bold hover:bg-primary hover:text-primary-foreground transition-all hover:scale-105">
              <User size={14} /> {user ? "Dashboard" : "Login"}
            </Link>
          </div>
        </div>
      </div>

      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="h-12 w-12 flex items-center justify-center shrink-0 overflow-hidden rounded-md bg-white">
            <img
              src={logo}
              alt="Mahajan Finance Logo"
              className="h-full w-full object-contain group-hover:scale-110 transition-transform"
            />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-display font-extrabold text-xl tracking-tight">
              <span style={{ color: "hsl(217, 91%, 40%)" }}>MAHAJAN</span>{" "}
              <span className="text-golden">FINANCE</span>
            </span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-0.5">
          {navLinks.map((l) => (
            <Link key={l.label + l.path} to={l.path}
              className={`px-2.5 py-2 rounded-md text-[13px] font-medium transition-all duration-200 relative
                after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-0.5 after:bg-accent after:transition-all after:duration-300 hover:after:w-3/4
                hover:text-primary hover:scale-105
                ${location.pathname === l.path ? "text-accent after:w-3/4 scale-105" : "text-foreground/70"}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <Link to="/apply-loan" className="hidden lg:inline-flex btn-accent text-sm !px-6 !py-2.5 rounded-full hover:scale-110 transition-transform shadow-lg">
          Apply Now
        </Link>

        <button onClick={() => setOpen(!open)} className="lg:hidden p-2 -mr-2 text-foreground">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <nav className="lg:hidden border-t border-border bg-card pb-4">
          {navLinks.map((l) => (
            <Link key={l.label + l.path} to={l.path} onClick={() => setOpen(false)}
              className={`block px-4 py-3 text-base font-medium border-b border-border/50 hover:bg-primary/5 transition-colors ${location.pathname === l.path ? "text-accent bg-accent/5" : "text-foreground/80"}`}>
              {l.label}
            </Link>
          ))}
          <div className="px-4 pt-3 space-y-2">
            <Link to="/apply-loan" onClick={() => setOpen(false)} className="btn-accent block text-center text-sm !py-3 rounded-full">Apply Now</Link>
            <Link to={user ? "/dashboard" : "/auth"} onClick={() => setOpen(false)} className="block text-center text-sm py-3 rounded-full border-2 border-primary text-primary font-bold hover:bg-primary hover:text-primary-foreground transition-all">
              {user ? "Dashboard" : "Login / Register"}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;
