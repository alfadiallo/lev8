# EQ·PQ·IQ Site Map (eqpqiq.com)

> Last updated: February 2026

---

## Domain Routing (Middleware)

| URL Pattern | Action | Result |
|-------------|--------|--------|
| `eqpqiq.com/` | Rewrite | `/eqpqiq-landing` (URL stays `/`) |
| `/interview/*` | Pass through | Interview Assessment Tool |
| `/pulsecheck/*` | Pass through | Pulse Check Provider Evaluation |
| `/progress-check/*` | Pass through | Progress Check Residency Analytics |
| `/survey/*` | Pass through | Public token-based survey forms |
| `/api/*` | Pass through | API endpoints |
| All other paths | Redirect → `/` | Forces back to landing page |

Header: `x-lev8-context: eqpqiq` set on all requests.

---

## Landing Page (`/`)

**Location:** `app/eqpqiq-landing/`

### Header Navigation

| Label | Destination |
|-------|-------------|
| EQ·PQ·IQ (logo) | `/` |
| Interview | `/interview` |
| Pulse Check | `/pulsecheck` |
| Contact Us | `mailto:hello@eqpqiq.com` |

### Sections

1. **Hero** — "Measure What Matters" with CTAs to Interview and Pulse Check
2. **Philosophy** — Three Pillars (EQ, PQ, IQ)
3. **Use Cases** — Interview Assessment, Pulse Check, Residency Analytics
4. **AI Analytics** — 4-step process explanation
5. **Archetyping** — 8 performance archetypes
6. **Longitudinal Value** — Trend tracking over time
7. **Individual vs Group** — Scope explanation
8. **CTA** — Links to Interview, Pulse Check, and `lev8.ai`

---

## Interview (`/interview`)

**Theme:** Green (`#D8F3DC` → `#081C15`)
**Layout:** `app/interview/layout.tsx` + `InterviewLayoutClient.tsx`

### Demo Tiles (Landing Page)

| Role | Email | Destination |
|------|-------|-------------|
| Program Director | `sarah.chen@hospital.edu` | `/interview/dashboard` |
| Core Faculty | `emily.watson@hospital.edu` | `/interview/dashboard` |
| Guest Interviewer | — | Coming Soon |
| Coordinator | — | Coming Soon |

### Navigation (post-login)

| Label | Path | Access |
|-------|------|--------|
| Home | `/interview` | Public |
| Dashboard | `/interview/dashboard` | Authenticated |
| Interview Dates | `/interview/sessions` | Authenticated |
| Rank List | `/interview/season` | Program Director |
| Interviewer Stats | `/interview/stats` | Program Director |

### All Pages

```
/interview
├── /dashboard                         — Main dashboard
├── /create                            — Create new session
├── /join/[code]                       — Join session by code
├── /sessions                          — Session list
├── /session/[sessionId]               — Session detail
│   ├── /rate                          — Rate candidates
│   ├── /review                        — Review ratings
│   └── /summary                       — Session summary
├── /season                            — Season-wide rank list (PD only)
├── /stats                             — Interviewer statistics (PD only)
├── /success                           — Success confirmation
├── /pricing                           — Pricing page
└── /register                          — Registration
```

---

## Pulse Check (`/pulsecheck`)

**Theme:** Purple/Violet (`#EDE9FE` → `#4C1D95`)
**Layout:** `app/pulsecheck/layout.tsx` + `PulseCheckLayoutClient.tsx`

### Demo Tiles (Landing Page)

| Role | Email | Destination |
|------|-------|-------------|
| Regional Medical Director | `michael.thompson@metrohealth.com` | `/pulsecheck/reports` |
| Medical Director | `james.wilson@metrohealth.com` | `/pulsecheck/dashboard` |
| Executive Assistant | `amanda.chen@metrohealth.com` | `/pulsecheck/dashboard` |
| Physician & APC | — | Coming Soon |

### Navigation (post-login, role-based)

| Label | Path | Access |
|-------|------|--------|
| Dashboard | `/pulsecheck/dashboard` | All authenticated |
| My Providers | `/pulsecheck/providers` | Medical Director |
| Rate | `/pulsecheck/rate` | Medical Director |
| Reports | `/pulsecheck/reports` | Regional Director + Admin |
| Admin | `/pulsecheck/admin` | Admin Assistant |

### All Pages

```
/pulsecheck
├── /dashboard                         — Main dashboard
├── /providers                         — Provider list (Medical Director)
├── /rate                              — Rating interface (Medical Director)
├── /reports                           — Healthsystem reports (Regional Director)
└── /admin                             — Admin panel (Admin Assistant)
    └── /import                        — Data import
```

---

## Progress Check (`/progress-check`)

**Theme:** Green (shared with Interview)
**Layout:** `app/progress-check/layout.tsx` + `ProgressCheckLayoutClient.tsx`

### Demo Tiles (Landing Page)

| Role | Email | Destination |
|------|-------|-------------|
| Program Director | `demo-pd@greysloan.edu` | Dashboard |
| Faculty | `demo-faculty@greysloan.edu` | Dashboard |
| Resident | `demo-resident@greysloan.edu` | Dashboard |

**Demo program:** Grey Sloan Memorial Hospital — Emergency Medicine Residency

### Navigation (post-login, role-based)

| Label | Path | Access |
|-------|------|--------|
| Dashboard | `/progress-check/dashboard` | `canViewAnalytics` |
| {Specialty} | `/progress-check/residents` | `canViewResidents` |
| Surveys | `/progress-check/surveys` | `canManageSurveys` |
| Settings | `/progress-check/settings` | `canManageSurveys` |

The "Residents" nav label dynamically shows the program specialty (e.g., "Emergency Medicine").

### All Pages

```
/progress-check
├── /dashboard                         — Class cohort overview + active surveys
├── /residents                         — Resident list by class
│   └── /[residentId]                  — Individual resident detail (scores, SWOT)
├── /surveys                           — Survey list organized by PGY level
│   └── /[surveyId]                    — Survey detail (preview, recipients, schedule)
├── /sessions                          — Progress check session management
├── /data                              — Raw data export
└── /settings                          — Framework editor + faculty manager
```

---

## Public Survey Access (`/survey`)

```
/survey/[token]                        — Token-based survey form (no auth required)
```

Respondents receive unique links via email. Supports post-submit editing until deadline.

---

## API Routes

### Progress Check (`/api/progress-check/`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET/POST | `/check-email` | Email validation / login |
| GET | `/residents` | List residents with scores |
| GET | `/residents/[residentId]/scores` | Individual resident scores |
| GET/PATCH | `/faculty` | Faculty list + status/type management |
| GET | `/frameworks/[programId]` | Active evaluation framework |
| PATCH | `/frameworks/[programId]/attributes/[attrId]` | Update framework attribute |
| GET | `/campaign/populate` | Populate campaign wizard data |
| GET | `/data` | Data exports |

### Surveys (`/api/surveys/`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET/POST | `/` | List / create surveys |
| GET | `/[surveyId]` | Survey details |
| POST | `/[surveyId]/distribute` | Distribute survey to respondents |
| GET | `/[surveyId]/results` | Survey results / completion matrix |
| POST | `/[surveyId]/remind` | Send reminder emails |
| GET/POST | `/respond/[token]` | Get form / submit response (public) |

### Other

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/eqpqiq/track-visitor` | Visitor analytics tracking |
| POST | `/api/cron/survey-reminders` | Automated daily reminders (Vercel Cron) |

---

## Authentication

All three products use **email-based login** (no password). Email is passed via URL query params for session persistence.

| Product | Context Provider | Roles |
|---------|-----------------|-------|
| Interview | `InterviewUserContext` | Program Director, Faculty, Guest |
| Pulse Check | `PulseCheckUserContext` | Regional Director, Medical Director, Admin Assistant |
| Progress Check | `ProgressCheckUserContext` | Program Director, Faculty, Resident |

**Public routes** (no auth): `/`, `/interview`, `/pulsecheck`, `/progress-check`, `/survey/[token]`

---

## User Flow

```
eqpqiq.com (Landing Page)
  │
  ├──→ /interview (Landing)
  │      ├── Demo Tiles → auto-login → /interview/dashboard
  │      ├── Email Login → /interview/dashboard
  │      └── Join Code → /interview/join/[code]
  │
  ├──→ /pulsecheck (Landing)
  │      ├── Demo Tiles → auto-login → role-specific page
  │      └── Email Login → role-specific page
  │
  └──→ /progress-check (Landing)
         ├── Demo Tiles → auto-login → role-based redirect
         └── Email Login → role-based redirect
```
