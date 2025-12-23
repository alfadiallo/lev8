# Lev8 Analytics Engine

**Comprehensive guide to the Understand Module analytics system**

**Last Updated:** December 21, 2025  
**Status:** Production - Fully Operational

---

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Dashboard Features](#dashboard-features)
4. [AI Integration](#ai-integration)
5. [Data Privacy & Anonymization](#data-privacy--anonymization)
6. [API Endpoints](#api-endpoints)
7. [Usage Guide](#usage-guide)

---

## Overview

The Analytics Engine (Understand Module) provides comprehensive resident evaluation analytics, including:

- **AI-Powered SWOT Analysis** - Brutally honest insights from faculty evaluations
- **EQ+PQ+IQ Tracking** - 15-point competency visualization with radar charts
- **ITE Score Trends** - Historical performance tracking
- **Period Scores** - Longitudinal competency tracking across PGY levels
- **Gap Analysis** - Faculty vs self-assessment comparison

### Current Data (Memorial Healthcare System EM Program)

- **50 Residents** across 4 classes (2024-2028)
- **13 Faculty Members**
- **5,860 MedHub Evaluation Comments** (2022-2025)
- **319 EQ+PQ+IQ Ratings** (267 faculty + 52 self-assessments)
- **AI SWOT Analyses** with supporting citations
- **ITE Scores** across all PGY levels

---

## Database Schema

### Core Analytics Tables

#### `imported_comments`
Stores raw evaluation comments from MedHub CSV imports.

**Key Columns:**
- `resident_id` - Links to residents table
- `date_completed` - When evaluation was completed
- `evaluatee` - Original name from MedHub
- `evaluation_type` - Type of evaluation
- `comment_text` - The actual comment
- `pgy_level` - Calculated PGY level (e.g., "PGY-2")
- `period` - Fall or Spring
- `period_label` - Combined label (e.g., "PGY-2 Fall")

**Usage:**
- Source data for AI SWOT analysis
- Historical evaluation tracking
- Faculty feedback repository

---

#### `structured_ratings`
Stores detailed EQ+PQ+IQ ratings with 15 individual attributes.

**Key Columns:**
- `resident_id` - Resident being evaluated
- `faculty_id` - Faculty evaluator (NULL for self-assessments)
- `rater_type` - 'faculty' or 'self'
- `period_label` - Academic period (e.g., "PGY-2 Spring")

**EQ Attributes (Emotional Quotient):**
- `eq_empathy_positive_interactions` (1.0-5.0)
- `eq_adaptability_self_awareness` (1.0-5.0)
- `eq_stress_management_resilience` (1.0-5.0)
- `eq_curiosity_growth_mindset` (1.0-5.0)
- `eq_effectiveness_communication` (1.0-5.0)
- `eq_avg` - Calculated average

**PQ Attributes (Professional Quotient):**
- `pq_work_ethic_reliability` (1.0-5.0)
- `pq_integrity_accountability` (1.0-5.0)
- `pq_teachability_receptiveness` (1.0-5.0)
- `pq_documentation` (1.0-5.0)
- `pq_leadership_relationships` (1.0-5.0)
- `pq_avg` - Calculated average

**IQ Attributes (Intellectual Quotient):**
- `iq_knowledge_base` (1.0-5.0)
- `iq_analytical_thinking` (1.0-5.0)
- `iq_commitment_learning` (1.0-5.0)
- `iq_clinical_flexibility` (1.0-5.0)
- `iq_performance_for_level` (1.0-5.0)
- `iq_avg` - Calculated average

**Usage:**
- Powers 15-point radar charts
- Gap analysis (faculty vs self)
- Competency trend tracking

---

#### `period_scores`
Aggregated scores by resident and academic period.

**Key Columns:**
- `resident_id` - Resident
- `period_label` - Academic period
- `faculty_eq_avg`, `faculty_pq_avg`, `faculty_iq_avg` - Faculty averages
- `faculty_n_raters` - Number of faculty evaluators
- `faculty_ratings_detail` - JSONB with all 15 attributes
- `self_eq_avg`, `self_pq_avg`, `self_iq_avg` - Self-assessment averages
- `self_ratings_detail` - JSONB with all 15 attributes
- `self_faculty_gap_eq`, `self_faculty_gap_pq`, `self_faculty_gap_iq` - Gap analysis

**JSONB Structure:**
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

**Usage:**
- Dashboard displays aggregated data
- Historical trend analysis
- Radar chart data source

---

#### `swot_summaries`
AI-generated SWOT analysis using Claude API.

**Key Columns:**
- `resident_id` - Resident
- `period_label` - Academic period
- `strengths` - JSONB array of strength elements
- `weaknesses` - JSONB array of weakness elements
- `opportunities` - JSONB array of opportunity elements
- `threats` - JSONB array of threat elements
- `analysis_version` - Version tracking (e.g., "v1.0")

**JSONB Element Structure:**
```json
{
  "description": "Demonstrates exceptional clinical decision-making under pressure",
  "frequency": 12,
  "supporting_quotes": [
    {
      "quote": "Made excellent clinical decisions in high-acuity situations",
      "citation": "Faculty Comment 15 (2024-03-15)"
    },
    {
      "quote": "Consistently demonstrates sound judgment in complex cases",
      "citation": "Faculty Comment 23 (2024-05-20)"
    }
  ]
}
```

**Usage:**
- Dashboard SWOT tab
- Actionable feedback for residents
- Program director insights

---

#### `ite_scores`
In-Training Exam scores for performance tracking.

**Key Columns:**
- `resident_id` - Resident
- `test_date` - When exam was taken
- `academic_year` - Academic year (e.g., "2023-2024")
- `pgy_level` - PGY level at time of exam
- `percentile` - National percentile rank
- `raw_score` - Raw exam score

**Usage:**
- ITE score trends
- Performance benchmarking
- Identify struggling residents
- ITE Archetype Classification

---

#### `archetype_methodology_versions`
Tracks versioning of archetype classification methodologies.

**Key Columns:**
- `version` - Semantic version (e.g., "1.0.0")
- `name` - Version name (e.g., "Memorial v1.0 Initial")
- `description` - Description of the methodology
- `is_current` - Whether this is the active version
- `archetype_definitions` - JSONB containing all archetype rules
- `thresholds` - JSONB with classification thresholds
- `created_at` - When version was created

**Usage:**
- Version control for archetype methodology
- Enables methodology evolution tracking
- Supports A/B testing of classification rules

---

#### `resident_classifications`
Stores ITE archetype classifications for residents with versioning support.

**Key Columns:**
- `resident_id` - Resident being classified
- `pgy1_percentile`, `pgy2_percentile`, `pgy3_percentile` - ITE scores
- `delta_12`, `delta_23`, `delta_total` - Score changes between years
- `data_years` - Number of years of ITE data (1, 2, or 3)
- `original_archetype_id`, `original_archetype_name` - Initial classification
- `current_archetype_id`, `current_archetype_name` - Current classification
- `original_confidence`, `current_confidence` - Classification confidence
- `original_risk_level`, `current_risk_level` - Risk assessment
- `has_version_drift` - Whether classification changed across versions
- `similar_residents` - JSONB array of similar historical profiles
- `recommendations` - JSONB array of archetype-specific recommendations

**Usage:**
- Powers ITE Scores tab in resident analytics
- Trajectory archetype classification
- Similar historical profile matching
- Methodology drift detection

---

#### `classification_history`
Audit trail of all classification changes.

**Key Columns:**
- `resident_id` - Resident
- `archetype_id`, `archetype_name` - Classification at this point
- `methodology_version` - Which version was used
- `trigger` - What caused the classification (initial, version_update, manual_review)
- `triggered_by` - Who/what triggered it

**Usage:**
- Complete audit trail for classifications
- Enables rollback and comparison
- Compliance and transparency

---

#### `attribute_period_averages`
Pre-computed averages for trendline calculations.

**Key Columns:**
- `scope_type` - 'class' or 'program'
- `scope_id` - Class year (for class scope) or NULL (for program scope)
- `period_label` - Academic period (e.g., "PGY-1 Fall")
- `attribute_key` - Attribute identifier (e.g., "eq_empathy", "pq_work_ethic")
- `avg_score` - Average score for this attribute (1.0-5.0)
- `n_residents` - Number of residents included in average

**Usage:**
- Powers class and program trendlines on AttributeTimelineChart
- Pre-computed for performance (avoids real-time aggregation)
- Updated by `scripts/aggregate-attribute-averages.ts`

**Unique Constraint:** `(scope_type, scope_id, period_label, attribute_key)`

---

### Helper Functions

#### `calculate_pgy_level(class_id UUID, evaluation_date DATE)`
Calculates PGY level based on class graduation date and evaluation date.

**Returns:** TEXT (e.g., "PGY-1", "PGY-2", "Graduated")

**Usage:**
```sql
SELECT calculate_pgy_level(
  (SELECT class_id FROM residents WHERE id = 'resident-uuid'),
  '2024-03-15'::date
);
-- Returns: "PGY-2"
```

---

#### `determine_period(pgy_level TEXT, evaluation_date DATE)`
Determines academic period (Fall or Spring) based on date.

**Returns:** TEXT ("Fall" or "Spring")

**Logic:**
- July 1 - December 31: Fall
- January 1 - June 30: Spring

**Usage:**
```sql
SELECT determine_period('PGY-2', '2024-10-15'::date);
-- Returns: "Fall"
```

---

## Dashboard Features

### SWOT Analysis Tab

**Features:**
- AI-generated insights from faculty evaluations
- Brutally honest feedback with severity levels
- Supporting citations from actual comments
- Expandable quote sections
- Frequency indicators for common themes
- Period selector (PGY-1 Fall through PGY-4 Spring)
- **SWOT Element Filter** - Filter by Strengths, Weaknesses, Opportunities, or Threats
- **Historical Class Comparison** - Side-by-side view of current vs. previous classes
- **Evidence Modal** - View all 400+ supporting comments with full context
- **Rubric Transparency** - Info icon (ℹ️) displays complete AI analysis rubric

**Data Source:**
- `swot_summaries` table
- Generated by Claude API from `imported_comments`

**UI Components:**
- `SWOTTab.tsx` - Main tab container with two-column comparison layout and rubric info icon
- `SWOTCard.tsx` - Individual SWOT element cards with citations accordion
- `SWOTElementSelector.tsx` - Dropdown filter for SWOT categories
- `HistoricalComparison.tsx` - Container for historical class data
- `HistoricalClassCard.tsx` - Expandable cards for previous classes
- `SWOTEvidenceModal.tsx` - Modal showing all supporting comments
- `RubricModal.tsx` - Full-screen modal displaying the complete AI rubric

**Example SWOT Element:**
```
Weakness: Struggles with time management during high-volume shifts (Most)

Supporting Quotes:
• "Needs to improve efficiency during busy shifts" - Faculty Comment 12 (2024-02-15)
• "Time management is an area for growth" - Faculty Comment 18 (2024-03-20)
• "Can be slow to complete documentation" - Faculty Comment 25 (2024-04-10)

[View all supporting comments] - Opens modal with all 240 relevant comments
```

**Historical Comparison View:**

When both a specific Period (e.g., "PGY-3") and SWOT Element (e.g., "Weaknesses") are selected, the dashboard displays a two-column layout:

- **Left Column (50%)**: Current class with full SWOT details, citations, and evidence modal
- **Right Column (50%)**: Historical classes in reverse chronological order with expandable cards

Example:
```
┌─────────────────────────────────┬─────────────────────────────────┐
│ Current Class                   │ Historical Comparison (2)       │
│                                 │                                 │
│ Class of 2026 - PGY-3          │ ▼ Class of 2025 | PGY-3        │
│ Weaknesses (4)                 │    Weaknesses (3)               │
│ • Multiple residents struggle...│    • Documentation issues...    │
│ • Several residents show...     │    • Time management...         │
│                                 │                                 │
│                                 │ ▼ Class of 2024 | PGY-3        │
│                                 │    Weaknesses (5)               │
│                                 │    • Procedural confidence...   │
└─────────────────────────────────┴─────────────────────────────────┘
```

**Rubric Transparency:**

An info icon (ℹ️) appears next to the period/element selectors. Clicking it opens a full-screen modal displaying:

- Complete AI analysis rubric used by Claude
- SWOT category definitions (Strengths, Weaknesses with severity levels, Opportunities, Threats)
- Scoring scale (1.0-5.0) with detailed descriptions
- All 15 EQ+PQ+IQ attributes with definitions
- Evidence requirements and supporting quote criteria
- Analysis philosophy ("brutally honest" approach)
- Rubric version and last updated date

**Single Source of Truth**: The rubric is extracted directly from the prompt template (`lib/ai/swot-prompt.ts`) to ensure the displayed rubric always matches what Claude actually uses.

---

### EQ+PQ+IQ Scores Tab

**Features:**
- 15-point radar chart with visual grouping
- Faculty vs Self-assessment overlay
- Color-coded sections:
  - EQ (Emotional): Pink (#FF6B9D)
  - PQ (Professional): Teal (#4ECDC4)
  - IQ (Intellectual): Light Green (#95E1D3)
- Gap analysis metrics
- Detailed scores table
- ITE score history

**Data Source:**
- `period_scores` table (aggregated from `structured_ratings`)
- `ite_scores` table

**UI Components:**
- `ScoresTab.tsx` - Main tab container
- `RadarChart.tsx` - 15-point radar visualization (Recharts)
- `GapAnalysis.tsx` - Faculty vs Self comparison

**Radar Chart Attributes:**
```
EQ Section (5 points):
- Empathy
- Adaptability
- Stress Management
- Curiosity
- Communication

PQ Section (5 points):
- Work Ethic
- Integrity
- Teachability
- Documentation
- Leadership

IQ Section (5 points):
- Knowledge Base
- Analytical Thinking
- Commitment to Learning
- Clinical Flexibility
- Performance for Level
```

---

### Period Selector

**Features:**
- Filter data by academic period
- Dropdown with all available periods for resident
- Automatically updates SWOT and Scores tabs

**Periods:**
- PGY-1 Fall, PGY-1 Spring
- PGY-2 Fall, PGY-2 Spring
- PGY-3 Fall, PGY-3 Spring
- PGY-4 Fall, PGY-4 Spring

---

### Competencies Tab (Placeholder)

**Status:** Coming Soon

**Planned Features:**
- ACGME competency tracking
- Milestone progress
- Competency-specific feedback

---

## AI Integration

### Claude API Configuration

**File:** `lib/ai/claude-analyzer.ts`

**Features:**
- Anthropic Claude API client
- Retry logic with exponential backoff
- Error handling and logging
- Rate limit management

**Configuration:**
```typescript
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const maxRetries = 3;
const baseDelay = 1000; // 1 second
```

---

### SWOT Analysis Prompt & Rubric

**File:** `lib/ai/swot-prompt.ts`

**Version**: 1.0.0 (Last Updated: January 22, 2025)

**Rubric Transparency:**

The complete rubric is available to all users via:
1. **Info Icon (ℹ️)**: Click the info icon on any SWOT analysis page to view the full rubric in a modal
2. **Truths Module**: Download the rubric as a document from Modules → Truths → AI Protocols
3. **Single Source of Truth**: The rubric is extracted directly from the prompt template to ensure accuracy

**Prompt Structure:**
```
You are an expert medical education analyst evaluating a resident physician based on faculty evaluations.

CONTEXT:
- Resident: [Anonymized Name]
- Period: [PGY-X Fall/Spring]
- Number of Comments: [N]

TONE: Brutally honest, evidence-based, clinically focused

SWOT CATEGORIES:
1. Strengths (3-5 items) - Genuine strengths with evidence
2. Weaknesses (3-5 items) - With severity levels:
   • CRITICAL: Patient safety concern, professionalism issue, major competency gap
   • MODERATE: Significant skill deficiency requiring improvement plan
   • MINOR: Area for refinement, normal developmental need
3. Opportunities (2-4 items) - Growth areas based on strengths
4. Threats (1-3 items) - Risks to development (burnout, bad habits, plateaus)

SCORING (1.0-5.0):
- 15 attributes across EQ, PQ, IQ domains
- Evidence-based only
- Honest assessment (don't inflate scores)

EVIDENCE:
- 2-3 supporting quotes per SWOT element
- Exact text from evaluations (15-30 words)
- Citations: [Comment #X]

OUTPUT FORMAT: JSON with confidence score
```

**Key Features:**
- Brutally honest tone for program directors
- Severity levels for weaknesses (Critical/Moderate/Minor)
- Supporting quotes with citations
- 15-point EQ+PQ+IQ scoring
- Confidence scoring (0.0-1.0)
- Version tracking for rubric changes

---

### AI-Generated Attribute Scores

**Component:** `AttributeScoresBar.tsx`  
**Database Column:** `period_scores.ai_scores_detail` (JSONB)  
**Status:** Production - Fully Operational

#### Overview

In addition to SWOT analysis, the AI system generates **quantifiable scores for all 15 EQ/PQ/IQ attributes** by analyzing narrative evaluation comments. These scores are displayed as a horizontal bar chart above the SWOT analysis.

#### Methodology

**1. Input Data:**
- All faculty evaluation comments for a resident in a given period (e.g., "PGY-1 Fall")
- Minimum 3 comments required for reliable analysis
- Same dataset used for SWOT analysis

**2. AI Analysis:**
- Claude reads each comment and identifies evidence for each of the 15 attributes
- Scores each attribute on a 1.0-5.0 scale based on observed behaviors
- Uses the EQ+PQ+IQ framework definitions from `docs/EQ-PQ-IQ.md`
- Generates a confidence score (0.0-1.0) indicating certainty

**3. Scoring Rubric:**

**Emotional Quotient (EQ):**
- Empathy & Positive Interactions
- Adaptability & Self-Awareness
- Stress Management & Resilience
- Curiosity & Growth Mindset
- Communication Skills

**Professional Quotient (PQ):**
- Work Ethic & Reliability
- Integrity & Accountability
- Teachability & Receptiveness
- Documentation & Organization
- Leadership & Initiative

**Intellectual Quotient (IQ):**
- Medical Knowledge & Expertise
- Analytical & Problem-Solving
- Learning & Knowledge Application
- Cognitive Flexibility
- Clinical Performance Under Pressure

**4. Quality Assurance:**
- **Evidence-Based:** Scores must be supported by specific comments
- **Rubric Alignment:** Uses same definitions as structured rating forms
- **Confidence Tracking:** Low confidence (<0.6) indicates insufficient data
- **Version Control:** `analysis_version` field allows re-analysis with improved prompts

#### Data Storage

Scores are stored in the `period_scores` table:

```sql
-- Aggregate averages (for backward compatibility)
ai_eq_avg NUMERIC(3,2)
ai_pq_avg NUMERIC(3,2)
ai_iq_avg NUMERIC(3,2)

-- Full 15-attribute breakdown (NEW)
ai_scores_detail JSONB
```

**JSONB Structure:**
```json
{
  "eq": {
    "empathy": 3.5,
    "adaptability": 3.0,
    "stress_mgmt": 2.5,
    "curiosity": 4.0,
    "communication": 3.5,
    "avg": 3.3
  },
  "pq": {
    "work_ethic": 4.0,
    "integrity": 4.5,
    "teachability": 3.0,
    "documentation": 2.5,
    "leadership": 3.0,
    "avg": 3.4
  },
  "iq": {
    "knowledge": 3.5,
    "analytical": 3.0,
    "learning": 4.0,
    "flexibility": 3.5,
    "performance": 3.0,
    "avg": 3.4
  }
}
```

#### UI Display

**Location:** Resident Overview → SWOT Analysis Tab (above SWOT cards)

**Component:** `AttributeTimelineChart.tsx`

**Display Conditions:**
- Shown for residents with AI-analyzed periods
- Displays all available periods simultaneously for trend analysis
- Requires `ai_scores_detail` to be populated in `period_scores`

**Features:**
- **Vertically stacked layout** with three sections (EQ, PQ, IQ)
- **Vertical bar chart** showing scores over time for each attribute
- **Color-coded categories:**
  - EQ: Green bars (`#22c55e`) with light green background (`#dcfce7`)
  - PQ: Blue bars (`#3b82f6`) with light blue background (`#dbeafe`)
  - IQ: Purple bars (`#a855f7`) with light purple background (`#f3e8ff`)
- **Full period labels** displayed vertically inside bars (e.g., "PGY-1 Fall", "PGY-2 Spring")
- **Bottom-justified text** - period labels start at the x-axis/bottom of each bar
- **Score values** displayed at the top of each bar (e.g., "3.5")
- **Full attribute names** shown below each bar cluster
- **Hover tooltips** with complete attribute name and period score
- **Confidence indicator** with color coding:
  - High (≥80%): Green
  - Moderate (60-79%): Yellow
  - Low (<60%): Red
- **Methodology note** explaining AI interpretation

**Layout:**
```
┌─────────────────────────────────────────────────────────────────────┐
│ AI-Generated Attribute Scores Over Time                             │
│ Based on 206 comments across 8 periods • High Confidence (92%)      │
├─────────────────────────────────────────────────────────────────────┤
│ Emotional Quotient (EQ)                                             │
│ ─────────────────────────────────────────────────────────────────── │
│   ┌──┬──┬──┬──┐  ┌──┬──┬──┬──┐  ┌──┬──┬──┬──┐  ┌──┬──┬──┬──┐  ┌──┬──┬──┬──┐
│   │3.5│3.0│3.5│4.0│  │3.0│3.5│4.0│4.5│  │2.5│3.0│3.5│4.0│  │3.0│3.5│4.0│4.5│  │3.5│4.0│4.5│5.0│
│   │P │P │P │P │  │P │P │P │P │  │P │P │P │P │  │P │P │P │P │  │P │P │P │P │
│   │G │G │G │G │  │G │G │G │G │  │G │G │G │G │  │G │G │G │G │  │G │G │G │G │
│   │Y │Y │Y │Y │  │Y │Y │Y │Y │  │Y │Y │Y │Y │  │Y │Y │Y │Y │  │Y │Y │Y │Y │
│   │- │- │- │- │  │- │- │- │- │  │- │- │- │- │  │- │- │- │- │  │- │- │- │- │
│   │1 │1 │2 │2 │  │1 │1 │2 │2 │  │1 │1 │2 │2 │  │1 │1 │2 │2 │  │1 │1 │2 │2 │
│   │F │S │F │S │  │F │S │F │S │  │F │S │F │S │  │F │S │F │S │  │F │S │F │S │
│   └──┴──┴──┴──┘  └──┴──┴──┴──┘  └──┴──┴──┴──┘  └──┴──┴──┴──┘  └──┴──┴──┴──┘
│   Empathy &      Curiosity &    Stress Mgmt    Adaptability   Communication
│   Positive       Growth         & Resilience   & Self-        Skills
│   Interactions   Mindset                       Awareness
├─────────────────────────────────────────────────────────────────────┤
│ Professional Quotient (PQ)                                          │
│ ─────────────────────────────────────────────────────────────────── │
│   [5 attribute groups with blue vertical bars over time...]         │
├─────────────────────────────────────────────────────────────────────┤
│ Intellectual Quotient (IQ)                                          │
│ ─────────────────────────────────────────────────────────────────── │
│   [5 attribute groups with purple vertical bars over time...]       │
├─────────────────────────────────────────────────────────────────────┤
│ ℹ️ Methodology: Scores represent AI interpretation of narrative     │
│    evaluation comments using the EQ+PQ+IQ framework. Each bar       │
│    shows the score for one academic period. Hover for details.      │
└─────────────────────────────────────────────────────────────────────┘
```

**Technical Implementation:**
- Uses pure inline styles for reliable rendering across all browsers
- Vertically stacked sections for each quotient category (EQ, PQ, IQ)
- Bar heights calculated as `(score / 5.0) * 100%` with minimum 30px for visibility
- Period labels use CSS `writing-mode: vertical-rl` with `transform: rotate(180deg)`
- Labels positioned at bottom with `position: absolute; bottom: 4px`
- Full attribute names displayed below each bar cluster
- Responsive design adapts to container width

---

#### Trendlines

**Feature:** Linear regression trendlines overlaid on each attribute bar cluster

**Purpose:** Compare individual resident progress against class and program averages to identify:
- Personal trajectory (improving, stable, or declining)
- Performance relative to peers
- Areas where resident excels or needs support

**Three Trendlines Per Attribute:**

1. **Resident Trend** (solid blue `#3b82f6`)
   - Linear regression of the resident's individual scores across all periods
   - Shows personal trajectory over time

2. **Class Average Trend** (dashed orange `#f97316`)
   - Linear regression of class-wide averages for that attribute
   - Compares resident to peers in the same graduating class

3. **Program Average Trend** (dotted red `#ef4444`)
   - Linear regression of program-wide averages for that attribute
   - Compares resident to all residents in the program

**Data Sources:**

| Trendline | Source Table | Scope |
|-----------|--------------|-------|
| Resident | `period_scores.ai_scores_detail` | Individual resident |
| Class | `attribute_period_averages` (scope_type='class') | Class year |
| Program | `attribute_period_averages` (scope_type='program') | All residents |

**Linear Regression Calculation:**

Uses least-squares regression to find best-fit line:
- `y = mx + b` where `m` = slope, `b` = intercept
- X-axis: Period index (0 = PGY-1 Fall, 1 = PGY-1 Spring, etc.)
- Y-axis: Score (1.0 - 5.0)

**Interpretation:**
- **Positive slope:** Improving over time
- **Negative slope:** Declining over time
- **Flat line:** Stable performance

**Legend:**
```
─── Resident Trend    - - - Class of 2025 Avg    ··· Program Avg
```

**API Endpoint:** `GET /api/analytics/trendlines/resident/[id]`

Returns resident scores, class averages, and program averages for all 15 attributes.

**Pre-computed Averages:**

Class and program averages are pre-computed and stored in `attribute_period_averages` table for performance. Run the aggregation script after importing new data:

```bash
node -r dotenv/config scripts/aggregate-attribute-averages.ts
```

---

#### Differences from Structured Ratings

**AI-Generated Scores (from comments):**
- ✅ Available when structured ratings don't exist
- ✅ Derived from rich narrative feedback
- ✅ Can identify patterns across many comments
- ⚠️ Subject to AI interpretation
- ⚠️ Quality depends on comment clarity
- ⚠️ Confidence varies with data volume

**Structured Ratings (from forms):**
- ✅ Direct faculty assessment with explicit 1-5 scale
- ✅ Standardized across all evaluators
- ✅ No interpretation layer
- ⚠️ May not exist for all periods
- ⚠️ Less contextual detail

**Best Practice:** Use both together when available. AI scores provide insights when structured ratings are missing, and can validate/supplement structured data.

#### When to Use AI Scores

**Good Use Cases:**
- Historical data where only narrative comments exist
- Identifying trends across multiple evaluations
- Supplementing structured ratings with comment-based evidence
- Exploratory analysis to identify areas for deeper investigation

**Limitations:**
- Not a replacement for direct faculty assessment
- Confidence score indicates reliability (aim for ≥70%)
- Requires minimum 3 comments for meaningful analysis
- Best used for formative feedback, not high-stakes decisions

#### Confidence Thresholds

| Confidence | Interpretation | Recommendation |
|------------|----------------|----------------|
| ≥80% | High - Strong evidence in comments | Use with confidence |
| 60-79% | Moderate - Some ambiguity | Use with caution, seek additional data |
| <60% | Low - Insufficient or unclear data | Do not rely on scores, collect more data |

#### Technical Implementation

**Analysis Scripts:**
- `scripts/analyze-all-residents.ts` - Batch analysis for all residents
- `scripts/analyze-larissa-comments.ts` - Single resident analysis

**Key Code Change:**
```typescript
// Store full 15-attribute breakdown
await supabase.from('period_scores').insert({
  resident_id: residentId,
  period_label: period.period_label,
  ai_eq_avg: result.scores.eq.avg,
  ai_pq_avg: result.scores.pq.avg,
  ai_iq_avg: result.scores.iq.avg,
  ai_scores_detail: result.scores, // NEW: Full breakdown
  ai_n_comments: period.n_comments,
  ai_confidence_avg: result.confidence,
  // ...
});
```

**Migration:**
```sql
-- Add JSONB column for detailed AI scores
ALTER TABLE public.period_scores 
ADD COLUMN IF NOT EXISTS ai_scores_detail JSONB;

-- Create index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_period_scores_ai_detail 
ON public.period_scores USING gin(ai_scores_detail);
```

#### Re-running Analysis

To backfill AI scores for existing SWOT analyses:

```bash
# Run migration first
psql -d lev8 -f supabase/migrations/20250126000001_add_ai_attribute_scores.sql

# Re-analyze all residents (will update period_scores with full breakdown)
node -r dotenv/config scripts/analyze-all-residents.ts

# Or analyze specific resident
node -r dotenv/config scripts/analyze-larissa-comments.ts
```

**Note:** Re-running analysis will create new records with updated `analysis_version`. Old records are preserved with `is_current = false`.

---

### Running AI Analysis

**Script:** `scripts/analyze-larissa-comments.ts`

**Usage:**
```bash
# Analyze specific resident
node -r dotenv/config scripts/analyze-larissa-comments.ts

# Modify script to analyze all residents or specific cohorts
```

**Process:**
1. Fetch comments from `imported_comments` for resident/period
2. Group comments by period_label
3. Send to Claude API with prompt
4. Parse JSON response
5. Insert into `swot_summaries` table
6. Handle errors and retries

**Cost Estimate:**
- ~$2-3 per resident (all periods)
- ~$0.50 per period analysis
- Based on Claude Sonnet pricing

---

## Data Privacy & Anonymization

### Overview

**All resident data is anonymized before being sent to external AI APIs (Anthropic Claude) for analysis.**

This comprehensive anonymization protocol ensures HIPAA compliance and protects resident privacy while enabling AI-powered analytics.

---

### Anonymization Protocol

#### 1. Name Pseudonymization

**Implementation:** `lib/ai/anonymizer.ts`

Real resident names are replaced with pseudonymous identifiers:
- "Resident A", "Resident B", "Resident C", etc.
- Consistent within a single analysis session
- Mapping exists only in memory (never persisted)
- Cleared after each analysis run

**Example:**
```typescript
import { anonymizeResidentName } from '@/lib/ai/anonymizer';

const pseudonym = anonymizeResidentName(
  '3ba5dff9-5699-4499-8e51-0d8cd930b764',
  'Larissa Tavares'
);
// Returns: "Resident A"
```

---

#### 2. Date Generalization

Specific dates are converted to relative time periods to prevent temporal identification:

**Conversion Logic:**
- July-August: "Early in rotation period"
- September-November: "Mid-rotation period"
- December-February: "Late in rotation period"
- March-June: "Spring rotation period"

**Example:**
```typescript
import { anonymizeDate } from '@/lib/ai/anonymizer';

anonymizeDate('2024-10-15');
// Returns: "Mid-rotation period"
```

---

#### 3. PHI Scrubbing

Protected Health Information is automatically detected and redacted using pattern matching:

**Patterns Detected:**
- Medical Record Numbers (MRN)
- Social Security Numbers
- Patient names in comments
- Phone numbers
- Email addresses
- Specific dates and times
- Hospital room/bed numbers

**Example:**
```typescript
import { scrubPHI } from '@/lib/ai/anonymizer';

const comment = "Patient John Smith (MRN: 12345) was seen in Room 301";
const scrubbed = scrubPHI(comment);
// Returns: "the patient ([MRN REDACTED]) was seen in [LOCATION REDACTED]"
```

---

#### 4. PII Detection Checks

Before sending any data to Claude API, a verification check runs to ensure no PII leaked through:

**Implementation:** `lib/ai/claude-analyzer.ts` (line 95)

```typescript
// CRITICAL PRIVACY CHECK: Verify no PII in prompt before sending
if (containsPII(prompt)) {
  throw new Error('PII detected in prompt! Anonymization failed.');
}
```

**If PII is detected:**
- API call is immediately aborted
- Error is logged with prompt preview
- No data is sent to external API

---

### Audit Trail

#### `ai_anonymization_log` Table

Every API call to external AI services is logged for compliance:

**Tracked Information:**
- `resident_id` - Internal ID (not sent to API)
- `period_label` - Academic period analyzed
- `pseudonym` - What pseudonym was used
- `n_comments_sent` - Number of comments analyzed
- `api_provider` - "anthropic"
- `api_model` - "claude-sonnet-4-20250514"
- `data_sanitized` - Boolean flag
- `phi_scrubbed` - Boolean flag
- `names_anonymized` - Boolean flag
- `dates_generalized` - Boolean flag
- `analysis_timestamp` - When analysis occurred

**Query Audit Trail:**
```sql
-- View all anonymized analyses
SELECT 
  up.full_name,
  aal.pseudonym,
  aal.period_label,
  aal.n_comments_sent,
  aal.analysis_timestamp
FROM ai_anonymization_log aal
JOIN residents r ON aal.resident_id = r.id
JOIN user_profiles up ON r.user_id = up.id
ORDER BY aal.analysis_timestamp DESC;
```

**Example Output:**
```
full_name        | pseudonym   | period_label | n_comments_sent | analysis_timestamp
-----------------|-------------|--------------|-----------------|-------------------
Larissa Tavares  | Resident A  | PGY-2 Fall   | 28              | 2025-01-23 14:30:00
Andrew Gonedes   | Resident B  | PGY-1 Spring | 22              | 2025-01-23 14:31:15
```

---

### Analysis Scripts

#### Single Resident Analysis
**File:** `scripts/analyze-larissa-comments.ts`

Analyzes one resident with full anonymization:
```bash
cd /Users/alfadiallo/lev8
node -r dotenv/config scripts/analyze-larissa-comments.ts
```

**Output Includes:**
```
🔒 Anonymized: Larissa Tavares → Resident A
✓ PII check passed - prompt is anonymized
🔒 Privacy Protection:
   - Residents anonymized: 1
   - Pseudonyms generated: 1
   - All PII scrubbed before sending to Claude
```

---

#### All Residents Analysis
**File:** `scripts/analyze-all-residents.ts`

Production script for analyzing all residents:
```bash
cd /Users/alfadiallo/lev8
node -r dotenv/config scripts/analyze-all-residents.ts
```

**Features:**
- Loops through all residents with sufficient data (≥5 comments per period)
- Anonymizes each resident independently
- Logs to audit trail
- Clears session mapping after completion
- Provides comprehensive privacy statistics

---

### Security Measures Summary

1. **Name Pseudonymization** ✓
   - Real names replaced with "Resident A", "Resident B", etc.
   
2. **Date Generalization** ✓
   - Specific dates replaced with relative periods
   
3. **PHI Scrubbing** ✓
   - Pattern matching to detect/redact patient identifiers
   
4. **Audit Trail** ✓
   - Complete log of what was sent to external APIs
   
5. **No Persistent Mapping** ✓
   - Pseudonym mappings exist only in memory during analysis
   
6. **Verification Checks** ✓
   - Assert no PII before API calls

---

### Compliance Notes

**HIPAA Considerations:**
- Data is anonymized before leaving the system
- No Protected Health Information (PHI) is sent to external APIs
- Audit trail provides compliance documentation
- Resident names are pseudonymized

**Anthropic Data Handling:**
- Commercial API data is NOT used for training (per Anthropic policy as of 2024)
- Data retention: 30 days for trust & safety
- Zero Data Retention (ZDR) available for enterprise customers
- SOC 2 Type II certified

**Recommendations for Production:**
- Consider upgrading to Anthropic Enterprise tier
- Enable Zero Data Retention (ZDR)
- Execute Business Associate Agreement (BAA) for HIPAA compliance
- Regular audit trail reviews

---

## API Endpoints

### SWOT Analysis Endpoints

#### `GET /api/analytics/swot/resident/[id]`
Get SWOT analysis for a specific resident.

**Query Parameters:**
- `period` (optional) - Filter by period_label

**Response:**
```json
{
  "resident_id": "uuid",
  "period_label": "PGY-2 Fall",
  "strengths": [...],
  "weaknesses": [...],
  "opportunities": [...],
  "threats": [...]
}
```

#### `GET /api/analytics/swot/class/[year]`
Get aggregated SWOT for a class by PGY year.

**Response:**
```json
{
  "swot": [
    {
      "id": "uuid",
      "class_year": 2026,
      "period_label": "PGY-3",
      "strengths": [
        {
          "description": "Cohort demonstrates strong clinical reasoning...",
          "prevalence": "majority",
          "supporting_quotes": [...]
        }
      ],
      "weaknesses": [...],
      "opportunities": [...],
      "threats": [...],
      "n_comments_analyzed": 435,
      "ai_confidence": 0.85
    }
  ]
}
```

#### `GET /api/analytics/swot/class/compare`
Get historical class SWOT data for comparison.

**Query Parameters:**
- `period_label` (required) - PGY level (e.g., "PGY-3")
- `swot_type` (required) - SWOT category ("strengths", "weaknesses", "opportunities", "threats")
- `exclude_year` (required) - Current class year to exclude

**Response:**
```json
{
  "comparisons": [
    {
      "class_year": 2025,
      "period_label": "PGY-3",
      "items": [
        {
          "description": "Documentation issues prevalent...",
          "prevalence": "most"
        }
      ],
      "n_comments_analyzed": 583,
      "ai_confidence": 0.85
    },
    {
      "class_year": 2024,
      "period_label": "PGY-3",
      "items": [...],
      "n_comments_analyzed": 483,
      "ai_confidence": 0.92
    }
  ]
}
```

**Usage:**
- Powers the historical comparison view in class-level SWOT dashboard
- Returns classes in reverse chronological order
- Only includes classes with data for the specified PGY level

#### `GET /api/analytics/swot/evidence`
Get all supporting comments for a SWOT element.

**Query Parameters:**
- `class_year` (optional) - Filter by graduation class
- `period_label` (required) - PGY level (e.g., "PGY-3")
- `theme` (required) - SWOT element description for filtering

**Response:**
```json
{
  "comments": [
    {
      "id": "uuid",
      "comment_text": "Full evaluation comment...",
      "resident_name": "John Doe",
      "faculty_name": "Dr. Smith",
      "date_completed": "2024-03-15",
      "rotation_name": "Emergency Medicine",
      "pgy_level": "PGY-3",
      "relevance_score": 0.85
    }
  ],
  "total_count": 240
}
```

**Usage:**
- Powers the "View all supporting comments" modal
- Uses theme matching algorithm to filter relevant comments
- Returns comments with full context (names, dates, rotations)

#### `GET /api/analytics/swot/program`
Get program-wide SWOT trends.

**Status:** Planned

---

### Scores Endpoints

#### `GET /api/analytics/scores/resident/[id]`
Get EQ+PQ+IQ scores for a specific resident.

**Query Parameters:**
- `period` (optional) - Filter by period_label

**Response:**
```json
{
  "resident_id": "uuid",
  "period_label": "PGY-2 Fall",
  "faculty_eq_avg": 3.8,
  "faculty_pq_avg": 4.1,
  "faculty_iq_avg": 3.5,
  "faculty_n_raters": 5,
  "faculty_ratings_detail": {
    "eq_empathy": 4.0,
    "eq_adaptability": 3.5,
    ...
  },
  "self_eq_avg": 4.2,
  "self_pq_avg": 4.5,
  "self_iq_avg": 4.0,
  "self_ratings_detail": {...},
  "self_faculty_gap_eq": 0.4,
  "self_faculty_gap_pq": 0.4,
  "self_faculty_gap_iq": 0.5
}
```

#### `GET /api/analytics/scores/class/[year]`
Get aggregated scores for a class.

**Status:** Planned

#### `GET /api/analytics/scores/program`
Get program-wide score trends.

**Status:** Planned

---

### Trendline Endpoints

#### `GET /api/analytics/trendlines/resident/[id]`
Get trendline data for a specific resident including class and program averages.

**Response:**
```json
{
  "resident": {
    "eq_empathy": [
      { "period": "PGY-1 Fall", "score": 3.5 },
      { "period": "PGY-1 Spring", "score": 3.8 },
      { "period": "PGY-2 Fall", "score": 4.0 }
    ],
    "eq_adaptability": [...],
    ...
  },
  "class": {
    "class_year": 2025,
    "data": {
      "eq_empathy": [
        { "period": "PGY-1 Fall", "score": 3.2 },
        { "period": "PGY-1 Spring", "score": 3.5 }
      ],
      ...
    }
  },
  "program": {
    "eq_empathy": [
      { "period": "PGY-1 Fall", "score": 3.0 },
      { "period": "PGY-1 Spring", "score": 3.3 }
    ],
    ...
  }
}
```

**Usage:**
- Powers the trendline overlays on AttributeTimelineChart
- Returns data for all 15 EQ/PQ/IQ attributes
- Class and program averages are pre-computed from `attribute_period_averages` table

---

### ITE Endpoints

#### `GET /api/analytics/ite/resident/[id]`
Get ITE score history for a resident.

**Response:**
```json
[
  {
    "test_date": "2023-03-15",
    "pgy_level": "PGY-1",
    "percentile": 72.5,
    "raw_score": 184
  },
  {
    "test_date": "2024-03-15",
    "pgy_level": "PGY-2",
    "percentile": 78.0,
    "raw_score": 198
  }
]
```

---

### ITE Archetype Endpoints

#### `GET /api/archetypes/resident/[id]`
Get archetype classification for a specific resident.

**Response:**
```json
{
  "residentId": "uuid",
  "scores": {
    "pgy1": 72,
    "pgy2": 85,
    "pgy3": 88
  },
  "delta12": 13,
  "delta23": 3,
  "deltaTotal": 16,
  "dataYears": 3,
  "originalClassification": {
    "archetypeId": "steady_climber",
    "archetypeName": "Steady Climber",
    "confidence": 0.92,
    "riskLevel": "Low",
    "isProvisional": false,
    "methodologyVersion": "1.0.0"
  },
  "currentClassification": {
    "archetypeId": "steady_climber",
    "archetypeName": "Steady Climber",
    "confidence": 0.92,
    "riskLevel": "Low",
    "isProvisional": false,
    "methodologyVersion": "1.0.0"
  },
  "archetype": "Steady Climber",
  "confidence": 0.92,
  "riskLevel": "Low",
  "color": "#27AE60",
  "description": "Consistent upward trajectory...",
  "recommendations": [
    "Continue current study habits",
    "Consider board prep courses"
  ],
  "similarResidents": [
    {
      "id": "uuid",
      "name": "Historical Resident",
      "classYear": 2023,
      "similarityScore": 0.89,
      "iteScores": { "pgy1": 70, "pgy2": 83, "pgy3": 90 }
    }
  ],
  "hasVersionDrift": false
}
```

#### `GET /api/methodology/current`
Get the current active archetype methodology version.

**Response:**
```json
{
  "version": "1.0.0",
  "name": "Memorial v1.0 Initial",
  "description": "Initial Memorial-specific archetype definitions",
  "isCurrent": true,
  "createdAt": "2025-12-21T00:00:00.000Z"
}
```

#### `GET /api/methodology/versions`
Get all methodology versions (for comparison/evolution tracking).

#### `GET /api/methodology/drift-analysis`
Get analysis of classification drift across methodology versions.

#### `GET /api/methodology/triggers`
Check for evolution triggers (annual review, threshold breach, pattern discovery).

---

## ITE Archetype Classification System (v3)

### Overview

The ITE Archetype Classification System analyzes resident In-Training Exam (ITE) score trajectories across residency to classify them into distinct performance archetypes. This enables:

- **Early intervention** for struggling residents
- **Mentorship matching** with similar historical profiles
- **Trend identification** for program-level insights
- **Personalized recommendations** based on archetype

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    ITE Score Data (ite_scores)                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Memorial Classifier (memorial-classifier.ts)       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ 3-Year Complete │  │   2-Year Data   │  │   1-Year Data   │  │
│  │  9 Archetypes   │  │ 4 Provisional   │  │ 3 Provisional   │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              resident_classifications Table                      │
│  • Original classification (immutable)                          │
│  • Current classification (updatable)                           │
│  • Similar residents (JSONB)                                    │
│  • Recommendations (JSONB)                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Archetype Definitions (Memorial v1.0.0)

#### Complete (3-Year) Archetypes

| Archetype | Description | Risk Level | Criteria |
|-----------|-------------|------------|----------|
| **Elite Performer** | Top performers throughout residency | Low | PGY1 ≥ 85%, Final ≥ 90% |
| **Steady Climber** | Consistent upward trajectory | Low | Δ12 ≥ 5, Δ23 ≥ 3, Final ≥ 70% |
| **Late Bloomer** | Strong recovery after slow start | Moderate | PGY1 < 50%, ΔTotal ≥ 25 |
| **Sophomore Slump → Strong Recovery** | Dip then recovery | Moderate | Δ12 < -5, Δ23 ≥ 10 |
| **Peak & Decline** | Early peak with decline | High | PGY1 > PGY3, Δ23 < -5 |
| **Consistent Moderate** | Stable mid-range performance | Moderate | All scores 40-70%, low variance |
| **Struggling → Stable** | Improvement to adequate | Moderate | PGY1 < 35%, Final 40-60% |
| **Persistent Struggle** | Ongoing difficulty | High | PGY3 < 35%, never > 50% |
| **Variable** | Inconsistent trajectory | Moderate | High variance (SD > 12) |

#### Provisional (2-Year) Archetypes

| Archetype | Description | Risk Level |
|-----------|-------------|------------|
| **Strong Start** | PGY1 > 70% with positive delta | Low |
| **Building Momentum** | Strong improvement (Δ12 ≥ 10) | Low |
| **Early Concern** | Low scores or declining | Moderate-High |
| **Monitoring** | Mixed signals | Moderate |

#### Provisional (1-Year) Archetypes

| Archetype | Description | Risk Level |
|-----------|-------------|------------|
| **Promising Start** | PGY1 ≥ 70% | Low |
| **Average Start** | PGY1 40-70% | Moderate |
| **Needs Attention** | PGY1 < 40% | High |

### Similar Historical Profiles

The system matches current residents with similar historical residents based on:

1. **Euclidean Distance Calculation**:
   ```
   distance = √(0.3×(PGY1_diff)² + 0.3×(PGY2_diff)² + 0.4×(Δ12_diff)²)
   similarity = max(0, 1 - distance × 2)
   ```

2. **Matching Criteria**:
   - Minimum 2 years of ITE data required
   - Similarity threshold: > 60%
   - Returns top 5 matches

3. **Displayed Information**:
   - Resident name and class year
   - Similarity percentage
   - ITE scores (PGY-1, PGY-2, PGY-3)
   - Final archetype classification

### Methodology Versioning

The system supports methodology evolution with:

1. **Immutable Original Classification**
   - First classification is preserved forever
   - Enables "what changed?" analysis

2. **Mutable Current Classification**
   - Updated when methodology changes
   - Tracks drift from original

3. **Version Control**
   - Semantic versioning (MAJOR.MINOR.PATCH)
   - Full archetype definitions stored per version
   - Threshold values tracked

4. **Evolution Triggers**
   - Annual review reminders
   - Threshold breach detection
   - Pattern discovery alerts
   - Outcome feedback integration

### UI Components

#### ITE Scores Tab (`ITEAnalyticsPane.tsx`)

**Location:** Resident Overview → ITE Scores Tab

**Features:**
- **Trajectory Analysis Header** with methodology version
- **Archetype Badge** with color-coded risk level
- **Original vs Current Classification** (if drift detected)
- **Provisional Badge** for incomplete data
- **Recommendations** based on archetype
- **Performance Trajectory Chart** showing ITE progression
- **Similar Historical Profiles** sidebar

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Trajectory Analysis                              v1.0.0         │
│ Based on ITE score progression                                  │
│                                     ┌─────────────────────────┐ │
│                                     │   Steady Climber        │ │
│                                     │   Low Risk • 92%        │ │
│                                     └─────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ Recommendations                                                  │
│ • Continue current study habits                                  │
│ • Consider board preparation courses                             │
├─────────────────────────────────────────────────────────────────┤
│ Performance Trajectory                                           │
│ ┌───────────────────────────────────┬─────────────────────────┐ │
│ │                                   │ Similar Profiles        │ │
│ │   📈 [Line Chart]                 │ • John Doe (89%)        │ │
│ │                                   │   Class 2023            │ │
│ │   PGY-1   PGY-2   PGY-3           │   PGY-1: 70% → 83%     │ │
│ │                                   │ • Jane Smith (85%)      │ │
│ │                                   │   Class 2022            │ │
│ └───────────────────────────────────┴─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

#### Trajectory Chart (`TrajectoryChart.tsx`)

**Features:**
- Current resident line (solid blue)
- Similar residents lines (dashed gray, max 3)
- Class average line (optional)
- Reference lines at 50th percentile
- Responsive container
- Dynamic loading with SSR optimization

### Scripts

#### Seed Archetypes
```bash
npx tsx scripts/seed-memorial-archetypes.ts
```
Classifies all residents and populates `resident_classifications` table.

#### Populate Similar Residents
```bash
npx tsx scripts/populate-similar-residents.ts
```
Calculates and stores similar historical profiles for all residents.

### Performance Optimizations

1. **Parallel API Fetching** - Scores and archetypes fetched simultaneously
2. **Dynamic Imports** - Recharts loaded client-side only
3. **Memoization** - Chart data and colors memoized
4. **AbortController** - Prevents stale requests
5. **Limited Similar Residents** - Top 3 shown in chart for performance
6. **Cached Classifications** - Results stored in database, not recalculated

---

## Usage Guide

### For Program Directors

**Accessing the Dashboard:**
1. Log in to Lev8 platform
2. Navigate to "Understand" module
3. Click "Overview"
4. Select view type:
   - **Individual Resident**: View single resident analytics
   - **Class Cohort**: View class-level aggregated analytics
   - **Program-Wide**: View program trends (coming soon)

**Viewing Class-Level Analytics:**
1. Select "Class Cohort"
2. Choose class year (e.g., "Class of 2026")
3. Navigate to "Aggregated SWOT" tab
4. Use filters:
   - **Period**: Select specific PGY year (e.g., "PGY-3") or "All Periods"
   - **SWOT Element**: Select specific category (e.g., "Weaknesses") or "All"

**Using Historical Comparison:**

When both Period and SWOT Element filters are set to specific values (not "All"), the dashboard displays a two-column comparison view:

- **Left Column**: Current class with full details
- **Right Column**: Historical classes for the same PGY level and SWOT category

**Steps:**
1. Select Period: "PGY-3"
2. Select SWOT Element: "Weaknesses"
3. View current class weaknesses on the left
4. Click historical class cards on the right to expand and compare
5. Identify trends: Are weaknesses improving or recurring across cohorts?

**Viewing All Supporting Evidence:**
1. Click "View all supporting comments" link on any SWOT element
2. Modal opens showing all 200-400+ evaluation comments
3. Use search bar to filter by resident name, faculty, or keywords
4. Navigate through pages (50 comments per page)
5. Review full context for each SWOT theme

**Interpreting SWOT Analysis:**
- **Strengths:** Highlight in feedback sessions, build on these
- **Weaknesses:** Create improvement plans (note severity/prevalence levels)
- **Opportunities:** Suggest rotations or learning resources
- **Threats:** Monitor closely, may need intervention
- **Prevalence Indicators**: 
  - Universal (all residents)
  - Majority (>50%)
  - Common (25-50%)
  - Occasional (10-25%)
  - Rare (<10%)

**Using Citations:**
- Click "Show citations" to view 2-4 representative quotes
- Click "View all supporting comments" to see complete evidence
- Use specific examples in feedback conversations
- Track themes over time and across cohorts

**Analyzing Scores:**
- Compare faculty vs self-assessment (gap analysis)
- Identify blind spots (large gaps)
- Track trends across periods
- Use radar chart for visual competency profile

---

### For Faculty

**Submitting Evaluations:**
1. Navigate to "Forms" → "Evaluate Resident"
2. Select resident
3. Select period
4. Rate all 15 attributes (1.0-5.0 scale)
5. Add optional comments
6. Submit

**Viewing Analytics:**
- Faculty can view residents in their program
- Access same dashboard as program directors
- Use insights to tailor teaching

---

### For Residents

**Submitting Self-Assessments:**
1. Navigate to "Forms" → "Self-Assessment"
2. System auto-detects current period
3. Rate all 15 attributes honestly
4. Add concerns/goals (optional)
5. Submit

**Viewing Own Analytics:**
- Residents can only view their own data
- See faculty feedback (anonymized)
- Compare self-perception to faculty assessment
- Track improvement over time

---

### For Administrators

**Data Import Process:**
1. Export evaluations from MedHub as CSV
2. Upload to `medhub_staging` table via Supabase UI
3. Run `scripts/process-medhub-staging.sql`
4. Verify import: `SELECT COUNT(*) FROM imported_comments;`
5. Run AI analysis: `node -r dotenv/config scripts/analyze-larissa-comments.ts`
6. Aggregate scores: Run `scripts/aggregate-period-scores.sql`

**Maintenance Tasks:**
- Import new evaluations monthly
- Run AI analysis for new periods
- Update ITE scores after exams
- Monitor data quality

---

## Technical Details

### Data Flow

```
MedHub CSV
  ↓
medhub_staging (upload)
  ↓
process-medhub-staging.sql
  ↓
imported_comments (5,860 rows)
  ↓
Claude API (AI analysis)
  ↓
swot_summaries (30+ analyses)

EQ+PQ+IQ Forms
  ↓
structured_ratings (319 ratings)
  ↓
aggregate-period-scores.sql
  ↓
period_scores (60+ aggregated scores)
  ↓
Dashboard (radar charts, gap analysis)
```

---

### Performance Considerations

**Database Indexes:**
- Foreign keys automatically indexed
- Consider adding index on `period_label` for filtering
- JSONB fields use GIN indexes for efficient queries

**Caching:**
- API responses cached for 5 minutes
- Invalidate cache on new data import

**Query Optimization:**
- Use `period_scores` for dashboard (pre-aggregated)
- Avoid querying `structured_ratings` directly in UI
- Use RLS policies efficiently

---

### Security

**Row-Level Security:**
- Residents can only see their own data
- Faculty can see residents in their program
- Program directors can see all residents in their program
- Super admins can see all data

**API Authentication:**
- All endpoints require authentication
- Use Supabase Auth JWT
- Service role key for admin operations only

**Data Privacy:**
- Faculty evaluations anonymized for residents
- SWOT analysis not directly resident-facing
- Audit logs for sensitive operations

---

## Future Enhancements

### Planned Features

1. **Class-Level Analytics**
   - Aggregated SWOT themes
   - Class average scores
   - Cohort comparisons

2. **Program-Wide Trends**
   - Year-over-year comparisons
   - Curriculum effectiveness
   - Faculty calibration

3. **Predictive Analytics**
   - Identify at-risk residents early
   - Predict ITE performance
   - Recommend interventions

4. **Enhanced AI Features**
   - Sentiment analysis
   - Trend detection
   - Personalized recommendations

5. **Export Functionality**
   - PDF reports for CCC
   - Excel exports for analysis
   - Custom report builder

---

## Troubleshooting

### Common Issues

**SWOT Analysis Not Showing:**
- Verify `swot_summaries` has data: `SELECT COUNT(*) FROM swot_summaries;`
- Check API endpoint: `/api/analytics/swot/resident/[id]`
- Ensure resident has comments in `imported_comments`
- Run AI analysis script if missing

**Radar Chart Not Displaying:**
- Verify `recharts` installed: `npm list recharts`
- Check `period_scores` has JSONB data: `SELECT faculty_ratings_detail FROM period_scores LIMIT 1;`
- Run aggregation script: `scripts/aggregate-period-scores.sql`

**Scores Showing Zero:**
- Check `structured_ratings` has data
- Verify aggregation ran successfully
- Check period_label matches format: "PGY-X Fall/Spring"

**Citations Not Expanding:**
- Check `supporting_quotes` in JSONB
- Verify AI analysis included citations
- Re-run analysis with updated prompt

---

## Additional Resources

- **[Setup Guide](SETUP.md)** - Complete setup instructions
- **[EQ+PQ+IQ Documentation](EQ-PQ-IQ.md)** - Evaluation framework details
- **[Database Setup Guide](guides/DATABASE-SETUP.md)** - Schema and migrations
- **[Data Import Guide](guides/DATA-IMPORT.md)** - Import procedures
- **[Dashboard Usage Guide](guides/DASHBOARD-USAGE.md)** - End-user guide

---

**Analytics Engine Status:** ✅ Production Ready

All features operational with real data from Memorial Healthcare System EM program.

