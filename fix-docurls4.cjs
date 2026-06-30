const fs = require('fs');
const p = 'D:\\\\mahajan-finance-suite-main cashflow added\\\\src\\\\components\\\\ServicesGrid.tsx';
let lines = fs.readFileSync(p, 'utf8').split('\n');

// Find the broken area and fix it
let newLines = [];
let i = 0;
while (i < lines.length) {
  // Match the broken pattern: line with just comma after Email line
  if (lines[i].trim() === ',' && i > 0 && lines[i-1].includes('Email')) {
    // Replace next lines until we find the closing of invoke
    newLines.push('            Documents: docNames');
    newLines.push('          },');
    newLines.push('          documentUrls: docUrls,');
    // skip orphan commas until });
    i++;
    while (i < lines.length && lines[i].trim() === ',') i++;
    // skip the orphan comma and find });
    if (i < lines.length && lines[i].trim().startsWith('}')) {
      newLines.push('        },');
      newLines.push('      });');
      i++;
    }
    continue;
  }
  newLines.push(lines[i]);
  i++;
}

fs.writeFileSync(p, newLines.join('\n'), 'utf8');
console.log('Fixed!');
