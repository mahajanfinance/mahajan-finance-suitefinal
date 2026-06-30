const fs = require('fs');

const file = 'src/pages/GovtSchemes.tsx';
let c = fs.readFileSync(file, 'utf8');

// 1. Add import
if (!c.includes('uploadDocsToStorage')) {
  const lastImport = c.lastIndexOf('import ');
  const importEnd = c.indexOf('\n', lastImport) + 1;
  c = c.slice(0, importEnd) + "import { uploadDocsToStorage } from '@/utils/uploadDocs';\n" + c.slice(importEnd);
}

// 2. Add file state after other useState hooks (find a nearby useState)
if (!c.includes('schemeFiles')) {
  c = c.replace(
    'const [submitted, setSubmitted] = useState(false);',
    'const [submitted, setSubmitted] = useState(false);\n  const [schemeFiles, setSchemeFiles] = useState<File[]>([]);'
  );
}

// 3. Add onChange to the file input
if (!c.includes('setSchemeFiles')) {
  c = c.replace(
    'type="file" accept=".jpg,.jpeg,.png,.pdf" multiple className="hidden" />',
    'type="file" accept=".jpg,.jpeg,.png,.pdf" multiple className="hidden" onChange={e => setSchemeFiles(Array.from(e.target.files || []))} />'
  );
}

// 4. Add upload code before edge function call
if (!c.includes('const docUrls =')) {
  const marker = 'await supabase.functions.invoke("send-enquiry-email"';
  const uploadCode = 'const docUrls = await uploadDocsToStorage(supabase, schemeFiles, "GOVT");\n      ';
  c = c.replace(marker, uploadCode + marker);
}

// 5. Replace empty documentUrls with actual
c = c.replace('documentUrls: [],', 'documentUrls: docUrls,');

fs.writeFileSync(file, c);
console.log('GovtSchemes.tsx fixed!');
