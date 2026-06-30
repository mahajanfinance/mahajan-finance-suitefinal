const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src/pages/BankingSurrogate.tsx');
let code = fs.readFileSync(filePath, 'utf8');
const lines = code.split('\n');

// 1. Remove any previously-added paymentAmount or paymentDone lines
let removed = 0;
for (let i = lines.length - 1; i >= 0; i--) {
  if (lines[i].includes('const paymentAmount') || lines[i].includes('const [paymentDone')) {
    console.log('Removing line ' + (i+1) + ': ' + lines[i].trim());
    lines.splice(i, 1);
    removed++;
  }
}

// 2. Replace {paymentAmount} with inline expression in RazorpayButton
code = lines.join('\n');
code = code.replace(
  /amount=\{paymentAmount\}/,
  'amount={period === 1 ? 99 : period === 6 ? 499 : 999}'
);

// 3. Also remove setPaymentDone call if it references undefined state
// Replace setPaymentDone(true) with nothing
code = code.replace(/\s*setPaymentDone\(true\);\s*/g, '\n');

fs.writeFileSync(filePath, code, 'utf8');
console.log('Removed ' + removed + ' stray lines');
console.log('Replaced paymentAmount with inline expression');
console.log('DONE');
