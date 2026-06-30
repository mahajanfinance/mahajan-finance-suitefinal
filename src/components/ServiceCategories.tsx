const categories = [
  { key: "loans", emoji: "🏦", label: "Loans" },
  { key: "insurance", emoji: "🛡️", label: "Insurance" },
  { key: "investments", emoji: "📈", label: "Investments" },
  { key: "accounting", emoji: "📊", label: "Accounting" },
  { key: "csc", emoji: "🧾", label: "CSC Services" },
  { key: "govt", emoji: "🏛️", label: "Govt Schemes" },
];

interface Props {
  activeCategory: string;
  onCategoryChange: (key: string) => void;
}

const ServiceCategories = ({ activeCategory, onCategoryChange }: Props) => (
  <section className="py-6 bg-background">
    <div className="container">
      <div className="flex flex-wrap justify-center gap-2">
        <button
          onClick={() => onCategoryChange("all")}
          className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all hover:scale-105 ${
            activeCategory === "all"
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-card border border-border text-foreground hover:border-primary hover:bg-primary/5"
          }`}
        >
          All Services
        </button>
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => onCategoryChange(cat.key)}
            className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all hover:scale-105 ${
              activeCategory === cat.key
                ? "bg-accent text-accent-foreground shadow-md"
                : "bg-card border border-border text-foreground hover:border-golden hover:bg-golden/5"
            }`}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>
    </div>
  </section>
);

export default ServiceCategories;
