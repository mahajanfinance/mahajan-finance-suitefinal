import jsPDF from "jspdf";
import logoUrl from "@/assets/logo.png";

export interface EmiRow {
  month: number;
  emi: number;
  principal: number;
  interest: number;
  balance: number;
}

interface EmiPdfOptions {
  customerName?: string;
  loanType: string;
  loanAmount: number;
  tenureMonths: number;
  interestRate: number;
  totalInterest: number;
  schedule: EmiRow[];
}

const inr = (n: number) =>
  "Rs. " + Math.round(n).toLocaleString("en-IN");

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function downloadEmiPdf(opts: EmiPdfOptions) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // Pre-load logo for watermark
  let logoImg: HTMLImageElement | null = null;
  try { logoImg = await loadImage(logoUrl); } catch { /* ignore */ }

  const drawWatermark = () => {
    if (!logoImg) return;
    const w = 320;
    const h = (logoImg.height / logoImg.width) * w;
    const anyDoc = doc as unknown as {
      GState?: new (o: { opacity: number }) => unknown;
      setGState?: (gs: unknown) => void;
    };
    if (anyDoc.GState && anyDoc.setGState) {
      anyDoc.setGState(new anyDoc.GState({ opacity: 0.08 }));
    }
    doc.addImage(logoImg, "PNG", (pageW - w) / 2, (pageH - h) / 2, w, h);
    if (anyDoc.GState && anyDoc.setGState) {
      anyDoc.setGState(new anyDoc.GState({ opacity: 1 }));
    }
  };


  const drawHeader = () => {
    if (logoImg) {
      try { doc.addImage(logoImg, "PNG", 40, 30, 50, 50); } catch { /* ignore */ }
    }
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 64, 175);
    doc.setFontSize(18);
    doc.text("MAHAJAN FINANCE", 100, 50);
    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.setFont("helvetica", "normal");
    doc.text("Sandeep Mahajan  |  Mobile: 9730540215  |  PAN India Service", 100, 65);
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(1);
    doc.line(40, 90, pageW - 40, 90);
  };

  const drawFooter = (pageNum: number, totalPages: number) => {
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.setFont("helvetica", "italic");
    doc.text(
      "Mahajan Finance · Sandeep Mahajan · 9730540215 · PAN India Service",
      pageW / 2,
      pageH - 25,
      { align: "center" }
    );
    doc.text(`Page ${pageNum} of ${totalPages}`, pageW - 40, pageH - 25, { align: "right" });
  };

  drawWatermark();
  drawHeader();

  // Summary
  let y = 110;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(20);
  doc.text("EMI Repayment Schedule", 40, y);
  y += 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(40);
  const summary: [string, string][] = [
    ["Customer", opts.customerName || "—"],
    ["Loan Type", opts.loanType],
    ["Loan Amount", inr(opts.loanAmount)],
    ["Tenure", `${opts.tenureMonths} months`],
    ["Interest Rate", `${opts.interestRate}% p.a.`],
    ["Total Interest", inr(opts.totalInterest)],
    ["Total Payable", inr(opts.loanAmount + opts.totalInterest)],
    ["Generated On", new Date().toLocaleDateString("en-IN")],
  ];
  summary.forEach(([k, v], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 40 + col * 270;
    const yy = y + row * 16;
    doc.setFont("helvetica", "bold");
    doc.text(`${k}:`, x, yy);
    doc.setFont("helvetica", "normal");
    doc.text(v, x + 90, yy);
  });
  y += Math.ceil(summary.length / 2) * 16 + 12;

  // Table header
  const cols = [
    { label: "Month", x: 40, w: 50, align: "left" as const },
    { label: "EMI", x: 90, w: 100, align: "right" as const },
    { label: "Principal", x: 190, w: 110, align: "right" as const },
    { label: "Interest", x: 300, w: 110, align: "right" as const },
    { label: "Balance", x: 410, w: 145, align: "right" as const },
  ];

  const drawTableHeader = () => {
    doc.setFillColor(30, 64, 175);
    doc.rect(40, y, pageW - 80, 22, "F");
    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    cols.forEach((c) => {
      const tx = c.align === "right" ? c.x + c.w - 8 : c.x + 6;
      doc.text(c.label, tx, y + 15, { align: c.align });
    });
    y += 22;
  };
  drawTableHeader();

  doc.setTextColor(30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  opts.schedule.forEach((r, idx) => {
    if (y > pageH - 60) {
      drawFooter(doc.getNumberOfPages(), 0); // temp, will rewrite
      doc.addPage();
      y = 40;
      drawWatermark();
      drawHeader();
      y = 110;
      drawTableHeader();
      doc.setTextColor(30);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
    }
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(40, y, pageW - 80, 18, "F");
    }
    const cells = [
      String(r.month),
      inr(r.emi),
      inr(r.principal),
      inr(r.interest),
      inr(r.balance),
    ];
    cells.forEach((val, i) => {
      const c = cols[i];
      const tx = c.align === "right" ? c.x + c.w - 8 : c.x + 6;
      doc.text(val, tx, y + 12, { align: c.align });
    });
    y += 18;
  });

  // Rewrite footers with correct totals
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    // wipe old footer area
    doc.setFillColor(255, 255, 255);
    doc.rect(0, pageH - 35, pageW, 35, "F");
    drawFooter(p, total);
  }

  const file = `EMI_Schedule_${(opts.customerName || "Customer").replace(/\s+/g, "_")}_${Date.now()}.pdf`;
  doc.save(file);
}
