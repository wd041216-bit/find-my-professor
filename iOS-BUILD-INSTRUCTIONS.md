# iOS应用上架完整指南

## ✅ 已完成的配置

### 1. Capacitor配置
- ✅ 已安装 `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`
- ✅ 已初始化Capacitor配置（`capacitor.config.ts`）
- ✅ 已添加iOS平台
- ✅ 已同步Web资源到iOS项目

### 2. 生产环境配置
- ✅ **生产URL已配置**: `https://www.findmyprofessor.xyz`
- ✅ **自动环境切换**: 开发环境使用localhost，生产环境使用www.findmyprofessor.xyz
- ✅ **最新构建已完成**: Web资源已构建并同步到iOS项目

### 3. 项目信息
- **应用名称**: Find My Professor
- **Bundle ID**: com.findmyprofessor.app
- **Xcode项目路径**: `ios/App/App.xcodeproj`

---

## 📱 在Mac上完成上架（3个步骤）

### 步骤1：下载项目到Mac并安装依赖

#### 方法A：通过管理界面下载
1. 点击项目管理界面的 **"Code"** 标签
2. 点击 **"Download All Files"** 下载zip文件
3. 解压到Mac上的任意目录

#### 方法B：通过Git（如果已导出到GitHub）
```bash
git clone <your-repo-url>
cd find-my-professor
```

#### 安装依赖
```bash
cd find-my-professor
pnpm install
```

---

### 步骤2：在Xcode中配置签名并测试

#### 2.1 打开Xcode项目
```bash
cd ios/App
open App.xcodeproj
```

#### 2.2 配置签名（关键步骤）
1. 左侧选择项目 **"App"**（蓝色图标）
2. 点击 **"Signing & Capabilities"** 标签
3. **Team** 下拉框选择您的Apple Developer账号
   - 如果没有显示，点击 "Add Account..." 登录
4. 确认 **Bundle Identifier** 为 `com.findmyprofessor.app`
   - 如果提示Bundle ID已被占用，改为 `com.yourname.findmyprofessor`
   - **重要**: 如果修改了Bundle ID，需要同步修改 `capacitor.config.ts` 中的 `appId`
5. 勾选 **"Automatically manage signing"**

#### 2.3 测试运行
1. 顶部选择模拟器（如 iPhone 15 Pro）或连接真机
2. 点击 ▶️ 运行按钮
3. **测试所有功能**：
   - ✅ 登录/注册（使用生产服务器）
   - ✅ Swipe滑动浏览教授
   - ✅ Profile编辑个人信息
   - ✅ Match History查看匹配记录
   - ✅ Generate Cover Letter生成推荐信

**如果测试失败**：
- 检查网络连接
- 确认 `https://www.findmyprofessor.xyz` 可以正常访问
- 在Safari中打开开发者工具查看错误信息

---

### 步骤3：打包并上传到App Store Connect

#### 3.1 Archive（打包）
1. Xcode顶部菜单：**Product** → **Destination** → **Any iOS Device (arm64)**
2. **Product** → **Archive**
3. 等待5-10分钟（首次编译较慢）
4. 完成后会自动打开 **Organizer** 窗口

#### 3.2 上传到App Store Connect
在Organizer中：
1. 选择刚才的Archive
2. 点击 **"Distribute App"**
3. 选择 **"App Store Connect"**
4. 选择 **"Upload"**
5. 保持默认选项，点击 **"Next"** → **"Upload"**
6. 等待上传完成（5-15分钟，取决于网速）

---

## 🎯 在App Store Connect中配置应用

### 1. 登录并创建应用
访问：https://appstoreconnect.apple.com

1. 点击 **"我的App"** → **"+"** → **"新建App"**
2. 填写信息：
   - **平台**：iOS
   - **名称**：Find My Professor
   - **主要语言**：简体中文
   - **Bundle ID**：选择 `com.findmyprofessor.app`
   - **SKU**：`FMP001`（随便填）
   - **用户访问权限**：完全访问权限

### 2. 填写App信息

#### 必填项目清单：

**App信息**：
- ✅ **隐私政策URL**: `https://www.findmyprofessor.xyz/privacy`（需要创建隐私政策页面）
- ✅ **类别**: 教育 → 参考资料
- ✅ **内容版权**: © 2026 Your Name

**定价和销售范围**：
- ✅ **价格**: 免费
- ✅ **销售范围**: 选择国家/地区（建议先选中国和美国）

**App预览和截图**（必填）：

需要准备以下尺寸的截图：
- **6.7英寸显示屏**（iPhone 15 Pro Max）：至少1张，最多10张
  - 尺寸：1290 x 2796 像素
- **5.5英寸显示屏**（iPhone 8 Plus）：至少1张，最多10张
  - 尺寸：1242 x 2208 像素

**如何获取截图**：
```bash
# 在Xcode中运行App
# 选择对应尺寸的模拟器
# 按 Cmd + S 保存截图
# 截图会自动保存到桌面
```

建议截图内容：
1. Swipe页面（展示教授卡片）
2. Profile页面（展示个人信息编辑）
3. Match History页面（展示匹配列表）
4. Cover Letter生成页面

**App描述**（推荐文案）：
```
Find My Professor 是一款智能教授匹配应用，帮助学生找到最适合的研究导师。

【主要功能】
• 智能匹配：基于研究兴趣和学术背景，为您推荐最匹配的教授
• 滑动浏览：像Tinder一样轻松浏览教授信息
• 匹配历史：查看所有喜欢的教授，随时回顾
• AI推荐信：一键生成个性化的套磁信

【适用人群】
• 准备申请研究生的本科生
• 寻找博士导师的硕士生
• 希望联系教授的科研爱好者

【为什么选择Find My Professor】
• 精准匹配：基于AI算法，匹配度高达90%
• 节省时间：不再需要手动搜索数百个教授主页
• 提高成功率：个性化推荐信模板，提升套磁成功率
```

**关键词**（用逗号分隔，最多100字符）：
```
教授,导师,研究生,博士,科研,学术,匹配,推荐
```

**技术支持URL**：
```
https://www.findmyprofessor.xyz/contact
```

**营销URL**（可选）：
```
https://www.findmyprofessor.xyz
```

### 3. 提交审核

1. 在左侧选择 **"App Store"** 标签
2. 点击 **"准备提交"** 旁边的 **"+"** 添加版本（如 1.0）
3. 在 **"构建版本"** 中选择刚才上传的版本
   - 如果没有显示，等待10-30分钟（Apple处理中）
4. 填写 **"此版本的新增内容"**：
   ```
   首次发布！
   • 智能教授匹配功能
   • 个人档案管理
   • 匹配历史查看
   • AI推荐信生成
   ```
5. **年龄分级**：点击编辑，根据实际情况填写（通常是 4+）
6. **App审核信息**：
   - 提供测试账号（如果需要登录）
   - 填写联系信息
   - 备注说明（可选）
7. 点击右上角 **"提交以供审核"**

---

## ⏰ 审核和发布

### 审核时间
- **首次审核**：通常1-3天
- **更新审核**：通常1-2天

### 可能被拒的原因及解决方案

| 拒绝原因 | 解决方案 |
|---------|---------|
| 缺少隐私政策 | 创建隐私政策页面并提供URL |
| 功能不完整 | 确保所有功能都能正常使用 |
| 需要登录才能使用 | 提供测试账号或添加游客模式 |
| 元数据问题 | 确保截图、描述与实际功能一致 |
| 性能问题 | 优化加载速度，减少崩溃 |

### 审核通过后
1. 收到邮件通知
2. 在App Store Connect中点击 **"发布此版本"**
3. 2-24小时后在App Store上架

---

## 🔄 后续更新流程

### 更新Web内容（无需重新上架）
大部分更新只需修改Web代码：
```bash
# 修改代码
# 发布到生产服务器
# App自动获取最新内容
```

### 更新原生功能（需要重新上架）
如果修改了：
- App图标
- 启动画面
- 原生功能（如推送通知）
- Capacitor配置

则需要：
```bash
# 1. 重新构建
pnpm run build

# 2. 同步到iOS
npx cap sync ios

# 3. 在Xcode中Archive并上传
# 4. 在App Store Connect中提交新版本
```

---

## 🆘 故障排查

### 问题：构建失败
**解决方案**：
- 检查Xcode版本（需要最新版本）
- 检查iOS Deployment Target（建议iOS 13.0+）
- 清理构建：Product → Clean Build Folder

### 问题：应用无法连接服务器
**解决方案**：
- 检查 `https://www.findmyprofessor.xyz` 是否可访问
- 检查服务器是否正常运行
- 在Safari中打开开发者工具查看网络请求

### 问题：白屏或加载失败
**解决方案**：
- 检查 `dist/public/index.html` 是否存在
- 运行 `npx cap sync ios` 重新同步资源
- 在Xcode中查看控制台日志

### 问题：签名失败
**解决方案**：
- 确认Apple Developer账号有效
- 检查证书是否过期
- 尝试手动创建Provisioning Profile

---

## 📚 参考资源

- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Xcode Help](https://help.apple.com/xcode/)

---

## 📝 重要提示

1. **生产服务器必须稳定运行**：App依赖 `https://www.findmyprofessor.xyz`，确保服务器24/7在线
2. **保持Bundle ID一致**：如果修改了Bundle ID，需要同步修改所有配置文件
3. **定期更新证书**：Apple Developer证书每年需要更新
4. **遵守App Store审核指南**：避免违规内容和功能

---

**祝您上架顺利！🎉**

如有问题，请查看上方的故障排查部分或访问Apple开发者论坛。
