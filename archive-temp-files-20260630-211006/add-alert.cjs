const fs = require('fs');
const p = require('path').join(__dirname, 'src/pages/BankingSurrogate.tsx');
let c = fs.readFileSync(p, 'utf8');

// Remove ALL previous debug code first
const removes = [
  /console\.log\("=== PARSE DEBUG ==="\);\n?/g,
  /console\.log\("Text length:[^;]*;\n?/g,
  /console\.log\("Months found:[^;]*;\n?/g,
  /console\.log\("All entries count:[^;]*;\n?/g,
  /toast\.info\("Debug:[^"]*"\);\n?/g,
  /const tb=new Blob[^;]*;\n?/g,
  /const ta=document\.createElement[^;]*;\n?/g,
  /ta\.href=URL\.createObjectURL[^;]*;\n?/g,
  /ta\.download="[^"]*"[^;]*;\n?/g,
  /ta\.click\(\);\n?/g,
  /alert\("BANK TEXT[^"]*"\);\n?/g,
  /alert\("COPY THIS[^"]*"\);\n?/g,
  /\/\/ Download raw text[^\n]*\n?/g,
];
for (const r of removes) c = c.replace(r, '');

// Find the parseBankStatementClient call line-by-line and insert alert BEFORE it
const lines = c.split('\n');
let done = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('parseBankStatementClient(') && !lines[i].includes('import')) {
    const indent = lines[i].match(/^(\s*)/)[1];
    lines.splice(i, 0, indent + 'alert("COPY ALL TEXT BELOW AND PASTE TO CHAT:\\n" + textContent.substring(0, 2000));');
    done = true;
    console.log('Inserted alert at line ' + (i + 1));
    break;
  }
}
if (!done) { console.log('ERROR: parseBankStatementClient call not found'); process.exit(1); }
fs.writeFileSync(p, c, 'utf8');
console.log('DONE - build and upload PDF again');
