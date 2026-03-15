# 🗺️ ProfMatch Roadmap

This document outlines the improvement plan for ProfMatch, prioritized by impact and urgency.

---

## Priority Framework

| Priority | Meaning | Timeline |
|----------|---------|----------|
| **P0** | Critical — Core stability, performance, security | Immediate (1-2 weeks) |
| **P1** | High — Feature enhancements, UX improvements | Short-term (1-2 months) |
| **P2** | Medium — Nice-to-have features, polish | Medium-term (3-6 months) |

---

## P0: Critical Improvements

### ✅ Completed (March 2025)

- [x] **PWA Manifest** — Add `manifest.json` for mobile installation support
- [x] **Analytics Integration** — Plausible privacy-first tracking
- [x] **README Enhancement** — Bilingual, user stories, compelling value proposition

### 🔄 In Progress

- [ ] **Performance Audit** — Lighthouse score optimization (target: 90+ on mobile)
  - Image lazy loading
  - Code splitting for routes
  - Reduce initial bundle size

- [ ] **Error Handling** — Graceful degradation for API failures
  - User-friendly error messages
  - Retry logic for transient failures
  - Offline mode indicator

- [ ] **Security Hardening**
  - Rate limiting on tRPC endpoints
  - Input validation on all forms
  - CSRF protection review

---

## P1: High Priority Features

### 🎯 User Experience

- [ ] **Match Explanation** — Show *why* a match score is high
  - Highlight overlapping research tags
  - Display skill alignment visually
  - "You both work on __" tooltip

- [ ] **Professor Detail Page** — Dedicated page per professor
  - Full publication list
  - Recent papers with abstracts
  - Lab website link
  - Contact preferences

- [ ] **Email A/B Testing** — Test different cover letter tones
  - Track open/response rates per tone
  - Suggest best-performing tone per region
  - Export response analytics

- [ ] **Save & Compare** — Side-by-side professor comparison
  - Select 2-3 professors
  - Compare research fields, tags, match scores
  - Export comparison as PDF

### 🛠️ Technical Improvements

- [ ] **TypeScript Strict Mode** — Enable all strict flags
  - No implicit any
  - Strict null checks
  - Module resolution: bundler

- [ ] **API Versioning** — Prepare for breaking changes
  - `/api/v1/*` prefix
  - Deprecation notices in responses
  - Migration guide for clients

- [ ] **Database Indexing** — Optimize query performance
  - Index on `match_score` column
  - Composite index for region + university
  - Covering index for frequent queries

---

## P2: Medium Priority Enhancements

### 🌟 Feature Polish

- [ ] **Professor Video Intros** — 30-second welcome videos
  - Optional upload by professors
  - Embed in professor cards
  - Mobile-optimized playback

- [ ] **Student Profile Badges** — Achievement system
  - "Complete Profile" badge
  - "First Match" badge
  - "Email Sent" badge
  - Gamification for engagement

- [ ] **Research Trend Alerts** — Notify when new professors match your interests
  - Weekly digest email
  - In-app notification center
  - Unsubscribe anytime

- [ ] **Dark Mode** — System preference detection
  - Toggle in settings
  - Persist per user
  - Test all components

### 📈 Growth & Discovery

- [ ] **Professor Referral Program** — Invite professors to join
  - Referral link generation
  - Onboarding email sequence
  - Track referral conversions

- [ ] **University Partnership** — Reach out to grad schools
  - Demo access for admissions offices
  - Embed widget on university sites
  - Co-marketing opportunities

- [ ] **SEO Optimization** — Improve organic discovery
  - Meta descriptions per page
  - Structured data (Schema.org)
  - Sitemap.xml submission

### 🧪 Experimental Features

- [ ] **AI Research Summary** — LLM summarizes professor's recent work
  - 3-bullet abstract per professor
  - "What they're working on now" section
  - Update monthly

- [ ] **Match Confidence Score** — Show confidence interval for match score
  - High confidence: 10+ tag overlaps
  - Medium: 5-10 overlaps
  - Low: <5 overlaps (suggest profile expansion)

---

## Success Metrics

| Metric | Current | Target (Q2 2025) |
|--------|---------|------------------|
| User signups | TBD | 500/month |
| Match → Email conversion | TBD | 40% |
| Email response rate | TBD | 15% |
| Mobile installs (PWA) | 0 | 20% of users |
| Lighthouse score | TBD | 90+ |

---

## How to Contribute

Pick any item above and:

1. **Comment on the issue** — Claim the task
2. **Create a feature branch** — `feature/roadmap-item-name`
3. **Submit a PR** — Link to this roadmap
4. **Update this doc** — Mark as complete ✅

---

*Last updated: 2025-03-15*  
*Version: 1.0.0*
