const fs = require("fs");
const path = require("path");

const pdfCode = [
'import jsPDF from "jspdf";',
'import logoSrc from "@/assets/logo.png";',
'',
'export interface ReportData {',
'  monthsData: { month: string; balances: Record<string, number> }[];',
'  abb: number; eligibleLoan: number; monthlyEMI: number;',
'  multiplier: number; tenure: number;',
'  bank?: string; holder?: string; period: number; sampleDays: number[];',
'}',
'',
'function fmt(n: number): string { return "Rs." + Math.round(n).toLocaleString("en-IN"); }',
'',
'export async function generateBankReport(data: ReportData): Promise<void> {',
'  const doc = new jsPDF();',
'  const PH = 297, MG = 12, W = 210 - 2 * MG, HH = 28, FH = 12;',
'  let y = HH + 6;',
'',
'  // Load logo',
'  let logoUrl = "", wmUrl = "";',
'  try {',
'    const img = new Image(); img.crossOrigin = "anonymous";',
'    await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; img.src = logoSrc; });',
'    const c1 = document.createElement("canvas"); c1.width = img.naturalWidth; c1.height = img.naturalHeight;',
'    c1.getContext("2d")!.drawImage(img, 0, 0); logoUrl = c1.toDataURL("image/png");',
'    const c2 = document.createElement("canvas"); c2.width = img.naturalWidth; c2.height = img.naturalHeight;',
'    const cx = c2.getContext("2d")!; cx.globalAlpha = 0.06; cx.drawImage(img, 0, 0); wmUrl = c2.toDataURL("image/png");',
'  } catch (e) { console.warn("Logo load failed:", e); }',
'',
'  const newPage = () => { doc.addPage(); y = HH + 6; };',
'  const chk = (n: number) => { if (y + n > PH - FH - 5) newPage(); };',
'',
'  // Client Info Box',
'  doc.setFillColor(232, 240, 254); doc.roundedRect(MG, y, W, 32, 3, 3, "F");',
'  doc.setFillColor(30, 58, 95); doc.rect(MG, y, 3, 32, "F");',
'  doc.setFontSize(9); doc.setTextColor(80, 80, 80);',
'  let ix = MG + 8;',
'  doc.setFont("helvetica", "normal"); doc.text("Bank:", ix, y + 7);',
'  doc.setFont("helvetica", "bold"); doc.text(data.bank || "N/A", ix + 14, y + 7);',
'  doc.setFont("helvetica", "normal"); doc.text("Account Holder:", ix, y + 13);',
'  doc.setFont("helvetica", "bold"); doc.text(data.holder || "N/A", ix + 30, y + 13);',
'  doc.setFont("helvetica", "normal");',
'  const ps = data.period === 1 ? "1 Month" : data.period === 6 ? "6 Months" : "1 Year";',
'  doc.text("Analysis Period:", ix, y + 19); doc.setFont("helvetica", "bold"); doc.text(ps, ix + 30, y + 19);',
'  doc.setFont("helvetica", "normal"); doc.text("Report Date:", ix, y + 25);',
'  doc.setFont("helvetica", "bold"); doc.text(new Date().toLocaleDateString("en-IN"), ix + 24, y + 25);',
'  y += 38;',
'',
'  // Table Title',
'  doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(30, 58, 95);',
'  doc.text("Monthly Closing Balances", MG, y); y += 4;',
'  doc.setDrawColor(217, 119, 6); doc.setLineWidth(0.8); doc.line(MG, y, MG + 42, y); y += 6;',
'',
'  // Table Header',
'  const cM = 24, cD = (W - cM - 22) / 6, cA = 22;',
'  doc.setFillColor(30, 58, 95); doc.rect(MG, y - 3.5, W, 7, "F");',
'  doc.setTextColor(255, 255, 255); doc.setFontSize(7.5); doc.setFont("helvetica", "bold");',
'  let tx = MG + 2; doc.text("Month", tx, y); tx += cM;',
'  for (const d of data.sampleDays) { doc.text("Day " + d, tx + cD / 2, y, { align: "center" }); tx += cD; }',
'  doc.text("Average", tx + cA - 2, y, { align: "right" }); y += 6;',
'',
'  // Table Rows',
'  doc.setFontSize(7.5);',
'  for (let i = 0; i < data.monthsData.length; i++) {',
'    chk(7); const m = data.monthsData[i];',
'    if (i % 2 === 0) { doc.setFillColor(248, 250, 255); doc.rect(MG, y - 3.5, W, 6, "F"); }',
'    doc.setTextColor(50, 50, 50); doc.setFont("helvetica", "bold");',
'    tx = MG + 2; doc.text(m.month, tx, y); tx += cM; doc.setFont("helvetica", "normal");',
'    const vals = data.sampleDays.map(d => m.balances?.[String(d)] || 0);',
'    for (const v of vals) { doc.text(v ? fmt(v) : "-", tx + cD / 2, y, { align: "center" }); tx += cD; }',
'    const avg = vals.filter(v => v > 0); const a = avg.length ? avg.reduce((x, b) => x + b, 0) / avg.length : 0;',
'    doc.setFont("helvetica", "bold"); doc.setTextColor(30, 58, 95);',
'    doc.text(fmt(a), tx + cA - 2, y, { align: "right" });',
'    doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.2); doc.line(MG, y + 2, MG + W, y + 2);',
'    y += 6.5;',
'  }',
'  y += 8; chk(50);',
'',
'  // Summary Title',
'  doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(30, 58, 95);',
'  doc.text("Loan Eligibility Summary", MG, y); y += 4;',
'  doc.setDrawColor(217, 119, 6); doc.setLineWidth(0.8); doc.line(MG, y, MG + 48, y); y += 8;',
'',
'  // Summary Cards',
'  const cW = (W - 12) / 3, cH = 28;',
'  doc.setFillColor(30, 58, 95); doc.roundedRect(MG, y, cW, cH, 3, 3, "F");',
'  doc.setTextColor(255, 255, 255); doc.setFontSize(7); doc.setFont("helvetica", "normal");',
'  doc.text("AVERAGE BANK BALANCE", MG + cW / 2, y + 10, { align: "center" });',
'  doc.setFontSize(13); doc.setFont("helvetica", "bold"); doc.text(fmt(data.abb), MG + cW / 2, y + 20, { align: "center" });',
'',
'  doc.setFillColor(217, 119, 6); doc.roundedRect(MG + cW + 6, y, cW, cH, 3, 3, "F");',
'  doc.setTextColor(255, 255, 255); doc.setFontSize(7); doc.setFont("helvetica", "normal");',
'  doc.text("ELIGIBLE LOAN AMOUNT", MG + cW + 6 + cW / 2, y + 10, { align: "center" });',
'  doc.setFontSize(13); doc.setFont("helvetica", "bold"); doc.text(fmt(data.eligibleLoan), MG + cW + 6 + cW / 2, y + 20, { align: "center" });',
'',
'  doc.setFillColor(22, 163, 74); doc.roundedRect(MG + 2 * (cW + 6), y, cW, cH, 3, 3, "F");',
'  doc.setTextColor(255, 255, 255); doc.setFontSize(7); doc.setFont("helvetica", "normal");',
'  doc.text("MONTHLY EMI @14%", MG + 2 * (cW + 6) + cW / 2, y + 10, { align: "center" });',
'  doc.setFontSize(13); doc.setFont("helvetica", "bold"); doc.text(fmt(data.monthlyEMI), MG + 2 * (cW + 6) + cW / 2, y + 20, { align: "center" });',
'  y += cH + 10;',
'',
'  // Parameter Table',
'  chk(42);',
'  const params: [string, string][] = [',
'    ["Loan Multiplier", data.multiplier + "x of ABB"],',
'    ["Tenure", data.tenure + " months"],',
'    ["Interest Rate", "14% per annum"],',
'    ["ABB Used", fmt(data.abb)],',
'    ["Eligible Loan Amount", fmt(data.eligibleLoan)],',
'    ["Monthly EMI", fmt(data.monthlyEMI)],',
'    ["Total Repayment", fmt(data.monthlyEMI * data.tenure)],',
'  ];',
'  doc.setFontSize(8);',
'  for (const [label, value] of params) {',
'    doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100); doc.text(label, MG + 4, y);',
'    doc.setFont("helvetica", "bold"); doc.setTextColor(30, 30, 30); doc.text(value, MG + W - 4, y, { align: "right" });',
'    doc.setDrawColor(235, 235, 235); doc.setLineWidth(0.15); doc.line(MG + 2, y + 2, MG + W - 2, y + 2);',
'    y += 6;',
'  }',
'',
'  // ===== HEADERS / FOOTERS / WATERMARKS ON ALL PAGES =====',
'  const tp = doc.getNumberOfPages();',
'  for (let i = 1; i <= tp; i++) {',
'    doc.setPage(i);',
'    // Header',
'    doc.setFillColor(30, 58, 95); doc.rect(0, 0, 210, HH, "F");',
'    doc.setFillColor(217, 119, 6); doc.rect(0, HH, 210, 1.5, "F");',
'    if (logoUrl) doc.addImage(logoUrl, "PNG", MG, 4, 18, 18);',
'    doc.setTextColor(255, 255, 255); doc.setFontSize(14); doc.setFont("helvetica", "bold");',
'    doc.text("Mahajan Finance", MG + 22, 12);',
'    doc.setFontSize(7.5); doc.setFont("helvetica", "normal");',
'    doc.text("Banking Surrogate Analysis Report", MG + 22, 17);',
'    doc.setFontSize(6.5);',
'    doc.text("Sandeep Mahajan  |  9730540215  |  PanIndia Service", MG + 22, 22);',
'    doc.setFontSize(7); doc.text("Page " + i + " of " + tp, 198, 12, { align: "right" });',
'    // Footer',
'    doc.setFillColor(30, 58, 95); doc.rect(0, PH - FH, 210, FH, "F");',
'    doc.setFillColor(217, 119, 6); doc.rect(0, PH - FH, 210, 1, "F");',
'    doc.setTextColor(255, 255, 255); doc.setFontSize(6);',
'    doc.text("Mahajan Finance  |  Contact: 9730540215  |  PanIndia Service", 105, PH - 6, { align: "center" });',
'    doc.text("Indicative calculation only. Final approval depends on bank policy, CIBIL score & verification.", 105, PH - 2.5, { align: "center" });',
'    // Watermark',
'    if (wmUrl) doc.addImage(wmUrl, "PNG", 60, 85, 90, 90);',
'  }',
'  doc.save("Banking-Surrogate-Report-MahajanFinance.pdf");',
'}',
].join("\n");

fs.writeFileSync(path.join(process.cwd(), "src", "lib", "generateBankPdf.ts"), pdfCode, "utf8");
console.log("Created: src/lib/generateBankPdf.ts");

// ===== Update BankingSurrogate.tsx =====
const src = path.join(process.cwd(), "src", "pages", "BankingSurrogate.tsx");
let f = fs.readFileSync(src, "utf8");
const lines = f.split("\n");

// 1. Add import after jspdf import
let jspdfLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('import jsPDF from "jspdf"')) { jspdfLine = i; break; }
}

if (jspdfLine !== -1) {
  // Replace jspdf import with bankPdf import
  lines[jspdfLine] = 'import { generateBankReport } from "@/lib/generateBankPdf";';
  console.log("Replaced jspdf import with generateBankReport import");
}

// 2. Find and replace old generatePdf function
let gpLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("const generatePdf = () =>")) { gpLine = i; break; }
}

if (gpLine !== -1) {
  let depth = 0, foundStart = false, endLine = gpLine;
  for (let i = gpLine; i < lines.length; i++) {
    for (const c of lines[i]) {
      if (c === "{") { depth++; foundStart = true; }
      if (c === "}") { depth--; if (foundStart && depth === 0) { endLine = i; break; } }
    }
    if (endLine !== gpLine) break;
  }
  const newFunc = [
    '  const generatePdf = () => {',
    '    generateBankReport({ monthsData, abb, eligibleLoan, monthlyEMI, multiplier, tenure, bank: parsedMeta?.bank, holder: parsedMeta?.holder, period, sampleDays: SAMPLE_DAYS });',
    '  };'
  ];
  lines.splice(gpLine, endLine - gpLine + 1, ...newFunc);
  console.log("Replaced generatePdf function with utility call");
} else {
  console.log("WARNING: generatePdf function not found");
}

fs.writeFileSync(src, lines.join("\n"), "utf8");
console.log("Updated: BankingSurrogate.tsx");
console.log("DONE!");