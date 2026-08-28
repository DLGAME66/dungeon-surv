// 把四个语言版的 SERVER_URL 强制替换为固定 Railway 地址（联机修复）
const fs = require('fs');
const files = ['docs/index.html', 'docs/en/index.html', 'docs/ja/index.html', 'docs/kr/index.html'];
const target = 'https://dungeon-surv-server-production.up.railway.app';
const re = /const\s+SERVER_URL\s*=\s*[^;]*;/g;
for (const f of files) {
  let s = fs.readFileSync(f, 'utf8');
  if (re.test(s)) {
    s = s.replace(re, `const SERVER_URL = '${target}';`);
    fs.writeFileSync(f, s, 'utf8');
    console.log('FIXED SERVER_URL:', f);
  } else {
    console.log('WARN: no match in', f, '-> found:', (s.match(/SERVER_URL[^;\n]*/) || ['none'])[0]);
  }
}
