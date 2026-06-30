import { SupabaseClient } from "@supabase/supabase-js";

export async function uploadDocsToStorage(
  supabase: SupabaseClient,
  files: File[],
  prefix?: string
): Promise<{ filename: string; url: string }[]> {
  const ref = (prefix || "DOC") + "_" + Date.now();
  const urls: { filename: string; url: string }[] = [];
  for (const f of files) {
    if (!f) continue;
    try {
      const safeName = f.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = ref + "/" + safeName;
      const { data } = await supabase.storage.from("loan-documents").upload(path, f);
      if (data) {
        const { data: pub } = supabase.storage.from("loan-documents").getPublicUrl(data.path);
        urls.push({ filename: f.name, url: pub.publicUrl });
      }
    } catch (e) { console.error("Doc upload failed:", e); }
  }
  return urls;
}
