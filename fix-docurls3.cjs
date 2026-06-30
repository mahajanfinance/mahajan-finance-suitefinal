const fs = require('fs');
const p = 'D:\\\\mahajan-finance-suite-main cashflow added\\\\src\\\\components\\\\ServicesGrid.tsx';
let c = fs.readFileSync(p, 'utf8');

// Fix the messy comma area - replace the broken section
c = c.replace(
  /Documents:\s*docNames\s*\n\s*,\s*\n\s*documentUrls:\s*docUrls,\s*\n\s*,\s*\n\s*\}\s*,\s*\n\s*\}\s*\)\s*;/,
  'Documents: docNames\n          },\n          documentUrls: docUrls,\n        },\n      });'
);

fs.writeFileSync(p, c, 'utf8');
console.log('Fixed');
