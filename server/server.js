/**
 * 暗境生存 - 联机服务器 v2
 * 新增：每5层BOSS战 · 装备系统 · 等级里程碑
 */
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json({ limit: '1mb' }));
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
});

const rooms = new Map();
const playerRooms = new Map();
const playerData = new Map();

// ─── 装备数据 ───────────────────────────────────────────────
const EQUIPMENT_TIERS = [
  { tier: 0, name: '初始装备',   color: '#888888', atk: 0,  def: 0,  hp: 0,   icon: '⚔️' },
  { tier: 1, name: '青铜装备',   color: '#cd7f32', atk: 5,  def: 3,  hp: 20,  icon: '🛡' },
  { tier: 2, name: '白银装备',   color: '#c0c0c0', atk: 10, def: 7,  hp: 50,  icon: '⚔️' },
  { tier: 3, name: '黄金装备',   color: '#ffd700', atk: 18, def: 12, hp: 100, icon: '🗡' },
  { tier: 4, name: '钻石装备',   color: '#00ffff', atk: 28, def: 20, hp: 180, icon: '💎' },
  { tier: 5, name: '传说装备',   color: '#a020f0', atk: 42, def: 30, hp: 300, icon: '🌟' },
];

const BOSS_DATA = {
  5:  { name: '暗影狼王',    hp: 300,  attack: 18, defense: 8,  exp: 200, gold: 200, skill: '撕裂',  icon: '🐺', desc: '在黑暗中潜伏的狼群首领，利爪如刃' },
  10: { name: '骸骨巨魔',    hp: 600,  attack: 28, defense: 15, exp: 500, gold: 500, skill: '巨石投掷',icon: '💀', desc: '远古战场的亡灵巨人，每一步都震颤大地' },
  15: { name: '剧毒蛛后',    hp: 1000, attack: 35, defense: 20, exp: 1000,gold: 1000,skill: '毒液喷射',icon: '🕷', desc: '蛛网密布的深渊之主，毒素无孔不入' },
  20: { name: '火焰领主',    hp: 1600, attack: 45, defense: 25, exp: 2000,gold: 2000,skill: '地狱火雨',icon: '🔥', desc: '熔岩深处的炎魔帝王，焚尽一切' },
  25: { name: '冰霜巨龙',    hp: 2500, attack: 55, defense: 35, exp: 3500,gold: 3500,skill: '极寒吐息',icon: '🐉', desc: '千年冰封的远古巨龙，冰封万物' },
  30: { name: '暗影君主',    hp: 4000, attack: 70, defense: 45, exp: 6000,gold: 6000,skill: '灵魂收割',icon: '👑', desc: '暗境的绝对统治者，掌握生死轮回' },
  35: { name: '虚空母虫',    hp: 6000, attack: 85, defense: 55, exp: 10000,gold:10000,skill: '虚空吞噬',icon: '🦑', desc: '来自虚空深渊的终极生物，吞噬星辰' },
  40: { name: '永恒神龙',    hp: 9999, attack: 120,defense: 80, exp: 20000,gold:20000,skill: '龙魂毁灭',icon: '🌈', desc: '超越一切存在的终极守护者，宇宙的尽头' },
};

function getBossForFloor(floor) {
  const tierKeys = Object.keys(BOSS_DATA).map(Number).sort((a, b) => b - a);
  const tier = tierKeys.find(k => floor >= k) || 5;
  return BOSS_DATA[tier] || BOSS_DATA[5];
}

// ─── 工具函数 ───────────────────────────────────────────────
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function createRoom(hostId, hostName) {
  const roomId = generateRoomCode();
  const room = {
    id: roomId, name: `${hostName}的暗境`, hostId,
    players: [{
      id: hostId, name: hostName,
      hero: null, hp: 100, maxHp: 100, attack: 10, defense: 5,
      level: 1, exp: 0, gold: 0,
      inventory: [], ready: false,
      position: { x: 3, y: 3 }, alive: true, connected: true,
      // 装备系统
      equipment: { weapon: null, armor: null, accessory: null },
      equipmentTier: 0, // 0-5级
      hasBossKey: false,
      bossDefeated: false,
    }],
    state: 'lobby', currentFloor: 1, turnCount: 0,
    dungeon: null, chat: [], maxPlayers: 4,
    bossActive: false, bossData: null,
    gameMode: 'normal', // normal | boss | victory
    createdAt: Date.now(),
  };
  rooms.set(roomId, room);
  return room;
}

function getEquipTier(playerLevel) {
  if (playerLevel >= 200) return 5;
  if (playerLevel >= 150) return 4;
  if (playerLevel >= 100) return 3;
  if (playerLevel >= 50)  return 2;
  if (playerLevel >= 10)  return 1;
  return 0;
}

function generateDungeon(floor, isBossFloor = false) {
  const W = 20, H = 20;
  const grid = Array.from({ length: H }, () => Array(W).fill('wall'));
  const rooms_data = [];
  const numRooms = isBossFloor ? 3 : 3 + Math.floor(Math.random() * 3);

  for (let i = 0; i < numRooms; i++) {
    const rw = isBossFloor ? 7 + Math.floor(Math.random() * 4) : 4 + Math.floor(Math.random() * 5);
    const rh = isBossFloor ? 7 + Math.floor(Math.random() * 4) : 4 + Math.floor(Math.random() * 5);
    const rx = 1 + Math.floor(Math.random() * (W - rw - 2));
    const ry = 1 + Math.floor(Math.random() * (H - rh - 2));
    let overlap = false;
    for (const r of rooms_data) {
      if (rx < r.x + r.w + 1 && rx + rw + 1 > r.x && ry < r.y + r.h + 1 && ry + rh + 1 > r.y) { overlap = true; break; }
    }
    if (!overlap) {
      rooms_data.push({ x: rx, y: ry, w: rw, h: rh });
      for (let y = ry; y < ry + rh; y++) for (let x = rx; x < rx + rw; x++) grid[y][x] = 'floor';
    }
  }

  for (let i = 1; i < rooms_data.length; i++) {
    const a = rooms_data[i - 1], b = rooms_data[i];
    let cx = Math.floor(a.x + a.w / 2), cy = Math.floor(a.y + a.h / 2);
    const bx = Math.floor(b.x + b.w / 2), by = Math.floor(b.y + b.h / 2);
    while (cx !== bx) { grid[cy][cx] = 'floor'; cx += cx < bx ? 1 : -1; }
    while (cy !== by) { grid[cy][cx] = 'floor'; cy += cy < by ? 1 : -1; }
  }

  const startRoom = rooms_data[0];
  const spawns = [
    { x: startRoom.x + 1, y: startRoom.y + 1 },
    { x: startRoom.x + startRoom.w - 2, y: startRoom.y + 1 },
    { x: startRoom.x + 1, y: startRoom.y + startRoom.h - 2 },
    { x: startRoom.x + startRoom.w - 2, y: startRoom.y + startRoom.h - 2 },
  ];

  // 怪物（BOSS层不放普通怪）
  const monsters = [];
  if (!isBossFloor) {
    const monsterTypes = [
      { type: 'slime',    name: '史莱姆',  hp: 20,  attack: 5,  defense: 1,  exp: 10, gold: 5  },
      { type: 'skeleton', name: '骷髅',   hp: 35,  attack: 8,  defense: 3,  exp: 20, gold: 10 },
      { type: 'orc',      name: '兽人',    hp: 60,  attack: 12, defense: 5,  exp: 35, gold: 20 },
      { type: 'goblin',   name: '哥布林', hp: 15,  attack: 7,  defense: 1,  exp: 8,  gold: 8  },
      { type: 'wraith',   name: '怨灵',   hp: 45,  attack: 10, defense: 4,  exp: 28, gold: 15 },
    ];
    const numMonsters = 5 + floor * 3;
    for (let i = 0; i < numMonsters; i++) {
      const roomIdx = 1 + Math.floor(Math.random() * (rooms_data.length - 1));
      const room = rooms_data[Math.min(roomIdx, rooms_data.length - 1)];
      const mx = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
      const my = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
      if (grid[my][mx] !== 'floor') continue;
      const ti = Math.min(4, Math.floor(Math.random() * (1 + floor * 0.3)));
      const b = monsterTypes[ti];
      monsters.push({ id: uuidv4(), type: b.type, name: b.name, hp: b.hp + floor * 8, maxHp: b.hp + floor * 8, attack: b.attack + floor * 1.5, defense: b.defense + floor * 0.5, exp: b.exp + floor * 3, gold: b.gold + floor * 2, x: mx, y: my, alive: true });
    }
  }

  // 道具
  const items = [];
  const itemTypes = [
    { type: 'potion',   name: '生命药水',    effect: 'hp',      value: 30 },
    { type: 'potion',   name: '高级生命药水', effect: 'hp',      value: 60 },
    { type: 'sword',    name: '铁剑',        effect: 'attack',   value: 5  },
    { type: 'shield',   name: '盾牌',        effect: 'defense',  value: 3  },
    { type: 'coin',     name: '金币袋',      effect: 'gold',     value: 50 + floor * 20 },
    { type: 'key',      name: '钥匙',        effect: 'key',      value: 1  },
    { type: 'elixir',   name: '经验药水',    effect: 'exp',      value: 50 + floor * 10 },
  ];
  const numItems = isBossFloor ? 3 : 8 + floor * 2;
  for (let i = 0; i < numItems; i++) {
    const roomIdx = Math.floor(Math.random() * rooms_data.length);
    const room = rooms_data[roomIdx];
    const ix = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
    const iy = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
    if (grid[iy][ix] !== 'floor') continue;
    const it = itemTypes[Math.floor(Math.random() * itemTypes.length)];
    items.push({ id: uuidv4(), ...it, x: ix, y: iy });
  }

  // 楼梯（普通层）/ BOSS祭坛（BOSS层）
  const lastRoom = rooms_data[rooms_data.length - 1];
  if (isBossFloor) {
    grid[lastRoom.y + Math.floor(lastRoom.h / 2)][lastRoom.x + Math.floor(lastRoom.w / 2)] = 'boss_altar';
  } else {
    grid[lastRoom.y + Math.floor(lastRoom.h / 2)][lastRoom.x + Math.floor(lastRoom.w / 2)] = 'stairs';
  }

  return {
    grid, rooms: rooms_data, monsters, items, spawns,
    stairs: isBossFloor ? null : { x: lastRoom.x + Math.floor(lastRoom.w / 2), y: lastRoom.y + Math.floor(lastRoom.h / 2) },
    bossAltar: isBossFloor ? { x: lastRoom.x + Math.floor(lastRoom.w / 2), y: lastRoom.y + Math.floor(lastRoom.h / 2) } : null,
    isBossFloor,
  };
}

function spawnBoss(room) {
  const boss = getBossForFloor(room.currentFloor);
  const lastRoom = room.dungeon.rooms[room.dungeon.rooms.length - 1];
  const bx = lastRoom.x + Math.floor(lastRoom.w / 2);
  const by = lastRoom.y + Math.floor(lastRoom.h / 2);
  room.dungeon.boss = {
    id: 'boss_' + room.currentFloor,
    ...boss,
    hp: boss.hp,
    maxHp: boss.hp,
    x: bx, y: by,
    alive: true,
    phase: 1,
    enrageThreshold: 0.3,
  };
  room.bossActive = true;
  room.bossData = room.dungeon.boss;
  room.chat.push({ type: 'boss', text: `⚠️ 【警告】BOSS「${boss.name}」出现！等级${room.currentFloor}层守护者！` });
  room.chat.push({ type: 'boss', text: `📖 ${boss.desc}` });
  room.chat.push({ type: 'boss', text: `⚔️ BOSS技能：${boss.skill} | 生命${boss.hp} | 攻击${boss.attack} | 防御${boss.defense}` });
}

// ─── Socket 事件 ─────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[连接] ${socket.id}`);

  socket.on('create_room', ({ playerName }, cb) => {
    const room = createRoom(socket.id, playerName || '冒险者');
    playerRooms.set(socket.id, room.id);
    playerData.set(socket.id, room.players[0]);
    socket.join(room.id);
    cb({ success: true, room, playerId: socket.id });
  });

  socket.on('join_room', ({ roomCode, playerName }, cb) => {
    const room = rooms.get(roomCode.toUpperCase());
    if (!room) return cb({ success: false, error: '房间不存在' });
    if (room.players.length >= room.maxPlayers) return cb({ success: false, error: '房间已满' });
    if (room.state !== 'lobby') return cb({ success: false, error: '游戏已开始' });
    const player = {
      id: socket.id, name: playerName || `冒险者${room.players.length + 1}`,
      hero: null, hp: 100, maxHp: 100, attack: 10, defense: 5,
      level: 1, exp: 0, gold: 0, inventory: [], ready: false,
      position: { x: 3, y: 3 }, alive: true, connected: true,
      equipment: { weapon: null, armor: null, accessory: null },
      equipmentTier: 0, hasBossKey: false, bossDefeated: false,
    };
    room.players.push(player);
    playerRooms.set(socket.id, room.id);
    playerData.set(socket.id, player);
    socket.join(room.id);
    socket.to(room.id).emit('player_joined', { player, room });
    cb({ success: true, room, playerId: socket.id });
  });

  socket.on('select_hero', ({ heroType }) => {
    const roomId = playerRooms.get(socket.id);
    if (!roomId) return;
    const room = rooms.get(roomId);
    const player = room?.players.find(p => p.id === socket.id);
    if (!player) return;
    const stats = {
      warrior:  { hp: 130, attack: 12, defense: 8,  skill: '重击', weapon:'铁剑', armor:'皮甲' },
      mage:     { hp: 80,  attack: 18, defense: 3,  skill: '火球', weapon:'法杖', armor:'布袍' },
      assassin: { hp: 90,  attack: 16, defense: 5,  skill: '背刺', weapon:'匕首', armor:'皮甲' },
      healer:   { hp: 100, attack: 8,  defense: 6,  skill: '治疗', weapon:'圣杖', armor:'锁甲' },
    }[heroType] || { hp: 100, attack: 10, defense: 5, skill: '重击', weapon:'铁剑', armor:'皮甲' };
    Object.assign(player, stats);
    player.maxHp = stats.hp;
    player.hp = stats.hp;
    player.hero = heroType;
    io.to(roomId).emit('player_updated', { player });
  });

  socket.on('toggle_ready', () => {
    const roomId = playerRooms.get(socket.id);
    const room = rooms.get(roomId);
    const player = room?.players.find(p => p.id === socket.id);
    if (!player?.hero) return;
    player.ready = !player.ready;
    io.to(roomId).emit('player_updated', { player });
    if (room.players.every(p => p.ready)) startGame(roomId);
  });

  socket.on('start_game', () => {
    const roomId = playerRooms.get(socket.id);
    const room = rooms.get(roomId);
    if (!room || room.hostId !== socket.id) return;
    if (room.players.some(p => !p.hero)) return;
    startGame(roomId);
  });

  // ── 移动 ──
  socket.on('move', ({ dx, dy }) => {
    const roomId = playerRooms.get(socket.id);
    const room = rooms.get(roomId);
    if (!room || room.state !== 'playing') return;
    const player = room.players.find(p => p.id === socket.id && p.alive);
    if (!player) return;

    // BOSS层移动限制
    if (room.bossActive && room.dungeon.boss?.alive) {
      io.to(roomId).emit('chat', { type: 'boss', text: '⚠️ 必须先击败BOSS才能移动！' });
      io.to(roomId).emit('game_state', getRoomState(room));
      return;
    }

    const nx = player.position.x + dx, ny = player.position.y + dy;
    if (nx < 0 || ny < 0 || nx >= 20 || ny >= 20) return;
    const tile = room.dungeon.grid[ny][nx];
    if (tile === 'wall') return;

    // 撞BOSS
    if (room.dungeon.boss?.alive && room.dungeon.boss.x === nx && room.dungeon.boss.y === ny) {
      attackBoss(room, player);
      io.to(roomId).emit('game_state', getRoomState(room));
      return;
    }

    // 普通怪物
    const monster = room.dungeon.monsters.find(m => m.alive && m.x === nx && m.y === ny);
    if (monster) {
      const damage = Math.max(1, player.attack - monster.defense);
      monster.hp -= damage;
      room.chat.push({ type: 'combat', text: `${player.name}攻击${monster.name}，造成${damage}伤害！` });
      if (monster.hp <= 0) {
        monster.alive = false;
        player.exp += monster.exp;
        player.gold += monster.gold;
        room.chat.push({ type: 'system', text: `${monster.name}被击杀！+${monster.exp}经验 +${monster.gold}金币` });
        checkLevelUp(player, room);
      }
      io.to(roomId).emit('game_state', getRoomState(room));
      return;
    }

    // 移动
    player.position = { x: nx, y: ny };

    // 拾取道具
    const itemIdx = room.dungeon.items.findIndex(i => i.x === nx && i.y === ny);
    if (itemIdx !== -1) {
      const item = room.dungeon.items.splice(itemIdx, 1)[0];
      applyItem(player, item, room);
    }

    // 检查BOSS祭坛
    if (tile === 'boss_altar' && !room.bossActive) {
      spawnBoss(room);
    }

    // 检查楼梯（必须清空所有怪和BOSS）
    if (tile === 'stairs' && room.dungeon.monsters.every(m => !m.alive) && !room.bossActive) {
      nextFloor(roomId);
    }

    io.to(roomId).emit('game_state', getRoomState(room));
  });

  // ── 攻击BOSS ──
  socket.on('attack_boss', ({ targetX, targetY }) => {
    const roomId = playerRooms.get(socket.id);
    const room = rooms.get(roomId);
    if (!room || room.state !== 'playing') return;
    const player = room.players.find(p => p.id === socket.id && p.alive);
    if (!player) return;
    if (!room.bossActive || !room.dungeon.boss?.alive) return;
    attackBoss(room, player, targetX, targetY);
    io.to(roomId).emit('game_state', getRoomState(room));
  });

  // ── 技能 ──
  socket.on('use_skill', ({ targetX, targetY }) => {
    const roomId = playerRooms.get(socket.id);
    const room = rooms.get(roomId);
    if (!room || room.state !== 'playing') return;
    const player = room.players.find(p => p.id === socket.id && p.alive);
    if (!player) return;
    useSkill(player, room, targetX, targetY);
    io.to(roomId).emit('game_state', getRoomState(room));
  });

  // ── 使用道具 ──
  socket.on('use_item', ({ itemIndex }) => {
    const roomId = playerRooms.get(socket.id);
    const room = rooms.get(roomId);
    if (!room || room.state !== 'playing') return;
    const player = room.players.find(p => p.id === socket.id && p.alive);
    if (!player || itemIndex < 0 || itemIndex >= player.inventory.length) return;
    const item = player.inventory.splice(itemIndex, 1)[0];
    applyItem(player, item, room);
    io.to(roomId).emit('game_state', getRoomState(room));
  });

  // ── 装备升级 ──
  socket.on('upgrade_equipment', () => {
    const roomId = playerRooms.get(socket.id);
    const room = rooms.get(roomId);
    const player = room?.players.find(p => p.id === socket.id);
    if (!player) return;

    // 检查是否满足升级条件：每50级（5层为一阶段）
    const tierThresholds = [10, 50, 100, 150, 200];
    const currentTier = player.equipmentTier;
    const nextTier = currentTier + 1;
    if (nextTier > 5) {
      room.chat.push({ type: 'system', text: '🏆 装备已达最高等级！' });
      io.to(roomId).emit('game_state', getRoomState(room));
      return;
    }
    const requiredLevel = tierThresholds[currentTier];
    if (player.level < requiredLevel) {
      room.chat.push({ type: 'system', text: `⚠️ 升级装备需要达到${requiredLevel}级，当前${player.level}级` });
      io.to(roomId).emit('game_state', getRoomState(room));
      return;
    }

    // 执行升级
    const oldTier = EQUIPMENT_TIERS[currentTier];
    const newTier = EQUIPMENT_TIERS[nextTier];
    const diff = {
      atk: newTier.atk - oldTier.atk,
      def: newTier.def - oldTier.def,
      hp:  newTier.hp  - oldTier.hp,
    };
    player.attack += diff.atk;
    player.defense += diff.def;
    player.maxHp += diff.hp;
    player.hp = player.maxHp; // 升级时回满血
    player.equipmentTier = nextTier;
    room.chat.push({ type: 'system', text: `🛡️ ${player.name}装备升级！${oldTier.name} → ${newTier.name}` });
    room.chat.push({ type: 'system', text: `   攻击力+${diff.atk} 防御力+${diff.def} 生命+${diff.hp}` });
    io.to(roomId).emit('equipment_upgrade', { playerId: player.id, tier: nextTier, tierData: newTier });
    io.to(roomId).emit('game_state', getRoomState(room));
  });

  socket.on('chat', ({ message }) => {
    const roomId = playerRooms.get(socket.id);
    const room = rooms.get(roomId);
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    room.chat.push({ type: 'chat', text: `${player?.name || '???'}: ${message}`, time: Date.now() });
    io.to(roomId).emit('chat', { type: 'chat', text: `${player?.name}: ${message}` });
  });

  socket.on('disconnect', () => {
    const roomId = playerRooms.get(socket.id);
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.connected = false;
      if (room.state === 'lobby') {
        room.players = room.players.filter(p => p.id !== socket.id);
        if (!room.players.length) rooms.delete(roomId);
        else { room.hostId = room.players[0].id; io.to(roomId).emit('player_left', { playerId: socket.id, newHost: room.hostId }); }
      } else {
        io.to(roomId).emit('player_disconnected', { playerId: socket.id });
      }
    }
    playerRooms.delete(socket.id);
    playerData.delete(socket.id);
  });
});

// ─── 游戏逻辑 ───────────────────────────────────────────────
function startGame(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  room.state = 'playing';
  room.currentFloor = 1;
  room.bossActive = false;
  room.bossData = null;
  room.dungeon = generateDungeon(1, false);
  room.players.forEach((p, i) => {
    const sp = room.dungeon.spawns[i] || room.dungeon.spawns[0];
    p.position = { ...sp }; p.hp = p.maxHp; p.alive = true;
    p.inventory = []; p.exp = 0; p.gold = 0;
    p.equipmentTier = 0; p.bossDefeated = false;
  });
  io.to(roomId).emit('game_start', getRoomState(room));
}

function nextFloor(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  room.currentFloor++;
  room.bossActive = false;
  room.bossData = null;
  room.dungeon = generateDungeon(room.currentFloor, false);
  room.players.forEach((p, i) => {
    const sp = room.dungeon.spawns[i] || room.dungeon.spawns[0];
    p.position = { ...sp };
  });
  room.chat.push({ type: 'system', text: `═══════════ 进入地牢第${room.currentFloor}层 ═══════════` });
  io.to(roomId).emit('next_floor', getRoomState(room));
}

function attackBoss(room, player, tx, ty) {
  const boss = room.dungeon.boss;
  if (!boss?.alive) return;

  // 愤怒阶段（血量<30%）
  if (boss.hp / boss.maxHp <= boss.enrageThreshold && boss.phase === 1) {
    boss.phase = 2;
    boss.attack = Math.floor(boss.attack * 1.5);
    room.chat.push({ type: 'boss', text: `⚠️ 【BOSS进入愤怒状态！攻击力大幅提升！】` });
  }

  const damage = Math.max(1, player.attack - boss.defense);
  boss.hp -= damage;
  room.chat.push({ type: 'combat', text: `${player.name}攻击「${boss.name}」，造成${damage}伤害！` });

  if (boss.hp <= 0) {
    boss.alive = false;
    room.bossActive = false;
    player.exp += boss.exp;
    player.gold += boss.gold;
    player.hasBossKey = true;
    room.chat.push({ type: 'boss', text: `🏆 【BOSS「${boss.name}」被击杀！】` });
    room.chat.push({ type: 'system', text: `🎁 获得 ${boss.exp} 经验！${boss.gold} 金币！` });
    room.chat.push({ type: 'system', text: `🔑 获得【BOSS钥匙】，解锁装备升级！` });
    checkLevelUp(player, room);
    // 掉落传说装备
    const tierDrop = getEquipTier(player.level);
    const upgradeLevel = tierDrop > player.equipmentTier ? (player.equipmentTier < 5 ? `需升到Lv.${[10,50,100,150,200][player.equipmentTier]}` : '已满') : '已升级';
    room.chat.push({ type: 'system', text: `✨ 当前可升级至：${EQUIPMENT_TIERS[tierDrop].name}（${upgradeLevel}）` });
  } else {
    // BOSS反击
    const bossDmg = Math.max(1, boss.attack - player.defense);
    player.hp -= bossDmg;
    room.chat.push({ type: 'combat', text: `「${boss.name}」的「${boss.skill}」命中${player.name}，造成${bossDmg}伤害！` });
    if (boss.phase === 2) {
      const extraDmg = Math.floor(bossDmg * 0.5);
      player.hp -= extraDmg;
      room.chat.push({ type: 'combat', text: `🔥 愤怒状态下额外伤害${extraDmg}！` });
    }
    if (player.hp <= 0) {
      player.hp = 0; player.alive = false;
      room.chat.push({ type: 'system', text: `💀 ${player.name}倒下了！` });
      checkAllDead(room);
    }
  }
  checkLevelUp(player, room);
}

function useSkill(player, room, tx, ty) {
  const me = room.players.find(p => p.id === player.id);
  if (!me) return;
  switch (me.skill) {
    case '重击': {
      const target = room.dungeon.boss?.alive ? room.dungeon.boss : room.dungeon.monsters.find(m => m.alive);
      if (target) {
        const dmg = Math.max(1, Math.floor(me.attack * 2.2 - target.defense));
        target.hp -= dmg;
        room.chat.push({ type: 'skill', text: `${me.name}发动「重击」！对${target.name || 'BOSS'}造成${dmg}伤害！` });
        if (target.hp <= 0 && target.type) { target.alive = false; me.exp += target.exp; me.gold += target.gold; }
        if (target === room.dungeon.boss && target.hp <= 0) { target.alive = false; room.bossActive = false; me.exp += target.exp; me.gold += target.gold; }
      }
      break;
    }
    case '火球': {
      const targets = [room.dungeon.boss, ...room.dungeon.monsters.filter(m => m.alive)]
        .filter(Boolean).filter(t => {
          if (room.dungeon.boss?.alive) return t === room.dungeon.boss;
          return true;
        }).slice(0, 4);
      targets.forEach(t => {
        const dmg = Math.max(1, Math.floor(me.attack * 1.8 - (t.defense || 0)));
        t.hp -= dmg;
        if (t.hp <= 0) { t.alive = false; if (t === room.dungeon.boss) { room.bossActive = false; me.exp += t.exp; me.gold += t.gold; } else { me.exp += t.exp; me.gold += t.gold; } }
      });
      room.chat.push({ type: 'skill', text: `${me.name}施放「火球」！范围攻击，${targets.length}个目标受伤！` });
      break;
    }
    case '背刺': {
      const t = room.dungeon.boss?.alive ? room.dungeon.boss : room.dungeon.monsters.find(m => m.alive);
      if (t) {
        const dmg = Math.max(1, Math.floor(me.attack * 3.5 - (t.defense || 0)));
        t.hp -= dmg;
        room.chat.push({ type: 'skill', text: `${me.name}「背刺」暴击！对${t.name || 'BOSS'}造成${dmg}伤害！` });
        if (t.hp <= 0) { t.alive = false; if (t === room.dungeon.boss) { room.bossActive = false; me.exp += t.exp; me.gold += t.gold; } else { me.exp += t.exp; me.gold += t.gold; } }
      }
      break;
    }
    case '治疗': {
      const healed = Math.min(me.maxHp - me.hp, 50);
      me.hp += healed;
      room.chat.push({ type: 'skill', text: `${me.name}「治疗」！恢复${healed}生命！` });
      break;
    }
  }
  checkLevelUp(me, room);
  if (room.dungeon.monsters.every(m => !m.alive) && !room.dungeon.boss?.alive && room.dungeon.stairs) {
    room.chat.push({ type: 'system', text: '✅ 所有敌人已清除，可以前往下一层！' });
  }
}

function applyItem(player, item, room) {
  switch (item.effect) {
    case 'hp':     player.hp = Math.min(player.maxHp, player.hp + item.value); break;
    case 'attack':  player.attack += item.value; break;
    case 'defense': player.defense += item.value; break;
    case 'gold':   player.gold += item.value; break;
    case 'exp':    player.exp += item.value; checkLevelUp(player, room); break;
    case 'key':    player.hasBossKey = true; break;
  }
}

function checkLevelUp(player, room) {
  const need = player.level * 50;
  if (player.exp >= need) {
    player.exp -= need; player.level++;
    player.maxHp += 10; player.hp = Math.min(player.hp + 10, player.maxHp);
    player.attack += 2; player.defense += 1;
    room.chat.push({ type: 'system', text: `🎉 ${player.name} 升级到 Lv.${player.level}！` });
    // 检查装备升级
    const tierThresholds = [10, 50, 100, 150, 200];
    if (tierThresholds.includes(player.level) && player.equipmentTier < 5) {
      const nextTier = player.equipmentTier + 1;
      const newTier = EQUIPMENT_TIERS[nextTier];
      const diff = { atk: newTier.atk, def: newTier.def, hp: newTier.hp };
      player.attack += diff.atk; player.defense += diff.def;
      player.maxHp += diff.hp; player.hp = player.maxHp;
      player.equipmentTier = nextTier;
      room.chat.push({ type: 'system', text: `🛡️ 达到${player.level}级，装备自动升级为【${newTier.name}】！` });
      room.chat.push({ type: 'system', text: `   攻击力+${diff.atk} 防御力+${diff.def} 生命+${diff.hp}` });
    }
  }
}

function checkAllDead(room) {
  if (room.players.every(p => !p.alive)) {
    room.state = 'gameover';
    io.to(room.id).emit('game_over', {
      won: false, floor: room.currentFloor,
      alivePlayers: 0, maxLevel: Math.max(...room.players.map(p => p.level)),
    });
  }
}

function getRoomState(room) {
  return {
    id: room.id, name: room.name, state: room.state,
    currentFloor: room.currentFloor,
    players: room.players,
    dungeon: room.dungeon,
    bossActive: room.bossActive,
    bossData: room.dungeon?.boss || null,
    chat: room.chat.slice(-80),
    equipmentTiers: EQUIPMENT_TIERS,
  };
}

// ─── REST API ────────────────────────────────────────────────
// ─── Bug报告+反馈API (v3) ──────────────────────────────
const bugReports = [];
app.post('/api/bug_report', (req, res) => {
  const report = {
    id: 'BUG_' + Date.now() + '_' + Math.random().toString(36).slice(2,6).toUpperCase(),
    ts: new Date().toISOString(),
    version: req.body.version,
    build: req.body.build,
    auto: req.body.auto,
    ua: req.body.ua,
    count: req.body.logs ? req.body.logs.length : 0,
    logs: (req.body.logs || []).slice(0, 10),
  };
  bugReports.push(report);
  if (bugReports.length > 200) bugReports.splice(0, bugReports.length - 200);
  console.log('[BUG] ' + report.id + ' auto=' + report.auto + ' count=' + report.count);
  res.json({ success: true, id: report.id });
});
app.get('/api/bug_report/list', (req, res) => {
  res.json({ reports: bugReports.slice(-20), total: bugReports.length });
});

const feedbacks = [];
app.post('/api/feedback', (req, res) => {
  const fb = {
    id: 'FB_' + Date.now() + '_' + Math.random().toString(36).slice(2,6).toUpperCase(),
    ts: new Date().toISOString(),
    version: req.body.version,
    build: req.body.build,
    type: req.body.type,
    star: req.body.star,
    text: req.body.text,
    mode: req.body.mode,
    user: req.body.user,
    floor: req.body.floor,
    url: req.body.url,
  };
  feedbacks.push(fb);
  if (feedbacks.length > 200) feedbacks.splice(0, feedbacks.length - 200);
  console.log('[FB] ' + fb.id + ' star=' + fb.star + ' type=' + fb.type + ' text=' + String(fb.text||'').substring(0,40));
  res.json({ success: true, id: fb.id });
});
app.get('/api/feedback/list', (req, res) => {
  res.json({ feedbacks: feedbacks.slice(-20), total: feedbacks.length });
});
app.get('/api/feedback/stats', (req, res) => {
  const stars = feedbacks.filter(function(f){return f.star > 0;}).map(function(f){return f.star;});
  const avg = stars.length ? (stars.reduce(function(a,b){return a+b;},0) / stars.length).toFixed(1) : 'N/A';
  const byType = {};
  feedbacks.forEach(function(f){ byType[f.type] = (byType[f.type]||0)+1; });
  res.json({ total: feedbacks.length, avgStar: avg, stars: stars.length, byType: byType });
});

app.use(express.static('.'));
app.get('/api/rooms', (req, res) => {
  const list = Array.from(rooms.values()).filter(r => r.state === 'lobby')
    .map(r => ({ id: r.id, name: r.name, players: r.players.length, maxPlayers: r.maxPlayers }));
  res.json({ success: true, rooms: list });
});
app.get('/api/room/:id', (req, res) => {
  const room = rooms.get(req.params.id.toUpperCase());
  res.json(room ? { success: true, room: getRoomState(room) } : { success: false, error: '不存在' });
});
app.get('/health', (req, res) => res.json({ status: 'ok', rooms: rooms.size, version: '2.0' }));

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n🎮 暗境生存 v3.0 服务器运行中`);
  console.log(`📡 端口: http://localhost:${PORT}`);
  console.log(`📋 房间列表: http://localhost:${PORT}/api/rooms`);
  console.log(`🛡 BOSS系统: 已启用（每5层）`);
  console.log(`⚔️ 装备系统: ${EQUIPMENT_TIERS.length}个等级\n`);
});
