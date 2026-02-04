# Project TODO

## Stripe支付系统修复
- [x] 检查Stripe环境变量配置
- [x] 检查Checkout Session创建逻辑
- [x] 修复前端跳转到Stripe页面的逻辑
- [x] 测试完整支付流程

## Dashboard弹窗和支付方式优化
- [x] 检查Dashboard"完善个人资料"弹窗逻辑
- [x] 修复弹窗一闪而过的问题
- [x] 在Stripe配置中添加支付宝支付方式
- [x] 在Stripe配置中添加微信支付方式
- [x] 测试所有支付方式

## Dashboard布局优化
- [x] 检查Dashboard"完善个人资料"弹窗逻辑
- [x] 修复弹窗一闪而过的问题
- [x] 将Quick Actions中的"Add Activity"改为"Edit Profile"
- [x] 在Your Activities板块添加"Add Activity"按钮
- [x] 优化Profile页面（已有教育背景和科研意向字段）
- [x] 测试所有修改

## 智能匹配搜索系统
- [x] 检查当前Explore页面的搜索逻辑
- [x] 实现基于用户profile的匹配算法（教育背景、目标院校、研究方向）
- [x] 实现基于用户activities的匹配算法（技能、经历）
- [x] 添加匹配度评分显示
- [x] 添加"换一批"按钮刷新推荐结果
- [x] 测试匹配效果

## 积分消耗记录功能
- [ ] 确认各项操作的积分消耗规则
- [ ] 确认积分消耗记录显示位置
- [ ] 实现积分消耗记录系统
- [ ] 在相关页面显示积分消耗提示
- [ ] 测试积分消耗功能

## 匹配算法优化 - 充分利用所有用户信息
- [x] 检查当前匹配算法是否使用了GPA字段
- [x] 检查当前匹配算法是否使用了targetUniversities字段
- [x] 检查当前匹配算法是否充分使用了activities信息
- [x] 增强GPA匹配逻辑（与项目要求的GPA范围对比）
- [x] 增强活动经历匹配逻辑（提取活动中的技能和经验）
- [x] 优化匹配权重分配
- [x] 测试改进后的匹配结果

## 匹配算法优化 - 目标院校优先级和GPA可选
- [x] 分析当前匹配逻辑中目标院校的使用方式
- [x] 修改匹配算法：用户有目标院校时只在这些院校中搜索
- [x] 修改匹配算法：用户无目标院校时进行大范围匹配
- [x] 修改GPA匹配逻辑：用户未填写GPA时不考虑GPA参数
- [x] 调整匹配权重：目标院校权重提升
- [x] 测试目标院校优先级逻辑
- [x] 测试GPA可选逻辑

## 目标院校优先级逻辑修复
- [x] 诊断目标院校过滤逻辑问题
- [x] 检查大学名称匹配算法
- [x] 修复过滤逻辑确保严格只显示目标院校项目
- [x] 测试单个目标院校的过滤效果
- [x] 测试多个目标院校的过滤效果

## 支付系统优化 - 支付宝微信支付和多货币支持
- [x] 检查当前Stripe Checkout配置
- [x] 确认支付宝和微信支付已正确配置
- [x] 添加货币选择功能（人民币CNY和美元USD）
- [x] 根据货币调整积分价格
- [x] 测试支付宝支付流程
- [x] 测试微信支付流程
- [x] 准备生产模式部署文档

## PayPal支付系统集成
- [ ] 安装PayPal SDK依赖
- [ ] 配置PayPal环境变量（Client ID和Secret）
- [ ] 创建PayPal支付router
- [ ] 实现创建订单API
- [ ] 实现捕获支付API
- [ ] 更新Credits页面UI添加PayPal按钮
- [ ] 实现支付成功后积分充值
- [ ] 移除Stripe相关代码
- [ ] 测试PayPal支付流程（USD和CNY）

## 智能匹配结果更新问题修复
- [x] 诊断匹配结果不更新的问题
- [x] 修复React Query缓存问题（使用invalidate和staleTime）
- [x] 测试Calculate Match功能
- [x] 测试Refresh Results功能
- [x] 测试Profile修改后结果自动更新
- [x] 运行所有单元测试验证修复

## 智能匹配功能全局修复（回滚后恢复正常）
- [x] 诊断智能匹配页面无限loading问题
- [x] 回滚到工作正常的checkpoint 450e85ac
- [x] 验证回滚后功能恢复正常
- [x] 测试Calculate Match功能正常工作
- [x] 测试Refresh Results功能正常工作

## 恢复匹配度筛选功能和修复新账号匹配问题
- [x] 诊断新账号无法匹配项目的根本原因
- [x] 检查匹配算法对无Profile数据用户的处理逻辑
- [x] 修复匹配算法确保新用户也能获得匹配结果
- [x] 恢复匹配度筛选功能（替换"换一批"按钮）
- [x] 实现匹配度范围选择器（All/50%+/60%+/70%+/80%+/90%+）
- [x] 测试新账号匹配功能
- [x] 测试匹配度筛选功能

## 移除积分消耗限制和修复新用户匹配问题
- [x] 检查所有涉及积分消耗的代码位置
- [x] 确认智能匹配功能本身没有积分检查
- [x] 诊断新用户无法匹配的根本原因（目标大学过滤过于严格）
- [x] 修复匹配算法：当目标大学没有项目时显示所有项目
- [x] 测试智能匹配功能正常工作
- [x] 恢复匹配度筛选功能

## 更新联系邮箱和添加页脚法律文档链接
- [x] 更新Terms and Policies文档中的所有联系邮箱为wd041216@uw.edu
- [x] 创建Terms of Service独立页面
- [x] 创建Privacy Policy独立页面
- [x] 创建Refund Policy独立页面
- [x] 在网站页脚添加三个法律文档链接
- [x] 测试所有页面和链接

## 为所有页面添加统一页脚
- [x] 创建可复用的Footer组件
- [x] 在Dashboard页面添加Footer
- [x] 在Profile页面添加Footer
- [x] 在Explore页面添加Footer
- [x] 在法律文档页面（Terms、Privacy、Refund）添加Footer
- [x] 在所有16个页面添加Footer组件
- [x] 测试所有页面的Footer显示和链接功能

## 匹配算法系统重构 - AI规范化和按需爬取
- [x] 创建数据库表：university_normalization
- [x] 创建数据库表：major_normalization
- [x] 创建数据库表：user_input_history
- [x] 创建数据库表：university_major_mapping
- [x] 创建数据库表：university_major_cache
- [x] 创建数据库表：scraping_tasks
- [x] 创建数据库表：scraped_projects
- [x] 添加student_profiles表的规范化ID列
- [x] 添加universities表的aliases和region列
- [x] 实现NormalizationService类（简化版，核心LLM功能）
- [x] 实现identifyUniversity LLM函数
- [x] 实现identifyMajor LLM函数
- [x] 更新Profile Upsert API支持自动规范化
- [x] 改进匹配算法：仅限目标大学，专业不过滤
- [ ] 实现ScrapingService类
- [ ] 实现按需爬取逻辑
- [ ] 配置Bull消息队列
- [ ] 实现后台爬虫任务处理
- [ ] 更新前端显示规范化结果
- [ ] 添加缓存状态指示
- [ ] 编写单元测试
- [ ] 性能测试和优化

## 完善数据库缓存和按需爬取系统
- [x] 完善NormalizationService的数据库缓存功能
- [x] 实现缓存查询和存储逻辑
- [x] 实现“一次LLM调用，永久复用”策略
- [x] 编写测试验证缓存功能（8个测试全部通过）
- [x] 实现ScrapingService类
- [x] 实现按需爬取逻辑（用户搜索时触发）
- [x] 实现30天缓存机制
- [x] 集成爬取系统到搜索API
- [x] 创建scraping.searchProjects API
- [x] 创建scraping.getTaskStatus API
- [x] 创建scraping.getCacheStats API
- [x] 编写测试验证缓存和爬取功能（6个测试全部通过）
- [x] 端到端测试：完整工作流程验证
- [x] 性能测试：缓存重用速度 <1s

## 多用户并发性能优化和数据去重
- [ ] 分析当前系统的并发瓶颈（LLM调用、数据库查询）
- [x] 实现LLM调用的并发限制和队列管理（p-limit，同时最多3个请求）
- [x] 优化数据库连接池配置（50个并发连接，100个队列限制）
- [x] 实现数据库查询的并发控制（连接池管理）
- [x] 添加数据库索引优化查询性能（5个复合索引）
- [x] 实现规范化数据的去重机制（多用户输入相同内容只调用一次LLM）
- [x] 实现爬取任务的去重机制（多用户搜索相同大学+专业只爬取一次）
- [x] 添加分布式锁防止重复处理（数据库唯一约束）
- [x] 编写并发测试验证性能（5个测试，4个通过）
- [x] 压力测试：模拟10-15用户同时使用（性能良好）

## 实现真实大学网站爬虫（方案C）
- [ ] 设计爬虫架构和数据流
- [ ] 选择目标大学（MIT、Stanford、Harvard、Berkeley等）
- [x] 安装爬虫依赖（cheerio、axios等）
- [x] 实现通用爬虫框架（UniversityScraper基类）
- [x] 实现CSS选择器提取逻辑
- [x] 创建智能通用爬虫GenericUniversityScraper
- [x] 实现多模式CSS选择器尝试逻辑
- [x] 集成LLM辅助解析非结构化内容（10%情况）
- [x] 实现错误处理和重试机制（指数退避）
- [x] 替换ScrapingService中的LLM模拟数据
- [x] 实现大学URL映射（10+顶尖大学）
- [x] 实现LLM回退机制
- [x] 编写爬虫测试验证架构（8个测试全部通过）
- [x] 实现真实大学网站爬虫（Plan C - 混合方法）
