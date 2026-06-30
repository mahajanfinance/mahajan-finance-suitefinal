import { Link } from "react-router-dom";

const Page = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="py-12 bg-background">
    <div className="container max-w-3xl">
      <h1 className="text-3xl font-extrabold font-display text-foreground mb-2">{title}</h1>
      <p className="text-sm text-muted-foreground mb-6">Mahajan Finance · info@mahajanfinance.com · +91 9730540215</p>
      <div className="prose prose-sm max-w-none text-foreground/85 space-y-4 leading-relaxed">{children}</div>
      <div className="mt-8 text-sm">
        <Link to="/" className="text-primary font-bold hover:underline">← Back to Home</Link>
      </div>
    </div>
  </section>
);

export const Privacy = () => (
  <Page title="Privacy Policy">
    <p>We respect your privacy. We collect personal information (name, mobile, email, address, KYC documents) only to process loan, insurance, accounting and government scheme applications.</p>
    <h3 className="font-bold text-base">Information we collect</h3>
    <ul className="list-disc pl-5 space-y-1">
      <li>Contact details, identity & address proof, income & bank statements (when applicable)</li>
      <li>Payment metadata processed by Razorpay (we do not store card / UPI details)</li>
      <li>Device & log data needed for security and fraud prevention</li>
    </ul>
    <h3 className="font-bold text-base">How we use it</h3>
    <p>To process your application, share with empaneled banks/NBFCs/insurers, comply with law, and contact you regarding services. We never sell your data.</p>
    <h3 className="font-bold text-base">Data security</h3>
    <p>Data is stored on a secured cloud backend with row-level access control. Payments are PCI-DSS compliant via Razorpay.</p>
    <h3 className="font-bold text-base">Your rights</h3>
    <p>You can request deletion or correction of your data anytime by emailing info@mahajanfinance.com.</p>
  </Page>
);

export const Terms = () => (
  <Page title="Terms & Conditions">
    <p>By using mahajanfinance.com you agree to these terms.</p>
    <ul className="list-disc pl-5 space-y-1">
      <li>Mahajan Finance acts as a DSA / facilitator. Final loan, insurance and scheme approvals rest with the respective bank, NBFC or government authority.</li>
      <li>Service / processing fees are non-refundable once work has begun, except where mandated by law.</li>
      <li>You confirm that all information & documents submitted are true and belong to you.</li>
      <li>Cash Flow Manager subscription is billed at ₹499/month after a 15-day free trial. You may cancel anytime; access continues until the paid period ends.</li>
      <li>Any misuse, fraud or false documentation will lead to cancellation and may be reported to authorities.</li>
    </ul>
  </Page>
);

export const Disclaimer = () => (
  <Page title="Disclaimer">
    <p>Information on this website is for general guidance only and does not constitute investment, tax, legal or financial advice.</p>
    <ul className="list-disc pl-5 space-y-1">
      <li>EMI, SIP, ABB and other calculators are indicative; actual figures depend on the lender / fund / bank.</li>
      <li>Loan eligibility, interest rate, sanction amount and timeline are decided solely by the lender.</li>
      <li>Mutual funds, ULIPs and market-linked investments are subject to market risks. Read all scheme documents carefully.</li>
      <li>We are not responsible for losses arising from third-party websites linked from this platform.</li>
    </ul>
    <p>For personalised advice, please contact us at +91 9730540215 or info@mahajanfinance.com.</p>
  </Page>
);
