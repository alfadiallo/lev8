# Setup Analytics Dashboard - Step by Step

## ✅ Prerequisites Checklist

Before starting, ensure you have:
- [ ] Supabase project configured
- [ ] Database connection working
- [ ] At least one resident in the system
- [ ] Node.js and npm installed

---

## Step 1: Install Dependencies

Run this in your terminal:

```bash
cd /Users/alfadiallo/lev8
npm install recharts
```

**Expected output:** `added 1 package...`

---

## Step 2: Run Database Migrations

### Option A: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Run each of these files **in order**:

#### Migration 1: Analytics Foundation

Copy and paste from: `supabase/migrations/20250115000002_analytics_foundation.sql`

**What it does:**
- Creates 9 new analytics tables
- Adds helper functions for PGY calculation
- Sets up indexes for performance

#### Migration 2: Row-Level Security

Copy and paste from: `supabase/migrations/20250115000003_analytics_rls_policies.sql`

**What it does:**
- Enables RLS on all analytics tables
- Creates policies for resident/faculty/admin access

#### Migration 3: Seed Rotation Types

Copy and paste from: `scripts/seed-analytics-config.sql`

**What it does:**
- Populates rotation_types with common evaluation types
- Classifies them as On-Service or Off-Service

### Option B: Via Supabase CLI (If you have it installed)

```bash
supabase db push
```

---

## Step 3: Verify Tables Were Created

Run this query in Supabase SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'rotation_types',
    'imported_comments',
    'structured_ratings',
    'period_scores',
    'swot_summaries',
    'ite_scores',
    'rosh_completion_snapshots',
    'form_tokens',
    'faculty_annotations'
  )
ORDER BY table_name;
```

**Expected result:** Should return 9 rows (all table names)

---

## Step 4: Get a Test Resident ID

Find a resident to test with:

```sql
SELECT 
  r.id as resident_id,
  up.full_name,
  ac.class_year,
  ac.graduation_date
FROM public.residents r
JOIN public.user_profiles up ON up.id = r.user_id
LEFT JOIN public.academic_classes ac ON ac.id = r.class_id
LIMIT 5;
```

**Copy one of the `resident_id` values** - you'll need it for the next step.

---

## Step 5: Create Test Data

Replace `'PASTE_RESIDENT_ID_HERE'` with the actual UUID from Step 4, then run:

### Test SWOT Summary

```sql
INSERT INTO public.swot_summaries (
  resident_id,
  period_label,
  strengths,
  weaknesses,
  opportunities,
  threats,
  n_comments_analyzed,
  ai_confidence,
  ai_model_version
) VALUES (
  'PASTE_RESIDENT_ID_HERE',
  'PGY-2 Fall',
  '[
    {
      "description": "Excellent bedside manner and patient communication skills",
      "frequency": 5,
      "supporting_quotes": [
        {"quote": "Shows exceptional empathy with distressed patients", "citation": "Dr. Sarah Johnson, ED Attending - 10/15/2024"},
        {"quote": "Takes time to explain procedures clearly", "citation": "Dr. Michael Chen, Trauma Surgery - 10/22/2024"}
      ]
    },
    {
      "description": "Strong clinical reasoning and differential diagnosis",
      "frequency": 4,
      "supporting_quotes": [
        {"quote": "Consistently develops thorough differential diagnoses", "citation": "Dr. Lisa Rodriguez, Emergency Medicine - 11/03/2024"}
      ]
    },
    {
      "description": "Effective team leadership during resuscitations",
      "frequency": 3,
      "supporting_quotes": [
        {"quote": "Calm and directive during critical situations", "citation": "Dr. James Park, Critical Care - 10/29/2024"}
      ]
    }
  ]'::jsonb,
  '[
    {
      "description": "Documentation often delayed beyond shift end",
      "frequency": 6,
      "supporting_quotes": [
        {"quote": "Charts frequently completed hours after shift", "citation": "Dr. Emily Williams, Program Director - 10/18/2024"}
      ]
    },
    {
      "description": "Could improve efficiency with routine procedures",
      "frequency": 2,
      "supporting_quotes": []
    }
  ]'::jsonb,
  '[
    {
      "description": "Potential to develop expertise in ultrasound-guided procedures",
      "frequency": 2,
      "supporting_quotes": [
        {"quote": "Shows interest and aptitude for point-of-care ultrasound", "citation": "Dr. Robert Kim, Ultrasound Director - 11/01/2024"}
      ]
    },
    {
      "description": "Leadership potential for chief resident role",
      "frequency": 1,
      "supporting_quotes": []
    }
  ]'::jsonb,
  '[
    {
      "description": "Workload balance may lead to burnout if not addressed",
      "frequency": 1,
      "supporting_quotes": []
    }
  ]'::jsonb,
  12,
  0.87,
  'claude-sonnet-4-20250514'
);
```

### Test Period Scores

```sql
INSERT INTO public.period_scores (
  resident_id,
  period_label,
  faculty_eq_avg,
  faculty_pq_avg,
  faculty_iq_avg,
  faculty_n_raters,
  self_eq_avg,
  self_pq_avg,
  self_iq_avg,
  self_faculty_gap_eq,
  self_faculty_gap_pq,
  self_faculty_gap_iq,
  ai_eq_avg,
  ai_pq_avg,
  ai_iq_avg,
  ai_n_comments,
  ai_confidence_avg
) VALUES (
  'PASTE_RESIDENT_ID_HERE',
  'PGY-2 Fall',
  4.2,
  4.5,
  4.0,
  5,
  3.8,
  4.2,
  4.3,
  -0.4,
  -0.3,
  0.3,
  4.1,
  4.3,
  3.9,
  12,
  0.85
);
```

### Test ITE Scores

```sql
INSERT INTO public.ite_scores (
  resident_id,
  test_date,
  academic_year,
  pgy_level,
  raw_score,
  percentile
) VALUES 
(
  'PASTE_RESIDENT_ID_HERE',
  '2024-10-15',
  '2024-2025',
  'PGY-2',
  425,
  72.5
),
(
  'PASTE_RESIDENT_ID_HERE',
  '2023-10-12',
  '2023-2024',
  'PGY-1',
  380,
  65.0
);
```

### Test ROSH Completion (Optional)

```sql
INSERT INTO public.rosh_completion_snapshots (
  resident_id,
  snapshot_date,
  academic_year,
  pgy_level,
  completion_percent
) VALUES 
(
  'PASTE_RESIDENT_ID_HERE',
  '2024-11-01',
  '2024-2025',
  'PGY-2',
  68.5
),
(
  'PASTE_RESIDENT_ID_HERE',
  '2024-10-01',
  '2024-2025',
  'PGY-2',
  45.2
);
```

---

## Step 6: Test the Dashboard

1. **Start your dev server** (if not running):
   ```bash
   npm run dev
   ```

2. **Navigate to:**
   ```
   http://localhost:3000/modules/understand/overview
   ```

3. **Select "Individual Resident" view**

4. **Choose the test resident** from the dropdown

5. **Click "View Analytics"**

### What You Should See:

#### SWOT Tab
- ✅ Period selector showing "PGY-2 Fall"
- ✅ Green "Strengths" card with 3 items
- ✅ Red "Weaknesses" card with 2 items
- ✅ Blue "Opportunities" card with 2 items
- ✅ Orange "Threats" card with 1 item
- ✅ Click to expand citations

#### EQ + PQ + IQ Tab
- ✅ Radar chart comparing Faculty (4.2, 4.5, 4.0) vs Self (3.8, 4.2, 4.3)
- ✅ Gap Analysis showing underestimate in EQ/PQ, overestimate in IQ
- ✅ Detailed scores table
- ✅ ITE score display: 72.5% percentile
- ✅ ITE history with 2 entries

#### Competencies Tab
- ✅ Placeholder message (feature coming soon)

---

## Step 7: Add More Test Data (Optional)

### Create Another Period

```sql
-- PGY-2 Spring period
INSERT INTO public.swot_summaries (
  resident_id,
  period_label,
  strengths,
  weaknesses,
  opportunities,
  threats,
  n_comments_analyzed,
  ai_confidence
) VALUES (
  'PASTE_RESIDENT_ID_HERE',
  'PGY-2 Spring',
  '[{"description": "Improved documentation timeliness", "frequency": 4, "supporting_quotes": []}]'::jsonb,
  '[{"description": "Still needs work on complex procedures", "frequency": 2, "supporting_quotes": []}]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  8,
  0.82
);

INSERT INTO public.period_scores (
  resident_id,
  period_label,
  faculty_eq_avg,
  faculty_pq_avg,
  faculty_iq_avg,
  faculty_n_raters
) VALUES (
  'PASTE_RESIDENT_ID_HERE',
  'PGY-2 Spring',
  4.4,
  4.7,
  4.2,
  6
);
```

Now the period selector should show both Fall and Spring!

---

## Troubleshooting

### Issue: "No data available"

**Solution:** 
1. Check that you replaced `'PASTE_RESIDENT_ID_HERE'` with actual UUID
2. Verify data was inserted: `SELECT * FROM swot_summaries WHERE resident_id = 'YOUR_ID';`

### Issue: Charts look simplified

**Solution:** Install recharts: `npm install recharts`

### Issue: Can't see resident in dropdown

**Solution:** 
1. Verify resident exists: `SELECT * FROM residents JOIN user_profiles ON user_profiles.id = residents.user_id;`
2. Check RLS policies allow access

### Issue: API returns 403 Forbidden

**Solution:**
1. Check you're logged in
2. Verify your role: `SELECT role FROM user_profiles WHERE id = auth.uid();`
3. Residents can only view their own data

### Issue: Migration fails with "relation already exists"

**Solution:** Tables might already exist. Check with:
```sql
SELECT * FROM swot_summaries LIMIT 1;
```
If it returns data or "no rows", the table exists. You can skip that migration.

---

## Verification Checklist

After setup, verify:

- [ ] All 9 analytics tables exist in database
- [ ] Recharts package installed (`package.json` includes it)
- [ ] Test SWOT summary inserted successfully
- [ ] Test period scores inserted successfully
- [ ] Test ITE scores inserted successfully
- [ ] Can navigate to `/modules/understand/overview`
- [ ] Can select resident from dropdown
- [ ] SWOT tab displays data correctly
- [ ] Citations expand/collapse on click
- [ ] Scores tab shows radar chart
- [ ] Gap analysis displays correctly
- [ ] ITE scores appear in blue box
- [ ] Period selector filters data

---

## What's Next?

Once the dashboard is working with test data, you can:

1. **Add more residents** - Create test data for multiple residents
2. **Implement Class view** - Build class aggregation logic
3. **Implement Program view** - Build program-wide statistics
4. **Phase 5: Data Import** - Build CSV upload for historical data
5. **Phase 6: AI Analysis** - Integrate Claude API for automated SWOT
6. **Phase 7: Public Forms** - Build evaluation forms for faculty
7. **Phase 8: ITE Management** - Build bulk entry interface

---

## Success! 🎉

If you can see your test data displayed beautifully in the dashboard, you're ready to go!

**Next:** Either add real data or implement optional phases.

For questions, see:
- `docs/ANALYTICS-ENGINE-IMPLEMENTATION.md` - Technical details
- `docs/OVERVIEW-QUICK-START.md` - User guide
- `docs/_guidance/Understand.../Overview/0_-_MASTER_INDEX.md` - Original spec


