import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

const EnquiryForm = () => {
  return (
    <section className="py-16 bg-muted">
      <div className="container">
        <div className="text-center mb-8">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-heading hover:text-golden transition-colors cursor-default"
          >
            Quick Enquiry
          </motion.h2>
        </div>

        <div className="max-w-md mx-auto">
          <div className="bg-card rounded-xl border-2 border-golden/30 p-6 shadow-sm hover:shadow-lg hover:border-golden transition-all text-center space-y-4">
            <h3 className="text-lg font-bold font-display text-foreground">📞 Direct Contact</h3>
            <p className="text-foreground font-semibold">Sandeep Mahajan</p>
            <a href="tel:+919730540215" className="text-primary font-bold text-lg hover:underline block">
              📱 9730540215
            </a>
            <a href="mailto:info@mahajanfinance.com" className="text-muted-foreground text-sm hover:underline block">
              ✉️ info@mahajanfinance.com
            </a>
            <a
              href="https://wa.me/919730540215?text=Hello%20Mahajan%20Finance%2C%20I%20need%20help%20with%20financial%20services."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-success text-success-foreground px-6 py-2.5 rounded-full font-bold text-sm hover:brightness-90 hover:scale-105 transition-all"
            >
              💬 WhatsApp Us
            </a>
            <div className="pt-3 border-t border-border flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck size={14} className="text-success" />
              All payments processed securely via Razorpay
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EnquiryForm;
