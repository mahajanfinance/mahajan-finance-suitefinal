const fs = require("fs");
const path = require("path");
const src = path.join(process.cwd(), "src", "pages", "BankingSurrogate.tsx");
let f = fs.readFileSync(src, "utf8");

const oldBlock = `if (!textContent.trim()) throw new Error("Could not read file content");

      const { data, error } = await supabase.functions.invoke("parse-bank-statement", {
        body: { textContent, sampleDays: SAMPLE_DAYS, months: period === 1 ? 1 : period },
      });
      if (error || !data?.success) throw new Error(data?.error || "Parsing failed");`;

const newBlock = `if (!textContent.trim()) throw new Error("Could not read file content");

      console.log("[BANK-PARSE] textContent length:", textContent.length, "first 300 chars:", textContent.substring(0, 300));

      const { data, error } = await supabase.functions.invoke("parse-bank-statement", {
        body: { textContent, sampleDays: SAMPLE_DAYS, months: period === 1 ? 1 : period },
      });

      console.log("[BANK-PARSE] Raw response:", JSON.stringify(data || error, null, 2));

      if (error) {
        console.error("[BANK-PARSE] Supabase error:", error);
        throw new Error("Supabase error: " + (error.message || JSON.stringify(error)));
      }
      if (!data?.success) {
        console.error("[BANK-PARSE] Function failed:", data);
        throw new Error(data?.error || data?.details || "Parsing failed");
      };`;

if (f.includes(oldBlock)) {
  f = f.replace(oldBlock, newBlock);
  fs.writeFileSync(src, f, "utf8");
  console.log("OK: Debug logging added");
} else {
  console.log("ERROR: Block still not found");
}