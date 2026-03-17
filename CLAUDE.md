# CLAUDE.md - Lev8 (Elevate)

## Project Overview

**Elevate (Lev8)** is a medical residency education platform for Memorial Hospital West Emergency Medicine Residency Program. It includes the Elevate learning platform plus EQ·PQ·IQ products: Progress Check (residency evaluation surveys), Interview Assessment Tool, Pulse Check provider evaluations, and EPI Quotient performance visualization.

- **Main Platform:** www.lev8.ai
- **EQ·PQ·IQ Products:** www.eqpqiq.com
- **EPI Quotient:** www.epiquotient.com
- **Repository:** https://github.com/alfadiallo/lev8
- **Status:** Production (February 2026)
- **API Routes:** ~200 endpoints

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 15.5.9 (App Router with Turbopack) |
| **Frontend** | React 19.1.0, TypeScript 5 (Strict Mode), Tailwind CSS 4 |
| **UI Components** | Shadcn/ui, Lucide React |
| **Charts** | Recharts 3.4.1, D3 7.9.0 |
| **Database** | Supabase (PostgreSQL) with RLS |
| **Auth** | Supabase Auth with RBAC + 2FA (TOTP) |
| **AI - Conversations** | Anthropic Claude v0.68.0 |
| **AI - Alternative** | Google Generative AI v0.24.1 |
| **AI - Transcription** | OpenAI Whisper |
| **Payments** | Stripe v20.1.2 |
| **Deployment** | Vercel |

## Architecture Overview

### Product Suite

```
┌─────────────────────────────────────────────────────────────┐
│                    ELEVATE PLATFORM (lev8.ai)               │
├─────────────────┬─────────────────┬─────────────────────────┤
│   LEARN MODULE  │   GROW MODULE   │    UNDERSTAND MODULE    │
│ • Conversations │ • Voice Journal │ • AI SWOT Analysis      │
│ • Clinical Cases│ • AI Summarize  │ • EQ+PQ+IQ Radar Charts │
│ • ACLS Sims     │                 │ • ITE Score Tracking    │
│ • Running Board │                 │ • Period Scores         │
└─────────────────┴─────────────────┴─────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                 EQ·PQ·IQ PRODUCTS (eqpqiq.com)              │
├────────────────────┬────────────────────┬───────────────────┤
│   PROGRESS CHECK   │ INTERVIEW ASSESS.  │   PULSE CHECK     │
│ • Survey campaigns │ • Candidate eval   │ • Provider eval   │
│ • EQ/PQ/IQ ratings │ • Score normalize  │ • Healthsystem    │
│ • Faculty/Self     │ • Season rank list │ • Voice memos     │
│ • Cron reminders   │ • Demo role tiles  │ • Email reports   │
└────────────────────┴────────────────────┴───────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              EPI QUOTIENT (epiquotient.com)                  │
├─────────────────────────────────────────────────────────────┤
│ • Particle wave visualization (270 demo profiles)           │
│ • Program / Class / Individual view scopes                  │
│ • 5 analytical lens sections + 13-section individual view   │
│ • 3D perspective transitions, touch support                 │
│ • 9 trajectory archetypes, seeded demo data                 │
└─────────────────────────────────────────────────────────────┘
```

### Multi-Tenant Routing

- Dynamic routing via `[org]/[dept]` URL parameters
- Middleware handles tenant context initialization
- Domain-based routing for subdomains (studio., eqpqiq.com)
- eqpqiq.com root (/) serves brand landing page via middleware rewrite to /eqpqiq-landing
- epiquotient.com root (/) serves particle visualization via middleware rewrite to /epiquotient (308 canonical redirect from bare domain to www.epiquotient.com; `x-lev8-context: epiquotient` header)

## Directory Structure

```
lev8/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   ├── (dashboard)/              # Protected dashboard routes
│   ├── api/                      # ~200 API endpoints (~30 route groups)
│   ├── admin/                    # Admin dashboard
│   ├── eqpqiq-landing/           # EQ·PQ·IQ brand landing page (eqpqiq.com root)
│   ├── epiquotient/              # EPI Quotient visualization (epiquotient.com)
│   ├── interview/                # Interview tool pages
│   ├── progress-check/           # Progress Check pages (surveys, admin)
│   ├── pulsecheck/               # Pulse Check pages
│   ├── survey/                   # Public survey response form (/survey/[token])
│   └── studio/                   # Content creator studio
├── components/                   # React components (~18 subdirectories)
│   ├── modules/                  # Learn module UIs
│   ├── analytics/                # SWOT, ITE, radar charts
│   ├── eqpqiq/                   # Shared EQ·PQ·IQ brand components
│   ├── epiquotient/              # EPI Quotient particle field, lenses, individual view sections
│   ├── forms/                    # EQ+PQ+IQ rating forms
│   ├── pulsecheck/               # Sparkline, ProviderProfileModal, RatingSliders
│   └── ui/                       # Shadcn/ui components
├── context/                      # React context providers
│   └── ProgressCheckUserContext   # Auth context for Progress Check
├── lib/                          # Shared utilities
│   ├── ai/                       # Claude API, anonymization, SWOT prompts
│   ├── conversations/            # v1 and v2 conversation engines
│   ├── interview/                # Interview logic, score normalization
│   ├── permissions/              # RBAC utilities
│   └── types/                    # TypeScript definitions
├── docs/                         # Comprehensive documentation (38+ files)
├── scripts/                      # Database migrations, architecture audits
└── supabase/                     # Database migrations
```

## Current Features

### Learn Module
- **Difficult Conversations:** AI-powered practice with clinical vignettes (Claude/Gemini)
- **Clinical Cases:** Emergency Medicine case library
- **ACLS Simulations:** EKG interpretation and protocol training
- **Running Board:** Multi-patient management scenarios

### Grow Module
- **Voice Journal:** Private reflection with Whisper transcription + Claude summarization
- Secure, resident-only access with RLS policies

### Understand Module (Analytics)
- **AI SWOT Analysis:** Claude-generated insights from faculty evaluations
- **EQ+PQ+IQ Dashboard:** 15-point radar charts (faculty vs self-assessment)
- **ITE Score Tracking:** Historical performance trends
- **Period Scores:** Longitudinal competency tracking across PGY levels
- **Progress Check Sessions:** Faculty-led evaluation meetings (renamed from CCC)

### Progress Check (Survey System)
- **Survey Campaigns:** Program Directors create evaluation surveys targeting residents by class and period
- **Campaign Wizard:** Single-page form — select class, period (Orientation/Fall/Spring/Custom), survey types (Self-Assessment, Core Faculty, Teaching Faculty), deadline, and form settings; creates drafts only
- **Multi-Resident Survey Flow:** Core Faculty and Teaching Faculty share a unified UI — welcome screen, dot/pill stepper, sticky header/footer with PGY level, and "Review All" summary page
- **Review All Summary:** Expandable attribute breakdowns, heatmap score circles (red→green), sort by name/score/original order, smart submit button (greyed "Submitted" vs active "Update Your Submission")
- **EQ/PQ/IQ Ratings:** Emotional Quotient, Professional Quotient, Intellectual Quotient scoring (0-100 scale)
- **Evaluation Frameworks:** Configurable per-program attribute sets (e.g., ACGME milestones)
- **Faculty & Self-Assessment:** Surveys distributed to core faculty, teaching faculty, and residents
- **Token-Based Access:** Public survey form at `/survey/[token]` — no login required for respondents
- **Recipient Toggles:** Toggle individual recipients on/off with Select All / Deselect All before distributing
- **Email Distribution:** Automated survey invitations with personalized tokens and green-themed email template
- **Completion Notifications:** Survey creator receives email on each respondent completion — includes progress bar, respondent list with status badges, and one-click "Send Reminders" button
- **Cron Reminders:** Scheduled reminder emails for incomplete surveys (`/api/cron/survey-reminders`)
- **Daily Database Backup:** Cron job at `/api/cron/daily-backup` dumps 13 critical tables to CSV, emails as attachments daily at 6 AM EST. Configurable via `BACKUP_EMAIL` env var
- **Results Aggregation:** Per-resident score rollups with faculty vs self-assessment breakdown
- **Demo Accounts:** Program Director, Faculty, and Resident test accounts
- **Green Theme:** Consistent green (#16A34A / #15803D) UI chrome with red/blue/purple pillar accents
- **Domain Support:** Canonical `www.eqpqiq.com` with 308 redirect from bare domain; auth routes and `/update-password` pass through middleware

### Interview Assessment Tool
- Candidate evaluation for residency interviews
- Program Director and Faculty role views
- Score normalization across interviewers
- Season-wide rank lists with analytics

### Pulse Check
- Provider performance evaluation for health systems
- Hierarchical structure (Healthsystem → Sites → Departments)
- **Frequency Management:** Configurable quarterly/biannually/annually per site
- **Operational Metrics:** LOS, Imaging Utilization, PPH tracking
- **Sparkline Trends:** Smooth bezier curve visualizations for score trends
- **Accordion Details:** Expandable EQ/PQ/IQ breakdown in provider list
- **Provider Profile Modal:** Current scores + historical trends view
- Voice memo recording with transcription
- Email reminders and reporting
- Demo accounts for Regional Director, Medical Director, Admin Assistant

### EPI Quotient (Performance Fingerprint)
- **Particle Wave Visualization:** Interactive canvas field where each particle represents a physician/medical student, colored by composite EQ/PQ/IQ score, positioned along sine waves grouped by training level
- **Four View Modes:** Landing (particle field), Program (cohort analytics), Class (class-level analytics with role filter), Individual (deep-dive profile)
- **5 Analytical Lens Sections:** Overview, EQ/PQ/IQ, SWOT, Trajectory, Archetypes — full-viewport scroll-snap sections at Program and Class scopes
- **13-Section Individual View:** Radar (with timeline play/pause), Comparison (faculty vs self), Heatmap, Trends (Faculty/Self/Both toggle), ITE, EQ/PQ/IQ Drilldowns, Trajectory, SWOT, Archetype, Ratings, Comments — organized into Overview, Deep Dive, and Context & History groups
- **Sorting & Filtering:** 6 sort modes (A-Z, EQ, PQ, IQ, EPIq, default), role filter pills, score band filter pills, gradient bar segments
- **3D Transitions:** Perspective rotateY animation between landing and individual view; cross-dissolve between program/class
- **Touch Support:** Mobile touch mini-sheet, 36px hit areas, responsive breakpoints (1024/768/480px)
- **9 Trajectory Archetypes:** Elite Performer, Breakthrough, Late Bloomer, Steady Climber, etc. with risk classification
- **Demo Data:** 270 seeded profiles (23 MS3, 35 MS4, 45 PGY 1-3, 75 active graduates across 5 classes, 92 archived)
- **Domain:** www.epiquotient.com (public, no auth required)
- **Database:** `epiq_profiles`, `epiq_profile_scores`, `epiq_profile_history` with public RLS

## Known Issues / TODOs

### High Priority
1. `middleware.ts:318,330` - "Fetch user's primary org from database" - Currently hardcoded
2. `CaseInterface.tsx:41` - "Implement scoring logic based on questions and answers"
3. `my-profile/page.tsx:178,192,206,220` - Missing ITE, SWOT, evaluations, learning progress components
4. `self-assessment/page.tsx:65` - "Calculate from graduation date" instead of hardcoded PGY-1
5. `analytics/swot/program/route.ts:41` - "Implement program-wide aggregation logic"
6. `auth/login/route.ts:36` - "Implement proper 2FA when needed"
7. `conversations/v2:79` - "Implement streaming when needed"

### Known Limitations
- Streaming responses not yet implemented for conversations
- Program-wide SWOT aggregation needs implementation
- Some settings pages not fully connected to backend
- Dev mode bypasses Stripe subscription validation

## Key API Endpoints (Progress Check / Survey)

- `/api/progress-check/campaign/populate` - Fetch classes, faculty, residents for campaign wizard
- `/api/progress-check/check-email` - Validate Progress Check user email
- `/api/progress-check/data` - Program data for authenticated PC users
- `/api/progress-check/faculty` - Faculty listing for a program
- `/api/progress-check/residents` - Resident listing; `[residentId]/scores` for individual scores
- `/api/progress-check/frameworks/[programId]` - Evaluation frameworks; `/attributes/[attrId]` for details
- `/api/surveys` - Survey CRUD (GET list, POST create)
- `/api/surveys/[surveyId]` - Single survey (GET, PATCH status)
- `/api/surveys/[surveyId]/distribute` - Send survey emails to recipients
- `/api/surveys/[surveyId]/remind` - Send reminders for pending responses
- `/api/surveys/[surveyId]/results` - Aggregated results per resident
- `/api/surveys/respond/[token]` - Public survey form data (GET) and submission (POST)
- `/api/cron/survey-reminders` - Cron endpoint for automated reminder emails
- `/api/cron/daily-backup` - Daily database dump to CSV emailed as attachments (requires `CRON_SECRET` header)
- `/api/progress-check-sessions` - Progress Check meeting sessions (renamed from CCC)
- `/api/v2/sessions/progress-check` - V2 session endpoints (renamed from CCC)

## Key API Endpoints (EPI Quotient)

- `/api/epiquotient/profiles` - EPI Quotient profiles with scores, history, archetypes, and seeded demo data (radar, comparison, trends, SWOT, ITE, ratings). Optional `?cohort=` filter. Returns `{ meta, profiles }` envelope.

## Recent Changes

From git history:
1. **EPI Quotient — Performance Fingerprint (March 2026)**
   - New product at www.epiquotient.com — interactive particle wave visualization of physician EQ/PQ/IQ scores
   - 4 view modes: landing (particle field), program, class, individual with 3D perspective transitions
   - 5 analytical lens sections (Overview, EQ/PQ/IQ, SWOT, Trajectory, Archetypes) at program/class scopes
   - 13-section Individual View with sidebar, section registry (Radar with timeline, Comparison, Heatmap, Trends, ITE, EQ/PQ/IQ Drilldowns, Trajectory, SWOT, Archetype, Ratings, Comments)
   - 6 sort modes, role/score-band filtering, data-driven wave amplitudes, touch mini-sheet
   - API with 6 seeded demo data generators (deterministic by profile UUID)
   - Graduate class redistribution: 75 active across 5 classes (2022-2026), 92 archived
   - Database: `epiq_profiles`, `epiq_profile_scores`, `epiq_profile_history` with public RLS
   - Middleware domain routing: epiquotient.com → /epiquotient with `x-lev8-context: epiquotient`

2. **Daily Database Backup & Admin Enhancements (March 2026)**
   - Daily cron job (`/api/cron/daily-backup`) dumps 13 critical tables to CSV, emails as attachments via Resend to `BACKUP_EMAIL` env var (6 AM EST daily)
   - Per-respondent faculty breakdowns on resident profile: nested dropdowns under Core Faculty / Teaching Faculty showing individual faculty scores and counts
   - Resend Link button on survey detail Respondents tab for individual re-sends (bypasses max_reminders)
   - Slider hit targets enlarged (28px thumb, 48px input), clipboard event suppression for hospital network Proofpoint proxies
   - Completion notifications awaited (not fire-and-forget) to prevent Vercel serverless silent failures
   - Cleaned up orphaned teaching faculty test data and period label format inconsistencies

2. **Survey Completion Notifications & Profile Fixes (March 2026)**
   - Admin notification email on each survey completion: respondent name, rater type, progress bar (X/Y), full respondent list with status badges, "View Survey Details" and "Send Reminders" action buttons
   - One-click reminder link: `?action=remind` on survey detail page auto-triggers reminders to incomplete respondents
   - Resident profile: Self-Assessment now shows `(n=X)` count in radar legend and summary table
   - Period label normalization: API strips trailing qualifiers (e.g., "PGY 3 Spring CCC" → "PGY 3 Spring") for correct trend chart grouping
   - Added `Orientation` as a valid period in the trend data sort key

3. **Progress Check Survey Enhancements (February 2026)**
   - Multi-resident survey flow: unified Core Faculty & Teaching Faculty experience with welcome screen, dot/pill stepper, sticky header/footer, and Review All summary page
   - Campaign Wizard redesigned: single-page form (class, period radio, survey type checkboxes); creates drafts only; deploy from survey detail page
   - Review All page: expandable attribute breakdowns, heatmap score circles, sort modes (A-Z, Z-A, score, original), smart submit button
   - Select All / Deselect All on Recipients tab; email template updated (green button, expanded text)
   - Password reset domain-aware: `redirect_to` matches requesting domain (eqpqiq.com / lev8.ai / localhost)
   - Middleware: canonical 308 `eqpqiq.com` → `www.eqpqiq.com`; auth routes + `/update-password` allowed on eqpqiq domain
   - Login button added to EQ·PQ·IQ landing page header
   - Database migrations: `faculty_type`/`site` columns on `faculty`, unique constraint on `(form_submission_id, resident_id)` in `structured_ratings`
   - Respondent status preserved as `completed` when editing already-submitted faculty evaluations

2. **Progress Check Survey System (February 2026)**
   - Full survey campaign lifecycle: create → configure → distribute → collect → aggregate results
   - New page routes: `/progress-check/*` (admin), `/survey/[token]` (public respondent form)
   - New API routes: 15+ endpoints across `/api/progress-check/`, `/api/surveys/`, `/api/cron/`
   - Token-based public survey access (no auth required for respondents)
   - Recipient toggle switches with default-on state before distribution
   - EQ/PQ/IQ terminology updated: "Intelligence" → "Quotient" across all surfaces
   - Slider label flashing fix: continuous label display with fixed-height container
   - Green theme consistency across survey form (hex-based inline styles)
   - PostgREST FK workaround: split `user_profiles:user_id` joins into separate queries (7 API routes)
   - Database migrations: survey tables, evaluation frameworks, demo accounts, CCC→Progress Check rename
   - Context provider: `ProgressCheckUserContext` for email-based auth flow
   - Cron job for automated survey reminder emails
   - New docs: `PRD-PROGRESS-CHECK.md`, `OPS-SURVEY-RUNBOOK.md`, `site-map-eqpqiq.md`

2. **CCC → Progress Check Rename (February 2026)**
   - Renamed all "CCC" references to "Progress Check" across codebase
   - API routes: `/api/ccc-sessions` → `/api/progress-check-sessions`, `/api/v2/sessions/ccc` → `/api/v2/sessions/progress-check`
   - Database migration: `20260218000001_rename_ccc_to_progress_check.sql`
   - UI labels, component names, and documentation updated throughout

3. **EQ·PQ·IQ Brand Landing Page (February 2026)**
   - New comprehensive landing page at eqpqiq.com root (philosophy, use cases, AI analytics, archetyping, longitudinal value, individual vs group)
   - Middleware rewrite: eqpqiq.com / → /eqpqiq-landing (URL stays as /)
   - New files: app/eqpqiq-landing/ (layout, client layout, page)
   - Contact email: hello@eqpqiq.com (Google Workspace)
   - Removed performance-budget GitHub Actions workflow (relying on Vercel for builds)

4. **Warning Noise Cleanup Pass (February 2026)**
   - Targeted cleanup of top-noise files so future errors are easier to spot.
   - **lib/types/modules.ts:** `any` → `unknown` / typed helpers; `SessionMetrics` index signature tightened.
   - **lib/archetypes/evolution-manager.ts:** Typed relation helpers and DB row types; no `as any`.
   - **ConversationInterface.tsx:** V1 vignette type, hook deps fixed, explicit-any removed.
   - **ModuleGuard.tsx:** useMemo deps corrected.
   - **truths/scores/page.tsx:** API row types and typed update payloads.
   - **Compatibility:** difficult-conversations detail page and CaseInterface updated for stricter module types.
   - Build/Vercel: Supabase env vars must be set for `npm run build` and Vercel deploys (see SETUP.md / CHANGELOG).

5. **ESLint Technical Debt Cleanup (January 2026)**
   - Comprehensive cleanup of ~300 ESLint warnings across 64 files
   - See detailed report below in "Technical Debt Cleanup Report" section

6. **Pulse Check Frequency & Trends Enhancement**
   - Add Settings tab to Admin panel for frequency config (quarterly/biannually/annually)
   - Create Sparkline component with smooth bezier curves for trend visualization
   - Add accordion details in Medical Director providers view with EQ/PQ/IQ breakdown
   - Make provider header sticky on rating page
   - Move operational metrics (LOS, Imaging, PPH) above EQ section
   - Add historical seed data (Q2-Q4 2025) for Metro General providers
   - Add Provider Profile Modal with history tab
   - Database migrations for frequency fields and operational metrics
7. Update README with EQ·PQ·IQ product documentation
8. Remove lev8.ai references from Pulse Check
9. Fix Interview module - favicon, title, footer, API env var
10. Update Supabase service key env var naming
11. Add demo role tiles to Interview landing page with visitor tracking
12. Allow /pulsecheck routes on eqpqiq.com domain
13. Fix invalid focusRing CSS property
14. Add eqpqiq.com email support, apply rating colors
15. Enhance interview tool: navigation, stats, normalization

## Development Commands

```bash
npm run dev              # Start dev server (--turbopack)
npm run build            # Production build
npm run lint             # Run ESLint
npm run audit:routes     # Audit API route architecture
npm run audit:auth       # Check authentication patterns
npm run audit:bundle     # Analyze bundle size
npm run audit:all        # Run all architecture audits
```

## Cron Jobs (vercel.json)

| Schedule | Endpoint | Description |
|----------|----------|-------------|
| `0 11 * * *` (6 AM EST) | `/api/cron/daily-backup` | Dumps 13 tables to CSV, emails via Resend |
| `0 14 * * 1` (9 AM EST Mon) | `/api/cron/survey-reminders` | Sends reminders for incomplete surveys |

Both cron endpoints require `Authorization: Bearer <CRON_SECRET>` header (Vercel sends this automatically).

## Required Environment Variables (Vercel)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |
| `ANTHROPIC_API_KEY` | Claude AI conversations |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini AI alternative |
| `OPENAI_API_KEY` | Whisper transcription |
| `RESEND_API_KEY` | Transactional emails |
| `CRON_SECRET` | Auth token for cron endpoints |
| `BACKUP_EMAIL` | Daily backup recipient (default: findme@alfadiallo.com) |
| `NEXT_PUBLIC_APP_URL` | Primary app URL |
| `SUPABASE_JWT_SECRET` | JWT verification |
| `ELEVENLABS_API_KEY` | Voice synthesis |
| `FROM_EMAIL` | Default sender email |

## Data Status (March 2026)

- 50 residents across 4 classes (2024-2028) + Class of 2026 demo residents
- 13 faculty members + demo faculty accounts
- 5,860 MedHub evaluation comments imported
- 319 EQ+PQ+IQ ratings (267 faculty + 52 self-assessments)
- 66 period scores aggregated
- Progress Check demo accounts (PD, Faculty, Resident)
- 270 EPI Quotient demo profiles (23 MS3, 35 MS4, 45 PGY 1-3, 75 active graduates across 5 classes of 15, 92 archived graduates)
- 9 trajectory archetypes with seeded classification

## Role-Based Access Control

| Role | Description |
|------|-------------|
| Admin | Full system access |
| Program Director | Program-level management |
| Faculty | Evaluation and teaching features |
| Resident | Learning and self-assessment |
| Super Admin | Cross-organization access |
| Studio Creator | Content creation |

## Authentication & Security

- Supabase Auth with JWT tokens
- 2FA via TOTP (Time-based One-Time Password)
- Trusted device management
- Row-Level Security on all sensitive tables
- Security headers in Next.js config

## Key Documentation

- `docs/SETUP.md` - Complete setup instructions
- `docs/CURRENT-STATE-SUMMARY.md` - System overview and statistics
- `docs/ANALYTICS.md` - Analytics engine architecture
- `docs/LEARN-MODULES.md` - Learn module (Clinical Cases, Difficult Conversations, EKG & ACLS, Running the Board)
- `docs/EQ-PQ-IQ.md` - Evaluation framework definition
- `docs/prd.md` - Product requirements document
- `docs/claude.md` - Development guidelines
- `docs/PRD-PROGRESS-CHECK.md` - Progress Check product requirements
- `docs/PRD-INTERVIEW.md` - Interview Assessment product requirements
- `docs/PRD-PULSECHECK.md` - Pulse Check product requirements
- `docs/PRD-EPIQUOTIENT.md` - EPI Quotient product requirements
- `docs/OPS-SURVEY-RUNBOOK.md` - Survey operations runbook
- `docs/site-map-eqpqiq.md` - EQ·PQ·IQ site map and routing

---

## Technical Debt Cleanup Report (January 2026)

### Overview

A comprehensive ESLint technical debt cleanup was performed to improve code quality, type safety, and maintainability. The cleanup addressed ~300 warnings across 64 files, reducing deployment friction and improving developer experience.

### Categories of Technical Debt Addressed

#### 1. Unused Variables and Imports (~150 warnings)

**Problem:** Dead code cluttering the codebase, including unused imports, variables, and function parameters.

**Solution:**
- Removed unused imports (e.g., `Clock`, `Filter`, `User`, `Mail` from lucide-react)
- Prefixed intentionally unused variables with `_` (e.g., `_router`, `_error`)
- Removed completely dead code where appropriate

**Files affected:** Most files across `app/`, `components/`, `lib/`

#### 2. Explicit `any` Types (~100 warnings)

**Problem:** Loose typing with `any` bypassing TypeScript's type checking, hiding potential bugs.

**Solution:**
- Replaced `any` with proper interfaces and types
- Used `unknown` with type guards where specific types weren't feasible
- Added explicit type assertions for Supabase query results
- Created inline type definitions for complex nested objects

**Key patterns fixed:**
```typescript
// Before
const data = response as any;

// After
interface ResponseData {
  id: string;
  user_profiles?: { full_name?: string } | null;
  classes?: { graduation_year?: number } | null;
}
const data = response as ResponseData;
```

**Complex fixes:**
- `lib/archetypes/classifier.ts` - Supabase relations returning arrays vs objects
- `app/api/conversations/chat/route.ts` - Claude API content blocks with ThinkingBlock type
- `lib/conversations/v2/PhaseManager.ts` - Dynamic context object property access

#### 3. React Hook Dependencies (~25 warnings)

**Problem:** Missing dependencies in `useEffect`, `useMemo`, `useCallback` causing stale closures or unnecessary re-renders.

**Solution:**
- Added missing dependencies where safe
- Used `// eslint-disable-next-line react-hooks/exhaustive-deps` with comments where intentional
- Refactored some hooks to avoid dependency issues

**Files affected:**
- `app/(dashboard)/forms/self-assessment/page.tsx`
- `app/(dashboard)/modules/learn/clinical-cases/[id]/page.tsx`
- `app/(dashboard)/modules/understand/[sessionId]/page.tsx`
- `components/analytics/AttributeTimelineChartD3.tsx`
- `components/modules/ModuleGuard.tsx`

#### 4. TypeScript Strict Mode Compliance (~30 errors)

**Problem:** Build failures due to stricter TypeScript checking revealing type mismatches.

**Fixes applied:**

| File | Issue | Solution |
|------|-------|----------|
| `self-assessment/page.tsx` | `Property 'id' does not exist on type 'FormData'` | Created `ExistingAssessment` interface extending `FormData` |
| `difficult-conversations/page.tsx` | `Cannot find name 'supabase'` | Added missing import for `supabaseClient` |
| `understand/class/page.tsx` | Supabase `!inner` join type mismatch | Cast `r.classes` through `unknown` to correct type |
| `CreateSessionModal.tsx` | `Cannot assign to 'residentData'` | Changed `const` to `let` for reassigned variable |
| `settings/account/page.tsx` | `Type '{}' not assignable to 'string'` | Used `String()` conversion for user properties |
| `truths/scores/page.tsx` | `Object is possibly 'undefined'` | Added non-null assertions for Map values |
| `api/conversations/chat/route.ts` | `ThinkingBlock` missing `text` property | Type assertion for content block filtering |
| `api/conversations/v2/chat/route.ts` | `VignetteV2` type construction | Used `Partial<VignetteV2>` with final cast |
| `RadarChart.tsx` | `textAnchor` type mismatch | Typed `CustomTick` props as `any` with eslint-disable |
| `CaseInterface.tsx` | `textarea` value type error | `String()` cast for dynamic answers |
| `ClaudeProvider.ts` | `ContentBlock` type filtering | Type assertion in map callback |
| `PhaseManager.ts` | Context property access on `{}` | Explicit `Number()` and array type assertions |

#### 5. ESLint Configuration Optimization

**Problem:** Thousands of irrelevant warnings from `docs/` directory (archived codebases).

**Solution:** Updated `eslint.config.mjs` to ignore documentation:
```javascript
ignores: [
  "node_modules/**",
  ".next/**",
  "out/**",
  "build/**",
  "next-env.d.ts",
  "docs/**",  // Added - archived codebases
],
```

#### 6. Script File Patterns (~5 warnings)

**Problem:** `@typescript-eslint/no-require-imports` errors in Node.js scripts.

**Solution:** Added eslint-disable comments for legitimate `require()` calls:
```typescript
// eslint-disable-next-line @typescript-eslint/no-require-imports
const stats = await require('fs').promises.stat(file);
```

**Files:** `scripts/architecture-health/*.ts`

#### 7. Minor Code Quality Issues (~10 warnings)

- **`prefer-const`:** Changed `let` to `const` where variables were never reassigned
- **Variable naming:** Corrected `useState` destructuring where setters were incorrectly prefixed with `_`

### Execution Approach

1. **Phase 1: Auto-fix** - Ran `npm run lint -- --fix` for mechanical fixes (`prefer-const`)
2. **Phase 2: Unused code** - Systematically removed/prefixed unused variables across all directories
3. **Phase 3: Type improvements** - Replaced `any` with proper types, starting with API routes
4. **Phase 4: Hook dependencies** - Reviewed each warning, added deps or disabled with comments
5. **Phase 5: Build verification** - Ran `npm run build` iteratively to catch TypeScript errors
6. **Phase 6: Final cleanup** - Addressed remaining warnings and configuration

### Files Modified (64 total)

**App Pages (12):**
- `dashboard/page.tsx`, `self-assessment/page.tsx`, `clinical-cases/[id]/page.tsx`
- `difficult-conversations/[id]/page.tsx`, `difficult-conversations/page.tsx`
- `running-board/simulation/[sessionId]/page.tsx`, `debrief/page.tsx`
- `CreateSessionModal.tsx`, `class/page.tsx`, `account/page.tsx`
- `program/page.tsx`, `truths/scores/page.tsx`

**API Routes (12):**
- `acls/sessions/route.ts`, `admin/setup-test-user/route.ts`
- `analytics/scores/class/[year]/route.ts`, `analytics/scores/program/route.ts`
- `conversations/chat/route.ts`, `conversations/sessions/route.ts`
- `conversations/v2/chat/route.ts`, `forms/structured-rating/route.ts`
- `pulsecheck/providers/route.ts`, `residents/route.ts`
- `studio/content/route.ts`, `truths/scores/route.ts`

**Components (14):**
- `AttributeTimelineChart.tsx`, `AttributeTimelineChartD3.tsx`
- `HistoricalComparison.tsx`, `RadarChart.tsx`, `SWOTEvidenceModal.tsx`
- `SWOTTab.tsx`, `ITEAnalyticsPane.tsx`, `TrajectoryChart.tsx`
- `RequirementDetailModal.tsx`, `EQPQIQForm.tsx`, `RatingSlider.tsx`
- `InterviewDashboard.tsx`, `TenantSidebar.tsx`, `ModuleGuard.tsx`
- `CaseInterface.tsx`

**Library (14):**
- `archetypes/classifier.ts`
- `conversations/v2/EmotionalStateTracker.ts`, `PatternMatcher.ts`
- `conversations/v2/PhaseManager.ts`, `PromptBuilder.ts`
- `conversations/v2/modelProviders/ClaudeProvider.ts`, `GeminiProvider.ts`, `index.ts`
- `conversations/v2/__tests__/PhaseManager.test.ts`
- `interview/permissions.ts`, `modules/analytics.ts`, `modules/sessionStorage.ts`
- `sim/hooks/useSim.ts`, `truths/storage.ts`

**Other (12):**
- `middleware.ts`, `eslint.config.mjs`
- `scripts/architecture-health/*.ts` (5 files)
- `app/[org]/[dept]/dashboard/page.tsx`
- `app/debug/ClientDebug.tsx`
- `app/pulsecheck/admin/page.tsx`, `reports/page.tsx`

### Results

| Metric | Before | After |
|--------|--------|-------|
| ESLint warnings | ~300 | ~45 (remaining are intentional) |
| Build errors | Multiple | 0 |
| Files modified | - | 64 |
| Lines changed | - | ~330 |

### Remaining Warnings (Intentional)

~45 warnings remain, primarily:
- `@typescript-eslint/no-explicit-any` in complex third-party integrations
- `react-hooks/exhaustive-deps` where dependencies are intentionally omitted
- Some unused variables in Pulse Check reports page (future features)

These are acceptable technical debt with documented reasons.

### Warning Noise Cleanup Pass (February 2026)

A follow-up pass targeted the **top-noise files** so build/lint output is easier to read and real errors stand out:

| File | Changes |
|------|--------|
| `lib/types/modules.ts` | `Record<string, any>` → `Record<string, unknown>`, `any[]` → `unknown[]`, `SessionMetrics` index `[key: string]: unknown` |
| `lib/archetypes/evolution-manager.ts` | Typed helpers for Supabase join results (`getResidentFullName`, `getGraduationYear`, `getClassificationArchetypeId`), `VariableCaseRow` / `MethodologyVersionRow`, removed `as any` |
| `components/modules/difficult-conversations/ConversationInterface.tsx` | `V1VignetteData` type, `as unknown as VignetteV2`, effect/useMemo deps, `_user` for unused |
| `components/modules/ModuleGuard.tsx` | useMemo deps `[hasModuleAccess, availableToRoles, userRole]`, eslint-disable only where needed |
| `app/(dashboard)/truths/scores/page.tsx` | `ApiResidentRow`, `ApiIteRow`, `ApiExamRow`, typed `getEditValue` and ITE `updateData` |
| `app/(dashboard)/modules/learn/difficult-conversations/[id]/page.tsx` | Typed `vignette_data` access for v1/v2 and avatar/clinical data |
| `components/modules/clinical-cases/CaseInterface.tsx` | Typed `case_data` shape for `steps` / `questions` |

**Build requirement:** Supabase env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`) must be set for `npm run build` and Vercel; see SETUP.md and CHANGELOG.
