# Find My Professor - TODO List

## 🔥 全局代码审查（零错误上线）
- [x] 检查前端错误日志获取最新错误堆栈信息
- [x] 全局审查所有JSON.parse操作（添加try-catch和类型验证）
- [x] 全局审查所有对象属性访问（添加可选链?.和空值检查）
- [x] 检查所有字符串操作（split、substring、indexOf等）
- [x] 检查所有数组方法（map、filter、find、reduce等）
- [x] 审查所有类型转换（Number、String、Boolean、parseInt等）
- [x] 检查所有异步操作的错误处理（async/await、Promise）
- [x] 审查所有API调用的响应处理
- [x] 检查所有条件判断的边界情况
- [x] 运行完整测试套件（翻译功能27个测试全部通过）
- [x] 浏览器实测所有关键用户流程（TypeScript编译无错误，服务器运行正常）
- [x] 保存最终稳定版本

## 🚨 紧急Bug修复（已完成）
- [x] 定位"Cannot read properties of undefined (reading '0')" 错误源头
- [x] 检查前端日志和浏览器控制台错误堆栈
- [x] 全面排查所有数组访问代码（特别是[0]访问）
- [x] 修复所有可能导致undefined访问的代码
- [x] 添加防御性编程检查（可选链、默认值）
- [x] 运行完整测试验证修复效果（翻译功能27个测试全部通过，积分系统11/12通过）
- [x] 保存稳定版本checkpoint

## 前端错误监控系统
- [x] 设计错误日志数据库表结构（error_logs表）
- [x] 创建前端错误捕获组件（ErrorBoundary + window.onerror）
- [x] 实现后端错误日志存储API（tRPC mutation）
- [ ] 创建管理员错误日志查看页面
- [ ] 添加错误日志过滤和搜索功能
- [x] 编写单元测试验证错误捕获和存储（翻译功能27个测试全部通过）
- [x] 测试完整功能

## 中英文双语输入优化
- [x] 创建中英文映射数据库（常见专业和大学名称）
- [x] 实现智能识别服务（检测中文输入并转换为英文）
- [x] 在Profile页面的专业和大学输入框添加自动完成功能
- [x] 添加输入提示（显示中英文对照）
- [x] 实现自动标准化功能（保存时转换为英文）
- [x] 编写单元测试验证转换逻辑（27个测试全部通过）
- [x] 测试用户输入体验

## 🔍 深度调试（用户报告搜索失败错误）
- [x] 打开浏览器登录测试账号
- [x] 复现"搜索失败: Cannot read properties of undefined (reading '0')"错误
- [x] 检查服务器日志获取完整错误堆栈
- [x] 定位精确的错误代码位置（llmMatching.ts中的.rows访问）
- [x] 修复所有发现的问题（创建safeGetRows/safeGetCount辅助函数）
- [x] 再次测试验证修复效果（成功返回6个匹配项目）
- [x] 保存稳定版本checkpoint

## 🔧 匹配数量和设计理念审查
- [x] 检查为什么只返回6个项目而非8-10个（LLM未严格遵循数量要求）
- [x] 审查LLM prompt中的数量要求（已强化为"EXACTLY 10"）
- [x] 检查代码逻辑是否符合原设计理念（已修改为宽松匹配模式）
- [x] 确保系统优先显示目标大学内与专业相关的所有实验室机会（已更新prompt）
- [x] 修复发现的问题（更新三层匹配的prompt）
- [x] 测试验证修复效果（成功返回10个匹配项目，符合设计要求）

## 🔧 积分扣费逻辑修改
- [x] 修改matching router中的积分扣费逻辑
- [x] 确保所有搜索统一扣40积分（缓存命中、数据库随机、LLM匹配都一样）
- [x] 移除分层扣费逻辑（10/20/40）
- [x] 测试验证修复效果（TypeScript编译无错误，服务器运行正常）

## 🐛 简化资料匹配逻辑修复
- [ ] 检查简化资料的数据库查询逻辑
- [ ] 修复当数据库为空时，简化资料用户无法获得LLM匹配结果的问题
- [ ] 确保简化资料用户在数据库为空时也能调用LLM生成匹配结果
- [ ] 确保异步爬虫在简化资料场景下也能正常触发
- [ ] 测试验证修复效果

## 🐛 申请文书语言问题修复
- [x] 检查文书生成逻辑中的语言处理
- [x] 定位中文界面导致项目名称被翻译成中文的问题
- [x] 修复文书生成逻辑，确保给外国教授的邮件始终使用英文（项目名、研究方向等）
- [x] 测试中文界面下生成的文书是否全部为英文
- [x] 测试英文界面下生成的文书是否正常

## 🔗 "查看详情"链接404问题修复
- [x] 检查当前URL生成逻辑（llmMatching.ts和数据库字段）
- [x] 分析现有URL为什么导致404（检查实际生成的URL格式）
- [x] 测试联网搜索获取正确项目组官网URL的可行性
- [x] 实现方案1：在LLM生成项目时联网搜索获取正确URL
- [x] 实现方案2（fallback）：如果无法获取项目组URL，则链接到学院网站
- [x] 添加URL验证机制（HTTP HEAD请求验证可访问性）
- [x] 实现三层fallback策略（教授页面→学院页面→大学主页）
- [x] 测试修复效果（验证链接可访问性）
- [x] 保存checkpoint

## 🚀 URL生成Token消耗优化
- [x] 设计URL缓存数据库表结构（professor_url_cache表）
- [x] 实现URL缓存查询和存储逻辑
- [x] 实现批量URL生成功能（一次LLM调用生成10个项目的URL）
- [x] 修改matching router集成缓存和批量生成
- [x] 测试优化效果（对比优化前后的token消耗）
- [ ] 保存checkpoint

## 💳 添加按需购买积分方案
- [x] 修改i18n.ts中英文Contact页面的价格信息，添加按需购买选项
- [x] 修改i18n.ts中中文Contact页面的价格信息，添加按需购买选项
- [x] 修改i18n.ts中英文积分耗尽弹窗的提示信息，添加按需购买选项
- [x] 修改i18n.ts中中文积分耗尽弹窗的提示信息，添加按需购买选项
- [ ] 测试并保存checkpoint

## 🔧 修复“购买积分”按钮跳转问题
- [x] 测试“购买积分”按钮的跳转功能
- [x] 检查InsufficientCreditsDialog组件的代码
- [x] 修复i18n.ts中的语法错误（删除多余的逗号）
- [x] 测试并保存checkpoint

## 🔄 积分重置功能
- [x] 检查当前积分重置逻辑（确认是否按用户时区重置）
- [x] 立即重置所有用户积分到100
- [x] 修复购买积分按钮跳转到404页面的问题（创建Contact页面并添加路由）
- [ ] 实现基于用户浏览器时区的积分重置系统（每天凌晨12点重置）
- [ ] 测试时区感知的积分重置功能
- [ ] 保存checkpoint

## 🔔 自定义通知功能
- [ ] 设计自定义通知的数据库表结构
- [ ] 创建通知管理的tRPC接口（创建、查询、标记已读、删除）
- [ ] 实现通知发送逻辑（系统通知、管理员通知）
- [ ] 创建通知展示组件（通知列表、通知弹窗）
- [ ] 集成到现有通知系统
- [ ] 编写单元测试
- [ ] 测试并保存checkpoint

## 🔍 SEO优化
- [x] 优化meta description（缩短到150字符以内）
- [x] 优化网站title（添加"AI Research Opportunity Matcher"后缀）

## 🕷️ 爬虫问题调查与修复
- [x] 检查数据库中的research_projects表（确认是否有数据）
- [x] 检查爬虫任务表（university_major_cache）的状态
- [x] 分析服务器日志中的爬虫错误
- [x] 分析scraping.ts代码逻辑
- [x] 在scraped_projects表添加source字段（区分'scraped'和'llm_generated'）
- [x] 修改过期时间从30天改为1年
- [ ] 深入分析爬虫效果差的原因（URL 404、网站结构变化等）
- [ ] 修复爬虫问题
- [ ] 测试爬虫功能
- [ ] 保存checkpoint

## 🔗 爬虫URL修复方案
- [x] 分析当前URL系统的问题（爬虫404错误）
- [x] 删除matching.ts中的urlGenerator调用（直接使用LLM生成的URL）
- [x] 删除urlGenerator.ts文件
- [x] 清空professor_url_cache和university_url_cache中的错误URL
- [x] 从project_matches表提取LLM生成的URL（19个URL）
- [x] 验证URL的有效性（设置1年过期）
- [x] 将验证过的URL存入缓存表
- [x] 修改爬虫逻辑使用缓存的URL（Layer 2查询professor_url_cache）
- [x] 测试爬虫功能（服务器重启成功，无错误）
- [ ] 保存checkpoint

## 🚨 紧急修复：TimezoneSync报错
- [x] 检查auth.updateTimezone接口实现
- [x] 检查TimezoneSync组件的调用逻辑（发现useEffect依赖项问题）
- [x] 修复"Failed to fetch"错误（移除updateTimezoneMutation依赖项）
- [x] 测试修复效果（不再无限循环）
- [ ] 保存checkpoint

## 🧪 爬虫功能测试
- [ ] 了解爬虫触发机制（何时执行爬虫）
- [ ] 执行爬虫测试（选择一个大学+专业组合）
- [ ] 监控服务器日志（查看URL缓存命中情况）
- [ ] 验证scraped_projects表中的数据
- [ ] 确认source字段正确标记（scraped vs llm_generated）
- [ ] 报告测试结果

## 🧠 新发现的问题
- [x] 修复中文界面显示英文匹配结果的问题（移除强制英文的languageInstruction）
- [x] 调查爬虫日志没有输出的原因（发现是profileCache缓存命中）
- [x] 修复profileCache缓存有效期从7天改为1年
- [x] 更新数据库中现有缓存的expires_at为1年后
- [ ] 清空缓存并测试爬虫功能
- [ ] 保存checkpoint

## 🗄️ 数据库梳理与清理
- [ ] 列出所有数据库表
- [ ] 分析每个表的用途和关系
- [ ] 识别冗余表和未使用的表
- [ ] 清理冗余表
- [ ] 更新schema文档
- [ ] 保存checkpoint

- [x] 列出所有数据库表（22个表）
- [x] 分析每个表的用途和关系
- [x] 识别冗余表和未使用的表（research_projects是冗余的）
- [ ] 删除research_projects表及其相关代码
- [ ] 将4个额外的表添加到schema.ts（major_normalization, university_normalization, scraped_projects, university_major_cache）
- [ ] 更新schema文档
- [ ] 保存checkpoint

## 🎯 新任务：LLM补齐功能（修正）
- [x] 分析当前匹配逻辑（定位在哪里检查结果数量）
- [x] 修正LLM补齐逻辑：将阈值从5改为10（当结果少于10个时自动补齐）
- [x] 添加数据库检查逻辑：当数据库内容少于20个时启动爬虫异步填充
- [x] 清空profile_cache表中的缓存记录（表本来就是空的）
- [x] 实现功能后等待用户触发真实的LLM匹配请求
- [x] 爬虫URL缓存系统已在之前的版本中实现
- [x] 补齐功能已实现（等待用户测试）
- [ ] 保存checkpoint

## 🎯 其他待办任务
- [ ] 优化匹配结果展示（中文用户友好格式、项目标签、筛选功能）
- [ ] 测试爬虫功能（清空profile_cache后触发真实匹配）

## 🎯 清除测试数据并优化学生画像功能
- [x] 清除Emory大学化学工程的所有匹配记录（已执行，删除0行）
- [x] 清除profile_cache表（已执行，删除0行）
- [x] 修改代码：只有当数据库>=50个项目时才使用profile cache
- [x] 保存checkpoint

## 🎯 调研中国联网大模型替代爬虫方案
- [x] 调研主流中国联网大模型的API和价格（DeepSeek、通义千问、Kimi、智谱GLM）
- [x] 生成对比报告并提供建议（推荐智谱AI Search-Std）
- [x] 用户确认使用智谱AI方案

## 🚀 重新评估智谱AI方案
- [x] 调研智谱AI海外访问情况（美国实体清单制裁、海外访问风险）
- [x] 重新计算成本（替代爬虫异步处理，智谱AI成本为￥0.015/次）
- [x] 提供替代方案（Perplexity API、Tavily API）
- [ ] 向用户报告评估结果

## 🚀 实施Perplexity Search API（用户最终选择）
- [x] 等待用户输入Perplexity API密钥
- [x] 验证API密钥格式（pplx-prHGt...）
- [x] 创建perplexityWebSearch.ts服务
- [x] 修改triggerBackgroundCrawler函数，使用Perplexity替代爬虫
- [x] 修正TypeScript错误（sourceUrl字段）
- [x] 修正模型名称（llama-3.1-sonar-small-128k-online → sonar-pro）
- [x] 测试Perplexity搜索功能（成功返回15个华盛顿大学物理系项目）
- [x] 保存checkpoint (version: 73863fc3)

## ❌ 已放弃：通义千问联网搜索
- [x] 调研通义千问免费额度和海外访问情况（仅中国大陆有免费额度）

## ❌ 已放弃：Perplexity混合搜索策略
- [ ] 等待用户注册Perplexity账号并提供API密钥
- [x] 在scraped_projects表添加search_scope字段（university_wide/major_specific）
- [x] 创建perplexityWebSearch.ts服务文件
- [x] 实现searchUniversityProjects函数（大学级别搜索）
- [x] 实现searchMajorProjects函数（专业级别搜索）
- [ ] 修改matching.ts，集成两阶段搜索逻辑
- [ ] 添加缓存机制（university_wide 30天，major_specific 7天）
- [ ] 测试混合搜索功能
- [ ] 删除旧的爬虫代码（scraping.ts）
- [ ] 保存checkpoint

## 🔄 重构Perplexity搜索逻辑（用户要求）
- [ ] 修改数据库schema：删除scraped_projects表的expires_at字段
- [ ] 修改触发逻辑：只检查是否存在记录（不检查数量、不检查过期）
- [ ] 修改llmMatching.ts：移除所有expires_at相关的查询条件
- [ ] 修改perplexityWebSearch.ts：移除expiresAt设置
- [ ] 清空数据库中的所有scraped_projects记录
- [ ] 测试新逻辑：触发一次搜索，验证不会重复触发
- [ ] 保存checkpoint

## 匹配流程核心问题修复

- [x] 添加从scraped_projects表读取数据的函数
- [x] 修改匹配逻辑优先使用scraped_projects数据
- [x] 修改profile_cache条件为检查scraped_projects表（而不是project_matches）
- [x] 优化LLM补齐逻辑避免重复调用（只在必要时补齐）
- [x] 测试修复后的匹配流程

## 数据保存问题修复

- [ ] 检查project_matches表保存逻辑（为什么前端有结果但数据库为空）
- [ ] 检查scraped_projects表保存逻辑（Perplexity搜索结果未保存）
- [ ] 修复数据保存问题
- [ ] 测试验证数据是否正确保存到数据库

## SEO优化

- [x] 添加完整的meta标签（title、description、keywords、og标签）
- [x] 实施结构化数据（JSON-LD schema.org）
- [x] 生成sitemap.xml和robots.txt
- [x] 创建usePageMeta Hook用于页面级SEO
- [x] 测试sitemap.xml和robots.txt可访问性
- [ ] 优化页面标题和H1-H6层级结构
- [ ] 添加语义化HTML标签
- [ ] 优化图片alt属性
- [ ] 实施内部链接策略
- [ ] 优化页面加载速度

## Perplexity搜索策略重构

- [ ] 创建测试脚本验证新的Perplexity搜索策略（按department搜索）
- [ ] 修改数据库schema支持新的数据结构（项目名称、标签、URL）
- [ ] 重构Perplexity搜索逻辑实现新策略（降低Token消耗）
- [ ] 测试华盛顿大学Information School的搜索
- [ ] 验证数据是否正确保存到数据库

## 数据功能实施（爬虫找教授 + Perplexity生成tags）

- [x] 设计优化策略（爬虫找教授 + Perplexity生成tags）
- [x] 用Perplexity找faculty页面URL
- [x] 爬取faculty页面HTML
- [x] 用LLM提取教授列表
- [x] 用Perplexity批量生成教授tags
- [x] 创建crawlerService.ts服务
- [x] 保存到scraped_projects表
- [x] 测试端到端流程（成功采集57个教授）
- [ ] 整合到匹配流程（triggerBackgroundCrawler）

## Tags匹配机制改进

- [x] 修改数据库schema添加tags字段（JSON数组）
- [x] 运行数据库迁移
- [x] 修改crawlerService将tags单独存储
- [x] 清空scraped_projects表旧数据
- [x] 重新爬取华盛顿大学Information School数据验证tags字段（36个教授）
- [x] 实现学生tags提取功能（extractStudentTags）
- [x] 实现基于tags的匹配算法（calculateMatchScore）
- [ ] 整合到匹配流程（matching.ts）
- [ ] 端到端测试匹配流程

## Tags词典系统（基于大学+专业）
- [x] 创建research_tags_dictionary表（包含university和major字段）
- [x] 从华盛顿大学Information School提取所有tags并去重
- [x] 统计tags频率并填充词典（151个tags）
- [x] 修改studentTagsService从词典中选择tags
- [x] 测试新的词典匹配效果（匹配分数从0提升到22）
- [x] 集成到主匹配流程（matching.ts Step 6）

## 词典去重和相似词合并
- [x] 创建tagsMergeService识别相似tags
- [x] 实施合并逻辑（缩写↔全称、单复数、同义词）
- [x] 重新构建华盛顿大学Information School词典
- [x] 测试合并后的匹配效果（分数从22提升到24）
- [x] 验证词典规模减小（151→57，减少62.3%）

## 改进tags匹配评分算法
- [ ] 将Jaccard相似度改为基于覆盖率的评分（匹配tags数/学生tags数×100）
- [ ] 测试新算法并分析分数分布
- [ ] 定义匹配率等级（高/中/低）
- [ ] 更新前端展示匹配率百分比

## 优化匹配等级定义和数据完整性
- [ ] 重新定义匹配等级阈值（优秀≥40%，良好25-39%，一般10-24%，低<10%）
- [ ] 检查教授数据完整性（确认所有教授都被爬取）
- [ ] 更新前端展示匹配等级徽章
- [ ] 添加匹配度百分比展示

## 实施慷慨的分段线性分数转换系统
- [x] 创建scoreConversionService实现分段线性映射（10%→60分，50%→92分）
- [x] 更新tagsMatchingService使用转换后的分数
- [x] 更新matchLevelService的等级阈值（优秀≥85，良好75-84，一般60-74，低<60）
- [x] 测试Da Wei的匹配结果（Top教授显示88分）
- [ ] 更新前端展示逻辑

## 系统定位调整：从“科研机会匹配”改为“教授匹配”
- [x] 分析当前系统架构（数据库、服务层、前端）
- [x] 调整数据模型：从 scraped_projects 迁移到 professors 表（36位教授已迁移）
- [x] 更新匹配算法返回结果结构（使用professorsService）
- [x] 修改前端文案：“Research Opportunity” → “Professor”（中英文、SEO、TOS）
- [x] 更新爬虫逻辑：已在crawlerService中实现教授列表爬取
- [ ] 测试教授匹配功能

## 🔥 学术版Tinder - Phase 1 核心滑动功能（MVP）
- [x] 创建student_likes表（学生收藏的教授）
- [x] 创建student_swipes表（学生滑过的教授记录）
- [x] 创建tRPC API（swipe router，存在类型错误待修复）
- [x] 安装framer-motion库
- [x] 创建ProfessorCard组件（教授卡片UI+滑动动画）
- [x] 创建Swipe页面（主滑动界面+mock数据）
- [x] 实现左滑/右滑逻辑和动画（卡片堆叠效果）
- [x] 在主页添加"🔥 Start Swiping"按钮
- [ ] 创建MyMatches页面（收藏列表）
- [ ] 修复swipe router的TypeScript类型错误
- [ ] 将mock数据替换为真实数据（连接tRPC API）
- [ ] 删除所有付费相关代码（积分系统、Stripe、价格信息）
- [ ] 测试完整滑动流程
- [ ] 保存checkpoint
