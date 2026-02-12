# ProfMatch iOS应用打包指南

本指南将帮助你将ProfMatch网站打包成原生iOS应用，并发布到App Store。

---

## 📱 方案概述

使用**Capacitor**将React网站打包成原生iOS应用，保留所有Web功能的同时获得原生应用体验。

### 优点
- ✅ 真正的原生iOS应用
- ✅ 可以发布到App Store
- ✅ 支持离线使用（需配置）
- ✅ 访问原生iOS功能（相机、通知等）
- ✅ 完美的性能和用户体验

### 缺点
- ❌ 需要Mac电脑和Xcode
- ❌ 需要Apple Developer账号（$99/年）
- ❌ 首次打包需要1-2小时
- ❌ App Store审核需要1-7天

---

## 前置要求

### 1. 硬件和软件
- **Mac电脑**（macOS 13.0或更高版本）
- **Xcode 15+**（从App Store免费下载）
- **Node.js 18+**（已安装）
- **CocoaPods**（iOS依赖管理工具）

### 2. Apple Developer账号
- 注册地址：https://developer.apple.com
- 费用：$99/年（个人）或$299/年（企业）
- 用途：代码签名、App Store发布

### 3. 安装CocoaPods

```bash
# 安装CocoaPods
sudo gem install cocoapods

# 验证安装
pod --version
```

---

## 第一部分：本地开发环境配置

### 步骤1：克隆项目到Mac

```bash
# 克隆项目（或从GitHub下载）
git clone <your-repo-url>
cd find-my-professor

# 安装依赖
pnpm install
```

### 步骤2：构建Web应用

```bash
# 构建生产版本
pnpm run build

# 确认构建成功
ls -la client/dist
```

### 步骤3：初始化iOS项目

```bash
# 添加iOS平台（如果还没有）
npx cap add ios

# 同步Web代码到iOS项目
npx cap sync ios

# 更新iOS依赖
npx cap update ios
```

### 步骤4：打开Xcode项目

```bash
# 在Xcode中打开iOS项目
npx cap open ios
```

这会打开Xcode，显示`App`项目。

---

## 第二部分：Xcode配置

### 步骤1：配置Bundle Identifier

1. 在Xcode左侧选择 **App** 项目
2. 选择 **TARGETS → App**
3. 在 **General** 标签页中：
   - **Bundle Identifier**: `com.profmatch.app`（必须全球唯一）
   - **Display Name**: `ProfMatch`
   - **Version**: `1.0.0`
   - **Build**: `1`

### 步骤2：配置签名和团队

1. 选择 **Signing & Capabilities** 标签页
2. 勾选 **Automatically manage signing**
3. 在 **Team** 下拉菜单中选择你的Apple Developer团队
4. Xcode会自动创建Provisioning Profile

### 步骤3：配置应用图标

1. 在左侧导航栏中找到 **Assets.xcassets**
2. 点击 **AppIcon**
3. 将准备好的图标拖入对应尺寸：
   - 20x20 (2x, 3x)
   - 29x29 (2x, 3x)
   - 40x40 (2x, 3x)
   - 60x60 (2x, 3x)
   - 76x76 (1x, 2x)
   - 83.5x83.5 (2x)
   - 1024x1024 (1x) - App Store图标

**快速生成所有尺寸：**
使用在线工具：https://appicon.co
上传1024x1024的PNG图标，下载iOS图标包。

### 步骤4：配置启动画面（Launch Screen）

1. 在左侧导航栏中找到 **LaunchScreen.storyboard**
2. 设计启动画面（可以使用ProfMatch logo和品牌色）
3. 或使用纯色背景（#faf5ff - 淡紫色）

### 步骤5：配置Info.plist

1. 在左侧导航栏中找到 **Info.plist**
2. 添加必要的权限说明（如果需要）：

```xml
<!-- 相机权限（如果需要上传头像） -->
<key>NSCameraUsageDescription</key>
<string>ProfMatch需要访问相机来上传你的个人照片</string>

<!-- 照片库权限 -->
<key>NSPhotoLibraryUsageDescription</key>
<string>ProfMatch需要访问照片库来选择个人照片</string>

<!-- 通知权限 -->
<key>NSUserNotificationsUsageDescription</key>
<string>ProfMatch会发送教授匹配通知</string>
```

---

## 第三部分：测试应用

### 在模拟器中测试

1. 在Xcode顶部选择目标设备：**iPhone 15 Pro**（或任意模拟器）
2. 点击 **▶️ Run** 按钮（或按 `⌘ + R`）
3. 应用会在模拟器中启动

### 在真机上测试

1. 用USB连接iPhone到Mac
2. 在iPhone上：**设置 → 通用 → VPN与设备管理 → 信任开发者**
3. 在Xcode顶部选择你的iPhone
4. 点击 **▶️ Run** 按钮
5. 应用会安装到你的iPhone上

---

## 第四部分：准备App Store发布

### 步骤1：创建App Store Connect应用

1. 访问：https://appstoreconnect.apple.com
2. 点击 **我的App → ➕ 新建App**
3. 填写信息：
   - **平台**: iOS
   - **名称**: ProfMatch
   - **主要语言**: 简体中文
   - **套装ID**: com.profmatch.app
   - **SKU**: profmatch-app-001（唯一标识符）

### 步骤2：准备App Store素材

需要准备以下素材：

#### 应用截图
- **6.7英寸屏幕**（iPhone 15 Pro Max）：至少3张，最多10张
- **6.5英寸屏幕**（iPhone 11 Pro Max）：至少3张，最多10张
- **5.5英寸屏幕**（iPhone 8 Plus）：至少3张，最多10张

**尺寸要求**：
- 6.7英寸：1290 x 2796 像素
- 6.5英寸：1242 x 2688 像素
- 5.5英寸：1242 x 2208 像素

**如何截图**：
1. 在Xcode模拟器中运行应用
2. 使用 `⌘ + S` 保存截图
3. 或使用真机截图后传到Mac

#### 应用预览视频（可选）
- 时长：15-30秒
- 格式：.mov, .m4v, .mp4
- 展示核心功能：滑动匹配、查看教授详情、生成求职信

#### 应用描述
```
ProfMatch - 智能学术导师匹配平台

🎓 找到最适合你的学术导师

通过类似Tinder的滑动体验，快速浏览全球顶尖大学的教授信息。基于你的研究兴趣和学术背景，ProfMatch为你推荐最匹配的导师。

✨ 核心功能：
• 智能匹配：基于研究领域和兴趣的精准推荐
• 滑动浏览：直观的左右滑动操作
• 教授详情：查看研究方向、发表论文、联系方式
• 求职信生成：AI辅助生成个性化学术求职信
• 匹配记录：保存你喜欢的教授列表

🌟 覆盖大学：
MIT、Harvard、Princeton、University of Washington等全球顶尖学府

📧 开始你的学术之旅
下载ProfMatch，找到改变你人生的导师！
```

#### 关键词
```
教授,学术,导师,研究生,PhD,留学,大学,匹配,求职信
```

### 步骤3：Archive和上传

1. 在Xcode中选择 **Product → Archive**
2. 等待构建完成（5-10分钟）
3. 在弹出的Organizer窗口中：
   - 选择刚才创建的Archive
   - 点击 **Distribute App**
   - 选择 **App Store Connect**
   - 选择 **Upload**
   - 点击 **Next** 并等待上传完成

### 步骤4：提交审核

1. 返回App Store Connect
2. 选择你的应用
3. 点击 **➕ 版本或平台**
4. 填写版本信息：
   - **版本号**: 1.0.0
   - **新功能**: 首次发布
   - **截图**: 上传准备好的截图
   - **描述**: 粘贴应用描述
   - **关键词**: 填写关键词
   - **支持URL**: https://findmyprofessor.xyz
   - **隐私政策URL**: https://findmyprofessor.xyz/privacy

5. 在 **构建版本** 中选择刚才上传的版本
6. 填写 **App审核信息**：
   - 联系人信息
   - 测试账号（如果需要登录）

7. 点击 **提交以供审核**

---

## 第五部分：审核和发布

### 审核流程

1. **等待审核**：1-7天（通常2-3天）
2. **审核中**：Apple团队测试你的应用
3. **审核结果**：
   - ✅ **批准**：应用自动上架App Store
   - ❌ **拒绝**：查看拒绝原因，修改后重新提交

### 常见拒绝原因

1. **功能不完整**：确保所有功能正常工作
2. **崩溃或Bug**：充分测试应用稳定性
3. **隐私政策缺失**：必须提供隐私政策链接
4. **元数据不准确**：截图和描述必须匹配实际功能
5. **需要登录但未提供测试账号**：提供有效的测试账号

### 发布后

应用批准后会自动在App Store上架，用户可以搜索"ProfMatch"下载。

---

## 第六部分：后续更新

### 更新应用流程

1. 修改代码并测试
2. 更新版本号（例如：1.0.0 → 1.1.0）
3. 构建Web应用：`pnpm run build`
4. 同步到iOS：`npx cap sync ios`
5. 在Xcode中Archive并上传
6. 在App Store Connect中创建新版本
7. 填写"新功能"说明
8. 提交审核

---

## 常见问题

### Q: 没有Mac电脑怎么办？

**方案1：租用Mac云服务**
- MacStadium：https://www.macstadium.com
- MacinCloud：https://www.macincloud.com
- 费用：约$20-50/月

**方案2：使用CI/CD服务**
- GitHub Actions（提供免费Mac runner）
- Bitrise
- Codemagic

**方案3：找朋友借用Mac**
- 只需要在打包和上传时使用Mac
- 平时开发可以在Windows/Linux上进行

### Q: 如何添加推送通知？

1. 在Capacitor中添加Push Notifications插件：
```bash
npm install @capacitor/push-notifications
npx cap sync
```

2. 在Apple Developer中创建APNs证书
3. 配置后端服务器发送推送

### Q: 如何实现离线功能？

添加Service Worker缓存策略（参考Mac App打包指南中的Service Worker配置）。

### Q: 应用体积太大怎么办？

1. 优化图片（使用WebP格式）
2. 移除未使用的依赖
3. 启用代码分割（Code Splitting）
4. 使用CDN加载大文件

### Q: 如何追踪应用使用数据？

集成分析工具：
- Google Analytics for Firebase
- Mixpanel
- Amplitude

---

## 技术支持

### 官方文档
- Capacitor: https://capacitorjs.com/docs
- Apple Developer: https://developer.apple.com/documentation
- App Store审核指南: https://developer.apple.com/app-store/review/guidelines/

### 社区资源
- Capacitor Discord: https://discord.com/invite/UPYYRhtyzp
- Stack Overflow: 搜索"capacitor ios"
- Apple Developer Forums: https://developer.apple.com/forums/

---

## 总结

将ProfMatch打包成iOS应用的完整流程：

1. ✅ 配置Capacitor（已完成）
2. ✅ 在Mac上安装Xcode和依赖
3. ✅ 构建Web应用并同步到iOS
4. ✅ 在Xcode中配置签名和图标
5. ✅ 在真机/模拟器上测试
6. ✅ 准备App Store素材
7. ✅ Archive并上传到App Store Connect
8. ✅ 提交审核并等待批准
9. ✅ 发布到App Store！

预计总时间：
- 首次打包：4-6小时
- App Store审核：2-7天
- 后续更新：1-2小时

祝你的应用顺利上架App Store！🎉
