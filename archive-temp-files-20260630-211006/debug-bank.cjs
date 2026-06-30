const fs = require("fs");
const path = require("path");
const src = path.join(process.cwd(), "src", "pages", "BankingSurrogate.tsx");
let f = fs.readFileSync(src, "utf8");

// Add detailed error logging before the supabase invoke
const oldInvoke = `const { data, error } = await supabase.functions.invoke("parse-bank-statement", {
        body: { textContent, sampleDays: SAMPLE_DAYS, months: period === 1 ? 1 : period },
      });
      if (error || !data?.success) throw new Error(data?.error || "Parsing failed");`;

const newInvoke = `// Debug: log what we are sending
      console.log("[BANK-PARSE] textContent length:", textContent.length, "first 300 chars:", textContent.substring(0, 300));
      console.log("[BANK-PARSE] Invoking parse-bank-statement with period:", period);
      
      const { data, error } = await supabase.functions.invoke("parse-bank-statement", {
        body: { textContent, sampleDays: SAMPLE_DAYS, months: period === 1 ? 1 : period },
      });
      
      console.log("[BANK-PARSE] Raw response:", JSON.stringify(data || error, null, 2));
      
      if (error) {
        console.error("[BANK-PARSE] Supabase function error:", error);
        throw new Error("Supabase error: " + (error.message || JSON.stringify(error)));
      }
      if (!data?.success) {
        console.error("[BANK-PARSE] Function returned failure:", data);
        throw new Error(data?.error || data?.details || "Function returned unsuccessful response");
      };`;

if (f.includes(oldInvoke)) {
  f = f.replace(oldInvoke, newInvoke);
  fs.writeFileSync(src, f, "utf8");
  console.log("OK: Added debug logging");
} else {
  console.log("ERROR: Could not find the target code block");
  console.log("Searching for partial match...");
  if (f.includes('supabase.functions.invoke("parse-bank-statement"')) {
    console.log("Found invoke call but exact block differs. Showing context:");
    const idx = f.indexOf('supabase.functions.invoke("parse-bank-statement"');
    console.log(f.substring(Math.max(0, idx - 100), idx + 400));
  }
}