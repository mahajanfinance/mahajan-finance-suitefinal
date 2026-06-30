import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import heroBanner from "@/assets/hero-banner.png";

const HeroSection = () => (
  <section className="relative bg-gradient-to-br from-background via-background to-primary/5 py-10 md:py-16 overflow-hidden">
    <div className="container">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
          className="text-center md:text-left"
        >
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.1] font-display">
            Complete Financial Solutions
          </h1>
          <p className="text-2xl md:text-3xl font-extrabold tracking-tight leading-[1.1] font-display text-golden mt-2">
            for Individuals & Businesses
          </p>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-5 text-lg text-muted-foreground max-w-lg leading-relaxed"
          >
            Loans • Insurance • Investments • Accounting • CSC & Government Schemes
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-6 flex flex-wrap gap-4 justify-center md:justify-start"
          >
            <Link to="/apply-loan" className="btn-accent flex items-center gap-2 rounded-full !px-8 !py-3.5 text-base hover:scale-105 transition-transform">
              Check Loan Eligibility <ArrowRight size={18} />
            </Link>
            <Link to="/services" className="flex items-center gap-2 px-8 py-3.5 rounded-full border-2 border-golden text-golden font-bold hover:bg-golden hover:text-golden-foreground transition-all text-base hover:scale-105">
              Explore Services <ArrowRight size={18} />
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-4 flex flex-wrap gap-3 justify-center md:justify-start text-sm text-muted-foreground"
          >
            <span>✅ Fast Approval</span>
            <span>✅ Trusted Service</span>
            <span>✅ Expert Guidance</span>
          </motion.div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center"
        >
          <img src={heroBanner} alt="Mahajan Finance - Complete Financial Solutions" className="w-full max-w-md rounded-xl" />
        </motion.div>
      </div>
    </div>
  </section>
);

export default HeroSection;
