# AI SWOT Analysis - Ready to Run! 🚀

## ✅ Implementation Complete

All code has been written and is ready to execute. The AI analysis pipeline will replace Larissa's fake test data with brutally honest, evidence-based SWOT analysis from her 206 real MedHub comments.

---

## 📋 What Was Built

### 1. **Claude API Client** (`lib/ai/claude-analyzer.ts`)
- Anthropic SDK integration
- 3-attempt retry logic with exponential backoff
- JSON parsing and validation
- Connection testing

### 2. **SWOT Prompt Template** (`lib/ai/swot-prompt.ts`)
- Brutally honest tone
- Severity-flagged weaknesses (critical/moderate/minor)
- EQ/PQ/IQ scoring (1.0-5.0 scale)
- Evidence-based analysis

### 3. **Analysis Script** (`scripts/analyze-larissa-comments.ts`)
- Fetches Larissa's 206 comments
- Groups by training period
- Deletes fake test data
- Analyzes with Claude API
- Saves real results to database

---

## 🎯 How to Run

### Step 1: Verify Environment Variables

Check your `.env.local` file has these three keys:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key  
ANTHROPIC_API_KEY=your_anthropic_key
```

### Step 2: Execute the Script

```bash
cd /Users/alfadiallo/lev8
npx tsx scripts/analyze-larissa-comments.ts
```

### Step 3: Wait for Completion

Expected runtime: **3-4 minutes**
- 6 periods to analyze
- ~30 seconds per period
- Includes API calls and database writes

---

## 💰 Cost

**Estimated:** $2-3 total
- Claude Sonnet 4: ~$3 per million input tokens
- 6 periods × 30-40 comments each
- ~15-20k tokens per analysis

---

## 📊 Expected Output

```
╔════════════════════════════════════════════════════════════╗
║  AI SWOT Analysis for Larissa Tavares                     ║
║  Using Claude Sonnet 4 (claude-sonnet-4-20250514)         ║
╚════════════════════════════════════════════════════════════╝

🔌 Testing Claude API connection...
✓ Claude API connected

📊 Fetching Larissa's comments from database...
✓ Found 206 total comments

📋 Comments by period:
   PGY-1 Fall: 28 comments
   PGY-1 Spring: 32 comments
   PGY-2 Fall: 34 comments
   PGY-2 Spring: 36 comments
   PGY-3 Fall: 38 comments
   PGY-3 Spring: 38 comments

🗑️  Deleting existing fake test data...
✓ Deleted SWOT summaries
✓ Deleted period scores
✓ Preserved ITE scores (real data)

🚀 Starting analysis...

🤖 Analyzing PGY-1 Fall...
   Comments: 28
   Sending to Claude... (12543 chars)
   ✓ Analysis complete
     - Strengths: 4
     - Weaknesses: 5 (1 critical)
     - EQ avg: 2.80
     - PQ avg: 2.60
     - IQ avg: 2.90
     - Confidence: 82%

💾 Saving results for PGY-1 Fall...
   ✓ SWOT summary saved
   ✓ Period scores saved

[... repeats for each period ...]

╔════════════════════════════════════════════════════════════╗
║  ANALYSIS COMPLETE                                         ║
╚════════════════════════════════════════════════════════════╝

✓ Successfully analyzed: 6 periods
⚠️  Skipped (insufficient data): 0 periods
❌ Errors: 0 periods

🎉 Real SWOT analysis now available in the dashboard!
   View at: http://localhost:3000/modules/understand/overview/resident/3ba5dff9-5699-4499-8e51-0d8cd930b764
```

---

## 🔍 What Changes

### Before (Fake Data)
- ✨ Inflated positive feedback
- 🎭 "Excellent communication", "Outstanding teamwork"
- 📈 High scores (3.5-4.5 range)
- 🚫 No severity flags on weaknesses

### After (Real AI Analysis)
- 💯 Brutally honest assessment
- 📊 Evidence-based from 206 actual comments
- ⚠️ Severity-flagged weaknesses (critical/moderate/minor)
- 📉 Realistic scores (may be lower, reflecting reality)

---

## ✅ Verification

After running the script:

### 1. Check the Dashboard
```
http://localhost:3000/modules/understand/overview/resident/3ba5dff9-5699-4499-8e51-0d8cd930b764
```

**You should see:**
- 6 SWOT cards (one per period)
- Real, honest feedback
- Severity badges on weaknesses
- Evidence-based EQ/PQ/IQ scores
- ITE chart with real exam scores

### 2. Query the Database
```sql
-- Check SWOT summaries
SELECT period_label, 
       jsonb_array_length(strengths) as n_strengths,
       jsonb_array_length(weaknesses) as n_weaknesses,
       ai_confidence
FROM swot_summaries
WHERE resident_id = '3ba5dff9-5699-4499-8e51-0d8cd930b764'
ORDER BY period_label;

-- Check period scores
SELECT period_label,
       ai_eq_avg,
       ai_pq_avg,
       ai_iq_avg
FROM period_scores
WHERE resident_id = '3ba5dff9-5699-4499-8e51-0d8cd930b764'
ORDER BY period_label;
```

---

## 🐛 Troubleshooting

### Missing Environment Variables
```
❌ Missing Supabase credentials
❌ Missing ANTHROPIC_API_KEY environment variable
```

**Solution:** Add all three keys to `.env.local`

### Claude API Errors
**Solution:** 
- Verify API key is valid
- Check Anthropic account has credits
- Ensure network connection is stable
- Script will retry 3 times automatically

### Database Errors
**Solution:**
- Verify migrations have been run
- Check service key has full permissions
- Ensure `imported_comments` table has data

---

## 📚 Documentation

- **Execution Guide:** `scripts/RUN-ANALYSIS.md`
- **Technical Details:** `docs/AI-SWOT-ANALYSIS-SETUP.md`
- **Main Setup Doc:** `SETUP-COMPLETE.md`

---

## 🎯 Next Steps After Verification

### 1. Extend to All Residents
Modify the script to process all 50 residents:
- Cost: ~$100-150 total
- Time: ~2-3 hours

### 2. Schedule Regular Updates
- Run monthly to include new comments
- Update only periods with new data

### 3. Add Manual Review
- Faculty can review AI analysis
- Edit/approve before showing to residents

---

## 🚀 Ready to Go!

Everything is set up and ready. Just run:

```bash
npx tsx scripts/analyze-larissa-comments.ts
```

The script will:
1. ✅ Test Claude API connection
2. ✅ Fetch 206 real comments
3. ✅ Delete fake test data
4. ✅ Analyze 6 training periods
5. ✅ Save brutally honest results
6. ✅ Preserve real ITE scores

**Then refresh the dashboard to see Larissa's real SWOT analysis!** 🎉

---

*Implementation completed: November 20, 2025*

