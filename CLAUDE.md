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
1. **Pulse Check Frequency & Trends Enhancement**
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
