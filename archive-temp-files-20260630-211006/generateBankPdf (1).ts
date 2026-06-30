/**
 * Banking Surrogate - Professional PDF Generator
 * 
 * Features:
 * - Multi-page support (auto-expands for 12 months)
 * - Mahajan Finance transparent watermark on every page
 * - Indian currency formatting everywhere
 * - 14 report sections with professional design
 * - Dynamic period detection
 * - Risk Score, Banking Health Grade
 * - EMI Schedule with reducing balance method
 * - Page numbers (Page x of y)
 * - Professional header/footer branding
 */

import jsPDF from "jspdf";
import type { ClientParseResult, RiskAssessment, EMICalculation, AdminSettings } from "./bankingTypes";
import { formatIndianCurrency } from "./bankingTypes";

const BRAND_COLOR = [30, 64, 175] as const; // Blue-800
const ACCENT_COLOR = [22, 163, 74] as const; // Green-600
const DARK_TEXT = [31, 41, 55] as const; // Gray-800
const LIGHT_TEXT = [107, 114, 128] as const; // Gray-500
const TABLE_HEADER_BG = [219, 234, 254] as const; // Blue-100
const TABLE_ALT_BG = [249, 250, 251] as const; // Gray-50

/** Indian currency format for PDF */
function fmtRs(amount: number): string {
  if (amount === 0 || isNaN(amount)) return "Rs. 0";
  return formatIndianCurrency(amount);
}

/** Get ordinal suffix */
function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function downloadBankingPDF(
  result: ClientParseResult,
  period: number,
  customerName: string,
  customerMobile: string,
  customerLocation: string,
  bankName: string,
  riskAssessment?: RiskAssessment,
  emiCalculation?: EMICalculation,
  adminSettings?: AdminSettings,
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentW = pageW - 2 * margin;
  let y = 0;
  let pageNum = 0;

  const settings: AdminSettings = adminSettings || { loanMultiplier: 20, interestRate: 14, defaultTenure: period };
  const risk: RiskAssessment = riskAssessment || { riskScore: 0, healthGrade: "C", lendingRemarks: "Not assessed", suggestedMaxLoan: 0 };
  const emi: EMICalculation = emiCalculation || {
    loanAmount: Math.round(result.overallABB * settings.loanMultiplier),
    interestRate: settings.interestRate,
    tenure: settings.defaultTenure,
    monthlyEMI: 0,
    totalInterest: 0,
    totalRepayment: 0,
  };

  const generatedDate = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const periodLabel = period === 1 ? "1 Month" : `${period} Months`;

  // ─── Helper Functions ───

  function newPage() {
    if (pageNum > 0) doc.addPage();
    pageNum++;
    y = margin;
    addWatermark();
    addHeader();
  }

  function addWatermark() {
    doc.saveGraphicsState();
    doc.setGState(new (doc as any).GState({ opacity: 0.06 }));
    doc.setFontSize(60);
    doc.setTextColor(...BRAND_COLOR);
    doc.setFont("helvetica", "bold");
    const text = "MAHAJAN FINANCE";
    const tw = doc.getTextWidth(text);
    doc.text(text, (pageW - tw) / 2, pageH / 2, { angle: 45 });
    doc.restoreGraphicsState();
  }

  function addHeader() {
    // Top blue bar
    doc.setFillColor(...BRAND_COLOR);
    doc.rect(0, 0, pageW, 22, "F");

    // Brand name
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("MAHAJAN FINANCE", margin, 10);

    // Subtitle
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Banking Surrogate Analysis Report", margin, 16);

    // Date on right
    doc.setFontSize(7);
    doc.text(generatedDate, pageW - margin, 10, { align: "right" });
    doc.text(`Period: ${periodLabel}`, pageW - margin, 16, { align: "right" });

    y = 28;
  }

  function addFooter() {
    doc.setFillColor(...BRAND_COLOR);
    doc.rect(0, pageH - 15, pageW, 15, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(255, 255, 255);
    doc.text("Mahajan Finance | Sandeep Mahajan | +91 9730540215 | Pan India Service", margin, pageH - 7);
    doc.text(`Page ${pageNum}`, pageW - margin, pageH - 7, { align: "right" });

    // Website & email
    doc.setFontSize(6);
    doc.text("www.mahajanfinance.com | info@mahajanfinance.com", pageW / 2, pageH - 3, { align: "center" });
  }

  function checkPage(needed: number) {
    if (y + needed > pageH - 20) {
      addFooter();
      newPage();
    }
  }

  function sectionTitle(title: string) {
    checkPage(15);
    doc.setFillColor(...BRAND_COLOR);
    doc.roundedRect(margin, y, contentW, 8, 1, 1, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(title, margin + 3, y + 5.5);
    y += 11;
  }

  function subTitle(text: string) {
    checkPage(10);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND_COLOR);
    doc.text(text, margin + 2, y + 4);
    y += 7;
  }

  function labelValue(label: string, value: string, labelW: number = 55) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...LIGHT_TEXT);
    doc.text(label, margin + 2, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK_TEXT);
    doc.text(value, margin + labelW, y);
    y += 5;
  }

  function drawTable(headers: string[], rows: string[][], colWidths: number[]) {
    const rowH = 6;
    // Check if table fits, else new page
    const tableH = (rows.length + 1) * rowH;
    if (y + Math.min(tableH, 40) > pageH - 20) {
      addFooter();
      newPage();
    }

    // Header
    doc.setFillColor(...TABLE_HEADER_BG);
    doc.rect(margin, y, contentW, rowH, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND_COLOR);
    let x = margin;
    headers.forEach((h, i) => {
      doc.text(h, x + 1, y + 4, { width: colWidths[i] - 2 });
      x += colWidths[i];
    });
    y += rowH;

    // Rows
    rows.forEach((row, ri) => {
      if (y + rowH > pageH - 20) {
        addFooter();
        newPage();
        // Re-draw header
        doc.setFillColor(...TABLE_HEADER_BG);
        doc.rect(margin, y, contentW, rowH, "F");
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...BRAND_COLOR);
        let hx = margin;
        headers.forEach((h, i) => {
          doc.text(h, hx + 1, y + 4, { width: colWidths[i] - 2 });
          hx += colWidths[i];
        });
        y += rowH;
      }

      if (ri % 2 === 1) {
        doc.setFillColor(...TABLE_ALT_BG);
        doc.rect(margin, y, contentW, rowH, "F");
      }
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...DARK_TEXT);
      x = margin;
      row.forEach((cell, i) => {
        const align = i === 0 ? "left" : "right";
        const xPos = i === 0 ? x + 1 : x + colWidths[i] - 2;
        doc.text(cell, xPos, y + 4, { width: colWidths[i] - 3, align });
        x += colWidths[i];
      });
      y += rowH;
    });
  }

  // ─── PAGE 1: Cover + Customer + Bank Info ───

  newPage();

  // Cover section - larger branding
  doc.setFillColor(...BRAND_COLOR);
  doc.roundedRect(margin, y, contentW, 35, 3, 3, "F");
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("MAHAJAN FINANCE", margin + 10, y + 13);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Banking Surrogate Analysis Report", margin + 10, y + 21);
  doc.setFontSize(8);
  doc.text(`Report Generated: ${generatedDate} | Analysis Period: ${periodLabel}`, margin + 10, y + 28);
  y += 40;

  // Section 1: Customer Information
  sectionTitle("1. Customer Information");
  labelValue("Full Name", customerName || "N/A");
  labelValue("Mobile Number", customerMobile || "N/A");
  labelValue("Location", customerLocation || "N/A");
  labelValue("Report Date", generatedDate);
  y += 3;

  // Section 2: Bank Information
  sectionTitle("2. Bank Information");
  labelValue("Bank Name", bankName || result.bankName || "N/A");
  labelValue("Statement Period", periodLabel);
  labelValue("Months Analysed", String(result.totalMonthsFound));
  labelValue("Detected Period", result.detectedPeriod + (result.detectedPeriod === 1 ? " Month" : " Months"));
  y += 3;

  // Section 3: Statement Analysis Summary
  sectionTitle("3. Statement Analysis Summary");
  labelValue("Overall ABB", fmtRs(result.overallABB));
  labelValue("Opening Balance", fmtRs(result.monthsData[0]?.openingBalance || 0));
  labelValue("Closing Balance", fmtRs(result.monthsData[result.monthsData.length - 1]?.closingBalance || 0));
  labelValue("Total Credits", fmtRs(result.monthsData.reduce((s, m) => s + m.totalCredits, 0)));
  labelValue("Total Debits", fmtRs(result.monthsData.reduce((s, m) => s + m.totalDebits, 0)));
  labelValue("Highest Balance", fmtRs(Math.max(...result.monthsData.map(m => m.highestBalance))));
  labelValue("Lowest Balance", fmtRs(Math.min(...result.monthsData.filter(m => m.lowestBalance > 0).map(m => m.lowestBalance)) || 0));
  labelValue("Avg Monthly Credit", fmtRs(result.monthsData.reduce((s, m) => s + m.totalCredits, 0) / Math.max(result.monthsData.length, 1)));
  labelValue("Avg Monthly Debit", fmtRs(result.monthsData.reduce((s, m) => s + m.totalDebits, 0) / Math.max(result.monthsData.length, 1)));
  labelValue("Cheque Bounces", String(result.monthsData.reduce((s, m) => s + m.chequeBounces, 0)));
  labelValue("EMI Bounces", String(result.monthsData.reduce((s, m) => s + m.emiBounces, 0)));
  y += 3;

  // Section 4: Risk Assessment
  if (risk) {
    sectionTitle("4. Risk Assessment & Banking Health");
    // Risk score gauge
    const scoreColor = risk.riskScore >= 70 ? ACCENT_COLOR : risk.riskScore >= 45 ? [234, 179, 8] as const : [220, 38, 38] as const;
    doc.setFillColor(...scoreColor);
    doc.roundedRect(margin + 2, y, 30, 20, 2, 2, "F");
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(String(risk.riskScore), margin + 17, y + 13, { align: "center" });
    doc.setFontSize(6);
    doc.text("/100", margin + 17, y + 17, { align: "center" });

    // Grade badge
    doc.setFillColor(...BRAND_COLOR);
    doc.roundedRect(margin + 36, y, 20, 20, 2, 2, "F");
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(risk.healthGrade, margin + 46, y + 13, { align: "center" });
    doc.setFontSize(5);
    doc.text("Grade", margin + 46, y + 17, { align: "center" });

    // Remarks
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK_TEXT);
    doc.text(`AI Remark: ${risk.lendingRemarks}`, margin + 60, y + 8);
    doc.text(`Suggested Max Loan: ${fmtRs(risk.suggestedMaxLoan)}`, margin + 60, y + 15);
    y += 25;
  }

  // Section 5: Month-Wise Closing Figures
  sectionTitle("5. Month-Wise Closing Figures");

  const closingHeaders = ["Month", "Day 5", "Day 10", "Day 15", "Day 20", "Day 25", "Day 30", "Monthly Avg"];
  const closingColWidths = [28, 22, 22, 22, 22, 22, 22, contentW - 160];
  const closingRows = result.monthsData.map(m => {
    const dayVals = m.sampleDays.map((targetDay, i) => {
      const db = m.dayBalances.find(d => d.day === targetDay);
      return db && db.balance > 0 ? fmtRs(db.balance) : "-";
    });
    return [m.monthLabel, ...dayVals, fmtRs(m.monthlyABB)];
  });

  // Ensure 7 data columns (fill missing days)
  const normalizedRows = result.monthsData.map(m => {
    const row: string[] = [m.monthLabel];
    for (const td of [5, 10, 15, 20, 25, 30]) {
      const db = m.dayBalances.find(d => d.day === td);
      row.push(db && db.balance > 0 ? fmtRs(db.balance) : "-");
    }
    row.push(fmtRs(m.monthlyABB));
    return row;
  });

  drawTable(closingHeaders, normalizedRows, closingColWidths);

  // Overall ABB row
  checkPage(8);
  doc.setFillColor(219, 234, 254);
  doc.rect(margin, y, contentW, 7, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND_COLOR);
  doc.text("Overall Average Bank Balance (ABB)", margin + 2, y + 5);
  doc.text(fmtRs(result.overallABB), pageW - margin - 2, y + 5, { align: "right" });
  y += 10;

  // Section 6: Monthly Average Table (ABB Calculation Sheet)
  sectionTitle("6. ABB Calculation Sheet");

  subTitle("Formula: Monthly Average = (Day5 + Day10 + Day15 + Day20 + Day25 + Day30) / 6");
  subTitle("Overall ABB = Sum of Monthly Averages / Number of Months");

  const abbHeaders = ["Month", "Day 5", "Day 10", "Day 15", "Day 20", "Day 25", "Day 30", "Sum", "Monthly ABB"];
  const abbColWidths = [24, 20, 20, 20, 20, 20, 20, 24, contentW - 168];
  const abbRows = result.monthsData.map(m => {
    const dayVals = [5, 10, 15, 20, 25, 30].map(td => {
      const db = m.dayBalances.find(d => d.day === td);
      return db ? String(Math.round(db.balance)) : "0";
    });
    const sum = dayVals.reduce((s, v) => s + parseInt(v), 0);
    return [m.monthLabel, ...dayVals, String(sum), fmtRs(m.monthlyABB)];
  });
  drawTable(abbHeaders, abbRows, abbColWidths);

  // Overall ABB result
  checkPage(8);
  doc.setFillColor(...ACCENT_COLOR);
  doc.roundedRect(margin, y, contentW, 8, 1, 1, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(`Overall ABB (${result.totalMonthsFound} Months) = ${fmtRs(result.overallABB)}`, margin + 3, y + 5.5);
  y += 12;

  // ─── NEW PAGE: Loan Eligibility + EMI + Insights ───

  addFooter();
  newPage();

  // Section 7: Loan Eligibility
  sectionTitle("7. Loan Eligibility");
  const eligibleLoan = Math.round(result.overallABB * settings.loanMultiplier);
  labelValue("Average Bank Balance (ABB)", fmtRs(result.overallABB));
  labelValue("Loan Multiplier", `${settings.loanMultiplier}x`);
  labelValue("Eligible Loan Amount", fmtRs(eligibleLoan));
  labelValue("Formula", `ABB x ${settings.loanMultiplier} = ${fmtRs(result.overallABB)} x ${settings.loanMultiplier}`);
  y += 3;

  // Section 8: EMI Schedule
  sectionTitle("8. EMI Schedule");

  labelValue("Loan Amount", fmtRs(emi.loanAmount));
  labelValue("Interest Rate (p.a.)", `${emi.interestRate}%`);
  labelValue("Tenure", `${emi.tenure} months`);
  labelValue("Monthly EMI", fmtRs(emi.monthlyEMI));
  labelValue("Total Interest Payable", fmtRs(emi.totalInterest));
  labelValue("Total Repayment Amount", fmtRs(emi.totalRepayment));
  labelValue("Method", "Reducing Balance EMI");
  y += 3;

  // EMI amortization table (first 12 rows or all if less)
  subTitle("EMI Amortization Schedule");
  const amortHeaders = ["Month", "Opening", "EMI", "Interest", "Principal", "Closing"];
  const amortColWidths = [20, 30, 30, 30, 30, contentW - 140];
  const amortRows: string[][] = [];
  let balance = emi.loanAmount;
  const monthlyRate = emi.interestRate / 12 / 100;
  const displayMonths = Math.min(emi.tenure, 24); // Show up to 24 months
  for (let i = 1; i <= displayMonths; i++) {
    const interest = Math.round(balance * monthlyRate);
    const principal = emi.monthlyEMI - interest;
    const closing = Math.round(balance - principal);
    amortRows.push([
      String(i),
      fmtRs(Math.round(balance)),
      fmtRs(emi.monthlyEMI),
      fmtRs(interest),
      fmtRs(Math.max(principal, 0)),
      fmtRs(Math.max(closing, 0)),
    ]);
    balance = Math.max(closing, 0);
  }
  if (emi.tenure > 24) {
    amortRows.push(["...", `... + ${emi.tenure - 24} more months`, "", "", "", ""]);
  }
  drawTable(amortHeaders, amortRows, amortColWidths);
  y += 5;

  // Section 9: Key Financial Insights
  checkPage(50);
  sectionTitle("9. Key Financial Insights");

  const insights: string[] = [];
  const avgCredit = result.monthsData.reduce((s, m) => s + m.totalCredits, 0) / Math.max(result.monthsData.length, 1);
  const avgDebit = result.monthsData.reduce((s, m) => s + m.totalDebits, 0) / Math.max(result.monthsData.length, 1);
  const totalBounces = result.monthsData.reduce((s, m) => s + m.chequeBounces + m.emiBounces, 0);

  insights.push(`Average Monthly Credit: ${fmtRs(avgCredit)} - ${avgCredit > 30000 ? "Healthy income flow" : "Moderate income flow"}`);
  insights.push(`Average Monthly Debit: ${fmtRs(avgDebit)} - ${avgDebit < avgCredit * 0.9 ? "Spending within limits" : "Spending close to income"}`);
  insights.push(`Overall ABB: ${fmtRs(result.overallABB)} - ${result.overallABB > 25000 ? "Good maintained balance" : "Low maintained balance"}`);

  if (result.monthsData.length >= 2) {
    const firstMonth = result.monthsData[0].monthlyABB;
    const lastMonth = result.monthsData[result.monthsData.length - 1].monthlyABB;
    const trend = lastMonth > firstMonth ? "Upward" : lastMonth < firstMonth ? "Downward" : "Stable";
    insights.push(`Balance Trend: ${trend} - ${trend === "Upward" ? "Positive sign" : trend === "Downward" ? "Needs attention" : "Consistent"}`);
  }

  if (totalBounces > 0) {
    insights.push(`Bounce Count: ${totalBounces} - This may affect loan eligibility negatively`);
  } else {
    insights.push("No cheque/EMI bounces detected - Excellent payment discipline");
  }

  insights.push(`Eligible Loan Amount: ${fmtRs(eligibleLoan)} at ${settings.loanMultiplier}x multiplier`);
  insights.push(`Risk Grade: ${risk.healthGrade} (Score: ${risk.riskScore}/100) - ${risk.lendingRemarks}`);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK_TEXT);
  insights.forEach(insight => {
    checkPage(7);
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(margin + 2, y - 3, contentW - 4, 6, 1, 1, "F");
    doc.text(`• ${insight}`, margin + 5, y);
    y += 7;
  });
  y += 3;

  // Section 10: Cash Flow Summary per Month
  checkPage(40);
  sectionTitle("10. Cash Flow Summary");
  const cashHeaders = ["Month", "Credits", "Debits", "Net Flow", "Opening Bal", "Closing Bal"];
  const cashColWidths = [28, 32, 32, 32, 32, contentW - 156];
  const cashRows = result.monthsData.map(m => [
    m.monthLabel,
    fmtRs(m.totalCredits),
    fmtRs(m.totalDebits),
    fmtRs(m.totalCredits - m.totalDebits),
    fmtRs(m.openingBalance),
    fmtRs(m.closingBalance),
  ]);
  drawTable(cashHeaders, cashRows, cashColWidths);
  y += 5;

  // Section 11: Disclaimer
  checkPage(35);
  sectionTitle("11. Disclaimer");
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...LIGHT_TEXT);
  const disclaimer = [
    "This Banking Surrogate Analysis Report is generated by Mahajan Finance based on the bank statement provided by the customer.",
    "The calculations, including ABB, Loan Eligibility, and EMI, are indicative and for reference purposes only.",
    "Final loan approval depends on the lending institution's policies, CIBIL score, income verification, and other eligibility criteria.",
    "Mahajan Finance does not guarantee loan approval or any specific loan amount based on this report.",
    "All financial data is derived from the uploaded bank statement and has not been independently verified.",
    "This report should not be considered as a substitute for professional financial advice.",
    "For any queries, contact Mahajan Finance at +91 9730540215 or info@mahajanfinance.com.",
  ];
  disclaimer.forEach(line => {
    checkPage(6);
    doc.text(line, margin + 2, y, { maxWidth: contentW - 4 });
    y += 5;
  });

  // Add footer to last page
  addFooter();

  // ─── Generate filename ───
  const safeName = (customerName || "Customer").replace(/[^a-zA-Z0-9]/g, "_");
  const dateStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, "-");
  const filename = `MahajanFinance_Banking_Report_${safeName}_${dateStr}.pdf`;

  doc.save(filename);
}
