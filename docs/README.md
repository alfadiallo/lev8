# Lev8 Documentation Index

**Complete guide to all Lev8 platform documentation**

**Last Updated:** January 22, 2025

---

## 📚 Quick Start

New to Lev8? Start here:

1. **[Getting Started Guide](guides/GETTING-STARTED.md)** - Developer onboarding and local setup
2. **[Database Setup](guides/DATABASE-SETUP.md)** - Set up the complete database schema
3. **[Data Import Guide](guides/DATA-IMPORT.md)** - Import residents, faculty, and evaluations
4. **[Dashboard Usage](guides/DASHBOARD-USAGE.md)** - Using the analytics dashboard

---

## 📖 Core Documentation

### Setup and Configuration

| Document | Description | Audience |
|----------|-------------|----------|
| **[SETUP.md](SETUP.md)** | Comprehensive setup guide for the entire platform | Developers, Admins |
| **[CURRENT-STATE-SUMMARY.md](CURRENT-STATE-SUMMARY.md)** | System overview, statistics, and current capabilities | All |
| **[planning.md](planning.md)** | Architecture and implementation strategy | Developers |
| **[tasks.md](tasks.md)** | Implementation roadmap and task tracking | Developers |

### Feature Documentation

| Document | Description | Audience |
|----------|-------------|----------|
| **[ANALYTICS.md](ANALYTICS.md)** | Complete analytics engine documentation | Developers, Program Directors |
| **[EQ-PQ-IQ.md](EQ-PQ-IQ.md)** | Evaluation framework and form system | Faculty, Program Directors |
| **[PRIVACY-FRAMEWORK-ANALYSIS.md](PRIVACY-FRAMEWORK-ANALYSIS.md)** | Security and compliance documentation | Admins, Compliance |
| **[ROSH-COMPLETION-TRACKING.md](ROSH-COMPLETION-TRACKING.md)** | ROSH completion tracking specification | Program Directors |

### Design and Requirements

| Document | Description | Audience |
|----------|-------------|----------|
| **[prd.md](prd.md)** | Product requirements document | Product, Developers |
| **[design.md](design.md)** | Design specifications and patterns | Designers, Developers |
| **[GLOBAL-VIGNETTES-DESIGN.md](GLOBAL-VIGNETTES-DESIGN.md)** | Vignette architecture documentation | Developers |
| **[SEED-CLINICAL-CASES.md](SEED-CLINICAL-CASES.md)** | Clinical cases data reference | Content Creators |

### AI Integration

| Document | Description | Audience |
|----------|-------------|----------|
| **[claude.md](claude.md)** | Claude AI integration notes | Developers |
| **[AI-SWOT-ANALYSIS-SETUP.md](AI-SWOT-ANALYSIS-SETUP.md)** | AI SWOT analysis technical setup | Developers |

---

## 🎓 User Guides

### For Developers

| Guide | Description | Time to Complete |
|-------|-------------|------------------|
| **[Getting Started](guides/GETTING-STARTED.md)** | Local development setup | 30 minutes |
| **[Database Setup](guides/DATABASE-SETUP.md)** | Database schema and migrations | 1 hour |
| **[Data Import](guides/DATA-IMPORT.md)** | Importing all data types | 2 hours |

### For End Users

| Guide | Description | Audience |
|-------|-------------|----------|
| **[Dashboard Usage](guides/DASHBOARD-USAGE.md)** | Using the analytics dashboard | Program Directors, Faculty, Residents |

---

## 🗂️ Documentation by Module

### Learn Module
- Difficult Conversations with AI
- Clinical Cases
- ACLS Simulations
- Running Board

**Documentation:**
- [GLOBAL-VIGNETTES-DESIGN.md](GLOBAL-VIGNETTES-DESIGN.md)
- [SEED-CLINICAL-CASES.md](SEED-CLINICAL-CASES.md)

---

### Grow Module
- Voice Journal with AI transcription and summarization

**Documentation:**
- [SETUP.md](SETUP.md) - Voice journal setup section
- [CURRENT-STATE-SUMMARY.md](CURRENT-STATE-SUMMARY.md) - Voice journal schema

---

### Understand Module (Analytics Engine)
- AI-Powered SWOT Analysis
- EQ+PQ+IQ Tracking with 15-point radar charts
- ITE Score Trends
- Period Scores and Gap Analysis

**Documentation:**
- [ANALYTICS.md](ANALYTICS.md) - Complete analytics documentation
- [EQ-PQ-IQ.md](EQ-PQ-IQ.md) - Evaluation framework
- [AI-SWOT-ANALYSIS-SETUP.md](AI-SWOT-ANALYSIS-SETUP.md) - AI integration
- [guides/DASHBOARD-USAGE.md](guides/DASHBOARD-USAGE.md) - User guide

---

## 🔧 Technical Reference

### Database

**Schema Documentation:**
- [CURRENT-STATE-SUMMARY.md](CURRENT-STATE-SUMMARY.md) - Complete schema reference
- [guides/DATABASE-SETUP.md](guides/DATABASE-SETUP.md) - Setup instructions

**Key Tables:**
- **Core:** health_systems, programs, residents, faculty
- **Analytics:** imported_comments, structured_ratings, period_scores, swot_summaries, ite_scores
- **Learning:** modules, vignettes, clinical_cases, training_sessions
- **Voice Journal:** grow_voice_journal

---

### API Endpoints

**Analytics Endpoints:**
- `/api/analytics/swot/resident/[id]` - SWOT analysis
- `/api/analytics/scores/resident/[id]` - EQ+PQ+IQ scores
- `/api/analytics/ite/resident/[id]` - ITE score history

**Documentation:** [ANALYTICS.md](ANALYTICS.md#api-endpoints)

---

### AI Integration

**Claude API:**
- SWOT analysis generation
- Conversation AI
- Text summarization

**OpenAI API:**
- Whisper voice transcription

**Documentation:**
- [AI-SWOT-ANALYSIS-SETUP.md](AI-SWOT-ANALYSIS-SETUP.md)
- [claude.md](claude.md)

---

## 📦 Scripts Reference

### Production Scripts (Active Use)

Located in `scripts/`:

| Script | Purpose | Usage |
|--------|---------|-------|
| `import-memorial-residents.sql` | Import 50 residents | Supabase SQL Editor |
| `seed-faculty-simple.sql` | Import 13 faculty | Supabase SQL Editor |
| `import-faculty-assessments.ts` | Import faculty EQ+PQ+IQ ratings | `npx tsx scripts/...` |
| `import-self-assessments.ts` | Import resident self-assessments | `npx tsx scripts/...` |
| `import-ite-scores.sql` | Import ITE exam scores | Supabase SQL Editor |
| `aggregate-period-scores.sql` | Aggregate ratings into period scores | Supabase SQL Editor |
| `process-medhub-staging.sql` | Process MedHub CSV uploads | Supabase SQL Editor |
| `seed-clinical-cases.sql` | Import clinical cases | Supabase SQL Editor |
| `analyze-larissa-comments.ts` | AI SWOT analysis (template) | `node -r dotenv/config scripts/...` |

**Documentation:** [guides/DATA-IMPORT.md](guides/DATA-IMPORT.md)

---

### Migration Scripts

Located in `scripts/migrations/`:

| Script | Purpose | Order |
|--------|---------|-------|
| `01-quick-check.sql` | Verify database state | Anytime |
| `02-setup-base-schema.sql` | Create core tables | 1st |
| `03-setup-rls-policies.sql` | Set up security | 2nd |
| `04-seed-initial-data.sql` | Seed initial data | 3rd |
| `create-medhub-staging-table.sql` | Create staging table | Before MedHub import |
| `seed-analytics-config.sql` | Seed analytics config | After analytics migration |

**Documentation:** [guides/DATABASE-SETUP.md](guides/DATABASE-SETUP.md)

---

### Archived Scripts

Located in `scripts/archive/`:

These are historical, diagnostic, or one-time scripts no longer needed for regular operations.

---

## 📂 File Organization

```
docs/
├── README.md (this file)           # Documentation index
├── SETUP.md                         # Complete setup guide
├── ANALYTICS.md                     # Analytics engine docs
├── EQ-PQ-IQ.md                     # Evaluation framework
├── CURRENT-STATE-SUMMARY.md        # System overview
├── planning.md                      # Architecture
├── tasks.md                         # Implementation roadmap
├── prd.md                          # Product requirements
├── design.md                        # Design specs
├── guides/                          # User guides
│   ├── GETTING-STARTED.md
│   ├── DATABASE-SETUP.md
│   ├── DATA-IMPORT.md
│   └── DASHBOARD-USAGE.md
├── archive/                         # Historical docs
└── _guidance/                       # Reference materials
```

---

## 🎯 Documentation by Use Case

### "I'm a new developer joining the project"

1. Read [Getting Started](guides/GETTING-STARTED.md)
2. Set up database with [Database Setup](guides/DATABASE-SETUP.md)
3. Review [CURRENT-STATE-SUMMARY.md](CURRENT-STATE-SUMMARY.md) for system overview
4. Explore [planning.md](planning.md) for architecture

---

### "I need to set up a new Lev8 instance"

1. Follow [SETUP.md](SETUP.md) for complete setup
2. Run migrations per [Database Setup](guides/DATABASE-SETUP.md)
3. Import data per [Data Import](guides/DATA-IMPORT.md)
4. Verify with [Dashboard Usage](guides/DASHBOARD-USAGE.md)

---

### "I want to understand the analytics engine"

1. Read [ANALYTICS.md](ANALYTICS.md) for technical details
2. Review [EQ-PQ-IQ.md](EQ-PQ-IQ.md) for evaluation framework
3. Check [AI-SWOT-ANALYSIS-SETUP.md](AI-SWOT-ANALYSIS-SETUP.md) for AI integration
4. Use [Dashboard Usage](guides/DASHBOARD-USAGE.md) to explore the UI

---

### "I'm a program director learning to use the dashboard"

1. Read [Dashboard Usage](guides/DASHBOARD-USAGE.md)
2. Review [EQ-PQ-IQ.md](EQ-PQ-IQ.md) for evaluation framework
3. Explore [ANALYTICS.md](ANALYTICS.md) for feature details

---

### "I need to import evaluation data"

1. Follow [Data Import](guides/DATA-IMPORT.md)
2. Reference [SETUP.md](SETUP.md) for troubleshooting
3. Verify with SQL queries in [Database Setup](guides/DATABASE-SETUP.md)

---

## 🔍 Search Tips

### Finding Information

**By Topic:**
- **Setup:** SETUP.md, guides/GETTING-STARTED.md
- **Database:** guides/DATABASE-SETUP.md, CURRENT-STATE-SUMMARY.md
- **Analytics:** ANALYTICS.md, guides/DASHBOARD-USAGE.md
- **EQ+PQ+IQ:** EQ-PQ-IQ.md
- **AI:** AI-SWOT-ANALYSIS-SETUP.md, claude.md
- **Security:** PRIVACY-FRAMEWORK-ANALYSIS.md

**By Role:**
- **Developers:** guides/GETTING-STARTED.md, planning.md, ANALYTICS.md
- **Admins:** SETUP.md, guides/DATABASE-SETUP.md, guides/DATA-IMPORT.md
- **Program Directors:** guides/DASHBOARD-USAGE.md, EQ-PQ-IQ.md
- **Faculty:** EQ-PQ-IQ.md, guides/DASHBOARD-USAGE.md
- **Residents:** guides/DASHBOARD-USAGE.md

---

## 📝 Documentation Standards

### When to Update Documentation

- **After major features:** Update relevant guides
- **After schema changes:** Update CURRENT-STATE-SUMMARY.md
- **After API changes:** Update ANALYTICS.md
- **After UI changes:** Update DASHBOARD-USAGE.md

### Documentation Style

- Use clear, concise language
- Include code examples
- Add verification steps
- Provide troubleshooting sections
- Keep table of contents updated

---

## 🆘 Getting Help

If you can't find what you need:

1. **Search this index** for relevant documents
2. **Check the guides/** folder for step-by-step instructions
3. **Review CURRENT-STATE-SUMMARY.md** for system overview
4. **Consult SETUP.md** for comprehensive reference
5. **Contact the development team** for assistance

---

## 📊 Documentation Statistics

- **Total Documents:** 30+
- **User Guides:** 4
- **Technical Docs:** 10+
- **Reference Docs:** 8+
- **Archived Docs:** 15+
- **Last Major Update:** January 22, 2025

---

## 🚀 Recent Updates

**January 22, 2025:**
- ✅ Created consolidated SETUP.md
- ✅ Created comprehensive ANALYTICS.md
- ✅ Created detailed EQ-PQ-IQ.md
- ✅ Created 4 new user guides
- ✅ Updated CURRENT-STATE-SUMMARY.md
- ✅ Updated README.md and planning.md
- ✅ Organized scripts into production/migrations/archive
- ✅ Created this documentation index

---

**Welcome to the Lev8 documentation!** 📚

All documentation is kept up-to-date and reflects the current production state of the platform.


