var fs = require('fs');
var cardsFile = 'D:\\mahajan-finance-suite-main cashflow added\\service-cards.txt';
var dashFile = 'D:\\mahajan-finance-suite-main cashflow added\\src\\pages\\Dashboard.tsx';
var cards = fs.readFileSync(cardsFile, 'utf8').trim();
var lines = fs.readFileSync(dashFile, 'utf8').split('\n');

var insertIdx = -1;
for (var i = 0; i < lines.length; i++) {
  if (lines[i].indexOf('My Referrals') !== -1) {
    for (var j = i - 1; j >= 0; j--) {
      if (lines[j].indexOf('bg-card') !== -1 && lines[j].indexOf('My Referrals') === -1) {
        insertIdx = j;
        break;
      }
    }
    break;
  }
}

if (insertIdx === -1) {
  console.log('ERROR: Could not find insertion point');
  process.exit(1);
}

var cardLines = cards.split('\n');
var heading = '            <h2 className="text-lg font-bold font-display">Quick Services</h2>';
var allInsert = [heading].concat(cardLines, ['']);

var args = [insertIdx, 0];
for (var k = 0; k < allInsert.length; k++) args.push(allInsert[k]);
lines.splice.apply(lines, args);

fs.writeFileSync(dashFile, lines.join('\n'), 'utf8');
console.log('Inserted ' + allInsert.length + ' lines at position ' + (insertIdx + 1));
console.log('Done. Total lines: ' + lines.length);
