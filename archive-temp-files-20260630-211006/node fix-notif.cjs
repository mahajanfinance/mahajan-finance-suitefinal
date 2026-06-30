// fix-notif.cjs
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/BankingSurrogate.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// Find the RazorpayButton's onSuccess handler and replace the entire block
// We search for the RazorpayButton opening tag and replace everything up to its closing
const razorpayStart = code.indexOf('<RazorpayButton');
if (razorpayStart === -1) { console.error('RazorpayButton not found'); process.exit(1); }

// Find the closing /> of RazorpayButton
let depth = 0;
let i = razorpayStart;
let razorpayEnd = -1;
for (; i < code.length; i++) {
  if (code[i] === '<' && code[i+1] !== '/') depth++;
  if (code[i] === '/' && code[i+1] === '>') { razorpayEnd = i + 2; break; }
  if (code[i] === '>' && code[i-1] !== '/') {
    // Could be closing of a JSX element, but for self-closing we check />
  }
}
// Fallback: find the next />
if (razorpayEnd === -1) {
  const closeIdx = code.indexOf('/>', razorpayStart);
  if (closeIdx !== -1) razorpayEnd = closeIdx + 2;
}
if (razorpayEnd === -1) { console.error('Could not find RazorpayButton end'); process.exit(1); }

const oldBlock = code.substring(razorpayStart, razorpayEnd);

const newBlock = `<RazorpayButton
                  amount={paymentAmount}
                  onSuccess={() => {
                    // Build WhatsApp notification message
                    const msg = encodeURIComponent(
                      "🏦 *Mahajan Finance - Banking Surrogate Report*" + "\\n" +
                      "━━━━━━━━━━━━━━━━━━━━" + "\\n" +
                      "👤 Name: " + (clientName || "N/A") + "\\n" +
                      "📱 Mobile: " + (clientMobile || "N/A") + "\\n" +
                      "📧 Email: " + (clientEmail || "N/A") + "\\n" +
                      "📋 Period: " + (period === 1 ? "1 Month" : period === 6 ? "6 Months" : "1 Year") + "\\n" +
                      "💰 Amount Paid: ₹" + paymentAmount + "\\n" +
                      "📊 ABB: ₹" + (abbValue?.toLocaleString() || "N/A") + "\\n" +
                      "🏛️ Eligible Loan: ₹" + (eligibleLoan?.toLocaleString() || "N/A") + "\\n" +
                      "━━━━━━━━━━━━━━━━━━━━" + "\\n" +
                      "Date: " + new Date().toLocaleDateString("en-IN")
                    );
                    window.open("https://wa.me/919730540215?text=" + msg, "_blank");
                    toast.success("Application submitted! Check WhatsApp to send the notification.");
                    setPaymentDone(true);
                  }}
                />`;

code = code.substring(0, razorpayStart) + newBlock + code.substring(razorpayEnd);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Fixed RazorpayButton onSuccess handler');
console.log('RazorpayButton position: line', code.substring(0, razorpayStart).split('\n').length);