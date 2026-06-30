const fs = require('fs');
const base = 'D:\\\\mahajan-finance-suite-main cashflow added';

// Fix 1: Dashboard
let dash = fs.readFileSync(base + '\\\\src\\\\pages\\\\Dashboard.tsx', 'utf8');
dash = dash.replace('.from("profiles").select("*").eq("user_id", user.id)', '.from("profiles").select("*").eq("id", user.id)');
fs.writeFileSync(base + '\\\\src\\\\pages\\\\Dashboard.tsx', dash, 'utf8');
console.log('Fix 1 done');

// Fix 2: Auth - add profile upsert after user_roles insert
let auth = fs.readFileSync(base + '\\\\src\\\\pages\\\\Auth.tsx', 'utf8');
const oldCode = ".insert({ user_id: userId, role });";
const newCode = ".insert({ user_id: userId, role });\n        await (supabase as any).from('profiles').upsert({ id: userId, user_type: role, email: '' }, { onConflict: 'id' });";
if (auth.includes(oldCode) && !auth.includes('user_type: role')) {
  auth = auth.replace(oldCode, newCode);
  fs.writeFileSync(base + '\\\\src\\\\pages\\\\Auth.tsx', auth, 'utf8');
  console.log('Fix 2 done');
} else {
  console.log('Fix 2 skipped (already done or not found)');
}
