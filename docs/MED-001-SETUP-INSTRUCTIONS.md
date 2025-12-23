# MED-001 Vignette Setup Instructions

## Quick Start

You've been working on the wrong Supabase project. Follow these steps to set up MED-001 in the **correct** project.

## Step 1: Verify Correct Project

1. Check your `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-CORRECT-PROJECT-ID.supabase.co
   SUPABASE_SERVICE_KEY=your-service-key
   ```

2. Run verification script:
   ```bash
   npx tsx scripts/verify-supabase-connection.ts
   ```

## Step 2: Run Setup Scripts (In Order)

### In Supabase SQL Editor:

1. **Check Current State:**
   ```sql
   -- Run: scripts/01-check-database-state.sql
   ```
   This shows what exists and what's missing.

2. **Create Base Schema:**
   ```sql
   -- Run: scripts/02-setup-base-schema.sql
   ```
   Creates all required tables.

3. **Set Up Security:**
   ```sql
   -- Run: scripts/03-setup-rls-policies.sql
   ```
   Enables Row Level Security.

4. **Seed Initial Data:**
   ```sql
   -- Run: scripts/04-seed-initial-data.sql
   ```
   Creates health system, program, and modules.

5. **Import MED-001:**
   
   **Option A (Recommended):**
   ```bash
   npx tsx scripts/05-import-med001-from-typescript.ts
   ```
   
   **Option B (If TypeScript fails):**
   ```sql
   -- Run: scripts/06-import-med001-complete.sql
   ```

## Step 3: Verify Setup

1. Check database state again:
   ```sql
   -- Run: scripts/01-check-database-state.sql
   ```

2. Verify vignette exists:
   ```sql
   SELECT id, title, category, is_active 
   FROM public.vignettes 
   WHERE title LIKE '%Adenosine%';
   ```

3. Test in application:
   - Login as resident
   - Go to Learn → Difficult Conversations
   - MED-001 should be visible

## Files Created

| File | Purpose |
|------|---------|
| `scripts/01-check-database-state.sql` | Check what exists in database |
| `scripts/02-setup-base-schema.sql` | Create all required tables |
| `scripts/03-setup-rls-policies.sql` | Set up security policies |
| `scripts/04-seed-initial-data.sql` | Create health system, program, modules |
| `scripts/05-import-med001-from-typescript.ts` | Import MED-001 (TypeScript) |
| `scripts/06-import-med001-complete.sql` | Import MED-001 (SQL fallback) |
| `scripts/00-complete-setup-guide.md` | Full setup documentation |

## Troubleshooting

### "Table does not exist"
→ Run `scripts/02-setup-base-schema.sql`

### "Foreign key constraint violation"
→ Run `scripts/04-seed-initial-data.sql` first

### "RLS policy violation"
→ Run `scripts/03-setup-rls-policies.sql`

### "PostgREST cache error"
→ Wait 30-60 seconds, or use SQL scripts directly

### "Vignette not visible"
→ Check:
1. `is_active = true` in vignettes table
2. User's `institution_id` matches vignette's `institution_id`
3. User has correct role (resident/faculty)

## What Gets Created

✅ **Tables:**
- health_systems
- programs
- academic_classes
- user_profiles
- residents
- faculty
- module_buckets
- modules
- vignettes
- training_sessions
- session_analytics

✅ **Data:**
- Memorial Healthcare System
- Emergency Medicine Residency program
- Academic classes (PGY-1, PGY-2, PGY-3)
- Module buckets (Learn, Grow, Understand)
- Modules (Difficult Conversations, Clinical Cases, Voice Journal)
- MED-001 vignette (full v2 structure)

✅ **Security:**
- RLS policies for all tables
- User access controls
- Institution-based data isolation

## Next Steps

After setup:
1. Create educator user (see `docs/CREATE-EDUCATOR-USER.md`)
2. Test MED-001 conversation flow
3. Verify assessment scoring
4. Check emotional tracking
5. Test phase transitions

## Support

If issues persist:
1. Check `scripts/01-check-database-state.sql` output
2. Verify environment variables
3. Check Supabase project is correct
4. Review Supabase logs




