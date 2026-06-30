import { motion } from "framer-motion";
import { CheckCircle2, Clock, Shield, Phone, MessageCircle } from "lucide-react";
import ServicesGrid from "@/components/ServicesGrid";

const Services = () => {
  return (
    <>
      <section className="bg-primary py-12">
        <div className="container text-center">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-extrabold text-primary-foreground font-display tracking-tight"
          >
            🏛️ CSC Services
          </motion.h1>
          <p className="mt-3 text-primary-foreground/80 font-semibold">
            Authorized CSC Center · Fast & Trusted Service · Same Day Available
          </p>
          <p className="mt-1 text-primary-foreground/60 text-sm">
            PAN India Service — Mahajan Finance (Sandeep Mahajan)
          </p>
        </div>
      </section>

      <section className="py-10 bg-background">
        <div className="container max-w-6xl">
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {[
              { icon: Shield, label: "Authorized CSC Center" },
              { icon: Clock, label: "Same Day Service" },
              { icon: CheckCircle2, label: "Trusted by 5000+ Customers" },
            ].map((it) => (
              <div key={it.label} className="bg-card border-2 border-golden/30 rounded-xl p-5 text-center hover:shadow-lg transition-shadow">
                <it.icon className="mx-auto mb-2 text-golden" size={28} />
                <p className="text-sm font-bold text-foreground">{it.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CSC services grid with inline forms + Razorpay payment */}
      <ServicesGrid activeCategory="csc" showHeading={false} />

      <section className="py-10 bg-background">
        <div className="container max-w-4xl">
          <div className="bg-card rounded-xl border-2 border-golden/30 p-6 md:p-8 shadow-sm text-center">
            <h2 className="text-xl font-extrabold font-display text-foreground mb-3">
              Need help with a service?
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              Talk to our team for any CSC service — applications, status updates, or document help.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="tel:+919730540215"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-bold hover:scale-[1.03] transition-transform text-sm"
              >
                <Phone size={16} /> Call: 9730540215
              </a>
              <a
                href="https://wa.me/919730540215?text=Hello%20Mahajan%20Finance%2C%20I%20need%20a%20CSC%20service"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-success text-success-foreground font-bold hover:scale-[1.03] transition-transform text-sm"
              >
                <MessageCircle size={16} /> WhatsApp Us
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Services;
