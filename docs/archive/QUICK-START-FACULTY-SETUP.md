# Quick Start: Faculty Setup

## Issue Fixed ✅

The original seed script tried to insert into `auth.users` which caused an error. The new simplified script only creates faculty records.

## Step-by-Step Setup

### 1. Run Faculty Table Migration

In Supabase SQL Editor, run:

```sql
-- Copy and paste contents of:
-- supabase/migrations/20250122000001_create_faculty_table.sql
```

**Expected Result:**
```
CREATE TABLE
CREATE INDEX (4 times)
CREATE POLICY (3 times)
```

### 2. Seed Faculty Data

In Supabase SQL Editor, run:

```sql
-- Copy and paste contents of:
-- scripts/seed-faculty-simple.sql
```

**Expected Result:**
```
NOTICE: Successfully seeded 13 faculty members
```

You should see a table with 13 faculty members, all with `auth_status = 'Not linked'`.

### 3. Verify Faculty Created

```sql
SELECT COUNT(*) FROM public.faculty;
-- Should return: 13

SELECT full_name, credentials, email 
FROM public.faculty 
ORDER BY full_name;
```

### 4. Import Historical Data

```bash
cd /Users/alfadiallo/lev8
export $(cat .env.local | grep -v '^#' | xargs)

# Import faculty assessments (267 rows)
npx tsx scripts/import-faculty-assessments.ts

# Import self-assessments (52 rows)
npx tsx scripts/import-self-assessments.ts
```

**Expected Output:**
```
✓ Successfully imported: 267 ratings
✓ Successfully imported: 52 self-assessments
```

### 5. Verify Import

```sql
SELECT rater_type, COUNT(*) 
FROM public.structured_ratings 
GROUP BY rater_type;
```

**Expected Result:**
```
rater_type | count
-----------+-------
faculty    |   267
self       |    52
```

## ✅ Success!

You now have:
- 13 faculty members in the database
- 267 faculty evaluations imported
- 52 self-assessments imported
- **Total: 319 historical ratings**

## Next Steps

1. **Create API Endpoints** - See `EQ-PQ-IQ-SETUP-GUIDE.md` Step 4
2. **Add RLS Policies** - See `EQ-PQ-IQ-SETUP-GUIDE.md` Step 5
3. **Test Forms** - Visit `/forms/self-assessment` and `/forms/evaluate-resident`

## Note About Auth

The faculty records are created without `user_id` (auth link). This is intentional because:

1. **Auth users** are created when faculty members sign up through Supabase Auth
2. **Faculty records** exist in the database for name matching during CSV import
3. **Linking happens** when a faculty member signs up and their email matches

For now, this allows the import scripts to work by matching faculty names to the faculty table records.

## Troubleshooting

### Issue: "Emergency Medicine program not found"
**Solution:** Make sure you have a program with name='Emergency Medicine':
```sql
SELECT id, name FROM public.programs;
```

### Issue: Import scripts fail with "Faculty not found"
**Solution:** The faculty names in the CSV must match the names in the faculty table. Check:
```sql
SELECT full_name FROM public.faculty ORDER BY full_name;
```

Should match the names in your CSV files.

### Issue: Duplicate key error
**Solution:** Faculty already seeded. To re-seed:
```sql
DELETE FROM public.faculty;
-- Then run seed-faculty-simple.sql again
```

## Files Reference

- **Migration:** `supabase/migrations/20250122000001_create_faculty_table.sql`
- **Seed Script:** `scripts/seed-faculty-simple.sql` ← **Use this one!**
- **Import Scripts:** 
  - `scripts/import-faculty-assessments.ts`
  - `scripts/import-self-assessments.ts`
- **Verification:** `scripts/verify-eqpqiq-import.sql`

---

**Status:** Ready to run! ✅
**Next:** Import historical data, then create API endpoints

