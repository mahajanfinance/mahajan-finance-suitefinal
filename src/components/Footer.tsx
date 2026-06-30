import { Link } from "react-router-dom";
import { MessageCircle, Mail, MapPin, Globe } from "lucide-react";
import logo from "@/assets/logo.png";

const Footer = () => (
  <footer className="bg-foreground text-primary-foreground">
    <div className="container py-12">
      <div className="flex justify-center mb-8">
        <div className="rounded-xl border-2 border-golden/40 p-4 bg-foreground/50 flex items-center gap-3 hover:scale-105 transition-transform">
          <img src={logo} alt="Mahajan Finance" className="h-14 w-auto" />
          <div className="text-center">
            <span className="font-display font-extrabold text-lg block">
              <span style={{ color: "hsl(217, 91%, 60%)" }}>MAHAJAN</span>{" "}
              <span className="text-golden">FINANCE</span>
            </span>
            <span className="text-xs opacity-60">Your Trusted Financial Partner</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="rounded-xl border-2 border-golden/30 p-5 text-center hover:border-golden hover:shadow-lg transition-all">
          <h4 className="font-display font-bold mb-3 text-golden">Services</h4>
          <ul className="space-y-1.5 text-sm text-primary-foreground/60">
            <li>Personal, Home & Business Loans</li>
            <li>Gold, Vehicle & NRI Loans</li>
            <li>Car, Bike & Health Insurance</li>
            <li>ITR Filing & GST Returns</li>
            <li>PAN Card, FSSAI & Udyam</li>
            <li>Govt Schemes & Subsidies</li>
          </ul>
        </div>

        <div className="rounded-xl border-2 border-golden/30 p-5 text-center hover:border-golden hover:shadow-lg transition-all">
          <h4 className="font-display font-bold mb-3 text-golden">Contact Us</h4>
          <ul className="space-y-2.5 text-sm text-primary-foreground/60">
            <li className="flex items-center justify-center gap-2">
              <MessageCircle size={16} className="text-golden shrink-0" />
              <a href="https://wa.me/919730540215" target="_blank" rel="noopener noreferrer" className="hover:text-golden transition-colors">+91 9730540215</a>
            </li>
            <li className="flex items-center justify-center gap-2">
              <Mail size={16} className="text-golden shrink-0" />
              <a href="mailto:info@mahajanfinance.com" className="hover:text-golden transition-colors">info@mahajanfinance.com</a>
            </li>
            <li className="flex items-center justify-center gap-2">
              <MapPin size={16} className="text-golden shrink-0" />
              <span>Opp. Ashta Nagar Parishad, Ashta, Tal. Walwa, Dist. Sangli</span>
            </li>
            <li className="flex items-center justify-center gap-2">
              <Globe size={16} className="text-golden shrink-0" />
              <a href="https://www.mahajanfinance.com/" target="_blank" rel="noopener noreferrer" className="hover:text-golden transition-colors">www.mahajanfinance.com</a>
            </li>
          </ul>
        </div>

        <div className="rounded-xl border-2 border-golden/30 p-5 text-center hover:border-golden hover:shadow-lg transition-all">
          <h4 className="font-display font-bold mb-3 text-golden">Quick Links</h4>
          <ul className="space-y-1.5 text-sm text-primary-foreground/60">
            {[
              { label: "Home", path: "/" },
              { label: "Services", path: "/services" },
              { label: "Apply for Loan", path: "/apply-loan" },
              { label: "Investments", path: "/investments" },
              { label: "Partner Program", path: "/partner" },
              { label: "Govt Schemes", path: "/govt-schemes" },
              { label: "Deals & Shop", path: "/shopping" },
              { label: "Cash Flow Manager", path: "/tracker" },
              { label: "ABB Calculator", path: "/banking-surrogate" },
              { label: "Login / Register", path: "/auth" },
              { label: "About Us", path: "/about" },
              { label: "Contact", path: "/contact" },
            ].map((l) => (
              <li key={l.path}>
                <Link to={l.path} className="hover:text-golden transition-colors">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border-2 border-golden/30 p-5 text-center hover:border-golden hover:shadow-lg transition-all">
          <h4 className="font-display font-bold mb-3 text-golden">Legal</h4>
          <ul className="space-y-1.5 text-sm text-primary-foreground/60">
            <li><Link to="/privacy" className="hover:text-golden transition-colors">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-golden transition-colors">Terms & Conditions</Link></li>
            <li><Link to="/disclaimer" className="hover:text-golden transition-colors">Disclaimer</Link></li>
            <li><Link to="/contact" className="hover:text-golden transition-colors">Grievance / Contact</Link></li>
          </ul>
          <a
            href="https://wa.me/919730540215?text=Hello%20Mahajan%20Finance%2C%20I%20would%20like%20to%20enquire."
            target="_blank" rel="noopener noreferrer"
            className="mt-4 inline-block bg-success text-success-foreground px-4 py-2 rounded-full text-xs font-bold hover:brightness-90"
          >💬 Quick Enquiry</a>
        </div>
      </div>

      <div className="rounded-xl border-2 border-golden/30 mt-10 p-4 text-center text-sm text-primary-foreground/50">
        © 2026 Mahajan Finance. All rights reserved.
        <br />
        <a href="https://www.mahajanfinance.com/" target="_blank" rel="noopener noreferrer" className="hover:text-golden transition-colors">www.mahajanfinance.com</a>
      </div>
    </div>
  </footer>
);

export default Footer;
