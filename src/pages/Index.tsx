import { useState } from "react";
import HeroSection from "@/components/HeroSection";
import ServiceCategories from "@/components/ServiceCategories";
import ServicesGrid from "@/components/ServicesGrid";
import EMICalculator from "@/components/EMICalculator";
import TrustIndicators from "@/components/TrustIndicators";
import CSRSection from "@/components/CSRSection";

const Index = () => {
  const [activeCategory, setActiveCategory] = useState("all");

  const isAll = activeCategory === "all";
  return (
    <>
      <HeroSection />
      <ServiceCategories activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
      <ServicesGrid activeCategory={activeCategory} showHeading={isAll} />
      {isAll && <TrustIndicators />}
      {activeCategory === "loans" && <EMICalculator />}
      {isAll && <CSRSection />}
    </>
  );
};

export default Index;

