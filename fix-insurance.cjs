const fs = require('fs');

const file = 'src/pages/InsuranceQuote.tsx';
let c = fs.readFileSync(file, 'utf8');

// 1. Add import
if (!c.includes('uploadDocsToStorage')) {
  const lastImport = c.lastIndexOf('import ');
  const importEnd = c.indexOf('\n', lastImport) + 1;
  c = c.slice(0, importEnd) + "import { uploadDocsToStorage } from '@/utils/uploadDocs';\n" + c.slice(importEnd);
}

// 2. Add upload code before edge function call
// Find the line before "await supabase.functions.invoke" and add upload
if (!c.includes('const docUrls =')) {
  const marker = 'await supabase.functions.invoke("send-enquiry-email"';
  const uploadCode = 'const docFilesArr = Object.values(docFiles).filter(Boolean) as File[];\n      const docUrls = await uploadDocsToStorage(supabase, docFilesArr, "INS");\n      ';
  c = c.replace(marker, uploadCode + marker);
}

// 3. Replace empty documentUrls with actual
c = c.replace('documentUrls: [],', 'documentUrls: docUrls,');

fs.writeFileSync(file, c);
console.log('InsuranceQuote.tsx fixed!');
