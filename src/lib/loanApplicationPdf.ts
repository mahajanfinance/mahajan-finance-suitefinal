import jsPDF from "jspdf";

export interface LoanApplicationData {
  applicantName: string;
  fatherName: string;
  motherName: string;
  dob: string;
  mobile: string;
  email: string;
  pancard: string;
  aadhaar: string;
  maritalStatus: string;
  spouseName: string;
  spouseDob: string;
  dependents: string;
  city: string;
  loanType: string;
  loanAmount: string;
  purpose: string;
  netMonthlyIncome: string;
  grossMonthlyIncome: string;
  existingEMI: string;
  preferredBank: string;
  companyName: string;
  designation: string;
  companyAddress: string;
  officeEmail: string;
  qualification: string;
  currentCompanyExp: string;
  totalExperience: string;
  currentAddress: string;
  permanentAddress: string;
  stayingSince: string;
  houseStatus: string;
  bankName: string;
  accountNo: string;
  accountType: string;
  ifscCode: string;
  branch: string;
  activeCreditCards: string;
  activeLoans: string;
  reference1Name: string;
  reference1Relationship: string;
  reference1Mobile: string;
  reference1Address: string;
  reference2Name: string;
  reference2Relationship: string;
  reference2Mobile: string;
  reference2Address: string;
  paymentId: string;
  processingFee: string;
  referenceId: string;
}

export const generateRefId = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "MF-";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const addHeader = (doc: jsPDF) => {
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("MAHAJAN FINANCE", 105, 20, { align: "center" });
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text("Your Trusted Financial Partner | Pan India Service", 105, 26, { align: "center" });
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text("LOAN APPLICATION FORM", 105, 35, { align: "center" });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text("Ph: 9730540215 | Email: info@mahajanfinance.com | Web: www.mahajanfinance.com", 105, 41, { align: "center" });
  
  doc.setDrawColor(200);
  doc.line(15, 44, 195, 44);
  doc.setTextColor(0);
};

const addFooter = (doc: jsPDF, pageNum: number) => {
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("Mahajan Finance - Pan India Service", 105, 285, { align: "center" });
  doc.text(`Page ${pageNum} of 2`, 195, 285, { align: "right" });
  doc.text("This document is computer-generated and does not require a signature. For queries contact 9730540215.", 105, 290, { align: "center" });
  doc.setTextColor(0);
};

const addSectionHeader = (doc: jsPDF, text: string, y: number): number => {
  if (y > 265) return y; // Prevent writing over footer
  doc.setFillColor(240, 240, 240);
  doc.rect(15, y - 5, 180, 8, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(text, 17, y);
  return y + 8;
};

const drawKeyValue = (doc: jsPDF, x: number, y: number, label: string, value: string, labelWidth: number = 40): number => {
  if (y > 265) return y;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`${label}:`, x, y);
  doc.setFont("helvetica", "normal");
  
  // Simple text wrapping for value
  const lines = doc.splitTextToSize(value || "N/A", 180 - labelWidth - (x - 15));
  doc.text(lines, x + labelWidth, y);
  return y + (lines.length * 5);
};


const addWatermarkToAllPages = (doc: jsPDF): void => {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.saveGraphicsState();
    const gs = new (doc as any).GState({ opacity: 0.07 });
    doc.setGState(gs);
    doc.setFontSize(50);
    doc.setFont('helvetica', 'bold');
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    doc.text('MAHAJAN FINANCE', pw / 2, ph / 2, { angle: 45, align: 'center' });
    doc.restoreGraphicsState();
  }
};
export const generateLoanApplicationPdf = (data: LoanApplicationData): jsPDF => {
  const doc = new jsPDF();
  let y = 15;

  // PAGE 1
  addHeader(doc);
  y = 50;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`Applicant:`, 15, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.applicantName, 40, y);
  
  doc.setFont("helvetica", "bold");
  doc.text(`Mobile:`, 85, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.mobile, 102, y);
  
  doc.setFont("helvetica", "bold");
  doc.text(`City:`, 135, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.city, 147, y);
  
  doc.setFont("helvetica", "bold");
  doc.text(`PAN:`, 165, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.pancard, 177, y);
  
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.text(`Ref:`, 15, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.referenceId, 28, y);
  
  y += 8;
  y = addSectionHeader(doc, "Loan Type", y);
  drawKeyValue(doc, 15, y, "Type", data.loanType, 30);
  y += 8;

  y = addSectionHeader(doc, "Personal Details", y);
  drawKeyValue(doc, 15, y, "Applicant Name", data.applicantName);
  drawKeyValue(doc, 105, y, "Father's Name", data.fatherName);
  y += 6;
  drawKeyValue(doc, 15, y, "Date of Birth", data.dob);
  drawKeyValue(doc, 105, y, "Mobile Number", data.mobile);
  y += 6;
  drawKeyValue(doc, 15, y, "Email ID", data.email);
  drawKeyValue(doc, 105, y, "PAN Card No.", data.pancard);
  y += 6;
  drawKeyValue(doc, 15, y, "Aadhaar Card No.", data.aadhaar);
  drawKeyValue(doc, 105, y, "Marital Status", data.maritalStatus);
  y += 8;

  y = addSectionHeader(doc, "Family Details", y);
  drawKeyValue(doc, 15, y, "Wife Name", data.spouseName);
  drawKeyValue(doc, 105, y, "Wife DOB", data.spouseDob);
  y += 6;
  drawKeyValue(doc, 15, y, "Mother Name", data.motherName);
  drawKeyValue(doc, 105, y, "No. of Dependents", data.dependents);
  y += 8;

  y = addSectionHeader(doc, "Loan & Income Details", y);
  drawKeyValue(doc, 15, y, "Loan Amount", `Rs.${data.loanAmount}`);
  drawKeyValue(doc, 105, y, "Purpose", data.purpose);
  y += 6;
  drawKeyValue(doc, 15, y, "Net Monthly Income", `Rs.${data.netMonthlyIncome}`);
  drawKeyValue(doc, 105, y, "Gross Monthly Income", `Rs.${data.grossMonthlyIncome}`);
  y += 6;
  drawKeyValue(doc, 15, y, "Existing EMI", `Rs.${data.existingEMI}`);
  drawKeyValue(doc, 105, y, "Preferred Bank", data.preferredBank);
  y += 8;

  y = addSectionHeader(doc, "Employment Details", y);
  drawKeyValue(doc, 15, y, "Company Name", data.companyName);
  drawKeyValue(doc, 105, y, "Designation", data.designation);
  y += 6;
  drawKeyValue(doc, 15, y, "Company Address", data.companyAddress);
  drawKeyValue(doc, 105, y, "Office Email", data.officeEmail);
  y += 6;
  drawKeyValue(doc, 15, y, "Qualification", data.qualification);
  drawKeyValue(doc, 105, y, "Current Company Exp.", data.currentCompanyExp);
  y += 6;
  drawKeyValue(doc, 15, y, "Total Experience", data.totalExperience);
  y += 8;

  y = addSectionHeader(doc, "Address Details", y);
  drawKeyValue(doc, 15, y, "Current Address", data.currentAddress);
  drawKeyValue(doc, 105, y, "Permanent Address", data.permanentAddress);
  y += 6;
  drawKeyValue(doc, 15, y, "Staying Since", data.stayingSince);
  drawKeyValue(doc, 105, y, "House Status", data.houseStatus);
  y += 8;

  y = addSectionHeader(doc, "Banking Details", y);
  drawKeyValue(doc, 15, y, "Bank Name", data.bankName);
  drawKeyValue(doc, 105, y, "Account No.", data.accountNo);
  y += 6;
  drawKeyValue(doc, 15, y, "Account Type", data.accountType);
  drawKeyValue(doc, 105, y, "IFSC Code", data.ifscCode);
  y += 6;
  drawKeyValue(doc, 15, y, "Branch", data.branch);

  addFooter(doc, 1);

  // PAGE 2
  doc.addPage();
  y = 15;
  addHeader(doc);
  y = 50;

  y = addSectionHeader(doc, "Credit History", y);
  drawKeyValue(doc, 15, y, "Active Credit Cards", data.activeCreditCards);
  drawKeyValue(doc, 105, y, "Active Loans", data.activeLoans);
  y += 8;

  y = addSectionHeader(doc, "Reference 1", y);
  drawKeyValue(doc, 15, y, "Name", data.reference1Name);
  drawKeyValue(doc, 105, y, "Relationship", data.reference1Relationship);
  y += 6;
  drawKeyValue(doc, 15, y, "Mobile", data.reference1Mobile);
  drawKeyValue(doc, 105, y, "Address", data.reference1Address);
  y += 8;

  y = addSectionHeader(doc, "Reference 2", y);
  drawKeyValue(doc, 15, y, "Name", data.reference2Name);
  drawKeyValue(doc, 105, y, "Relationship", data.reference2Relationship);
  y += 6;
  drawKeyValue(doc, 15, y, "Mobile", data.reference2Mobile);
  drawKeyValue(doc, 105, y, "Address", data.reference2Address);
  y += 8;

  y = addSectionHeader(doc, "Payment Details", y);
  drawKeyValue(doc, 15, y, "Payment ID", data.paymentId);
  drawKeyValue(doc, 105, y, "Processing Fee", data.processingFee);
  y += 6;
  drawKeyValue(doc, 15, y, "Reference ID", data.referenceId);
  y += 8;

  y = addSectionHeader(doc, "Declaration", y);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  const declarationText = "I hereby declare that all the information provided above is true and correct to the best of my knowledge and belief. I authorize Mahajan Finance and its partner banks/NBFCs to verify the details provided, conduct credit checks, and share information with credit bureaus and other financial institutions for loan processing purposes. I understand that any discrepancy found in the information may lead to rejection of my loan application.";
  const splitDecl = doc.splitTextToSize(declarationText, 180);
  doc.text(splitDecl, 15, y);
  y += splitDecl.length * 4 + 15;

  // Signatures
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Applicant Signature", 15, y);
  doc.text("Authorized Signatory (Mahajan Finance)", 120, y);
  
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Date: _______________`, 15, y);
  doc.text(`Date: _______________`, 120, y);

  addFooter(doc, 2);

  addWatermarkToAllPages(doc);
  return doc;
};



export const generateLoanApplicationPdfBase64 = (data: LoanApplicationData): string => {
  const doc = generateLoanApplicationPdf(data);
  return doc.output("datauristring").split(",")[1];
};
