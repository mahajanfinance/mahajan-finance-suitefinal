import { MessageCircle } from "lucide-react";

const StickyContactBar = () => (
  <>
    {/* Mobile sticky bottom bar */}
    <div className="sticky-bar">
      <a
        href="https://wa.me/919730540215?text=Hi%2C%20I%20need%20help%20with%20financial%20services"
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-success text-success-foreground font-semibold text-sm transition-all active:scale-95"
      >
        <MessageCircle size={18} /> WhatsApp
      </a>
      <a
        href="tel:9730540215"
        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm transition-all active:scale-95"
      >
        <MessageCircle size={18} /> Call Now
      </a>
    </div>

    {/* Desktop WhatsApp floating button */}
    <a
      href="https://wa.me/919730540215?text=Hi%2C%20I%20need%20help%20with%20financial%20services"
      target="_blank"
      rel="noopener noreferrer"
      className="hidden md:flex fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-success text-success-foreground items-center justify-center shadow-lg hover:scale-110 transition-transform active:scale-95"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle size={26} />
    </a>
  </>
);

export default StickyContactBar;
