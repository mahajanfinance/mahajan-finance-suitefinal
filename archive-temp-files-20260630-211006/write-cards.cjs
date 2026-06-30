var fs = require('fs');
var base = 'D:\\\\mahajan-finance-suite-main cashflow added';

// Write the service cards HTML to a temp file
var cards = [];
cards.push('            <div className="grid md:grid-cols-4 gap-4">');
cards.push('              <Link to="/apply-loan" className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-xl p-5 hover:scale-[1.02] transition-transform">');
cards.push('                <p className="text-2xl">🏦</p><p className="font-bold mt-1">Loans</p><p className="text-xs opacity-80 mt-1">Personal, home, business loans</p>');
cards.push('              </Link>');
cards.push('              <Link to="/insurance" className="bg-gradient-to-br from-emerald-600 to-emerald-500 text-white rounded-xl p-5 hover:scale-[1.02] transition-transform">');
cards.push('                <p className="text-2xl">🛡️</p><p className="font-bold mt-1">Insurance</p><p className="text-xs opacity-80 mt-1">Health, life, motor cover</p>');
cards.push('              </Link>');
cards.push('              <Link to="/investments" className="bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-xl p-5 hover:scale-[1.02] transition-transform">');
cards.push('                <p className="text-2xl">📈</p><p className="font-bold mt-1">Investments</p><p className="text-xs opacity-80 mt-1">FD, mutual funds, SIP plans</p>');
cards.push('              </Link>');
cards.push('              <Link to="/accounting" className="bg-gradient-to-br from-violet-600 to-violet-500 text-white rounded-xl p-5 hover:scale-[1.02] transition-transform">');
cards.push('                <p className="text-2xl">📊</p><p className="font-bold mt-1">Accounting</p><p className="text-xs opacity-80 mt-1">GST, ITR, bookkeeping</p>');
cards.push('              </Link>');
cards.push('              <Link to="/services" className="bg-gradient-to-br from-orange-500 to-orange-400 text-white rounded-xl p-5 hover:scale-[1.02] transition-transform">');
cards.push('                <p className="text-2xl">🧾</p><p className="font-bold mt-1">CSC Services</p><p className="text-xs opacity-80 mt-1">PAN, Aadhaar, Shop Act and more</p>');
cards.push('              </Link>');
cards.push('              <Link to="/govt-schemes" className="bg-gradient-to-br from-teal-600 to-teal-500 text-white rounded-xl p-5 hover:scale-[1.02] transition-transform">');
cards.push('                <p className="text-2xl">🏛️</p><p className="font-bold mt-1">Govt Schemes</p><p className="text-xs opacity-80 mt-1">AVM, PMEGP, Mudra and more</p>');
cards.push('              </Link>');
cards.push('              <Link to="/tracker" className="bg-gradient-to-br from-golden to-amber-500 text-foreground rounded-xl p-5 hover:scale-[1.02] transition-transform">');
cards.push('                <p className="text-2xl">💰</p><p className="font-bold mt-1">Cash Flow</p><p className="text-xs opacity-80 mt-1">15-day free accounting trial</p>');
cards.push('              </Link>');
cards.push('            </div>');

fs.writeFileSync(base + '\\\\service-cards.txt', cards.join('\n'), 'utf8');
console.log('Cards file written');
