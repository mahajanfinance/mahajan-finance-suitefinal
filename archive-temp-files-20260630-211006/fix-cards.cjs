const fs = require("fs");
const path = require("path");
const src = path.join(process.cwd(), "src", "components", "ServicesGrid.tsx");
let f = fs.readFileSync(src, "utf8");
let changes = 0;

// 1. Fix Voter ID price: 100 -> 200
const b1 = f;
f = f.replace(/label:\s*"Voter ID",\s*price:\s*100/, 'label: "Voter ID", price: 200');
if (f !== b1) { changes++; console.log("OK: Voter ID price 100 -> 200"); }

// 2. Remove duplicate Aadhaar from IEC
const b2 = f;
f = f.replace(/docs:\s*\[\s*"Aadhaar Card",\s*"Aadhaar Card"/, 'docs: ["Aadhaar Card"');
if (f !== b2) { changes++; console.log("OK: IEC duplicate Aadhaar removed"); }

// 3. Add useState import if missing
if (!f.includes("useState")) {
  if (f.match(/import\s*\{[^}]*\}\s*from\s*["']react["']/)) {
    f = f.replace(/import\s*\{([^}]*)\}\s*from\s*["']react["']/, (m, g1) => 'import { useState, ' + g1.trim() + ' } from "react"');
  } else if (f.match(/import\s+React\s+from\s*["']react["']/)) {
    f = f.replace(/import\s+React\s+from\s*["']react["']/, 'import React, { useState } from "react"');
  } else {
    f = 'import { useState } from "react";\n' + f;
  }
  changes++; console.log("OK: Added useState import");
}

// 4. Replace CSCServiceCard component
const fs2 = f.indexOf("function CSCServiceCard");
if (fs2 === -1) { console.log("ERROR: CSCServiceCard not found"); process.exit(1); }

let depth = 0, inStr = false, strCh = '', fe = -1;
for (let i = fs2; i < f.length; i++) {
  const c = f[i];
  if (inStr) {
    if (c === '\\') { i++; continue; }
    if (c === strCh) inStr = false;
    continue;
  }
  if (c === '"' || c === "'" || c === '`') { inStr = true; strCh = c; continue; }
  if (c === '{') depth++;
  if (c === '}') { depth--; if (depth === 0) { fe = i + 1; break; } }
}
if (fe === -1) { console.log("ERROR: function end not found"); process.exit(1); }

var comp = [
  'function CSCServiceCard({ icon: Icon, label, price, docs }: { icon: any; label: string; price: number; docs: string[] }) {',
  '  const [files, setFiles] = useState<Record<string, File[]>>({});',
  '',
  '  const handleFile = (docName: string) => (e: any) => {',
  '    if (e.target.files) {',
  '      setFiles(prev => ({ ...prev, [docName]: Array.from(e.target.files) }));',
  '    }',
  '  };',
  '',
  '  return (',
  '    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow h-full">',
  '      <div className="flex items-center justify-between gap-3">',
  '        <div className="flex items-center gap-3 min-w-0">',
  '          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">',
  '            <Icon size={20} />',
  '          </div>',
  '          <h3 className="font-semibold text-gray-800 text-sm leading-tight truncate">{label}</h3>',
  '        </div>',
  '        <p className="text-blue-600 font-bold text-lg shrink-0">\u20B9{price}</p>',
  '      </div>',
  '      <div className="flex-1">',
  '        <p className="text-xs font-medium text-gray-500 mb-2">Required Documents:</p>',
  '        <div className="space-y-2">',
  '          {docs.map((doc, i) => (',
  '            <div key={i} className="flex items-center gap-2">',
  '              <span className="flex-1 text-xs text-gray-600 bg-gray-50 rounded-md px-3 py-2 truncate min-w-0">{doc}</span>',
  '              <label className="cursor-pointer shrink-0">',
  '                <input type="file" className="hidden" multiple onChange={handleFile(doc)} accept=".pdf,.jpg,.jpeg,.png" />',
  '                <span className="inline-flex items-center text-xs bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium whitespace-nowrap">{files[doc] ? files[doc].length + " selected" : "Upload"}</span>',
  '              </label>',
  '            </div>',
  '          ))}',
  '        </div>',
  '      </div>',
  '    </div>',
  '  );',
  '}'
].join('\n');

f = f.substring(0, fs2) + comp + f.substring(fe);
changes++; console.log("OK: CSCServiceCard replaced with upload buttons");

fs.writeFileSync(src, f, "utf8");
console.log("Done! " + changes + " changes applied");