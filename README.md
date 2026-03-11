<div align="center">

<img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663312383643/hB2F5YxeXakQRcL5WU36Vw/swipe-card_3b71048c.PNG" width="280" alt="ProfMatch Swipe Screen" />

# 💘 ProfMatch — Academic Research Matchmaker

**Finding your research advisor, Tinder-style. Because it should be fun.**

[![Live](https://img.shields.io/badge/🌐_Live_Site-findmyprofessor.xyz-8b5cf6?style=for-the-badge)](https://www.findmyprofessor.xyz)
[![Stars](https://img.shields.io/github/stars/wd041216-bit/find-my-professor?style=for-the-badge&color=yellow)](https://github.com/wd041216-bit/find-my-professor/stargazers)

[中文版 README →](./README_zh.md)

</div>

---

## Why This Exists

Finding a research advisor is fundamentally a **two-way match** — yet most students spend hours scrolling through faculty pages, reading papers one by one, and staring at a blank document wondering how to write a cold email.

There's a better way. You should be able to browse professors the same way you'd swipe through a dating app: go with your gut first, let the match score guide you, and dive deeper only when something clicks.

So that's exactly what this is.

> 👉 Swipe right = interested &nbsp;/&nbsp; Swipe left = skip &nbsp;/&nbsp; See your match score &nbsp;/&nbsp; Generate a cover letter in one click

---

## How It Works

Four steps from zero to a personalized cold email:

<div align="center">

| | | | |
|:---:|:---:|:---:|:---:|
| <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663312383643/hB2F5YxeXakQRcL5WU36Vw/step1-profile_740415bd.PNG" width="180" alt="Step 1 - Complete Profile" /> | <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663312383643/hB2F5YxeXakQRcL5WU36Vw/step2-explore_9e091a6e.PNG" width="180" alt="Step 2 - Explore Professors" /> | <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663312383643/hB2F5YxeXakQRcL5WU36Vw/step3-matches_c1bb103c.PNG" width="180" alt="Step 3 - Review Matches" /> | <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663312383643/hB2F5YxeXakQRcL5WU36Vw/step4-letters_7ccdb0ca.PNG" width="180" alt="Step 4 - Generate Cover Letters" /> |
| **Step 1** Complete your profile | **Step 2** Swipe through professors | **Step 3** Review your shortlist | **Step 4** Generate cover letters |

</div>

---

## Screenshots

<div align="center">

<table>
<tr>
<td align="center" width="50%">
<img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663312383643/hB2F5YxeXakQRcL5WU36Vw/swipe-tags_8e8ee509.PNG" width="260" alt="Professor card with research tags" /><br/>
<sub><b>Professor card · Research tags expanded</b></sub>
</td>
<td align="center" width="50%">
<img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663312383643/hB2F5YxeXakQRcL5WU36Vw/matches_05db939e.PNG" width="260" alt="Match history with score" /><br/>
<sub><b>Match history · Live match score badge</b></sub>
</td>
</tr>
<tr>
<td align="center" width="50%">
<img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663312383643/hB2F5YxeXakQRcL5WU36Vw/letters_b5283a3b.PNG" width="260" alt="Cover letters list" /><br/>
<sub><b>Cover letters · View, download, or delete</b></sub>
</td>
<td align="center" width="50%">
<img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663312383643/hB2F5YxeXakQRcL5WU36Vw/faq_24032cee.PNG" width="260" alt="FAQ page" /><br/>
<sub><b>FAQ · Built-in usage guide</b></sub>
</td>
</tr>
</table>

</div>

---

## Features

**Swipe-based discovery** — Browse professor cards showing research field, university, and representative tags. Swipe right to save, left to skip, or undo the last swipe at any time.

**Semantic match scoring** — After filling in your academic background, skills, and research interests, an LLM maps your descriptions into the same vocabulary as professor research tags, producing a meaningful semantic match score rather than simple keyword overlap.

**One-click cover letter generation** — Saved a professor you like? One click generates a personalized cold email tailored to that professor's specific research. Choose from Formal, Casual, or Enthusiastic tone. Copy or download instantly.

**Resume parsing** — Upload a PDF or DOCX résumé and let the LLM auto-fill your profile with extracted skills, experience, and academic goals.

**Bilingual (中文 / English)** — A `/zh/*` URL prefix switches the entire UI to Simplified Chinese. University names, research fields, and all interface strings are fully translated. Cover letter content stays in English for professional use.

---

## Data

| Metric | Count |
|--------|-------|
| Top US research universities | 32 (MIT, Harvard, Stanford, Columbia, and more) |
| Professor profiles | 4,000+ |
| Canonical research tags | 2,799 |
| University × field cover images | All CDN-hosted |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 · Tailwind CSS 4 · shadcn/ui |
| API | tRPC 11 (end-to-end type safety) |
| Backend | Express 4 · Node.js |
| Database | MySQL / TiDB (Drizzle ORM) |
| Auth | Manus OAuth (session cookie + JWT) |
| AI | LLM via Manus Forge API (tag normalization + letter generation) |
| Storage | S3-compatible object storage |
| Build | Vite 6 |

---

## Project Structure

```
client/
  src/
    pages/          ← Swipe, Matches, CoverLetters, Profile, Tutorial ...
    components/     ← ProfessorCard, FilterPanel, BottomNav, DesktopHeader ...
    contexts/       ← LanguageContext (zh/en state)
    lib/
      i18n.ts                  ← All UI strings (English + Chinese)
      universityTranslation.ts ← University name zh/en map (80+ schools)
      departmentTranslation.ts ← Department keyword-based translation
drizzle/
  schema.ts         ← Database schema (professors, students, likes, letters ...)
  *.sql             ← Migration files (DDL only, no data)
server/
  routers/          ← tRPC procedures (swipe, profile, letters, activities ...)
  services/
    professorsService.ts       ← Match score calculation
    tagNormalizationService.ts ← LLM-based student tag normalization
  db.ts             ← Drizzle query helpers
shared/
  universityFieldImages.ts     ← University × field → CDN image URL lookup
```

---

## Getting Started

**Prerequisites:** Node.js ≥ 22, pnpm ≥ 9, a MySQL-compatible database (TiDB Cloud free tier works), and a Manus platform account for OAuth, LLM, and storage APIs.

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment variables
cp env.example .env
# Fill in DATABASE_URL, JWT_SECRET, and Manus API keys

# 3. Push the database schema
pnpm db:push

# 4. Start the dev server
pnpm dev
# → http://localhost:3000
```

Run the test suite:

```bash
pnpm test
```

---

## Database Schema (Key Tables)

| Table | Purpose |
|-------|---------|
| `professors` | Professor profiles with research fields, tags, university, contact info |
| `student_profiles` | Student background, target universities, skills, normalized tags |
| `student_likes` | Swipe history (like / pass) with match score per pair |
| `cover_letters` | AI-generated application letters |
| `research_tags_dictionary` | Canonical tag vocabulary built from professor data (2,799 tags) |
| `university_field_images` | CDN image URLs per university × research field combination |
| `activities` | Student extracurricular activities (manual entry + resume-parsed) |

---

## Localization

The app supports **English** (default) and **Simplified Chinese** via URL prefix routing:

| Route | Language |
|-------|----------|
| `/swipe`, `/history`, `/profile` ... | English |
| `/zh/swipe`, `/zh/history`, `/zh/profile` ... | Chinese |

The language switcher is available in the top navigation bar on all pages. University names, research fields, and all UI strings are fully translated. Professor names and cover letter content remain in English.

---

## Privacy

This repository contains **no user data and no professor data**. The `drizzle/*.sql` migration files contain only DDL (schema definitions, no INSERT statements). Database credentials and API keys are excluded via `.gitignore`.

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

```bash
git checkout -b feature/your-idea
git commit -m 'Add your idea'
git push origin feature/your-idea
# Then open a Pull Request
```

---

## Contact

**s20316.wei@stu.scie.com.cn**
