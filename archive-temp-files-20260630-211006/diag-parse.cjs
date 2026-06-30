const fs = require('fs');
const p = require('path').join(__dirname, 'src/pages/BankingSurrogate.tsx');
const lines = fs.readFileSync(p, 'utf8').split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('parseBankStatementClient') || lines[i].includes('maxMonths') || lines[i].includes('Parsed') || lines[i].includes('setMonthsData') || lines[i].includes('setAbb6m') || lines[i].includes('setAbb1y')) {
    console.log((i+1) + ': ' + lines[i]);
  }
}
