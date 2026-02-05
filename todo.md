# Find My Professor - TODO List

## 联系消息邮件通知
- [x] 检查Manus邮件API配置和文档
- [x] 使用现有的notifyOwner函数（已有邮件通知服务）
- [x] 设计联系消息邮件模板（支持三种消息类型）
- [x] 集成邮件通知到contact message router
- [x] 编写单元测试验证邮件发送
- [x] 测试邮件发送功能（4个测试全部通过）
- [x] 保存checkpoint

## 积分系统和匹配逻辑修复
- [x] 修复积分不足弹窗显示实际剩余积分（当前恒定显示0）
- [x] 修改"购买积分"按钮跳转到Contact页面（付费功能未开通）
- [x] 更新弹窗文案说明中国用户可通过联系管理员购买积分
- [x] 修复简化匹配策略：数据库为空时应触发LLM+爬虫补充数据
- [x] 添加用户信息完整性验证：未填写必填字段时友好提示
- [x] 编写单元测试验证所有修复
- [x] 保存checkpoint

## "换一批"功能和移动端积分显示
- [x] 设计"换一批"后端API逻辑（优先数据库随机选择，不足时调用LLM）
- [x] 实现refreshMatches tRPC mutation
- [x] 在Explore页面添加"换一批"按钮UI
- [x] 添加"换一批"翻译键（中英文）
- [x] 在移动端导航栏添加积分显示图标
- [x] 优化积分显示的响应式设计
- [ ] 编写单元测试验证功能
- [x] 测试所有功能并保存checkpoint

## 修复"换一批"积分消耗
- [x] 修改refreshMatches后端逻辑，统一消耗40积分（不区分数据库/LLM策略）
- [x] 更新前端Explore页面的积分提示文案
- [x] 更新单元测试验证40积分消耗
- [x] 保存checkpoint

## 修复简化profile匹配错误
- [ ] 检查服务器日志定位"Cannot read properties of undefined (reading '0')"错误
- [x] 修复代码中的undefined访问问题（可能在数组访问或对象属性读取）
- [x] 测试MIT+生物（中文专业名）的匹配场景
- [x] 保存checkpoint

## Contact页面添加积分定价信息
- [x] 在i18n中添加定价信息翻译（1美金100积分 或 7人民币100积分）
- [x] 更新ContactDialog组件，在"购买积分"表单中显示定价
- [x] 测试中英文显示效果
- [x] 保存checkpoint
