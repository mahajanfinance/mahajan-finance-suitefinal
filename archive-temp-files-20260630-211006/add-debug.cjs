const fs = require('fs');
const p = require('path').join(__dirname, 'src/pages/BankingSurrogate.tsx');
let c = fs.readFileSync(p, 'utf8');
// Add debug toast right after the parseBankStatementClient call
c = c.replace(
  'const result = parseBankStatementClient(textContent, SAMPLE_DAYS, period === 1 ? 1 : period);',
  'const result = parseBankStatementClient(textContent, SAMPLE_DAYS, period === 1 ? 1 : period);\n        console.log("=== PARSE DEBUG ===");\n        console.log("Text length:", textContent.length);\n        console.log("Months found:", result.months_data.map(m => m.month).join(", "));\n        console.log("All entries count:", result.months_data.reduce((s, m) => s + Object.keys(m.balances).length, 0));\n        toast.info("Debug: Text=" + textContent.length + " chars, Months=" + result.months_data.map(m => m.month).join(", "));'
);
fs.writeFileSync(p, c, 'utf8');
console.log('DONE - Debug toast added. Upload the PDF again and tell me what the blue toast says.');
