const fs = require('fs');
const file = 'D:/GameProject/DungeonSurv/server/server.js';
let js = fs.readFileSync(file, 'utf8');

// Find the location to insert (before app.use(express.static))
const marker = "app.use(express.static('.'));\n";
if (js.includes("app.post('/api/bug_report'")) {
  console.log('Already has bug_report API, skip');
  process.exit(0);
}

const apiCode = `// ─── Bug报告+反馈API (v3) ──────────────────────────────\nconst bugReports = [];\napp.post('/api/bug_report', (req, res) => {\n  const report = {\n    id: 'BUG_' + Date.now() + '_' + Math.random().toString(36).slice(2,6).toUpperCase(),\n    ts: new Date().toISOString(),\n    version: req.body.version,\n    build: req.body.build,\n    auto: req.body.auto,\n    ua: req.body.ua,\n    count: req.body.logs ? req.body.logs.length : 0,\n    logs: (req.body.logs || []).slice(0, 10),\n  };\n  bugReports.push(report);\n  if (bugReports.length > 200) bugReports.splice(0, bugReports.length - 200);\n  console.log('[BUG] ' + report.id + ' auto=' + report.auto + ' count=' + report.count);\n  res.json({ success: true, id: report.id });\n});\napp.get('/api/bug_report/list', (req, res) => {\n  res.json({ reports: bugReports.slice(-20), total: bugReports.length });\n});\n\nconst feedbacks = [];\napp.post('/api/feedback', (req, res) => {\n  const fb = {\n    id: 'FB_' + Date.now() + '_' + Math.random().toString(36).slice(2,6).toUpperCase(),\n    ts: new Date().toISOString(),\n    version: req.body.version,\n    build: req.body.build,\n    type: req.body.type,\n    star: req.body.star,\n    text: req.body.text,\n    mode: req.body.mode,\n    user: req.body.user,\n    floor: req.body.floor,\n    url: req.body.url,\n  };\n  feedbacks.push(fb);\n  if (feedbacks.length > 200) feedbacks.splice(0, feedbacks.length - 200);\n  console.log('[FB] ' + fb.id + ' star=' + fb.star + ' type=' + fb.type + ' text=' + String(fb.text||'').substring(0,40));\n  res.json({ success: true, id: fb.id });\n});\napp.get('/api/feedback/list', (req, res) => {\n  res.json({ feedbacks: feedbacks.slice(-20), total: feedbacks.length });\n});\napp.get('/api/feedback/stats', (req, res) => {\n  const stars = feedbacks.filter(function(f){return f.star > 0;}).map(function(f){return f.star;});\n  const avg = stars.length ? (stars.reduce(function(a,b){return a+b;},0) / stars.length).toFixed(1) : 'N/A';\n  const byType = {};\n  feedbacks.forEach(function(f){ byType[f.type] = (byType[f.type]||0)+1; });\n  res.json({ total: feedbacks.length, avgStar: avg, stars: stars.length, byType: byType });\n});\n\n`;

js = js.replace(marker, apiCode + marker);
fs.writeFileSync(file, js, 'utf8');
console.log('OK: Server API patched');
console.log('Size: ' + fs.statSync(file).size + ' bytes');
