<div align="center">

<img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663312383643/hB2F5YxeXakQRcL5WU36Vw/IMG_2741_c49229e0.PNG" width="280" alt="ProfMatch Swipe Screen" />

# 💘 ProfMatch — 科研相亲网站

**把找导师做成了 Tinder。因为有趣，才能坚持找下去。**

[![Live](https://img.shields.io/badge/🌐_Live_Site-findmyprofessor.xyz-8b5cf6?style=for-the-badge)](https://www.findmyprofessor.xyz)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Stars](https://img.shields.io/github/stars/wd041216-bit/find-my-professor?style=for-the-badge&color=yellow)](https://github.com/wd041216-bit/find-my-professor/stargazers)

</div>

---

## 为什么要做这个？

找导师这件事，本质上是一场**双向选择**。

但现实是：大多数同学对着学校官网的教授列表，一页一页地翻，一篇一篇地读 paper，最后对着空白文档发愁，不知道怎么写套磁信。

**这不对。** 找导师应该像找对象一样——直觉先行，匹配度说话，喜欢了再深入了解。

所以我把它做成了 Tinder 的样子。

> 👉 右滑 = 感兴趣 &nbsp;/&nbsp; 左滑 = 跳过 &nbsp;/&nbsp; 查看匹配分数 &nbsp;/&nbsp; 一键生成套磁信

---

## 使用流程

整个流程只有四步：

<div align="center">

| | | | |
|:---:|:---:|:---:|:---:|
| <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663312383643/hB2F5YxeXakQRcL5WU36Vw/IMG_2744_76ad4945.PNG" width="180" alt="Step 1 - Complete Profile" /> | <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663312383643/hB2F5YxeXakQRcL5WU36Vw/IMG_2745_f7bfc984.PNG" width="180" alt="Step 2 - Explore Professors" /> | <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663312383643/hB2F5YxeXakQRcL5WU36Vw/IMG_2746_04fa9418.PNG" width="180" alt="Step 3 - Review Matches" /> | <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663312383643/hB2F5YxeXakQRcL5WU36Vw/IMG_2747_e7bb3edd.PNG" width="180" alt="Step 4 - Generate Cover Letters" /> |
| **Step 1** 填写学术背景 | **Step 2** 滑动探索教授 | **Step 3** 查看心仪名单 | **Step 4** 一键生成套磁信 |

</div>

---

## 核心界面展示

<div align="center">

<table>
<tr>
<td align="center" width="50%">
<img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663312383643/hB2F5YxeXakQRcL5WU36Vw/IMG_2740_3051937b.PNG" width="260" alt="Professor card with research tags" /><br/>
<sub><b>教授卡片 · 展开研究标签</b></sub>
</td>
<td align="center" width="50%">
<img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663312383643/hB2F5YxeXakQRcL5WU36Vw/IMG_2742_5291847f.PNG" width="260" alt="Match history with score" /><br/>
<sub><b>匹配历史 · 实时匹配分数</b></sub>
</td>
</tr>
<tr>
<td align="center" width="50%">
<img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663312383643/hB2F5YxeXakQRcL5WU36Vw/IMG_2743_c6af5b5c.PNG" width="260" alt="Cover letters list" /><br/>
<sub><b>套磁信管理 · 支持下载</b></sub>
</td>
<td align="center" width="50%">
<img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663312383643/hB2F5YxeXakQRcL5WU36Vw/IMG_2748_125471fc.PNG" width="260" alt="FAQ page" /><br/>
<sub><b>常见问题 · 内置使用指南</b></sub>
</td>
</tr>
</table>

</div>

---

## 核心功能

**滑动发现，而不是翻表格。** 每张教授卡片展示研究方向、所在大学、代表性标签，一眼判断是否值得深入了解。右滑保存，左滑跳过，后悔了还能撤回。

**实时匹配打分。** 填写你的专业背景、技能和研究兴趣后，系统会用 LLM 把你的描述映射到与教授相同的学术词汇体系，计算真实的语义匹配度，而不是简单的关键词重叠。

**一键生成套磁信。** 对保存的教授满意了？点一下，AI 根据你的 Profile 和教授的研究方向，生成一封个性化的申请文书，支持 Formal / Casual / Enthusiastic 三种语气，可直接复制或下载。

**简历一键解析。** 上传 PDF/DOCX 简历，LLM 自动提取技能、经历、目标专业，填入你的 Profile。

**中英双语。** `/zh/*` 路由前缀切换中文界面，大学名称、研究领域、所有 UI 文字全部翻译。套磁信正文保持英文。

---

## 数据规模

| 指标 | 数量 |
|------|------|
| 覆盖美国顶尖大学 | 32 所（MIT、Harvard、Stanford、Columbia 等） |
| 教授档案 | 4,000+ 位 |
| 研究标签词典 | 2,799 个规范化标签 |
| 大学 × 领域封面图 | 全部 CDN 托管 |

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19 · Tailwind CSS 4 · shadcn/ui |
| API | tRPC 11（端到端类型安全） |
| 后端 | Express 4 · Node.js |
| 数据库 | MySQL / TiDB（Drizzle ORM） |
| 认证 | Manus OAuth（session cookie + JWT） |
| AI | LLM via Manus Forge API（标签规范化 + 文书生成） |
| 存储 | S3 兼容对象存储 |
| 构建 | Vite 6 |

---

## 项目结构

```
client/
  src/
    pages/          ← Swipe、Matches、CoverLetters、Profile、Tutorial ...
    components/     ← ProfessorCard、FilterPanel、BottomNav、DesktopHeader ...
    contexts/       ← LanguageContext（zh/en 状态）
    lib/
      i18n.ts                  ← 所有 UI 字符串（中英文）
      universityTranslation.ts ← 大学名称中英文对照（80+ 所）
      departmentTranslation.ts ← 院系名称关键词翻译
drizzle/
  schema.ts         ← 数据库 Schema（professors、students、likes、letters ...）
  *.sql             ← 迁移文件（仅 DDL，不含数据）
server/
  routers/          ← tRPC 路由（swipe、profile、letters、activities ...）
  services/
    professorsService.ts       ← 匹配分数计算
    tagNormalizationService.ts ← LLM 标签规范化
  db.ts             ← Drizzle 查询封装
shared/
  universityFieldImages.ts     ← 大学 × 领域 → CDN 图片 URL 映射
```

---

## 本地运行

**环境要求：** Node.js ≥ 22、pnpm ≥ 9、MySQL 兼容数据库（TiDB Cloud 免费版可用）、Manus 平台账号（OAuth + LLM + 存储 API）。

```bash
# 1. 安装依赖
pnpm install

# 2. 配置环境变量（参考 env.example）
cp env.example .env
# 填写 DATABASE_URL、JWT_SECRET、Manus API Keys 等

# 3. 推送数据库 Schema
pnpm db:push

# 4. 启动开发服务器
pnpm dev
# → http://localhost:3000
```

运行测试：

```bash
pnpm test
```

---

## 数据库核心表

| 表名 | 用途 |
|------|------|
| `professors` | 教授档案（研究方向、标签、大学、联系方式） |
| `student_profiles` | 学生背景（目标大学、专业、技能、规范化标签） |
| `student_likes` | 滑动记录（like / pass，含匹配分数） |
| `cover_letters` | AI 生成的套磁信 |
| `research_tags_dictionary` | 规范化标签词典（2,799 个，来自教授数据） |
| `university_field_images` | 大学 × 研究领域封面图 CDN URL |
| `activities` | 学生课外经历（手动填写 + 简历解析） |

---

## 双语路由

| 路由 | 语言 |
|------|------|
| `/swipe`、`/history`、`/profile` ... | English |
| `/zh/swipe`、`/zh/history`、`/zh/profile` ... | 中文 |

顶部导航栏可随时切换语言。大学名称、研究领域、所有界面文字均已翻译。教授姓名和套磁信正文保持英文。

---

## 隐私说明

本仓库**不包含任何用户数据或教授数据**。`drizzle/*.sql` 迁移文件只有 DDL（建表语句），没有 INSERT 数据。数据库连接信息和 API Key 通过 `.gitignore` 排除。

---

## 贡献

欢迎 PR。重大改动请先开 Issue 讨论。

```bash
git checkout -b feature/your-idea
git commit -m 'Add your idea'
git push origin feature/your-idea
# 然后开 Pull Request
```

---

## License

MIT — 随便用，记得 star ⭐

---

## 联系

**s20316.wei@stu.scie.com.cn**
