import { motion } from "framer-motion";
import { ExternalLink, ShoppingCart } from "lucide-react";
import { useState } from "react";

// Brand Logo Component with Fallback (Enlarged size)
const BrandLogo = ({ src, alt, fallbackLetter, fallbackBg }: { src: string; alt: string; fallbackLetter: string; fallbackBg: string }) => {
  const [imgError, setImgError] = useState(false);

  // If local image fails to load, show a beautiful styled letter
  if (imgError) {
    return (
      <div className={`h-24 w-24 rounded-xl ${fallbackBg} flex items-center justify-center shadow-inner`}>
        <span className="text-5xl font-extrabold text-white">{fallbackLetter}</span>
      </div>
    );
  }

  return (
    <div className="h-24 w-full flex items-center justify-center p-2">
      <img 
        src={src} 
        alt={alt} 
        className="max-h-full max-w-[200px] object-contain group-hover:scale-110 transition-transform duration-300" 
        onError={() => setImgError(true)} 
      />
    </div>
  );
};

const deals = [
  {
    key: "amazon",
    title: "Amazon – Today's Deals",
    desc: "Best offers on electronics, fashion, home & more",
    link: "https://amzn.to/4bRxBHE",
    logo: "/amazon.png",
    fallbackLetter: "A",
    fallbackBg: "bg-[#FF9900]",
    gradient: "from-orange-500/10 to-yellow-500/10",
    hoverBorder: "hover:border-[#FF9900]",
  },
  {
    key: "flipkart",
    title: "Flipkart – Offer Zone",
    desc: "Top discounts on mobiles, appliances & gadgets",
    link: "https://www.flipkart.com",
    logo: "/flipkart.png",
    fallbackLetter: "F",
    fallbackBg: "bg-[#2874F0]",
    gradient: "from-blue-500/10 to-indigo-500/10",
    hoverBorder: "hover:border-[#2874F0]",
  },
  {
    key: "tally",
    title: "Tally Solutions",
    desc: "India's #1 GST & accounting software for SMEs",
    link: "https://tallysolutions.com/",
    logo: "/tally.png",
    fallbackLetter: "T",
    fallbackBg: "bg-[#E73B3A]",
    gradient: "from-red-500/10 to-rose-500/10",
    hoverBorder: "hover:border-[#E73B3A]",
  },
];

const Shopping = () => (
  <>
    {/* Hero Section */}
    <section className="relative bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 py-16 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[-30%] left-[-10%] w-[500px] h-[500px] bg-golden/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-30%] right-[-10%] w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container text-center relative z-10">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl md:text-5xl font-extrabold text-white font-display tracking-tight drop-shadow-lg"
        >
          <ShoppingCart className="inline mr-3 text-golden" size={40} /> Shop & Save
        </motion.h1>
        <p className="mt-4 text-lg text-blue-200/80 max-w-xl mx-auto">
          Exclusive deals and top platforms curated for you by Mahajan Finance
        </p>
      </div>
    </section>

    {/* Deals Grid Section */}
    <section className="py-14 bg-slate-50">
      <div className="container max-w-6xl">
        
        {/* 3-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {deals.map((d, i) => (
            <motion.a
              key={d.key}
              href={d.link}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className={`flex flex-col items-center text-center bg-white rounded-2xl border-2 border-slate-100 ${d.hoverBorder} p-8 shadow-sm hover:shadow-xl hover:scale-[1.03] transition-all group relative overflow-hidden`}
            >
              {/* Subtle Background Gradient on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${d.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              
              <div className="relative z-10 flex flex-col items-center h-full w-full">
                
                {/* Enlarged Logo Container */}
                <div className="mb-8 h-24 flex items-center justify-center">
                  <BrandLogo 
                    src={d.logo} 
                    alt={d.title} 
                    fallbackLetter={d.fallbackLetter} 
                    fallbackBg={d.fallbackBg} 
                  />
                </div>
                
                {/* Text Content */}
                <h3 className="font-extrabold text-xl text-slate-800 mb-3">{d.title}</h3>
                <p className="text-sm text-slate-500 mb-8 flex-grow">{d.desc}</p>
                
                {/* CTA Button */}
                <div className="mt-auto inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-slate-800 text-white text-sm font-bold group-hover:bg-golden group-hover:text-slate-900 transition-colors shadow-md">
                  Visit Store <ExternalLink size={14} />
                </div>
              </div>
            </motion.a>
          ))}
        </div>

        {/* Disclaimer */}
        <motion.div 
          initial={{ opacity: 0 }} 
          whileInView={{ opacity: 1 }} 
          viewport={{ once: true }}
          className="mt-12 p-5 bg-white rounded-xl border border-golden/20 text-center shadow-sm"
        >
          <p className="text-sm text-slate-600">
            💡 <span className="font-bold text-slate-800">Transparency Disclosure:</span> Shopping through our links helps support Mahajan Finance services at no extra cost to you.
          </p>
        </motion.div>
      </div>
    </section>
  </>
);

export default Shopping;