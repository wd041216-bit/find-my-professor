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

## 清空学校数据库并集成爬虫到智能匹配界面
- [x] 分析现有数据库结构（universities、projects等表）
- [x] 分析当前智能匹配界面的搜索逻辑
- [x] 清空universities表的数据
- [x] 清空projects表的数据
- [x] 清空其他学校相关数据表
- [x] 修改智能匹配界面添加"搜索项目"按钮
- [x] 实现按钮点击时触发爬虫的逻辑
- [x] 显示爬虫进度和状态
- [x] 爬虫完成后展示结果
- [x] 完整重写Explore页面集成爬虫系统

## 修复Explore页面React hooks错误
- [x] 分析React错误#321的原因（hooks调用位置错误）
- [x] 修复handleSearchProjects和handleFetchProjects中的hooks调用
- [x] 测试搜索功能确保正常工作

## 简化个人资料编辑和优化爬虫过滤
- [x] 分析当前Profile页面的字段（移除所在机构）
- [x] 修改Profile表单只保留学历层次
- [x] 更新数据库schema（不需要，字段可为空）
- [x] 分析爬虫爬取的课程问题
- [x] 优化CSS选择器过滤课程链接
- [x] 改进LLM提示词识别真正的科研项目
- [x] 测试修复后的Profile编辑功能
- [x] 爬虫过滤逻辑已优化（需要等待下次爬取验证）

## 清空缓存、禁用缓存、移除专业匹配度、添加LLM二次验证
- [x] 清空scraped_projects表的数据
- [x] 清空university_major_cache表的数据
- [x] 禁用30天缓存机制（验证期间）
- [x] 分析匹配度算法，移除专业匹配度系数
- [x] 添加LLM二次验证逻辑（爬虫完成后验证）
- [x] 测试Stanford computer science项目爬取
- [x] 验证过滤效果（爬虫成功运行，但Stanford CS网站URL不匹配）

## 移除重复UI元素、移除付费功能、实现每日积分系统
- [x] 移除Dashboard的"最近通知"框（顶部已有通知栏）
- [x] 移除底部Footer的Contact邮箱（保留Contact Us按钮）
- [x] 移除付费功能界面（Pricing/Payment相关页面）
- [x] 设计积分系统数据库schema（user_credits表）
- [ ] 实现每日100积分刷新逻辑（不累积）
- [ ] 实现积分扣除：上传简历10分、发起匹配30分、撰写文书15分
- [ ] 实现积分耗尽提示（中英文）
- [ ] 管理员不受积分限制
- [ ] 测试积分系统完整流程

## 诊断并修复网页发布失败问题
- [x] 检查最新checkpoint的发布错误日志
- [x] 分析发布失败的具体原因（schema.ts中未使用的date导入）
- [x] 修复导致发布失败的问题（移除date导入）
- [x] 验证修复（TypeScript编译通过，服务器运行正常）
- [ ] 重新创建checkpoint并测试发布

## 排查网站发布长时间不成功的问题
- [x] 检查项目中的大文件（图片、视频等）
- [x] 检查node_modules大小
- [x] 检查构建配置和依赖项
- [x] 发现问题：streamdown库包含396个KaTeX字体文件
- [x] 用react-markdown替换streamdown
- [x] 优化效果：构建产物从16MB降到1.9MB，文件数从396个降到6个

## 放宽爬虫过滤规则，避免过度筛选
- [x] 分析当前四层过滤机制的问题（过于严格）
- [x] 调整课程关键词过滤逻辑（从11个减少到6个，只保留最明显的课程标识）
- [x] 优化LLM验证提示词（更宽松的判断标准，不确定时视为研究项目）
- [x] 调整LLM二次验证的严格度（RELAXED MODE，只过滤明显的课程）
- [ ] 测试Stanford和MIT的爬取效果

## 修复英语模式和移除重复UI
- [x] 修复Explore页面英语模式的翻译（"搜索研究项目"和"搜索项目"按钮）
- [x] 移除手机端Dashboard的"Your Activities"部分（任务栏已有Activities）
- [x] 清空爬虫缓存测试优化效果

## 实现每日积分系统和购买积分功能
- [x] 分析积分消耗场景（简历解枑10分、匹配30分、文书生成15分）
- [x] 实现每日积分重置逻辑（每天自动重置为100分）
- [x] 实现积分扣除中间件（检查余额、扣除积分、记录消耗）
- [x] 实现积分耗尽提示（双语友好文案，解释LLM成本）
- [x] 更新Contact页面添加"购买积分"主题选项
- [x] 优化购买积分表单（微信/支付宝账号 + 购买数量）
- [x] 添加管理员豁免逻辑（管理员不受积分限制）
- [x] 测试积分重置、扣除、耗尽提示功能
- [x] 测试购买积分表单提交流程

## 优化匹配系统 - 建立项目知识库
- [x] 分析现有scraped_projects和university_major_cache表的使用情况
- [x] 检查爬虫服务的数据存储逻辑是否完善
- [x] 启用缓存逻辑（移除测试代码）
- [x] 实现智能匹配路由：判断用户信息丰富度
- [x] 方案A：信息丰富 → LLM直接推荐8-10个项目（从数据库）
- [x] 方案B：信息不足 → 爬虫搜索 → 存入数据库
- [x] 优化项目查询逻辑：优先使用数据库缓存
- [x] 确保所有匹配结果都保存到project_matches表
- [x] 实现缓存有效期管理（约1个月）
- [x] 测试两种匹配方案的效果
- [x] 验证tokens消耗降低效果

## 测试华盛顿大学CS爬虫效果
- [x] 运行爬虫爬取University of Washington计算机科学项目
- [x] 分析爬取结果的数据质量
- [x] 检查过滤规则是否正确（避免误判课程为研究项目）
- [x] 生成详细报告文档
- [x] 根据测试结果提出优化建议

## 实现混合URL获取方案
- [x] 扩展URL映射表到Top 50美国大学（覆盖80%用户）
- [x] 修复URL生成逻辑（正确处理"of"等介词）
- [x] 添加华盛顿大学等缺失大学的URL映射
- [x] 实现LLM URL生成服务（fallback方案）
- [x] 实现URL可访问性测试
- [x] 创建university_url_cache数据库表
- [x] 实现URL缓存逻辑（LLM生成的URL存入数据库）
- [x] 集成三层URL获取策略（映射表→LLM生成→LLM生成项目）
- [x] 测试混合方案的tokens消耗
- [x] 重新测试华盛顿大学爬虫（验证真实爬取）

## 修复和优化匹配系统
- [x] 修复页脚Contact按钮点击无反馈问题
- [x] 限制目标大学为单选（不再支持多选）
- [x] 重构匹配系统：前台LLM快速推荐8-10个项目
- [x] 实现后台异步爬虫：用户搜索时自动触发，静默爬取所有项目
- [x] 确保匹配结果按匹配度排序（从高到低）
- [x] 保存LLM推荐结果到project_matches表
- [x] 后台爬虫数据存入scraped_projects表（项目库）
- [x] 集成积分扣除：匹配前检查积分，扣陃30分
- [ ] 积分不足时显示InsufficientCreditsDialog
- [ ] 修复ProjectDetail页面使用新的matching router
- [ ] 测试完整匹配流程
- [ ] 测试双轨并行机制（前台快速响应+后台数据积累）

## 前端修复和功能增强
- [x] 修复ProjectDetail页面使用trpc.matching.getMatchHistory API
- [x] 在Dashboard顶部添加积分余额显示（剩余积分+每日重置提示）
- [x] 更新Explore页面使用trpc.matching.calculateMatches API替代scraping API
- [x] 实现积分不足提示：Explore页面捕获INSUFFICIENT_CREDITS错误显示InsufficientCreditsDialog
- [x] 启用联网LLM：在llmMatching.ts中启用LLM联网功能获取最新项目信息
- [x] 创建coverLetters表存储生成的申请文书
- [x] 实现文书生成后端API（generateCoverLetter）
- [x] 集成积分扣除（10积分）和不足检查
- [x] 在Explore页面项目卡片添加"Generate Letter"按钮
- [x] 实现文书生成对话框显示生成结果
- [x] 在Dashboard添加"Your Cover Letters"部分显示已生成文书列表
- [x] 在Dashboard添加"Match History"部分显示最近匹配记录
- [x] 添加文书生成相关的双语翻译键
- [x] 测试完整流程：匹配项目 → 生成文书 → 查看历史

## UI优化和匹配逻辑改进
- [x] 将Profile页面的保存按钮移到顶部（提升用户体验）
- [ ] 优化匹配逻辑：数据库有数据直接使用，无数据才用LLM匹配
- [ ] 确保爬虫异步后台运行，不阻塞用户查看匹配结果
- [ ] 测试完整匹配流程（数据库命中和LLM fallback两种场景）

## UI和性能优化问题修复
- [x] 修复Explore页面lab名称过长时与匹配分数重叠的布局问题
- [x] 修复匹配结果语言显示：应根据当前语言设置显示中文而非英文
- [x] 修复Profile页面手机端保存按钮位置：应在顶部而非底部
- [x] 修改积分显示逻辑：所有用户（包括管理员）都应该显示积分余额
- [x] 优化LLM调用时机：已实现数据库缓存机制，相同输入不重复LLM调用
- [x] 确保所有修复在手机端、iPad端、电脑端同步生效

## LLM调用时机优化
- [x] 移除profile保存时的normalization调用（直接保存原始输入）
- [x] 在匹配项目时添加normalization逻辑（标准化大学和专业名称）
- [x] 移除简历上传时的解析调用（只存储文件）
- [x] 在匹配项目时添加简历解析逻辑
- [x] 修改积分消耗：上传简历0积分，匹配项目40积分（从30增加）
- [x] 更新相关提示文本和翻译
- [x] 测试完整流程：保存profile → 匹配项目 → 验证normalization生效

## Bug修复
- [x] 修复文书生成API的matchId参数类型错误（expected number, received undefined）
- [x] 修复搜索结果重复叠加问题（每次搜索应该替换而非叠加）
- [x] 修复历史记录导航错误（点击历史记录应该显示详情而非跳转到匹配界面）
- [x] 测试完整流程：搜索项目 → 生成文书 → 查看历史记录

## 导航和UI优化
- [x] 检查并修复Dashboard"查看全部"按钮仍然跳转到匹配页面的问题
- [x] 在MobileNav中添加"匹配历史"入口
- [x] 创建/cover-letters页面展示所有已生成的文书
- [x] 在MobileNav中添加"申请文书"入口链接到/cover-letters
- [x] 测试手机端导航功能

## Dashboard简化
- [x] 从Dashboard页面移除"匹配历史"板块（只通过侧边栏访问）
- [x] 从Dashboard页面移除"申请文书"板块（只通过侧边栏访问）
- [x] 清空用户的匹配历史数据
- [x] 测试Dashboard简化后的显示效果

## Dashboard响应式优化
- [x] 恢复Dashboard的匹配历史和文书板块代码
- [x] 添加响应式CSS类：手机端隐藏这些板块（md:block hidden）
- [x] 测试手机端、平板端、电脑端的显示效果

## 管理员积分豁免
- [x] 修改匹配功能：管理员执行匹配时不扣除积分
- [x] 修改文书生成功能：管理员生成文书时不扣除积分（已实现）
- [x] 测试管理员和普通用户的积分扣除行为

## 上传简历页面中英文支持
- [x] 修复上传简历页面的硬编码英文文本
- [x] 添加翻译键到translations文件
- [x] 测试中英文切换功能
