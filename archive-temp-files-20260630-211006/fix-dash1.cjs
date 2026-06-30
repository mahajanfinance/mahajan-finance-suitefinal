const fs = require('fs');
const p = 'D:\\\\mahajan-finance-suite-main cashflow added\\\\src\\\\pages\\\\Dashboard.tsx';
let lines = fs.readFileSync(p, 'utf8').split('\n');

// Remove referral link block
let s = -1, e = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Your Referral Link') && s === -1) {
    s = i - 2; e = i;
    for (let j = i; j < lines.length && j < i + 15; j++) {
      if (lines[j].trim() === '</div>' && j > i + 3) { e = j; break; }
    }
  }
}
if (s > 0) { lines.splice(s, e - s + 1); console.log('Referral link removed'); }

// Remove Training/Marketing/KYC cards
s = -1; e = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Training Hub') && s === -1) {
    s = i - 1; e = i;
    for (let j = i; j < lines.length && j < i + 20; j++) {
      if (lines[j].trim() === '</div>' && j > i + 5) { e = j; break; }
    }
  }
}
if (s > 0) { lines.splice(s, e - s + 1); console.log('Training cards removed'); }

// Remove refLink line
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const refLink')) { lines[i] = ''; console.log('refLink removed'); break; }
}

fs.writeFileSync(p, lines.join('\n'), 'utf8');
console.log('Step 1 done - sections removed');
