const fs = require('fs');
const p = require('path').join(__dirname, 'src/pages/BankingSurrogate.tsx');
let c = fs.readFileSync(p, 'utf8');

// Fix 1: paymentAmount in WhatsApp msg -> use SURROGATE_FEE
c = c.replace(/paymentAmount/g, 'SURROGATE_FEE');

// Fix 2: abbValue -> abb
c = c.replace(/abbValue/g, 'abb');

// Fix 3: abb useMemo - average ALL months not just [0]
c = c.replace(
  'const m = monthsData[0];\n      const vals = Object.values(m.balances).filter((v) => typeof v === "number");\n      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : manualAbb;',
  'let ts = 0, tm = 0;\n      for (const m of monthsData) {\n        const vs = Object.values(m.balances).filter((v) => typeof v === "number" && v > 0);\n        if (vs.length) { ts += vs.reduce((a, b) => a + b, 0) / vs.length; tm++; }\n      }\n      return tm > 0 ? ts / tm : manualAbb;'
);

fs.writeFileSync(p, c, 'utf8');
console.log('DONE - All 3 fixes applied');
