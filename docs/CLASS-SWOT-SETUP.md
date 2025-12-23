# Class-Level SWOT Analysis by PGY Year

**Created:** January 24, 2025  
**Status:** Complete - Ready for Use

---

## Overview

The class-level SWOT analysis feature aggregates all resident feedback for an entire graduation class and generates SWOT analysis broken down by PGY training year (PGY-3, PGY-2, PGY-1).

**Key Features:**
- Aggregates all comments from all residents in a class for each PGY year
- Uses correct date ranges based on graduation year (July 1 - June 30)
- Displays in same UI format as individual resident SWOT pages
- Fully anonymized data sent to Claude API
- Three separate sections: PGY-3, PGY-2, PGY-1

---

## Date Range Logic

Each PGY year spans from July 1 to June 30:

| Graduation Class | Training Year | Start Date | End Date |
|-----------------|---------------|------------|----------|
| Class of 2026 | PGY-1 | 1-Jul-23 | 30-Jun-24 |
| Class of 2026 | PGY-2 | 1-Jul-24 | 30-Jun-25 |
| Class of 2026 | PGY-3 | 1-Jul-25 | 30-Jun-26 |

---

## Implementation Summary

### 1. Database Schema Update

**Migration:** `supabase/migrations/20250124000002_class_level_swot.sql`

**Changes:**
- Added `class_year` column to `swot_summaries` table
- Made `resident_id` nullable
- Added constraint: either `resident_id` OR `class_year` must be set (mutually exclusive)
- Added index for class-level queries
- Updated unique constraint to handle both resident and class levels

### 2. API Endpoint

**File:** `app/api/analytics/swot/class/[year]/route.ts`

**Endpoint:** `GET /api/analytics/swot/class/[year]`

**Response Format:**
```json
{
  "swot": [
    {
      "period_label": "PGY-3",
      "strengths": [...],
      "weaknesses": [...],
      "opportunities": [...],
      "threats": [...],
      "n_comments_analyzed": 150,
      "ai_confidence": 0.85
    },
    {
      "period_label": "PGY-2",
      ...
    },
    {
      "period_label": "PGY-1",
      ...
    }
  ]
}
```

### 3. Analysis Script

**File:** `scripts/analyze-class-swot.ts`

**Features:**
- Fetches all residents in specified graduation class
- Aggregates comments by PGY year using correct date ranges
- Applies anonymization protocol (no individual names sent to Claude)
- Generates SWOT analysis for each PGY year
- Stores results in `swot_summaries` table with `class_year` set

### 4. Frontend UI

**File:** `app/(dashboard)/modules/understand/overview/class/[year]/page.tsx`

**Features:**
- Reuses existing `SWOTTab` component
- Displays three sections: PGY-3, PGY-2, PGY-1
- Shows number of comments and residents analyzed
- Includes helpful message if no data available yet

---

## Setup Steps

### Step 1: Run Database Migration

In Supabase SQL Editor, run:

```bash
supabase/migrations/20250124000002_class_level_swot.sql
```

### Step 2: Generate Class-Level SWOT

Run the analysis script for a specific class:

```bash
npx tsx --env-file=.env.local scripts/analyze-class-swot.ts 2026
```

**Arguments:**
- First argument: Graduation year (defaults to 2026 if not provided)

**Example for multiple classes:**
```bash
npx tsx --env-file=.env.local scripts/analyze-class-swot.ts 2026
npx tsx --env-file=.env.local scripts/analyze-class-swot.ts 2027
npx tsx --env-file=.env.local scripts/analyze-class-swot.ts 2028
```

### Step 3: View Results

Navigate to:
```
http://localhost:3000/modules/understand/overview/class/2026
```

Click on the "Aggregated SWOT" tab to see the PGY-year breakdown.

---

## Anonymization Protocol

### Data Sent to Claude:
- **Class identifier:** "Class of 2026" (no individual resident names)
- **Period label:** "PGY-2 year (10 residents)"
- **Comments:** All PHI scrubbed, dates generalized
- **No individual attribution:** Comments are aggregated without identifying which resident said what

### Example Prompt:
```
You are analyzing aggregated feedback for Class of 2026 during their PGY-2 year.

Total residents: 10
Total evaluations: 150
Training period: PGY-2 year

Aggregated comments:
[Comment 1] [Mid-rotation period] "Resident demonstrated..."
[Comment 2] [Early in rotation period] "Strong clinical..."
...
```

### Audit Trail:
All class-level analyses are logged in `ai_anonymization_log` with:
- `pseudonym`: "Class of 2026"
- `period_label`: "PGY-2"
- `anonymization_status`: 'success'

---

## Usage

### For Program Directors / Faculty

1. Navigate to **Understand → Overview**
2. Select **"Class View"**
3. Choose a graduation year (e.g., "Class of 2026")
4. Click **"Aggregated SWOT"** tab
5. Select PGY year from dropdown (PGY-3, PGY-2, or PGY-1)
6. View aggregated strengths, weaknesses, opportunities, and threats

### Understanding the Data

- **PGY-3:** Most recent year, current performance
- **PGY-2:** Middle year, showing progression
- **PGY-1:** First year, baseline performance

Each section shows:
- Common themes across all residents in the class
- Number of comments analyzed
- Number of residents included
- AI confidence score

---

## Verification

After setup, verify the implementation:

1. **Database:** Check class-level SWOT exists
   ```sql
   SELECT 
     class_year,
     period_label,
     n_comments_analyzed,
     ai_confidence
   FROM public.swot_summaries
   WHERE class_year IS NOT NULL
   ORDER BY class_year, period_label DESC;
   ```

2. **API:** Test the endpoint
   ```bash
   curl http://localhost:3000/api/analytics/swot/class/2026
   ```

3. **UI:** Navigate to `/modules/understand/overview/class/2026`
   - Verify "Aggregated SWOT" tab loads
   - Confirm PGY-3, PGY-2, PGY-1 appear in dropdown
   - Check SWOT content displays correctly

---

## Troubleshooting

### Issue: "No SWOT data available yet"
- **Solution:** Run the analysis script: `npx tsx --env-file=.env.local scripts/analyze-class-swot.ts 2026`
- **Verify:** Check that residents exist for that class and have comments in the date ranges

### Issue: Script says "Skipping (< 10 comments)"
- **Solution:** This PGY year doesn't have enough data yet. This is normal for future years or classes with limited data.
- **Action:** Wait until more comments are imported, or focus on PGY years with sufficient data

### Issue: API returns empty array
- **Solution:** Verify the migration was run and `class_year` column exists
- **Check:** Run the verification SQL query above

---

## Summary

✅ **Complete Implementation:**
- Database schema supports class-level SWOT
- Analysis script aggregates by PGY year
- API endpoint returns PGY-year data
- UI displays three sections (PGY-3, PGY-2, PGY-1)
- Full anonymization protocol applied

**Next Steps:**
1. Run the database migration
2. Generate class-level SWOT for your classes
3. View results in the dashboard

For questions or issues, refer to this guide or check the implementation files listed above.


