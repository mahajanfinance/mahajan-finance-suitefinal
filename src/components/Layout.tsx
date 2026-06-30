import { useState, useEffect } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { Phone, Mail, Menu, X, ChevronRight } from "lucide-react";
import SiteSearch from "@/components/SiteSearch";
import logo from "@/assets/logo.png"; // ✅ Logo imported (change to .svg or .jpg if needed)

/* ─── Scroll to hash & highlight ─── */
function ScrollToHash() {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    if (!hash) return;

    const timer = setTimeout(() => {
      const id = hash.replace("#", "");
      const el = document.getElementById(id);
      if (!el) return;

      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("search-highlight");
      setTimeout(() => el.classList.remove("search-highlight"), 2500);
    }, 150);

    return () => clearTimeout(timer);
  }, [hash, pathname]);

  return null;
}

/* ═══════════════════════════════════════════════════════
   LAYOUT COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function Layout() {
  const { pathname } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Scroll to top on page change (if no hash)
  useEffect(() => {
    if (!window.location.hash) {
      window.scrollTo(0, 0);
    }
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "🏦 Loans", path: "/apply-loan" },
    { name: "🛡️ Insurance", path: "/insurance" },
    { name: "📈 Investments", path: "/investments" },
    { name: "📊 Accounting", path: "/accounting" },
    { name: "🧾 CSC Services", path: "/services" },
    { name: "🏛️ Govt Schemes", path: "/govt-schemes" },
    { name: "🛒 Deals", path: "/shopping" },
    { name: "🤝 Partner", path: "/partner" },
    { name: "💰 Cash Flow", path: "/tracker" },
    { name: "About Us", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ScrollToHash />

      {/* ─── TOP BAR ─── */}
      <div className="hidden md:block bg-foreground text-background/80 text-xs border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="tel:+919730540215" className="flex items-center gap-1.5 hover:text-golden transition-colors">
              <Phone size={12} /> +91 9730540215
            </a>
            <a href="mailto:info@mahajanfinance.com" className="flex items-center gap-1.5 hover:text-golden transition-colors">
              <Mail size={12} /> info@mahajanfinance.com
            </a>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-64">
              <SiteSearch />
            </div>
            <Link to="/auth" className="hover:text-golden font-medium transition-colors">
              Login
            </Link>
          </div>
        </div>
      </div>

      {/* ─── MAIN NAVBAR ─── */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-20">
          
          {/* ✅ Header Logo - INCREASED SIZE */}
          <Link to="/" className="flex items-center gap-3">
            <img 
              src={logo} 
              alt="Mahajan Finance Logo" 
              className="h-14 w-auto object-contain" 
            />
            <h1 className="text-2xl font-extrabold text-foreground leading-none tracking-tight">
              MAHAJAN<span className="text-golden"> FINANCE</span>
            </h1>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.path
                    ? "bg-golden/10 text-golden"
                    : "text-foreground/80 hover:bg-muted hover:text-foreground"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Link
              to="/apply-loan"
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-golden text-black font-bold text-sm hover:bg-golden/90 transition-colors shadow-md shadow-golden/20"
            >
              Apply Now
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* ─── MOBILE MENU ─── */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-card shadow-xl">
            <div className="p-4 border-b border-border">
              <SiteSearch />
            </div>
            <nav className="p-2 max-h-[70vh] overflow-y-auto">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    pathname === link.path
                      ? "bg-golden/10 text-golden"
                      : "text-foreground/80 hover:bg-muted"
                  }`}
                >
                  {link.name}
                  <ChevronRight size={14} className="text-muted-foreground" />
                </Link>
              ))}
              <div className="mt-4 px-4 flex flex-col gap-3">
                <Link
                  to="/apply-loan"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center px-5 py-3 rounded-xl bg-golden text-black font-bold text-sm hover:bg-golden/90 transition-colors shadow-md"
                >
                  Apply Now
                </Link>
                <Link
                  to="/auth"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center px-5 py-3 rounded-xl border border-border text-foreground font-medium text-sm hover:bg-muted transition-colors"
                >
                  Login / Register
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="bg-foreground text-background/80 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
            
            {/* Column 1: Brand & Services */}
            <div>
              {/* ✅ Footer Logo - INCREASED SIZE */}
              <Link to="/" className="flex items-center gap-3 mb-4">
                <img 
                  src={logo} 
                  alt="Mahajan Finance Logo" 
                  className="h-14 w-auto object-contain" 
                />
                <span className="text-2xl font-extrabold text-white tracking-tight">
                  MAHAJAN<span className="text-golden"> FINANCE</span>
                </span>
              </Link>
              <p className="text-sm text-background/60 mb-4">Your Trusted Financial Partner</p>
              <ul className="space-y-1.5 text-sm text-background/70">
                <li>Personal, Home & Business Loans</li>
                <li>Gold, Vehicle & NRI Loans</li>
                <li>Car, Bike & Health Insurance</li>
                <li>ITR Filing & GST Returns</li>
                <li>PAN Card, FSSAI & Udyam</li>
                <li>Govt Schemes & Subsidies</li>
              </ul>
            </div>

            {/* Column 2: Contact */}
            <div>
              <h3 className="text-white font-bold text-base mb-4">Contact Us</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <Phone size={16} className="text-golden shrink-0 mt-0.5" />
                  <a href="tel:+919730540215" className="hover:text-golden transition-colors">+91 9730540215</a>
                </li>
                <li className="flex items-start gap-2">
                  <Mail size={16} className="text-golden shrink-0 mt-0.5" />
                  <a href="mailto:info@mahajanfinance.com" className="hover:text-golden transition-colors">info@mahajanfinance.com</a>
                </li>
                <li className="text-background/60">
                  Opp. Ashta Nagar Parishad, Ashta, Tal. Walwa, Dist. Sangli
                </li>
                <li className="text-background/60">
                  www.mahajanfinance.com
                </li>
              </ul>
            </div>

            {/* Column 3: Quick Links */}
            <div>
              <h3 className="text-white font-bold text-base mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                {[
                  { name: "Home", path: "/" },
                  { name: "Services", path: "/services" },
                  { name: "Apply for Loan", path: "/apply-loan" },
                  { name: "Investments", path: "/investments" },
                  { name: "Partner Program", path: "/partner" },
                  { name: "Govt Schemes", path: "/govt-schemes" },
                  { name: "Deals & Shop", path: "/shopping" },
                  { name: "Cash Flow Manager", path: "/tracker" },
                  { name: "Login / Register", path: "/auth" },
                ].map(link => (
                  <li key={link.path}>
                    <Link to={link.path} className="text-background/70 hover:text-golden transition-colors flex items-center gap-1.5">
                      <ChevronRight size={12} /> {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Legal */}
            <div>
              <h3 className="text-white font-bold text-base mb-4">Legal</h3>
              <ul className="space-y-2 text-sm mb-6">
                {[
                  { name: "Privacy Policy", path: "/privacy" },
                  { name: "Terms & Conditions", path: "/terms" },
                  { name: "Disclaimer", path: "/disclaimer" },
                ].map(link => (
                  <li key={link.path}>
                    <Link to={link.path} className="text-background/70 hover:text-golden transition-colors flex items-center gap-1.5">
                      <ChevronRight size={12} /> {link.name}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-white font-semibold text-sm mb-2">💬 Quick Enquiry</p>
                <a 
                  href="https://wa.me/919730540215" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors w-full justify-center"
                >
                  WhatsApp Us
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-background/50">
            <p>© 2026 Mahajan Finance. All rights reserved.</p>
            <p>www.mahajanfinance.com</p>
          </div>
        </div>
      </footer>
    </div>
  );
}