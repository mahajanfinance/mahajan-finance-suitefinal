const fs = require("fs");
const path = require("path");
const src = path.join(process.cwd(), "src", "pages", "BankingSurrogate.tsx");
let f = fs.readFileSync(src, "utf8");
const lines = f.split("\n");

// 1. Find the manualBalances state line and add new states after it
let mbLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("manualBalances") && lines[i].includes("useState") && mbLine === -1) { mbLine = i; break; }
}
console.log("manualBalances state at line:", mbLine + 1);

if (mbLine !== -1) {
  lines.splice(mbLine + 1, 0,
    '  const [paymentDone, setPaymentDone] = useState(false);',
    '  const [notifMsg, setNotifMsg] = useState("");'
  );
  console.log("Added paymentDone + notifMsg states");
}

// 2. Find and modify the RazorpayButton onSuccess handler
// Find "window.open" and "toast.success" in the onSuccess
let woLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("wa.me/919730540215") && lines[i].includes("window.open")) { woLine = i; break; }
}
console.log("wa.me window.open at line:", woLine + 1);

if (woLine !== -1) {
  // Find the toast.success line after this
  let tsLine = -1;
  for (let i = woLine; i < lines.length; i++) {
    if (lines[i].includes("toast.success") && lines[i].includes("Application submitted")) { tsLine = i; break; }
  }
  console.log("toast.success at line:", tsLine + 1);

  // Replace the window.open + toast.success block
  if (tsLine !== -1) {
    // Build the message construction first, then the new lines
    const startLine = woLine - 1; // start from the "const msg" line
    const newBlock = [
      '                const msg = ' + lines[woLine - 1].match(/const msg = encodeURIComponent\(/) ? '' : '' +
      '                    "\\uD83C\\uDFE6 Banking Surrogate Application\\n" +',
      '                    "Period: " + (period === 1 ? "1 Month" : period === 6 ? "6 Months" : "1 Year") + "\\n" +',
      '                    "ABB: Rs." + Math.round(abb).toLocaleString("en-IN") + "\\n" +',
      '                    "Eligible: Rs." + Math.round(eligibleLoan).toLocaleString("en-IN") + "\\n" +',
      '                    "EMI: Rs." + Math.round(monthlyEMI).toLocaleString("en-IN") + " (" + tenure + "m)\\n" +',
      '                    "Fee Paid: Rs.499\\nPayment ID: " + paymentId;',
      '                setNotifMsg(msg);',
      '                setPaymentDone(true);',
      '                toast.success("Payment successful! Send application details below.");'
    ];
    lines.splice(startLine, tsLine - startLine + 1, ...newBlock);
    console.log("Replaced onSuccess handler");
  }
}

// 3. Find the RazorpayButton closing and add notification section after it
// Find </RazorpayButton>
let rzpClose = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("</RazorpayButton>")) { rzpClose = i; break; }
}
console.log("</RazorpayButton> at line:", rzpClose + 1);

if (rzpClose !== -1) {
  const notifBlock = [
    '            </div>',
    '            {paymentDone && notifMsg && (',
    '              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5 space-y-3">',
    '                <h3 className="font-bold text-green-800 text-sm flex items-center gap-2">',
    '                  <FileCheck2 size={18} /> Payment Successful! Send Application Details:',
    '                </h3>',
    '                <div className="grid grid-cols-2 gap-3">',
    '                  <a',
    '                    href={"https://wa.me/919730540215?text=" + encodeURIComponent(notifMsg)}',
    '                    target="_blank"',
    '                    rel="noopener noreferrer"',
    '                    className="flex items-center justify-center gap-2 py-3 bg-green-600 text-white font-bold rounded-lg text-sm hover:bg-green-700 transition-colors"',
    '                  >',
    '                    Send via WhatsApp',
    '                  </a>',
    '                  <a',
    '                    href={"mailto:mahajanfinance@gmail.com?subject=" + encodeURIComponent("Banking Surrogate Application - Mahajan Finance") + "&body=" + encodeURIComponent(notifMsg)}',
    '                    className="flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-bold rounded-lg text-sm hover:bg-blue-700 transition-colors"',
    '                  >',
    '                    Send via Email',
    '                  </a>',
    '                </div>',
    '              </div>',
    '            )}',
    '            </div>'
  ];
  lines.splice(rzpClose + 1, 0, ...notifBlock);
  console.log("Added notification buttons section");
}

fs.writeFileSync(src, lines.join("\n"), "utf8");
console.log("DONE!");