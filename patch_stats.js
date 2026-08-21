// DungeonSurv 访问统计补丁：server API + 4语言客户端埋点
const fs = require('fs');
const path = require('path');

// ═══ 1. 服务器端统计 API ═══
const serverFile = 'D:/GameProject/DungeonSurv/server/server.js';
let js = fs.readFileSync(serverFile, 'utf8');

if (!js.includes('/api/track')) {
  const statsCode = `
// ─── 访问统计 (v3.1) ────────────────────────────────────────
const stats = {
  pageViews: 0,
  uniqueVisitors: new Set(),
  firstSeen: Date.now(),
  lastSeen: Date.now(),
  daily: {},
};
app.post('/api/track', (req, res) => {
  const uid = req.body && req.body.uid;
  const lang = (req.body && req.body.lang) || 'unknown';
  const ver = (req.body && req.body.v) || '?';
  stats.pageViews++;
  if (uid) stats.uniqueVisitors.add(uid);
  const day = new Date().toISOString().substring(0, 10);
  stats.daily[day] = (stats.daily[day] || 0) + 1;
  stats.lastSeen = Date.now();
  res.json({ ok: true, pv: stats.pageViews, uv: stats.uniqueVisitors.size });
});
app.get('/api/stats', (req, res) => {
  res.json({
    pageViews: stats.pageViews,
    uniqueVisitors: stats.uniqueVisitors.size,
    firstSeen: new Date(stats.firstSeen).toISOString(),
    lastSeen: new Date(stats.lastSeen).toISOString(),
    daily: stats.daily,
  });
});
`;
  // 插到 bugReports 定义之前
  const marker = '// ─── Bug报告+反馈API (v3) ──────────────────────────────';
  if (js.includes(marker)) {
    js = js.replace(marker, statsCode + marker);
  } else {
    // 兜底：插到 app.use(express.static) 前
    js = js.replace("app.use(express.static('.'));", statsCode + "\napp.use(express.static('.'));");
  }
  fs.writeFileSync(serverFile, js, 'utf8');
  console.log('OK: server stats API added');
} else {
  console.log('SKIP: server stats API already exists');
}

// ═══ 2. 客户端埋点（4语言版本） ═══
const trackJS = [
"",
"// ─── 访问统计埋点 (v3.1) ─────────────────────────────────",
"(function() {",
"  try {",
"    if (!SERVER_URL) return;",
"    var uid = localStorage.getItem('DS_UID');",
"    if (!uid) {",
"      uid = 'U' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);",
"      localStorage.setItem('DS_UID', uid);",
"    }",
"    var p = location.pathname;",
"    var lang = p.indexOf('/en/') >= 0 ? 'en' : p.indexOf('/ja/') >= 0 ? 'ja' : p.indexOf('/kr/') >= 0 ? 'kr' : 'zh';",
"    var ver = (typeof GAME_VERSION !== 'undefined') ? GAME_VERSION : '?';",
"    fetch(SERVER_URL + '/api/track', {",
"      method: 'POST',",
"      headers: { 'Content-Type': 'application/json' },",
"      body: JSON.stringify({ uid: uid, lang: lang, v: ver })",
"    }).catch(function() {});",
"  } catch(e) {}",
"})();",
"",
].join('\n');

const langs = ['docs', 'docs/en', 'docs/ja', 'docs/kr'];
langs.forEach(dir => {
  const f = path.join('D:/GameProject/DungeonSurv', dir, 'index.html');
  let html = fs.readFileSync(f, 'utf8');
  if (html.includes('访问统计埋点')) {
    console.log('SKIP: ' + dir + ' already has tracking');
    return;
  }
  // 插到最后一个 </script> 之前
  const idx = html.lastIndexOf('</script>');
  if (idx === -1) { console.log('FAIL: ' + dir + ' no script tag'); return; }
  html = html.slice(0, idx) + trackJS + '\n' + html.slice(idx);
  fs.writeFileSync(f, html, 'utf8');
  console.log('OK: tracking added to ' + dir + '/index.html');
});

console.log('\nDONE');
