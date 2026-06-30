const fs = require('fs');
const p = require('path').join(__dirname, 'src/pages/BankingSurrogate.tsx');
let c = fs.readFileSync(p, 'utf8');
c = c.replace(
  'const result = parseBankStatementClient(textContent',
  'alert("BANK TEXT SAMPLE (copy all of this):\\n" + textContent.substring(0, 1500));\n        const result = parseBankStatementClient(textContent'
);
fs.writeFileSync(p, c, 'utf8');
console.log('DONE');
