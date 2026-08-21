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
  console.log('=== 模拟一次页面访问 ===');
  let r = await httpReq('POST', '/api/track', { uid: 'U_test_001', lang: 'zh', v: '3.1' });
  console.log('Status:', r.status, 'Body:', r.body);

  console.log('\n=== 访问统计 ===');
  r = await httpReq('GET', '/api/stats');
  console.log('Status:', r.status, 'Body:', r.body);
}
main().catch(e => console.error('ERR:', e.message));
