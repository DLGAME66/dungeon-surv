# 🌐 暗境生存 · 网站部署指南

## 方案一：Vercel + Railway（免费，推荐）

### 步骤 1：上传代码到 GitHub

在 GitHub 创建新仓库，上传以下文件结构：
```
DungeonSurv/
├── client/
│   └── index.html       ← 游戏前端（完整单文件）
├── server/
│   ├── package.json
│   └── server.js        ← 联机服务器
├── README.md
└── DEPLOY.md
```

**GitHub 创建仓库后：**
```bash
git init
git add .
git commit -m "暗境生存 v2.0"
git branch -M main
git remote add origin https://github.com/你的用户名/DungeonSurv.git
git push -u origin main
```

---

### 步骤 2：部署服务器（Railway）

1. 访问 [railway.app](https://railway.app)，用 GitHub 登录
2. 点击 **New Project** → **Deploy from GitHub repo** → 选择 `DungeonSurv` 仓库
3. Railway 会自动检测 Node.js，根目录选 `server`
4. **环境变量**：添加 `PORT = 3001`
5. 点击 **Deploy Now**
6. 部署完成后，Railway 会给你一个域名，例如：`https://dungeon-surv-server.up.railway.app`

> ⚠️ 免费套餐：每月 500 小时，休眠后首次请求有冷启动延迟

---

### 步骤 3：部署前端（Vercel）

1. 访问 [vercel.com](https://vercel.com)，用 GitHub 登录
2. 点击 **Add New** → **Project** → 导入 `DungeonSurv` 仓库
3. **Root Directory**：`client`
4. **Build Command**：留空（纯静态文件）
5. **Output Directory**：`.`（当前目录）
6. 点击 **Deploy**

7. 部署完成后，复制 Vercel 给你的域名，例如：`https://dungeon-surv.vercel.app`

---

### 步骤 4：配置服务器地址

部署 Vercel 后，客户端需要连接 Railway 服务器。需要修改一小段代码：

在 `client/index.html` 中找到这一行（约在文件开头）：
```javascript
const SERVER_URL = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
  ? 'http://localhost:3001' : '';
```

改为：
```javascript
const SERVER_URL = 'https://你的Railway域名.up.railway.app';
```

修改后重新 `git push`，Vercel 会自动重新部署。

---

## 方案二：Cloudflare Pages + Cloudflare Workers

### 服务器部分（Cloudflare Workers）

创建 `server/index.js`（使用 Cloudflare Workers 兼容写法）：
```javascript
// Cloudflare Workers 版本（不支持 WebSocket，用轮询替代）
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
```

> ⚠️ 注意：Socket.IO 需要 WebSocket 支持，Cloudflare Workers 免费版不支持 WebSocket 升级，建议使用 Railway 或 Render。

---

## 方案三：一键部署到 Render（备选）

1. 访问 [render.com](https://render.com)，登录
2. **New** → **Web Service**
3. 连接 GitHub，选择 `DungeonSurv` 仓库
4. **Root Directory**：`server`
5. **Build Command**：`npm install`
6. **Start Command**：`node server.js`
7. 添加环境变量 `PORT = 10000`
8. **Plan**：Free（实例休眠后需 30 秒冷启动）

---

## 方案四：国内方案（腾讯云/阿里云）

### 服务器
```bash
# 在服务器上
yum install -y nodejs  # 或 apt install nodejs
cd /opt/DungeonSurv/server
npm install
PORT=3001 nohup node server.js &
```

### 前端
直接上传 `client/index.html` 到对象存储 COS，绑定 CDN 域名。

### Nginx 配置
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /var/www/dungeonsurv/client;
        index index.html;
    }

    # 代理 API 和 WebSocket
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
    }
}
```

---

## 📋 部署检查清单

- [ ] GitHub 仓库创建并上传代码
- [ ] Railway/Render 部署服务器（获取 URL）
- [ ] 修改 `client/index.html` 中的 `SERVER_URL`
- [ ] Vercel/Netlify 部署前端
- [ ] 测试联机功能是否正常
- [ ] （可选）配置自定义域名

---

## 🔧 常见问题

**Q: 联机显示"服务器未连接"？**
> 检查 `SERVER_URL` 是否填写正确，是否包含 `https://` 前缀和端口号

**Q: Vercel 部署后页面空白？**
> 确保 `client/index.html` 中 Phaser CDN 可访问，或将 Phaser 下载到本地 `assets/` 文件夹

**Q: Railway 免费版休眠了？**
> 免费版闲置 30 分钟会休眠，第一个玩家进入时需等待 15-30 秒重连

**Q: 想和朋友跨地域联机？**
> 两人都需要能访问到同一台公网服务器，国内建议用腾讯云/阿里云，国际用 Railway/Vercel
