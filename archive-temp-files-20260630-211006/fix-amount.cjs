const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src/pages/BankingSurrogate.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// Add paymentAmount const right before the RazorpayButton
const target = '<RazorpayButton';
const idx = code.indexOf(target);
if (idx === -1) { console.error('RazorpayButton not found'); process.exit(1); }

// Find the start of the line containing <RazorpayButton
let lineStart = code.lastIndexOf('\n', idx) + 1;

const paymentLine = '                  const paymentAmount = period === 1 ? 99 : period === 6 ? 499 : 999;\n';

code = code.substring(0, lineStart) + paymentLine + code.substring(lineStart);

fs.writeFileSync(filePath, code, 'utf8');
console.log('DONE - Added paymentAmount const before RazorpayButton');
