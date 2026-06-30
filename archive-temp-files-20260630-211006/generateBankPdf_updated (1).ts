/**
 * Banking Surrogate - Professional PDF Generator
 *
 * Features:
 * - Multi-page support with auto page breaks
 * - Mahajan Finance transparent watermark on every page (6% opacity, 45 deg)
 * - Indian currency formatting everywhere
 * - 11 report sections with professional design
 * - Dynamic period detection
 * - Risk Score, Banking Health Grade
 * - EMI Schedule with amortization table
 * - Page numbers
 * - Professional header/footer branding
 * - Filename: MahajanFinance_Banking_Report_<Name>_<DD-MM-YYYY>.pdf
 */

import jsPDF from "jspdf";
import type { BankingReportData, AdminSettings, AmortizationRow } from "./bankingTypes";
import { formatIndianCurrency } from "./bankingTypes";

const BRAND_COLOR = [30, 64, 175] as const;
const ACCENT_COLOR = [22, 163, 74] as const;
const DARK_TEXT = [31, 41, 55] as const;
const LIGHT_TEXT = [107, 114, 128] as const;
const TABLE_HEADER_BG = [219, 234, 254] as const;
const TABLE_ALT_BG = [249, 250, 251] as const;

/** Indian currency format for PDF */
function fmtRs(amount: number): string {
  if (amount === 0 || isNaN(amount)) return "Rs. 0";
  return formatIndianCurrency(amount);
}

/**
 * Generate and download the Banking Surrogate PDF report.
 * Called from BankingSurrogate.tsx as: generateBankPdf(reportData, settings)
 */
export function generateBankPdf(
  reportData: BankingReportData,
  settings: AdminSettings
): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentW = pageW - 2 * margin;
  let y = 0;
  let pageNum = 0;

  const { months, filteredMonths, abb, riskAssessment, emiCalculation, eligibleLoan } = reportData;
  const periodLabel = reportData.selectedPeriodMonths === 1 ? "1 Month" : `${reportData.selectedPeriodMonths} Months`;
  const generatedDate = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

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
    doc.setFillColor(...BRAND_COLOR);
    doc.rect(0, 0, pageW, 22, "F");
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("MAHAJAN FINANCE", margin, 10);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Banking Surrogate Analysis Report", margin, 16);
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
    if (y + Math.min((rows.length + 1) * rowH, 40) > pageH - 20) {
      addFooter();
      newPage();
    }

    // Header row
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

    // Data rows
    rows.forEach((row, ri) => {
      if (y + rowH > pageH - 20) {
        addFooter();
        newPage();
        // Re-draw header on new page
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

  // Cover section
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
  labelValue("Full Name", reportData.customerName || "N/A");
  labelValue("Report Date", generatedDate);
  y += 3;

  // Section 2: Bank Information
  sectionTitle("2. Bank Information");
  labelValue("Bank Name", reportData.bankName || "N/A");
  labelValue("Statement Period", periodLabel);
  labelValue("Months Analysed", String(reportData.totalMonthsFound));
  labelValue("ABB Period Selected", `${reportData.selectedPeriodMonths} Months`);
  y += 3;

  // Section 3: Statement Analysis Summary
  sectionTitle("3. Statement Analysis Summary");
  labelValue("Overall ABB", fmtRs(abb));
  labelValue("Opening Balance", fmtRs(months[0]?.openingBalance || 0));
  labelValue("Closing Balance", fmtRs(months[months.length - 1]?.closingBalance || 0));
  labelValue("Total Credits", fmtRs(months.reduce((s, m) => s + m.totalCredits, 0)));
  labelValue("Total Debits", fmtRs(months.reduce((s, m) => s + m.totalDebits, 0)));
  labelValue("Highest Balance", fmtRs(months.length > 0 ? Math.max(...months.map(m => m.maxBalance)) : 0));
  labelValue("Lowest Balance", fmtRs(months.length > 0 ? Math.min(...months.filter(m => m.minBalance > 0).map(m => m.minBalance)) : 0));
  labelValue("Avg Monthly Credit", fmtRs(months.reduce((s, m) => s + m.totalCredits, 0) / Math.max(months.length, 1)));
  labelValue("Avg Monthly Debit", fmtRs(months.reduce((s, m) => s + m.totalDebits, 0) / Math.max(months.length, 1)));
  labelValue("Cheque Bounces", String(riskAssessment.chequeBounces));
  labelValue("EMI Bounces", String(riskAssessment.emiBounces));
  y += 3;

  // Section 4: Risk Assessment
  sectionTitle("4. Risk Assessment & Banking Health");
  const scoreColor = riskAssessment.score >= 70 ? ACCENT_COLOR : riskAssessment.score >= 45 ? [234, 179, 8] as const : [220, 38, 38] as const;
  doc.setFillColor(...scoreColor);
  doc.roundedRect(margin + 2, y, 30, 20, 2, 2, "F");
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(String(riskAssessment.score), margin + 17, y + 13, { align: "center" });
  doc.setFontSize(6);
  doc.text("/100", margin + 17, y + 17, { align: "center" });

  doc.setFillColor(...BRAND_COLOR);
  doc.roundedRect(margin + 36, y, 20, 20, 2, 2, "F");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(riskAssessment.grade, margin + 46, y + 13, { align: "center" });
  doc.setFontSize(5);
  doc.text("Grade", margin + 46, y + 17, { align: "center" });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK_TEXT);
  const trendLabel = riskAssessment.cashFlowTrend.charAt(0).toUpperCase() + riskAssessment.cashFlowTrend.slice(1);
  doc.text(`Cash Flow Trend: ${trendLabel}`, margin + 60, y + 8);
  doc.text(`Suggested Max Loan: ${fmtRs(riskAssessment.suggestedMaxLoan)}`, margin + 60, y + 15);
  y += 25;

  // AI Remarks
  subTitle("AI Lending Remarks");
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK_TEXT);
  riskAssessment.remarks.forEach(r => {
    checkPage(6);
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(margin + 2, y - 3, contentW - 4, 5, 1, 1, "F");
    doc.text(`- ${r}`, margin + 5, y);
    y += 6;
  });
  y += 3;

  // Section 5: Month-Wise Closing Figures
  sectionTitle("5. Month-Wise Closing Balance Table");

  const closingHeaders = ["Month", "Day 5", "Day 10", "Day 15", "Day 20", "Day 25", "Day 30", "Monthly Avg"];
  const closingColWidths = [28, 22, 22, 22, 22, 22, 22, contentW - 160];
  const closingRows = filteredMonths.map(m => [
    m.month,
    fmtRs(m.dayBalanceRow.day5),
    fmtRs(m.dayBalanceRow.day10),
    fmtRs(m.dayBalanceRow.day15),
    fmtRs(m.dayBalanceRow.day20),
    fmtRs(m.dayBalanceRow.day25),
    fmtRs(m.dayBalanceRow.day30),
    fmtRs(m.monthlyAverage),
  ]);
  drawTable(closingHeaders, closingRows, closingColWidths);

  // Overall ABB row
  checkPage(8);
  doc.setFillColor(219, 234, 254);
  doc.rect(margin, y, contentW, 7, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND_COLOR);
  doc.text("Overall Average Bank Balance (ABB)", margin + 2, y + 5);
  doc.text(fmtRs(abb), pageW - margin - 2, y + 5, { align: "right" });
  y += 10;

  // Section 6: ABB Calculation Sheet
  sectionTitle("6. ABB Calculation Sheet");
  subTitle("Formula: Monthly Average = (Day5 + Day10 + Day15 + Day20 + Day25 + Day30) / 6");
  subTitle("Overall ABB = Sum of Monthly Averages / Number of Months");

  const abbHeaders = ["Month", "Day 5", "Day 10", "Day 15", "Day 20", "Day 25", "Day 30", "Sum", "Monthly ABB"];
  const abbColWidths = [24, 20, 20, 20, 20, 20, 20, 24, contentW - 168];
  const abbRows = filteredMonths.map(m => {
    const dayVals = [m.dayBalanceRow.day5, m.dayBalanceRow.day10, m.dayBalanceRow.day15, m.dayBalanceRow.day20, m.dayBalanceRow.day25, m.dayBalanceRow.day30];
    const sum = dayVals.reduce((s, v) => s + Math.round(v), 0);
    return [m.month, ...dayVals.map(v => String(Math.round(v))), String(sum), fmtRs(m.monthlyAverage)];
  });
  drawTable(abbHeaders, abbRows, abbColWidths);

  checkPage(8);
  doc.setFillColor(...ACCENT_COLOR);
  doc.roundedRect(margin, y, contentW, 8, 1, 1, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(`Overall ABB (${reportData.selectedPeriodMonths} Months) = ${fmtRs(abb)}`, margin + 3, y + 5.5);
  y += 12;

  // ─── NEW PAGE ───

  addFooter();
  newPage();

  // Section 7: Loan Eligibility
  sectionTitle("7. Loan Eligibility");
  labelValue("Average Bank Balance (ABB)", fmtRs(abb));
  labelValue("Loan Multiplier", `${settings.loanMultiplier}x`);
  labelValue("Eligible Loan Amount", fmtRs(eligibleLoan));
  labelValue("Formula", `ABB x ${settings.loanMultiplier} = ${fmtRs(abb)} x ${settings.loanMultiplier}`);
  y += 3;

  // Section 8: EMI Schedule
  sectionTitle("8. EMI Schedule");
  labelValue("Loan Amount", fmtRs(emiCalculation.loanAmount));
  labelValue("Interest Rate (p.a.)", `${emiCalculation.interestRate}%`);
  labelValue("Tenure", `${emiCalculation.tenureMonths} months`);
  labelValue("Monthly EMI", fmtRs(emiCalculation.monthlyEMI));
  labelValue("Total Interest Payable", fmtRs(emiCalculation.totalInterest));
  labelValue("Total Repayment Amount", fmtRs(emiCalculation.totalPayment));
  labelValue("Method", "Reducing Balance EMI");
  y += 3;

  // EMI amortization table
  subTitle("EMI Amortization Schedule");
  const amortHeaders = ["Month", "EMI", "Principal", "Interest", "Balance"];
  const amortColWidths = [20, 30, 30, 30, contentW - 110];
  const displayMonths = Math.min(emiCalculation.amortizationSchedule.length, 24);
  const amortRows = emiCalculation.amortizationSchedule.slice(0, displayMonths).map((row: AmortizationRow) => [
    String(row.month),
    fmtRs(row.emi),
    fmtRs(row.principal),
    fmtRs(row.interest),
    fmtRs(row.balance),
  ]);
  if (emiCalculation.tenureMonths > 24) {
    amortRows.push([`...`, `+ ${emiCalculation.tenureMonths - 24} more months`, "", "", ""]);
  }
  drawTable(amortHeaders, amortRows, amortColWidths);
  y += 5;

  // Section 9: Key Financial Insights
  checkPage(50);
  sectionTitle("9. Key Financial Insights");

  const insights: string[] = [];
  const avgCredit = filteredMonths.reduce((s, m) => s + m.totalCredits, 0) / Math.max(filteredMonths.length, 1);
  const avgDebit = filteredMonths.reduce((s, m) => s + m.totalDebits, 0) / Math.max(filteredMonths.length, 1);
  const totalBounces = riskAssessment.chequeBounces + riskAssessment.emiBounces;

  insights.push(`Average Monthly Credit: ${fmtRs(avgCredit)} - ${avgCredit > 30000 ? "Healthy income flow" : "Moderate income flow"}`);
  insights.push(`Average Monthly Debit: ${fmtRs(avgDebit)} - ${avgDebit < avgCredit * 0.9 ? "Spending within limits" : "Spending close to income"}`);
  insights.push(`Overall ABB (${reportData.selectedPeriodMonths} Months): ${fmtRs(abb)} - ${abb > 25000 ? "Good maintained balance" : "Low maintained balance"}`);

  if (filteredMonths.length >= 2) {
    const firstMonth = filteredMonths[0].monthlyAverage;
    const lastMonth = filteredMonths[filteredMonths.length - 1].monthlyAverage;
    const trend = lastMonth > firstMonth ? "Upward" : lastMonth < firstMonth ? "Downward" : "Stable";
    insights.push(`Balance Trend: ${trend} - ${trend === "Upward" ? "Positive sign" : trend === "Downward" ? "Needs attention" : "Consistent"}`);
  }

  if (totalBounces > 0) {
    insights.push(`Bounce Count: ${totalBounces} - This may affect loan eligibility negatively`);
  } else {
    insights.push("No cheque/EMI bounces detected - Excellent payment discipline");
  }

  insights.push(`Eligible Loan Amount: ${fmtRs(eligibleLoan)} at ${settings.loanMultiplier}x multiplier`);
  insights.push(`Risk Grade: ${riskAssessment.grade} (Score: ${riskAssessment.score}/100)`);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK_TEXT);
  insights.forEach(insight => {
    checkPage(7);
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(margin + 2, y - 3, contentW - 4, 6, 1, 1, "F");
    doc.text(`- ${insight}`, margin + 5, y);
    y += 7;
  });
  y += 3;

  // Section 10: Cash Flow Summary
  checkPage(40);
  sectionTitle("10. Cash Flow Summary");
  const cashHeaders = ["Month", "Credits", "Debits", "Net Flow", "Opening Bal", "Closing Bal"];
  const cashColWidths = [28, 32, 32, 32, 32, contentW - 156];
  const cashRows = filteredMonths.map(m => [
    m.month,
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

  addFooter();

  // ─── Generate filename ───
  const safeName = (reportData.customerName || "Customer").replace(/[^a-zA-Z0-9]/g, "_");
  const dateStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, "-");
  const filename = `MahajanFinance_Banking_Report_${safeName}_${dateStr}.pdf`;

  doc.save(filename);
}
