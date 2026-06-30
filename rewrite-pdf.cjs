const fs = require('fs');
const fp = require('path').join(__dirname, 'src/lib/generateBankPdf.ts');
const code = `import jsPDF from "jspdf";
import logoSrc from "@/assets/logo.png";

export interface ReportData {
  monthsData: { month: string; balances: Record<string, number> }[];
  abb: number; eligibleLoan: number; monthlyEMI: number;
  multiplier: number; tenure: number;
  bank?: string; holder?: string; period: number; sampleDays: number[];
}

function fmt(n: number): string { return "Rs." + Math.round(n).toLocaleString("en-IN"); }
function ord(n: number): string {
  if (n > 3 && n < 21) return n + "th";
  return n + (["th","st","nd","rd"][n % 10] || "th");
}

export async function generateBankReport(data: ReportData): Promise<void> {
  const doc = new jsPDF();
  const PH = 297, MG = 15, W = 210 - 2 * MG, HH = 28, FH = 12;
  let y = HH + 8;
  let logoUrl = "", wmUrl = "";
  try {
    const img = new Image(); img.crossOrigin = "anonymous";
    await new Promise<void>((r, e) => { img.onload = () => r(); img.onerror = e; img.src = logoSrc; });
    const c1 = document.createElement("canvas"); c1.width = img.naturalWidth; c1.height = img.naturalHeight;
    c1.getContext("2d")!.drawImage(img, 0, 0); logoUrl = c1.toDataURL("image/png");
    const c2 = document.createElement("canvas"); c2.width = img.naturalWidth; c2.height = img.naturalHeight;
    const cx = c2.getContext("2d")!; cx.globalAlpha = 0.06; cx.drawImage(img, 0, 0);
    wmUrl = c2.toDataURL("image/png");
  } catch (e) { console.warn("Logo failed:", e); }

  const np = () => { doc.addPage(); y = HH + 8; };
  const chk = (n: number) => { if (y + n > PH - FH - 8) np(); };

  // CLIENT INFO BOX
  doc.setFillColor(232, 240, 254); doc.roundedRect(MG, y, W, 34, 3, 3, "F");
  doc.setFillColor(30, 58, 95); doc.rect(MG, y, 3, 34, "F");
  doc.setFontSize(9); doc.setTextColor(80, 80, 80); const ix = MG + 10;
  doc.setFont("helvetica", "normal"); doc.text("Bank:", ix, y + 7);
  doc.setFont("helvetica", "bold"); doc.text(data.bank || "N/A", ix + 14, y + 7);
  doc.setFont("helvetica", "normal"); doc.text("Account Holder:", ix, y + 13);
  doc.setFont("helvetica", "bold"); doc.text(data.holder || "N/A", ix + 32, y + 13);
  const ps = data.period === 1 ? "1 Month" : data.period === 6 ? "6 Months" : "1 Year";
  doc.setFont("helvetica", "normal"); doc.text("Analysis Period:", ix, y + 20);
  doc.setFont("helvetica", "bold"); doc.text(ps, ix + 32, y + 20);
  doc.setFont("helvetica", "normal"); doc.text("Report Date:", ix, y + 27);
  doc.setFont("helvetica", "bold"); doc.text(new Date().toLocaleDateString("en-IN"), ix + 26, y + 27);
  y += 40;

  // OVERVIEW TABLE
  doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(30, 58, 95);
  doc.text("Monthly Closing Balances Overview", MG, y); y += 4;
  doc.setDrawColor(217, 119, 6); doc.setLineWidth(0.8); doc.line(MG, y, MG + 55, y); y += 6;
  const cM = 26, cD = (W - cM - 26) / 6, cA = 26;
  doc.setFillColor(30, 58, 95); doc.rect(MG, y - 3.5, W, 7, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(7.5); doc.setFont("helvetica", "bold");
  let tx = MG + 2; doc.text("Month", tx, y); tx += cM;
  for (const d of data.sampleDays) { doc.text(String(d), tx + cD / 2, y, { align: "center" }); tx += cD; }
  doc.text("Average", tx + cA - 2, y, { align: "right" }); y += 6;
  for (let i = 0; i < data.monthsData.length; i++) {
    chk(7); const m = data.monthsData[i];
    if (i % 2 === 0) { doc.setFillColor(248, 250, 255); doc.rect(MG, y - 3.5, W, 6, "F"); }
    doc.setTextColor(50, 50, 50); doc.setFont("helvetica", "bold");
    tx = MG + 2; doc.text(m.month, tx, y); tx += cM; doc.setFont("helvetica", "normal");
    const vals = data.sampleDays.map(d => m.balances?.[String(d)] || 0);
    for (const v of vals) { doc.text(v ? fmt(v) : "-", tx + cD / 2, y, { align: "center" }); tx += cD; }
    const pv = vals.filter(v => v > 0); const a = pv.length ? pv.reduce((s, b) => s + b, 0) / pv.length : 0;
    doc.setFont("helvetica", "bold"); doc.setTextColor(30, 58, 95);
    doc.text(fmt(a), tx + cA - 2, y, { align: "right" });
    doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.2); doc.line(MG, y + 2.5, MG + W, y + 2.5); y += 6.5;
  }
  y += 8; chk(50);

  // SUMMARY CARDS
  doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(30, 58, 95);
  doc.text("Loan Eligibility Summary", MG, y); y += 4;
  doc.setDrawColor(217, 119, 6); doc.setLineWidth(0.8); doc.line(MG, y, MG + 48, y); y += 8;
  const cW = (W - 12) / 3, cH = 28;
  doc.setFillColor(30, 58, 95); doc.roundedRect(MG, y, cW, cH, 3, 3, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text("AVERAGE BANK BALANCE", MG + cW / 2, y + 10, { align: "center" });
  doc.setFontSize(13); doc.setFont("helvetica", "bold"); doc.text(fmt(data.abb), MG + cW / 2, y + 20, { align: "center" });
  doc.setFillColor(217, 119, 6); doc.roundedRect(MG + cW + 6, y, cW, cH, 3, 3, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(7);
  doc.text("ELIGIBLE LOAN AMOUNT", MG + cW + 6 + cW / 2, y + 10, { align: "center" });
  doc.setFontSize(13); doc.setFont("helvetica", "bold"); doc.text(fmt(data.eligibleLoan), MG + cW + 6 + cW / 2, y + 20, { align: "center" });
  doc.setFillColor(22, 163, 74); doc.roundedRect(MG + 2 * (cW + 6), y, cW, cH, 3, 3, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(7);
  doc.text("MONTHLY EMI @14%", MG + 2 * (cW + 6) + cW / 2, y + 10, { align: "center" });
  doc.setFontSize(13); doc.setFont("helvetica", "bold"); doc.text(fmt(data.monthlyEMI), MG + 2 * (cW + 6) + cW / 2, y + 20, { align: "center" });
  y += cH + 10;

  // PARAMETER TABLE
  chk(45);
  const params: [string, string][] = [
    ["Loan Multiplier", data.multiplier + "x of ABB"], ["Tenure", data.tenure + " months"],
    ["Interest Rate", "14% per annum"], ["ABB Used", fmt(data.abb)],
    ["Eligible Loan Amount", fmt(data.eligibleLoan)], ["Monthly EMI", fmt(data.monthlyEMI)],
    ["Total Repayment", fmt(data.monthlyEMI * data.tenure)],
  ];
  doc.setFontSize(8);
  for (const [label, value] of params) {
    doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100); doc.text(label, MG + 4, y);
    doc.setFont("helvetica", "bold"); doc.setTextColor(30, 30, 30); doc.text(value, MG + W - 4, y, { align: "right" });
    doc.setDrawColor(235, 235, 235); doc.setLineWidth(0.15); doc.line(MG + 2, y + 2, MG + W - 2, y + 2); y += 6;
  }

  // MONTH-WISE DETAIL PAGES (6 months & 1 year only)
  if (data.monthsData.length > 1) {
    np();
    doc.setFontSize(13); doc.setFont("helvetica", "bold"); doc.setTextColor(30, 58, 95);
    doc.text("Month-wise Closing Balance Details", MG, y); y += 4;
    doc.setDrawColor(217, 119, 6); doc.setLineWidth(0.8); doc.line(MG, y, MG + 58, y); y += 8;
    const barCols = [[30,58,95],[59,130,246],[217,119,6],[22,163,74],[147,51,234],[239,68,68]];

    for (let mi = 0; mi < data.monthsData.length; mi++) {
      const m = data.monthsData[mi];
      const vals = data.sampleDays.map(d => m.balances?.[String(d)] || 0);
      const pv = vals.filter(v => v > 0);
      const mAvg = pv.length ? pv.reduce((a, b) => a + b, 0) / pv.length : 0;
      const mx = Math.max(...vals, 1);
      chk(70);

      // Month header bar
      doc.setFillColor(30, 58, 95); doc.roundedRect(MG, y, W, 9, 2, 2, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.setFont("helvetica", "bold");
      doc.text(m.month, MG + 8, y + 6.5);
      doc.setFontSize(8); doc.text("Avg: " + fmt(mAvg), MG + W - 8, y + 6.5, { align: "right" });
      y += 12;

      // Table header (left 52%)
      const tW = W * 0.52;
      doc.setFillColor(240, 242, 248); doc.rect(MG, y, tW, 7, "F");
      doc.setTextColor(60, 60, 60); doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text("Date", MG + 6, y + 5);
      doc.text("Closing Balance", MG + tW - 4, y + 5, { align: "right" });
      // Bar chart header (right side)
      const bX = MG + tW + 6;
      const bMaxW = W - tW - 12;
      doc.text("Balance Trend", bX + bMaxW / 2, y + 5, { align: "center" });
      y += 7;

      const rowY0 = y;
      for (let di = 0; di < data.sampleDays.length; di++) {
        const day = data.sampleDays[di], bal = vals[di];
        // Table row
        if (di % 2 === 0) { doc.setFillColor(248, 250, 255); doc.rect(MG, y, tW, 6, "F"); }
        doc.setTextColor(50, 50, 50); doc.setFontSize(8); doc.setFont("helvetica", "normal");
        doc.text(ord(day), MG + 6, y + 4.2);
        doc.setFont("helvetica", "bold");
        doc.text(bal ? fmt(bal) : "N/A", MG + tW - 4, y + 4.2, { align: "right" });
        doc.setDrawColor(230, 230, 230); doc.setLineWidth(0.1); doc.line(MG, y + 6, MG + tW, y + 6);

        // Bar
        const bW = bal > 0 ? (bal / mx) * bMaxW : 0;
        doc.setFontSize(6); doc.setFont("helvetica", "normal"); doc.setTextColor(120, 120, 120);
        doc.text(String(day), bX, y + 4);
        if (bW > 0) {
          const cl = barCols[di % barCols.length];
          doc.setFillColor(cl[0], cl[1], cl[2]); doc.roundedRect(bX + 10, y + 0.5, bW, 5, 1, 1, "F");
          if (bW > 20) {
            doc.setTextColor(255, 255, 255); doc.setFontSize(5);
            doc.text(Math.round(bal).toLocaleString("en-IN"), bX + 10 + bW / 2, y + 3.5, { align: "center" });
          }
        }
        y += 6;
      }

      // Average row
      doc.setFillColor(232, 240, 254); doc.roundedRect(MG, y, tW, 7, 1, 1, "F");
      doc.setTextColor(30, 58, 95); doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text("Monthly Average", MG + 6, y + 5);
      doc.text(fmt(mAvg), MG + tW - 4, y + 5, { align: "right" });
      y += 14;
    }
  }

  // HEADERS / FOOTERS / WATERMARKS
  const tp = doc.getNumberOfPages();
  for (let i = 1; i <= tp; i++) {
    doc.setPage(i);
    doc.setFillColor(30, 58, 95); doc.rect(0, 0, 210, HH, "F");
    doc.setFillColor(217, 119, 6); doc.rect(0, HH, 210, 1.5, "F");
    if (logoUrl) doc.addImage(logoUrl, "PNG", MG, 4, 18, 18);
    doc.setTextColor(255, 255, 255); doc.setFontSize(14); doc.setFont("helvetica", "bold");
    doc.text("Mahajan Finance", MG + 22, 12);
    doc.setFontSize(7.5); doc.setFont("helvetica", "normal");
    doc.text("Banking Surrogate Analysis Report", MG + 22, 17);
    doc.setFontSize(6.5); doc.text("Sandeep Mahajan  |  9730540215  |  PanIndia Service", MG + 22, 22);
    doc.setFontSize(7); doc.text("Page " + i + " of " + tp, 198, 12, { align: "right" });
    doc.setFillColor(30, 58, 95); doc.rect(0, PH - FH, 210, FH, "F");
    doc.setFillColor(217, 119, 6); doc.rect(0, PH - FH, 210, 1, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(6);
    doc.text("Mahajan Finance  |  Contact: 9730540215  |  PanIndia Service", 105, PH - 6, { align: "center" });
    doc.text("Indicative calculation only. Final approval depends on bank policy, CIBIL score & verification.", 105, PH - 2.5, { align: "center" });
    if (wmUrl) doc.addImage(wmUrl, "PNG", 60, 85, 90, 90);
  }

  const fn = data.period === 1 ? "Banking-Surrogate-Report" : data.period === 6 ? "Banking-Surrogate-6Months-Report" : "Banking-Surrogate-1Year-Report";
  doc.save(fn + "-MahajanFinance.pdf");
}
`;
fs.writeFileSync(fp, code, 'utf8');
console.log('DONE - generateBankPdf.ts rewritten with month-wise detail pages');
