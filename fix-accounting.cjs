const fs = require('fs');

const file = 'src/pages/AccountingServices.tsx';
let c = fs.readFileSync(file, 'utf8');

// 1. Add import
if (!c.includes('uploadDocsToStorage')) {
  const lastImport = c.lastIndexOf('import ');
  const importEnd = c.indexOf('\n', lastImport) + 1;
  c = c.slice(0, importEnd) + "import { uploadDocsToStorage } from '@/utils/uploadDocs';\n" + c.slice(importEnd);
}

// 2. Change uploadedDocs type from boolean to File
c = c.replace('Record<string, boolean>', 'Record<string, File>');

// 3. Store actual File instead of true
c = c.replace('if (file) next[docName] = true;', 'if (file) next[docName] = file;');

// 4. Add upload code before edge function call
if (!c.includes('const docUrls =')) {
  const marker = 'await supabase.functions.invoke("send-enquiry-email"';
  const uploadCode = 'const docFilesArr = Object.values(uploadedDocs).filter(f => f instanceof File) as File[];\n      const docUrls = await uploadDocsToStorage(supabase, docFilesArr, "ACC");\n      ';
  c = c.replace(marker, uploadCode + marker);
}

// 5. Replace empty documentUrls with actual
c = c.replace('documentUrls: [],', 'documentUrls: docUrls,');

fs.writeFileSync(file, c);
console.log('AccountingServices.tsx fixed!');
