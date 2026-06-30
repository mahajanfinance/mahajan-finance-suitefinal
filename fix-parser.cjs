const fs = require('fs');
const fp = require('path').join(__dirname, 'src/lib/parseBankClient.ts');
fs.writeFileSync(fp, `export interface ParsedMonth { month: string; balances: Record<string, number>; }
export interface ClientParseResult { success: boolean; bank?: string; holder?: string; months_data: ParsedMonth[]; abb_6m: number; abb_1y: number; error?: string; }
const ML: Record<string, number> = {jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};
const MN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function detectBank(t: string): string {
  const l = t.toLowerCase();
  if (l.includes("post payments") || l.includes("ippb")) return "India Post Payments Bank";
  if (l.includes("state bank") || l.includes("sbi")) return "State Bank of India";
  if (l.includes("hdfc")) return "HDFC Bank"; if (l.includes("icici")) return "ICICI Bank";
  if (l.includes("axis")) return "Axis Bank"; if (l.includes("kotak")) return "Kotak Mahindra Bank";
  if (l.includes("punjab") || l.includes("pnb")) return "Punjab National Bank";
  if (l.includes("baroda")) return "Bank of Baroda"; if (l.includes("canara")) return "Canara Bank";
  if (l.includes("union bank")) return "Union Bank of India";
  return "Bank";
}

function detectHolder(t: string): string {
  const skip = /account|statement|branch|address|period|registered|customer|mobile|ifsc|micr|details|transaction|office|a\\/c/i;
  for (const l of t.split(/\\n/).map(s => s.trim()).filter(s => s.length > 2 && s.length < 60)) {
    if (skip.test(l) || /^\\d/.test(l)) continue;
    if (/^[A-Z][A-Za-z.\\s]{2,45}$/.test(l)) return l;
  }
  return "";
}

function parseDate(s: string): { day: number; month: number; year: number } | null {
  let m = s.match(/(\\d{1,2})[\\/\\-](\\d{1,2})[\\/\\-](\\d{4})\\b/);
  if (m) return { day: parseInt(m[1]), month: parseInt(m[2]) - 1, year: parseInt(m[3]) };
  m = s.match(/(\\d{1,2})[\\/\\-](\\d{1,2})[\\/\\-](\\d{2})(?!\\d)/);
  if (m) { let y=parseInt(m[3]); y=y>=50?1900+y:2000+y; return { day: parseInt(m[1]), month: parseInt(m[2])-1, year: y }; }
  m = s.match(/(\\d{1,2})[\\/\\-\\s](Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\\/\\-\\s](\\d{4})/i);
  if (m) return { day: parseInt(m[1]), month: ML[m[2].substring(0, 3).toLowerCase()], year: parseInt(m[3]) };
  m = s.match(/(\\d{1,2})[\\/\\-\\s](Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\\/\\-\\s](\\d{2})(?!\\d)/i);
  if (m) { let y=parseInt(m[3]); y=y>=50?1900+y:2000+y; return { day: parseInt(m[1]), month: ML[m[2].substring(0, 3).toLowerCase()], year: y }; }
  return null;
}

function extractBalance(line: string): number | null {
  const matches = line.match(/\\d[\\d,]*\\.\\d{2}/g);
  if (!matches || matches.length === 0) return null;
  const last = matches[matches.length - 1].replace(/,/g, "");
  const val = parseFloat(last);
  return isNaN(val) ? null : val;
}

export function parseBankStatementClient(
  text: string,
  sampleDays: number[],
  maxMonths: number
): ClientParseResult {
  const bank = detectBank(text);
  const holder = detectHolder(text);
  const lines = text.split(/\\n/).map(l => l.trim()).filter(l => l.length > 0);

  // STEP 1: Find all lines with valid dates
  interface DateLine { lineIdx: number; day: number; month: number; year: number; dateKey: string; monthKey: string; }
  const dateLines: DateLine[] = [];
  for (let i = 0; i < lines.length; i++) {
    const d = parseDate(lines[i]);
    if (!d) continue;
    dateLines.push({
      lineIdx: i, day: d.day, month: d.month, year: d.year,
      dateKey: String(d.day).padStart(2, "0") + "-" + String(d.month + 1).padStart(2, "0") + "-" + d.year,
      monthKey: MN[d.month] + " " + d.year,
    });
  }

  // STEP 2: For each date, search FORWARD across lines for closing balance
  // This handles PDF extraction that splits date and balance onto different lines
  interface Entry { day: number; month: number; year: number; balance: number; dateKey: string; monthKey: string; }
  const allEntries: Entry[] = [];

  for (let di = 0; di < dateLines.length; di++) {
    const dl = dateLines[di];
    let bestBal: number | null = null;
    // Search from this date line up to the next date (or 8 lines max)
    const nextDateLine = di + 1 < dateLines.length ? dateLines[di + 1].lineIdx : lines.length;
    const searchEnd = Math.min(nextDateLine, dl.lineIdx + 8);
    for (let j = dl.lineIdx; j < searchEnd; j++) {
      const bal = extractBalance(lines[j]);
      if (bal !== null) bestBal = bal; // last balance wins = closing balance
    }
    if (bestBal !== null) {
      allEntries.push({ day: dl.day, month: dl.month, year: dl.year, balance: bestBal, dateKey: dl.dateKey, monthKey: dl.monthKey });
    }
  }

  console.log("Parser: found " + dateLines.length + " dates, " + allEntries.length + " entries with balances");

  if (allEntries.length < 3) {
    return { success: false, error: "Could not extract enough transactions. Found " + allEntries.length + " entries from " + dateLines.length + " dates.", bank, holder, months_data: [], abb_6m: 0, abb_1y: 0 };
  }

  // STEP 3: Group by date (last entry per date = closing balance for that day)
  const dateBalances = new Map<string, number>();
  for (const e of allEntries) {
    dateBalances.set(e.dateKey, e.balance);
  }

  // STEP 4: Group dates by month
  const monthDates = new Map<string, { day: number; balance: number }[]>();
  for (const [dateKey, balance] of dateBalances) {
    const entry = allEntries.find(e => e.dateKey === dateKey);
    if (!entry) continue;
    if (!monthDates.has(entry.monthKey)) monthDates.set(entry.monthKey, []);
    monthDates.get(entry.monthKey)!.push({ day: entry.day, balance });
  }

  // STEP 5: Sort months chronologically
  const sortedMonths = Array.from(monthDates.keys()).sort((a, b) => {
    const [am, ay] = a.split(" "); const [bm, by] = b.split(" ");
    if (ay !== by) return parseInt(ay) - parseInt(by);
    return ML[am.toLowerCase()] - ML[bm.toLowerCase()];
  });

  const targetMonths = sortedMonths.slice(-maxMonths);

  // STEP 6: Extract balances on target days per month
  const months_data: ParsedMonth[] = targetMonths.map(mk => {
    const dates = monthDates.get(mk)!;
    const balances: Record<string, number> = {};
    for (const targetDay of sampleDays) {
      let bestBal: number | null = null, bestDay = -1;
      for (const d of dates) {
        if (d.day <= targetDay && d.day > bestDay) { bestDay = d.day; bestBal = d.balance; }
      }
      if (bestBal === null) {
        for (const d of dates) {
          if (d.day >= targetDay && d.day <= targetDay + 1 && (bestBal === null || d.day < bestDay)) { bestBal = d.balance; bestDay = d.day; }
        }
      }
      if (bestBal !== null) balances[String(targetDay)] = bestBal;
    }
    return { month: mk, balances };
  });

  // STEP 7: Calculate ABB
  function calcABB(data: ParsedMonth[]): number {
    let totalSum = 0, totalCount = 0;
    for (const m of data) {
      const vals = Object.values(m.balances).filter(v => v > 0);
      if (vals.length > 0) { totalSum += vals.reduce((a, b) => a + b, 0) / vals.length; totalCount++; }
    }
    return totalCount > 0 ? totalSum / totalCount : 0;
  }

  return { success: true, bank, holder, months_data, abb_6m: calcABB(months_data.slice(-6)), abb_1y: calcABB(months_data) };
}
`, 'utf8');
console.log('DONE - Parser rewritten: now searches across lines for balances');
