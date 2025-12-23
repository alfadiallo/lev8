# EQ+PQ+IQ Evaluation System

**Comprehensive guide to the Emotional, Professional, and Intellectual Quotient framework**

**Last Updated:** January 22, 2025  
**Status:** Production - Fully Operational

---

## Table of Contents

1. [Overview](#overview)
2. [Framework Definition](#framework-definition)
3. [Database Schema](#database-schema)
4. [Form Components](#form-components)
5. [Data Import](#data-import)
6. [Dashboard Integration](#dashboard-integration)
7. [Usage Guide](#usage-guide)

---

## Overview

The EQ+PQ+IQ system is a comprehensive competency evaluation framework for Emergency Medicine residents, measuring 15 distinct attributes across three pillars:

- **EQ (Emotional Quotient):** 5 attributes measuring emotional intelligence
- **PQ (Professional Quotient):** 5 attributes measuring professional behavior
- **IQ (Intellectual Quotient):** 5 attributes measuring clinical knowledge and reasoning

### Current Implementation

**Data Imported:**
- 267 faculty assessments
- 52 resident self-assessments
- 319 total structured ratings
- 31 unique residents with data
- 66 period scores aggregated

**Features:**
- Beautiful form interface with 1-5 rating sliders
- 15-point radar chart visualization
- Faculty vs self-assessment comparison
- Gap analysis
- Historical trend tracking
- Period-based filtering

---

## Framework Definition

### Emotional Quotient (EQ)

Measures emotional intelligence and interpersonal skills critical for patient care and team dynamics.

#### 1. Empathy & Positive Interactions
**Definition:** Ability to understand and respond to patient and colleague emotions with compassion.

**Rating Scale:**
- 1.0: Dismissive or insensitive to emotional needs
- 2.0: Occasionally acknowledges emotions but lacks follow-through
- 3.0: Generally empathetic with room for consistency
- 4.0: Consistently demonstrates empathy and builds rapport
- 5.0: Exceptional emotional intelligence; creates healing environment

**Observable Behaviors:**
- Active listening to patient concerns
- Appropriate emotional responses
- Building trust with patients and families
- Supporting colleagues during difficult cases

---

#### 2. Adaptability & Self-Awareness
**Definition:** Recognizes own limitations and adjusts approach based on feedback and changing circumstances.

**Rating Scale:**
- 1.0: Rigid, defensive when challenged
- 2.0: Occasionally adapts but resists feedback
- 3.0: Generally receptive to feedback with some resistance
- 4.0: Actively seeks feedback and adjusts behavior
- 5.0: Exceptional self-awareness; proactively adapts

**Observable Behaviors:**
- Accepting constructive criticism
- Adjusting clinical approach based on patient needs
- Recognizing knowledge gaps
- Seeking help appropriately

---

#### 3. Stress Management & Resilience
**Definition:** Maintains composure and effectiveness under pressure.

**Rating Scale:**
- 1.0: Overwhelmed by routine stress; impacts performance
- 2.0: Struggles with high-stress situations
- 3.0: Generally manages stress adequately
- 4.0: Remains calm under most circumstances
- 5.0: Thrives under pressure; calming presence for team

**Observable Behaviors:**
- Performance during codes or traumas
- Emotional regulation during busy shifts
- Recovery from difficult cases
- Supporting team during stressful situations

---

#### 4. Curiosity & Growth Mindset
**Definition:** Demonstrates intellectual curiosity and commitment to continuous learning.

**Rating Scale:**
- 1.0: Disengaged; minimal interest in learning
- 2.0: Learns when required but lacks initiative
- 3.0: Generally curious with occasional initiative
- 4.0: Actively seeks learning opportunities
- 5.0: Insatiable curiosity; inspires others to learn

**Observable Behaviors:**
- Asking thoughtful questions
- Reading beyond requirements
- Seeking challenging cases
- Teaching peers

---

#### 5. Effectiveness of Communication
**Definition:** Clearly conveys information to patients, families, and healthcare team.

**Rating Scale:**
- 1.0: Frequently unclear or inappropriate communication
- 2.0: Communication often requires clarification
- 3.0: Generally clear with room for improvement
- 4.0: Consistently clear and appropriate
- 5.0: Exceptional communicator; adapts style to audience

**Observable Behaviors:**
- Patient explanations
- Handoffs and sign-outs
- Interdisciplinary communication
- Documentation clarity

---

### Professional Quotient (PQ)

Measures professional behavior, ethics, and work habits essential for medical practice.

#### 1. Work Ethic & Reliability
**Definition:** Consistently meets obligations with dedication and dependability.

**Rating Scale:**
- 1.0: Frequently unreliable; poor follow-through
- 2.0: Occasionally unreliable or requires reminders
- 3.0: Generally reliable with occasional lapses
- 4.0: Consistently dependable
- 5.0: Exceptional reliability; goes above and beyond

**Observable Behaviors:**
- Punctuality
- Completing assigned tasks
- Following through on commitments
- Availability when needed

---

#### 2. Integrity & Accountability
**Definition:** Takes responsibility for actions and maintains ethical standards.

**Rating Scale:**
- 1.0: Avoids responsibility; ethical concerns
- 2.0: Occasionally deflects blame
- 3.0: Generally accountable with room for growth
- 4.0: Consistently takes responsibility
- 5.0: Model of integrity; holds self to highest standards

**Observable Behaviors:**
- Admitting mistakes
- Honest documentation
- Ethical decision-making
- Transparency with supervisors

---

#### 3. Teachability & Receptiveness
**Definition:** Openness to feedback and willingness to learn from others.

**Rating Scale:**
- 1.0: Defensive; rejects feedback
- 2.0: Occasionally receptive but often resistant
- 3.0: Generally open to feedback
- 4.0: Actively seeks and implements feedback
- 5.0: Exceptional learner; models receptiveness

**Observable Behaviors:**
- Response to constructive criticism
- Implementing suggested changes
- Asking for feedback
- Acknowledging areas for improvement

---

#### 4. Documentation Quality
**Definition:** Produces clear, accurate, and timely medical documentation.

**Rating Scale:**
- 1.0: Consistently poor or incomplete documentation
- 2.0: Frequently requires corrections
- 3.0: Generally adequate with room for improvement
- 4.0: Consistently clear and complete
- 5.0: Exceptional documentation; teaching example

**Observable Behaviors:**
- Chart completion timeliness
- Note clarity and organization
- Billing documentation accuracy
- Procedure documentation

---

#### 5. Leadership & Relationships
**Definition:** Builds positive relationships and demonstrates leadership potential.

**Rating Scale:**
- 1.0: Negative team dynamics; poor relationships
- 2.0: Occasionally creates tension
- 3.0: Generally positive with room for growth
- 4.0: Strong relationships; emerging leader
- 5.0: Exceptional leader; inspires and unifies team

**Observable Behaviors:**
- Team collaboration
- Conflict resolution
- Mentoring junior residents
- Leading resuscitations

---

### Intellectual Quotient (IQ)

Measures clinical knowledge, reasoning, and intellectual capabilities.

#### 1. Knowledge Base
**Definition:** Demonstrates appropriate medical knowledge for training level.

**Rating Scale:**
- 1.0: Significant knowledge gaps; below level
- 2.0: Frequent knowledge deficits
- 3.0: Generally appropriate for level
- 4.0: Strong knowledge base
- 5.0: Exceptional knowledge; above level

**Observable Behaviors:**
- Answering clinical questions
- Differential diagnosis generation
- Evidence-based practice
- Teaching others

---

#### 2. Analytical Thinking
**Definition:** Synthesizes information and develops logical clinical reasoning.

**Rating Scale:**
- 1.0: Struggles with basic reasoning
- 2.0: Occasionally reaches correct conclusions
- 3.0: Generally sound reasoning
- 4.0: Consistently strong analytical skills
- 5.0: Exceptional reasoning; complex problem-solver

**Observable Behaviors:**
- Clinical decision-making
- Diagnostic reasoning
- Risk-benefit analysis
- Critical thinking

---

#### 3. Commitment to Learning
**Definition:** Actively pursues knowledge and skill development.

**Rating Scale:**
- 1.0: Minimal effort toward learning
- 2.0: Learns when required
- 3.0: Generally engaged in learning
- 4.0: Actively pursues learning opportunities
- 5.0: Exceptional dedication; self-directed learner

**Observable Behaviors:**
- Independent study
- Conference attendance
- Procedure seeking
- Literature review

---

#### 4. Clinical Flexibility
**Definition:** Adapts clinical approach based on patient needs and new information.

**Rating Scale:**
- 1.0: Rigid; struggles to adjust plans
- 2.0: Occasionally adapts with prompting
- 3.0: Generally flexible
- 4.0: Readily adapts to changing circumstances
- 5.0: Exceptional flexibility; anticipates changes

**Observable Behaviors:**
- Adjusting treatment plans
- Responding to new information
- Managing uncertainty
- Creative problem-solving

---

#### 5. Performance for Level
**Definition:** Overall clinical performance relative to training stage.

**Rating Scale:**
- 1.0: Significantly below expected level
- 2.0: Below expected level
- 3.0: Meets expected level
- 4.0: Above expected level
- 5.0: Exceptional; far exceeds expectations

**Observable Behaviors:**
- Patient management
- Procedure competence
- Autonomy level
- Overall effectiveness

---

## Database Schema

### `structured_ratings` Table

Stores individual EQ+PQ+IQ ratings from faculty or self-assessments.

**Schema:**
```sql
CREATE TABLE public.structured_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
    rater_type TEXT NOT NULL CHECK (rater_type IN ('faculty', 'self')),
    period_label TEXT NOT NULL,
    
    -- EQ Attributes
    eq_empathy_positive_interactions DECIMAL(3,2),
    eq_adaptability_self_awareness DECIMAL(3,2),
    eq_stress_management_resilience DECIMAL(3,2),
    eq_curiosity_growth_mindset DECIMAL(3,2),
    eq_effectiveness_communication DECIMAL(3,2),
    eq_avg DECIMAL(3,2),
    
    -- PQ Attributes
    pq_work_ethic_reliability DECIMAL(3,2),
    pq_integrity_accountability DECIMAL(3,2),
    pq_teachability_receptiveness DECIMAL(3,2),
    pq_documentation DECIMAL(3,2),
    pq_leadership_relationships DECIMAL(3,2),
    pq_avg DECIMAL(3,2),
    
    -- IQ Attributes
    iq_knowledge_base DECIMAL(3,2),
    iq_analytical_thinking DECIMAL(3,2),
    iq_commitment_learning DECIMAL(3,2),
    iq_clinical_flexibility DECIMAL(3,2),
    iq_performance_for_level DECIMAL(3,2),
    iq_avg DECIMAL(3,2),
    
    concerns_goals TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Points:**
- All attributes scored 1.0-5.0 with 0.5 increments
- `rater_type` distinguishes faculty vs self-assessment
- `period_label` format: "PGY-X Fall/Spring"
- Averages calculated automatically

---

### `period_scores` Table

Aggregated scores by resident and period for dashboard display.

**Schema:**
```sql
CREATE TABLE public.period_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    period_label TEXT NOT NULL,
    
    -- Faculty Aggregates
    faculty_eq_avg DECIMAL(3,2),
    faculty_pq_avg DECIMAL(3,2),
    faculty_iq_avg DECIMAL(3,2),
    faculty_n_raters INTEGER,
    faculty_ratings_detail JSONB,
    
    -- Self Aggregates
    self_eq_avg DECIMAL(3,2),
    self_pq_avg DECIMAL(3,2),
    self_iq_avg DECIMAL(3,2),
    self_ratings_detail JSONB,
    
    -- Gap Analysis
    self_faculty_gap_eq DECIMAL(3,2),
    self_faculty_gap_pq DECIMAL(3,2),
    self_faculty_gap_iq DECIMAL(3,2),
    
    is_current BOOLEAN DEFAULT TRUE,
    analysis_version TEXT DEFAULT 'v1.0',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(resident_id, period_label, analysis_version)
);
```

**JSONB Detail Structure:**
```json
{
  "eq_empathy": 3.5,
  "eq_adaptability": 4.0,
  "eq_stress": 3.0,
  "eq_curiosity": 4.5,
  "eq_communication": 3.5,
  "pq_work_ethic": 4.0,
  "pq_integrity": 4.5,
  "pq_teachability": 3.5,
  "pq_documentation": 3.0,
  "pq_leadership": 4.0,
  "iq_knowledge": 3.5,
  "iq_analytical": 4.0,
  "iq_learning": 4.5,
  "iq_flexibility": 3.5,
  "iq_performance": 3.0
}
```

---

## Form Components

### RatingSlider Component

**File:** `components/forms/RatingSlider.tsx`

Beautiful 1.0-5.0 slider with 0.5 increments and visual feedback.

**Features:**
- Color-coded: Red (1.0-2.5) → Yellow (2.5-3.5) → Green (3.5-5.0)
- Real-time value display
- Visual markers at key points
- Accessible keyboard controls
- Responsive design

**Usage:**
```tsx
<RatingSlider
  label="Empathy & Positive Interactions"
  value={empathyScore}
  onChange={setEmpathyScore}
  description="Ability to understand and respond to emotions"
/>
```

---

### EQPQIQFormSection Component

**File:** `components/forms/EQPQIQFormSection.tsx`

Groups related sliders under a common category with auto-calculated averages.

**Features:**
- Color-coded headers (EQ: Blue, PQ: Green, IQ: Purple)
- Auto-calculates section average
- Collapsible sections
- Responsive layout

**Usage:**
```tsx
<EQPQIQFormSection
  title="Emotional Quotient (EQ)"
  color="blue"
  average={eqAverage}
>
  <RatingSlider label="Empathy" value={eq1} onChange={setEq1} />
  <RatingSlider label="Adaptability" value={eq2} onChange={setEq2} />
  {/* ... */}
</EQPQIQFormSection>
```

---

### EQPQIQForm Component

**File:** `components/forms/EQPQIQForm.tsx`

Main form with all 15 sliders, real-time averages, and submission logic.

**Features:**
- 15 rating sliders (5 per section)
- Real-time average calculation
- Comments/concerns field
- Edit mode support
- Beautiful summary display
- Validation
- Error handling

**Props:**
```typescript
interface EQPQIQFormProps {
  residentId?: string;  // For faculty evaluations
  existingData?: StructuredRating;  // For editing
  onSubmit: (data: FormData) => Promise<void>;
  mode: 'self' | 'faculty';
}
```

---

## Data Import

### Faculty Assessments Import

**File:** `scripts/import-faculty-assessments.ts`

Imports faculty evaluations from CSV.

**Process:**
1. Parse CSV file
2. Normalize faculty names (strip titles: MD, DO, MPH, PhD)
3. Match faculty to `faculty` table
4. Normalize resident names
5. Match residents to `residents` table
6. Handle missing data (empty cells → NULL)
7. Handle duplicates (keep most complete/recent)
8. Insert into `structured_ratings`

**CSV Format:**
```csv
Timestamp,Evaluator Name,Resident Name,Period,EQ_Empathy,EQ_Adaptability,...
2024-03-15,Dr. Smith MD,John Doe,PGY-2 Fall,4.0,3.5,...
```

**Usage:**
```bash
npx tsx scripts/import-faculty-assessments.ts
```

**Output:**
- 267 faculty assessments imported
- Name matching report
- Duplicate handling summary

---

### Self-Assessments Import

**File:** `scripts/import-self-assessments.ts`

Imports resident self-assessments from CSV.

**Process:**
1. Parse CSV file
2. Match residents by email
3. Extract period from timestamp
4. Handle missing data
5. Handle duplicates
6. Insert into `structured_ratings` with `rater_type='self'`

**CSV Format:**
```csv
Timestamp,Email,PGY Level,EQ_Empathy,EQ_Adaptability,...,Concerns/Goals
2024-03-15,resident@example.com,PGY-2,4.0,4.5,...,Need to improve time management
```

**Usage:**
```bash
npx tsx scripts/import-self-assessments.ts
```

**Output:**
- 52 self-assessments imported
- Period detection report
- Validation summary

---

### Aggregation Script

**File:** `scripts/aggregate-period-scores.sql`

Aggregates `structured_ratings` into `period_scores` for dashboard display.

**Process:**
1. Group faculty ratings by resident and period
2. Calculate averages for EQ, PQ, IQ
3. Build JSONB detail with all 15 attributes
4. Group self-assessments by resident and period
5. Calculate self averages
6. Calculate gap analysis (self - faculty)
7. Insert/update `period_scores`

**Usage:**
```sql
-- Run in Supabase SQL Editor
-- Copy/paste contents of scripts/aggregate-period-scores.sql
```

**Output:**
- 66 period scores created
- 31 unique residents
- Faculty and self data aggregated
- Gap analysis calculated

---

## Dashboard Integration

### 15-Point Radar Chart

**File:** `components/modules/understand/overview/RadarChart.tsx`

Visualizes all 15 attributes on a single comprehensive chart.

**Features:**
- 15 spokes (one per attribute)
- Visual grouping by color:
  - EQ: Pink (#FF6B9D)
  - PQ: Teal (#4ECDC4)
  - IQ: Light Green (#95E1D3)
- Faculty vs Self overlay
- Interactive tooltips
- Legend
- 600px height for clarity

**Data Flow:**
```
period_scores.faculty_ratings_detail (JSONB)
  ↓
Extract 15 individual attributes
  ↓
Transform into chart data array
  ↓
Render with Recharts
```

**Chart Data Structure:**
```typescript
const data = [
  { subject: 'EQ:Empathy', A: 3.5, B: 4.0, fullMark: 5 },
  { subject: 'EQ:Adaptability', A: 4.0, B: 4.5, fullMark: 5 },
  // ... 13 more attributes
];
```

---

### Gap Analysis

**File:** `components/modules/understand/overview/GapAnalysis.tsx`

Visualizes the difference between self and faculty perception.

**Features:**
- Three metrics: EQ gap, PQ gap, IQ gap
- Color-coded:
  - Green: Small gap (< 0.5)
  - Yellow: Moderate gap (0.5-1.0)
  - Red: Large gap (> 1.0)
- Interpretation guidance
- Trend tracking

**Interpretation:**
- **Positive Gap:** Self-assessment higher than faculty (overconfidence)
- **Negative Gap:** Faculty assessment higher than self (underconfidence)
- **Large Gaps:** Indicate blind spots or perception issues

---

### Scores Tab Integration

**File:** `components/modules/understand/overview/ScoresTab.tsx`

Main dashboard tab displaying EQ+PQ+IQ data.

**Sections:**
1. **Period Selector** - Filter by academic period
2. **Radar Chart** - 15-point visualization
3. **Gap Analysis** - Faculty vs self comparison
4. **Detailed Scores Table** - All 15 attributes with values
5. **ITE Scores** - Historical exam performance

**Data Fetching:**
```typescript
const { data: scores } = await fetch(
  `/api/analytics/scores/resident/${residentId}?period=${period}`
);
```

---

## Usage Guide

### For Residents (Self-Assessment)

**Submitting Self-Assessment:**

1. Navigate to `/forms/self-assessment`
2. System auto-detects current period (e.g., "PGY-2 Fall")
3. Rate yourself honestly on all 15 attributes (1.0-5.0)
4. Add concerns/goals (optional but recommended)
5. Review summary with calculated averages
6. Submit

**Tips:**
- Be honest - this helps identify blind spots
- Compare with faculty feedback in dashboard
- Use concerns/goals to communicate with program director
- Update each period (Fall and Spring)

**Editing:**
- System detects existing submission
- Pre-fills form with previous values
- Can update and resubmit

---

### For Faculty (Evaluating Residents)

**Submitting Evaluation:**

1. Navigate to `/forms/evaluate-resident`
2. Select resident from dropdown
3. Select period (current or recent)
4. Rate resident on all 15 attributes
5. Add comments (optional but helpful)
6. Review summary
7. Submit

**Tips:**
- Base ratings on observed behaviors
- Use full scale (1.0-5.0)
- Provide specific examples in comments
- Evaluate multiple residents per session
- Update regularly (monthly recommended)

**Editing:**
- System shows previous evaluations
- Can edit most recent evaluation
- Cannot edit after resident views (future feature)

---

### For Program Directors

**Viewing Analytics:**

1. Navigate to `/modules/understand/overview`
2. Select "Individual Resident"
3. Choose resident
4. Click "View Analytics"
5. Navigate to "EQ + PQ + IQ" tab

**Interpreting Data:**

**Radar Chart:**
- Look for patterns (strengths/weaknesses)
- Compare faculty vs self (overlay)
- Identify outliers (very high or low scores)
- Track changes over time

**Gap Analysis:**
- Large positive gaps: Resident overconfident
- Large negative gaps: Resident underconfident
- Use in feedback conversations

**Detailed Scores:**
- Review individual attributes
- Identify specific areas for improvement
- Track progress period-to-period

**Using in Feedback:**
1. Show resident their radar chart
2. Discuss gaps between self and faculty
3. Highlight specific attributes (not just averages)
4. Create action plan for low scores
5. Celebrate improvements

---

## Technical Details

### Data Validation

**Form Validation:**
- All 15 attributes required
- Values must be 1.0-5.0 in 0.5 increments
- Period label must match format
- Resident/faculty IDs must exist

**Import Validation:**
- Name matching with fuzzy logic
- Duplicate detection
- Missing data handling
- Date format validation

---

### Calculation Logic

**Averages:**
```typescript
eq_avg = (eq1 + eq2 + eq3 + eq4 + eq5) / 5
pq_avg = (pq1 + pq2 + pq3 + pq4 + pq5) / 5
iq_avg = (iq1 + iq2 + iq3 + iq4 + iq5) / 5
```

**Gap Analysis:**
```typescript
gap_eq = self_eq_avg - faculty_eq_avg
gap_pq = self_pq_avg - faculty_pq_avg
gap_iq = self_iq_avg - faculty_iq_avg
```

**Aggregation (Multiple Faculty):**
```typescript
faculty_eq_avg = AVG(all_faculty_eq_avg_for_period)
faculty_n_raters = COUNT(distinct_faculty_for_period)
```

---

### Performance

**Database Queries:**
- Use `period_scores` for dashboard (pre-aggregated)
- Index on `resident_id` and `period_label`
- JSONB indexes for detail queries

**Caching:**
- API responses cached 5 minutes
- Invalidate on new submission
- Client-side caching with SWR

---

### Security

**RLS Policies:**
- Residents can only see own ratings
- Faculty can see residents in their program
- Program directors see all in program
- Evaluators anonymized for residents

**Form Access:**
- Self-assessment: Residents only
- Faculty evaluation: Faculty and program directors
- Edit restrictions: Own submissions only

---

## Future Enhancements

### Planned Features

1. **Competency Mapping**
   - Map EQ+PQ+IQ to ACGME competencies
   - Milestone integration
   - Competency-specific feedback

2. **Trend Analysis**
   - Historical charts
   - Improvement trajectories
   - Predictive analytics

3. **Peer Evaluations**
   - Add peer rater type
   - 360-degree feedback
   - Team dynamics insights

4. **Custom Attributes**
   - Program-specific attributes
   - Specialty-specific competencies
   - Configurable frameworks

5. **Mobile App**
   - Quick evaluations on mobile
   - Push notifications for pending evaluations
   - Offline mode

---

## Troubleshooting

### Common Issues

**Form Not Submitting:**
- Check all 15 sliders have values
- Verify network connection
- Check browser console for errors
- Ensure authenticated

**Scores Not Showing:**
- Verify data in `structured_ratings`
- Run aggregation script
- Check period_label format
- Verify RLS policies

**Radar Chart Empty:**
- Ensure `recharts` installed
- Check JSONB data exists
- Verify period has data
- Check browser console

**Name Matching Failures:**
- Add manual override in `medhub_name_overrides`
- Check name format (First Last)
- Verify resident exists in database

---

## Additional Resources

- **[Setup Guide](SETUP.md)** - Complete setup instructions
- **[Analytics Documentation](ANALYTICS.md)** - Analytics engine details
- **[Database Setup Guide](guides/DATABASE-SETUP.md)** - Schema and migrations
- **[Data Import Guide](guides/DATA-IMPORT.md)** - Import procedures
- **[Dashboard Usage Guide](guides/DASHBOARD-USAGE.md)** - End-user guide

---

**EQ+PQ+IQ System Status:** ✅ Production Ready

Complete implementation with 319 ratings imported and fully functional dashboard integration.


