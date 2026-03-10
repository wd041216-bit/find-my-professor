# ProfMatch — Project TODO

## Core Features
- [x] Swipe-based professor discovery (LIKE / NOPE / Undo)
- [x] Match score algorithm (tag overlap, normalized tags preferred)
- [x] Filter by university and research field
- [x] LIKE/NOPE animations with stamp overlay
- [x] Image preloading (eager load + preload next 3 cards)
- [x] Match history page (Matches) with color-coded score badges
- [x] AI cover letter generation (one-click, per professor)
- [x] Student profile page (target universities, major, skills, interests, activities)
- [x] LLM tag normalization on profile save (maps student skills → professor vocabulary)
- [x] Resume upload and LLM-based profile parsing

## Bilingual Support (中文 / English)
- [x] URL-based language routing (/zh/* prefix for Chinese)
- [x] LanguageContext + LanguageSwitcher on all pages
- [x] All UI strings translated (i18n.ts)
- [x] University names translated (universityTranslation.ts, 80+ universities)
- [x] Department names translated (departmentTranslation.ts, keyword-based)
- [x] Research fields translated (database field: research_field_zh)
- [x] Swipe, Matches, Letters, Profile, Tutorial pages fully bilingual
- [x] Policy pages (Privacy, Terms, Professor Policy) in both languages

## Authentication & User Management
- [x] Google OAuth login (via Manus OAuth)
- [x] Protected routes redirect unauthenticated users to sign-in
- [x] Chinese users redirected to /zh/swipe after login

## Content & Data
- [x] 32 US universities, 4,000+ professors in database
- [x] 2,799 canonical research tags dictionary
- [x] University × research field cover images (CDN)
- [x] Tutorial / Guide page (/tutorial and /zh/tutorial)

## UX & Polish
- [x] Mobile bottom navigation bar
- [x] Desktop top navigation with filter controls
- [x] Footer hidden on mobile (links moved to Profile page bottom)
- [x] PWA manifest with CDN screenshots
- [x] OG social share image
- [x] SEO: sitemap.xml, robots.txt, structured data

## Pending / Future Work
- [ ] Run LLM tag normalization for existing users (backfill normalized_tags)
- [ ] Chinese tags on professor card info panel (use tags_zh field)
- [ ] Matches page: search and sort by score / date
- [ ] Email notification when a new match exceeds a score threshold
- [ ] Add more universities (currently 32 of ~200 R1 institutions)
