# ProfMatch — Smart Academic Research Matcher

> **Swipe to find your ideal research advisor.** ProfMatch is a Tinder-style web app that matches graduate school applicants with professors based on research interests, academic background, and AI-powered tag normalization.

🌐 **Live site:** [findmyprofessor.xyz](https://findmyprofessor.xyz)

---

## Features

- **Swipe-based discovery** — Browse professor cards, swipe right to save, left to skip, undo the last swipe
- **Smart matching** — LLM-powered tag normalization maps student skills/interests to the same vocabulary as professor research tags, producing meaningful match scores
- **32 universities, 4,000+ professors** — Covers top US research institutions (MIT, Harvard, Stanford, Columbia, etc.)
- **Filter by university & research field** — Narrow down professors by school and discipline
- **AI cover letter generation** — One-click generation of personalized application letters for saved professors
- **Bilingual (中文 / English)** — Full Chinese and English UI via `/zh/*` route prefix; all professor research fields and university names are translated
- **Resume parsing** — Upload a PDF/DOCX résumé and let the LLM auto-fill your profile
- **Responsive design** — Works on mobile and desktop; bottom nav on mobile, sidebar nav on desktop

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Tailwind CSS 4, shadcn/ui |
| API | tRPC 11 (end-to-end type safety) |
| Backend | Express 4, Node.js |
| Database | MySQL / TiDB (via Drizzle ORM) |
| Auth | Manus OAuth (session cookies + JWT) |
| AI | LLM via Manus Forge API (chat completion + structured JSON) |
| File Storage | S3-compatible object storage |
| Build | Vite 6 |

---

## Project Structure

```
client/
  src/
    pages/          ← Swipe, History (Matches), CoverLetters, Profile, Tutorial, ...
    components/     ← ProfessorCard, FilterPanel, BottomNav, DesktopHeader, ...
    contexts/       ← LanguageContext (zh/en state)
    hooks/          ← useLocale (route-based locale detection)
    lib/
      i18n.ts       ← All UI strings (English + Chinese)
      universityTranslation.ts  ← University name zh/en map
      departmentTranslation.ts  ← Department keyword-based translation
drizzle/
  schema.ts         ← Database schema (professors, students, likes, letters, tags, ...)
  *.sql             ← Migration files (schema only, no data)
server/
  routers/          ← tRPC procedures (swipe, profile, letters, activities, ...)
  services/
    professorsService.ts      ← Match score calculation
    tagNormalizationService.ts ← LLM-based student tag normalization
  db.ts             ← Drizzle query helpers
shared/
  universityFieldImages.ts    ← University × field → CDN image URL lookup
  translations.ts             ← Shared university/major normalization helpers
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 22
- pnpm ≥ 9
- A MySQL-compatible database (TiDB Cloud free tier works)
- Manus platform account (for OAuth + LLM + storage APIs)

### Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```env
DATABASE_URL=mysql://user:password@host:port/dbname
JWT_SECRET=your-secret-key
VITE_APP_ID=your-manus-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im
BUILT_IN_FORGE_API_URL=https://...
BUILT_IN_FORGE_API_KEY=your-key
VITE_FRONTEND_FORGE_API_KEY=your-frontend-key
VITE_FRONTEND_FORGE_API_URL=https://...
```

### Install & Run

```bash
pnpm install
pnpm db:push      # Apply database schema migrations
pnpm dev          # Start dev server at http://localhost:3000
```

### Run Tests

```bash
pnpm test
```

---

## Database Schema (Key Tables)

| Table | Purpose |
|-------|---------|
| `professors` | Professor profiles with research fields, tags, university, contact info |
| `student_profiles` | Student academic background, target universities, skills, interests, normalized_tags |
| `student_likes` | Swipe history (like / pass) per student–professor pair |
| `cover_letters` | AI-generated application letters |
| `research_tags_dictionary` | Canonical tag vocabulary built from professor data (2,799 tags) |
| `university_field_images` | CDN image URLs per university × research field combination |
| `activities` | Student extracurricular activities (manual + resume-parsed) |

---

## Localization

The app supports **English** (default) and **Simplified Chinese** via URL prefix routing:

| Route | Language |
|-------|----------|
| `/swipe`, `/history`, `/profile`, ... | English |
| `/zh/swipe`, `/zh/history`, `/zh/profile`, ... | Chinese |

Language switching is available in the top navigation bar on all pages. University names, research fields, and all UI strings are fully translated. Professor names and letter content remain in English.

---

## Privacy & Data

- **Professor data** is stored in the database and is not included in this repository. The schema migrations contain only DDL (no INSERT statements).
- **User data** (student profiles, swipe history, generated letters) is stored in the database and is not included in this repository.
- **Environment secrets** (database credentials, API keys) are excluded via `.gitignore`.
- The `.manus/` directory (internal platform logs containing DB connection strings) is excluded via `.gitignore`.

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Contact

**s20316.wei@stu.scie.com.cn**
