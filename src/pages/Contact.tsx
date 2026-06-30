import { MessageCircle, Mail, MapPin, Clock, Globe } from "lucide-react";
import { motion } from "framer-motion";


const contactItems = [
  { icon: MessageCircle, label: "WhatsApp", value: "+91 9730540215", href: "https://wa.me/919730540215?text=Hello%20Mahajan%20Finance", color: "bg-success/10 text-success", hoverBorder: "hover:border-success", external: true },
  { icon: MessageCircle, label: "Call Us", value: "+91 9730540215", href: "tel:+919730540215", color: "bg-primary/10 text-primary", hoverBorder: "hover:border-primary" },
  { icon: Mail, label: "Email", value: "info@mahajanfinance.com", href: "mailto:info@mahajanfinance.com", color: "bg-accent/10 text-accent", hoverBorder: "hover:border-accent" },
  { icon: Globe, label: "Website", value: "www.mahajanfinance.com", href: "https://www.mahajanfinance.com", color: "bg-primary/10 text-primary", hoverBorder: "hover:border-primary", external: true },
  { icon: Clock, label: "Working Hours", value: "Mon – Sat: 9:00 AM – 7:00 PM", color: "bg-golden/10 text-golden", hoverBorder: "hover:border-golden" },
  { icon: MapPin, label: "Address", value: "Opp. Ashta Nagar Parishad, Ashta, Tal. Walwa, Dist. Sangli", color: "bg-destructive/10 text-destructive", hoverBorder: "hover:border-destructive" },
];

const Contact = () => (
  <>
    <section className="bg-primary py-12">
      <div className="container text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold text-primary-foreground font-display tracking-tight">Contact Us</h1>
        <p className="mt-3 text-primary-foreground/70">Get in touch — we respond within 15 minutes</p>
      </div>
    </section>

    <section className="py-16 bg-background">
      <div className="container max-w-4xl">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {contactItems.map((item, i) => {
            const Wrapper = item.href ? "a" : "div";
            const props = item.href ? { href: item.href, ...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {}) } : {};
            return (
              <motion.div key={item.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                <Wrapper {...(props as any)} className={`flex items-center gap-4 p-5 bg-card rounded-xl border-2 border-border ${item.hoverBorder} hover:shadow-lg transition-all group cursor-pointer`}>
                  <div className={`w-12 h-12 rounded-lg ${item.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                    <item.icon size={22} />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-sm">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.value}</p>
                  </div>
                </Wrapper>
              </motion.div>
            );
          })}
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-10 text-center">
          <div className="inline-block bg-card rounded-xl border-2 border-golden/30 p-6 hover:shadow-lg hover:border-golden transition-all">
            <h3 className="font-bold font-display text-foreground mb-2">💳 Secure Payments</h3>
            <p className="text-sm text-muted-foreground">All payments are processed securely via Razorpay (UPI, Cards, Netbanking, Wallets)</p>
          </div>
        </motion.div>
      </div>
    </section>
  </>
);

export default Contact;
