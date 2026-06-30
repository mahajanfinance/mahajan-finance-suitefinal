var fs = require('fs');
var p = 'D:\\\\mahajan-finance-suite-main cashflow added\\\\src\\\\pages\\\\Dashboard.tsx';
var lines = fs.readFileSync(p, 'utf8').split('\n');

// Remove orphaned lines: </div>, <div grid-cols-3>, )}, </div>
// These are at indices around 104-108 (0-indexed)
var toRemove = [];
for (var i = 0; i < lines.length; i++) {
  if (i >= 103 && i <= 110) {
    var t = lines[i].trim();
    if (t === '</div>' || t === '<div className="grid md:grid-cols-3 gap-4">' || t === ')}') {
      toRemove.push(i);
      console.log('Removing line ' + (i+1) + ': ' + t);
    }
  }
}

// Remove in reverse order to preserve indices
for (var j = toRemove.length - 1; j >= 0; j--) {
  lines.splice(toRemove[j], 1);
}

fs.writeFileSync(p, lines.join('\n'), 'utf8');
console.log('Cleaned up ' + toRemove.length + ' lines');
