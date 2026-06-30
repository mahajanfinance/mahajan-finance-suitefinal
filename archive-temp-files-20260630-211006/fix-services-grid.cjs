const fs = require('fs');

// Fix ServicesGrid.tsx
const file = 'src/components/ServicesGrid.tsx';
let c = fs.readFileSync(file, 'utf8');

// 1. Add import (after the last import line)
if (!c.includes('uploadDocsToStorage')) {
  const lastImport = c.lastIndexOf('import ');
  const importEnd = c.indexOf('\n', lastImport) + 1;
  c = c.slice(0, importEnd) + "import { uploadDocsToStorage } from '@/utils/uploadDocs';\n" + c.slice(importEnd);
}

// 2. Add upload code before docNames
if (!c.includes('const docUrls =')) {
  const old = 'const docNames = uploadedFiles.map(f => f.name).join(", ") || "Not uploaded";';
  const rep = 'const docUrls = await uploadDocsToStorage(supabase, uploadedFiles, "CSC");\n      const docNames = uploadedFiles.map(f => f.name).join(", ") || "Not uploaded";';
  c = c.replace(old, rep);
}

// 3. Ensure documentUrls in body
if (c.includes('documentUrls: docUrls,')) {
  console.log('documentUrls already in body');
} else {
  c = c.replace('Documents: docNames,', 'Documents: docNames,\n            documentUrls: docUrls,');
}

fs.writeFileSync(file, c);
console.log('ServicesGrid.tsx fixed!');
