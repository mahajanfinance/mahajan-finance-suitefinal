const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src/pages/BankingSurrogate.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Remove the wrongly-placed paymentAmount line that's inside JSX
const badLine = 'const paymentAmount = period === 1 ? 99 : period === 6 ? 499 : 999;';
const badIdx = code.indexOf(badLine);
if (badIdx !== -1) {
  let lineStart = code.lastIndexOf('\n', badIdx);
  let lineEnd = code.indexOf('\n', badIdx);
  if (lineStart === -1) lineStart = 0; else lineStart++;
  if (lineEnd === -1) lineEnd = code.length;
  code = code.substring(0, lineStart) + code.substring(lineEnd);
  console.log('Removed wrongly-placed paymentAmount from JSX');
}

// 2. Find the main return( statement of the component
// Look for "return (" pattern which starts the JSX
const returnMatch = code.match(/\n(\s*)return\s*\(\s*\n/);
if (!returnMatch) {
  console.error('Could not find return statement');
  process.exit(1);
}
const returnIdx = code.indexOf(returnMatch[0]) + returnMatch[0].length;

// 3. Insert paymentAmount + paymentDone state before return
const insertCode = '  const paymentAmount = period === 1 ? 99 : period === 6 ? 499 : 999;\n  const [paymentDone, setPaymentDone] = useState(false);\n\n';

code = code.substring(0, returnIdx) + insertCode + code.substring(returnIdx);

fs.writeFileSync(filePath, code, 'utf8');
console.log('DONE - Added paymentAmount and paymentDone before return statement');
