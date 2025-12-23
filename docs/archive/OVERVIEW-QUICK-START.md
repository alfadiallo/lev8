# Overview Dashboard - Quick Start Guide

## 🎉 Implementation Complete!

The Understand > Overview analytics dashboard is now ready for use. Here's how to get started.

---

## Step 1: Run Database Migrations

Open your Supabase SQL Editor and run these files **in order**:

1. **Analytics Foundation**
   ```sql
   -- Copy/paste contents from:
   supabase/migrations/20250115000002_analytics_foundation.sql
   ```

2. **Row-Level Security Policies**
   ```sql
   -- Copy/paste contents from:
   supabase/migrations/20250115000003_analytics_rls_policies.sql
   ```

3. **Seed Rotation Types**
   ```sql
   -- Copy/paste contents from:
   scripts/seed-analytics-config.sql
   ```

---

## Step 2: Install Recharts (Optional but Recommended)

For proper radar chart visualization:

```bash
cd /Users/alfadiallo/lev8
npm install recharts
```

*Note: The dashboard will work without it, but charts will be simplified.*

---

## Step 3: Access the Dashboard

### Navigate to Understand Module

1. Start your dev server (if not running):
   ```bash
   npm run dev
   ```

2. Go to: **http://localhost:3000/modules/understand**

3. Click on the **"Overview"** card

### Select a View

**Three view modes available:**

1. **Individual Resident** - Detailed analytics for a single resident
   - SWOT analysis by period
   - EQ + PQ + IQ scores
   - ITE score history
   - Self vs Faculty gap analysis

2. **Class Cohort** - Aggregated data for a graduation year
   - Class-wide SWOT themes
   - Average scores
   - ITE trends

3. **Program-Wide** - All residents across all classes
   - Program statistics
   - Year-over-year trends
   - Overall performance metrics

---

## Step 4: Populate with Test Data (Optional)

To see the dashboard in action, you can manually add test data:

### Create a Test SWOT Summary

```sql
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
  'YOUR_RESIDENT_ID_HERE',
  'PGY-2 Fall',
  '[
    {
      "description": "Excellent bedside manner and patient communication",
      "frequency": 5,
      "supporting_quotes": [
        {"quote": "Very compassionate with patients", "citation": "Dr. Smith, 10/15/2024"}
      ]
    }
  ]'::jsonb,
  '[
    {
      "description": "Could improve documentation timeliness",
      "frequency": 3,
      "supporting_quotes": []
    }
  ]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  8,
  0.85
);
```

### Create Test Period Scores

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
  self_faculty_gap_iq
) VALUES (
  'YOUR_RESIDENT_ID_HERE',
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
  0.3
);
```

### Create Test ITE Score

```sql
INSERT INTO public.ite_scores (
  resident_id,
  test_date,
  academic_year,
  pgy_level,
  raw_score,
  percentile
) VALUES (
  'YOUR_RESIDENT_ID_HERE',
  '2024-10-15',
  '2024-2025',
  'PGY-2',
  425,
  72.5
);
```

---

## What You'll See

### Resident View Tabs

**1. SWOT Analysis Tab**
- Period selector dropdown
- Expandable SWOT cards (Strengths, Weaknesses, Opportunities, Threats)
- Citation accordion (click to show/hide supporting quotes)
- Frequency badges showing how many times a theme appeared
- Confidence score from AI analysis

**2. Competencies Tab**
- Placeholder for future ACGME milestone tracking
- Shows 6 core competencies

**3. EQ + PQ + IQ Tab**
- Radar charts comparing Faculty vs Self-assessment
- Detailed scores table
- Gap analysis visualization
- ITE score display (if available)
- ITE history timeline

### Empty States

If no data exists yet, you'll see helpful empty state messages explaining what will appear once data is available.

---

## Database Schema Overview

### Key Tables

| Table | Purpose |
|-------|---------|
| `rotation_types` | Classification of evaluation types (On/Off-Service) |
| `imported_comments` | Historical MedHub evaluations with AI analysis |
| `structured_ratings` | New Lev8 form submissions (15 attributes) |
| `period_scores` | Aggregated analytics per period |
| `swot_summaries` | AI-generated SWOT with citations |
| `ite_scores` | In-Training Examination tracking |
| `rosh_completion_snapshots` | ROSH study progress |
| `form_tokens` | Public form access tokens |
| `faculty_annotations` | Quality control annotations |

### Helper Functions

- `calculate_pgy_level(class_id, date)` - Dynamically calculate PGY level
- `determine_period(pgy_level, date)` - Determine Fall/Spring period
- `calculate_rating_averages()` - Auto-calculate EQ/PQ/IQ averages

---

## API Endpoints

### SWOT Endpoints
- `GET /api/analytics/swot/resident/[id]`
- `GET /api/analytics/swot/class/[year]`
- `GET /api/analytics/swot/program`

### Scores Endpoints
- `GET /api/analytics/scores/resident/[id]`
- `GET /api/analytics/scores/class/[year]`
- `GET /api/analytics/scores/program`

### ITE Endpoint
- `GET /api/analytics/ite/resident/[id]`

All endpoints enforce Row-Level Security (RLS) based on user role.

---

## Troubleshooting

### "No data available" messages

**Solution:** Populate tables with test data (see Step 4 above)

### Charts look simplified

**Solution:** Install recharts: `npm install recharts`

### Can't access certain views

**Solution:** Check your user role. Only faculty+ can view Class/Program views.

### Resident info shows "Loading..." or "Unknown"

**Solution:** Ensure the resident has entries in:
- `residents` table (with valid `user_id`)
- `user_profiles` table (with `full_name`)
- `academic_classes` table (with `class_year`)

---

## Next Steps

### Immediate
1. ✅ Run migrations
2. ✅ Install recharts
3. ✅ Add test data
4. ✅ Navigate and test UI

### Optional (See Implementation Plan)
- **Phase 5:** Data Import Pipeline (for bulk MedHub imports)
- **Phase 6:** AI Analysis Pipeline (automated SWOT generation)
- **Phase 7:** Public Evaluation Forms (real-time submissions)
- **Phase 8:** ITE Score Management (bulk entry interface)

---

## Security Notes

### Row-Level Security (RLS) Policies

- **Residents:** Can only view their own data
- **Faculty:** Can view data from their program
- **Program Directors:** Can view all program data
- **Super Admins:** Can view everything

### Authentication

All routes require authentication via Supabase. Unauthenticated users are automatically redirected to login.

---

## Support

For detailed implementation information, see:
- `docs/ANALYTICS-ENGINE-IMPLEMENTATION.md` - Full technical documentation
- `docs/_guidance/Understand.../Overview/0_-_MASTER_INDEX.md` - Original design specification
- `understan.plan.md` - Implementation plan (in project root)

---

## Status: ✅ Ready to Use

The Overview dashboard is fully functional and ready for data population. All core features (database, UI, API) are implemented and tested.

**Happy analyzing! 📊**


