const fs = require("fs");
const path = require("path");
const S = [
["pan-card","PAN Card",250,"FileText",["Aadhaar Card","Date of Birth Proof","Passport Size Photo"]],
["shop-act","Shop Act License",1500,"Stamp",["Aadhaar Card","Rent Agreement / Ownership Proof","Passport Size Photo","NOC from Landlord"]],
["gst-registration","GST Registration",2000,"Receipt",["Aadhaar Card","PAN Card","Business Address Proof","Bank Account Details","Passport Size Photo","Business Registration Certificate"]],
["fssai","Food License (FSSAI)",3000,"UtensilsCrossed",["Aadhaar Card","PAN Card","Business Address Proof","Food Safety Plan","Passport Size Photo"]],
["udyam-msme","Udyam / MSME",500,"Factory",["Aadhaar Card","PAN Card","Business Address Proof","Bank Account Details"]],
["itr-filing","ITR Filing",499,"Calculator",["PAN Card","Aadhaar Card","Form 16 / 16A","Bank Statements","Investment Proofs (if any)"]],
["dsc","Digital Signature (DSC)",1500,"Key",["PAN Card","Aadhaar Card","Passport Size Photo","Mobile & Email (linked with Aadhaar)"]],
["iec","IEC Registration",2000,"Globe",["Aadhaar Card","Aadhaar Card","Business Address Proof","Bank Account Details","Cancelled Cheque"]],
["trade-license","Trade License",1000,"Landmark",["Aadhaar Card","PAN Card","Rent Agreement / Ownership Proof","Passport Size Photo","NOC from Landlord"]],
["passport","Passport",2500,"Plane",["Aadhaar Card","PAN Card","Date of Birth Proof","Address Proof","Passport Size Photo"]],
["society-trust","Society / Trust Registration",3000,"Building2",["PAN Card of Members","Aadhaar Card of Members","Address Proof","MOA & AOA / Trust Deed","Passport Size Photos of Members"]],
["trademark","Trademark Registration",1999,"ShieldCheck",["PAN Card","Aadhaar Card","Business Address Proof","Logo / Brand Image","MSME / Startup Certificate (if any)"]],
["pf-esic","PF / ESIC Registration",2000,"Briefcase",["PAN Card","Aadhaar Card","Business Registration Certificate","Bank Account Details","Employee List with Salary Details"]],
["prof-tax","Profession Tax",500,"Banknote",["PAN Card","Aadhaar Card","Business Address Proof","Employee Details (if applicable)"]],
["voter-id","Voter ID",100,"ClipboardCheck",["Aadhaar Card","Passport Size Photo","Address Proof"]]
];
const src = path.join(process.cwd(), "src", "components", "ServicesGrid.tsx");
let f = fs.readFileSync(src, "utf8");
const mk = "const cscServices = [";
const si = f.indexOf(mk);
let depth = 1, inStr = false, ei = -1;
for (let i = si + mk.length; i < f.length; i++) {
  const c = f[i];
  if ((c === '"' || c === "'") && f[i-1] !== '\\') inStr = !inStr;
  if (inStr) continue;
  if (c === "[") depth++;
  if (c === "]") { depth--; if (depth === 0) { ei = i + 1; break; } }
}
const block = S.map(s => {
  const d = s[4].map(x => '"'+x+'"').join(", ");
  return '    {\n      icon: '+s[3]+', label: "'+s[1]+'", price: '+s[2]+',\n      docs: ['+d+']\n    }';
}).join(",\n");
f = f.substring(0, si) + mk + "\n" + block + "\n]" + f.substring(ei);
fs.writeFileSync(src, f, "utf8");
console.log("OK! " + S.length + " services");