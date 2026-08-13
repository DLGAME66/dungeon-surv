const https = require('https');
function httpReq(method, path, body) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'dungeon-surv-server-production.up.railway.app',
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', e => reject(e));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  // Test new v3 endpoints
  console.log('=== Health ===');
  let r = await httpReq('GET', '/health');
  console.log('Status:', r.status, 'Body:', r.body.substring(0, 200));

  console.log('\n=== Bug Report (POST) ===');
  r = await httpReq('POST', '/api/bug_report', {
    logs: [{ level: 'INFO', msg: 'Test log entry', ts: Date.now() }],
    version: '3.0',
    build: '20260813',
    auto: false,
    ua: 'test-agent'
  });
  console.log('Status:', r.status, 'Body:', r.body.substring(0, 300));

  console.log('\n=== Bug Report (GET) ===');
  r = await httpReq('GET', '/api/bug_report/list');
  console.log('Status:', r.status, 'Body:', r.body.substring(0, 400));

  console.log('\n=== Feedback (POST) ===');
  r = await httpReq('POST', '/api/feedback', {
    star: 5,
    type: 'praise',
    text: 'Great game! v3 is awesome.',
    version: '3.0',
    build: '20260813',
    mode: 'online',
    user: 'Tester',
    floor: 50
  });
  console.log('Status:', r.status, 'Body:', r.body.substring(0, 300));

  console.log('\n=== Feedback Stats ===');
  r = await httpReq('GET', '/api/feedback/stats');
  console.log('Status:', r.status, 'Body:', r.body.substring(0, 300));
}
main().catch(e => console.error('ERR:', e.message));
