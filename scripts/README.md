# Lev8 Scripts Documentation

**Complete reference for all database and import scripts**

**Last Updated:** January 22, 2025

---

## Script Organization

Scripts are organized into three categories:

- **`migrations/`** - Database setup and migration scripts
- **Production Scripts** (root) - Active data import and processing
- **`archive/`** - Historical, diagnostic, and one-time scripts

---

## Production Scripts (Active Use)

These scripts are used regularly for data import and processing.

### Resident and Faculty Import

| Script | Purpose | Usage |
|--------|---------|-------|
| `import-memorial-residents.sql` | Import 50 residents for Memorial EM program | Supabase SQL Editor |
| `seed-faculty-simple.sql` | Import 13 faculty members | Supabase SQL Editor |

### MedHub Comment Import

| Script | Purpose | Usage |
|--------|---------|-------|
| `process-medhub-staging.sql` | Process uploaded MedHub CSV data | Supabase SQL Editor (after CSV upload) |

**Process:**
1. Upload CSV to `medhub_staging` table via Supabase UI
2. Run `process-medhub-staging.sql` to parse and import

### EQ+PQ+IQ Ratings Import

| Script | Purpose | Usage |
|--------|---------|-------|
| `import-faculty-assessments.ts` | Import faculty EQ+PQ+IQ ratings from CSV | `npx tsx scripts/import-faculty-assessments.ts` |
| `import-self-assessments.ts` | Import resident self-assessments from CSV | `npx tsx scripts/import-self-assessments.ts` |
| `aggregate-period-scores.sql` | Aggregate ratings into period_scores table | Supabase SQL Editor |

**Process:**
1. Run import scripts to load `structured_ratings`
2. Run `aggregate-period-scores.sql` to create dashboard data

### ITE Scores

| Script | Purpose | Usage |
|--------|---------|-------|
| `import-ite-scores.sql` | Import ITE exam scores for all residents | Supabase SQL Editor |

### Clinical Cases

| Script | Purpose | Usage |
|--------|---------|-------|
| `seed-clinical-cases.sql` | Import 8 EM clinical cases | Supabase SQL Editor |

### AI SWOT Analysis

| Script | Purpose | Usage |
|--------|---------|-------|
| `analyze-larissa-comments.ts` | Generate AI SWOT analysis (template for one resident) | `node -r dotenv/config scripts/analyze-larissa-comments.ts` |

**Note:** This is a template script. Modify to analyze all residents or specific cohorts.

---

## Migration Scripts (`migrations/`)

These scripts set up the database schema. Run in order.

### Setup Scripts (Run Once)

| Script | Purpose | Order | Usage |
|--------|---------|-------|-------|
| `01-quick-check.sql` | Verify database state | Anytime | Supabase SQL Editor |
| `02-setup-base-schema.sql` | Create core tables (health_systems, programs, residents, faculty) | 1st | Supabase SQL Editor |
| `03-setup-rls-policies.sql` | Set up Row-Level Security | 2nd | Supabase SQL Editor |
| `04-seed-initial-data.sql` | Seed health system, program, classes, module buckets | 3rd | Supabase SQL Editor |

### Analytics Setup

| Script | Purpose | Usage |
|--------|---------|-------|
| `seed-analytics-config.sql` | Seed rotation type classifications | Supabase SQL Editor (after analytics migration) |
| `create-medhub-staging-table.sql` | Create staging table for MedHub CSV uploads | Supabase SQL Editor (before first MedHub import) |

### Supabase Migrations

Located in `supabase/migrations/`:

| Migration | Purpose | Order |
|-----------|---------|-------|
| `20250115000000_base_schema.sql` | Base schema (must run first) | 1st |
| `20250115000001_add_learning_modules.sql` | Learning module tables | 2nd |
| `20250115000002_analytics_foundation.sql` | Analytics tables + functions | 3rd |
| `20250115000003_analytics_rls_policies.sql` | Analytics RLS policies | 4th |

### Other Setup Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `setup-storage.ts` | Configure Supabase storage buckets | `npx tsx scripts/migrations/setup-storage.ts` |
| `create-educator-user.ts` | Create educator/admin user | `npx tsx scripts/migrations/create-educator-user.ts` |
| `05-import-med001-from-typescript.ts` | Import MED-001 vignette (TypeScript) | `npx tsx scripts/migrations/05-...` |
| `06-import-med001-complete.sql` | Import MED-001 vignette (SQL) | Supabase SQL Editor |

---

## Archived Scripts (`archive/`)

These scripts are historical, diagnostic, or one-time use. Kept for reference.

### Diagnostic Scripts

- `check-*.sql` - Various database state checks
- `check-*.ts` - TypeScript diagnostic tools
- `verify-*.sql` - Data verification queries
- `get-resident-ids.sql` - Utility to retrieve resident IDs

### Cleanup Scripts

- `diagnostic-and-cleanup.sql` - Diagnose and clean database
- `drop-*.sql` - Drop tables for fresh start
- `fresh-start-drop-base.sql` - Drop base tables only
- `complete-cleanup.sql` - Nuclear cleanup option

### Test Data Scripts

- `create-test-*.sql` - Create test/sample data
- `create-larissa-test-data.sql` - Specific test data for one resident

### Historical Import Scripts

- `import-medhub-comments-with-matching.sql` - Old MedHub import approach
- `import-medhub-csv-data.sql` - Previous CSV import method
- `process-medhub-step1-functions.sql` - Partial processing script

### Historical Setup Scripts

- `seed-faculty.sql` - Old faculty seeding approach
- `seed-faculty-check-program.sql` - Program verification
- `create-name-overrides-only.sql` - Name override utility
- `fix-*.sql` - Various one-time fixes

### Documentation Scripts

- `setup-analytics-dashboard.md` - Old setup guide (replaced by docs/SETUP.md)
- `run-all-migrations.md` - Migration order reference (replaced by docs/guides/DATABASE-SETUP.md)
- `RUN-ANALYSIS.md` - AI analysis instructions (replaced by docs/ANALYTICS.md)

### Test Scripts

- `test-one-period.ts` - Test AI analysis for single period
- `check-citations-in-db.ts` - Verify citation storage

---

## Quick Reference

### First-Time Setup

```bash
# 1. Run Supabase migrations (in Supabase SQL Editor)
supabase/migrations/20250115000000_base_schema.sql
supabase/migrations/20250115000001_add_learning_modules.sql
supabase/migrations/20250115000002_analytics_foundation.sql
supabase/migrations/20250115000003_analytics_rls_policies.sql

# 2. Seed initial data (in Supabase SQL Editor)
scripts/migrations/02-setup-base-schema.sql
scripts/migrations/03-setup-rls-policies.sql
scripts/migrations/04-seed-initial-data.sql
scripts/migrations/seed-analytics-config.sql

# 3. Import residents and faculty (in Supabase SQL Editor)
scripts/import-memorial-residents.sql
scripts/seed-faculty-simple.sql

# 4. Create MedHub staging table (in Supabase SQL Editor)
scripts/migrations/create-medhub-staging-table.sql
```

### Regular Data Import

```bash
# 1. Upload MedHub CSV via Supabase UI to medhub_staging table

# 2. Process MedHub data (in Supabase SQL Editor)
scripts/process-medhub-staging.sql

# 3. Import EQ+PQ+IQ ratings (from project root)
npx tsx scripts/import-faculty-assessments.ts
npx tsx scripts/import-self-assessments.ts

# 4. Aggregate scores (in Supabase SQL Editor)
scripts/aggregate-period-scores.sql

# 5. Import ITE scores (in Supabase SQL Editor)
scripts/import-ite-scores.sql

# 6. Run AI SWOT analysis (from project root)
node -r dotenv/config scripts/analyze-larissa-comments.ts
```

---

## Common Tasks

### Verify Database State

```sql
-- Run in Supabase SQL Editor
-- scripts/migrations/01-quick-check.sql
```

Shows table counts, RLS status, and data verification.

### Clear and Re-import Data

```sql
-- Clear analytics data
DELETE FROM swot_summaries;
DELETE FROM period_scores;
DELETE FROM structured_ratings;
DELETE FROM imported_comments;
DELETE FROM ite_scores;

-- Then re-run import scripts
```

### Check Import Progress

```sql
-- MedHub comments
SELECT COUNT(*) FROM imported_comments;

-- EQ+PQ+IQ ratings
SELECT rater_type, COUNT(*) FROM structured_ratings GROUP BY rater_type;

-- Period scores
SELECT COUNT(*) FROM period_scores;

-- SWOT summaries
SELECT COUNT(*) FROM swot_summaries;

-- ITE scores
SELECT COUNT(*) FROM ite_scores;
```

---

## Script Naming Conventions

- **SQL files (`.sql`):** Run in Supabase SQL Editor
- **TypeScript files (`.ts`):** Run from command line with `npx tsx` or `node -r dotenv/config`
- **Numbered scripts:** Run in order (01, 02, 03, etc.)
- **Migration scripts:** Prefixed with timestamp (YYYYMMDDHHMMSS)

---

## Troubleshooting

### Script Fails with "relation does not exist"

**Cause:** Migrations not run in correct order.

**Solution:**
1. Run `scripts/migrations/01-quick-check.sql` to see what exists
2. Run missing migrations in order
3. See `docs/guides/DATABASE-SETUP.md` for details

### Name Matching Failures

**Cause:** Names in CSV don't match database format.

**Solution:**
1. Check exact spelling in database
2. Add manual overrides to `medhub_name_overrides` table
3. Re-run processing script

### TypeScript Script Errors

**Cause:** Environment variables not loaded or dependencies missing.

**Solution:**
1. Ensure `.env.local` exists with all required variables
2. Run `npm install` to ensure dependencies are installed
3. Use `node -r dotenv/config` to load environment variables

---

## Additional Resources

- **[Setup Guide](../docs/SETUP.md)** - Complete setup instructions
- **[Database Setup Guide](../docs/guides/DATABASE-SETUP.md)** - Detailed migration guide
- **[Data Import Guide](../docs/guides/DATA-IMPORT.md)** - Complete import procedures
- **[Analytics Documentation](../docs/ANALYTICS.md)** - Analytics engine details

---

**Scripts last organized:** January 22, 2025

All production scripts are actively maintained and reflect current best practices.
