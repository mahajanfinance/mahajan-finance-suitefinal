const fs = require('fs');
const p = 'D:\\\\mahajan-finance-suite-main cashflow added\\\\src\\\\components\\\\ServicesGrid.tsx';
let lines = fs.readFileSync(p, 'utf8').split('\n');

// Replace lines 142-150 (0-indexed: 141-149) with correct code
const replacement = [
  '          details: {',
  '            City: form.city,',
  "            Email: form.email || \"N/A\",",
  '            Documents: docNames',
  '          },',
  '          documentUrls: docUrls,',
  '        },',
  '      });',
];

lines.splice(141, 9, ...replacement);
fs.writeFileSync(p, lines.join('\n'), 'utf8');
console.log('Clean fix applied');
