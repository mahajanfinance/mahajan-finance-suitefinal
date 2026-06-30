// Client-side PDF text extraction with password support using pdfjs-dist
import * as pdfjs from "pdfjs-dist";
// @ts-ignore - worker URL import handled by Vite
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

(pdfjs as any).GlobalWorkerOptions.workerSrc = workerSrc;

export async function extractPdfText(file: File, password?: string): Promise<string> {
  const buf = await file.arrayBuffer();
  const loadingTask = (pdfjs as any).getDocument({ data: buf, password: password || undefined });
  const pdf = await loadingTask.promise;
  let out = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const txt = await page.getTextContent();
    out += txt.items.map((it: any) => it.str).join(" ") + "\n";
  }
  return out;
}
