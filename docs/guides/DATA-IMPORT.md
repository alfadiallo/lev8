# Data Import Guide

**Complete guide to importing residents, faculty, evaluations, and scores**

---

## Overview

This guide covers importing all data types into the Lev8 platform:

1. Residents and Faculty
2. MedHub Evaluation Comments
3. EQ+PQ+IQ Ratings (Faculty and Self-Assessments)
4. ITE Scores
5. Clinical Cases
6. AI SWOT Analysis

---

## 1. Import Residents

**File:** `scripts/import-memorial-residents.sql`

**What it does:**
- Creates Memorial Healthcare System
- Creates Emergency Medicine Residency program
- Creates 4 academic classes (2024-2028)
- Imports 50 residents with user profiles

**Run:**
```sql
-- In Supabase SQL Editor
-- Copy/paste contents of scripts/import-memorial-residents.sql
```

**Verify:**
```sql
SELECT COUNT(*) FROM residents;
-- Expected: 50

SELECT COUNT(*) FROM user_profiles WHERE role = 'resident';
-- Expected: 50

SELECT 
  ac.graduation_date,
  COUNT(*) as resident_count
FROM residents r
JOIN academic_classes ac ON r.class_id = ac.id
GROUP BY ac.graduation_date
ORDER BY ac.graduation_date;
-- Should show distribution across classes
```

---

## 2. Import Faculty

**File:** `scripts/seed-faculty-simple.sql`

**What it does:**
- Imports 13 faculty members
- Links to Emergency Medicine program
- Creates faculty table entries

**Run:**
```sql
-- In Supabase SQL Editor
-- Copy/paste contents of scripts/seed-faculty-simple.sql
```

**Verify:**
```sql
SELECT COUNT(*) FROM faculty;
-- Expected: 13

SELECT full_name, credentials, email 
FROM faculty 
ORDER BY full_name;
-- Should show all 13 faculty
```

---

## 3. Import MedHub Evaluation Comments

MedHub comments require a two-step process: staging and processing.

### Step 1: Create Staging Table

**File:** `scripts/create-medhub-staging-table.sql`

```sql
-- Run in Supabase SQL Editor
-- Copy/paste contents
```

### Step 2: Upload CSV via Supabase UI

1. Go to Supabase Dashboard → Table Editor
2. Select `medhub_staging` table
3. Click "Insert" → "Import data from CSV"
4. Upload your MedHub export CSV
5. Map columns (should auto-match)
6. Click "Import"

### Step 3: Process Staging Data

**File:** `scripts/process-medhub-staging.sql`

This script:
- Parses MedHub names ("Dr. Last, First")
- Matches to residents in database
- Calculates PGY level from date
- Determines period (Fall/Spring)
- Inserts into `imported_comments`

```sql
-- Run in Supabase SQL Editor
-- Copy/paste contents of scripts/process-medhub-staging.sql
```

**Verify:**
```sql
SELECT COUNT(*) FROM imported_comments;
-- Expected: 5,860+ (depending on your data)

SELECT 
  up.full_name,
  COUNT(*) as comment_count,
  MIN(ic.date_completed) as earliest,
  MAX(ic.date_completed) as latest
FROM imported_comments ic
JOIN residents r ON ic.resident_id = r.id
JOIN user_profiles up ON r.user_id = up.id
GROUP BY up.full_name
ORDER BY comment_count DESC
LIMIT 10;
-- Should show top 10 residents by comment count
```

### Handling Name Mismatches

If some names don't match, add manual overrides:

```sql
INSERT INTO medhub_name_overrides (medhub_name, resident_id)
VALUES 
  ('Dr. Smith, John', 'resident-uuid-here'),
  ('Dr. Doe, Jane', 'another-resident-uuid');
```

Then re-run the processing script.

---

## 4. Import EQ+PQ+IQ Ratings

### Faculty Assessments

**File:** `scripts/import-faculty-assessments.ts`

**Prerequisites:**
- Faculty table populated
- Residents table populated
- CSV file: `EQPQIQ Faculty Assessment of Residents.csv`

**Run:**
```bash
# From project root
npx tsx scripts/import-faculty-assessments.ts
```

**What it does:**
- Parses faculty CSV
- Normalizes names (strips MD, DO, MPH, PhD)
- Matches faculty and residents
- Handles missing data (empty cells → NULL)
- Handles duplicates (keeps most complete/recent)
- Inserts into `structured_ratings` with `rater_type='faculty'`

**Output:**
```
✓ Parsed 267 faculty assessments
✓ Matched 13 faculty members
✓ Matched 31 residents
✓ Inserted 267 ratings
```

---

### Self-Assessments

**File:** `scripts/import-self-assessments.ts`

**Prerequisites:**
- Residents table populated
- CSV file: `EQPQIQ Resident Self Assessment.csv`

**Run:**
```bash
# From project root
npx tsx scripts/import-self-assessments.ts
```

**What it does:**
- Parses resident CSV
- Matches residents by email
- Extracts period from timestamp
- Handles missing data
- Handles duplicates
- Inserts into `structured_ratings` with `rater_type='self'`

**Output:**
```
✓ Parsed 52 self-assessments
✓ Matched 31 residents
✓ Inserted 52 ratings
```

---

### Verify Ratings Import

```sql
SELECT 
  rater_type,
  COUNT(*) as count,
  COUNT(DISTINCT resident_id) as unique_residents
FROM structured_ratings
GROUP BY rater_type;
-- Expected:
-- faculty: 267 ratings, 31 residents
-- self: 52 ratings, 31 residents

SELECT 
  up.full_name,
  COUNT(CASE WHEN sr.rater_type = 'faculty' THEN 1 END) as faculty_ratings,
  COUNT(CASE WHEN sr.rater_type = 'self' THEN 1 END) as self_ratings
FROM structured_ratings sr
JOIN residents r ON sr.resident_id = r.id
JOIN user_profiles up ON r.user_id = up.id
GROUP BY up.full_name
ORDER BY faculty_ratings DESC
LIMIT 10;
-- Should show residents with most ratings
```

---

### Aggregate Period Scores

After importing structured ratings, aggregate them for the dashboard:

**File:** `scripts/aggregate-period-scores.sql`

```sql
-- Run in Supabase SQL Editor
-- Copy/paste contents
```

**What it does:**
- Groups faculty ratings by resident and period
- Calculates averages for EQ, PQ, IQ
- Builds JSONB detail with all 15 attributes
- Groups self-assessments similarly
- Calculates gap analysis (self - faculty)
- Inserts/updates `period_scores`

**Verify:**
```sql
SELECT COUNT(*) FROM period_scores;
-- Expected: 60+ (depending on data)

SELECT 
  up.full_name,
  ps.period_label,
  ps.faculty_eq_avg,
  ps.self_eq_avg,
  ps.self_faculty_gap_eq
FROM period_scores ps
JOIN residents r ON ps.resident_id = r.id
JOIN user_profiles up ON r.user_id = up.id
WHERE ps.faculty_eq_avg IS NOT NULL 
  AND ps.self_eq_avg IS NOT NULL
ORDER BY up.full_name, ps.period_label
LIMIT 10;
-- Should show aggregated scores with gaps
```

---

## 5. Import ITE Scores

**File:** `scripts/import-ite-scores.sql`

**What it does:**
- Imports ITE exam scores for all residents
- Links to academic years and PGY levels
- Includes percentile and raw scores

```sql
-- Run in Supabase SQL Editor
-- Copy/paste contents
```

**Verify:**
```sql
SELECT COUNT(*) FROM ite_scores;
-- Expected: 100+ scores

SELECT 
  up.full_name,
  its.test_date,
  its.pgy_level,
  its.percentile,
  its.raw_score
FROM ite_scores its
JOIN residents r ON its.resident_id = r.id
JOIN user_profiles up ON r.user_id = up.id
ORDER BY up.full_name, its.test_date;
-- Should show ITE history for residents
```

---

## 6. Import Clinical Cases

**File:** `scripts/seed-clinical-cases.sql`

**What it does:**
- Imports 8 Emergency Medicine clinical cases
- Includes case details, learning objectives, difficulty levels

```sql
-- Run in Supabase SQL Editor
-- Copy/paste contents
```

**Verify:**
```sql
SELECT COUNT(*) FROM clinical_cases;
-- Expected: 8

SELECT title, difficulty, estimated_duration_minutes 
FROM clinical_cases 
ORDER BY difficulty;
-- Should show all 8 cases
```

---

## 7. Run AI SWOT Analysis

**File:** `scripts/analyze-larissa-comments.ts`

**Prerequisites:**
- `imported_comments` table populated
- Anthropic API key in `.env.local`
- Residents with comments

**Run:**
```bash
# From project root
node -r dotenv/config scripts/analyze-larissa-comments.ts
```

**What it does:**
- Fetches comments for specified resident(s)
- Groups by period_label
- Sends to Claude API for analysis
- Generates brutally honest SWOT analysis
- Extracts supporting quotes with citations
- Inserts into `swot_summaries`

**Cost:** ~$2-3 per resident (all periods)

**Modify for All Residents:**
Edit the script to loop through all residents instead of just one.

**Verify:**
```sql
SELECT COUNT(*) FROM swot_summaries;
-- Expected: 30+ (depending on residents analyzed)

SELECT 
  up.full_name,
  ss.period_label,
  jsonb_array_length(ss.strengths) as strength_count,
  jsonb_array_length(ss.weaknesses) as weakness_count
FROM swot_summaries ss
JOIN residents r ON ss.resident_id = r.id
JOIN user_profiles up ON r.user_id = up.id
ORDER BY up.full_name, ss.period_label;
-- Should show SWOT summaries
```

---

## Complete Import Checklist

Use this checklist to track your progress:

- [ ] 1. Import residents (50)
- [ ] 2. Import faculty (13)
- [ ] 3. Create MedHub staging table
- [ ] 4. Upload MedHub CSV
- [ ] 5. Process MedHub staging data
- [ ] 6. Verify imported_comments (5,860+)
- [ ] 7. Import faculty assessments (267)
- [ ] 8. Import self-assessments (52)
- [ ] 9. Verify structured_ratings (319)
- [ ] 10. Aggregate period scores
- [ ] 11. Verify period_scores (60+)
- [ ] 12. Import ITE scores
- [ ] 13. Import clinical cases (8)
- [ ] 14. Run AI SWOT analysis
- [ ] 15. Verify swot_summaries (30+)

---

## Troubleshooting

### Name Matching Failures

**Problem:** Some names from CSV don't match database

**Solution:**
1. Check exact spelling in database:
   ```sql
   SELECT full_name FROM user_profiles WHERE role = 'resident';
   ```

2. Add manual overrides:
   ```sql
   INSERT INTO medhub_name_overrides (medhub_name, resident_id)
   VALUES ('Dr. Lastname, Firstname', 'uuid-from-database');
   ```

3. Re-run processing script

---

### Duplicate Key Violations

**Problem:** Trying to import data that already exists

**Solution:**
1. Clear existing data:
   ```sql
   DELETE FROM imported_comments;
   DELETE FROM structured_ratings;
   DELETE FROM period_scores;
   DELETE FROM swot_summaries;
   DELETE FROM ite_scores;
   ```

2. Re-run import scripts

---

### CSV Upload Failures

**Problem:** Supabase UI rejects CSV

**Solution:**
1. Verify CSV format matches table columns exactly
2. Check for special characters in data
3. Ensure date formats are consistent
4. Try smaller batches if file is large

---

### AI Analysis Errors

**Problem:** Claude API errors or timeouts

**Solution:**
1. Verify API key is correct
2. Check API rate limits
3. Reduce batch size (analyze fewer residents at once)
4. Add retry logic with delays

---

## Next Steps

After data import:

1. **[Dashboard Usage Guide](DASHBOARD-USAGE.md)** - Learn to use the analytics dashboard
2. **[Setup Guide](../SETUP.md)** - Complete setup reference
3. **[Analytics Documentation](../ANALYTICS.md)** - Technical details

---

**Data import complete!** ✅

Your Lev8 platform now has real data and is ready for use.


