# Elevate - Medical Education Platform

A comprehensive medical education platform for Emergency Medicine residency programs, featuring AI-powered learning modules, voice journaling, and advanced analytics.

## Product Suite

This repository contains two product lines:

### 🏥 Elevate Platform (lev8.ai)
Medical residency education platform with learning modules, voice journaling, and analytics.

### 📋 EQ·PQ·IQ Products (eqpqiq.com)
Standalone evaluation tools using the EQ·PQ·IQ framework:
- **Interview Assessment Tool** - Candidate evaluation for residency interviews
- **Pulse Check** - Provider performance evaluation for healthsystems

---

## Elevate Platform Overview

**Elevate** is a production-ready platform with three core modules:

### 🎓 Learn Module
- **Difficult Conversations:** AI-powered conversation practice with MED-001 vignette
- **Clinical Cases:** Emergency Medicine case library
- **ACLS Simulations:** Interactive EKG and protocol training
- **Running Board:** Multi-patient management scenarios

### 🌱 Grow Module
- **Voice Journal:** Private reflection with AI transcription (Whisper) and summarization (Claude)
- Secure, resident-only access with RLS policies

### 📊 Understand Module (Analytics Engine)
- **SWOT Analysis:** AI-generated insights from faculty evaluations (Claude API)
- **EQ+PQ+IQ Dashboard:** 15-point radar charts with faculty vs self-assessment
- **ITE Score Tracking:** Historical performance trends
- **Period Scores:** Longitudinal competency tracking across PGY levels

## Current Status

✅ **All Modules Operational** (January 2026)
- 50 residents, 13 faculty members
- 5,860 MedHub evaluation comments imported
- 319 EQ+PQ+IQ ratings (267 faculty + 52 self-assessments)
- AI SWOT analysis with supporting citations
- Complete analytics dashboard with real-time data

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts
- **Backend:** Supabase (PostgreSQL + Auth + Storage), Next.js API Routes
- **AI Services:** 
  - OpenAI Whisper API (voice transcription)
  - Anthropic Claude API (summarization, SWOT analysis, conversations)
- **Authentication:** Supabase Auth with role-based access control (RBAC)
- **Deployment:** Vercel (frontend) + Supabase Cloud (database)

## Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- OpenAI API key (for Whisper transcription)
- Anthropic API key (for Claude)

### Installation

```bash
# Clone and install
git clone <repository-url>
cd lev8
npm install

# Configure environment
cp .env.example .env.local
# Add your API keys to .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the platform.

### First-Time Setup

For complete setup instructions including database migrations and data import:
- **[Getting Started Guide](docs/guides/GETTING-STARTED.md)** - New developer onboarding
- **[Database Setup](docs/guides/DATABASE-SETUP.md)** - Schema and migrations
- **[Data Import Guide](docs/guides/DATA-IMPORT.md)** - Import residents, faculty, and ratings
- **[Setup Documentation](docs/SETUP.md)** - Comprehensive setup reference

## Project Structure

```
app/
├── (auth)/                    # Authentication pages
├── (dashboard)/               # Protected dashboard
│   ├── modules/
│   │   ├── learn/            # Clinical cases, conversations, ACLS
│   │   ├── reflect/          # Voice journal
│   │   └── understand/       # Analytics dashboard
│   └── settings/             # User settings
├── eqpqiq-landing/          # EQ·PQ·IQ brand landing page (eqpqiq.com root)
├── api/                      # API routes
│   ├── analytics/           # SWOT, scores, ITE endpoints
│   ├── voice-journal/       # Voice upload and processing
│   ├── conversations/       # AI conversation engine
│   └── clinical-cases/      # Case management
└── layout.tsx               # Root layout

components/
├── modules/
│   ├── understand/          # Analytics components (SWOT, radar charts)
│   ├── clinical-cases/      # Case interface
│   └── difficult-conversations/  # Conversation UI
└── forms/                   # EQ+PQ+IQ rating forms

lib/
├── ai/                      # Claude API integration
├── analytics/               # Name matching, data processing
├── permissions/             # RBAC utilities
└── supabase.ts             # Database client

scripts/
├── migrations/              # Database setup scripts
├── archive/                 # Historical/diagnostic scripts
└── [production scripts]     # Data import and processing
```

## Key Features

### ✅ Learn Module
- **Difficult Conversations:** AI-powered practice with emotional state tracking and real-time assessment
- **Clinical Cases:** 8 Emergency Medicine cases with interactive learning
- **ACLS Simulations:** EKG interpretation and protocol training
- **Running Board:** Multi-patient management scenarios

### ✅ Grow Module
- **Voice Journal:** Private reflection with AI transcription and summarization
- **Secure Storage:** Resident-only access with Row Level Security
- **AI Processing:** Automatic transcription (Whisper) and summarization (Claude)

### ✅ Understand Module (Analytics Engine)
- **AI SWOT Analysis:** Brutally honest insights from faculty evaluations with supporting citations
- **EQ+PQ+IQ Dashboard:** 
  - 15-point radar charts (5 attributes × 3 pillars)
  - Faculty vs Self-assessment comparison
  - Color-coded visual grouping (EQ: Pink, PQ: Teal, IQ: Green)
  - Gap analysis and trend tracking
- **ITE Score Tracking:** Historical performance with percentile rankings
- **Period Scores:** Longitudinal tracking across PGY-1 through PGY-4
- **Data Integration:**
  - 5,860 MedHub evaluation comments
  - 319 structured EQ+PQ+IQ ratings
  - Automated aggregation and analysis

### ✅ Platform Features
- **Role-Based Access Control:** Resident, Faculty, Program Director, Super Admin
- **Authentication:** Secure login with Supabase Auth
- **Database:** PostgreSQL with comprehensive RLS policies
- **Global Content:** Institution-specific and shared content patterns

## Documentation

### 📚 Getting Started
- **[Getting Started Guide](docs/guides/GETTING-STARTED.md)** - New developer onboarding
- **[Database Setup](docs/guides/DATABASE-SETUP.md)** - Schema migrations and setup
- **[Data Import Guide](docs/guides/DATA-IMPORT.md)** - Import residents, faculty, evaluations
- **[Dashboard Usage](docs/guides/DASHBOARD-USAGE.md)** - Using the analytics dashboard

### 📖 Core Documentation
- **[Setup Guide](docs/SETUP.md)** - Comprehensive setup instructions
- **[Analytics Engine](docs/ANALYTICS.md)** - SWOT analysis, EQ+PQ+IQ, radar charts
- **[EQ+PQ+IQ System](docs/EQ-PQ-IQ.md)** - Evaluation framework and forms
- **[Current State Summary](docs/CURRENT-STATE-SUMMARY.md)** - System overview and statistics

### 🔧 Technical Reference
- **[Planning Document](docs/planning.md)** - Architecture and implementation strategy
- **[Product Requirements](docs/prd.md)** - Feature specifications
- **[Privacy Framework](docs/PRIVACY-FRAMEWORK-ANALYSIS.md)** - Security and compliance
- **[Scripts Documentation](scripts/README.md)** - Data import and processing scripts

### 📂 Additional Resources
- **[Documentation Index](docs/README.md)** - Complete documentation catalog
- **[Historical Documentation](docs/archive/)** - Archived setup guides and bug fixes

## Recent Updates

### February 2026: EQ·PQ·IQ Brand Landing Page ✅
**Comprehensive landing page at eqpqiq.com root**
- ✅ Philosophy, use cases, AI analytics, archetyping, longitudinal value sections
- ✅ Middleware rewrite serves /eqpqiq-landing at eqpqiq.com/
- ✅ Contact email: hello@eqpqiq.com (Google Workspace)

### January 2026: EQ·PQ·IQ Products Launch ✅
**New standalone products on eqpqiq.com**

**Interview Assessment Tool:**
- ✅ Candidate evaluation for residency interviews
- ✅ Program Director and Faculty role views
- ✅ Score normalization across interviewers
- ✅ Season-wide rank list with analytics

**Pulse Check:**
- ✅ Provider performance evaluation for healthsystems
- ✅ Hierarchical structure (Healthsystem → Sites → Departments)
- ✅ Regional Medical Director, Medical Director, Executive Assistant roles
- ✅ Voice memo recording with transcription
- ✅ Email reminders and reporting

### January 2025: Analytics Engine Complete ✅
**All three Elevate modules operational**

**Analytics Engine (Understand Module):**
- ✅ AI SWOT Analysis with Claude API integration
- ✅ EQ+PQ+IQ evaluation system with 15-point radar charts
- ✅ 5,860 MedHub comments imported and analyzed
- ✅ 319 structured ratings (267 faculty + 52 self-assessments)
- ✅ ITE score tracking with historical trends
- ✅ Period score aggregation across PGY levels
- ✅ Supporting citations for all SWOT analyses
- ✅ Gap analysis (faculty vs self-assessment)

See **[docs/ANALYTICS.md](docs/ANALYTICS.md)** for complete details.

---

## EQ·PQ·IQ Products (eqpqiq.com)

Standalone evaluation tools built on the EQ·PQ·IQ framework for assessing Emotional, Professional, and Intellectual qualities.

### 📋 Interview Assessment Tool
**URL:** `eqpqiq.com/interview`

Candidate evaluation system for residency program interviews:
- **Program Director View:** All candidates, analytics, rank list, interviewer stats
- **Faculty View:** Rate candidates, view own ratings
- **Score Normalization:** Compare raw vs normalized scores across interviewers
- **Season Analytics:** Aggregated candidate rankings across interview dates

### 💜 Pulse Check
**URL:** `eqpqiq.com/pulsecheck`

Provider performance evaluation for healthsystems:
- **Regional Medical Director:** Healthsystem-wide analytics & reports across sites
- **Medical Director:** Rate providers, manage team, view department analytics
- **Executive Assistant:** Manage users, import data, administrative support
- **Hierarchical Structure:** Healthsystem → Sites → Departments → Providers

**Features:**
- EQ·PQ·IQ rating scales (1-5) for 15 attributes
- Provider type support (Physician/APC)
- Voice memo recording with transcription
- Email reminders and summary reports
- CSV export for reporting

### Demo Access
Both products include demo modes with pre-populated data:
- **Interview:** `eqpqiq.com/interview` - Select Program Director or Core Faculty
- **Pulse Check:** `eqpqiq.com/pulsecheck` - Select Regional Medical Director, Medical Director, or Executive Assistant

---

## Development Notes

### Database Schema
**Core Tables:**
- `health_systems`, `programs`, `academic_classes` - Institutional hierarchy
- `user_profiles`, `residents`, `faculty` - User management
- `modules`, `module_buckets`, `clinical_cases`, `vignettes` - Learning content

**Analytics Tables:**
- `imported_comments`, `structured_ratings` - Evaluation data
- `period_scores`, `swot_summaries` - Aggregated analytics
- `ite_scores`, `rosh_completion_snapshots` - Performance tracking

**Voice Journal:**
- `grow_voice_journal` - Private entries with RLS policies

### Key Patterns
- **Next.js App Router:** Route groups for organization, `route.ts` for API endpoints
- **TypeScript Strict Mode:** Full type safety across the codebase
- **Row Level Security:** All tables protected with Supabase RLS policies
- **Role-Based Access:** Resident, Faculty, Program Director, Super Admin roles
- **AI Integration:** Claude for analysis, Whisper for transcription

## Troubleshooting

### Common Issues

**Analytics Dashboard Not Loading:**
- Verify database migrations are complete: `scripts/migrations/`
- Check that data has been imported: `scripts/aggregate-period-scores.sql`
- Ensure API endpoints are accessible: `/api/analytics/`

**Voice Journal Upload Failing:**
- Verify Supabase storage bucket `voice_journal` exists
- Check OpenAI API key in `.env.local`
- Confirm user authentication is valid

**Build/Cache Issues:**
```bash
# Clear Next.js cache and rebuild
rm -rf .next
npm run dev

# Check server status
lsof -ti:3000

# Kill process if needed
kill -9 $(lsof -ti:3000)
```

**Database Issues:**
- Run verification: `scripts/migrations/01-quick-check.sql`
- Check RLS policies are enabled
- Verify user roles are set correctly

## Contributing

### Code Standards
1. **TypeScript Strict Mode:** All code must pass strict type checking
2. **Logging:** Use `console.log('[ComponentName]', ...)` for debugging
3. **API Routes:** Must be in `route.ts` files (Next.js 14 App Router)
4. **Database:** Always use RLS policies, never bypass with service key in client code
5. **Testing:** Test end-to-end flows before committing

### Development Workflow
1. Create feature branch from `main`
2. Implement changes with proper TypeScript types
3. Test locally with real data
4. Update documentation if needed
5. Submit PR with clear description

## License

Proprietary software for Elevate Medical Education Platform.

---

**Status:** Production-ready platform with all modules operational (January 2026)

**Live Sites:**
- **Elevate Platform:** [www.lev8.ai](https://www.lev8.ai)
- **EQ·PQ·IQ Products:** [www.eqpqiq.com](https://www.eqpqiq.com)

**Documentation:** [docs/README.md](docs/README.md)
