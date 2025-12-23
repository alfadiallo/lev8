# Running the AI SWOT Analysis

## Prerequisites

The analysis script requires three environment variables in your `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
ANTHROPIC_API_KEY=your_anthropic_key
```

## How to Run

```bash
cd /Users/alfadiallo/lev8
npx tsx scripts/analyze-larissa-comments.ts
```

## What It Does

1. **Tests Claude API connection** - Verifies Anthropic API key works
2. **Fetches Larissa's 206 comments** - Groups by training period
3. **Deletes fake test data** - Removes the fabricated SWOT summaries
4. **Analyzes each period** - Sends comments to Claude for brutally honest analysis
5. **Saves real results** - Inserts AI-generated SWOT and scores into database

## Expected Output

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

[... continues for each period ...]

╔════════════════════════════════════════════════════════════╗
║  ANALYSIS COMPLETE                                         ║
╚════════════════════════════════════════════════════════════╝

✓ Successfully analyzed: 6 periods
⚠️  Skipped (insufficient data): 0 periods
❌ Errors: 0 periods

🎉 Real SWOT analysis now available in the dashboard!
   View at: http://localhost:3000/modules/understand/overview/resident/3ba5dff9-5699-4499-8e51-0d8cd930b764
```

## Cost Estimate

- **6 periods** × **30-40 comments each** = ~$2-3 total
- Claude Sonnet 4 pricing: ~$3 per million input tokens
- Each analysis uses ~15-20k tokens

## Troubleshooting

### Missing API Keys

If you see:
```
❌ Missing Supabase credentials
❌ Missing ANTHROPIC_API_KEY environment variable
```

**Solution:** Add the required keys to `.env.local`

### Claude API Errors

The script has built-in retry logic (3 attempts with exponential backoff). If all retries fail, check:
- API key is valid
- Anthropic account has credits
- Network connection is stable

### Database Errors

If you see database errors:
- Verify migrations have been run
- Check Supabase service key has full access
- Ensure `imported_comments` table has Larissa's data

## After Running

1. **Refresh the dashboard** at the URL shown in output
2. **Review SWOT analysis** - Should show real, honest feedback
3. **Check severity flags** - Critical weaknesses should be highlighted
4. **Compare scores** - EQ/PQ/IQ should reflect actual performance

## Files Created

The script creates the following TypeScript/JavaScript files:

- `lib/ai/claude-analyzer.ts` - Claude API client with retry logic
- `lib/ai/swot-prompt.ts` - Brutally honest prompt template
- `scripts/analyze-larissa-comments.ts` - Main analysis script

## Next Steps

After verifying Larissa's analysis is accurate:

1. **Extend to all residents** - Modify script to process all 50 residents
2. **Schedule regular updates** - Run monthly to include new comments
3. **Add manual review** - Allow faculty to review/edit AI analysis
4. **Build comparison views** - Class and program-wide analytics

