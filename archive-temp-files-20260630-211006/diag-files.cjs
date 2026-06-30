const fs = require('fs');
const path = require('path');

// 1. parseBankClient.ts - show full file
const p1 = path.join(__dirname, 'src/lib/parseBankClient.ts');
console.log('========== parseBankClient.ts ==========');
console.log(fs.readFileSync(p1, 'utf8'));
console.log('\n\n');

// 2. generateBankPdf.ts - show full file
const p2 = path.join(__dirname, 'src/lib/generateBankPdf.ts');
console.log('========== generateBankPdf.ts ==========');
console.log(fs.readFileSync(p2, 'utf8'));
console.log('\n\n');

// 3. BankingSurrogate.tsx - show lines around RazorpayButton and PDF generation
const p3 = path.join(__dirname, 'src/pages/BankingSurrogate.tsx');
const lines3 = fs.readFileSync(p3, 'utf8').split('\n');
console.log('========== BankingSurrogate.tsx (first 50 lines) ==========');
lines3.slice(0, 50).forEach((l, i) => console.log((i+1) + ': ' + l));
console.log('\n========== BankingSurrogate.tsx (generateBankReport / manualBalances area) ==========');
for (let i = 0; i < lines3.length; i++) {
  if (lines3[i].includes('generateBankReport') || lines3[i].includes('manualBalances') || lines3[i].includes('abbValue') || lines3[i].includes('monthlyData') || lines3[i].includes('closingBalance')) {
    for (let j = Math.max(0, i-1); j < Math.min(lines3.length, i+3); j++) {
      console.log((j+1) + ': ' + lines3[j]);
    }
    console.log('---');
  }
}
