# CLAUDE.md - Lev8 (Elevate)

## Project Overview

**Elevate (Lev8)** is a medical residency education platform for Memorial Hospital West Emergency Medicine Residency Program. It includes three main product suites: the Elevate learning platform, Interview Assessment Tool, and Pulse Check provider evaluations.

- **Main Platform:** www.lev8.ai
- **EQ·PQ·IQ Products:** www.eqpqiq.com
- **Repository:** https://github.com/alfadiallo/lev8
- **Status:** Production (January 2026)
- **API Routes:** 187 endpoints

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
├─────────────────────────────┬───────────────────────────────┤
│    INTERVIEW ASSESSMENT     │         PULSE CHECK           │
│ • Candidate evaluation      │ • Provider performance eval   │
│ • Score normalization       │ • Healthsystem hierarchy      │
│ • Season-wide rank lists    │ • Voice memo transcription    │
└─────────────────────────────┴───────────────────────────────┘
```

### Multi-Tenant Routing

- Dynamic routing via `[org]/[dept]` URL parameters
- Middleware handles tenant context initialization
- Domain-based routing for subdomains (studio., eqpqiq.com)

## Directory Structure

```
lev8/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   ├── (dashboard)/              # Protected dashboard routes
│   ├── api/                      # 187 API endpoints (28 route groups)
│   ├── admin/                    # Admin dashboard
│   ├── interview/                # Interview tool pages
│   ├── pulsecheck/               # Pulse Check pages
│   └── studio/                   # Content creator studio
├── components/                   # React components (~17 subdirectories)
│   ├── modules/                  # Learn module UIs
│   ├── analytics/                # SWOT, ITE, radar charts
│   ├── forms/                    # EQ+PQ+IQ rating forms
│   ├── pulsecheck/               # Sparkline, ProviderProfileModal, RatingSliders
│   └── ui/                       # Shadcn/ui components
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

## Recent Changes

From git history:
1. **ESLint Technical Debt Cleanup (January 2026)**
   - Comprehensive cleanup of ~300 ESLint warnings across 64 files
   - See detailed report below in "Technical Debt Cleanup Report" section

2. **Pulse Check Frequency & Trends Enhancement**
   - Add Settings tab to Admin panel for frequency config (quarterly/biannually/annually)
   - Create Sparkline component with smooth bezier curves for trend visualization
   - Add accordion details in Medical Director providers view with EQ/PQ/IQ breakdown
   - Make provider header sticky on rating page
   - Move operational metrics (LOS, Imaging, PPH) above EQ section
   - Add historical seed data (Q2-Q4 2025) for Metro General providers
   - Add Provider Profile Modal with history tab
   - Database migrations for frequency fields and operational metrics
2. Update README with EQ·PQ·IQ product documentation
3. Remove lev8.ai references from Pulse Check
4. Fix Interview module - favicon, title, footer, API env var
5. Update Supabase service key env var naming
6. Add demo role tiles to Interview landing page with visitor tracking
7. Allow /pulsecheck routes on eqpqiq.com domain
8. Fix invalid focusRing CSS property
9. Add eqpqiq.com email support, apply rating colors
10. Enhance interview tool: navigation, stats, normalization

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

## Data Status (January 2026)

- 50 residents across 4 classes (2024-2028)
- 13 faculty members
- 5,860 MedHub evaluation comments imported
- 319 EQ+PQ+IQ ratings (267 faculty + 52 self-assessments)
- 66 period scores aggregated

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
- `docs/EQ-PQ-IQ.md` - Evaluation framework definition
- `docs/prd.md` - Product requirements document
- `docs/claude.md` - Development guidelines

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
