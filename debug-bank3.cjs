const fs = require("fs");
const path = require("path");
const src = path.join(process.cwd(), "src", "pages", "BankingSurrogate.tsx");
let f = fs.readFileSync(src, "utf8");

// Find the line with "textContent.trim()" throw
const lines = f.split("\n");
let insertIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("textContent.trim()") && lines[i].includes("Could not read")) {
    insertIdx = i + 1;
    break;
  }
}

// Find the line with "Parsing failed"
let errorIdx = -1;
for (let i = insertIdx || 0; i < lines.length; i++) {
  if (lines[i].includes("Parsing failed")) {
    errorIdx = i;
    break;
  }
}

if (insertIdx === -1 || errorIdx === -1) {
  console.log("ERROR: Could not locate target lines");
  console.log("insertIdx:", insertIdx, "errorIdx:", errorIdx);
  process.exit(1);
}

// Insert debug log after the trim check
const indent = lines[insertIdx].match(/^(\s*)/)[1];
lines.splice(insertIdx, 0,
  indent + 'console.log("[BANK-PARSE] textContent length:", textContent.length, "first 300 chars:", textContent.substring(0, 300));'
);

// Now errorIdx shifted by 1
errorIdx++;

// Replace the error line with detailed logging
const eIndent = lines[errorIdx].match(/^(\s*)/)[1];
lines.splice(errorIdx, 1,
  eIndent + 'console.log("[BANK-PARSE] Raw response:", JSON.stringify(data || error, null, 2));',
  eIndent + 'if (error) { console.error("[BANK-PARSE] Supabase error:", error); throw new Error("Supabase error: " + (error.message || JSON.stringify(error))); }',
  eIndent + 'if (!data?.success) { console.error("[BANK-PARSE] Function failed:", data); throw new Error(data?.error || data?.details || "Parsing failed"); }'
);

f = lines.join("\n");
fs.writeFileSync(src, f, "utf8");
console.log("OK: Debug logging added at lines", insertIdx + 1, "and", errorIdx + 1);