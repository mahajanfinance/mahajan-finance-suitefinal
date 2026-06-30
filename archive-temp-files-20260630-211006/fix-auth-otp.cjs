const fs = require('fs');
const p = 'D:\\\\mahajan-finance-suite-main cashflow added\\\\src\\\\pages\\\\Auth.tsx';
let lines = fs.readFileSync(p, 'utf8').split('\n');

// Find and hide the OTP tab button (lines around 521-530)
// Replace the button with a commented-out version
let result = [];
for (let i = 0; i < lines.length; i++) {
  // Hide the OTP button: lines 521-530 (0-indexed: 520-529)
  if (i >= 520 && i <= 529) {
    // Skip the OTP button entirely
    continue;
  }
  result.push(lines[i]);
}

fs.writeFileSync(p, result.join('\n'), 'utf8');
console.log('OTP tab hidden!');
