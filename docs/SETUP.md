# Lev8 Platform Setup Guide

**Complete setup instructions for the Elevate medical education platform**

**Last Updated:** January 22, 2025  
**Status:** Production Setup Guide

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Database Setup](#database-setup)
4. [Data Import](#data-import)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js 18+** - [Download](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- **Git** - For version control

### Required Accounts
- **Supabase Account** - [Sign up](https://supabase.com/)
- **OpenAI API Key** - For Whisper transcription
- **Anthropic API Key** - For Claude AI (SWOT analysis, conversations)

### Required Knowledge
- Basic command line usage
- Basic SQL (for running migrations)
- Understanding of environment variables

---

## Initial Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd lev8
```

### 2. Install Dependencies

```bash
npm install
```

**Key packages installed:**
- Next.js 14
- React 18
- Supabase client
- Recharts (for analytics visualizations)
- Tailwind CSS

### 3. Configure Environment Variables

Create `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Supabase Configuration (required for build and runtime)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# AI Services
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Where to find Supabase keys:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings → API
4. Copy `URL`, `anon/public key`, and `service_role key`

**Build and Vercel:** `npm run build` and Vercel deployments require these Supabase env vars at build time (some API routes are evaluated during "Collecting page data"). Use `SUPABASE_SERVICE_KEY` in code (not `SUPABASE_SERVICE_ROLE_KEY`). For Vercel, add the same variables in Project Settings → Environment Variables.

---

## Database Setup

### Overview

The database setup consists of 4 main migrations that must be run in order:

1. **Base Schema** - Core tables (health_systems, programs, residents, faculty)
2. **Learning Modules** - Module content tables (optional but recommended)
3. **Analytics Foundation** - Analytics tables (imported_comments, structured_ratings, etc.)
4. **Row-Level Security** - RLS policies for all tables

### Step 1: Run Base Schema Migration

**File:** `supabase/migrations/20250115000000_base_schema.sql`

1. Open [Supabase SQL Editor](https://supabase.com/dashboard)
2. Select your project
3. Click "SQL Editor" in left sidebar
4. Copy contents of `supabase/migrations/20250115000000_base_schema.sql`
5. Paste and click "Run"

**Creates:**
- `health_systems` - Medical institutions
- `programs` - Residency programs
- `academic_classes` - Resident cohorts
- `user_profiles` - All users
- `residents` - Resident-specific data
- `faculty` - Faculty-specific data

**Verify:**
```sql
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('health_systems', 'programs', 'residents', 'faculty');
-- Expected: 4
```

### Step 2: Run Learning Modules Migration (Recommended)

**File:** `supabase/migrations/20250115000001_add_learning_modules.sql`

**Creates:**
- `module_buckets` - Top-level categories (Learn, Grow, Understand)
- `modules` - Specific features
- `vignettes` - Conversation scenarios
- `clinical_cases` - Clinical case library
- `training_sessions` - User activity tracking

**Verify:**
```sql
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('module_buckets', 'modules', 'vignettes');
-- Expected: 3
```

### Step 3: Run Analytics Foundation Migration

**File:** `supabase/migrations/20250115000002_analytics_foundation.sql`

**Creates:**
- `rotation_types` - Evaluation classifications
- `imported_comments` - MedHub evaluation comments
- `structured_ratings` - EQ+PQ+IQ ratings (15 attributes)
- `period_scores` - Aggregated scores by period
- `swot_summaries` - AI-generated SWOT analysis
- `ite_scores` - In-Training Exam scores
- `form_tokens` - Evaluation form tokens
- `faculty_annotations` - Faculty notes
- `rosh_completion_snapshots` - ROSH completion tracking

**Also creates PostgreSQL functions:**
- `calculate_pgy_level()` - Determines PGY level from class and date
- `determine_period()` - Determines Fall/Spring period

**Verify:**
```sql
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'rotation_types', 'imported_comments', 'structured_ratings',
  'period_scores', 'swot_summaries', 'ite_scores'
);
-- Expected: 6+
```

### Step 4: Run RLS Policies Migration

**File:** `supabase/migrations/20250115000003_analytics_rls_policies.sql`

**Creates:**
- Row-Level Security policies for all analytics tables
- Ensures residents can only see their own data
- Faculty can see residents in their program
- Program directors can see all residents in their program

**Verify:**
```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
LIMIT 10;
-- Should show multiple policies
```

### Step 5: Seed Initial Data

**File:** `scripts/04-seed-initial-data.sql`

Run this in Supabase SQL Editor to create:
- Memorial Healthcare System (health system)
- Emergency Medicine Residency (program)
- Academic classes (Class of 2024, 2025, 2026, etc.)
- Module buckets (Learn, Grow, Understand)

**Verify:**
```sql
SELECT name FROM health_systems;
SELECT name FROM programs;
SELECT COUNT(*) FROM academic_classes;
-- Should see data
```

### Step 6: Seed Analytics Configuration

**File:** `scripts/seed-analytics-config.sql`

Creates rotation type classifications for evaluation categorization.

---

## Data Import

### Import Residents

**File:** `scripts/import-memorial-residents.sql`

Imports 50 residents for the Memorial Healthcare System EM program.

```sql
-- Run in Supabase SQL Editor
-- Copy/paste contents of scripts/import-memorial-residents.sql
```

**Verify:**
```sql
SELECT COUNT(*) FROM residents;
SELECT COUNT(*) FROM user_profiles WHERE role = 'resident';
-- Expected: 50
```

### Import Faculty

**File:** `scripts/seed-faculty-simple.sql`

Imports 13 faculty members.

```sql
-- Run in Supabase SQL Editor
-- Copy/paste contents of scripts/seed-faculty-simple.sql
```

**Verify:**
```sql
SELECT COUNT(*) FROM faculty;
-- Expected: 13
```

### Import MedHub Evaluation Comments

**File:** `scripts/process-medhub-staging.sql`

1. First, create the staging table:
   ```sql
   -- Run scripts/create-medhub-staging-table.sql
   ```

2. Upload your MedHub CSV via Supabase Dashboard:
   - Go to Table Editor → `medhub_staging`
   - Click "Insert" → "Import data from CSV"
   - Upload your CSV file

3. Process the staging data:
   ```sql
   -- Run scripts/process-medhub-staging.sql
   ```

**Verify:**
```sql
SELECT COUNT(*) FROM imported_comments;
-- Expected: 5,860+ (depending on your data)
```

### Import EQ+PQ+IQ Ratings

**Faculty Assessments:**

```bash
# Run from project root
npx tsx scripts/import-faculty-assessments.ts
```

**Self-Assessments:**

```bash
# Run from project root
npx tsx scripts/import-self-assessments.ts
```

**Verify:**
```sql
SELECT COUNT(*) FROM structured_ratings WHERE rater_type = 'faculty';
SELECT COUNT(*) FROM structured_ratings WHERE rater_type = 'self';
-- Expected: 267 faculty + 52 self = 319 total
```

### Aggregate Period Scores

After importing structured ratings, aggregate them into period scores:

```sql
-- Run scripts/aggregate-period-scores.sql
```

**Verify:**
```sql
SELECT COUNT(*) FROM period_scores;
SELECT COUNT(DISTINCT resident_id) FROM period_scores;
-- Should see aggregated scores
```

### Import ITE Scores

**File:** `scripts/import-ite-scores.sql`

```sql
-- Run in Supabase SQL Editor
-- Copy/paste contents of scripts/import-ite-scores.sql
```

**Verify:**
```sql
SELECT COUNT(*) FROM ite_scores;
-- Expected: Multiple scores across residents
```

### Run AI SWOT Analysis

Generate AI-powered SWOT analysis using Claude:

```bash
# Run from project root
node -r dotenv/config scripts/analyze-larissa-comments.ts
```

**Note:** This script is a template. You can modify it to analyze all residents or specific cohorts.

**Verify:**
```sql
SELECT COUNT(*) FROM swot_summaries;
-- Should see SWOT analyses
```

---

## Verification

### Quick Database Check

Run this comprehensive check:

```sql
-- scripts/01-quick-check.sql
SELECT 
  'health_systems' as table_name, COUNT(*) as count FROM health_systems
UNION ALL
SELECT 'programs', COUNT(*) FROM programs
UNION ALL
SELECT 'residents', COUNT(*) FROM residents
UNION ALL
SELECT 'faculty', COUNT(*) FROM faculty
UNION ALL
SELECT 'imported_comments', COUNT(*) FROM imported_comments
UNION ALL
SELECT 'structured_ratings', COUNT(*) FROM structured_ratings
UNION ALL
SELECT 'period_scores', COUNT(*) FROM period_scores
UNION ALL
SELECT 'swot_summaries', COUNT(*) FROM swot_summaries
UNION ALL
SELECT 'ite_scores', COUNT(*) FROM ite_scores;
```

**Expected Results:**
- health_systems: 1
- programs: 1
- residents: 50
- faculty: 13
- imported_comments: 5,860+
- structured_ratings: 319
- period_scores: 60+
- swot_summaries: 30+
- ite_scores: 100+

### Test the Application

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Register a test account:**
   - Go to `http://localhost:3000/register`
   - Create an account
   - Should auto-link to Emergency Medicine program

3. **Test Analytics Dashboard:**
   - Navigate to `/modules/understand/overview`
   - Select "Individual Resident"
   - Choose a resident from dropdown
   - Click "View Analytics"
   - Verify SWOT tab shows analysis
   - Verify Scores tab shows radar chart
   - Verify ITE scores display

4. **Test Voice Journal:**
   - Navigate to `/modules/reflect/voice-journal`
   - Click "New Entry"
   - Record audio
   - Save and verify transcription

5. **Test Difficult Conversations:**
   - Navigate to `/modules/learn/difficult-conversations`
   - Start MED-001 vignette
   - Verify conversation flow

---

## Troubleshooting

### Database Connection Issues

**Problem:** Can't connect to Supabase

**Solution:**
1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is valid
3. Ensure Supabase project is active (not paused)

### Migration Errors

**Problem:** `relation "residents" does not exist`

**Solution:**
- Run migrations in correct order (base schema first)
- Check if migration already ran: `SELECT * FROM information_schema.tables WHERE table_name = 'residents';`

**Problem:** `function calculate_pgy_level does not exist`

**Solution:**
- Ensure analytics foundation migration ran successfully
- Check functions exist: `SELECT proname FROM pg_proc WHERE proname LIKE 'calculate%';`

### Import Errors

**Problem:** Name matching failures during MedHub import

**Solution:**
- Check `medhub_name_overrides` table for manual mappings
- Add overrides for names that don't match:
  ```sql
  INSERT INTO medhub_name_overrides (medhub_name, resident_id)
  VALUES ('Dr. Last, First', 'resident-uuid-here');
  ```

**Problem:** Duplicate key violations

**Solution:**
- Clear existing data before re-importing:
  ```sql
  DELETE FROM imported_comments;
  DELETE FROM structured_ratings;
  DELETE FROM period_scores;
  ```

### Analytics Dashboard Issues

**Problem:** Dashboard shows no data

**Solution:**
1. Verify data exists in database (run verification queries)
2. Check API endpoints are accessible: `/api/analytics/swot/resident/[id]`
3. Check browser console for errors
4. Verify user has correct role and permissions

**Problem:** Radar chart not displaying

**Solution:**
1. Ensure `recharts` is installed: `npm list recharts`
2. Check period_scores have `faculty_ratings_detail` and `self_ratings_detail` JSONB data
3. Verify aggregation script ran successfully

### Performance Issues

**Problem:** Slow queries

**Solution:**
- Ensure indexes exist on foreign keys
- Check RLS policies aren't causing full table scans
- Use `EXPLAIN ANALYZE` to debug slow queries

---

## Next Steps

After completing setup:

1. **Customize for your institution:**
   - Update health system name
   - Update program details
   - Add your residents and faculty

2. **Import your data:**
   - Export evaluations from MedHub
   - Import using staging table process
   - Run aggregation scripts

3. **Configure AI analysis:**
   - Adjust SWOT prompt tone in `lib/ai/swot-prompt.ts`
   - Run analysis for all residents
   - Review and refine

4. **Train users:**
   - Share dashboard usage guide: `docs/guides/DASHBOARD-USAGE.md`
   - Provide evaluation form training
   - Set up regular data import schedule

---

## Additional Resources

- **[Getting Started Guide](guides/GETTING-STARTED.md)** - New developer onboarding
- **[Database Setup Guide](guides/DATABASE-SETUP.md)** - Detailed migration instructions
- **[Data Import Guide](guides/DATA-IMPORT.md)** - Comprehensive import procedures
- **[Dashboard Usage Guide](guides/DASHBOARD-USAGE.md)** - Using the analytics dashboard
- **[Analytics Documentation](ANALYTICS.md)** - Technical details on analytics engine
- **[EQ+PQ+IQ Documentation](EQ-PQ-IQ.md)** - Evaluation framework details

---

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review relevant documentation
3. Check database state with verification queries
4. Review application logs for errors

---

**Setup Complete!** 🎉

Your Lev8 platform should now be fully operational with all three modules (Learn, Grow, Understand) ready to use.


