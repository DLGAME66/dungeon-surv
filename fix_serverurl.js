const fs = require('fs');
const files = ['docs/index.html', 'docs/en/index.html', 'docs/ja/index.html', 'docs/kr/index.html'];
const re = /const SERVER_URL = location\.hostname === 'localhost' \|\| location\.hostname === '127\.0\.0\.1'\s*\r?\n\s*\? '[^']*' : '';/g;
const rep = "const SERVER_URL = 'https://dungeon-surv-server-production.up.railway.app';";
for (const f of files) {
  if (!fs.existsSync(f)) { console.log('SKIP 不存在:', f); continue; }
  let s = fs.readFileSync(f, 'utf8');
  const n = (s.match(re) || []).length;
  s = s.replace(re, rep);
  fs.writeFileSync(f, s);
  console.log(f, '-> 替换处数:', n);
}
console.log('修复完成');
