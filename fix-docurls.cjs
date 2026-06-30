const fs = require('fs');
const path = require('path');
const base = 'D:\\\\mahajan-finance-suite-main cashflow added';

const files = [
  'src/components/ServicesGrid.tsx',
  'src/pages/InsuranceQuote.tsx',
  'src/pages/AccountingServices.tsx',
  'src/pages/GovtSchemes.tsx'
];

let fixed = 0;
for (const f of files) {
  const fp = path.join(base, f);
  let c = fs.readFileSync(fp, 'utf8');
  
  const hasInsideDetails = /documentUrls:\s*docUrls\s*,?\s*\n\s*\}/.test(c);
  
  if (hasInsideDetails) {
    c = c.replace(/,\s*\n?\s*documentUrls:\s*docUrls\s*,?/g, '');
    c = c.replace(/(details:\s*\{[\s\S]*?\n\s*\})\s*\n(\s*\})\s*\n(\s*\}\)\s*;)/, 
      ',\n          documentUrls: docUrls,\n        \n      ');
    fs.writeFileSync(fp, c, 'utf8');
    console.log('FIXED: ' + f);
    fixed++;
  } else {
    console.log('CHECK: ' + f + ' (no documentUrls inside details)');
  }
}
console.log(fixed + ' files fixed');
