# Run All Migrations in Correct Order

## ⚠️ Important: Migration Order Matters!

The analytics migrations depend on base tables. Run migrations in this **exact order**:

---

## Step 1: Base Schema (REQUIRED)

**File:** `supabase/migrations/20250115000000_base_schema.sql`

**What it creates:**
- health_systems
- programs
- academic_classes
- user_profiles
- residents ← **Required for analytics!**
- faculty

**Copy the entire file and paste into Supabase SQL Editor, then click "Run".**

Expected result: ✅ Success

---

## Step 2: Learning Modules (RECOMMENDED)

**File:** `supabase/migrations/20250115000001_add_learning_modules.sql`

**What it creates:**
- module_buckets
- modules
- module_acls
- conversations
- clinical_cases
- vignettes
- running_board

**Copy the entire file and paste into Supabase SQL Editor, then click "Run".**

Expected result: ✅ Success

---

## Step 3: Analytics Foundation (THIS IS WHAT YOU TRIED)

**File:** `supabase/migrations/20250115000002_analytics_foundation.sql`

**What it creates:**
- rotation_types
- imported_comments
- structured_ratings
- period_scores
- swot_summaries
- ite_scores
- rosh_completion_snapshots
- form_tokens
- faculty_annotations

**Copy the entire file and paste into Supabase SQL Editor, then click "Run".**

Expected result: ✅ Success (will work now that Step 1 is complete)

---

## Step 4: Analytics RLS Policies

**File:** `supabase/migrations/20250115000003_analytics_rls_policies.sql`

**What it does:**
- Enables Row-Level Security on all analytics tables
- Creates access policies for residents/faculty/admins

**Copy the entire file and paste into Supabase SQL Editor, then click "Run".**

Expected result: ✅ Success

---

## Step 5: Seed Rotation Types

**File:** `scripts/seed-analytics-config.sql`

**What it does:**
- Populates rotation_types table with common evaluation types

**Copy the entire file and paste into Supabase SQL Editor, then click "Run".**

Expected result: ✅ Success (rows inserted)

---

## Verification

After running all migrations, verify tables exist:

```sql
-- Check base tables
SELECT 'Base Schema' as migration, COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('health_systems', 'programs', 'academic_classes', 'user_profiles', 'residents', 'faculty')
UNION ALL
-- Check learning module tables
SELECT 'Learning Modules', COUNT(*)
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('module_buckets', 'modules', 'module_acls', 'conversations', 'clinical_cases')
UNION ALL
-- Check analytics tables
SELECT 'Analytics Foundation', COUNT(*)
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'rotation_types', 'imported_comments', 'structured_ratings',
    'period_scores', 'swot_summaries', 'ite_scores', 
    'rosh_completion_snapshots', 'form_tokens', 'faculty_annotations'
  );
```

**Expected result:**
```
Base Schema            | 6
Learning Modules       | 5
Analytics Foundation   | 9
```

---

## Troubleshooting

### "relation already exists"
**Solution:** Table already created. Skip that migration or use `DROP TABLE IF EXISTS` first.

### "permission denied"
**Solution:** Make sure you're using the service role key, not anon key.

### Foreign key constraint errors
**Solution:** You ran migrations out of order. Drop all tables and start over in correct order.

---

## Start Fresh (If Needed)

If you need to start over completely:

```sql
-- WARNING: This deletes ALL data!
-- Only run if you want to start fresh

DROP TABLE IF EXISTS public.faculty_annotations CASCADE;
DROP TABLE IF EXISTS public.form_tokens CASCADE;
DROP TABLE IF EXISTS public.rosh_completion_snapshots CASCADE;
DROP TABLE IF EXISTS public.ite_scores CASCADE;
DROP TABLE IF EXISTS public.swot_summaries CASCADE;
DROP TABLE IF EXISTS public.period_scores CASCADE;
DROP TABLE IF EXISTS public.structured_ratings CASCADE;
DROP TABLE IF EXISTS public.imported_comments CASCADE;
DROP TABLE IF EXISTS public.rotation_types CASCADE;

DROP TABLE IF EXISTS public.clinical_cases CASCADE;
DROP TABLE IF EXISTS public.vignettes CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.running_board CASCADE;
DROP TABLE IF EXISTS public.module_acls CASCADE;
DROP TABLE IF EXISTS public.modules CASCADE;
DROP TABLE IF EXISTS public.module_buckets CASCADE;

DROP TABLE IF EXISTS public.faculty CASCADE;
DROP TABLE IF EXISTS public.residents CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.academic_classes CASCADE;
DROP TABLE IF EXISTS public.programs CASCADE;
DROP TABLE IF EXISTS public.health_systems CASCADE;

-- Then run all migrations in order (Steps 1-5 above)
```

---

## Success! ✅

Once all migrations complete successfully, proceed to:
- Create test data (`scripts/create-test-analytics-data.sql`)
- Test the dashboard (`http://localhost:3000/modules/understand/overview`)


