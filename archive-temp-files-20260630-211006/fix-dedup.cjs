var fs = require('fs');
var p = 'D:\\mahajan-finance-suite-main cashflow added\\src\\pages\\AccountingServices.tsx';
var lines = fs.readFileSync(p, 'utf8').split('\n');
var seen = {};
var filtered = [];
for (var i = 0; i < lines.length; i++) {
  var key = lines[i].trim();
  if (key === '') { filtered.push(lines[i]); continue; }
  if (seen[key]) {
    console.log('Duplicate removed at line ' + (i+1) + ': ' + key.substring(0, 50));
  } else {
    seen[key] = true;
    filtered.push(lines[i]);
  }
}
fs.writeFileSync(p, filtered.join('\n'), 'utf8');
console.log('Done. Lines: ' + lines.length + ' -> ' + filtered.length);
