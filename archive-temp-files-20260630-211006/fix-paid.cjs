const fs = require('fs');
const path = 'src/pages/LoanApplication.tsx';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split(/\r?\n/);
let startIdx = -1, endIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Convert uploaded documents to base64') && startIdx === -1) startIdx = i;
  if (startIdx !== -1 && lines[i].includes('setSubmitted(true)')) { endIdx = i; break; }
}
if (startIdx === -1 || endIdx === -1) { console.log('ERROR: Markers not found'); process.exit(1); }
console.log('Replacing lines', startIdx+1, 'to', endIdx+1);
const newCode = [
    '    /* === FINALIZE V3-STORAGE === */',
    '    const documentUrls: { filename: string; url: string }[] = [];',
    '    const storageFolder = refId + "_" + Date.now();',
    '    console.log("=== FINALIZE V3-STORAGE ===", "folder:", storageFolder);',
    '',
    '    /* Upload PDF to Supabase Storage */',
    '    if (pdfBase64) {',
    '      try {',
    '        const pdfFileName = "LoanApplication_" + refId + ".pdf";',
    '        const pdfBytes = Uint8Array.from(atob(pdfBase64), (c) => c.charCodeAt(0));',
    '        const pdfPath = storageFolder + "/" + pdfFileName;',
    '        await supabase.storage.from("loan-documents").upload(pdfPath, pdfBytes, { contentType: "application/pdf", upsert: true });',
    '        const { data: urlData } = supabase.storage.from("loan-documents").getPublicUrl(pdfPath);',
    '        documentUrls.push({ filename: pdfFileName, url: urlData.publicUrl });',
    '        console.log("PDF uploaded:", urlData.publicUrl);',
    '        toast.success("Application PDF generated!");',
    '      } catch (e) { console.error("PDF upload failed", e); }',
    '    }',
    '',
    '    /* Upload user documents to Supabase Storage */',
    '    for (const [docName, file] of Object.entries(uploadedDocs)) {',
    '      try {',
    '        const safeName = docName.replace(/[^a-zA-Z0-9]/g, "_") + "_" + file.name;',
    '        const filePath = storageFolder + "/" + safeName;',
    '        await supabase.storage.from("loan-documents").upload(filePath, file, { upsert: true });',
    '        const { data: urlData } = supabase.storage.from("loan-documents").getPublicUrl(filePath);',
    '        documentUrls.push({ filename: safeName, url: urlData.publicUrl });',
    '        console.log("Doc uploaded:", safeName);',
    '      } catch (e) { console.error("Upload failed for", docName, e); }',
    '    }',
    '    console.log("TOTAL documentUrls:", documentUrls.length);',
    '    if (documentUrls.length > 0) { toast.success(documentUrls.length + " document(s) uploaded!"); }',
    '',
    '    /* WHATSAPP NOTIFICATION */',
    '    const whatsappMsg = encodeURIComponent(',
    '      "NEW PAID APPLICATION (Rs.499)\\n\\n" +',
    '      "Loan Type: " + loanLabel + "\\n" +',
    '      "Name: " + form.fullName + "\\n" +',
    '      "Mobile: " + form.mobile + "\\n" +',
    '      "PAN: " + form.pancard + "\\n" +',
    '      "Amount: " + (form.loanAmount || "N/A") + "\\n" +',
    '      "Purpose: " + (form.purpose || "N/A") + "\\n" +',
    '      "City: " + (form.currentAddress || "") + "\\n" +',
    '      "Banks: " + (selectedBanks?.join(", ") || "Any") + "\\n" +',
    '      "Documents: " + (documentUrls.length > 0 ? documentUrls.map(d => d.filename).join(", ") : "None") + "\\n\\n" +',
    '      "Ref: " + refId + " | Pay: " + paymentId + "\\n\\n" +',
    '      "Mahajan Finance - Sandeep Mahajan"',
    '    );',
    '    window.open("https://wa.me/919730540215?text=" + whatsappMsg, "_blank");',
    '',
    '    /* SEND EMAIL with documentUrls */',
    '    try {',
    '      await supabase.functions.invoke("send-enquiry-email", {',
    '        body: {',
    '          serviceName: loanLabel + " \\u2013 Detailed Application (PAID Rs.499)",',
    '          customerName: form.fullName,',
    '          customerMobile: form.mobile,',
    '          customerEmail: form.email,',
    '          details: {',
    '            ...form,',
    '            "Loan Type": loanLabel,',
    '            "Reference ID": refId,',
    '            "Selected Banks": selectedBanks?.join(", ") || "None specified",',
    '            "Payment ID": paymentId,',
    '            "Documents Attached": documentUrls.map(d => d.filename).join(", ") || "None"',
    '          },',
    '          paymentInfo: "Razorpay Payment ID: " + paymentId + " | Amount: Rs.499 | Ref: " + refId,',
    '          storageFolder: storageFolder,',
    '          documentUrls: documentUrls,',
    '        },',
    '      });',
    '      console.log("Invoking edge function with", documentUrls.length, "documentUrls");',
    '      toast.success("Emails sent with " + documentUrls.length + " downloadable links!");',
    '    } catch (e) {',
    '      console.error("Email failed", e);',
    '      toast.error("Email delivery failed.");',
    '    }',
    '',
];
const newLines = [...lines.slice(0, startIdx), ...newCode, ...lines.slice(endIdx)];
fs.writeFileSync(path, newLines.join('\r\n'), 'utf8');
console.log('DONE! New total lines:', newLines.length);
const v = fs.readFileSync(path, 'utf8');
console.log('V3-STORAGE:', v.includes('FINALIZE V3-STORAGE'));
console.log('sendToBoth removed:', !v.includes('sendToBoth'));
console.log('documentUrls:', v.includes('documentUrls'));
