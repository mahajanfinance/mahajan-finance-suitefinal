const fs = require('fs');
const p = 'D:\\\\mahajan-finance-suite-main cashflow added\\\\src\\\\components\\\\ServicesGrid.tsx';
let c = fs.readFileSync(p, 'utf8');

// Add documentUrls after details closing brace, before body closing
c = c.replace(
  /(Documents:\s*docNames\s*\n\s*\})\s*,\s*\n(\s*\})/,
  ',\n          documentUrls: docUrls,\n        '
);

fs.writeFileSync(p, c, 'utf8');
console.log('Done');
