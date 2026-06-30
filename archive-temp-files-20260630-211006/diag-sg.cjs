const fs = require("fs");
const p = "D:\\mahajan-finance-suite-main cashflow added\\src\\components\\ServicesGrid.tsx";

// Read the broken file to understand line count
const current = fs.readFileSync(p, "utf8");
const lines = current.split("\n");
console.log("Current file has " + lines.length + " lines");

// Find where ServiceCard function starts
let scStart = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("const ServiceCard")) { scStart = i; break; }
}
console.log("ServiceCard starts at line " + (scStart + 1));

// Find handlePayment function
let hpStart = -1;
for (let i = scStart; i < lines.length; i++) {
  if (lines[i].includes("const handlePayment")) { hpStart = i; break; }
}
console.log("handlePayment starts at line " + (hpStart + 1));

// Check if handlePayment has proper closing - count braces from its start
let braceCount = 0;
let hpEnd = -1;
for (let i = hpStart; i < lines.length; i++) {
  for (const ch of lines[i]) {
    if (ch === "{") braceCount++;
    if (ch === "}") braceCount--;
  }
  if (braceCount === 0 && i > hpStart + 2) { hpEnd = i; break; }
}
console.log("handlePayment ends at line " + (hpEnd + 1));

// Show 5 lines after handlePayment
console.log("\nLines after handlePayment:");
for (let i = hpEnd + 1; i < Math.min(hpEnd + 8, lines.length); i++) {
  console.log((i+1) + ": " + lines[i]);
}
