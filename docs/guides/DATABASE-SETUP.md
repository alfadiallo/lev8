# Database Setup Guide

**Complete guide to setting up the Lev8 database schema**

---

## Overview

The Lev8 database consists of 30+ tables organized into several categories:

- **Core Tables:** health_systems, programs, residents, faculty
- **Learning Modules:** modules, vignettes, clinical_cases, training_sessions
- **Analytics:** imported_comments, structured_ratings, period_scores, swot_summaries, ite_scores
- **Voice Journal:** grow_voice_journal

---

## Migration Order

**IMPORTANT:** Migrations must be run in this exact order to avoid dependency errors.

### 1. Base Schema (Required First)
**File:** `supabase/migrations/20250115000000_base_schema.sql`

**Creates:**
- health_systems
- programs
- academic_classes
- user_profiles
- residents
- faculty

**Run in:** Supabase SQL Editor

**Verification:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('health_systems', 'programs', 'residents', 'faculty');
-- Expected: 4 rows
```

---

### 2. Learning Modules (Recommended)
**File:** `supabase/migrations/20250115000001_add_learning_modules.sql`

**Creates:**
- module_buckets
- modules
- vignettes
- clinical_cases
- acls_scenarios
- running_board_configs
- training_sessions
- session_analytics

**Run in:** Supabase SQL Editor

**Verification:**
```sql
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%module%' OR table_name LIKE '%vignette%';
-- Expected: Multiple tables
```

---

### 3. Analytics Foundation (Required for Analytics)
**File:** `supabase/migrations/20250115000002_analytics_foundation.sql`

**Creates:**
- rotation_types
- imported_comments
- structured_ratings
- period_scores
- swot_summaries
- ite_scores
- form_tokens
- faculty_annotations
- rosh_completion_snapshots
- medhub_staging
- medhub_name_overrides

**Also creates functions:**
- `calculate_pgy_level(class_id UUID, evaluation_date DATE)`
- `determine_period(pgy_level TEXT, evaluation_date DATE)`
- `parse_medhub_name(medhub_name TEXT)`
- `find_resident_by_medhub_name(medhub_name TEXT)`
- `find_resident_with_overrides(medhub_name TEXT)`

**Run in:** Supabase SQL Editor

**Verification:**
```sql
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('imported_comments', 'structured_ratings', 'period_scores');
-- Expected: 3

SELECT proname FROM pg_proc 
WHERE proname LIKE 'calculate%' OR proname LIKE 'determine%';
-- Expected: Multiple functions
```

---

### 4. Row-Level Security Policies (Required)
**File:** `supabase/migrations/20250115000003_analytics_rls_policies.sql`

**Creates:**
- RLS policies for all analytics tables
- Ensures data security and access control

**Run in:** Supabase SQL Editor

**Verification:**
```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename;
-- Expected: Many policies
```

---

## Seed Data

### Initial Data (Required)
**File:** `scripts/04-seed-initial-data.sql`

**Creates:**
- Memorial Healthcare System (health system)
- Emergency Medicine Residency (program)
- Academic classes (2024-2028)
- Module buckets (Learn, Grow, Understand)

**Run in:** Supabase SQL Editor

**Verification:**
```sql
SELECT name FROM health_systems;
SELECT name FROM programs;
SELECT COUNT(*) FROM academic_classes;
-- Should see data
```

---

### Analytics Configuration
**File:** `scripts/seed-analytics-config.sql`

**Creates:**
- Rotation type classifications

**Run in:** Supabase SQL Editor

---

## Complete Setup Script

If you want to run everything at once, here's the complete order:

```sql
-- 1. Base Schema
\i supabase/migrations/20250115000000_base_schema.sql

-- 2. Learning Modules
\i supabase/migrations/20250115000001_add_learning_modules.sql

-- 3. Analytics Foundation
\i supabase/migrations/20250115000002_analytics_foundation.sql

-- 4. RLS Policies
\i supabase/migrations/20250115000003_analytics_rls_policies.sql

-- 5. Seed Initial Data
\i scripts/04-seed-initial-data.sql

-- 6. Seed Analytics Config
\i scripts/seed-analytics-config.sql
```

**Note:** The `\i` command works in psql. For Supabase SQL Editor, copy/paste each file's contents individually.

---

## Database Diagram

```
health_systems
  ↓
programs
  ↓
academic_classes
  ↓
residents ← user_profiles (auth.users)
  ↓
├─ imported_comments (MedHub evaluations)
├─ structured_ratings (EQ+PQ+IQ)
│    ↓
│  period_scores (aggregated)
│    ↓
│  swot_summaries (AI analysis)
├─ ite_scores (exam performance)
└─ grow_voice_journal (private reflections)

faculty ← user_profiles (auth.users)
  ↓
structured_ratings (evaluations)
```

---

## Key Tables Reference

### health_systems
Root of institutional hierarchy.

**Columns:**
- id (UUID, PK)
- name (TEXT)
- abbreviation (TEXT)
- location (TEXT)
- contact_email (TEXT)

---

### programs
Residency programs within health systems.

**Columns:**
- id (UUID, PK)
- health_system_id (UUID, FK)
- name (TEXT)
- specialty (TEXT)
- pgm_director_id (UUID, FK to user_profiles)

---

### academic_classes
Resident cohorts (e.g., Class of 2025).

**Columns:**
- id (UUID, PK)
- program_id (UUID, FK)
- graduation_date (DATE)
- start_date (DATE)
- is_active (BOOLEAN)

---

### user_profiles
All users (residents, faculty, program directors).

**Columns:**
- id (UUID, PK, matches auth.users.id)
- email (TEXT)
- full_name (TEXT)
- role (TEXT: 'resident', 'faculty', 'program_director', 'super_admin')
- institution_id (UUID, FK to health_systems)

---

### residents
Resident-specific data.

**Columns:**
- id (UUID, PK)
- user_id (UUID, FK to user_profiles)
- program_id (UUID, FK)
- class_id (UUID, FK to academic_classes)
- medical_school (TEXT)
- specialty (TEXT)

---

### faculty
Faculty-specific data.

**Columns:**
- id (UUID, PK)
- user_id (UUID, FK to user_profiles)
- full_name (TEXT)
- credentials (TEXT)
- email (TEXT, UNIQUE)
- program_id (UUID, FK)
- is_active (BOOLEAN)

---

## Troubleshooting

### Error: relation "X" does not exist

**Cause:** Migrations run out of order or migration failed.

**Solution:**
1. Check which tables exist:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```

2. Run missing migrations in order
3. If stuck, see [Cleanup](#cleanup) section below

---

### Error: function "X" does not exist

**Cause:** Analytics foundation migration didn't complete.

**Solution:**
1. Check which functions exist:
   ```sql
   SELECT proname FROM pg_proc 
   WHERE proname LIKE '%pgy%' OR proname LIKE '%period%';
   ```

2. Re-run `20250115000002_analytics_foundation.sql`

---

### Error: permission denied for table X

**Cause:** RLS policies not set up or user doesn't have access.

**Solution:**
1. Verify RLS is enabled:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```

2. Check policies exist:
   ```sql
   SELECT tablename, policyname 
   FROM pg_policies 
   WHERE schemaname = 'public' 
   AND tablename = 'your_table';
   ```

3. Re-run `20250115000003_analytics_rls_policies.sql`

---

## Cleanup

If you need to start fresh:

### Drop All Tables (Nuclear Option)

**File:** `scripts/drop-all-tables.sql`

**WARNING:** This deletes all data. Use with caution.

```sql
-- Run in Supabase SQL Editor
-- Copy/paste contents of scripts/drop-all-tables.sql
```

After dropping, re-run all migrations in order.

---

### Drop Specific Tables

```sql
-- Drop analytics tables only
DROP TABLE IF EXISTS swot_summaries CASCADE;
DROP TABLE IF EXISTS period_scores CASCADE;
DROP TABLE IF EXISTS structured_ratings CASCADE;
DROP TABLE IF EXISTS imported_comments CASCADE;
DROP TABLE IF EXISTS ite_scores CASCADE;

-- Drop base tables
DROP TABLE IF EXISTS residents CASCADE;
DROP TABLE IF EXISTS faculty CASCADE;
DROP TABLE IF EXISTS academic_classes CASCADE;
DROP TABLE IF EXISTS programs CASCADE;
DROP TABLE IF EXISTS health_systems CASCADE;
```

---

## Verification Checklist

After setup, verify everything is correct:

```sql
-- 1. Check all core tables exist
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'health_systems', 'programs', 'academic_classes',
  'user_profiles', 'residents', 'faculty'
);
-- Expected: 6

-- 2. Check analytics tables exist
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'imported_comments', 'structured_ratings', 'period_scores',
  'swot_summaries', 'ite_scores'
);
-- Expected: 5

-- 3. Check functions exist
SELECT COUNT(*) FROM pg_proc 
WHERE proname IN ('calculate_pgy_level', 'determine_period');
-- Expected: 2

-- 4. Check RLS is enabled
SELECT COUNT(*) FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;
-- Expected: 20+

-- 5. Check seed data exists
SELECT COUNT(*) FROM health_systems;
-- Expected: 1
SELECT COUNT(*) FROM programs;
-- Expected: 1
SELECT COUNT(*) FROM academic_classes;
-- Expected: 4+
```

---

## Next Steps

After database setup:

1. **[Data Import Guide](DATA-IMPORT.md)** - Import residents, faculty, and evaluations
2. **[Setup Guide](../SETUP.md)** - Complete application setup
3. **[Getting Started](GETTING-STARTED.md)** - Developer onboarding

---

**Database setup complete!** ✅


