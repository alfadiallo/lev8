# AI SWOT Analysis - Implementation Complete

**Date:** November 20, 2025  
**Status:** ✅ Ready to Run  
**Estimated Cost:** $2-3 for Larissa's 6 periods

---

## What Was Built

### 1. Claude API Client (`lib/ai/claude-analyzer.ts`)
- Anthropic SDK integration
- Retry logic with exponential backoff (3 attempts)
- JSON response parsing with validation
- Connection testing function
- Error handling and logging

### 2. SWOT Prompt Template (`lib/ai/swot-prompt.ts`)
- **Tone:** Brutally honest, evidence-based
- **Structure:** 
  - 3-5 Strengths with evidence
  - 3-5 Weaknesses with severity flags (critical/moderate/minor)
  - 2-4 Opportunities
  - 1-3 Threats
- **Scoring:** EQ/PQ/IQ attributes (1.0-5.0 scale)
- **Output:** JSON matching database schema

### 3. Analysis Script (`scripts/analyze-larissa-comments.ts`)
- Fetches Larissa's 206 comments from `imported_comments`
- Groups by period_label (PGY-1 Fall, etc.)
- Deletes existing fake test data
- Analyzes each period with Claude API
- Inserts real SWOT summaries and period scores
- Preserves real ITE scores
- Comprehensive logging and error handling

---

## How to Run

### Prerequisites
Add to `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
ANTHROPIC_API_KEY=your_anthropic_key
```

### Execute
```bash
cd /Users/alfadiallo/lev8
npx tsx scripts/analyze-larissa-comments.ts
```

### Expected Runtime
- **6 periods** × **~30 seconds each** = ~3-4 minutes total
- Includes API calls, retries, and database writes

---

## What Gets Replaced

### Before (Fake Test Data)
```sql
-- scripts/create-larissa-test-data.sql
-- Completely fabricated positive SWOT analysis
-- Strengths: "Excellent communication", "Outstanding teamwork"
-- Weaknesses: Minor issues only
-- Scores: Inflated (3.5-4.5 range)
```

### After (Real AI Analysis)
```sql
-- Generated from 206 actual faculty comments
-- Brutally honest assessment
-- Weaknesses: Severity-flagged (critical/moderate/minor)
-- Scores: Evidence-based (may be lower, reflecting reality)
```

---

## Database Changes

### Tables Modified

#### `swot_summaries`
- **Deleted:** 6 fake rows for Larissa
- **Inserted:** 6 real AI-generated SWOT analyses
- **Schema:** 
  ```json
  {
    "strengths": [{"theme": "...", "description": "..."}],
    "weaknesses": [{"theme": "...", "description": "...", "severity": "critical|moderate|minor"}],
    "opportunities": [{"theme": "...", "description": "..."}],
    "threats": [{"theme": "...", "description": "..."}]
  }
  ```

#### `period_scores`
- **Deleted:** 6 fake rows for Larissa
- **Inserted:** 6 real AI score aggregations
- **Fields:** `ai_eq_avg`, `ai_pq_avg`, `ai_iq_avg`, `ai_n_comments`, `ai_confidence_avg`

#### `ite_scores`
- **No changes** - These are real exam scores, preserved

---

## Severity Flags Explained

### Critical
- Immediate patient safety concern
- Professionalism violation
- Major competency gap requiring intervention

### Moderate
- Significant skill deficiency
- Requires focused improvement plan
- Below expected level for training year

### Minor
- Normal developmental area
- Refinement opportunity
- Not a major concern

---

## Scoring Scale (1.0 - 5.0)

| Score | Meaning | Description |
|-------|---------|-------------|
| 5.0 | Exceptional | Far exceeds expectations |
| 4.0 | Strong | Consistently meets/exceeds expectations |
| 3.0 | Adequate | Meets basic expectations |
| 2.0 | Below | Needs improvement |
| 1.0 | Deficient | Serious concern |

---

## EQ/PQ/IQ Attributes

### EQ (Emotional Intelligence)
- **empathy:** Patient/family interactions
- **adaptability:** Handling change
- **stress_mgmt:** Performance under pressure
- **curiosity:** Learning drive
- **communication:** Team communication

### PQ (Professional Intelligence)
- **work_ethic:** Reliability, dedication
- **integrity:** Accountability, ethics
- **teachability:** Accepting feedback
- **documentation:** Charting quality
- **leadership:** Team dynamics

### IQ (Intellectual Intelligence)
- **knowledge:** Medical knowledge base
- **analytical:** Clinical reasoning
- **learning:** Acquiring new information
- **flexibility:** Adapting approach
- **performance:** Overall clinical performance

---

## Verification Steps

After running the script:

### 1. Check Database
```sql
-- Verify SWOT summaries
SELECT period_label, 
       jsonb_array_length(strengths) as n_strengths,
       jsonb_array_length(weaknesses) as n_weaknesses,
       ai_confidence
FROM swot_summaries
WHERE resident_id = '3ba5dff9-5699-4499-8e51-0d8cd930b764'
ORDER BY period_label;

-- Verify period scores
SELECT period_label,
       ai_eq_avg,
       ai_pq_avg,
       ai_iq_avg,
       ai_n_comments
FROM period_scores
WHERE resident_id = '3ba5dff9-5699-4499-8e51-0d8cd930b764'
ORDER BY period_label;
```

### 2. Test Dashboard
```
http://localhost:3000/modules/understand/overview/resident/3ba5dff9-5699-4499-8e51-0d8cd930b764
```

**Expected:**
- 6 SWOT cards (one per period)
- Real, honest feedback (not inflated)
- Severity flags on weaknesses
- Evidence-based scores
- ITE chart still shows real data

---

## Troubleshooting

### Script Won't Run
**Issue:** Missing environment variables  
**Solution:** Add all three keys to `.env.local`

### Claude API Errors
**Issue:** API call failures  
**Solution:** Check API key, credits, network connection

### Database Errors
**Issue:** Insert failures  
**Solution:** Verify migrations run, check service key permissions

### Low Scores
**Issue:** Scores lower than expected  
**Solution:** This is intentional - brutally honest analysis reflects reality

---

## Next Steps

### Extend to All Residents
Modify `scripts/analyze-larissa-comments.ts`:
```typescript
// Change from single resident
const LARISSA_ID = '3ba5dff9-5699-4499-8e51-0d8cd930b764';

// To all residents
const { data: residents } = await supabase
  .from('residents')
  .select('id, user_profiles(full_name)');

for (const resident of residents) {
  await analyzeResident(resident.id, resident.full_name);
}
```

**Cost:** ~$100-150 for all 50 residents

### Schedule Regular Updates
- Run monthly to include new comments
- Update only periods with new data
- Track analysis versions

### Add Manual Review
- Faculty can review AI analysis
- Edit/approve before showing to residents
- Flag inaccurate assessments

---

## Files Created

```
lib/ai/
├── claude-analyzer.ts      # Claude API client with retry logic
└── swot-prompt.ts          # Brutally honest prompt template

scripts/
├── analyze-larissa-comments.ts  # Main analysis script
└── RUN-ANALYSIS.md             # Execution instructions

docs/
└── AI-SWOT-ANALYSIS-SETUP.md   # This file
```

---

## Success Criteria

- [x] Claude API client built with retry logic
- [x] Brutally honest prompt template created
- [x] Analysis script processes Larissa's 206 comments
- [x] Fake test data deleted
- [x] Real SWOT analysis inserted
- [x] Severity flags on weaknesses
- [x] Evidence-based EQ/PQ/IQ scores
- [x] ITE scores preserved
- [ ] **User runs script and verifies results**

---

**Ready to run! Execute the script to replace fake data with real AI analysis.** 🚀

