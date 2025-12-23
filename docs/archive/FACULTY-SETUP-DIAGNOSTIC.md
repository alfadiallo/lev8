# Faculty Setup Diagnostic

## Error: "Emergency Medicine program not found"

This means there's no program in your database yet. Let's check and fix this.

## Step 1: Check What Programs Exist

Run this in Supabase SQL Editor:

```sql
-- Check programs
SELECT id, name, health_system_id 
FROM public.programs 
ORDER BY name;

-- Check health systems
SELECT id, name 
FROM public.health_systems 
ORDER BY name;
```

### Possible Results:

#### Case A: No programs exist
**Output:** Empty result

**Solution:** You need to run the import-memorial-residents.sql script first:
```bash
# In Supabase SQL Editor, run:
scripts/import-memorial-residents.sql
```

This creates:
- Memorial Healthcare System
- Emergency Medicine program
- 50 residents

#### Case B: Program exists with different name
**Output:** Shows programs like "EM", "Emergency Med", etc.

**Solution:** The updated seed script will now find it automatically!

#### Case C: Program exists as "Emergency Medicine"
**Output:** Shows "Emergency Medicine"

**Solution:** Something else is wrong. Check the table structure:
```sql
\d public.programs
```

## Step 2: Run Updated Seed Script

The seed script has been updated to:
1. Try to find "Emergency Medicine" (case-insensitive)
2. If not found, use the first available program
3. Show which program it's using

Run in Supabase SQL Editor:
```sql
-- Copy contents of: scripts/seed-faculty-simple.sql
```

**Expected Output:**
```
NOTICE: Using program: Emergency Medicine (ID: xxx-xxx-xxx)
NOTICE: Successfully seeded 13 faculty members
```

## Step 3: Verify Faculty Created

```sql
SELECT COUNT(*) FROM public.faculty;
-- Should return: 13

SELECT full_name, email FROM public.faculty ORDER BY full_name;
```

## Quick Fix: Create Program Manually

If you don't have any programs, you can create one quickly:

```sql
-- Create health system
INSERT INTO public.health_systems (name, location)
VALUES ('Memorial Healthcare System', 'Hollywood, FL')
RETURNING id;

-- Copy the ID from above, then create program
INSERT INTO public.programs (name, health_system_id, specialty)
VALUES ('Emergency Medicine', 'PASTE-ID-HERE', 'Emergency Medicine')
RETURNING id;
```

Then run the faculty seed script again.

## Recommended: Run Full Setup

If you haven't already, run the complete resident import which creates everything:

```bash
# In Supabase SQL Editor
-- Run: scripts/import-memorial-residents.sql
```

This creates:
- 1 Health System (Memorial Healthcare System)
- 1 Program (Emergency Medicine)
- 4 Academic Classes (2025, 2026, 2027, 2028)
- 50 Residents

Then you can run the faculty seed script.

---

**Next Steps After Faculty Seeded:**
1. Import historical data (faculty assessments + self-assessments)
2. Create API endpoints
3. Test forms

See `QUICK-START-FACULTY-SETUP.md` for complete instructions.

