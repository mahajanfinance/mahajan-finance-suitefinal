const fs = require('fs');
const dir = require('path').join(__dirname, 'src');

// 1. FIX parseBankClient.ts - add 2-digit year support
const pp = require('path').join(dir, 'lib/parseBankClient.ts');
let pc = fs.readFileSync(pp, 'utf8');
const oldParse = `function parseDate(s: string): { day: number; month: number; year: number } | null {
  // DD-MM-YYYY or DD/MM/YYYY
  let m = s.match(/(\\d{1,2})[\\/\\-](\\d{1,2})[\\/\\-](\\d{4})/);
  if (m) return { day: parseInt(m[1]), month: parseInt(m[2]) - 1, year: parseInt(m[3]) };
  // DD-Mon-YYYY
  m = s.match(/(\\d{1,2})[\\/\\-\\s](Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\\/\\-\\s](\\d{4})/i);
  if (m) return { day: parseInt(m[1]), month: ML[m[2].substring(0, 3).toLowerCase()], year: parseInt(m[3]) };
  return null;
}`;
const newParse = `function parseDate(s: string): { day: number; month: number; year: number } | null {
  // DD-MM-YYYY or DD/MM/YYYY (4-digit year)
  let m = s.match(/(\\d{1,2})[\\/\\-](\\d{1,2})[\\/\\-](\\d{4})\\b/);
  if (m) return { day: parseInt(m[1]), month: parseInt(m[2]) - 1, year: parseInt(m[3]) };
  // DD-MM-YY or DD/MM/YY (2-digit year) - e.g. 05-01-26
  m = s.match(/(\\d{1,2})[\\/\\-](\\d{1,2})[\\/\\-](\\d{2})(?!\\d)/);
  if (m) { let y=parseInt(m[3]); y=y>=50?1900+y:2000+y; return { day: parseInt(m[1]), month: parseInt(m[2])-1, year: y }; }
  // DD-Mon-YYYY
  m = s.match(/(\\d{1,2})[\\/\\-\\s](Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\\/\\-\\s](\\d{4})/i);
  if (m) return { day: parseInt(m[1]), month: ML[m[2].substring(0, 3).toLowerCase()], year: parseInt(m[3]) };
  // DD-Mon-YY (2-digit year with month name)
  m = s.match(/(\\d{1,2})[\\/\\-\\s](Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\\/\\-\\s](\\d{2})(?!\\d)/i);
  if (m) { let y=parseInt(m[3]); y=y>=50?1900+y:2000+y; return { day: parseInt(m[1]), month: ML[m[2].substring(0, 3).toLowerCase()], year: y }; }
  return null;
}`;
if (pc.includes(oldParse)) {
  pc = pc.replace(oldParse, newParse);
  fs.writeFileSync(pp, pc, 'utf8');
  console.log('OK: parseBankClient.ts - 2-digit year support added');
} else {
  console.log('WARN: exact parseDate block not found, trying fallback...');
  // Fallback: replace just the function
  const startIdx = pc.indexOf('function parseDate(');
  const endMarker = 'return null;\n}';
  const endIdx = pc.indexOf(endMarker, startIdx) + endMarker.length;
  if (startIdx !== -1 && endIdx > startIdx) {
    pc = pc.substring(0, startIdx) + newParse + pc.substring(endIdx);
    fs.writeFileSync(pp, pc, 'utf8');
    console.log('OK: parseBankClient.ts - replaced via fallback');
  } else {
    console.log('ERROR: Could not find parseDate function');
  }
}

// 2. Add text sample debug to BankingSurrogate.tsx
const bs = require('path').join(dir, 'pages/BankingSurrogate.tsx');
let bc = fs.readFileSync(bs, 'utf8');
if (!bc.includes('console.log("TEXT SAMPLE:")) {
  bc = bc.replace(
    'toast.info("Debug: Text="',
    'console.log("TEXT SAMPLE (first 3000 chars):", textContent.substring(0, 3000));\n        toast.info("Debug: Text='
  );
  fs.writeFileSync(bs, bc, 'utf8');
  console.log('OK: BankingSurrogate.tsx - text sample debug added');
}
console.log('ALL DONE - Run npm run build, then upload PDF again and check console for TEXT SAMPLE');
