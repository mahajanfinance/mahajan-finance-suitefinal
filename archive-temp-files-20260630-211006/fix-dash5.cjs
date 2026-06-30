var fs = require('fs');
var p = 'D:\\mahajan-finance-suite-main cashflow added\\src\\pages\\Dashboard.tsx';
var lines = fs.readFileSync(p, 'utf8').split('\n');
for (var i = 0; i < lines.length; i++) {
  if (lines[i].trim() === ')}') {
    console.log('Found orphan )} at line ' + (i+1) + ': [' + lines[i] + ']');
    lines.splice(i, 1);
    console.log('Removed!');
    break;
  }
}
fs.writeFileSync(p, lines.join('\n'), 'utf8');
console.log('Done. Total lines now: ' + lines.length);
