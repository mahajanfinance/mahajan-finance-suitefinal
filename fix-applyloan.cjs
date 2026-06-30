const fs = require('fs');
const fp = 'src/pages/ApplyLoan.tsx';
let c = fs.readFileSync(fp, 'utf8');
console.log('=== DIAGNOSTIC ===');
console.log('Total lines:', c.split('\n').length);
console.log('Has documentUrls in invoke:', c.includes('documentUrls: documentUrls,'));
console.log('Has storageFolder in invoke:', c.includes('storageFolder: storageFolder,'));
console.log('Has old downloadLinks in invoke:', c.includes('downloadLinks: downloadLinks,'));

const marker = 'const finalizeAfterPayment = async (paymentId: string) => {';
const si = c.indexOf(marker);
if (si === -1) { console.log('ERROR: finalizeAfterPayment not found!'); process.exit(1); }
console.log('finalizeAfterPayment found at char index:', si);

let depth = 0, i = si, end = -1;
while (i < c.length) {
  if (c[i]==="'") { i++; while(i<c.length&&c[i]!=="'"){if(c[i]==='\\')i++;i++;}i++;continue; }
  if (c[i]==='"') { i++; while(i<c.length&&c[i]!=='"'){if(c[i]==='\\')i++;i++;}i++;continue; }
  if (c[i]==='`') {
    i++;
    while(i<c.length&&c[i]!=='`') {
      if(c[i]==='\\'){i+=2;continue;}
      if(c[i]==='$'&&c[i+1]==='{'){i+=2;let ed=1;while(i<c.length&&ed>0){if(c[i]==='{')ed++;if(c[i]==='}')ed--;if(c[i]==="'"||c[i]==='"'){let q=c[i];i++;while(i<c.length&&c[i]!==q){if(c[i]==='\\')i++;i++;}}i++;}continue;}
      i++;
    }
    i++;continue;
  }
  if(c[i]==='/'&&c[i+1]==='/'){while(i<c.length&&c[i]!=='\n')i++;continue;}
  if(c[i]==='/'&&c[i+1]==='*'){i+=2;while(i<c.length&&!(c[i]==='*'&&c[i+1]==='/'))i++;i+=2;continue;}
  if(c[i]==='{')depth++;
  if(c[i]==='}'){depth--;if(depth===0){end=i+1;while(end<c.length&&c[end]===' ')end++;if(c[end]===';')end++;break;}}
  i++;
}
if(end===-1){console.log('ERROR: could not find function end');process.exit(1);}

const fb = c.substring(si, end);
if (fb.includes('documentUrls: documentUrls,') && fb.includes('storageFolder: storageFolder,')) {
  console.log('\nFunction ALREADY has correct code!');
  console.log('If still not working, open browser F12 console and check for errors.');
  console.log('Also try hard refresh: Ctrl+Shift+R in browser.');
  process.exit(0);
}

console.log('\n=== FIXING ===');
console.log('Replacing finalizeAfterPayment function...');

const nf = `const finalizeAfterPayment = async (paymentId: string) => {
    setLoading(true);
    const refId = generateRefId();
    const pdfData = {
      applicantName: form.fullName || "", fatherName: form.fatherName || "",
      motherName: form.motherName || "", dob: form.dob || "",
      mobile: form.mobile || "", email: form.email || "",
      pancard: form.pancard || "", aadhaar: form.aadhaar || "",
      maritalStatus: form.maritalStatus || "", religion: form.religion || "",
      caste: form.caste || "", spouseName: form.spouseName || "",
      spouseDob: form.spouseDob || "", dependents: form.dependents || "",
      city: form.currentAddress || "", loanType: loanLabel,
      loanAmount: form.loanAmount || "", purpose: form.purpose || "",
      netMonthlyIncome: form.netIncome || "", grossMonthlyIncome: form.netIncome || "",
      existingEMI: form.existingEMI || "0",
      preferredBank: selectedBanks?.join(", ") || form.bankName || "",
      companyName: loanType === "business" ? form.businessName || "" : form.companyName || "",
      designation: form.designation || form.bizDesignation || "",
      companyAddress: form.companyAddress || form.businessAddress || "",
      officeEmail: form.officeEmail || "", qualification: form.qualification || "",
      currentCompanyExp: form.currentExp || "", totalExperience: form.totalExp || "",
      currentAddress: form.currentAddress || "", permanentAddress: form.permanentAddress || "",
      stayingSince: form.residingSince || "", houseStatus: form.addressType || "",
      yearsInCity: form.yearsInCity || "", bankName: form.bankName || "",
      accountNo: form.accountNo || "", accountType: form.accountType || "",
      ifscCode: form.ifsc || "", branch: form.branch || "",
      activeCreditCards: form.activeCards || "0", activeLoans: form.activeLoans || "0",
      reference1Name: form.relativeName || "", reference1Relationship: "Relative",
      reference1Mobile: form.relativeMobile || "", reference1Address: form.relativeAddress || "",
      reference2Name: form.friendName || "", reference2Relationship: "Friend",
      reference2Mobile: form.friendMobile || "", reference2Address: form.friendAddress || "",
      paymentId, processingFee: "Rs.499", referenceId: refId,
    };
    const storageFolder = refId + '_' + Date.now();
    const documentUrls = [];
    try {
      const pdfBase64 = generateLoanApplicationPdfBase64(pdfData);
      if (pdfBase64 && pdfBase64.length > 100) {
        const cleanBase64 = pdfBase64.includes(',') ? pdfBase64.split(',')[1] : pdfBase64;
        const pdfBytes = new Uint8Array(atob(cleanBase64).split('').map(c => c.charCodeAt(0)));
        const pdfPath = storageFolder + '/Loan_Application_' + refId + '.pdf';
        const { error: pdfErr } = await supabase.storage.from('loan-documents').upload(pdfPath, pdfBytes, { contentType: 'application/pdf', upsert: true });
        if (!pdfErr) {
          const { data: pdfUrl } = supabase.storage.from('loan-documents').getPublicUrl(pdfPath);
          documentUrls.push({ filename: 'Loan_Application_' + refId + '.pdf', url: pdfUrl.publicUrl });
          toast.success("PDF uploaded to cloud!");
        } else { console.error('PDF upload failed:', pdfErr); }
      }
    } catch (err) { console.error("PDF upload failed", err); }
    try {
      for (const [docName, file] of Object.entries(uploadedDocs)) {
        const safeName = docName.replace(/[^a-zA-Z0-9]/g, '_') + '_' + file.name;
        const docPath = storageFolder + '/' + safeName;
        const { error: docErr } = await supabase.storage.from('loan-documents').upload(docPath, file, { contentType: file.type || 'application/octet-stream', upsert: true });
        if (!docErr) {
          const { data: docUrl } = supabase.storage.from('loan-documents').getPublicUrl(docPath);
          documentUrls.push({ filename: safeName, url: docUrl.publicUrl });
        } else { console.error('Doc upload failed:', docName, docErr.message); }
      }
      if (documentUrls.length > 1) toast.success(documentUrls.length + ' file(s) uploaded!');
    } catch (docErr) { console.error("Doc upload failed", docErr); }
    const waText = "*NEW PAID APPLICATION (Rs.499)*\\n\\n*Loan Type:* " + loanLabel + "\\n*Name:* " + (form.fullName||"") + "\\n*Mobile:* " + (form.mobile||"") + "\\n*PAN:* " + (form.pancard||"") + "\\n*Amount:* " + (form.loanAmount||'N/A') + "\\n*Purpose:* " + (form.purpose||'N/A') + "\\n*City:* " + (form.currentAddress||'') + "\\n*Docs:* " + (documentUrls.length>0?documentUrls.map(d=>d.filename).join(', '):'None') + "\\n\\n*Ref:* " + refId + "\\n*Payment:* " + paymentId + "\\n\\nMahajan Finance";
    try { window.open("https://wa.me/919730540215?text=" + encodeURIComponent(waText), "_blank"); } catch(e) { console.error("WA failed", e); }
    try {
      const emailRes = await supabase.functions.invoke("send-enquiry-email", {
        body: {
          serviceName: loanLabel + " - Detailed Application (PAID Rs.499)",
          customerName: form.fullName, customerMobile: form.mobile, customerEmail: form.email,
          details: { ...form, "Loan Type": loanLabel, "Reference ID": refId, "Selected Banks": selectedBanks?.join(", ") || "None specified", "Payment ID": paymentId, "Documents Attached": documentUrls.length > 0 ? documentUrls.map(d => d.filename).join(", ") : "None" },
          paymentInfo: "Razorpay Payment ID: " + paymentId + " | Amount: Rs.499 | Ref: " + refId,
          documentUrls: documentUrls,
          storageFolder: storageFolder,
          sendToBoth: true,
          priorityEmails: ["sandeepmahajan9@gmail.com", "info@mahajanfinance.com"],
        },
      });
      if (emailRes.error) { console.error("Email function error:", emailRes.error); throw new Error(emailRes.error.message || "Email function returned error"); }
      toast.success("Emails sent with " + documentUrls.length + " downloadable files!");
    } catch (e) { console.error("Email failed", e); toast.error("Email failed: " + (e?.message || "Check function logs")); }
    setSubmitted(true);
    setLoading(false);
  };`;

let after = c.substring(end);
while (/^\s*};\s*\n/.test(after)) { after = after.replace(/^\s*};\s*\n/, '\n'); }
const nc = c.substring(0, si) + nf + after;
fs.writeFileSync(fp, nc, 'utf8');

console.log('\n=== VERIFICATION ===');
console.log('New lines:', nc.split('\n').length);
const v = fs.readFileSync(fp, 'utf8');
console.log('Has documentUrls:', v.includes('documentUrls: documentUrls,'));
console.log('Has storageFolder:', v.includes('storageFolder: storageFolder,'));
console.log('Has old downloadLinks:', v.includes('downloadLinks: downloadLinks,'));
console.log('\nDone! Now restart: Stop-Process -Name node -Force; Remove-Item -Recurse -Force node_modules\\.vite; npm run dev');
