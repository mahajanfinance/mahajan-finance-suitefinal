import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import Index from "./pages/Index";
import Services from "./pages/Services";
import LoanApplication from "./pages/LoanApplication";
import InsuranceQuote from "./pages/InsuranceQuote";
import PartnerProgram from "./pages/PartnerProgram";
import About from "./pages/About";
import Contact from "./pages/Contact";
import GovtSchemes from "./pages/GovtSchemes";
import AccountingServices from "./pages/AccountingServices";
import Investments from "./pages/Investments";
import Shopping from "./pages/Shopping";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Tracker from "./pages/Tracker";
import TrackerLogin from "./pages/TrackerLogin";
import ResetPassword from "./pages/ResetPassword";
import BankingSurrogate from "./pages/BankingSurrogate";
import { Privacy, Terms, Disclaimer } from "./pages/Legal";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/services" element={<Services />} />
            {/* Added CSC Services Route */}
            <Route path="/csc-services" element={<Services />} />
            <Route path="/apply-loan" element={<LoanApplication />} />
            <Route path="/insurance" element={<InsuranceQuote />} />
            <Route path="/investments" element={<Investments />} />
            <Route path="/shopping" element={<Shopping />} />
            <Route path="/partner" element={<PartnerProgram />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/govt-schemes" element={<GovtSchemes />} />
            <Route path="/accounting" element={<AccountingServices />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tracker" element={<Tracker />} />
            <Route path="/banking-surrogate" element={<BankingSurrogate />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/disclaimer" element={<Disclaimer />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="/tracker/login" element={<TrackerLogin />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;