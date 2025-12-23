# Migration Instructions: Database Schema Setup

## Important: Run Migrations in Order

You need to run **TWO** migrations in sequence:

### Step 1: Base Schema (Required First)
Run the base schema migration that creates core tables:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open: `supabase/migrations/20250115000000_base_schema.sql`
3. Copy all contents and paste into SQL Editor
4. Click **"Run"**

This creates:
- `health_systems`
- `programs`
- `academic_classes`
- `user_profiles`
- `residents`
- `faculty`
- `device_trusts`
- `module_buckets`
- `grow_voice_journal`

### Step 2: Learning Modules Schema
After Step 1 completes successfully, run the learning modules migration:

1. Still in **SQL Editor**
2. Open: `supabase/migrations/20250115000001_add_learning_modules.sql`
3. Copy all contents and paste into SQL Editor
4. Click **"Run"**

This creates:
- `vignettes`
- `training_sessions`
- `session_analytics`
- `clinical_cases`
- `case_attempts`
- `acls_scenarios`
- `acls_sessions`
- `running_board_configs`
- `running_board_sessions`
- `modules`

### Step 3: Verify Tables Created

Go to **Table Editor** and verify you see all the tables listed above.

### Step 4: Seed Initial Data (Optional)

If you want to seed initial data (health system, programs, etc.):

1. Open: `scripts/seed-basic-data.sql`
2. Copy and run in SQL Editor

OR use the API endpoint:
```bash
POST http://localhost:3000/api/seed-data
```

## After Migrations Complete

Once both migrations are done, you can import MED-001:

```bash
npx tsx scripts/import-v2-vignette.ts 7a617a6d-c0e7-4c30-bcf7-12bd123432e9
```
