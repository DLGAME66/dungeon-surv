// DungeonSurv v3 补丁脚本
const fs = require('fs');
const path = require('path');

const file = process.argv[2] || path.join(__dirname, 'docs', 'index.html');
let html = fs.readFileSync(file, 'utf8');

if (html.includes('AD_SYSTEM')) {
  console.log('SKIP: v3 already applied');
  process.exit(0);
}

// CSS
const extraCSS = `
.ad-overlay{position:fixed;inset:0;background:rgba(0,0,0,.88);display:none;align-items:center;justify-content:center;z-index:500;backdrop-filter:blur(6px);flex-direction:column;gap:16px}
.ad-overlay.show{display:flex}
.ad-card{background:var(--panel);border:2px solid var(--gold);border-radius:22px;padding:28px 24px;text-align:center;max-width:340px;width:92vw;animation:slideDown .3s ease-out}
.ad-icon{font-size:52px;margin-bottom:8px}
.ad-title{font-size:18px;font-weight:900;color:var(--gold);margin-bottom:6px}
.ad-desc{font-size:13px;color:var(--muted);line-height:1.6;margin-bottom:16px}
.ad-progress{width:100%;height:6px;background:rgba(255,255,255,.1);border-radius:3px;overflow:hidden;margin-bottom:16px}
.ad-bar{height:100%;background:linear-gradient(90deg,#f0c040,#e04040);border-radius:3px;transition:width .5s linear;width:0%}
.ad-countdown{font-size:28px;font-weight:900;color:var(--gold);margin-bottom:4px}
.ad-sub{font-size:12px;color:var(--muted);margin-bottom:16px}
.ad-skip{color:var(--gold);font-size:13px;cursor:pointer;user-select:none;pointer-events:none;transition:opacity .3s}
.ad-reward{background:linear-gradient(135deg,#f0c040,#d09020);color:#fff;font-weight:900;padding:12px 24px;border-radius:14px;font-size:15px;display:none;animation:fadeInUp .4s}
.update-banner{position:fixed;top:52px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.9);border:1px solid var(--gold);border-radius:14px;padding:10px 18px;z-index:300;display:none;align-items:center;gap:12px;font-size:13px;white-space:nowrap;animation:slideDown .4s;max-width:min(360px,92vw)}
.update-banner.show{display:flex}
.update-dot{width:8px;height:8px;border-radius:50%;background:var(--gold);animation:pulse 1.5s infinite;flex-shrink:0}
.update-btn{padding:4px 12px;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;background:linear-gradient(135deg,#f0c040,#d09020);color:#fff}
.feedback-btn{position:fixed;bottom:14px;right:14px;width:44px;height:44px;border-radius:50%;border:none;background:linear-gradient(135deg,#4090f0,#2060c0);color:#fff;font-size:20px;cursor:pointer;z-index:200;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(64,144,240,.4);transition:transform .2s}
.feedback-btn:hover{transform:scale(1.1)}
.feedback-panel{position:fixed;bottom:70px;right:14px;background:var(--panel);border:1px solid var(--border);border-radius:16px;padding:16px;width:280px;z-index:200;display:none;flex-direction:column;gap:10px;animation:slideUp .3s;box-shadow:0 8px 32px rgba(0,0,0,.5)}
.feedback-panel.show{display:flex}
@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
.feedback-title{font-size:14px;font-weight:900;color:var(--gold)}
.feedback-input{background:var(--panel2);border:1px solid var(--border2);border-radius:8px;color:var(--text);padding:8px 10px;font-size:13px;font-family:inherit;outline:none;resize:none;width:100%;min-height:80px}
.feedback-input:focus{border-color:var(--blue)}
.feedback-type{display:flex;gap:6px;flex-wrap:wrap}
.ftype-btn{padding:3px 10px;border-radius:20px;border:1px solid var(--border);background:transparent;color:var(--muted);font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;transition:.2s}
.ftype-btn.active{background:rgba(64,144,240,.2);border-color:var(--blue);color:var(--blue)}
.feedback-stars{display:flex;gap:4px;justify-content:center}
.star-btn{font-size:22px;cursor:pointer;background:none;border:none;transition:transform .15s;color:#555}
.star-btn.active,.star-btn:hover{color:#f0c040;transform:scale(1.2)}
.bug-btn{position:fixed;bottom:14px;left:14px;width:36px;height:36px;border-radius:50%;border:1px solid var(--border);background:rgba(0,0,0,.7);color:var(--red);font-size:16px;cursor:pointer;z-index:200;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);transition:all .2s}
.bug-btn:hover{background:rgba(224,64,64,.2);border-color:var(--red);transform:scale(1.1)}
.bug-panel{position:fixed;bottom:60px;left:14px;background:var(--panel);border:1px solid var(--red);border-radius:16px;padding:16px;width:300px;z-index:200;display:none;flex-direction:column;gap:8px;animation:slideUp .3s;max-height:50vh;overflow-y:auto}
.bug-panel.show{display:flex}
.bug-title{font-size:13px;font-weight:900;color:var(--red)}
.bug-log{background:#0a0a14;border:1px solid #2a0a0a;border-radius:8px;padding:8px;font-size:11px;color:#f08080;max-height:120px;overflow-y:auto;line-height:1.5;font-family:monospace}
.version-tag{position:fixed;bottom:8px;left:50%;transform:translateX(-50%);font-size:10px;color:#444;z-index:50;pointer-events:none}
`;

html = html.replace('</style>', extraCSS + '\n</style>');
console.log('OK: CSS injected');

// HTML
const extraHTML = '\n<div class="ad-overlay" id="ad-overlay"><div class="ad-card"><div class="ad-icon" id="ad-icon">🎬</div><div class="ad-title" id="ad-title">观看广告获得奖励</div><div class="ad-desc" id="ad-desc">观看完广告即可获得丰厚奖励！</div><div class="ad-progress"><div class="ad-bar" id="ad-bar"></div></div><div class="ad-countdown" id="ad-countdown">5</div><div class="ad-sub" id="ad-sub">秒后可关闭</div><div class="ad-skip" id="ad-skip">⏳ 等待中...</div><button class="ad-reward" id="ad-reward-btn" onclick="AD_SYSTEM.collectReward()">🎁 领取奖励！</button></div></div>\n<div class="update-banner" id="update-banner"><div class="update-dot"></div><span id="update-text" style="color:var(--text)">发现新版本 v3.0！</span><button class="update-btn" id="update-btn" onclick="AUTO_UPDATE.apply()">立即更新</button></div>\n<button class="feedback-btn" id="feedback-btn" title="反馈" onclick="FEEDBACK.toggle()">💬</button>\n<div class="feedback-panel" id="feedback-panel"><div class="feedback-title">游戏反馈</div><div class="feedback-stars" id="feedback-stars"><button class="star-btn" onclick="FEEDBACK.setStar(1)">★</button><button class="star-btn" onclick="FEEDBACK.setStar(2)">★</button><button class="star-btn" onclick="FEEDBACK.setStar(3)">★</button><button class="star-btn" onclick="FEEDBACK.setStar(4)">★</button><button class="star-btn" onclick="FEEDBACK.setStar(5)">★</button></div><div class="feedback-type" id="feedback-type"><button class="ftype-btn active" onclick="FEEDBACK.setType(this,\'bug\')">Bug反馈</button><button class="ftype-btn" onclick="FEEDBACK.setType(this,\'suggest\')">建议</button><button class="ftype-btn" onclick="FEEDBACK.setType(this,\'praise\')">好评</button><button class="ftype-btn" onclick="FEEDBACK.setType(this,\'other\')">其他</button></div><textarea class="feedback-input" id="feedback-input" placeholder="请描述你的问题或建议..." maxlength="300"></textarea><button class="btn btn-blue" style="font-size:13px;padding:8px" onclick="FEEDBACK.submit()">提交反馈</button><div id="feedback-msg" style="font-size:11px;color:var(--green);text-align:center;display:none">感谢你的反馈！</div></div>\n<button class="bug-btn" id="bug-btn" title="报告Bug" onclick="BUG_LOGGER.toggle()">🐛</button>\n<div class="bug-panel" id="bug-panel"><div class="bug-title">错误日志 <span id="bug-count" style="color:var(--gold)">(0条)</span></div><div class="bug-log" id="bug-log">暂无错误记录</div><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn btn-sm" style="background:rgba(224,64,64,.2);color:var(--red);font-size:11px;padding:5px 10px;border:none;border-radius:8px;cursor:pointer" onclick="BUG_LOGGER.copy()">复制日志</button><button class="btn btn-sm" style="background:rgba(64,144,240,.2);color:var(--blue);font-size:11px;padding:5px 10px;border:none;border-radius:8px;cursor:pointer" onclick="BUG_LOGGER.send()">上报服务器</button><button class="btn btn-sm" style="background:rgba(80,80,96,.2);color:var(--muted);font-size:11px;padding:5px 10px;border:none;border-radius:8px;cursor:pointer" onclick="BUG_LOGGER.clear()">清除</button></div></div>\n<div class="version-tag" id="version-tag">v3.0 DungeonSurv</div>\n';

html = html.replace('</body>', extraHTML + '</body>');
console.log('OK: HTML injected');

// JS - build as plain string without template literals to avoid escaping issues
var extraJS = [
"// ===== DungeonSurv v3 Extension Systems =====",
"var GAME_VERSION = '3.0';",
"var GAME_BUILD = '20260813';",

"var AD_SYSTEM = {",
"  config: {",
"    deathRevivalsLeft: 3,",
"    lastDailyTime: 0,",
"    cooldowns: {}",
"  },",
"  play: function(type, onComplete) {",
"    var cfg = {",
"      death_revival: {icon:'💀', title:'死亡复活', desc:'观看广告即可免费复活！每局3次机会', reward:'revival'},",
"      floor_clear:   {icon:'🏆', title:'通关奖励', desc:'观看广告可获得双倍金币！', reward:'double_gold'},",
"      boss_kill:    {icon:'👹', title:'BOSS击杀奖励', desc:'观看广告获得额外奖励！', reward:'bonus_gold', value:100},",
"      daily_login:   {icon:'🎁', title:'每日首次奖励', desc:'今日首次观看广告，获得经验药水！', reward:'exp_potion', value:50},",
"    }[type];",
"    if (!cfg) { if(onComplete) onComplete(); return; }",
"    var overlay = document.getElementById('ad-overlay');",
"    document.getElementById('ad-icon').textContent = cfg.icon;",
"    document.getElementById('ad-title').textContent = cfg.title;",
"    document.getElementById('ad-desc').textContent = cfg.desc;",
"    document.getElementById('ad-countdown').textContent = '5';",
"    document.getElementById('ad-bar').style.width = '0%';",
"    document.getElementById('ad-skip').textContent = '⏳ 等待中...';",
"    document.getElementById('ad-skip').style.pointerEvents = 'none';",
"    document.getElementById('ad-reward-btn').style.display = 'none';",
"    overlay.classList.add('show');",
"    var seconds = 5;",
"    var elapsed = 0;",
"    var timer = setInterval(function() {",
"      elapsed += 100;",
"      seconds = Math.ceil((5000 - elapsed) / 1000);",
"      document.getElementById('ad-countdown').textContent = Math.max(0, seconds);",
"      document.getElementById('ad-bar').style.width = Math.min(100, elapsed / 5000 * 100) + '%';",
"      if (seconds <= 0) {",
"        clearInterval(timer);",
"        document.getElementById('ad-skip').textContent = '观看完成！';",
"        document.getElementById('ad-skip').style.pointerEvents = 'auto';",
"        document.getElementById('ad-reward-btn').style.display = 'block';",
"        window._adTimer = null;",
"      }",
"    }, 100);",
"    window._adComplete = onComplete;",
"    window._adType = type;",
"  },",
"  collectReward: function() {",
"    var type = window._adType || 'death_revival';",
"    var onComplete = window._adComplete;",
"    var overlay = document.getElementById('ad-overlay');",
"    if(overlay) overlay.classList.remove('show');",
"    var cfg = {",
"      death_revival: {icon:'💀', title:'死亡复活', desc:'观看广告即可免费复活！每局3次机会', reward:'revival'},",
"      floor_clear:   {icon:'🏆', title:'通关奖励', desc:'观看广告可获得双倍金币！', reward:'double_gold'},",
"      boss_kill:    {icon:'👹', title:'BOSS击杀奖励', desc:'观看广告获得额外奖励！', reward:'bonus_gold', value:100},",
"      daily_login:   {icon:'🎁', title:'每日首次奖励', desc:'今日首次观看广告，获得经验药水！', reward:'exp_potion', value:50},",
"    }[type] || {};",
"    var room = STATE.room;",
"    var me = room && room.players && room.players.find(function(p){return p.id === STATE.playerId;});",
"    switch(cfg.reward) {",
"      case 'revival':",
"        if (this.config.deathRevivalsLeft > 0 && me) {",
"          this.config.deathRevivalsLeft--;",
"          me.alive = true;",
"          me.hp = Math.floor(me.maxHp * 0.5);",
"          addGameLog('广告奖励：免费复活！剩余' + this.config.deathRevivalsLeft + '次');",
"          if(typeof showMilestone === 'function') showMilestone('💀','免费复活！','HP恢复至50%，本局剩余' + this.config.deathRevivalsLeft + '次复活机会','var(--green)');",
"          if(STATE.game) STATE.game.events.emit('room_update', room);",
"          if(typeof updateHUD === 'function') updateHUD(room);",
"        }",
"        break;",
"      case 'double_gold':",
"        if (me) {",
"          var bonus = Math.floor((me.gold||0) * 1);",
"          me.gold = (me.gold||0) + bonus;",
"          addGameLog('广告奖励：双倍金币！额外获得 ' + bonus + ' 金币');",
"          if(STATE.game) STATE.game.events.emit('room_update', room);",
"          if(typeof updateHUD === 'function') updateHUD(room);",
"        }",
"        break;",
"      case 'bonus_gold':",
"        if (me) { me.gold = (me.gold||0) + (cfg.value||100); addGameLog('广告奖励：+' + (cfg.value||100) + '金币！'); if(typeof updateHUD === 'function') updateHUD(room); }",
"        break;",
"      case 'exp_potion':",
"        if (me) {",
"          me.inventory = me.inventory || [];",
"          me.inventory.push({t:'elixir',n:'经验药水',ef:'exp',v:cfg.value||50});",
"          addGameLog('广告奖励：获得经验药水！');",
"        }",
"        break;",
"    }",
"    if(onComplete) onComplete();",
"    if(typeof BUG_LOGGER !== 'undefined' && BUG_LOGGER.info) BUG_LOGGER.info('AD','Reward: ' + cfg.reward);",
"  },",
"  onDeath: function() { this.play('death_revival'); },",
"  onFloorClear: function() { this.play('floor_clear'); },",
"  onBossKill: function() { this.play('boss_kill'); },",
"  onDailyFirst: function() {",
"    var now = Date.now();",
"    if (!this.config.lastDailyTime || now - this.config.lastDailyTime > 86400000) {",
"      this.config.lastDailyTime = now;",
"      this.play('daily_login');",
"    }",
"  }",
"};",

"var AUTO_UPDATE = {",
"  currentVersion: '3.0',",
"  check: function() {",
"    try {",
"      var stored = localStorage.getItem('DS_VERSION');",
"      if (stored && stored !== this.currentVersion) {",
"        var banner = document.getElementById('update-banner');",
"        if(banner) { document.getElementById('update-text').textContent = '发现新版本 v'+stored+'！'; banner.classList.add('show'); }",
"      }",
"      if (!window._updateInterval) {",
"        window._updateInterval = setInterval(function(){ AUTO_UPDATE.check(); }, 30*60*1000);",
"      }",
"      if(typeof BUG_LOGGER !== 'undefined' && BUG_LOGGER.info) BUG_LOGGER.info('Update','Check: v'+this.currentVersion);",
"    } catch(e) {}",
"  },",
"  apply: function() {",
"    var banner = document.getElementById('update-banner');",
"    if(banner) banner.classList.remove('show');",
"    localStorage.setItem('DS_VERSION', this.currentVersion);",
"    if(typeof showMilestone === 'function') showMilestone('⚡','正在更新...','页面将刷新以加载最新版本','var(--blue)');",
"    setTimeout(function(){ window.location.reload(); }, 1500);",
"  }",
"};",

"var BUG_LOGGER = {",
"  logs: [],",
"  maxLogs: 50,",
"  init: function() {",
"    var self = this;",
"    window.onerror = function(msg, src, line, col, err) {",
"      self.capture('ERROR', String(msg), {src:src, line:line, col:col, stack: err && err.stack});",
"      return false;",
"    };",
"    window.onunhandledrejection = function(e) {",
"      self.capture('UNHANDLED', 'Promise未捕获异常: ' + String(e.reason));",
"    };",
"    var origErr = console.error.bind(console);",
"    console.error = function() {",
"      var args = Array.prototype.slice.call(arguments);",
"      self.capture('CONSOLE_ERR', args.join(' '));",
"      origErr.apply(console, args);",
"    };",
"    this.info('Logger', 'Bug日志系统初始化 v' + GAME_VERSION);",
"  },",
"  capture: function(level, msg, extra) {",
"    var entry = {",
"      ts: Date.now(),",
"      t: new Date().toISOString(),",
"      level: level,",
"      msg: String(msg).substring(0, 200),",
"      version: GAME_VERSION,",
"      build: GAME_BUILD,",
"      mode: SERVER_URL ? 'online' : 'offline',",
"      user: STATE.playerName,",
"      floor: (STATE.room && STATE.room.currentFloor) || 0,",
"      extra: extra || {}",
"    };",
"    this.logs.push(entry);",
"    if (this.logs.length > this.maxLogs) this.logs.shift();",
"    this.updateUI();",
"    if ((level === 'ERROR' || level === 'UNHANDLED') && SERVER_URL) this._sendAuto(entry);",
"  },",
"  error: function(ctx, err) {",
"    var msg = err instanceof Error ? err.message : String(err);",
"    var stack = err instanceof Error ? err.stack : null;",
"    this.capture('ERROR', '[' + ctx + '] ' + msg, {stack: stack});",
"  },",
"  warn: function(ctx, msg) { this.capture('WARN', '[' + ctx + '] ' + msg); },",
"  info: function(ctx, msg) { this.capture('INFO', '[' + ctx + '] ' + msg); },",
"  updateUI: function() {",
"    var logEl = document.getElementById('bug-log');",
"    var countEl = document.getElementById('bug-count');",
"    if (!logEl) return;",
"    var errors = this.logs.filter(function(l){ return l.level==='ERROR'||l.level==='UNHANDLED'; });",
"    if(countEl) countEl.textContent = '(' + errors.length + '条)';",
"    if (!this.logs.length) { logEl.textContent = '暂无错误记录'; return; }",
"    var lines = this.logs.map(function(l) {",
"      var t = l.t.substring(11, 19);",
"      var lvl = l.level==='ERROR'||l.level==='UNHANDLED' ? '❌' : l.level==='WARN' ? '⚠️' : 'ℹ️';",
"      return t + ' ' + lvl + ' ' + l.msg;",
"    });",
"    logEl.textContent = lines.join('\\n');",
"    logEl.scrollTop = logEl.scrollHeight;",
"  },",
"  toggle: function() { var p=document.getElementById('bug-panel'); p.classList.toggle('show'); this.updateUI(); },",
"  copy: function() {",
"    var text = this.logs.map(function(l){ return '['+l.t+'] '+l.level+': '+l.msg; }).join('\\n');",
"    navigator.clipboard.writeText(text).then(function() {",
"      var el=document.getElementById('bug-log'); var orig=el.textContent;",
"      el.textContent='已复制到剪贴板！';",
"      setTimeout(function(){ el.textContent=orig; },1500);",
"    }).catch(function(){});",
"  },",
"  send: function() {",
"    if(!this.logs.length || !SERVER_URL) return;",
"    var self=this;",
"    fetch(SERVER_URL+'/api/bug_report',{method:'POST',headers:{'Content-Type':'application/json'},",
"      body: JSON.stringify({logs:this.logs,version:GAME_VERSION,ua:navigator.userAgent})})",
"    .then(function(r){return r.json();})",
"    .then(function(d){ self.info('Logger','上报成功: '+JSON.stringify(d)); })",
"    .catch(function(e){ self.warn('Logger','上报失败: '+e.message); });",
"  },",
"  _sendAuto: function(entry) {",
"    if(!SERVER_URL) return;",
"    fetch(SERVER_URL+'/api/bug_report',{method:'POST',headers:{'Content-Type':'application/json'},",
"      body: JSON.stringify({logs:[entry],auto:true,version:GAME_VERSION,ua:navigator.userAgent})})",
"    .catch(function(){});",
"  },",
"  clear: function() { this.logs=[]; this.updateUI(); this.info('Logger','日志已清除'); }",
"};",

"var FEEDBACK = {",
"  star: 0,",
"  type: 'bug',",
"  toggle: function() {",
"    var panel = document.getElementById('feedback-panel');",
"    panel.classList.toggle('show');",
"    if(panel.classList.contains('show')) document.getElementById('feedback-input').focus();",
"  },",
"  setStar: function(n) {",
"    this.star=n;",
"    document.querySelectorAll('.star-btn').forEach(function(btn,i){ btn.classList.toggle('active',i<n); });",
"    if(typeof BUG_LOGGER !== 'undefined' && BUG_LOGGER.info) BUG_LOGGER.info('Feedback','Rating: '+n+'stars');",
"  },",
"  setType: function(btn, type) {",
"    this.type=type;",
"    document.querySelectorAll('.ftype-btn').forEach(function(b){b.classList.remove('active');});",
"    btn.classList.add('active');",
"  },",
"  submit: function() {",
"    var text = (document.getElementById('feedback-input')||{}).value || '';",
"    text = text.trim();",
"    if(!text && this.star===0) { if(typeof BUG_LOGGER!=='undefined'&&BUG_LOGGER.warn) BUG_LOGGER.warn('Feedback','Empty'); return; }",
"    var payload = {ts:Date.now(),star:this.star,type:this.type,text:text,version:GAME_VERSION,build:GAME_BUILD,",
"      mode:SERVER_URL?'online':'offline',user:STATE.playerName,",
"      floor:(STATE.room&&STATE.room.currentFloor)||0,ua:navigator.userAgent,url:location.href};",
"    if(typeof BUG_LOGGER !== 'undefined' && BUG_LOGGER.info) BUG_LOGGER.info('Feedback','Submit: '+this.type+' '+this.star+' - '+text);",
"    if(SERVER_URL) {",
"      var self=this;",
"      fetch(SERVER_URL+'/api/feedback',{method:'POST',headers:{'Content-Type':'application/json'},",
"        body: JSON.stringify(payload)})",
"      .then(function(r){return r.json();})",
"      .then(function(){ self.info&&self.info('Feedback','Submitted OK'); })",
"      .catch(function(e){ if(typeof BUG_LOGGER!=='undefined'&&BUG_LOGGER.warn) BUG_LOGGER.warn('Feedback','Fail:'+e.message); });",
"    }",
"    var key='DS_FEEDBACKS'; var arr=JSON.parse(localStorage.getItem(key)||'[]'); arr.push(payload);",
"    if(arr.length>50) arr.splice(0,arr.length-50);",
"    localStorage.setItem(key,JSON.stringify(arr));",
"    if(document.getElementById('feedback-input')) document.getElementById('feedback-input').value='';",
"    this.star=0;",
"    document.querySelectorAll('.star-btn').forEach(function(btn){btn.classList.remove('active');});",
"    var msgEl=document.getElementById('feedback-msg');",
"    if(msgEl) { msgEl.style.display='block'; setTimeout(function(){ msgEl.style.display='none'; },3000); }",
"    if(typeof showMilestone==='function') showMilestone('✅','感谢反馈！','我们会认真对待每一条反馈','var(--green)');",
"  }",
"};",

"window.AD_SYSTEM = AD_SYSTEM;",
"window.AUTO_UPDATE = AUTO_UPDATE;",
"window.BUG_LOGGER = BUG_LOGGER;",
"window.FEEDBACK = FEEDBACK;",

"setTimeout(function(){",
"  if(typeof BUG_LOGGER !== 'undefined') BUG_LOGGER.init();",
"  if(typeof AUTO_UPDATE !== 'undefined') AUTO_UPDATE.check();",
"  if(typeof AD_SYSTEM !== 'undefined') AD_SYSTEM.onDailyFirst();",
"  if(typeof BUG_LOGGER !== 'undefined') BUG_LOGGER.info('Init','v'+GAME_VERSION+' ready');",
"}, 500);",

"// Hook game_over to trigger ads",
"var _origShowGameOver = typeof showGameOver !== 'undefined' ? showGameOver : null;",
"window.showGameOver = function(data) {",
"  if(typeof BUG_LOGGER !== 'undefined') BUG_LOGGER.info('Game','End: '+(data.won?'win':'lose')+' floor '+data.floor);",
"  if(_origShowGameOver) _origShowGameOver(data);",
"  if(typeof AD_SYSTEM !== 'undefined') {",
"    if(data.won) setTimeout(function(){ AD_SYSTEM.onFloorClear(); }, 2000);",
"  }",
"};",
].join('\n');

html = html.replace(/(\n<\/script>\n<\/body>)/, '\n' + extraJS + '\n$1');
console.log('OK: JS injected');

html = html.replace(/v2\.0/g, 'v3.0');
html = html.replace(/DungeonSurv v2/g, 'DungeonSurv v3');

fs.writeFileSync(file, html, 'utf8');
console.log('DONE: ' + file + ' saved');
console.log('Size: ' + fs.statSync(file).size + ' bytes');
