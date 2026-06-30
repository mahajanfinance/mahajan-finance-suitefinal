const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src/pages/BankingSurrogate.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Check what amount/price variables exist
const amountVars = code.match(/const\s+\w*[Aa]mount\w*\s*=/g) || [];
const priceVars = code.match(/const\s+\w*[Pp]rice\w*\s*=/g) || [];
const useStates = code.match(/useState\s*\(\s*[\d.]+\s*\)/g) || [];
console.log('Amount vars found:', amountVars);
console.log('Price vars found:', priceVars);
console.log('Numeric useStates found:', useStates);

// 2. Check if paymentAmount exists
if (code.includes('paymentAmount')) {
  console.log('paymentAmount already exists in code');
  // Find where it appears
  const lines = code.split('\n');
  lines.forEach((line, i) => {
    if (line.includes('paymentAmount')) console.log('  Line ' + (i+1) + ': ' + line.trim());
  });
}

// 3. Check what the RazorpayButton amount prop currently uses
const rbStart = code.indexOf('<RazorpayButton');
if (rbStart !== -1) {
  const rbEnd = code.indexOf('/>', rbStart);
  const rbBlock = code.substring(rbStart, rbEnd);
  console.log('\nCurrent RazorpayButton block:');
  console.log(rbBlock);
}

// 4. Find existing period state and any amount logic
const periodMatch = code.match(/useState\s*\(\s*(\d+)\s*\)/g);
console.log('\nNumeric useStates:', periodMatch);

// 5. Look for any Rs or rupee symbols for pricing clues
const priceLines = code.split('\n').filter(l => l.match(/[Rr]s\.?|₹|price|charge|fee|amount/i));
console.log('\nLines with price references:');
priceLines.forEach(l => console.log('  ' + l.trim().substring(0, 120)));
