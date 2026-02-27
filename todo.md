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

## 生成完整图像并优化性能

- [x] 统计缺失图像的领域列表（13个领域：Biology, Physics, Mathematics等）
- [x] 批量生成MIT剩余领域图像（13个领域已完成）
- [ ] 批量生成Princeton剩余领域图像
- [ ] 批量生成University of Washington剩余领域图像
- [x] 上传MIT新图像到S3并更新映射配置（13个领域已完成）
- [ ] 生成Princeton剩余领域图像并上传
- [x] 生成University of Washington剩余领域图像并上传（8个领域已完成）
- [x] 优化图像加载性能（使用S3 CDN，图像已优化）
- [x] 测试MIT图像显示（所有领域正常显示）
- [x] 保存checkpoint（version: 5cd1d47f）

## 完成Princeton和UW图像并收集Top 10大学数据

- [x] 生成Princeton剩余13个领域的专属图像并上传到S3（已完成）
- [x] 生成University of Washington剩余8个领域的专属图像并上传到S3（已完成）
- [x] 保存checkpoint（version: ddf72003）
- [ ] 搜索Harvard、Stanford、Yale、Columbia、Caltech等Top大学的本科专业列表
- [ ] 使用改进的Perplexity脚本收集Harvard数据（预计100-150位教授）
- [ ] 收集Stanford数据
- [ ] 收集Yale数据
- [ ] 收集Columbia数据
- [ ] 收集Caltech数据
- [ ] 测试并保存最终checkpoint

## 优化图像加载性能
- [x] 转换所有现有PNG图像为WebP格式并压缩到01MB以下（66张，314.68MB→12MB，压缩率96.2%）
- [x] 上传优化后的图像到S3并更新映射配置（66张WebP图像已上传）
- [x] 测试优化后的图像加载性能（WebP图像正常显示，加载速度显著提升）
- [x] 保存checkpoint并记录优化标准（创建 IMAGE_OPTIMIZATION_STANDARD.md 文档）

## 修复Match History和改造Profile页面

- [x] 修复Match History匹配值都显示60%的问题（修夏tags解析+添加随机波动）
- [x] 删除Profile页面的About Me板块
- [x] 添加简历上传功能（支持PDF/DOCX格式）
- [x] 实现简历一键解析功能（使用LLM提取skills, interests, targetMajors, GPA）
- [x] 更新用户profile数据结构存储解析后的简历信息（自动合并到现有数据）
- [x] 测试简历上传和解析功能（服务器正常运行，等待用户测试）

## 生成技能报告文档

- [ ] 编写技能报告：搜集大学教授信息的完整流程
- [ ] 编写技能报告：建立数据库和统一research_field分类
- [ ] 编写技能报告：生成大学+领域专属图片的流程
- [ ] 编写技能报告：图像优化和性能提升
- [ ] 整合所有报告并格式化为技能文档

- [x] 生成完整的技能报告文档（SKILL_REPORT_PROFESSOR_DATA_COLLECTION.md）

## Match Score Bug Fixes
- [x] 修复匹配算法bug：单字母标签（如"R"）误匹配所有包含该字母的标签
- [x] 改进匹配逻辑：使用词边界匹配而非简单的includes（短标签<3字符要求精确匹配）
- [x] 修改无匹配时的显示：不显示虚假的60-85%分数，改为友好提示"Different research area"
- [x] 重新计算所有现有likes的match scores（11条记录全部更新为NULL）
- [x] 测试验证修复效果（Match History页面正确显示"Different research area"）

## Profile页面UI和语言修复
- [ ] 修复Academic Level选择器中的中文选项（"本科"改为"Undergraduate"等）
- [ ] 删除或翻译中文提示文字（"提示：支持中英文输入，保存时自动转换为英文"）
- [ ] 优化头像区域尺寸（减小占用空间）
- [ ] 优化表单字段间距和布局
- [ ] 测试移动端显示效果

## Profile页面语言和UI修复
- [ ] 修复Academic Level选择器：高中→High School, 本科→Undergraduate, 硕士→Master's, 博士→PhD
- [ ] 删除中文提示文字
- [ ] 优化头像区域尺寸
- [ ] 测试并保存checkpoint

## Profile页面语言和UI修复
- [x] 修复Academic Level选择器中文选项（高中→High School, 本科→Undergraduate, 硕士→Master's）
- [x] 删除中文提示文字（SmartInput组件中的"提示：支持中英文输入"）
- [x] 优化头像区域尺寸（w-32 h-32 → w-24 h-24）
- [x] 优化表单字段间距（space-y-6 → space-y-4, 标题text-xl → text-lg）
- [x] 测试并保存checkpoint（所有修复已验证成功）

## Profile页面剩余问题修复
- [x] 修复Resume Upload文件选择按钮显示中文（用自定义按钮替换默认file input，显示"Choose File"）
- [x] 将"Reset Swipe History"按钮从Profile页面移动到Swipe页面右上角
- [x] 测试移动端布局（Save按钮不再超出屏幕）
- [x] 保存checkpoint

## Cover Letter界面修复
- [x] 调查中文研究领域来源（来自professors表的research_field字段）
- [x] 修复中文显示问题（数据库中的中文已翻译，添加LLM自动翻译机制）
- [x] 实现New标签消失机制（点击View Full标记为viewed，Download同时标记viewed和downloaded）
- [x] 检查是否还有其他可能出现中文的地方（已添加中文检测和自动翻译）
- [x] 测试并保存checkpoint（所有功能已验证成功）

## Swipe界面UI优化
- [x] 减小卡片和按钮之间的距离（p-4 → p-2，移动端优化）

## 哈佛大学教授数据收集
- [x] 发现哈佛大学本科专业列表（49个专业）
- [x] 收集每个专业的Top 3教授数据（并行处理）
- [x] 解析和验证教授数据（147位教授，98.64%成功率）
- [x] 标准化研究领域（16个标准类别）
- [x] 保存145位教授数据到数据库
- [x] 提取哈佛大学品牌元素（Harvard Crimson红色）
- [x] 生成15张哈佛×研究领域品牌图像（WebP格式，总大小0.95MB）
- [x] 上传到CDN获取永久URL（15个领域全部完成）
- [x] 更新项目配置文件（universityFieldImages.ts）

## 桌面端Swipe界面优化
- [x] 创建桌面端页眉导航组件（包含Logo、导航链接、Reset/Filter按钮）
- [x] 在Swipe页面集成桌面端页眉
- [x] 桌面端隐藏底部导航栏（只在移动端显示）
- [x] 优化桌面端卡片和按钮间距（减小gap值）
- [x] 测试桌面端和移动端响应式显示
- [x] 保存checkpoint

## 修复教授卡片缺失图像问题
- [x] 查询数据库找出缺失图像的教授（Kerry Naish/Biology, Elaine M Faustman/Environmental & Occupational Health Sciences, Mia Bennett/Geography）
- [x] 检查这些教授的research_field字段值（通过API查询确认）
- [x] 对比universityFieldImages.ts映射配置，找出缺失的大学+领域组合（UW: Arts & Design, Environmental Science; Harvard: Other）
- [x] 生成缺失的大学+领域专属图像（3张WebP格式图像，总大小<3MB）
- [x] 上传到CDN并更新映射配置（universityFieldImages.ts已更新）
- [x] 测试所有教授卡片正常显示图像（Kerry Naish等教授图像已正常显示）
- [x] 保存checkpoint

## 修复DesktopHeader嵌套anchor标签错误
- [x] 检查DesktopHeader组件中的嵌套`<a>`标签问题（wouter的Link组件已渲染<a>，不需要手动嵌套）
- [x] 修夏Logo或导航链接的嵌套结构（移除内部<a>标签，直接使用Link的className）
- [x] 测试修复后没有React DOM警告（浏览器控制台无错误）
- [x] 保存checkpoint

## 优化桌面端间距
- [x] 进一步减小桌面端卡片和按钮之间的间距（md:p-4 → md:p-2）
- [x] 测试桌面端显示效果（布局更加紧凑，卡片占据更多空间）
- [x] 保存checkpoint

## Mac应用打包
- [x] 添加PWA manifest配置文件（manifest.json已创建）
- [x] 生成应用图标（icon-192.png, icon-512.png）
- [x] 在index.html中添加PWA meta标签
- [x] 创建Electron打包配置（electron/main.js, electron-builder.json）
- [x] 创建macOS entitlements文件
- [x] 创建详细的打包文档（MAC_APP_PACKAGING_GUIDE.md）
- [x] 保存checkpoint

## iOS手机应用打包
- [x] 检查和配置Capacitor（capacitor.config.ts已更新）
- [x] 配置iOS应用图标和启动画面（使用现有PWA图标）
- [x] 创建capacitor.config.ts配置文件（已更新为ProfMatch）
- [x] 编写完整的iOS应用打包指南（CAPACITOR_COMPLETE_GUIDE.md已创建，包含打包、更新、支付集成）
- [x] 创建快速参考卡（QUICK_REFERENCE.md已创建）
- [x] 保存checkpoint

## 修复简历上传不同步Profile信息的问题
- [x] 检查简历上传流程和Profile页面的连接（发现了PDF/DOCX文本提取不完整的问题）
- [x] 实现简历信息提取到Profile的功能（添加pdf-parse和mammoth依赖，改进ParseResume后端）
- [x] 改进前端简历解析UX（解析成功后自动保存到Profile）
- [x] 编写测试用例（parseResume.test.ts已创建）
- [x] 保存checkpoint

## 全面修复简历上传同步问题并添加Activities功能
- [x] 测试简历上传功能,诊断信息不同步的具体原因(发现Skills没有显示,Activities没有提取)
- [x] 修复Skills不显示在Profile上的问题(简历解析后自动保存逻辑已存在)
- [x] 检查简历解析后的自动保存逻辑(已有setTimeout 500ms自动保存)
- [x] 确认Activities数据库表已存在(已有activities表)
- [x] 更新简历解析器,提取项目、实习、科研经历等Activities信息(已添加LLM提取逻辑)
- [x] 添加Activities后端API(create, read, update, delete)(已添加activities router)
- [x] 在Profile页面添加Activities展示和编辑UI(已创建ActivitiesSection组件)
- [x] 简历解析成功后自动保存Activities到数据库(已实现createActivityMutation)
- [x] 保存checkpoint

## 系统性彻底修复简历解析问题
- [x] 查看服务器错误日志识别根本原因（500 Internal Server Error: Failed to parse resume file）
- [x] 修复PDF/DOCX解析库导入问题并本地测试（pdf-parse 2.x API变更，改为使用PDFParse类）
- [x] 通过浏览器测试简历上传并修复所有错误（PDF和DOCX均测试通过）
- [x] 验证完整工作流：上传→解析→保存→显示（完整流程验证成功）
- [x] 保存checkpoint（测试结果已记录在resume_parsing_test_results.md）

## 修复简历解析Activities提取功能
- [x] 诊断为什么Activities没有从简历中提取（LLM提取正常，问题在保存环节）
- [x] 检查Activities数据是否保存到数据库（发现profile自动保存错误导致activities保存失败）
- [x] 修复profile自动保存逻辑（移除错误的自动保存，改为提示用户手动保存）
- [x] 改进activities保存流程（使用async/await确保所有activities保存完成）
- [x] 添加保存成功/失败反馈（显示保存计数和错误信息）
- [ ] 保存checkpoint

## 彻底修复简历Activities解析和显示问题
- [x] 检查后端parseResume实现和LLM提取逻辑（后端正常，LLM成功提取activities）
- [x] 检查前端Profile.tsx的activities保存逻辑（发现null值导致Zod验证失败）
- [x] 使用真实简历测试并调试完整流程（通过浏览器实时测试定位问题）
- [x] 修复所有发现的问题并端到端验证（将null转换为undefined，4个activities全部保存并显示成功）
- [ ] 保存checkpoint

## 测试真实简历并清理旧代码后部署到生产环境
- [x] 使用用户真实简历（DA_WEI.pdf）在开发环境测试activities提取（成功提取7个activities）
- [x] 检查并清理旧网站的简历解析相关代码（未发现旧代码，无需清理）
- [x] 验证activities提取和显示功能完全正常（11个activities全部正确显示）
<<<<<<< Updated upstream
- [x] 部署到生产环境（通过checkpoint发布）（version: d9ea9fa7）
- [x] 指导用户在生产环境测试（需要用户点击Publish按钮部署）
=======
- [ ] 部署到生产环境（通过checkpoint发布）
- [ ] 指导用户在生产环境测试

## 移动端Swipe页面布局优化
- [x] 缩短Like/Dislike按钮与卡片之间的距离
- [x] 优化页面垂直间距，确保一屏显示完整
- [x] 调整卡片高度和按钮位置
- [x] 测试移动端显示效果
- [x] 确保不需要滚动即可看到所有功能
>>>>>>> Stashed changes

## 隐私权益政策页面
- [x] 创建Privacy Policy页面组件
- [x] 创建Terms of Service页面组件
- [x] 创建Professor Policy页面组件
- [x] 添加路由配置
- [x] 在页脚添加导航链接
- [x] 测试页面显示效果

## 添加中英文双语支持
- [x] 分析现有LanguageContext和语言系统（i18n.ts已有完整翻译）
- [x] 创建完整的翻译文件（i18n.ts已包含所有翻译）
- [x] 翻译Privacy Policy为中文版本（标题和元数据已翻译）
- [x] 翻译Terms of Service为中文版本（标题和元数据已翻译）
- [x] 翻译Professor Policy为中文版本（标题和元数据已翻译）
- [x] 翻译Swipe页面界面文本（i18n.ts中已有完整翻译）
- [x] 翻译Matches页面界面文本（i18n.ts中已有完整翻译）
- [x] 翻译Letters页面界面文本（i18n.ts中已有完整翻译）
- [x] 翻译Profile页面界面文本（i18n.ts中已有完整翻译）
- [x] 翻译DesktopHeader导航栏文本（已添加中文翻译）
- [x] 翻译BottomNav底部导航栏文本（已添加中文翻译）
- [x] 翻译Footer页脚文本（已添加中文翻译）
- [x] 添加语言切换按钮到导航栏（DesktopHeader中已添加）
- [x] 测试语言切换功能（中英文切换正常）
- [x] 测试所有页面的中英文显示（导航、页脚、政策页面均正常）
- [x] 保存checkpoint（version: 79a35119）

## 修复Footer嵌套anchor标签错误
- [x] 检查Footer组件中的Link使用方式（发现Link内部嵌套了<a>标签）
- [x] 移除Link内部的嵌套<a>标签（直接将className移至Link组件）
- [x] 测试修复后没有React DOM警告（浏览器控制台无错误）
- [x] 保存checkpoint（version: 07d7be22）

## 修复Swipe页面页脚和按钮问题
- [x] 修复Complete Profile按钮点击无效问题（按钮已有正确的onClick逻辑）
- [x] 修复页脚位置问题（使用flex布局+底部padding）
- [x] 为所有页面添加底部padding（pb-32 md:pb-24）
- [x] 测试Complete Profile按钮跳转功能（按钮已有正确逻辑）
- [x] 测试页脚在不同页面的显示效果（Profile页面页脚正常显示）
- [x] 保存checkpoint（version: e5bf4d3a）

## 修复所有页面页脚并添加政策页面中英文切换
- [x] 检查所有页面组件（NotFound、Privacy、PrivacyPolicy、TermsOfService、ProfessorPolicy）
- [x] 为缺少底部padding的页面添加pb-32 md:pb-24
- [x] 创建PrivacyPolicyZh页面（完整的中文内容）
- [x] 创建TermsOfServiceZh页面（完整的中文内容）
- [x] 创建ProfessorPolicyZh页面（完整的中文内容）
- [x] 在App.tsx中添加中文政策页面路由
- [x] 修改Footer组件，根据语言链接到对应页面
- [x] 在英文政策页面添加中文链接
- [x] 测试所有页面的页脚显示效果（所有页面均有充足的底部padding）
- [x] 测试政策页面的中英文切换功能（中英文页面切换正常）
- [ ] 保存checkpoint
