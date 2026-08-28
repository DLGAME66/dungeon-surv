// 在四语言版菜单注入「运营数据」按钮，并把 stats.html 同步到四个语言目录
const fs = require('fs');
const files = ['docs/index.html', 'docs/en/index.html', 'docs/ja/index.html', 'docs/kr/index.html'];
const btn = `  <button class="btn" style="background:#17a2b8" id="btn-stats" onclick="location.href='stats.html'">📊 运营数据</button>\n`;
for (const f of files) {
  let s = fs.readFileSync(f, 'utf8');
  if (s.includes('id="btn-stats"')) { console.log('SKIP (already):', f); continue; }
  const re = /<button class="btn btn-purple" id="btn-offline">[^\n]*\n/;
  if (re.test(s)) {
    s = s.replace(re, m => m + btn);
    fs.writeFileSync(f, s, 'utf8');
    console.log('INJECTED:', f);
  } else {
    console.log('WARN no anchor in', f);
  }
}
fs.copyFileSync('docs/stats.html', 'docs/en/stats.html');
fs.copyFileSync('docs/stats.html', 'docs/ja/stats.html');
fs.copyFileSync('docs/stats.html', 'docs/kr/stats.html');
console.log('COPIED stats.html -> docs/en / docs/ja / docs/kr');
