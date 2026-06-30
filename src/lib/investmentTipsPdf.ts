import jsPDF from "jspdf";

// =====================================================================
// ⚠️ PASTE YOUR FULL, UNTRUNCATED BASE64 STRING BELOW
// It must start with "data:image/png;base64," and be one continuous line.
// =====================================================================
const MAHAJAN_LOGO_BASE64 = "data:image/png;base64,iVBORw0KGgo...REPLACE_WITH_YOUR_FULL_STRING...";

const TIPS = [
  { t: "Start Early, Stay Consistent", d: "Rs.5,000/month SIP for 20 years at 12% becomes ~Rs.50 Lakh. Time in the market beats timing the market." },
  { t: "Diversify Across Asset Classes", d: "Spread money across equity, debt, gold and FD. Never put everything in one basket." },
  { t: "Build an Emergency Fund First", d: "Keep 6 months of expenses in a liquid fund or savings account before investing in volatile assets." },
  { t: "Use the 50-30-20 Rule", d: "50% needs, 30% wants, 20% savings & investments. Automate your SIP on salary day." },
  { t: "Invest in Tax-Saving Instruments", d: "Use Section 80C: ELSS funds (3-year lock-in, equity returns) are better than PPF for long-term wealth." },
  { t: "Match Goals to Investment Horizon", d: "Short-term goals (<3 yrs) mean debt. Medium (3-7 yrs) mean hybrid. Long-term (7+ yrs) mean equity." },
  { t: "Step-Up Your SIP Yearly", d: "Increase SIP by 10% every year as your income grows. A Rs.5K SIP stepped up 10% becomes Rs.2 Cr in 25 years." },
  { t: "Buy Term + Health Insurance First", d: "Protect your family first. A Rs.1 Cr term plan costs less than Rs.15K/year for a 30-year-old." },
  { t: "Avoid Common Mistakes", d: "Don't chase past returns, don't redeem on market falls, don't mix insurance with investment (avoid ULIPs/endowments)." },
  { t: "Review & Rebalance Annually", d: "Once a year, check your portfolio allocation. Sell winners and buy laggards to maintain balance." },
];

export function generateInvestmentTipsPDF(name = "Valued Customer") {
  try {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const hasValidLogo = MAHAJAN_LOGO_BASE64.startsWith("data:image/png;base64,iVBOR");

    // ====== WATERMARK FUNCTION ======
    const addWatermark = () => {
      if (!hasValidLogo) return;
      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity: 0.06, strokeOpacity: 0.06 }));
      doc.addImage(MAHAJAN_LOGO_BASE64, "PNG", (W - 400) / 2, (H - 150) / 2, 400, 150);
      doc.restoreGraphicsState();
    };

    // ====== HEADER FUNCTION ======
    const addHeader = () => {
      doc.setFillColor(10, 37, 64); // Navy
      doc.rect(0, 0, W, 100, "F");
      doc.setFillColor(251, 191, 36); // Gold line
      doc.rect(0, 100, W, 4, "F");

      if (hasValidLogo) {
        doc.addImage(MAHAJAN_LOGO_BASE64, "PNG", 40, 20, 120, 60);
      }

      doc.setFont("helvetica", "bold");
      doc.setTextColor(251, 191, 36);
      doc.setFontSize(24);
      doc.text("MAHAJAN FINANCE", W - 40, 40, { align: "right" });

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.text("Top 10 Investment Tips for Wealth Creation", W - 40, 62, { align: "right" });

      doc.setFontSize(10);
      doc.setTextColor(191, 219, 254);
      doc.text("Personalised guide for: " + name, W - 40, 84, { align: "right" });
    };

    // ====== FOOTER FUNCTION WITH CLICKABLE LINKS ======
    const addFooter = (pageNum: number, totalPages: number) => {
      doc.setDrawColor(251, 191, 36);
      doc.setLineWidth(1.5);
      doc.line(40, H - 60, W - 40, H - 60);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(10, 37, 64);
      doc.text("Sandeep Mahajan | +91 9730540215 | PAN India Service", W / 2, H - 42, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(30, 64, 175); // Blue color for links
      
      // Clickable Email
      const emailText = "info@mahajanfinance.com";
      const emailWidth = doc.getTextWidth(emailText);
      const webText = "www.mahajanfinance.link";
      const webWidth = doc.getTextWidth(webText);
      const separator = "  |  ";
      const separatorWidth = doc.getTextWidth(separator);
      
      const totalWidth = emailWidth + separatorWidth + webWidth;
      const startX = (W - totalWidth) / 2;

      doc.text(emailText, startX, H - 26);
      doc.link(startX, H - 30, emailWidth, 12, { url: "mailto:info@mahajanfinance.com" });

      doc.setTextColor(100, 116, 139); // Gray for separator
      doc.text(separator, startX + emailWidth, H - 26);

      doc.setTextColor(30, 64, 175); // Blue for web link
      doc.text(webText, startX + emailWidth + separatorWidth, H - 26);
      doc.link(startX + emailWidth + separatorWidth, H - 30, webWidth, 12, { url: "https://www.mahajanfinance.link" });

      // Page Number
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(`Page ${pageNum} of ${totalPages}`, W - 40, H - 10, { align: "right" });
    };

    // ====== PAGE 1 SETUP ======
    addWatermark();
    addHeader();

    let y = 130;

    TIPS.forEach((tip, i) => {
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      const textLines = doc.splitTextToSize(tip.d, W - 120);
      const blockHeight = textLines.length * 15 + 35;

      if (y + blockHeight > H - 75) {
        doc.addPage();
        addWatermark();
        y = 50;
      }

      // Card UI
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(35, y - 15, W - 70, blockHeight, 5, 5, "F");
      doc.setFillColor(251, 191, 36);
      doc.rect(35, y - 15, 4, blockHeight, "F");

      // Number Badge
      doc.setFillColor(10, 37, 64);
      doc.circle(60, y + 4, 11, "F");
      doc.setTextColor(251, 191, 36);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(String(i + 1), 60, y + 8, { align: "center" });

      // Title
      doc.setTextColor(10, 37, 64);
      doc.setFontSize(13);
      doc.text(tip.t, 80, y + 8);

      // Description
      y += 22;
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(textLines, 80, y);

      y += blockHeight - 22 + 12;
    });

    // ====== CTA SECTION ======
    if (y > H - 140) {
      doc.addPage();
      addWatermark();
      y = 50;
    }

    y += 10;
    doc.setFillColor(10, 37, 64);
    doc.roundedRect(35, y, W - 70, 65, 5, 5, "F");
    doc.setTextColor(251, 191, 36);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Need personalised advice?", W / 2, y + 25, { align: "center" });
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Contact us today to start your investment journey!", W / 2, y + 45, { align: "center" });

    // ====== ADD FOOTERS TO ALL PAGES ======
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addFooter(i, totalPages);
    }

    doc.save(`Mahajan-Finance-Top-10-Investment-Tips.pdf`);
    return true; // Return true on success

  } catch (error) {
    console.error("PDF Generation Error:", error);
    return false; // Return false on failure
  }
}