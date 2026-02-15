# ProfMatch iOS应用完整打包、更新和支付指南（更新版）

本指南提供**完整的、逐步可操作的命令**，让你能够将ProfMatch打包成iOS应用、更新应用、以及集成支付功能。

---

## 📋 目录

1. [前置要求](#前置要求)
2. [第一部分：初始化和本地测试](#第一部分初始化和本地测试)
3. [第二部分：Xcode配置](#第二部分xcode配置)
4. [第三部分：打包和上传App Store](#第三部分打包和上传app-store)
5. [第四部分：应用更新工作流](#第四部分应用更新工作流)
6. [第五部分：集成Stripe支付](#第五部分集成stripe支付)
7. [常见问题解决](#常见问题解决)

---

## 前置要求

### 必需软件
- **Mac电脑**（macOS 13.0+）
- **Xcode 15+**（从App Store免费下载）
- **Node.js 18+**（已安装）
- **CocoaPods**（iOS依赖管理）

### 必需账号
- **Apple Developer账号**（$99/年）
- **Apple ID**（用于登录Xcode）

### 安装CocoaPods（重要！）

CocoaPods 是 iOS 项目的依赖管理工具，**必须正确安装**才能继续后续步骤。

#### 方法1：使用 Homebrew 安装（推荐，适用于 macOS 13+）

```bash
# 如果还没安装 Homebrew，先安装它
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 使用 Homebrew 安装 CocoaPods
brew install cocoapods

# 验证安装
pod --version
# 输出: 1.13.0 (或更高版本)
```

**为什么推荐 Homebrew？**
- 避免系统 Ruby 权限问题
- 自动处理依赖关系
- 更新和卸载更方便

#### 方法2：使用系统 Ruby 安装（传统方法）

```bash
# 安装 CocoaPods
sudo gem install cocoapods

# 验证安装
pod --version
# 输出: 1.13.0 (或更高版本)
```

**如果遇到权限错误：**

```bash
# 错误示例：
# ERROR: While executing gem ... (Gem::FilePermissionError)
# You don't have write permissions for the /Library/Ruby/Gems/2.6.0 directory.

# 解决方案：使用 --user-install 参数
gem install cocoapods --user-install

# 然后添加到 PATH（将以下行添加到 ~/.zshrc 或 ~/.bash_profile）
export PATH=$HOME/.gem/ruby/2.6.0/bin:$PATH

# 重新加载配置
source ~/.zshrc  # 或 source ~/.bash_profile
```

#### 方法3：使用 rbenv 管理 Ruby 版本（高级用户）

```bash
# 安装 rbenv
brew install rbenv ruby-build

# 初始化 rbenv
rbenv init

# 安装最新的 Ruby 版本
rbenv install 3.2.0
rbenv global 3.2.0

# 安装 CocoaPods
gem install cocoapods

# 验证安装
pod --version
```

#### 验证 CocoaPods 安装成功

```bash
# 检查版本
pod --version

# 设置 CocoaPods（首次安装需要）
pod setup

# 预期输出：
# Setting up CocoaPods master repo
# Setup completed
```

#### 常见问题排查

**问题1：`pod: command not found`**

```bash
# 解决方案：检查 PATH 配置
echo $PATH

# 如果没有看到 gem 的 bin 目录，添加到 PATH
export PATH=$HOME/.gem/ruby/2.6.0/bin:$PATH

# 或者重新安装 CocoaPods
brew install cocoapods
```

**问题2：`sudo gem install` 卡住不动**

```bash
# 解决方案：更换 gem 源为国内镜像
gem sources --remove https://rubygems.org/
gem sources --add https://gems.ruby-china.com/
gem sources -l

# 然后重新安装
sudo gem install cocoapods
```

**问题3：安装成功但 `pod setup` 很慢**

```bash
# 解决方案：使用国内 CocoaPods 镜像
cd ~/.cocoapods/repos
pod repo remove master
git clone https://mirrors.tuna.tsinghua.edu.cn/git/CocoaPods/Specs.git master

# 或者跳过 setup（Capacitor 会自动处理）
# 直接进行下一步
```

---

## 第一部分：初始化和本地测试

### 步骤1：在Mac上克隆项目

```bash
# 克隆项目到本地
git clone https://github.com/你的用户名/find-my-professor.git
cd find-my-professor

# 安装所有依赖
pnpm install
```

### 步骤2：构建Web应用

```bash
# 构建生产版本（这是打包iOS应用的基础）
pnpm run build

# 验证构建成功
ls -la client/dist
# 应该看到 index.html, assets/ 等文件
```

### 步骤3：初始化Capacitor iOS项目

```bash
# 如果还没有iOS文件夹，添加iOS平台
npx cap add ios

# 同步Web代码到iOS项目
npx cap sync ios

# 更新iOS依赖（这会自动调用 CocoaPods）
npx cap update ios
```

**预期输出：**
```
✔ Copying web assets from client/dist to ios/App/App/public
✔ Updating iOS native dependencies with CocoaPods
✔ Syncing Capacitor plugins
```

**如果遇到 CocoaPods 错误：**

```bash
# 错误示例：
# [error] CocoaPods could not find compatible versions for pod "Capacitor"

# 解决方案1：清理并重新安装
cd ios/App
pod deintegrate
pod install
cd ../..

# 解决方案2：更新 CocoaPods 仓库
pod repo update
cd ios/App
pod install
cd ../..

# 解决方案3：删除 Podfile.lock 并重新安装
cd ios/App
rm Podfile.lock
pod install
cd ../..
```

### 步骤4：在模拟器中测试

```bash
# 打开Xcode项目
npx cap open ios
```

**在Xcode中：**
1. 左侧选择 **App** 项目
2. 顶部选择 **iPhone 15 Pro** 模拟器
3. 点击 **▶️ Run** 按钮（或按 `⌘ + R`）
4. 等待模拟器启动和应用加载（约30秒）
5. 验证应用能正常运行

**如果模拟器无法启动：**

```bash
# 在 Xcode 中：
# Product → Clean Build Folder (⇧⌘K)
# 然后重新运行
```

---

## 第二部分：Xcode配置

### 步骤1：配置应用身份

在Xcode中：

1. 左侧导航栏选择 **App** 项目
2. 选择 **TARGETS → App**
3. 点击 **General** 标签页
4. 填写以下信息：

```
Bundle Identifier: com.profmatch.app
Display Name: ProfMatch
Version: 1.0.0
Build: 1
```

### 步骤2：配置代码签名

1. 选择 **Signing & Capabilities** 标签页
2. 勾选 **Automatically manage signing**
3. 在 **Team** 下拉菜单中选择你的Apple Developer账号
4. Xcode会自动创建Provisioning Profile

**如果没有看到Team选项：**
```bash
# 在Xcode中登录Apple ID
Xcode → Settings → Accounts
# 点击 + 添加你的Apple ID
```

### 步骤3：配置应用图标

1. 左侧导航栏找到 **Assets.xcassets**
2. 点击 **AppIcon**
3. 从项目的 `client/public/` 目录中找到 `icon-192.png` 和 `icon-512.png`
4. 将图标拖入对应的尺寸框

**快速方法（使用在线工具）：**
- 访问 https://appicon.co
- 上传 `icon-512.png`
- 下载iOS图标包
- 将所有图标拖入Xcode的AppIcon

### 步骤4：配置启动画面

1. 左侧导航栏找到 **LaunchScreen.storyboard**
2. 设计启动画面（可以使用ProfMatch logo）
3. 或保持默认的白色背景

### 步骤5：配置Info.plist（如果需要特殊权限）

如果应用需要访问相机、照片库等，在 **Info.plist** 中添加：

```xml
<!-- 相机权限 -->
<key>NSCameraUsageDescription</key>
<string>ProfMatch需要访问相机来上传你的个人照片</string>

<!-- 照片库权限 -->
<key>NSPhotoLibraryUsageDescription</key>
<string>ProfMatch需要访问照片库来选择个人照片</string>
```

---

## 第三部分：打包和上传App Store

### 步骤1：创建App Store Connect应用

1. 访问 https://appstoreconnect.apple.com
2. 点击 **我的App → ➕ 新建App**
3. 填写信息：

```
平台: iOS
名称: ProfMatch
主要语言: 简体中文
套件ID: com.profmatch.app
SKU: profmatch-001
```

4. 点击 **创建**

### 步骤2：准备App Store素材

#### 应用截图

需要为以下屏幕尺寸提供截图（至少3张，最多10张）：

| 屏幕尺寸 | 分辨率 | 设备 |
|---------|--------|------|
| 6.7英寸 | 1290 × 2796 | iPhone 15 Pro Max |
| 6.5英寸 | 1242 × 2688 | iPhone 14 Pro Max |
| 5.5英寸 | 1242 × 2208 | iPhone 8 Plus |

**如何获取截图：**

```bash
# 在Xcode模拟器中运行应用
# 按 ⌘ + S 保存截图到桌面

# 或使用快捷键截图
# 按 Shift + Command + 4 选择区域截图
```

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

### 步骤3：在Xcode中Archive（打包）

```bash
# 在Xcode中执行以下操作：
# 1. 确保选择了 "Any iOS Device (arm64)" 或你的真实设备
# 2. 点击菜单 Product → Archive
# 3. 等待打包完成（5-15分钟）
```

**或使用命令行打包：**

```bash
# 构建Archive
xcodebuild -workspace ios/App/App.xcworkspace \
  -scheme App \
  -configuration Release \
  -derivedDataPath build \
  archive -archivePath build/App.xcarchive

# 导出IPA文件
xcodebuild -exportArchive \
  -archivePath build/App.xcarchive \
  -exportOptionsPlist ios/ExportOptions.plist \
  -exportPath build/
```

### 步骤4：上传到App Store

**方法1：使用Xcode（推荐）**

1. Archive完成后，Xcode会打开 **Organizer** 窗口
2. 选择刚才创建的Archive
3. 点击 **Distribute App**
4. 选择 **App Store Connect**
5. 选择 **Upload**
6. 点击 **Next** 并等待上传完成

**方法2：使用命令行**

```bash
# 使用altool上传（需要App-specific password）
xcrun altool --upload-app \
  --file build/ProfMatch.ipa \
  --type ios \
  --apiKey <你的API Key ID> \
  --apiIssuer <你的Issuer ID>
```

### 步骤5：在App Store Connect中提交审核

1. 访问 https://appstoreconnect.apple.com
2. 选择你的应用 **ProfMatch**
3. 点击 **➕ 版本或平台**
4. 填写版本信息：

```
版本号: 1.0.0
新功能: 首次发布
```

5. 上传截图和应用描述
6. 填写 **App审核信息**：
   - 联系人邮箱
   - 测试账号（如果需要登录）
   - 隐私政策URL

7. 点击 **提交以供审核**

**预期审核时间：1-7天（通常2-3天）**

---

## 第四部分：应用更新工作流

当你需要更新应用时，遵循以下步骤：

### 更新流程（每次更新都要做）

#### 步骤1：修改代码并测试

```bash
# 在你的代码编辑器中修改代码
# 例如修改Swipe.tsx、Profile.tsx等

# 在本地测试
pnpm run dev
# 在浏览器中验证修改
```

#### 步骤2：构建新的Web版本

```bash
# 停止开发服务器（Ctrl + C）

# 构建生产版本
pnpm run build

# 验证构建成功
ls -la client/dist
```

#### 步骤3：同步到iOS项目

```bash
# 同步Web代码到iOS
npx cap sync ios

# 更新iOS依赖
npx cap update ios
```

#### 步骤4：在模拟器中测试新版本

```bash
# 打开Xcode
npx cap open ios
```

在Xcode中：
1. 选择模拟器
2. 点击 **▶️ Run** 测试新版本
3. 验证所有功能正常

#### 步骤5：更新版本号

在Xcode中：
1. 选择 **TARGETS → App**
2. 点击 **General** 标签页
3. 更新版本号：

```
Version: 1.0.1  (从1.0.0升级到1.0.1)
Build: 2        (从1升级到2)
```

**版本号规则：**
- **主版本.次版本.修订版本** (例如：1.0.1)
- 新功能：升级次版本 (1.0.0 → 1.1.0)
- Bug修复：升级修订版本 (1.0.0 → 1.0.1)
- 重大更新：升级主版本 (1.0.0 → 2.0.0)

#### 步骤6：Archive并上传

```bash
# 在Xcode中：
# 1. 选择 Product → Archive
# 2. 等待打包完成
# 3. 点击 Distribute App → App Store Connect → Upload
```

#### 步骤7：在App Store Connect中提交新版本

1. 访问 https://appstoreconnect.apple.com
2. 选择 **ProfMatch**
3. 点击 **➕ 版本或平台**
4. 填写新版本信息：

```
版本号: 1.0.1
新功能: 
- 修复了Swipe页面的显示问题
- 优化了教授匹配算法
- 改进了用户界面
```

5. 上传新的截图（如果有UI变化）
6. 点击 **提交以供审核**

---

## 第五部分：集成Stripe支付

### 为什么在应用中集成支付？

- 用户可以在应用内直接购买高级功能
- 支持订阅模式（月度/年度）
- 自动处理支付和退款

### 步骤1：在项目中添加Stripe依赖

```bash
# 添加Stripe React Native库
pnpm add @stripe/stripe-react-native

# 同步到iOS
npx cap sync ios
```

### 步骤2：在Xcode中配置Stripe

1. 打开Xcode项目：`npx cap open ios`
2. 选择 **TARGETS → App**
3. 点击 **Build Phases**
4. 展开 **Link Binary With Libraries**
5. 点击 **+** 添加以下框架：
   - Stripe.framework
   - StripeCore.framework

### 步骤3：在应用中实现支付流程

创建一个支付组件 `client/src/components/StripePayment.tsx`：

```tsx
import { useEffect } from 'react';
import { initStripe, presentPaymentSheet } from '@stripe/stripe-react-native';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';

export function StripePayment() {
  const { mutate: createPaymentIntent } = trpc.payment.createPaymentIntent.useMutation();

  useEffect(() => {
    // 初始化Stripe（使用你的Publishable Key）
    initStripe({
      publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
    });
  }, []);

  const handlePayment = async () => {
    // 1. 从后端创建Payment Intent
    createPaymentIntent(
      { amount: 9.99, currency: 'usd' },
      {
        onSuccess: async (data) => {
          // 2. 显示支付表单
          const { error } = await presentPaymentSheet();
          
          if (!error) {
            alert('支付成功！');
          } else {
            alert(`支付失败: ${error.message}`);
          }
        },
      }
    );
  };

  return (
    <Button onClick={handlePayment} className="w-full">
      升级到高级版本 ($9.99/月)
    </Button>
  );
}
```

---

## 常见问题解决

### 问题1：CocoaPods 安装失败

**症状：** `sudo gem install cocoapods` 报权限错误

**解决方案：**
```bash
# 方法1：使用 Homebrew（推荐）
brew install cocoapods

# 方法2：使用 --user-install
gem install cocoapods --user-install
export PATH=$HOME/.gem/ruby/2.6.0/bin:$PATH
```

### 问题2：`pod install` 很慢或卡住

**症状：** 执行 `pod install` 后长时间没有响应

**解决方案：**
```bash
# 使用国内镜像
cd ~/.cocoapods/repos
pod repo remove master
git clone https://mirrors.tuna.tsinghua.edu.cn/git/CocoaPods/Specs.git master

# 或者跳过 repo update
cd ios/App
pod install --verbose --no-repo-update
```

### 问题3：Xcode 构建失败

**症状：** 点击 Run 后出现编译错误

**解决方案：**
```bash
# 清理构建缓存
# 在 Xcode 中：Product → Clean Build Folder (⇧⌘K)

# 重新安装 Pods
cd ios/App
rm -rf Pods Podfile.lock
pod install
cd ../..

# 重新同步
npx cap sync ios
```

### 问题4：模拟器无法启动

**症状：** 点击 Run 后模拟器启动失败

**解决方案：**
```bash
# 重置模拟器
# 在 Xcode 中：Window → Devices and Simulators
# 右键点击模拟器 → Delete
# 然后重新创建一个新的模拟器
```

### 问题5：Archive 失败

**症状：** Product → Archive 时出现错误

**解决方案：**
```bash
# 确保选择了正确的设备
# 顶部选择 "Any iOS Device (arm64)" 而不是模拟器

# 检查代码签名
# Signing & Capabilities → 确保 Team 已选择

# 清理并重新构建
# Product → Clean Build Folder
# 然后重新 Archive
```

### 问题6：上传到 App Store 失败

**症状：** Distribute App 时上传失败

**解决方案：**
```bash
# 检查网络连接
# 确保没有使用 VPN

# 使用命令行上传
xcrun altool --upload-app \
  --file build/ProfMatch.ipa \
  --type ios \
  --apiKey <你的API Key ID> \
  --apiIssuer <你的Issuer ID>
```

---

## 快速参考

### 完整工作流程总结

```bash
# 1. 克隆项目
git clone https://github.com/你的用户名/find-my-professor.git
cd find-my-professor

# 2. 安装依赖
pnpm install

# 3. 构建 Web 应用
pnpm run build

# 4. 初始化 iOS 项目
npx cap add ios
npx cap sync ios

# 5. 打开 Xcode
npx cap open ios

# 6. 在 Xcode 中配置并运行
# - 配置 Bundle Identifier
# - 配置代码签名
# - 选择模拟器并点击 Run

# 7. Archive 并上传
# - Product → Archive
# - Distribute App → App Store Connect → Upload

# 8. 在 App Store Connect 中提交审核
```

### 更新应用流程总结

```bash
# 1. 修改代码并测试
pnpm run dev

# 2. 构建新版本
pnpm run build

# 3. 同步到 iOS
npx cap sync ios

# 4. 在 Xcode 中更新版本号并 Archive
# - 更新 Version 和 Build
# - Product → Archive
# - 上传到 App Store Connect

# 5. 在 App Store Connect 中提交新版本审核
```

---

## 联系支持

如果遇到问题，可以：

1. 查看 [Capacitor 官方文档](https://capacitorjs.com/docs)
2. 查看 [CocoaPods 官方文档](https://cocoapods.org)
3. 访问 [Apple Developer 论坛](https://developer.apple.com/forums/)
4. 查看项目的 GitHub Issues

---

**祝你打包顺利！🎉**
