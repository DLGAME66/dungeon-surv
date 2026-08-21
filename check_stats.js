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

function ghReq(path) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'api.github.com',
      path: path,
      method: 'GET',
      headers: { 'User-Agent': 'dungeon-surv-check', 'Accept': 'application/vnd.github+json' }
    };
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', e => reject(e));
    req.end();
  });
}

async function main() {
  console.log('═══ 1. 服务器状态 ═══');
  let r = await httpReq('GET', '/health');
  console.log('Status:', r.status, 'Body:', r.body);

  console.log('\n═══ 2. Bug报告列表 ═══');
  r = await httpReq('GET', '/api/bug_report/list');
  console.log('Status:', r.status);
  try {
    const data = JSON.parse(r.body);
    console.log('Total:', data.total);
    if (data.reports && data.reports.length) {
      data.reports.forEach(rep => {
        console.log(`- [${rep.ts}] v${rep.version} auto=${rep.auto} count=${rep.count} logs=${JSON.stringify(rep.logs || []).substring(0, 120)}`);
      });
    } else {
      console.log('(无报告)');
    }
  } catch(e) { console.log('Body:', r.body.substring(0, 500)); }

  console.log('\n═══ 3. 用户反馈统计 ═══');
  r = await httpReq('GET', '/api/feedback/stats');
  console.log('Status:', r.status, 'Body:', r.body);

  console.log('\n═══ 4. 用户反馈列表 ═══');
  r = await httpReq('GET', '/api/feedback/list');
  console.log('Status:', r.status);
  try {
    const data = JSON.parse(r.body);
    console.log('Total:', data.total);
    if (data.feedbacks && data.feedbacks.length) {
      data.feedbacks.forEach(fb => {
        console.log(`- [${fb.ts}] ${fb.type} ${'★'.repeat(fb.star || 0)} "${fb.text}" (user:${fb.user||'?'} floor:${fb.floor})`);
      });
    } else {
      console.log('(无反馈)');
    }
  } catch(e) { console.log('Body:', r.body.substring(0, 500)); }

  console.log('\n═══ 5. GitHub 仓库数据 ═══');
  r = await ghReq('/repos/DLGAME66/dungeon-surv');
  console.log('Status:', r.status);
  try {
    const repo = JSON.parse(r.body);
    if (repo.message) {
      console.log('GitHub API:', repo.message);
    } else {
      console.log('仓库:', repo.full_name);
      console.log('Stars:', repo.stargazers_count);
      console.log('Forks:', repo.forks_count);
      console.log('Watchers:', repo.subscribers_count);
      console.log('Open Issues:', repo.open_issues_count);
      console.log('Created:', repo.created_at);
      console.log('Updated:', repo.updated_at);
      console.log('Language:', repo.language);
      console.log('Size:', repo.size, 'KB');
    }
  } catch(e) { console.log('Body:', r.body.substring(0, 300)); }

  console.log('\n═══ 6. 最近提交 ═══');
  r = await ghReq('/repos/DLGAME66/dungeon-surv/commits?per_page=5');
  console.log('Status:', r.status);
  try {
    const commits = JSON.parse(r.body);
    if (Array.isArray(commits)) {
      commits.forEach(c => {
        console.log(`- ${c.sha.substring(0,7)} ${c.commit.message.split('\n')[0]} (${c.commit.author.date})`);
      });
    }
  } catch(e) { console.log('Body:', r.body.substring(0, 300)); }
}
main().catch(e => console.error('ERR:', e.message));
