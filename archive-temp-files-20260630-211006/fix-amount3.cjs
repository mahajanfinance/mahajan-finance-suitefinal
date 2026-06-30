const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src/pages/BankingSurrogate.tsx');
let code = fs.readFileSync(filePath, 'utf8');
const lines = code.split('\n');

// 1. Find and remove the wrongly-placed lines (paymentAmount and paymentDone useState)
const toRemove = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const paymentAmount = period') || lines[i].includes('const [paymentDone, setPaymentDone]')) {
    toRemove.push(i);
    console.log('Removing line ' + (i+1) + ': ' + lines[i].trim());
  }
}
for (let i = toRemove.length - 1; i >= 0; i--) {
  lines.splice(toRemove[i], 1);
}
code = lines.join('\n');

// 2. Find "return (" at the component's top level (not nested)
// Look for a line that starts with spaces then "return ("
let insertIdx = -1;
for (let i = lines.length - 1; i >= 0; i--) {
  const trimmed = lines[i].trim();
  if (trimmed === 'return (' || trimmed.startsWith('return (')) {
    // Check this is a top-level return (not inside an if/map/etc)
    // Simple heuristic: check indentation matches previous non-empty line
    const indent = lines[i].match(/^(\s*)/)[1];
    // Walk backwards to find a non-empty line and compare indent
    let prevIndent = '';
    for (let j = i - 1; j >= 0; j--) {
      if (lines[j].trim()) {
        prevIndent = lines[j].match(/^(\s*)/)[1];
        break;
      }
    }
    // Top-level return has same indent as other statements
    if (indent === prevIndent || prevIndent === '') {
      insertIdx = i;
      console.log('Found top-level return at line ' + (i + 1));
      break;
    }
  }
}
if (insertIdx === -1) {
  console.error('Could not find top-level return statement');
  process.exit(1);
}

// 3. Get the indentation of the return line
const indent = lines[insertIdx].match(/^(\s*)/)[1];

// 4. Insert paymentAmount and paymentDone before the return
const newLines = [
  indent + 'const paymentAmount = period === 1 ? 99 : period === 6 ? 499 : 999;',
  indent + 'const [paymentDone, setPaymentDone] = useState(false);',
  ''
];
lines.splice(insertIdx, 0, ...newLines);

code = lines.join('\n');
fs.writeFileSync(filePath, code, 'utf8');
console.log('DONE - paymentAmount + paymentDone inserted BEFORE return statement');
