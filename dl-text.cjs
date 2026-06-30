const fs = require('fs');
const p = require('path').join(__dirname, 'src/pages/BankingSurrogate.tsx');
let c = fs.readFileSync(p, 'utf8');
c = c.replace(
  'console.log("TEXT SAMPLE (first 3000 chars):", textContent.substring(0, 3000));',
  'const tb=new Blob([textContent],{type:"text/plain"});const ta=document.createElement("a");ta.href=URL.createObjectURL(tb);ta.download="bank-extract.txt";ta.click();'
);
fs.writeFileSync(p, c, 'utf8');
console.log('DONE - upload the PDF again, it will auto-download bank-extract.txt');
