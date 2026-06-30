import { useLocation, Link } from "react-router-dom";
import {
  Phone,
  Mail,
  MessageCircle,
  ChevronRight,
  ExternalLink,
  Calculator,
  FileText,
  Shield,
  TrendingUp,
  Building2,
  Handshake,
  ShoppingCart,
  BookOpen,
  Award,
  CreditCard,
  Home as HomeIcon,
} from "lucide-react";
import { SEARCH_INDEX, type SearchItem } from "@/lib/searchIndex";
import NotFound from "./NotFound"; // ✅ Added import

/* ─── Category config ──────────────────────────────── */
const CATEGORY_META: Record<
  string,
  { icon: React.ReactNode; color: string; cta: string; ctaPath: string }
> = {
  Loans: {
    icon: <CreditCard size={20} />,
    color: "from-amber-500/20 to-orange-500/20",
    cta: "Apply for Loan",
    ctaPath: "/apply-loan",
  },
  Insurance: {
    icon: <Shield size={20} />,
    color: "from-blue-500/20 to-cyan-500/20",
    cta: "Get Insurance Quote",
    ctaPath: "/insurance",
  },
  Investments: {
    icon: <TrendingUp size={20} />,
    color: "from-green-500/20 to-emerald-500/20",
    cta: "Start Investing",
    ctaPath: "/investments",
  },
  Tools: {
    icon: <Calculator size={20} />,
    color: "from-purple-500/20 to-violet-500/20",
    cta: "View All Tools",
    ctaPath: "/tracker",
  },
  Accounting: {
    icon: <FileText size={20} />,
    color: "from-rose-500/20 to-pink-500/20",
    cta: "Accounting Services",
    ctaPath: "/accounting",
  },
  "Govt Schemes": {
    icon: <Building2 size={20} />,
    color: "from-indigo-500/20 to-blue-500/20",
    cta: "All Govt Schemes",
    ctaPath: "/govt-schemes",
  },
  "CSC Services": {
    icon: <HomeIcon size={20} />,
    color: "from-teal-500/20 to-cyan-500/20",
    cta: "All Services",
    ctaPath: "/services",
  },
  "Credit Score": {
    icon: <Award size={20} />,
    color: "from-yellow-500/20 to-amber-500/20",
    cta: "Check Credit Score",
    ctaPath: "/credit-score",
  },
  Partner: {
    icon: <Handshake size={20} />,
    color: "from-orange-500/20 to-red-500/20",
    cta: "Join Partner Program",
    ctaPath: "/partner",
  },
  Shopping: {
    icon: <ShoppingCart size={20} />,
    color: "from-pink-500/20 to-fuchsia-500/20",
    cta: "View All Deals",
    ctaPath: "/shopping",
  },
  Learn: {
    icon: <BookOpen size={20} />,
    color: "from-sky-500/20 to-blue-500/20",
    cta: "All Articles",
    ctaPath: "/investments",
  },
  Company: {
    icon: <Building2 size={20} />,
    color: "from-gray-500/20 to-slate-500/20",
    cta: "Contact Us",
    ctaPath: "/contact",
  },
};

/* ─── Breadcrumb helper ────────────────────────────── */
function buildBreadcrumbs(path: string): { label: string; path: string }[] {
  const crumbs: { label: string; path: string }[] = [
    { label: "Home", path: "/" },
  ];

  const segments = path.split("/").filter(Boolean);
  let current = "";

  for (const seg of segments) {
    current += `/${seg}`;
    const match = SEARCH_INDEX.find((i) => i.path === current);
    crumbs.push({
      label: match?.title ?? seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      path: current,
    });
  }

  return crumbs;
}

/* ─── Related items from same category ─────────────── */
function getRelated(item: SearchItem): SearchItem[] {
  return SEARCH_INDEX.filter(
    (i) => i.category === item.category && i.path !== item.path
  ).slice(0, 4);
}

/* ═══════════════════════════════════════════════════════
   DYNAMIC PAGE COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function DynamicPage() {
  const location = useLocation();
  const item = SEARCH_INDEX.find((i) => i.path === location.pathname);

  /* ── Not in index → show standard 404 ── */
  if (!item) {
    return <NotFound />;
  }

  const meta = CATEGORY_META[item.category] ?? CATEGORY_META["Company"];
  const breadcrumbs = buildBreadcrumbs(item.path);
  const related = getRelated(item);

  const isTool = item.category === "Tools";
  const isLoan = item.category === "Loans";
  const isInsurance = item.category === "Insurance";
  const isGovt = item.category === "Govt Schemes";

  return (
    <div className="min-h-screen">
      {/* ─── Breadcrumbs ─── */}
      <div className="border-b border-border/50 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center gap-1.5 text-xs text-muted-foreground overflow-x-auto">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.path} className="flex items-center gap-1.5 whitespace-nowrap">
              {i > 0 && <ChevronRight size={12} />}
              {i < breadcrumbs.length - 1 ? (
                <Link to={crumb.path} className="hover:text-golden transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-foreground font-medium">{crumb.label}</span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* ─── Hero Section ─── */}
      <section className={`relative overflow-hidden bg-gradient-to-br ${meta.color} border-b border-border/30`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(212,175,55,0.08),transparent_60%)]" />
        <div className="relative max-w-5xl mx-auto px-4 py-12 md:py-16">
          <div className="flex items-start gap-4">
            {/* Category icon */}
            <div className="hidden sm:flex items-center justify-center w-14 h-14 rounded-2xl bg-golden/15 border border-golden/30 text-golden shrink-0">
              {meta.icon}
            </div>

            <div className="flex-1">
              {/* Category badge */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-golden/10 border border-golden/25 text-[11px] font-semibold text-golden uppercase tracking-wider mb-3">
                {item.category}
              </span>

              <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                {item.title}
              </h1>
              <p className="mt-3 text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                {item.desc}
              </p>

              {/* CTA buttons */}
              <div className="mt-6 flex flex-wrap gap-3">
                {isLoan && (
                  <Link
                    to="/apply-loan"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-golden text-black font-semibold hover:bg-golden/90 transition-colors shadow-lg shadow-golden/20"
                  >
                    Apply Now <ExternalLink size={14} />
                  </Link>
                )}
                {isInsurance && (
                  <Link
                    to="/insurance"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-golden text-black font-semibold hover:bg-golden/90 transition-colors shadow-lg shadow-golden/20"
                  >
                    Get Free Quote <ExternalLink size={14} />
                  </Link>
                )}
                {isTool && (
                  <Link
                    to={item.path}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-golden text-black font-semibold hover:bg-golden/90 transition-colors shadow-lg shadow-golden/20"
                  >
                    Open Calculator <Calculator size={14} />
                  </Link>
                )}
                {isGovt && (
                  <Link
                    to="/govt-schemes"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-golden text-black font-semibold hover:bg-golden/90 transition-colors shadow-lg shadow-golden/20"
                  >
                    Check Eligibility <ExternalLink size={14} />
                  </Link>
                )}
                {!isLoan && !isInsurance && !isTool && !isGovt && (
                  <Link
                    to={meta.ctaPath}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-golden text-black font-semibold hover:bg-golden/90 transition-colors shadow-lg shadow-golden/20"
                  >
                    {meta.cta} <ExternalLink size={14} />
                  </Link>
                )}

                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition-colors"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Content Area ─── */}
      <section className="max-w-5xl mx-auto px-4 py-10 md:py-14">
        <div className="grid md:grid-cols-3 gap-8">
          {/* ── Main content ── */}
          <div className="md:col-span-2 space-y-8">
            {/* Overview */}
            <div className="rounded-2xl border border-border/50 bg-card p-6">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                📋 Overview
              </h2>
              <div className="prose prose-sm text-muted-foreground max-w-none space-y-3">
                <p>{item.desc}</p>
                <p>
                  Mahajan Finance provides expert assistance for <strong className="text-foreground">{item.title.toLowerCase()}</strong> in Ashta, Sangli, and surrounding areas. 
                  Our experienced team ensures smooth processing, documentation support, and end-to-end guidance.
                </p>
              </div>

              {/* Keywords as tags */}
              {item.keywords.length > 0 && (
                <div className="mt-5 pt-4 border-t border-border/30">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Related Terms
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {item.keywords.slice(0, 10).map((kw) => (
                      <span
                        key={kw}
                        className="px-2.5 py-1 rounded-full text-[11px] bg-muted/60 text-muted-foreground border border-border/40"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* How it works */}
            <div className="rounded-2xl border border-border/50 bg-card p-6">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                🔄 How It Works
              </h2>
              <div className="space-y-4">
                {getSteps(item).map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-golden/15 border border-golden/30 text-golden font-bold text-sm shrink-0">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{step.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Documents required */}
            <div className="rounded-2xl border border-border/50 bg-card p-6">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                📄 Documents Required
              </h2>
              <div className="grid sm:grid-cols-2 gap-2">
                {getDocuments(item).map((doc, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 text-sm text-foreground"
                  >
                    <span className="text-golden">✓</span> {doc}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-6">
            {/* Quick contact */}
            <div className="rounded-2xl border-2 border-golden/25 bg-gradient-to-b from-golden/5 to-transparent p-5">
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                📞 Quick Assistance
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Get free consultation for {item.title.toLowerCase()} from our experts.
              </p>
              <div className="space-y-2.5">
                <a
                  href="tel:+919XXXXXXXXX"
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-golden text-black font-semibold text-sm hover:bg-golden/90 transition-colors"
                >
                  <Phone size={14} /> Call Now
                </a>
                <a
                  href="https://wa.me/919XXXXXXXXX"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-green-600 text-white font-semibold text-sm hover:bg-green-700 transition-colors"
                >
                  <MessageCircle size={14} /> WhatsApp
                </a>
                <Link
                  to="/contact"
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-border text-foreground font-medium text-sm hover:bg-muted transition-colors"
                >
                  <Mail size={14} /> Email Us
                </Link>
              </div>
            </div>

            {/* Parent page link */}
            <div className="rounded-2xl border border-border/50 bg-card p-5">
              <h3 className="font-bold text-foreground mb-2 text-sm">
                Looking for more options?
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Explore all {item.category.toLowerCase()} services offered by Mahajan Finance.
              </p>
              <Link
                to={meta.ctaPath}
                className="inline-flex items-center gap-1.5 text-sm text-golden hover:text-golden/80 font-semibold transition-colors"
              >
                {meta.cta} <ChevronRight size={14} />
              </Link>
            </div>

            {/* Related items */}
            {related.length > 0 && (
              <div className="rounded-2xl border border-border/50 bg-card p-5">
                <h3 className="font-bold text-foreground mb-3 text-sm">
                  Related in {item.category}
                </h3>
                <ul className="space-y-1.5">
                  {related.map((r) => (
                    <li key={r.path}>
                      <Link
                        to={r.path}
                        className="flex items-start gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted/60 transition-colors group"
                      >
                        <ChevronRight
                          size={14}
                          className="text-muted-foreground mt-0.5 group-hover:text-golden transition-colors shrink-0"
                        />
                        <div>
                          <p className="text-foreground font-medium group-hover:text-golden transition-colors">
                            {r.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {r.desc}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   HELPERS — generate contextual steps & documents
   ═══════════════════════════════════════════════════════ */

function getSteps(item: SearchItem): { title: string; desc: string }[] {
  const cat = item.category;

  if (cat === "Loans") {
    return [
      { title: "Check Eligibility", desc: "Share basic details — we assess your eligibility instantly" },
      { title: "Submit Documents", desc: "Provide required KYC & income documents — we handle verification" },
      { title: "Get Approval", desc: "Bank processes your application — approval in 24–72 hours" },
      { title: "Receive Funds", desc: "Loan amount disbursed directly to your bank account" },
    ];
  }
  if (cat === "Insurance") {
    return [
      { title: "Compare Quotes", desc: "Get instant quotes from 15+ insurance companies" },
      { title: "Choose Plan", desc: "Select the best plan matching your coverage needs & budget" },
      { title: "Make Payment", desc: "Pay premium online — instant policy issuance" },
      { title: "Receive Policy", desc: "Digital policy delivered to your email & WhatsApp" },
    ];
  }
  if (cat === "Investments") {
    return [
      { title: "Risk Assessment", desc: "Understand your risk profile & investment horizon" },
      { title: "Choose Products", desc: "Select from SIP, FD, PPF, NPS & more based on goals" },
      { title: "Start Investing", desc: "Set up SIP or one-time investment — paperless process" },
      { title: "Track & Review", desc: "Monitor portfolio performance with regular reviews" },
    ];
  }
  if (cat === "Accounting") {
    return [
      { title: "Share Requirements", desc: "Tell us which service you need — ITR, GST, PAN, etc." },
      { title: "Submit Documents", desc: "Upload or share documents via WhatsApp / email" },
      { title: "Expert Processing", desc: "Our CA team processes your filing / registration" },
      { title: "Confirmation & Receipt", desc: "Get acknowledgement, receipt & compliance certificate" },
    ];
  }
  if (cat === "Govt Schemes") {
    return [
      { title: "Check Eligibility", desc: "Verify if you qualify for the scheme based on criteria" },
      { title: "Prepare Application", desc: "We help fill forms & compile required documents" },
      { title: "Submit to Authority", desc: "Application submitted to DIC / KVIC / bank as applicable" },
      { title: "Get Sanction", desc: "Loan/subsidy sanctioned — margin money credited" },
    ];
  }
  if (cat === "Tools") {
    return [
      { title: "Enter Details", desc: "Input your loan amount, tenure, rate or investment amount" },
      { title: "Calculate Instantly", desc: "Get results immediately — EMI, returns, tax liability" },
      { title: "Compare Options", desc: "Try different scenarios to find the optimal choice" },
      { title: "Take Action", desc: "Apply, invest or file directly through Mahajan Finance" },
    ];
  }
  if (cat === "CSC Services") {
    return [
      { title: "Visit or Contact Us", desc: "Walk into our CSC centre or reach out via WhatsApp" },
      { title: "Provide Details", desc: "Share required information & documents for the service" },
      { title: "We Process", desc: "Our VLE processes your application on the portal" },
      { title: "Receive Output", desc: "Get certificate, receipt, or confirmation immediately" },
    ];
  }
  if (cat === "Credit Score") {
    return [
      { title: "Request Score Check", desc: "Share basic details to initiate free credit score check" },
      { title: "Verify Identity", desc: "OTP-based verification with the credit bureau" },
      { title: "Get Your Score", desc: "Receive your CIBIL score with detailed credit report" },
      { title: "Improvement Plan", desc: "Personalized advice to improve your credit score" },
    ];
  }
  if (cat === "Partner") {
    return [
      { title: "Register as Partner", desc: "Fill a simple form — no fees, no investment required" },
      { title: "Get Training", desc: "Learn about products, processes & referral methods" },
      { title: "Refer Customers", desc: "Share leads via app, WhatsApp or online portal" },
      { title: "Earn Commission", desc: "Get paid for every successful conversion — monthly payouts" },
    ];
  }

  // Default
  return [
    { title: "Reach Out", desc: "Contact us via phone, WhatsApp or the website" },
    { title: "Discuss Requirements", desc: "Share your needs — our team provides free consultation" },
    { title: "Get It Done", desc: "We handle the process end-to-end with complete transparency" },
    { title: "Stay Informed", desc: "Regular updates until your request is fully resolved" },
  ];
}

function getDocuments(item: SearchItem): string[] {
  const cat = item.category;

  if (cat === "Loans") {
    return [
      "PAN Card",
      "Aadhaar Card",
      "Income Proof (Salary Slips / ITR)",
      "Bank Statements (6 months)",
      "Address Proof",
      "Photographs",
      "Property Documents (for Home Loan / LAP)",
      "Business Proof (for Business Loan)",
    ];
  }
  if (cat === "Insurance") {
    return [
      "Aadhaar Card",
      "PAN Card",
      "Vehicle RC (for motor insurance)",
      "Previous Policy (for renewal)",
      "Driving License",
      "Photographs",
    ];
  }
  if (cat === "Accounting") {
    return [
      "PAN Card",
      "Aadhaar Card",
      "Form 16 / Salary Slips",
      "Bank Statements",
      "Investment Proofs",
      "GST Certificate (if applicable)",
      "Business Registration Certificate",
    ];
  }
  if (cat === "Govt Schemes") {
    return [
      "Aadhaar Card",
      "PAN Card",
      "Caste Certificate (if applicable)",
      "Income Certificate",
      "Address Proof",
      "Bank Passbook",
      "Project Report / Business Plan",
      "Photographs",
    ];
  }
  if (cat === "Investments") {
    return [
      "PAN Card",
      "Aadhaar Card",
      "Bank Account Details",
      "Cancelled Cheque",
      "Photographs",
    ];
  }
  if (cat === "CSC Services") {
    return [
      "Aadhaar Card",
      "Any ID Proof",
      "Supporting Documents (varies by service)",
      "Photographs",
    ];
  }

  return [
    "Aadhaar Card",
    "PAN Card",
    "Address Proof",
    "Contact Details",
  ];
}