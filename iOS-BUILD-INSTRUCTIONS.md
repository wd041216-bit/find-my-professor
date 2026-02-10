# iOS应用打包说明

## 项目信息
- **应用名称**: Find My Professor
- **Bundle ID**: com.findmyprofessor.app
- **Xcode项目路径**: `/home/ubuntu/find-my-professor/ios/App/App.xcodeproj`

## 已完成的配置

### 1. Capacitor安装和配置
- ✅ 已安装 `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`
- ✅ 已初始化Capacitor配置（`capacitor.config.ts`）
- ✅ 已添加iOS平台
- ✅ 已同步Web资源到iOS项目

### 2. 项目结构
```
find-my-professor/
├── ios/                    # iOS原生项目
│   └── App/
│       ├── App.xcodeproj   # Xcode项目文件
│       └── App/
│           └── public/     # Web资源（自动同步）
├── dist/public/            # 构建后的Web应用
├── capacitor.config.ts     # Capacitor配置
└── client/                 # React源代码
```

## 下一步：在Mac上完成打包

由于iOS应用必须在macOS上使用Xcode编译和签名，您需要：

### 步骤1：下载项目到Mac
```bash
# 在Mac上执行
scp -r ubuntu@<sandbox-ip>:/home/ubuntu/find-my-professor ~/find-my-professor
# 或者通过Git仓库同步
```

### 步骤2：在Mac上安装依赖
```bash
cd ~/find-my-professor
pnpm install
```

### 步骤3：打开Xcode项目
```bash
cd ios/App
open App.xcodeproj
```

### 步骤4：在Xcode中配置签名
1. 选择项目 "App" → 点击 "Signing & Capabilities"
2. 选择您的Apple Developer Team
3. 确认Bundle Identifier为 `com.findmyprofessor.app`

### 步骤5：修改服务器URL（重要！）

**问题**：当前应用使用的是开发服务器URL（`https://3000-...manus.computer`），这个URL在沙箱关闭后会失效。

**解决方案**：

#### 方案A：使用Manus托管（推荐）
1. 在当前项目中点击"Publish"按钮部署网站
2. 获取生产环境URL（例如：`https://find-my-professor.manus.space`）
3. 修改 `client/src/lib/trpc.ts`：
   ```typescript
   const url = import.meta.env.PROD 
     ? 'https://find-my-professor.manus.space/api/trpc'  // 替换为您的生产URL
     : 'http://localhost:3000/api/trpc';
   ```
4. 重新构建：`pnpm run build`
5. 同步到iOS：`npx cap sync ios`

#### 方案B：使用外部服务器
1. 将后端部署到Railway/Render/Vercel等平台
2. 获取生产环境URL
3. 按照方案A的步骤3-5修改配置

### 步骤6：构建和测试
1. 在Xcode中选择目标设备（模拟器或真机）
2. 点击 ▶️ 运行按钮测试应用
3. 确认所有功能正常工作

### 步骤7：打包上架App Store
1. 在Xcode中选择 "Product" → "Archive"
2. 等待Archive完成
3. 在Organizer中选择Archive → "Distribute App"
4. 选择 "App Store Connect"
5. 按照向导完成上传

### 步骤8：在App Store Connect中配置
1. 登录 [App Store Connect](https://appstoreconnect.apple.com)
2. 创建新应用（如果还没有）
3. 填写应用信息、截图、描述等
4. 提交审核

## 重要提示

### API服务器配置
- ⚠️ **必须配置生产环境服务器URL**，否则App无法正常工作
- 建议使用Manus托管（已包含数据库、认证等所有功能）
- 如果使用外部托管，需要确保：
  - 数据库连接正常
  - OAuth认证配置正确
  - 所有环境变量已设置

### Apple Developer要求
- 需要Apple Developer账号（$99/年）
- 需要配置App ID和Provisioning Profile
- 首次上架需要通过App Review

### 应用图标和启动画面
- 需要准备各种尺寸的应用图标（在Xcode中配置）
- 可以使用工具如 [App Icon Generator](https://appicon.co/) 生成

## 故障排查

### 问题：构建失败
- 检查Xcode版本（需要最新版本）
- 检查iOS Deployment Target（建议iOS 13.0+）
- 清理构建：Product → Clean Build Folder

### 问题：应用无法连接服务器
- 检查 `client/src/lib/trpc.ts` 中的服务器URL
- 确认服务器已部署并可访问
- 检查iOS的 `Info.plist` 中的网络权限配置

### 问题：白屏或加载失败
- 检查 `dist/public/index.html` 是否存在
- 运行 `npx cap sync ios` 重新同步资源
- 检查浏览器控制台（在Safari中调试WebView）

## 参考资源
- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Xcode Help](https://help.apple.com/xcode/)
