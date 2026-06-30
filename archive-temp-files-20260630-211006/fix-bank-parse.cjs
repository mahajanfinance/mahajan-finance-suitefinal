const fs = require("fs");
const path = require("path");

// ===== Create client-side parser =====
const parser = [
'export interface ParsedMonth { month: string; balances: Record<string, number>; }',
'export interface ClientParseResult { success: boolean; bank?: string; holder?: string; months_data: ParsedMonth[]; abb_6m: number; abb_1y: number; error?: string; }',
'const ML: Record<string, number> = {jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};',
'const MN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];',
'function detectBank(t: string): string { const l=t.toLowerCase();',
'  if(l.includes("post payments")||l.includes("ippb")) return "India Post Payments Bank";',
'  if(l.includes("state bank")||l.includes("sbi")) return "State Bank of India";',
'  if(l.includes("hdfc")) return "HDFC Bank"; if(l.includes("icici")) return "ICICI Bank";',
'  if(l.includes("axis")) return "Axis Bank"; if(l.includes("kotak")) return "Kotak Mahindra Bank";',
'  if(l.includes("punjab")||l.includes("pnb")) return "Punjab National Bank";',
'  if(l.includes("baroda")) return "Bank of Baroda"; if(l.includes("canara")) return "Canara Bank";',
'  if(l.includes("union")) return "Union Bank of India"; if(l.includes("indian bank")) return "Indian Bank";',
'  return "Bank"; }',
'function detectHolder(t: string): string {',
'  const skip=/account|statement|branch|address|period|registered|customer|mobile|ifsc|micr|details|transaction|office/i;',
'  for(const l of t.split(/\\n/).map(s=>s.trim()).filter(s=>s.length>2&&s.length<60)){',
'    if(skip.test(l)||/^\\d/.test(l)) continue;',
'    if(/^[A-Z][A-Za-z.\\s]{2,45}$/.test(l)) return l; } return ""; }',
'function parseDate(s: string): {day:number;month:number;year:number}|null {',
'  let m=s.match(/(\\d{1,2})[\\/\\-](\\d{1,2})[\\/\\-](\\d{2,4})/);',
'  if(m){const y=m[3].length===2?2000+parseInt(m[3]):parseInt(m[3]);return{day:parseInt(m[1]),month:parseInt(m[2])-1,year:y};}',
'  m=s.match(/(\\d{1,2})[\\/\\-\\s](Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\\/\\-\\s](\\d{2,4})/i);',
'  if(m){const y=m[3].length===2?2000+parseInt(m[3]):parseInt(m[3]);return{day:parseInt(m[1]),month:ML[m[2].substring(0,3).toLowerCase()],year:y};}',
'  return null; }',
'function extractBal(line: string): number|null {',
'  const nums=line.match(/[\\d,]+(?:\\.\\d{1,2})?/g);',
'  if(!nums||nums.length<2) return null;',
'  for(let i=nums.length-1;i>=0;i--){const v=parseFloat(nums[i].replace(/,/g,""));if(!isNaN(v)&&v>=100)return v;}',
'  return null; }',
'export function parseBankStatementClient(text: string, sampleDays: number[], maxMonths: number): ClientParseResult {',
'  const bank=detectBank(text), holder=detectHolder(text);',
'  interface Entry{day:number;month:number;year:number;balance:number;monthKey:string;}',
'  const entries:Entry[]=[];',
'  for(const raw of text.split(/\\n/)){const line=raw.trim();if(!line)continue;',
'    const d=parseDate(line);if(!d)continue;const bal=extractBal(line);if(bal===null)continue;',
'    entries.push({...d,balance:bal,monthKey:MN[d.month]+" "+d.year});}',
'  if(entries.length<3) return{success:false,error:"Could not extract enough date-balance entries ("+entries.length+")",bank,holder,months_data:[],abb_6m:0,abb_1y:0};',
'  const mm=new Map<string,Entry[]>();',
'  for(const e of entries){if(!mm.has(e.monthKey))mm.set(e.monthKey,[]);mm.get(e.monthKey)!.push(e);}',
'  const sorted=Array.from(mm.keys()).sort((a,b)=>{const[am,ay]=a.split(" "),[bm,by]=b.split(" ");',
'    if(ay!==by)return parseInt(ay)-parseInt(by);return ML[am.toLowerCase()]-ML[bm.toLowerCase()];});',
'  const target=sorted.slice(-maxMonths);',
'  const months_data:ParsedMonth[]=target.map(mk=>{const me=mm.get(mk)!;const b:Record<string,number>={};',
'    for(const day of sampleDays){let cl=me[0],md=Infinity;for(const e of me){const d=Math.abs(e.day-day);if(d<md){md=d;cl=e;}}',
'      if(md<=3)b[String(day)]=cl.balance;}return{month:mk,balances:b};});',
'  function calcABB(data:ParsedMonth[]):number{let s=0,c=0;for(const m of data){const v=Object.values(m.balances).filter(x=>x>0);',
'    if(v.length>0){s+=v.reduce((a,b)=>a+b,0)/v.length;c++;}}return c>0?s/c:0;}',
'  return{success:true,bank,holder,months_data,abb_6m:calcABB(months_data.slice(-6)),abb_1y:calcABB(months_data)};}'
].join('\n');
fs.writeFileSync(path.join(process.cwd(),"src","lib","parseBankClient.ts"), parser, "utf8");
console.log("Created: src/lib/parseBankClient.ts");

// ===== Modify BankingSurrogate.tsx =====
const src = path.join(process.cwd(),"src","pages","BankingSurrogate.tsx");
let f = fs.readFileSync(src, "utf8");
const lines = f.split("\n");

let lucideLine=-1, extractLine=-1, debugLine=-1, parsedMetaLine=-1, rzpLine=-1, returnLine=-1;
for(let i=0;i<lines.length;i++){
  if(lines[i].includes('from "lucide-react"')&&lucideLine===-1) lucideLine=i;
  if(lines[i].includes('extractPdfText')&&extractLine===-1) extractLine=i;
  if(lines[i].includes('[BANK-PARSE] textContent length')) debugLine=i;
  if(lines[i].includes('setParsedMeta(')) parsedMetaLine=i;
  if(lines[i].includes('<RazorpayButton')&&rzpLine===-1) rzpLine=i;
  if(lines[i].match(/^\s*return\s*\(\s*$/)&&returnLine===-1) returnLine=i;
}
console.log("Lines:",{lucideLine,extractLine,debugLine,parsedMetaLine,rzpLine,returnLine});

// 1. Add Download to lucide imports
if(lucideLine!==-1&&!lines[lucideLine].includes("Download")){
  lines[lucideLine]=lines[lucideLine].replace("{","{ Download,");
}

// 2. Add new imports after extractPdfText
lines.splice(extractLine+1,0,
  'import { parseBankStatementClient } from "@/lib/parseBankClient";',
  'import jsPDF from "jspdf";');
debugLine+=2; parsedMetaLine+=2; rzpLine+=2; returnLine+=2;

// 3. Replace debug+invoke with server-then-client fallback
const newParse = [
  '      let md: MonthData[] = [], abb6mVal = 0, abb1yVal = 0, pMeta: { bank?: string; holder?: string } | null = null;',
  '      try {',
  '        const { data, error } = await supabase.functions.invoke("parse-bank-statement", {',
  '          body: { textContent, sampleDays: SAMPLE_DAYS, months: period === 1 ? 1 : period },',
  '        });',
  '        if (!error && data?.success) { md = data.months_data||[]; abb6mVal = data.abb_6m||0; abb1yVal = data.abb_1y||0; pMeta = { bank: data.bank, holder: data.account_holder }; }',
  '      } catch (_) { console.warn("[BANK-PARSE] Server unavailable, using client-side parsing"); }',
  '      if (md.length === 0) {',
  '        const result = parseBankStatementClient(textContent, SAMPLE_DAYS, period === 1 ? 1 : period);',
  '        if (!result.success) throw new Error(result.error || "Could not parse statement");',
  '        md = result.months_data; abb6mVal = result.abb_6m; abb1yVal = result.abb_1y; pMeta = { bank: result.bank, holder: result.holder };',
  '      }',
  '      setMonthsData(md); setAbb6m(abb6mVal); setAbb1y(abb1yVal); setParsedMeta(pMeta);'
];
const rmCount = parsedMetaLine - debugLine + 1;
lines.splice(debugLine, rmCount, ...newParse);
returnLine += (newParse.length - rmCount);
rzpLine += (newParse.length - rmCount);

// 4. Add generatePdf function before return
const pdfFunc = [
  '  const generatePdf = () => {',
  '    const doc = new jsPDF();',
  '    doc.setFontSize(18); doc.setFont("helvetica","bold"); doc.text("Banking Surrogate Analysis Report",105,20,{align:"center"});',
  '    doc.setFontSize(10); doc.setFont("helvetica","normal");',
  '    if(parsedMeta?.bank) doc.text("Bank: "+parsedMeta.bank,14,35);',
  '    if(parsedMeta?.holder) doc.text("Account Holder: "+parsedMeta.holder,14,42);',
  '    doc.text("Generated: "+new Date().toLocaleDateString("en-IN"),14,49);',
  '    doc.setDrawColor(0,102,204); doc.setLineWidth(0.5); doc.line(14,54,196,54);',
  '    let y=65; doc.setFontSize(12); doc.setFont("helvetica","bold"); doc.text("Monthly Closing Balances",14,y); y+=8;',
  '    doc.setFontSize(9); doc.setFillColor(240,240,240); doc.rect(14,y-4,182,7,"F");',
  '    doc.text("Month",16,y); [5,10,15,20,25,30].forEach((d,i)=>doc.text("Day "+d,55+i*22,y));',
  '    doc.text("Average",185,y,{align:"right"}); y+=8; doc.setFont("helvetica","normal");',
  '    monthsData.forEach((m,idx)=>{',
  '      if(y>270){doc.addPage();y=20;}',
  '      if(idx%2===0){doc.setFillColor(248,248,255);doc.rect(14,y-4,182,7,"F");}',
  '      doc.text(m.month,16,y);',
  '      const vals=[5,10,15,20,25,30].map(d=>m.balances?.[String(d)]||0);',
  '      vals.forEach((v,i)=>doc.text(v?"\\u20B9"+Math.round(v).toLocaleString("en-IN"):"-",55+i*22,y));',
  '      const avg=vals.filter(v=>v>0); const a=avg.length?avg.reduce((x,y)=>x+y,0)/avg.length:0;',
  '      doc.setFont("helvetica","bold"); doc.text("\\u20B9"+Math.round(a).toLocaleString("en-IN"),185,y,{align:"right"});',
  '      doc.setFont("helvetica","normal"); y+=7; });',
  '    y+=10; if(y>250){doc.addPage();y=20;}',
  '    doc.setDrawColor(0,102,204); doc.line(14,y-5,196,y-5);',
  '    doc.setFontSize(12); doc.setFont("helvetica","bold"); doc.text("Loan Eligibility Summary",14,y); y+=10;',
  '    doc.setFontSize(10);',
  '    [["ABB Used","\\u20B9"+Math.round(abb).toLocaleString("en-IN")],["Multiplier",multiplier+"x"],',
  '     ["Eligible Loan","\\u20B9"+Math.round(eligibleLoan).toLocaleString("en-IN")],["Tenure",tenure+" months"],',
  '     ["Interest Rate","14% p.a."],["Monthly EMI","\\u20B9"+Math.round(monthlyEMI).toLocaleString("en-IN")]].forEach(([l,v])=>{',
  '      doc.setFont("helvetica","normal"); doc.text(l+":",14,y);',
  '      doc.setFont("helvetica","bold"); doc.text(v,196,y,{align:"right"}); y+=7; });',
  '    y+=10; doc.setFontSize(8); doc.setFont("helvetica","italic"); doc.setTextColor(128,128,128);',
  '    doc.text("Indicative calculation. Final approval depends on bank policy, CIBIL score & verification.",105,y,{align:"center"});',
  '    doc.save("Banking-Surrogate-Report.pdf");',
  '  };', ''
];
lines.splice(returnLine, 0, ...pdfFunc);

// 5. Add PDF button before Razorpay
let rzpIdx = -1;
for(let i=0;i<lines.length;i++){ if(lines[i].includes('<RazorpayButton')){rzpIdx=i;break;} }
if(rzpIdx!==-1){
  lines.splice(rzpIdx,0,
    '              {monthsData.length > 0 && (',
    '                <button onClick={generatePdf} className="w-full py-3 border-2 border-primary text-primary font-bold rounded-lg hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center gap-2 mb-3">',
    '                  <Download size={16} /> Download PDF Report',
    '                </button>',
    '              )}');
}

fs.writeFileSync(src, lines.join("\n"), "utf8");
console.log("Modified: BankingSurrogate.tsx");
console.log("DONE!");