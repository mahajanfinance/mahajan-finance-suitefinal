import { ShieldCheck, Users, Landmark, Clock } from "lucide-react";
import { motion } from "framer-motion";

const stats = [
  { icon: ShieldCheck, value: "15+", label: "Years Experience" },
  { icon: Users, value: "21,000+", label: "Happy Customers" },
  { icon: Landmark, value: "50+", label: "Bank Partners" },
  { icon: Clock, value: "Fast & Easy", label: "Loan Process" },
];

const TrustIndicators = () => (
  <section className="py-10 bg-primary">
    <div className="container">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: i * 0.08 }}
            className="flex flex-col items-center text-center text-primary-foreground"
          >
            <s.icon size={28} className="mb-2 opacity-80" />
            <span className="text-2xl md:text-3xl font-extrabold font-display tabular-nums">{s.value}</span>
            <span className="text-sm opacity-70 mt-1">{s.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default TrustIndicators;
