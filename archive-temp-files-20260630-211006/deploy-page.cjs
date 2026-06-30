const fs = require("fs");
const b64 = fs.readFileSync("page.b64.txt", "utf8").trim();
const buf = Buffer.from(b64, "base64");
fs.writeFileSync("src/pages/BankingSurrogate.tsx", buf.toString("utf8"));
console.log("[OK] Written", buf.length, "chars");
