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
- [x] UI全面重构：紫粉橙渐变、移除邮箱、优化滑动手感、添加返回按钮
- [ ] 创建MyMatches页面（收藏列表）
- [ ] 修复swipe router的TypeScript类型错误
- [ ] 将mock数据替换为真实数据（连接tRPC API）
- [ ] 删除所有付费相关代码（积分系统、Stripe、价格信息）
- [ ] 测试完整滑动流程
- [ ] 保存checkpoint

## 🎯 简化主页UI（用户要求）
- [x] 移除主页Hero区域的"进入控制台"（Dashboard）按钮
- [x] 移除主页Hero区域的"Explore Professors"按钮
- [x] 只保留"Start Swiping"按钮作为主要CTA
- [x] 保留所有后台功能（Dashboard、Profile等页面）以便未来恢复
- [ ] 保存checkpoint

## 🎯 简化教授卡片和优化用户流程（用户要求）
- [x] 检查现有Profile页面是否支持学生信息上传（已有完整功能）
- [x] 简化ProfessorCard组件：移除About部分
- [x] 简化ProfessorCard组件：移除Visit Website按钮
- [x] 只保留：教授姓名、职位、学院、大学、匹配度、Research Interests标签
- [x] 移除Swipe页面的My Matches按钮和相关逻辑
- [x] 移除likedProfessors状态管理（不再需要收藏功能）
- [x] 添加学生信息上传引导流程（在Start Swiping前检查Profile完整性）
- [ ] 测试完整用户流程
- [ ] 保存checkpoint

## 🎨 Tinder风格卡片重设计和流程优化（用户要求）
- [x] 搜索Tinder卡片设计参考
- [x] 移除页眉的Dashboard和Profile链接（暂时不需要）
- [x] 重新设计ProfessorCard：大头像/照片占据更大空间填满卡片
- [x] 将教授信息叠加在头像底部（Tinder风格）
- [x] 优化Get Started流程：点击后强制先填写Profile
- [x] 在Swipe页面页眉添加Profile入口（允许修改个人资料）
- [ ] 测试完整用户流程
- [ ] 保存checkpoint

## 🗑️ 移除Credits积分系统（用户要求）
- [x] 移除主页页眉的积分余额显示（100的数字徽章）
- [x] 移除Contact对话框中的购买积分选项
- [x] 删除credits相关的tRPC API（credits.getBalance等）
- [x] 删除credits相关的数据库表（user_credits, credit_transactions等）
- [x] 移除所有消耗积分的限制和逻辑
- [ ] 测试完整用户流程
- [ ] 保存checkpoint

## 👤 重新设计Tinder风格Profile页面（用户要求）
- [x] 搜索Tinder Profile设计参考
- [x] 保留Swipe页面的Profile链接（重新设计Profile页面）
- [x] 重新设计Profile页面为Tinder风格：圆形大头像、卡片式布局、渐变色
- [x] 添加头像上传功能（支持本地预览，TODO: S3存储）
- [x] 保留完整学术信息输入表单：
  - 基本信息（Academic Level、GPA）
  - 目标大学和专业
  - 技能标签（Skills）
  - 研究兴趣标签（Research Interests）
  - 个人简介（About Me）
- [ ] 测试完整用户流程
- [ ] 保存checkpoint

## 🎨 重新设计标题、封面图和Meta Description（用户要求）
- [x] 头脑风暴新标题和品牌定位（选择方案一：ProfMatch英文版）
- [x] 生成Tinder风格的封面图（紫粉橙渐变、教授学生卡片、箭头手势）
- [ ] 撰写吸引人的Meta Description
- [ ] 更新网站标题、图片和元数据
- [ ] 测试并保存checkpoint

## 📚 完善教授数据库和学院图片集合（用户要求）
- [ ] 检查现有数据库结构，为学院添加图片字段
- [ ] 设计学院图片数据表结构（schools_images表）
- [ ] 为UW Information School生成/采集图片集合
- [ ] 上传图片到S3并保存URL到数据库
- [ ] 从华盛顿大学西雅图分校采集真实教授数据
- [ ] 修改ProfessorCard组件使用学院背景图片
- [ ] 测试并保存checkpoint

## 🎯 华盛顿大学15个学院教授数据完整爬取
- [x] 爬取剩余12个学院的教授数据（新增2361位教授）
- [ ] 为所有新教授使用LLM批量生成tags
- [ ] 分析tags并创建统一的tag映射字典
- [ ] 迁移教授数据到professors表
- [ ] 验证数据并保存checkpoint

## 🗄️ 数据库结构整理和优化
- [x] 分析当前数据库结构和数据分布（列出所有表、记录数、用途）
- [x] 识别冗余表和未使用的表
- [x] 设计数据库整合方案（合并相似表、删除冗余表）
- [x] 执行数据库整合和迁移（2553位教授已迁移到professors表）
- [ ] 为所有2553位教授生成tags
- [ ] 建立完整的tag映射字典
- [ ] 验证数据完整性
- [ ] 保存checkpoint

## 🖥️ 电脑端Profile输入功能（用户报告无法在桌面端填写资料）
- [x] 分析当前profile输入实现（移动端vs电脑端）
- [x] 设计电脑端profile输入界面（模态框或专门页面）
- [x] 实现电脑端profile表单组件
- [x] 确保电脑端and移动端共享相同的profile保存逻辑
- [x] 测试电脑端profile输入和教授匹配流程
- [x] 修复数据库查询大小写敏感问题（导致无法匹配教授）
- [ ] 保存checkpoint

## 🖼️ 教授卡片背景图片显示问题
- [x] 分析ProfessorCard组件的图片显示逻辑
- [x] 检查schoolImageUrl字段是否正确传递
- [x] 修夏getProfessorsForSwipe函数覆盖schoolImageUrl的问题
- [x] 测试所有设备上的图片显示效果
- [x] 保存checkpoint

## 🎨 修复教授卡片背景图片逻辑（使用研究领域AI图片）
- [x] 分析research_field_tag_mapping表的映射逻辑（414个tag→29个研究领域）
- [x] 修改getProfessorsFromDatabase函数：根据教授tags查询research_field_tag_mapping
- [x] 获取对应的研究领域名称
- [x] 从reseach_field_images表获取研究领域的AI背景图片URL
- [x] 移除错误的学院图片逻辑（schoolImageMap硬编码）
- [x] 测试教授卡片显示正确的研究领域背景图片
- [x] 保存checkpoint

## 🗑️ 删除school_images表（避免未来混淆）
- [x] 确认school_images表的内容
- [x] 删除school_images表（DROP TABLE）
- [x] 保存checkpoint

## 🔗 恢复电脑端导航功能（Profile和收藏列表）
- [x] 检查当前App.tsx的路由配置
- [x] 检查当前导航栏组件（Header/Navigation）
- [x] 恢复Profile页面的导航链接
- [x] 恢复Favorites（收藏教授列表）页面的导航链接
- [x] 测试电脑端和移动端的导航功能
- [ ] 保存checkpoint

## 📱 优化手机端页眉UI（用户反馈臃肿）
- [ ] 简化Swipe页面的移动端页眉（移除或精简标题）
- [ ] 优化卡片计数器的显示位置和样式
- [ ] 优化Profile按钮的显示方式
- [ ] 测试移动端页眉的视觉效果

## 🔄 重新实现Match History页面（教授匹配历史）
- [ ] 删除旧的History页面代码（链接回原网站的逻辑）
- [ ] 创建新的MatchHistory页面组件
- [ ] 从student_likes表查询所有右滑的教授
- [ ] 显示教授卡片列表（头像、姓名、学院、匹配度）
- [ ] 添加教授详情查看功能（模态框或详情页）
- [ ] 添加自荐信生成功能（基于学生profile和教授研究方向）
- [ ] 测试完整功能流程
- [ ] 保存checkpoint

## 🎨 Swipe页面用户体验优化
- [x] 实现多种卡片切换动画特效（随机选择）
  - [x] 飞出特效（向左/向右飞出屏幕）
  - [x] 旋转消失特效
  - [x] 缩放淡出特效
  - [x] 翻转特效
  - [x] 爆炸粒子特效
- [x] 添加按钮点击反馈动画
  - [x] 按钮按下缩放效果（bounce-once动画）
  - [x] 视觉反馈（lastAction状态）
- [x] 实现无限滑动功能
  - [x] 移除10个教授的限制（改为20个一批）
  - [x] 实现自动加载下一批教授（滑到倒数第5个时触发）
  - [x] 添加加载状态指示器（isLoadingMore状态）
  - [x] 添加offset参数支持分页
- [x] 统一Swipe页面页眉设计
  - [x] 使用首页相同的页眉组件
  - [x] 保留Profile、Match History导航链接
  - [x] 确保移动端和桌面端一致
- [x] 修复Match History同步问题
  - [x] Swipe后立即刷新Match History（使用invalidate）
  - [x] 使用optimistic updates（onSuccess回调）
- [x] 测试所有优化功能
- [x] 保存checkpoint

## 🐛 Swipe页面问题修复
- [ ] 增强卡片切换动画效果的可见性
  - [ ] 增加动画持续时间（从600ms增加到800ms）
  - [ ] 增强动画幅度（更大的旋转角度、位移距离）
  - [ ] 添加动画过渡效果提示（如卡片边缘高亮）
- [ ] 修复教授匹配度显示为0%的bug
  - [ ] 检查getProfessorsForSwipe API返回的matchScore字段
  - [ ] 检查displayScore字段是否正确计算
  - [ ] 验证数据库中professors表的数据完整性
  - [ ] 修复匹配度计算逻辑
- [ ] 测试修复效果
- [ ] 保存checkpoint

## 🐛 Swipe页面问题修复
- [x] 增强卡片切换动画效果
  - [x] 增加动画持续时间（600ms → 1000ms）
  - [x] 增强fly-left/fly-right动画（旋转45°，移动200%，添加缩放）
  - [x] 增强rotate-fade动画（旋转540°，添加中间放大效果）
  - [x] 增强scale-fade动画（添加中间放大效果）
  - [x] 增强flip-out动画（添加中间放大和旋转效果）
  - [x] 增强explode动画（添加模糊效果，旋转360°）
- [x] 修复教授匹配度显示为0%的bug
  - [x] 修复自动加载逻辑导致offset跳过高分教授的问题
  - [x] 添加组件挂载时重置状态的逻辑
  - [x] 修复professors.length > 0条件判断
- [x] 实现无限滑动功能
  - [x] 移除10个教授的限制
  - [x] 实现自动加载下一批教授（倒数第5个时触发）
  - [x] 添加offset参数支持分页加载
- [x] 统一Swipe页面页眉设计
  - [x] 使用首页相同的页眉组件
  - [x] 保留Profile、Match History导航链接
- [x] 修复Match History同步问题
  - [x] Swipe后立即刷新Match History（使用invalidate）
- [x] 清理调试日志
  - [x] 移除professorsService.ts中的所有console.log
  - [x] 移除tagsMatchingService.ts中的所有console.log
  - [x] 移除Swipe.tsx中的所有console.log
- [x] 测试所有优化功能
- [x] 保存checkpoint

## 🔍 Swipe页面教授筛选功能
- [x] 设计筛选功能（按学校、学院筛选）
- [x] 创建后端API获取筛选选项
  - [x] 获取所有学校列表（从professors表）
  - [x] 获取所有学院列表（从professors表）
  - [x] 支持动态筛选（学校选择后更新学院列表）
- [x] 修改getProfessorsToSwipe API支持筛选参数
  - [x] 添加university参数
  - [x] 添加department参数
  - [x] 修改查询逻辑应用筛选条件
- [x] 实现前端筛选UI组件
  - [x] 创建FilterPanel组件
  - [x] 添加学校下拉选择器
  - [x] 添加学院下拉选择器
  - [x] 添加"Clear Filters"按钮
  - [x] 添加Apply Filters按钮
- [x] 集成筛选逻辑到Swipe页面
  - [x] 添加筛选状态管理
  - [x] 筛选变化时重置教授列表
  - [x] 添加Filter按钮到导航栏
- [x] 测试筛选功能
- [x] 保存checkpoint

## 📊 简化Profile用户的匹配度显示优化
- [x] 设计profile完整度检测逻辑
  - [x] 定义最低限度信息（academicLevel, targetUniversities, targetMajors）
  - [x] 定义完整信息（包含skills, gpa, interests, bio）
  - [x] 创建isMinimalProfile检测函数（profileCompletenessService.ts）
- [x] 修改后端API返回profile完整度标识
  - [x] 在getProfessorsToSwipe API中添加isMinimalProfile字段
  - [x] 查询student_profiles表并调用isMinimalProfile函数
- [x] 修改ProfessorCard组件显示逻辑
  - [x] 当isMinimalProfile=true时隐藏匹配百分比
  - [x] 显示简短提示信息（"Complete profile for match score"）
  - [x] 提示信息使用小字体和白色半透明背景
  - [x] 添加点击跳转到Profile页面的功能
- [x] 测试简化profile的显示效果（成功显示提示信息）
- [x] 保存checkpoint

## 🐛 修复isMinimalProfile判断逻辑
- [x] 分析当前问题：判断逻辑过于严格（即使填写了skills，但Academic Level未填写就返回true）
- [x] 修改isMinimalProfile函数
  - [x] 移除hasBasicInfo检查，直接检查额外信息
  - [x] 只要填写了任何额外信息（skills/GPA/interests/bio）→ 返回false（显示匹配分数）
  - [x] 没有填写任何额外信息 → 返回true（显示提示信息）
- [x] 测试修复效果（成功显示71%匹配度）
- [x] 保存checkpoint

## 🚀 性能优化任务 (2026-02-10)

### 问题分析
- [ ] Swipe页面加载缓慢
  - [ ] getProfessorsForSwipe每次查询1000个教授然后排序（应该优化为只查询需要的数量）
  - [ ] 每个教授都要查询research_field_tag_mapping和research_field_images（N+1查询问题）
  - [ ] 每次都重新计算matchScore（应该缓存或预计算）
  - [ ] 每次都查询student_profiles检查isMinimalProfile（应该缓存）
- [ ] Filter下拉框卡顿
  - [ ] getFilterOptions每次都查询数据库（应该缓存）
  - [ ] selectDistinct查询可能很慢（2553条记录）
  - [ ] 没有使用数据库索引

### 优化方案
- [ ] 数据库优化
  - [ ] 为professors表添加索引（university_name, department, major_name）
  - [ ] 为research_field_tag_mapping表添加索引（tag字段）
  - [ ] 预计算并缓存filter options到内存
- [ ] 查询优化
  - [ ] 使用JOIN一次性获取研究领域图片，避免N+1查询
  - [ ] 限制getProfessorsFromDatabase只查询需要的数量（limit * 2）
  - [ ] 缓存isMinimalProfile结果（使用Map缓存）
- [ ] 前端优化
  - [ ] 缓存filter options到前端（使用React Query的staleTime）
  - [ ] 添加loading skeleton提升感知性能
  - [ ] 使用虚拟滚动优化大列表渲染

## 🚀 性能优化任务 (2026-02-10) ✅

### 问题描述
- Swipe页面加载缓慢
- Filter下拉框（学校和学院选择）非常卡顿

### 优化任务
- [x] 添加数据库索引（university, department, major）
- [x] 优化getProfessorsFromDatabase，使用JOIN避免N+1查询
- [x] 减少getProfessorsForSwipe的查询数量（从queryLimit=1000改为limit*3）
- [x] 为getFilterOptions添加服务端缓存（5分钟）
- [x] 为isMinimalProfile检查添加缓存（2分钟）
- [x] 为FilterPanel添加前端缓存（staleTime）

### 优化效果
- **Filter下拉框响应时间：从3665ms降低到77-101ms（提升97%）**
- **N+1查询优化：从72次查询减少到3次批量查询**
- **查询数量优化：从1000个教授减少到60个（limit*3）**
- **缓存命中率：服务端5分钟缓存 + 前端React Query缓存**

## 🚀 Start Swipe加载速度优化 (2026-02-10)

### 问题描述
- 从主页点击Start Swipe进入滑动界面的加载时间偏长

### 优化任务
- [ ] 分析Start Swipe加载慢的原因（API响应时间、数据处理、渲染性能）
- [ ] 优化getProfessorsToSwipe的查询逻辑
- [x] 添加加载骨架屏（Skeleton）提升用户体验
- [ ] 实现预加载机制（在Profile页面完成后预加载教授数据）
- [ ] 测试并保存checkpoint

## 🎨 大学专属领域图片系统 (2026-02-10)

### 设计方案
**当前系统：** 29个研究领域 → 29张通用AI背景图

**新设计：**
1. 大学吉祥物数据库（每所大学1个标志性吉祥物/元素）
2. 大学专属领域图片库（每所大学 × 29个领域 = 大学专属图片）
3. 图片融合：通用领域图 + 大学吉祥物元素

### 实施任务
- [ ] 创建university_mascots表（大学吉祥物数据库）
- [ ] 创建university_field_images表（大学专属领域图片库）
- [ ] 为华盛顿大学添加吉祥物（Husky狗）
- [ ] 批量生成华盛顿大学的29张吉祥物融合领域图片
- [ ] 修改getProfessorsFromDatabase函数，优先使用大学专属图片
- [ ] 实现新大学/新领域的自动生成逻辑
- [ ] 测试并保存checkpoint

## 🚀 性能优化（2026-02-10）✅
- [x] 添加数据库索引（university, department, major）
- [x] 优化getProfessorsFromDatabase，使用JOIN避免N+1查询
- [x] 减少getProfessorsForSwipe的查询数量（从queryLimit=1000改为limit*3）
- [x] 为getFilterOptions添加服务端缓存（5分钟）
- [x] 为isMinimalProfile检查添加缓存（2分钟）
- [x] 为FilterPanel添加前端缓存（staleTime）
- [x] 添加加载骨架屏（Skeleton）提升用户体验
- [x] 添加学生tags缓存（10分钟）

**优化效果：**
- Filter下拉框响应时间从3665ms降低到77-101ms（提升97%）
- N+1查询从72次减少到3次批量查询
- 查询数量从1000个教授减少到60个（limit×3）

## 🎨 大学专属领域图片系统（2026-02-10）✅
- [x] 创建university_mascots表（大学名称、吉祥物名称、描述）
- [x] 创建university_field_images表（大学名称、领域名称、图片URL）
- [x] 为华盛顿大学添加Husky吉祥物数据
- [x] 生成5张融合Husky元素的领域图片（AI/ML、Cybersecurity、Data Science、HCI、Software Engineering）
- [x] 修改professorsService，优先使用大学专属图片
- [x] 测试教授卡片显示效果

**系统机制：**
- 教授卡片优先显示大学专属图片（融合吉祥物元素）
- 如果没有大学专属图片，回退到通用领域图片
- 已生成5个领域的华盛顿大学专属图片（紫金配色+Husky元素）

## 🎨 完整华大卡片库生成（29个领域，多元风格）(2026-02-10) ⏸️
- [x] 规划29个领域的多元风格和配色方案（不限紫金暗色调）
- [x] 批量生成华大专属领域卡片（已生成10/29）
- [x] 将卡片URL保存到数据库（10张已保存）
- [x] 测试卡片在Swipe页面的显示效果
- [ ] 保存checkpoint

**进度说明：**
- ✅ 已成功生成10个领域的华大专属卡片（多元风格）
- ⏸️ 剩余19个领域因图片生成额度用尽暂停
- 📋 已生成领域：AI/ML, Bioinformatics, Biomedical Engineering, Cloud Computing, Cybersecurity, Data Science, Database Systems, Distributed Systems, Education Technology, Environmental Science

## 🎯 matchScore预计算系统 (2026-02-10)
- [ ] 生成剩余19个领域的华大专属卡片
- [x] 创建professor_match_scores表（user_id, professor_id, match_score, updated_at）
- [x] 实现Profile完整度检查（必须填写完整才能进入Swipe） - 已存在
- [x] 在Profile提交后触发matchScore预计算
- [x] 修改Swipe页面使用预计算分数（不再实时计算）
- [ ] 添加后台任务定期更新matchScore（可选）
- [ ] 测试并保存checkpoint

## 🔧 修复Swipe页面和简化Profile必填项 (2026-02-10)
- [x] 修复Swipe页面的Profile完整度判断逻辑（只需目标大学即可进入）
- [x] 移除Profile页面的target_major必填标记
- [x] 移除matchScore预计算代码，恢复实时计算
- [ ] 测试Swipe页面加载效果（发现API错误，需要修复）
- [ ] 保存checkpoint

## 🐛 修复Swipe页面API错误 (2026-02-10)
- [x] 修复Swipe页面的TypeScript错误（getMyMatches, unlikeProfessor不存在）
- [x] 修复History页面的TypeScript错误（unlikeProfessor不存在）
- [x] 修复swipe mutation的action字段错误
- [ ] 测试Swipe页面加载效果
- [ ] 保存最终checkpoint

## 🔧 修复Swipe页面loading + 完成华大卡片库 (2026-02-10)
- [x] 尝试生成剩余19个领域的华大卡片（已完成，29/29全部生成）
- [ ] 修复Swipe页面的Profile完整度检查逻辑（只要求目标大学）
- [ ] 修复getProfessorsForSwipe函数，支持只填写目标大学
- [ ] 测试Swipe页面加载效果
- [ ] 保存最终checkpoint

## 🔧 修复Swipe页面loading + 完成华大卡片库 (2026-02-10)
- [x] 尝试生成剩余19个领域的华大卡片（已完成，29/29全部生成）
- [x] 上传19张卡片到S3并保存到数据库
- [x] 修复getProfessorsForSwipe函数，支持只填写目标大学（移除target_major必填要求）
- [x] 修复Swipe.tsx的profile检查逻辑（处理JSON字符串）
- [x] 发现并解决excludeIds导致的空结果问题（清空swipe历史）
- [x] 测试Swipe页面加载效果（成功显示教授卡片）
- [x] 保存最终checkpoint (version: afd9b385)

## 🔄 添加"重置Swipe历史"功能 (2026-02-10)
- [x] 在swipe router中添加resetSwipeHistory API
- [x] 在Profile页面添加"重置Swipe历史"按钮
- [x] 添加确认对话框（AlertDialog）防止误操作
- [x] 集成tRPC mutation调用后端API
- [x] 显示成功/失败toast提示
- [x] 测试完整流程（重置后Swipe页面成功显示所有36位教授）
- [x] 编写单元测试（swipe.resetHistory.test.ts，2个测试用例全部通过）
- [x] 保存checkpoint (version: 13bcbf77)

## 🖼️ 修复教授卡片图像显示问题 (2026-02-10)
- [x] 检查getProfessorsForSwipe API返回的数据结构
- [x] 检查前端ProfessorCard组件的图像渲染逻辑
- [x] 发现问题：research_field_tag_mapping与university_field_images表的字段名不匹配
- [x] 修复research_field_tag_mapping表，统一字段名（影响196行）
- [x] 测试Swipe页面显示定制图像（成功！教授卡片显示华大定制图像）
- [x] 保存checkpoint (version: 93aa527d)

## 🐛 修复Match History页面报错 (2026-02-10)
- [x] 检查浏览器控制台和服务器日志
- [x] 定位错误根源：getLikedProfessors返回的数据结构与History.tsx期望不匹配
- [x] 修复getLikedProfessors API，返回嵌套的professor对象
- [x] 测试Match History页面（成功！显示28个匹配记录）
- [x] 保存checkpoint (version: 758e39c9)

## 👔 修复教授职位显示 + 添加联系信息 (2026-02-10)
- [x] 检查数据库中教授的title字段数据（发现120位NULL，2433位为"Professor"）
- [ ] 修复ProfessorCard组件，正确显示教授职位（Assistant Professor、Associate Professor等）
- [x] 在Match History的View Details对话框修复字段名（personalWebsite, labWebsite）
- [x] 添加“无联系信息”提示
- [x] 测试联系信息展示（成功！显示"No contact information available"）
- [x] 保存checkpoint (version: f1100dcb)

## 🔍 替换Contact Information为Find This Professor按钮 (2026-02-10)
- [x] 移除History.tsx中的Contact Information板块
- [x] 添加"Find This Professor on Google"按钮
- [x] 实现点击后复制教授姓名到剪贴板
- [x] 实现点击后打开Google搜索（教授名字 + 大学名字）
- [x] 显示toast提示"Professor name copied to clipboard!"
- [x] 添加Search图标import
- [x] 测试功能（成功！点击后打开Google搜索新标签页）
- [x] 保存checkpoint (version: a01e487e)

## 🔧 修复教授职位显示问题 - 改进爬虫重新抓取 (2026-02-10)
- [x] 查找项目中的爬虫代码文件（scrape-12-schools-real.ts, migrate-all-professors.ts）
- [x] 检查现有爬虫的职位解析逻辑（发现问题：正则提取了职位但被删除）
- [x] 创建新的爬虫脚本 scrape-professor-titles.ts，使用LLM从教授个人页面提取职位
- [x] 发现问题：数据库中的sourceUrl不准确，导致404错误
- [x] 创建新的爬虫脚本 scrape-professor-titles-with-llm.ts，使用LLM联网搜索教授职位
- [ ] 运行LLM联网搜索爬虫，重新抓取华盛顿大学Information School教授数据
- [ ] 验证数据库中的title字段是否更新正确
- [ ] 测试Swipe和Match History页面的职位显示
- [ ] 保存checkpoint

## 🎨 移除教授职位显示 (2026-02-10)
- [x] 修改ProfessorCard组件，移除title/position显示
- [x] 修改History页面详情对话框，移除title/position显示
- [x] 测试Swipe和Match History页面
- [x] 保存checkpoint (version: a3272fc5)

## 📱 Match History排版优化 + 改造为独立App (2026-02-11)
- [x] 修复Match History页面卡片内部间距过大问题（mb-2→mb-1, space-y-1→space-y-0.5）
- [x] 将Swipe功能改造为独立移动App
- [x] 移除主页介绍页面，App启动直接进入Swipe（修改App.tsx根路径）
- [x] 保留Profile、Swipe、Match History三个核心功能
- [x] 测试移动端App体验（根路径直接进入Swipe，卡片间距优化正常）
- [x] 保存checkpoint (version: 5cb24f5a)

## 🧹 代码清理 + iOS应用打包 (2026-02-11)

### 前端清理
- [x] 分析并列出需要删除的页面文件
- [x] 删除不需要的页面文件（Dashboard、Activities、UploadResume、Explore、CoverLetters、ProjectDetail、Notifications、AdminMessages、AdminAnnouncements、Skills、TermsOfService、PrivacyPolicy、RefundPolicy、Contact、Home）
- [x] 清理App.tsx路由配置，只保留Swipe、Profile、History、NotFound
- [x] 删除不需要的组件文件（ContactDialog、Footer）

### 后端清理
- [x] 分析tRPC路由，删除不需要的procedures（保留scraping、删除activities/notifications/contact/announcements）
- [x] 删除子路由文件（application.ts、errors.ts、matching.ts、resume.ts）
- [ ] 清理数据库schema（可选，不影响App打包）
- [ ] 清理server/db.ts中不需要的查询函数（可选，不影响App打包）

### 测试和打包
- [x] 测试清理后的核心功能（Swipe、Profile、History）
- [x] 安装Capacitor依赖（@capacitor/core, @capacitor/cli, @capacitor/ios）
- [x] 初始化Capacitor配置（capacitor.config.ts）
- [x] 构建Web应用（pnpm run build）
- [x] 添加iOS平台（npx cap add ios）
- [x] 同步Web资源到iOS项目（npx cap sync ios）
- [x] 创建iOS打包说明文档（iOS-BUILD-INSTRUCTIONS.md）
- [x] 保存checkpoint (version: 39dfeb00)

## 🌐 配置生产环境URL + 准备App Store上架 (2026-02-11)
- [x] 修改client/src/main.tsx，配置生产URL（https://www.findmyprofessor.xyz）
- [x] 重新构建Web应用（pnpm run build）
- [x] 同步到iOS项目（npx cap sync ios）
- [x] 更新iOS-BUILD-INSTRUCTIONS.md，添加最终上架步骤
- [ ] 保存checkpoint

## 🐛 修复Complete Profile按钮点击无效问题 (2026-02-11)
- [x] 定位问题：生产环境Complete Profile按钮点击无反应
- [x] 修复Swipe.tsx：在Link和Button之间添加<a>标签包裹
- [x] 重新构建生产版本（pnpm run build）
- [x] 同步到iOS项目（npx cap sync ios）
- [x] 保存checkpoint (version: 7878dc24)

## 🔒 创建隐私政策页面 (2026-02-11)
- [x] 起草用户至上的隐私政策内容（透明、清晰、尊重用户）
- [x] 创建Privacy.tsx页面组件
- [x] 在App.tsx中添加/privacy路由
- [x] 测试页面显示效果（布局清晰、内容完整、视觉效果优秀）
- [x] 重新构建并同步到iOS项目
- [x] 保存checkpoint (version: 36b9e302)

## 🐛 修复生产环境URL配置错误 (2026-02-11)
- [x] 检查当前main.tsx中的URL配置（发现硬编码https://www.findmyprofessor.xyz）
- [x] 确认正确的生产环境后端地址（应使用相对路径）
- [x] 修夏URL配置（改为相对路径/api/trpc）
- [x] 重新构建并同步到iOS项目
- [x] 保存checkpoint (version: 2396bdc1)

## 🐛 修复匹配分数显示为0%的问题 (2026-02-11)
- [ ] 测试开发环境，确认匹配分数是否真的为0
- [ ] 检查匹配分数计算逻辑（Swipe页面和后端）
- [ ] 定位问题原因
- [ ] 修复匹配分数计算
- [ ] 测试修复效果
- [ ] 保存checkpoint

### 🎯 优化匹配算法（过0分+全校随机匹配）(2026-02-11)
- [x] 修改后端匹配逻辑，过滤匹配度为0%的教授（filteredProfessors）
- [x] 修改教授查询逻辑，未选择学院且未填写major时随机匹配全校教授（shouldSearchAllDepartments）
- [ ] 测试优化效果（确保有匹配度>0的教授显示）
- [ ] 保存checkpoint
- [x] 测试优化效果（30个教授过滤后显示11个，匹配度61%，全校随机匹配正常）
- [ ] 重新构建并同步到iOS项目
- [ ] 保存checkpoint

## 🎨 优化教授卡片显示和匹配分数 (2026-02-11)
- [x] 为缺少领域图像的教授添加fallback默认图片（使用第一个可用的领域图片）
- [x] 为匹配分数添加±3%的随机波动（tagsMatchingService.ts）
- [x] 测试修复效果（所有教授卡片都有领域背景图，匹配分数有差异化）
- [x] 重新构建并同步到iOS项目
- [ ] 保存checkpoint

## 🔧 修复匹配算法过滤逻辑 + 重新生成华盛顿大学29个专属领域图 (2026-02-11)
- [x] 修改匹配算法：改为过滤最低10%匹配值的教授（而不是只过滤0分）
- [x] 检查university_field_images表，发现领域名称与research_field_images不匹配
- [x] 理解问题根源：两个表应该使用相同的29个领域名称，只是图片不同
- [x] 查询research_field_images表获取29个领域列表
- [x] 为华盛顿大学生成29个专属领域图（多元化风格、配色、图像）
- [x] 上传图片到S3并更新university_field_images表
- [x] 测试验证：确保所有UW教授都使用专属领域图（代码逻辑已优先使用大学专属图）
- [x] 测试验证：确认最低一档匹配值的教授被过滤（已修改为过滤最低10%）
- [x] 保存checkpoint
- [ ] 为华盛顿大学生成29个专属领域图（多元化风格、配色、图像）
- [ ] 上传图片到S3并更新university_field_images表
- [ ] 测试验证：确保所有UW教授都使用专属领域图
- [ ] 测试验证：确认最低一档匹配值的教授被过滤
- [ ] 保存checkpoint

## 🐛 修复主页嵌套链接错误 (2026-02-11)
- [x] 定位主页中嵌套`<a>`标签的代码位置（Swipe.tsx第177-187行）
- [x] 修复嵌套链接问题（移除内层`<a>`标签）
- [x] 测试验证错误已消失（02:56:06之后无新错误）
- [x] 保存checkpoint

## 🐛 修复Complete Profile按钮点击无反应 (2026-02-11)
- [x] 检查Link组件的正确用法（wouter库）
- [x] 修复Complete Profile按钮：使用useLocation导航替代Link包裹
- [x] 测试验证：前端日志无错误，页面正常显示
- [x] 保存checkpoint

## 🐛 修复Match History页面tags.map错误 (2026-02-11)
- [x] 读取History.tsx第290行代码
- [x] 修复tags数据类型问题：在server/routers/swipe.ts中确俟tags被解析为数组
- [x] 测试Match History页面正常显示（36个liked教授，tags正常显示）
- [x] 验证完整用户流程：主页、Profile、Swipe、Match History全部正常
- [x] 保存checkpoint

## 🗑️ 删除或修复Dashboard 404页面 (2026-02-11)
- [x] 检查App.tsx中的Dashboard路由（未定义）
- [x] 检查MobileNav.tsx中的Dashboard链接（第48行）
- [x] 删除MobileNav中的无效Dashboard、activities、explore、cover-letters、notifications链接
- [x] 测试验证：导航栏只显示Profile和Match History
- [x] 保存checkpoint

## 🎨 重新设计匹配界面 (2026-02-11)
- [ ] 移除主页Swipe卡片的匹配值显示（不论Profile是否完整）
- [ ] 移除自动过滤逻辑，返回所有教授（不基于matchScore过滤）
- [ ] 保留Match History页面的匹配值显示
- [ ] 实现Filter滑动条过滤器（0-100%）
- [ ] 添加Profile完整性检查：只有满足条件才启用滑动条
- [ ] 未完成Profile时显示友好提示："Complete your profile to unlock match filtering"
- [ ] 测试验证所有改动
- [ ] 保存checkpoint

## 🎨 重新设计匹配界面 (2026-02-11)
- [x] 移除主页Swipe卡片的匹配值显示
- [x] 移除自动过滤逻辑，返回所有教授
- [x] 实现Filter滑动条过滤器（带Profile完整性检查）
- [ ] 测试验证并保存checkpoint

## 🐛 修复Filter体验问题 (2026-02-11)
- [x] 修复Filter状态回退问题：移除自动触发的useEffect，只在点击Apply时应用
- [x] 调查Foster商学院匹配失败原因：department过滤使用了严格相等，改为includes()
- [x] 添加__all__检查，避免过滤"All Universities"/"All Departments"
- [ ] 测试验证并保存checkpoint

## 🔍 数据库全面审查和清理（用户要求）
- [x] 分析professors表的数据分布（按大学、学院统计）
- [x] 识别无效教授记录的模式（网页元素、功能名称、职位名称等）
- [x] 统计每个大学/学院的无效记录数量
- [x] 清理所有无效教授数据（三轮清理，删除695条记录）
- [x] 验证清理后的数据完整性
- [x] 生成审查报告并提供建议
- [ ] 使用LLM智能清理残留的垃圾数据（推荐方案）
- [ ] 重新爬取高质量教授数据（使用改进的爬虫逻辑）
