const fs = require('fs');
const p = 'D:\\\\mahajan-finance-suite-main cashflow added\\\\src\\\\pages\\\\Auth.tsx';
let lines = fs.readFileSync(p, 'utf8').split('\n');

// Find line 152 (0-indexed 151) with .insert and add profile upsert after it
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('.insert({ user_id: userId, role })')) {
    const newLine = "        await (supabase as any).from('profiles').upsert({ id: userId, user_type: role, email: '' }, { onConflict: 'id' });";
    if (i + 1 < lines.length && !lines[i + 1].includes('user_type')) {
      lines.splice(i + 1, 0, newLine);
      console.log('Profile upsert added after line ' + (i + 1));
    } else {
      console.log('Already has user_type nearby');
    }
    break;
  }
}

fs.writeFileSync(p, lines.join('\n'), 'utf8');
console.log('Done');
