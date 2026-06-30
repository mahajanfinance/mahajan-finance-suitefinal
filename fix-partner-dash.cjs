const fs = require('fs');
const p = 'D:\\\\mahajan-finance-suite-main cashflow added\\\\src\\\\pages\\\\Dashboard.tsx';
let lines = fs.readFileSync(p, 'utf8').split('\n');

// Remove referral link section (lines 105-115 in 1-indexed = 104-114 in 0-indexed)
// And replace Training/Marketing/KYC cards with service cards
// Line 104-114: Referral link div
// Line 116-128: Training/Marketing/KYC grid (with blank line 115, opening 116-128)

// Find and remove referral link block
let startRemove = -1;
let endRemove = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Your Referral Link')) {
    // Go back to find the opening div
    for (let j = i; j >= 0; j--) {
      if (lines[j].includes('refLink') || (lines[j].trim() === '' && j > 0 && lines[j-1].includes('Referral'))) {
        startRemove = j;
        break;
      }
    }
    if (startRemove === -1) startRemove = i - 2;
    // Find closing
    for (let j = i; j < lines.length; j++) {
      if (lines[j].trim() === '</div>' && j > i + 3) {
        endRemove = j;
        break;
      }
    }
    break;
  }
}

if (startRemove > 0 && endRemove > 0) {
  lines.splice(startRemove, endRemove - startRemove + 1);
  console.log('Removed referral link section');
}

// Replace Training Hub / Marketing Kit / KYC cards with service cards
const serviceCards =             <div className="grid md:grid-cols-4 gap-4">
              <Link to="/apply-loan" className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-xl p-5 hover:scale-[1.02] transition-transform">
                <p className="text-2xl">\u{1F3E6}</p><p className="font-bold mt-1">Loans</p><p className="text-xs opacity-80 mt-1">Personal, home, business loans</p>
              </Link>
              <Link to="/insurance" className="bg-gradient-to-br from-emerald-600 to-emerald-500 text-white rounded-xl p-5 hover:scale-[1.02] transition-transform">
                <p className="text-2xl">\u{1F6E1}\u{FE0F}</p><p className="font-bold mt-1">Insurance</p><p className="text-xs opacity-80 mt-1">Health, life, motor cover</p>
              </Link>
              <Link to="/investments" className="bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-xl p-5 hover:scale-[1.02] transition-transform">
                <p className="text-2xl">\u{1F4C8}</p><p className="font-bold mt-1">Investments</p><p className="text-xs opacity-80 mt-1">FD, mutual funds, SIP plans</p>
              </Link>
              <Link to="/accounting" className="bg-gradient-to-br from-violet-600 to-violet-500 text-white rounded-xl p-5 hover:scale-[1.02] transition-transform">
                <p className="text-2xl">\u{1F4CA}</p><p className="font-bold mt-1">Accounting</p><p className="text-xs opacity-80 mt-1">GST, ITR, bookkeeping</p>
              </Link>
              <Link to="/services" className="bg-gradient-to-br from-orange-500 to-orange-400 text-white rounded-xl p-5 hover:scale-[1.02] transition-transform">
                <p className="text-2xl">\u{1F9FE}</p><p className="font-bold mt-1">CSC Services</p><p className="text-xs opacity-80 mt-1">PAN, Aadhaar, Shop Act & more</p>
              </Link>
              <Link to="/govt-schemes" className="bg-gradient-to-br from-teal-600 to-teal-500 text-white rounded-xl p-5 hover:scale-[1.02] transition-transform">
                <p className="text-2xl">\u{1F3DB}\u{FE0F}</p><p className="font-bold mt-1">Govt Schemes</p><p className="text-xs opacity-80 mt-1">AVM, PMEGP, Mudra & more</p>
              </Link>
              <Link to="/tracker" className="bg-gradient-to-br from-golden to-amber-500 text-foreground rounded-xl p-5 hover:scale-[1.02] transition-transform">
                <p className="text-2xl">\u{1F4B0}</p><p className="font-bold mt-1">Cash Flow</p><p className="text-xs opacity-80 mt-1">15-day free accounting trial</p>
              </Link>
            </div>;

// Find and replace the Training Hub grid
let trainStart = -1;
let trainEnd = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Training Hub')) {
    for (let j = i; j >= 0; j--) {
      if (lines[j].includes('grid md:grid-cols-3')) {
        trainStart = j;
        break;
      }
    }
    for (let j = i; j < lines.length; j++) {
      if (lines[j].trim() === '</div>' && j > i + 5) {
        trainEnd = j;
        break;
      }
    }
    break;
  }
}

if (trainStart > 0 && trainEnd > 0) {
  lines.splice(trainStart, trainEnd - trainStart + 1, serviceCards);
  console.log('Replaced training cards with service cards');
}

// Remove refLink variable
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const refLink =')) {
    lines[i] = '';
    console.log('Removed refLink variable');
    break;
  }
}

fs.writeFileSync(p, lines.join('\n'), 'utf8');
console.log('Done!');
