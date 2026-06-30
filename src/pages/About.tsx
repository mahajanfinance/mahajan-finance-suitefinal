import { Building2, Users, Target, ShieldCheck, Award, Globe, HeartHandshake } from "lucide-react";
import { motion } from "framer-motion";

const highlights = [
  { icon: Users, value: "21,000+", label: "Happy Customers" },
  { icon: Award, value: "15+", label: "Years Experience" },
  { icon: Globe, value: "50+", label: "Bank & NBFC Partners" },
  { icon: ShieldCheck, value: "100%", label: "Transparent Process" },
];

const About = () => (
  <>
    <section className="bg-primary py-12">
      <div className="container text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold text-primary-foreground font-display tracking-tight">
          About Mahajan Finance
        </h1>
        <p className="mt-3 text-primary-foreground/70">Your Trusted Financial Partner</p>
      </div>
    </section>

    <section className="py-16 bg-background">
      <div className="container max-w-5xl">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
            <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
              <Building2 size={40} className="text-primary" />
            </div>
            <h2 className="section-heading mb-4 hover:text-golden transition-colors">Mahajan Finance</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Founded and managed by <strong className="text-foreground">Sandeep Mahajan</strong>, Mahajan Finance is a comprehensive financial services firm headquartered in Ashta, Maharashtra. We provide complete financial solutions including personal & business loans, insurance, tax filing, government scheme assistance, and digital services.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              With over <strong className="text-foreground">15 years of experience</strong> and <strong className="text-foreground">21,000+ satisfied customers</strong>, we have built trusted partnerships with 50+ banks and NBFCs across India. Our mission is to make financial services accessible, transparent, and hassle-free for every Indian.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Whether you are a salaried professional looking for a personal loan, a businessman seeking expansion capital, or a farmer needing government subsidy assistance — Mahajan Finance is your one-stop solution. एकाच छताखाली सर्व आर्थिक सेवा!
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.1 }} className="space-y-5">
            {[
              { icon: HeartHandshake, title: "Our Mission", desc: "To make quality financial services accessible to every individual and small business owner across India, with zero hidden charges." },
              { icon: Target, title: "One-Stop Solution", desc: "Loans, Insurance, Tax Filing, Government Schemes, PAN Card, FSSAI, Udyam — all under one roof with personalized guidance." },
              { icon: Users, title: "Customer First", desc: "21,000+ customers trust us because we prioritize transparent advice, quick processing, and best rates from our partner banks." },
              { icon: ShieldCheck, title: "Trusted Network", desc: "Partnered with 50+ banks and NBFCs including SBI, HDFC, ICICI, Axis, Bajaj, Tata Capital, and more for the best loan options." },
            ].map(item => (
              <div key={item.title} className="flex gap-4 items-start p-4 rounded-xl border border-border bg-card hover:shadow-md hover:border-golden transition-all group">
                <div className="w-11 h-11 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-golden/20 transition-colors">
                  <item.icon size={22} className="text-accent group-hover:text-golden transition-colors" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground group-hover:text-golden transition-colors">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
          {highlights.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="text-center p-6 rounded-xl border-2 border-golden/30 bg-card hover:shadow-lg hover:border-golden transition-all">
              <s.icon size={28} className="mx-auto mb-2 text-golden" />
              <span className="text-2xl font-extrabold font-display text-foreground tabular-nums block">{s.value}</span>
              <span className="text-sm text-muted-foreground">{s.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  </>
);

export default About;
