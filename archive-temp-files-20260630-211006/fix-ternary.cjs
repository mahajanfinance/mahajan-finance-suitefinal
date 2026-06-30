var fs = require('fs');
var p = 'D:\\mahajan-finance-suite-main cashflow added\\src\\pages\\Dashboard.tsx';
var lines = fs.readFileSync(p, 'utf8').split('\n');
for (var i = 0; i < lines.length; i++) {
  if (lines[i].trim() === '</table>') {
    console.log('Found </table> at line ' + (i+1));
    console.log('Next line: [' + lines[i+1].trim() + ']');
    console.log('Line after: [' + lines[i+2].trim() + ']');
    lines.splice(i+2, 0, '              )}');
    console.log('Inserted )} after line ' + (i+2));
    break;
  }
}
fs.writeFileSync(p, lines.join('\n'), 'utf8');
console.log('Done. Total lines: ' + lines.length);
