const https = require('https');
function test(url) {
  return new Promise((resolve) => {
    const req = https.get(url, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Body:', d.substring(0, 300));
        resolve();
      });
    });
    req.on('error', e => {
      console.log('ERR:', e.message);
      resolve();
    });
  });
}
async function main() {
  console.log('Testing Railway health...');
  await test('https://dungeon-surv-server-production.up.railway.app/health');
  console.log('\nTesting bug_report API...');
  await test('https://dungeon-surv-server-production.up.railway.app/api/bug_report/list');
}
main();
