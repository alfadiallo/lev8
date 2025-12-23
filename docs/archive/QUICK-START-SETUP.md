# Quick Start: Setup MED-001 in Correct Supabase Project

## Step 1: Verify Current State

Run this simple check script:
```sql
-- Run in Supabase SQL Editor
-- scripts/01-check-database-simple.sql
```

This will show you:
- Which tables exist
- What columns are in user_profiles
- Row counts for existing tables
- RLS policy status

## Step 2: Run Setup Scripts (In Order)

Based on what's missing, run these scripts in Supabase SQL Editor:

### If tables are missing:

**1. Create Base Schema:**
```sql
-- Run: scripts/02-setup-base-schema.sql
```
Creates all required tables.

**2. Set Up Security:**
```sql
-- Run: scripts/03-setup-rls-policies.sql
```
Enables Row Level Security.

**3. Seed Initial Data:**
```sql
-- Run: scripts/04-seed-initial-data.sql
```
Creates health system, program, and module buckets.

**4. Import MED-001:**
```sql
-- Run: scripts/06-import-med001-complete.sql
```
Or use TypeScript script:
```bash
npx tsx scripts/05-import-med001-from-typescript.ts
```

## Step 3: Verify Setup

Run the check script again:
```sql
-- Run: scripts/01-check-database-simple.sql
```

You should see:
- ✅ All tables exist
- ✅ Data in health_systems, programs, modules
- ✅ MED-001 vignette exists
- ✅ RLS policies active

## Troubleshooting

### "Table does not exist"
→ Run `scripts/02-setup-base-schema.sql`

### "Foreign key constraint violation"
→ Run scripts in order: 02 → 03 → 04 → 06

### "Vignette not visible in app"
→ Check:
1. `is_active = true` in vignettes table
2. User's `institution_id` matches vignette's `institution_id`
3. User has correct role (resident/faculty)

## What Gets Created

✅ **Tables:** health_systems, programs, user_profiles, vignettes, training_sessions, etc.

✅ **Data:** 
- Memorial Healthcare System
- Emergency Medicine Residency program
- Module buckets (Learn, Grow, Understand)
- Modules (Difficult Conversations, etc.)
- MED-001 vignette

✅ **Security:** RLS policies for all tables

## Next Steps

After setup:
1. Create educator user (see `docs/CREATE-EDUCATOR-USER.md`)
2. Test MED-001 in the application
3. Verify conversation flow works



