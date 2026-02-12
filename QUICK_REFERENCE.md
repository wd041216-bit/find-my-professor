# ProfMatch iOS应用 - 快速参考卡

## 🚀 首次打包流程（复制粘贴命令）

### 1. 初始化（在Mac上执行）

```bash
# 克隆项目
git clone <你的GitHub仓库URL>
cd find-my-professor

# 安装依赖
pnpm install

# 构建Web应用
pnpm run build

# 初始化iOS
npx cap add ios
npx cap sync ios
npx cap update ios

# 打开Xcode
npx cap open ios
```

### 2. 在Xcode中配置（点击操作）

- [ ] 选择 **TARGETS → App → General**
- [ ] 设置 **Bundle Identifier**: `com.profmatch.app`
- [ ] 设置 **Display Name**: `ProfMatch`
- [ ] 设置 **Version**: `1.0.0`
- [ ] 设置 **Build**: `1`
- [ ] 选择 **Signing & Capabilities**
- [ ] 勾选 **Automatically manage signing**
- [ ] 选择你的 **Team**

### 3. 测试（在Xcode中）

- [ ] 选择模拟器 **iPhone 15 Pro**
- [ ] 点击 **▶️ Run** 按钮
- [ ] 等待应用加载（约30秒）
- [ ] 验证应用功能正常

### 4. 打包和上传

```bash
# 在Xcode中：
# 1. 点击 Product → Archive
# 2. 等待完成
# 3. 点击 Distribute App
# 4. 选择 App Store Connect → Upload
# 5. 等待上传完成
```

### 5. 在App Store Connect中提交

1. 访问 https://appstoreconnect.apple.com
2. 点击 **➕ 新建App**
3. 填写：
   - 名称: `ProfMatch`
   - Bundle ID: `com.profmatch.app`
   - SKU: `profmatch-001`
4. 上传截图和描述
5. 点击 **提交以供审核**

---

## 📱 每次更新流程（1-2小时）

```bash
# 1. 修改代码（在代码编辑器中）
# 例如修改 client/src/pages/Swipe.tsx

# 2. 构建Web版本
pnpm run build

# 3. 同步到iOS
npx cap sync ios
npx cap update ios

# 4. 在Xcode中测试
npx cap open ios
# 在Xcode中点击 ▶️ Run

# 5. 更新版本号（在Xcode中）
# TARGETS → App → General
# Version: 1.0.1 (改为新版本)
# Build: 2 (改为新数字)

# 6. Archive并上传（在Xcode中）
# Product → Archive → Distribute App → Upload

# 7. 在App Store Connect中提交
# 填写新功能说明，点击提交
```

---

## 💳 集成Stripe支付

### 1. 添加依赖

```bash
pnpm add @stripe/stripe-react-native
npx cap sync ios
```

### 2. 创建支付组件

创建 `client/src/components/StripePayment.tsx`：

```tsx
import { useEffect } from 'react';
import { initStripe, presentPaymentSheet } from '@stripe/stripe-react-native';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';

export function StripePayment() {
  const { mutate: createPaymentIntent } = trpc.payment.createPaymentIntent.useMutation();

  useEffect(() => {
    initStripe({
      publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
    });
  }, []);

  const handlePayment = async () => {
    createPaymentIntent(
      { amount: 9.99, currency: 'usd' },
      {
        onSuccess: async (data) => {
          const { error } = await presentPaymentSheet();
          if (!error) {
            alert('支付成功！');
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

### 3. 测试支付

使用Stripe测试卡：
- **卡号**: `4242 4242 4242 4242`
- **过期日期**: `12/25`
- **CVC**: `123`

---

## 🔧 常见问题速查

| 问题 | 解决方案 |
|------|--------|
| Pod install失败 | `rm -rf ios/Pods && npx cap sync ios` |
| Provisioning profile错误 | Xcode → Preferences → Accounts → 登录Apple ID |
| 应用在真机上崩溃 | 查看Xcode Console输出，搜索ERROR |
| App Store审核被拒 | 查看拒绝邮件，修改后重新提交 |
| 支付不工作 | 检查VITE_STRIPE_PUBLISHABLE_KEY环境变量 |

---

## 📊 版本号规则

```
主版本.次版本.修订版本

1.0.0 → 1.0.1  (Bug修复)
1.0.0 → 1.1.0  (新功能)
1.0.0 → 2.0.0  (重大更新)
```

---

## ✅ 更新检查清单

每次更新前检查：

```
□ 代码已修改并在浏览器中测试
□ pnpm run build 成功
□ npx cap sync ios 成功
□ 在模拟器中测试通过
□ 在真机上测试通过
□ 版本号已更新
□ Archive已创建
□ 已上传到App Store Connect
□ 已在App Store Connect中提交审核
```

---

## 🎯 关键时间

| 步骤 | 时间 |
|------|------|
| 初始化iOS项目 | 5分钟 |
| 在模拟器中测试 | 5分钟 |
| Archive打包 | 10分钟 |
| 上传到App Store | 5分钟 |
| **App Store审核** | **1-7天** |
| 每次更新 | 1-2小时 |

---

## 📞 快速链接

- **App Store Connect**: https://appstoreconnect.apple.com
- **Apple Developer**: https://developer.apple.com
- **Capacitor文档**: https://capacitorjs.com/docs
- **Stripe文档**: https://stripe.com/docs
- **App Store审核指南**: https://developer.apple.com/app-store/review/guidelines/

---

## 💡 Pro Tips

1. **自动化更新**：创建一个shell脚本自动执行更新流程
2. **测试账号**：为App Store审核创建专用测试账号
3. **版本控制**：每个App Store版本都在Git中创建一个tag
4. **监控审核**：订阅App Store Connect的邮件通知
5. **备份**：定期备份Xcode项目和代码

---

## 🚨 重要提醒

- ⚠️ 首次发布需要1-7天等待App Store审核
- ⚠️ 每次更新都需要新的版本号
- ⚠️ 测试卡号只能在Stripe沙箱环境中使用
- ⚠️ 生产环境使用真实Stripe密钥前，确保已通过KYC验证
- ⚠️ 应用上架后，更新会自动推送给用户

---

**最后更新**: 2026年2月12日
**版本**: 1.0
