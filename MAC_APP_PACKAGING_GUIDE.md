# ProfMatch Mac App 打包指南

本指南提供两种将ProfMatch网站打包成Mac应用的方案。

---

## 方案1：PWA（渐进式Web应用）⚡️ **推荐新手**

### 优点
- ✅ 无需编程或打包工具
- ✅ 5分钟内完成
- ✅ 自动更新（始终是最新版本）
- ✅ 占用空间小

### 缺点
- ❌ 需要网络连接
- ❌ 无法在Mac App Store发布
- ❌ 图标显示可能不完美

### 安装步骤

#### 使用Safari（推荐）

1. **打开网站**
   - 在Safari中访问：`https://findmyprofessor.xyz`（或你的部署域名）

2. **添加到Dock**
   - 点击菜单栏 `文件` → `添加到Dock`
   - 或使用快捷键：`⌘ + Shift + D`

3. **完成！**
   - 应用图标会出现在Dock中
   - 点击即可像原生应用一样使用

#### 使用Chrome/Edge

1. **打开网站**
   - 在Chrome或Edge中访问：`https://findmyprofessor.xyz`

2. **安装应用**
   - 点击地址栏右侧的 `⊕` 安装图标
   - 或点击菜单 `⋮` → `将ProfMatch安装为应用`

3. **完成！**
   - 应用会出现在启动台和应用程序文件夹中

---

## 方案2：Electron打包（真正的原生应用）🚀 **推荐开发者**

### 优点
- ✅ 真正的原生Mac应用
- ✅ 可以离线使用（需要配置）
- ✅ 可以发布到Mac App Store
- ✅ 完美的图标和窗口控制

### 缺点
- ❌ 需要安装Node.js和开发工具
- ❌ 首次打包需要30-60分钟
- ❌ 应用体积较大（~100MB）
- ❌ 更新需要重新打包

### 前置要求

1. **安装Homebrew**（如果还没有）
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **安装Node.js**
   ```bash
   brew install node
   ```

3. **安装pnpm**
   ```bash
   npm install -g pnpm
   ```

### 打包步骤

#### 1. 准备项目

```bash
# 克隆或下载项目到本地
cd /path/to/find-my-professor

# 安装依赖
pnpm install

# 安装Electron相关依赖
pnpm add -D electron electron-builder
```

#### 2. 更新package.json

在`package.json`中添加以下scripts：

```json
{
  "scripts": {
    "electron:dev": "ELECTRON_START_URL=http://localhost:3000 NODE_ENV=development electron electron/main.js",
    "electron:build": "vite build && electron-builder --mac --config electron-builder.json",
    "electron:build:dmg": "vite build && electron-builder --mac dmg --config electron-builder.json"
  },
  "main": "electron/main.js"
}
```

#### 3. 准备图标

```bash
# 创建icns图标（需要安装iconutil）
# 从PNG生成icns
mkdir icon.iconset
sips -z 16 16     client/public/icon-512.png --out icon.iconset/icon_16x16.png
sips -z 32 32     client/public/icon-512.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     client/public/icon-512.png --out icon.iconset/icon_32x32.png
sips -z 64 64     client/public/icon-512.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   client/public/icon-512.png --out icon.iconset/icon_128x128.png
sips -z 256 256   client/public/icon-512.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   client/public/icon-512.png --out icon.iconset/icon_256x256.png
sips -z 512 512   client/public/icon-512.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   client/public/icon-512.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 client/public/icon-512.png --out icon.iconset/icon_512x512@2x.png

# 生成icns文件
iconutil -c icns icon.iconset -o electron/build/icon.icns

# 清理临时文件
rm -rf icon.iconset
```

#### 4. 构建应用

```bash
# 开发模式（测试）
pnpm run electron:dev

# 生产打包（生成DMG安装包）
pnpm run electron:build:dmg
```

#### 5. 查找打包结果

打包完成后，你会在`dist-electron`目录中找到：
- `ProfMatch-x.x.x-arm64.dmg` - Apple Silicon (M1/M2/M3) Mac
- `ProfMatch-x.x.x-x64.dmg` - Intel Mac
- `ProfMatch-x.x.x-mac.zip` - 压缩包版本

#### 6. 安装应用

1. 双击`.dmg`文件
2. 将ProfMatch图标拖到Applications文件夹
3. 从启动台或Applications文件夹打开应用

### 常见问题

#### Q: 打开应用时提示"无法打开，因为无法验证开发者"

**解决方法：**
```bash
# 在终端中运行（替换为实际路径）
xattr -cr /Applications/ProfMatch.app
```

或者：
1. 右键点击应用
2. 选择"打开"
3. 在弹出的对话框中点击"打开"

#### Q: 如何让应用支持离线使用？

需要添加Service Worker配置，创建`client/public/sw.js`：

```javascript
const CACHE_NAME = 'profmatch-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

然后在`client/src/main.tsx`中注册：

```typescript
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}
```

#### Q: 如何发布到Mac App Store？

需要：
1. 加入Apple Developer Program（$99/年）
2. 创建App ID和证书
3. 使用`electron-builder`配置签名：

```json
{
  "mac": {
    "identity": "Developer ID Application: Your Name (TEAM_ID)",
    "provisioningProfile": "path/to/profile.provisionprofile"
  }
}
```

4. 提交到App Store Connect进行审核

---

## 对比总结

| 特性 | PWA | Electron |
|------|-----|----------|
| 安装难度 | ⭐️ 极简单 | ⭐️⭐️⭐️ 需要技术背景 |
| 安装时间 | 5分钟 | 30-60分钟 |
| 应用体积 | ~1MB | ~100MB |
| 离线支持 | ❌ 需要网络 | ✅ 可配置 |
| 自动更新 | ✅ 自动 | ❌ 需要重新打包 |
| App Store | ❌ 不支持 | ✅ 支持 |
| 用户体验 | ⭐️⭐️⭐️⭐️ 良好 | ⭐️⭐️⭐️⭐️⭐️ 原生 |

---

## 推荐方案

- **个人使用**：选择PWA（方案1），快速简单
- **团队分发**：选择Electron（方案2），体验更好
- **商业发布**：选择Electron + App Store，专业正规

---

## 需要帮助？

如果在打包过程中遇到问题，请查看：
- Electron官方文档：https://www.electronjs.org/docs
- electron-builder文档：https://www.electron.build
- PWA指南：https://web.dev/progressive-web-apps/

或联系开发团队获取技术支持。
