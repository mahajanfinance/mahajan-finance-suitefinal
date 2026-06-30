var fs = require('fs');
var p = 'D:\\\\mahajan-finance-suite-main cashflow added\\\\src\\\\pages\\\\Dashboard.tsx';
var lines = fs.readFileSync(p, 'utf8').split('\n');
for (var i = 100; i < 115; i++) {
  if (lines[i] && lines[i].trim() === ')}') {
    lines.splice(i, 1);
    console.log('Removed orphan )} at line ' + (i+1));
    break;
  }
}
fs.writeFileSync(p, lines.join('\n'), 'utf8');
