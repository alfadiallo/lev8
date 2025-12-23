# Fix: Wrong Supabase Project

## Quick Recovery Guide

You've been making changes to the wrong Supabase project. Here's how to fix it:

## Step 1: Identify the Correct Project

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Look at your project list
3. Identify which project should be used for **lev8** (Elevate)
4. Note down:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - Project name

## Step 2: Get Correct Credentials

1. Open the **correct** Supabase project
2. Go to **Settings** → **API**
3. Copy these values:
   - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key**: `SUPABASE_SERVICE_KEY` (keep this secret!)

## Step 3: Update Environment Variables

1. Open `.env.local` in your project root
2. Update these values:

```env
# Supabase (CORRECT PROJECT)
NEXT_PUBLIC_SUPABASE_URL=https://correct-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. Save the file

## Step 4: Verify Connection

Run the verification script:

```bash
npx tsx scripts/verify-supabase-connection.ts
```

This will:
- Test connection to the correct project
- Check if tables exist
- Show current database state

## Step 5: Run Migrations on Correct Project

Once connected to the correct project, you'll need to run all migrations:

### Option A: Using Supabase SQL Editor (Recommended)

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run migrations in order:
   - `supabase/migrations/20250115000000_base_schema.sql`
   - `supabase/migrations/20250115000001_add_learning_modules.sql`
3. Verify tables were created

### Option B: Using Supabase CLI

```bash
# Link to correct project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## Step 6: Seed Initial Data

1. Run seed script:
   ```sql
   -- In Supabase SQL Editor
   -- scripts/seed-basic-data.sql
   ```

2. Verify data:
   ```bash
   npx tsx scripts/verify-tables.ts
   ```

## Step 7: Recreate Missing Data

You'll need to recreate:
1. **Health Systems**: Run seed script
2. **Programs**: Run seed script
3. **Users**: Re-create auth users and profiles
4. **Vignettes**: Re-import MED-001 (if needed)
5. **Educator Users**: Re-run educator creation script

## What Was Lost?

Since you were working on the wrong project:
- ✅ **Code changes are safe** (in your local repo)
- ✅ **Migrations are safe** (SQL files)
- ❌ **Database schema** (need to recreate)
- ❌ **Data** (need to reseed)
- ❌ **Auth users** (need to recreate)

## Prevention

To avoid this in the future:

1. **Double-check project name** before running migrations
2. **Use project references** in SQL scripts (comments)
3. **Verify connection** before making changes:
   ```bash
   npx tsx scripts/verify-supabase-connection.ts
   ```

## Quick Checklist

- [ ] Identified correct Supabase project
- [ ] Updated `.env.local` with correct credentials
- [ ] Verified connection to correct project
- [ ] Ran base schema migration
- [ ] Ran learning modules migration
- [ ] Seeded initial data
- [ ] Recreated auth users
- [ ] Re-imported vignettes (if needed)
- [ ] Recreated educator users

## Need Help?

If you're unsure which project is correct:
1. Check project name in Supabase Dashboard
2. Look for existing data/tables
3. Check project creation date
4. Verify with team members





