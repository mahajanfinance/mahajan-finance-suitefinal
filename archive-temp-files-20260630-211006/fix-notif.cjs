const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src/pages/BankingSurrogate.tsx');
let code = fs.readFileSync(filePath, 'utf8');
const start = code.indexOf('<RazorpayButton');
if (start === -1) { console.error('RazorpayButton not found'); process.exit(1); }
let end = code.indexOf('/>', start);
if (end === -1) { console.error('RazorpayButton /> not found'); process.exit(1); }
end += 2;
const before = code.substring(0, start);
const after = code.substring(end);
const replacement = '<RazorpayButton\n                  amount={paymentAmount}\n                  onSuccess={() => {\n                    const msg = encodeURIComponent(\n                      "Mahajan Finance - Banking Surrogate Report" + "\\n" +\n                      "Name: " + (clientName || "N/A") + "\\n" +\n                      "Mobile: " + (clientMobile || "N/A") + "\\n" +\n                      "Email: " + (clientEmail || "N/A") + "\\n" +\n                      "Period: " + (period === 1 ? "1 Month" : period === 6 ? "6 Months" : "1 Year") + "\\n" +\n                      "Amount Paid: Rs." + paymentAmount + "\\n" +\n                      "ABB: Rs." + (abbValue?.toLocaleString() || "N/A") + "\\n" +\n                      "Eligible Loan: Rs." + (eligibleLoan?.toLocaleString() || "N/A") + "\\n" +\n                      "Date: " + new Date().toLocaleDateString("en-IN")\n                    );\n                    window.open("https://wa.me/919730540215?text=" + msg, "_blank");\n                    toast.success("Application submitted! Check WhatsApp to send notification.");\n                    setPaymentDone(true);\n                  }}\n                />';
code = before + replacement + after;
fs.writeFileSync(filePath, code, 'utf8');
console.log('DONE - RazorpayButton onSuccess replaced');
