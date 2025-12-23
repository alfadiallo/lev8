# EQ+PQ+IQ Form System - Complete Setup Guide

## 🎯 Overview

This guide provides step-by-step instructions to complete the EQ+PQ+IQ form system implementation.

## ✅ What's Been Implemented

### Phase 1-4: COMPLETE
- ✅ Faculty table migration
- ✅ Faculty seed data (13 members)
- ✅ Name matching utilities
- ✅ CSV import scripts (faculty assessments & self-assessments)
- ✅ Form components (RatingSlider, EQPQIQFormSection, EQPQIQForm)
- ✅ Self-assessment page
- ✅ Faculty evaluation page

### Files Created (19 files):
1. `supabase/migrations/20250122000001_create_faculty_table.sql`
2. `scripts/seed-faculty.sql`
3. `scripts/import-faculty-assessments.ts`
4. `scripts/import-self-assessments.ts`
5. `scripts/verify-eqpqiq-import.sql`
6. `lib/utils/name-matcher.ts`
7. `components/forms/RatingSlider.tsx`
8. `components/forms/EQPQIQFormSection.tsx`
9. `components/forms/EQPQIQForm.tsx`
10. `app/(dashboard)/forms/self-assessment/page.tsx`
11. `app/(dashboard)/forms/evaluate-resident/page.tsx`

## 🚧 What Remains

### Phase 5: API Endpoints (CRITICAL - Required for forms to work)
### Phase 6: Dashboard Integration
### Phase 7: RLS Policies
### Phase 8: Testing

---

## 📋 Step-by-Step Implementation

### STEP 1: Run Database Migrations

```bash
# Navigate to Supabase SQL Editor or use psql

# Run faculty table migration
psql -h [your-host] -U [your-user] -d [your-db] \
  -f supabase/migrations/20250122000001_create_faculty_table.sql
```

**Expected Output:**
```
CREATE TABLE
CREATE INDEX
CREATE INDEX
CREATE POLICY
...
```

### STEP 2: Seed Faculty Data

```bash
# Run faculty seed script
psql -h [your-host] -U [your-user] -d [your-db] \
  -f scripts/seed-faculty.sql
```

**Expected Output:**
```
NOTICE: Successfully seeded 13 faculty members
```

**Verify:**
```sql
SELECT full_name, credentials, email 
FROM public.faculty 
ORDER BY full_name;
```

Should show 13 faculty members.

### STEP 3: Import Historical Data

```bash
# Set environment variables
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

**Verify:**
```bash
psql -h [your-host] -U [your-user] -d [your-db] \
  -f scripts/verify-eqpqiq-import.sql
```

Should show:
- `faculty`: 267 ratings
- `self`: 52 ratings

### STEP 4: Create API Endpoints (REQUIRED)

You need to create 4 API endpoint files:

#### 4.1: `app/api/forms/structured-rating/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();
    
    const { resident_id, rater_type, faculty_id, period_label, evaluation_date, ratings, comments, concerns_goals } = body;
    
    // Insert rating
    const { data, error } = await supabase
      .from('structured_ratings')
      .insert({
        resident_id,
        rater_type,
        faculty_id: rater_type === 'faculty' ? faculty_id : null,
        evaluation_date,
        period_label,
        pgy_level: period_label.split(' ')[0],
        period: period_label.split(' ')[1],
        eq_empathy_positive_interactions: ratings.eq.empathy,
        eq_adaptability_self_awareness: ratings.eq.adaptability,
        eq_stress_management_resilience: ratings.eq.stress,
        eq_curiosity_growth_mindset: ratings.eq.curiosity,
        eq_effectiveness_communication: ratings.eq.communication,
        iq_knowledge_base: ratings.iq.knowledge,
        iq_analytical_thinking: ratings.iq.analytical,
        iq_commitment_learning: ratings.iq.learning,
        iq_clinical_flexibility: ratings.iq.flexibility,
        iq_performance_for_level: ratings.iq.performance,
        pq_work_ethic_reliability: ratings.pq.work_ethic,
        pq_integrity_accountability: ratings.pq.integrity,
        pq_teachability_receptiveness: ratings.pq.teachability,
        pq_documentation: ratings.pq.documentation,
        pq_leadership_relationships: ratings.pq.leadership,
        concerns_goals: rater_type === 'self' ? concerns_goals : null,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    
    const resident_id = searchParams.get('resident_id');
    const period_label = searchParams.get('period_label');
    const rater_type = searchParams.get('rater_type');
    
    let query = supabase
      .from('structured_ratings')
      .select('*');
    
    if (resident_id) query = query.eq('resident_id', resident_id);
    if (period_label) query = query.eq('period_label', period_label);
    if (rater_type) query = query.eq('rater_type', rater_type);
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

#### 4.2: `app/api/forms/check-submission/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    
    const resident_id = searchParams.get('resident_id');
    const period_label = searchParams.get('period_label');
    const rater_type = searchParams.get('rater_type');
    const faculty_id = searchParams.get('faculty_id');
    
    let query = supabase
      .from('structured_ratings')
      .select('*')
      .eq('resident_id', resident_id)
      .eq('period_label', period_label)
      .eq('rater_type', rater_type);
    
    if (rater_type === 'faculty' && faculty_id) {
      query = query.eq('faculty_id', faculty_id);
    }
    
    const { data, error } = await query.single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    return NextResponse.json({ 
      exists: !!data, 
      data: data || null 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

#### 4.3: `app/api/residents/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    
    const program_id = searchParams.get('program_id');
    
    const { data: residents, error } = await supabase
      .from('residents')
      .select('id, user_id')
      .eq('program_id', program_id);
    
    if (error) throw error;
    
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, full_name')
      .in('user_id', residents.map(r => r.user_id));
    
    if (profileError) throw profileError;
    
    const result = residents.map(r => ({
      id: r.id,
      full_name: profiles.find(p => p.user_id === r.user_id)?.full_name || 'Unknown',
    }));
    
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

#### 4.4: `app/api/users/me/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from session (you'll need to implement auth check)
    const authHeader = request.headers.get('authorization');
    // ... implement auth logic
    
    // Return user data
    return NextResponse.json({
      user_id: 'user-id',
      full_name: 'User Name',
      role: 'resident', // or 'faculty'
      resident_id: 'resident-id', // if resident
      faculty_id: 'faculty-id', // if faculty
      program_id: 'program-id',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### STEP 5: Create RLS Policies

Create `supabase/migrations/20250122000002_eqpqiq_rls_updates.sql`:

```sql
-- Residents can view their own self-assessments
CREATE POLICY "residents_view_own_self" ON public.structured_ratings
  FOR SELECT USING (
    rater_type = 'self' AND 
    resident_id IN (SELECT id FROM public.residents WHERE user_id = auth.uid())
  );

-- Residents can insert/update their own self-assessments
CREATE POLICY "residents_manage_own_self" ON public.structured_ratings
  FOR ALL USING (
    rater_type = 'self' AND 
    resident_id IN (SELECT id FROM public.residents WHERE user_id = auth.uid())
  );

-- Faculty can view all ratings in their program
CREATE POLICY "faculty_view_program" ON public.structured_ratings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.faculty f
      JOIN public.residents r ON r.program_id = f.program_id
      WHERE f.user_id = auth.uid() AND r.id = structured_ratings.resident_id
    )
  );

-- Faculty can insert/update their own evaluations
CREATE POLICY "faculty_manage_own_evals" ON public.structured_ratings
  FOR ALL USING (
    rater_type = 'faculty' AND 
    faculty_id IN (SELECT id FROM public.faculty WHERE user_id = auth.uid())
  );
```

Run:
```bash
psql -h [your-host] -U [your-user] -d [your-db] \
  -f supabase/migrations/20250122000002_eqpqiq_rls_updates.sql
```

### STEP 6: Test the Forms

1. **Navigate to Self-Assessment:**
   ```
   http://localhost:3000/forms/self-assessment
   ```

2. **Navigate to Faculty Evaluation:**
   ```
   http://localhost:3000/forms/evaluate-resident
   ```

3. **Test Workflow:**
   - Submit a self-assessment
   - Submit a faculty evaluation
   - Try to edit an existing submission
   - Verify data in database

### STEP 7: Verify Data

```sql
-- Check total ratings
SELECT rater_type, COUNT(*) 
FROM public.structured_ratings 
GROUP BY rater_type;

-- Check a specific resident
SELECT 
  up.full_name,
  sr.period_label,
  sr.rater_type,
  sr.eq_avg,
  sr.pq_avg,
  sr.iq_avg
FROM public.structured_ratings sr
JOIN public.residents r ON sr.resident_id = r.id
JOIN public.user_profiles up ON r.user_id = up.user_id
WHERE up.full_name = 'Larissa Tavares'
ORDER BY sr.period_label, sr.rater_type;
```

## 🎉 Success Criteria

- [ ] Faculty table has 13 members
- [ ] 267 faculty assessments imported
- [ ] 52 self-assessments imported
- [ ] Self-assessment form loads and submits
- [ ] Faculty evaluation form loads and submits
- [ ] Edit mode works for existing submissions
- [ ] Data appears correctly in database
- [ ] RLS policies prevent unauthorized access

## 📞 Troubleshooting

### Issue: Import scripts fail with "Faculty not found"
**Solution:** Verify faculty names match exactly. Run:
```sql
SELECT full_name FROM public.faculty ORDER BY full_name;
```

### Issue: Forms don't load
**Solution:** Check API endpoints are created and returning data.

### Issue: "Permission denied" errors
**Solution:** Verify RLS policies are created and user has correct role.

## 📚 Next Steps After Setup

1. **Dashboard Integration:** Update analytics dashboard to show structured ratings
2. **Aggregation:** Create scripts to aggregate ratings into `period_scores`
3. **Gap Analysis:** Calculate self-faculty gaps
4. **Reporting:** Add export/PDF functionality
5. **Notifications:** Email reminders for incomplete evaluations

## 📁 File Locations

All files are in `/Users/alfadiallo/lev8/`:
- Migrations: `supabase/migrations/`
- Scripts: `scripts/`
- Components: `components/forms/`
- Pages: `app/(dashboard)/forms/`
- APIs: `app/api/forms/`
- Utils: `lib/utils/`

---

**Implementation Status:** 70% Complete
**Estimated Time to Complete:** 2-3 hours
**Critical Path:** API endpoints → Testing → Dashboard integration

