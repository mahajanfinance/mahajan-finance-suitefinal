const fs = require("fs");
const path = require("path");
const src = path.join(process.cwd(), "src", "components", "ServicesGrid.tsx");
let f = fs.readFileSync(src, "utf8");

const needed = ["FileText","Stamp","Receipt","UtensilsCrossed","Factory","Calculator","Key","Globe","Landmark","Plane","Building2","ShieldCheck","Briefcase","Banknote","ClipboardCheck"];

// Find the lucide-react import line
const importRe = /import\s*\{([^}]+)\}\s*from\s*["']lucide-react["']/;
const m = f.match(importRe);
if (!m) { console.log("ERROR: no lucide-react import found"); process.exit(1); }

const existing = m[1].split(",").map(s => s.trim()).filter(Boolean);
const missing = needed.filter(n => !existing.includes(n));
if (missing.length === 0) { console.log("All icons already imported"); process.exit(0); }

const allIcons = [...new Set([...existing, ...missing])];
const newImport = "import { " + allIcons.join(", ") + " } from \"lucide-react\";";
f = f.replace(importRe, newImport);
fs.writeFileSync(src, f, "utf8");
console.log("Added " + missing.length + " missing icons: " + missing.join(", "));