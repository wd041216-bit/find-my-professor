# Find My Professor - TODO List

## SEO和UI优化任务

- [x] 修复首页SEO问题（添加H1标题）
- [x] 优化手机端UI（调整卡片大小，改善移动端观感）
- [x] 系统性修复卡片切换特效（确保动画在所有情况下都能正确显示）
- [x] 测试所有修复并保存checkpoint

## Match History匹配值显示

- [x] 分析Match History页面当前实现
- [x] 在后端添加匹配值计算逻辑
- [x] 更新前端Match History页面显示匹配值
- [x] 测试并保存checkpoint

## 移动端UI优化和Cover Letter功能

- [x] 优化Swipe页面手机端卡片尺寸（确保一屏显示所有功能）
- [x] 修复Generate Cover Letter功能（目前被禁用）
- [x] 创建Cover Letter管理页面
- [x] 创建移动端底部导航栏（整合页眉功能 + Cover Letter入口）
- [x] 测试并保存checkpoint

## Swipe页面UI和Filter逻辑优化

- [x] 移除Swipe页面顶部页眉（已有底部导航栏）
- [x] 隐藏教授加载计数显示（1/20等）
- [x] 重构Filter组件：Department改为Research Field（研究领域）
- [x] 支持独立筛选：可以只选领域、只选大学、或两者组合
- [x] 移除匹配度滑动条
- [x] 调整后端API：移除minMatchScore参数
- [x] 调整匹配值计算逻辑：仅在like后计算并保存
- [x] 测试并保存checkpoint

## 回退桌面端修改和收集教授数据

- [x] 回退桌面端和平板端的卡片尺寸修改（仅保留移动端优化）
- [x] 保存checkpoint并同步到GitHub
- [x] 收集美国Top 10大学教授信息（脚本已创建，正在后台运行）

## 重新设计数据收集脚本

- [x] 重新设计脚本：按大学→专业→Top 5教授的结构收集
- [x] 运行脚本收集数据（预期750教授，正在后台运行）
- [x] 验证数据并保存checkpoint（已收集258位教授，API配额用尽）

## Princeton University完整数据收集

- [x] 搜索Princeton University的完整专业列表（103个专业）
- [x] 创建Princeton专用数据收集脚本（每个专业Top 3教授，覆盖已有数据）
- [ ] 运行脚本收集数据（Perplexity API配额用尽，等待恢复）
- [x] 验证数据并保存checkpoint（脚本已创建，等待API配额恢复后运行）

## 使用内置LLM API收集Princeton数据

- [x] 修改脚本使用内置LLM API（替代Perplexity）
- [x] 运行脚本收集Princeton数据（261位教授）
- [x] 验证数据并保存checkpoint
