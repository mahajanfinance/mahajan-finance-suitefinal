import { motion } from "framer-motion";
import { CheckCircle2, Clock, Shield, Phone, MessageCircle, ArrowRight } from "lucide-react";
import ServicesGrid from "@/components/ServicesGrid";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

const Services = () => {
  const trustBadges = [
    { icon: Shield, label: "Authorized CSC Center", desc: "Government Certified" },
    { icon: Clock, label: "Same Day Service", desc: "Fast and Efficient Processing" },
    { icon: CheckCircle2, label: "Trusted by 5000+", desc: "Satisfied Customers Pan-India" },
  ];

  return (
    <div className="bg-slate-50 min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80 py-16 md:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0,transparent_60%)]"></div>
        <div className="absolute top-0 left-0 w-72 h-72 bg-golden/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-golden/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        <div className="container text-center relative z-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-block px-4 py-1 mb-5 rounded-full bg-golden/20 border border-golden/30 text-golden text-xs font-bold tracking-wider uppercase shadow-sm"
          >
            Official Digital Seva Portal
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold text-primary-foreground font-display tracking-tight drop-shadow-sm"
          >
            🏛️ CSC Services
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 text-lg md:text-xl text-primary-foreground/90 font-semibold max-w-2xl mx-auto"
          >
            Authorized CSC Center · Fast and Trusted Service · Same Day Available
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-2 text-primary-foreground/60 text-sm font-medium"
          >
            PAN India Service — Mahajan Finance (Sandeep Mahajan)
          </motion.p>
        </div>
      </section>
      <section className="py-12 bg-slate-50">
        <div className="container max-w-6xl">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            className="grid sm:grid-cols-3 gap-6"
          >
            {trustBadges.map((it) => (
              <motion.div 
                key={it.label} 
                variants={itemVariants}
                className="bg-white border border-slate-100 rounded-2xl p-6 text-center shadow-sm hover:shadow-xl hover:border-golden/40 transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-golden/10 flex items-center justify-center group-hover:bg-golden/20 transition-colors">
                  <it.icon className="text-golden" size={32} strokeWidth={2} />
                </div>
                <p className="text-lg font-bold text-foreground">{it.label}</p>
                <p className="text-sm text-muted-foreground mt-1">{it.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      <section className="pb-12 bg-slate-50">
        <div className="container max-w-6xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-extrabold font-display text-foreground tracking-tight">
              Explore Our Services
            </h2>
            <p className="mt-2 text-muted-foreground">Select a category to get instant assistance</p>
            <div className="w-20 h-1 bg-golden mx-auto mt-4 rounded-full"></div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6">
            <ServicesGrid activeCategory="csc" showHeading={false} />
          </div>
        </div>
      </section>
      <section className="py-16 bg-slate-50 relative overflow-hidden">
        <div className="container max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative bg-gradient-to-br from-primary to-primary/90 rounded-3xl p-8 md:p-12 shadow-2xl text-center overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-golden/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-golden/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-extrabold font-display text-primary-foreground mb-4">
                Need help with a service?
              </h2>
              <p className="text-primary-foreground/80 text-base md:text-lg mb-8 max-w-2xl mx-auto">
                Talk to our team for any CSC service — applications, status updates, or document help. We are here to assist you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <a
                  href="tel:+919730540215"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-golden text-primary font-bold hover:bg-golden/90 hover:scale-105 transition-all duration-300 shadow-lg text-sm group"
                >
                  <Phone size={18} className="group-hover:rotate-12 transition-transform" /> 
                  Call: 9730540215
                </a>
                <a
                  href="https://wa.me/919730540215?text=Hello%20Mahajan%20Finance%2C%20I%20need%20a%20CSC%20service"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-primary-foreground font-bold hover:bg-white/20 hover:scale-105 transition-all duration-300 shadow-lg text-sm group"
                >
                  <MessageCircle size={18} className="group-hover:scale-110 transition-transform" /> 
                  WhatsApp Us
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Services;
