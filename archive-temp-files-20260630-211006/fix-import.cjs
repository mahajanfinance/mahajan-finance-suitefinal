const fs = require('fs');
const p = 'D:\\\\mahajan-finance-suite-main cashflow added\\\\src\\\\pages\\\\AccountingServices.tsx';
let c = fs.readFileSync(p, 'utf8');

// Remove the misplaced import from wherever it ended up
c = c.replace(/^import \{ uploadDocsToStorage \} from ['"]@\/utils\/uploadDocs['"];?\s*\n?/gm, '');

// Add it at the top after the very first import
if (c.includes("from '@/utils/uploadDocs'") === false) {
  c = c.replace(
    /(import\s+[\s\S]*?from\s+['"][^'"]+['"];)/,
    '\nimport { uploadDocsToStorage } from \'@/utils/uploadDocs\';'
  );
}

fs.writeFileSync(p, c, 'utf8');
console.log('Fixed! Import moved to top.');
