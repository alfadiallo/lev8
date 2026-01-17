# Interview Guide JSON Integration Summary

## Overview

This document explains how the `interview-guide-structure.json` file should be integrated into the existing candidate scoring interface to provide interviewers with contextual guidance during evaluations.

## Current State → Enhanced State

**Before:** The scoring tool shows domain sliders (EQ, PQ, IQ) with numeric scores but no guidance on what to ask or look for.

**After:** Each domain expands to reveal sub-attributes with:
- Expandable question banks with follow-ups
- Hover tooltips for attribute definitions
- "Cues" button showing observation prompts

---

## JSON Structure Breakdown

### Top Level
```json
{
  "title": "Emergency Medicine Residency Interview Guide",
  "domains": { "EQ": {...}, "PQ": {...}, "IQ": {...} },
  "metadata": {...}
}
```

### Domain Object
```json
{
  "id": "EQ",
  "name": "Emotional Quotient (EQ)",
  "shortDescription": "Empathy, adaptability, communication",
  "icon": "Heart",           // Lucide icon name
  "color": "#10B981",        // Brand color for this domain
  "subAttributes": [...]     // Array of 5 sub-attributes
}
```

### Sub-Attribute Object
```json
{
  "id": "empathy",
  "name": "Empathy and Positive Interactions",
  "description": "Candidates demonstrate genuine understanding...",  // For info tooltip
  "cues": [                  // For "Cues" hover tooltip - bullet list
    "Watch for body language...",
    "Listen for specific examples..."
  ],
  "questions": [             // Expandable question cards
    {
      "question": "Tell me about a time you cared for a challenging patient...",
      "followUp": "What did you learn? How did the patient respond?"
    }
  ]
}
```

---

## UI Component Mapping

### 1. Domain Header (Collapsed)
- Display: `icon`, `name`, `shortDescription`
- Style: Use `color` for icon background
- Action: Click to expand/collapse sub-attributes

### 2. Sub-Attribute Row
```
[▶] Empathy and Positive Interactions (ℹ)                    [👁 Cues]
```

| Element | Data Source | Behavior |
|---------|-------------|----------|
| Arrow | - | Toggle expand/collapse questions |
| Title | `subAttribute.name` | Static display |
| Info icon (ℹ) | `subAttribute.description` | Hover shows tooltip with full description |
| Cues button | `subAttribute.cues` | Hover shows floating tooltip with bullet list |

### 3. Question Cards (Expanded)
```
┌─────────────────────────────────────────────────────────┐
│ 1  "Tell me about a time you cared for a challenging    │
│     or difficult patient..."                            │
│    Follow-up: What did you learn? How did the patient   │
│    respond?                                             │
└─────────────────────────────────────────────────────────┘
```

| Element | Data Source |
|---------|-------------|
| Number badge | Array index + 1 |
| Question text | `question.question` |
| Follow-up | `question.followUp` |

---

## Implementation Notes

### Tooltip Behavior
Both tooltips (info icon and Cues) must use **fixed positioning** calculated from the button's bounding rect to ensure they float above all content, even when the section is collapsed.

```javascript
const handleMouseEnter = () => {
  const rect = buttonRef.current.getBoundingClientRect();
  setPosition({
    top: rect.bottom + 8,
    left: rect.left + rect.width / 2  // or rect.right for right-aligned
  });
  setIsVisible(true);
};
```

### Cues Tooltip Specifics
- Position: Anchored to right side of button, expands leftward
- Format: Dark background (#1a2e1a), bullet points with green accent
- Width: 360px max
- Content: Render `cues` array as `<ul><li>` elements

### State Management
```javascript
// Track which sub-attributes are expanded
const [expandedAttrs, setExpandedAttrs] = useState({
  empathy: false,
  adaptability: false,
  // ... all 15 sub-attribute IDs
});
```

---

## Data Summary

| Metric | Count |
|--------|-------|
| Domains | 3 (EQ, PQ, IQ) |
| Sub-attributes per domain | 5 |
| Total sub-attributes | 15 |
| Total questions | 62 |
| Avg questions per sub-attribute | ~4 |

---

## File Locations

- JSON Data: `interview-guide-structure.json`
- React Component Reference: `interview-guide-v2.jsx`

---

## Integration Checklist

- [ ] Import JSON structure into app
- [ ] Add expandable sub-attribute rows within each domain card
- [ ] Implement info icon tooltip (hover → shows `description`)
- [ ] Implement Cues button tooltip (hover → shows `cues` as bullets)
- [ ] Render question cards when sub-attribute is expanded
- [ ] Ensure tooltips use fixed positioning with z-index: 9999
- [ ] Style question cards with numbered badges and follow-up formatting
- [ ] Add expand/collapse all controls

---

## Implemented Features (as of January 2025)

### Navigation System

**Role-Based Dashboard** (`/interview/dashboard`)
- Program Directors and Admins see: Interview Dates, Rank List, Interviewer Stats, Score Normalization
- Faculty see: Interview Dates (view only)
- Consistent back navigation: All sub-pages link back to Dashboard, not Home

**Navigation Menu** (`components/interview/NavigationMenu.tsx`)
- Responsive menu with role-based links
- Mobile menu automatically closes on desktop resize
- Integrated with `InterviewUserContext` for authentication

### Interviewer Statistics Page (`/interview/stats`)

**Deviation Calculation**
Simple arithmetic difference showing how each interviewer's average compares to the group mean:

$$ \Delta = \mu_{interviewer} - \mu_{group} $$

Where:
- $\mu_{interviewer}$ = Average total score for a specific interviewer
- $\mu_{group}$ = Average total score across all interviewers in the program

**Interpretation:**
- Positive values: Interviewer rates higher (more lenient)
- Negative values: Interviewer rates lower (more strict)
- Thresholds: ±10 points determines "Lenient" vs "Strict" classification

**Visual Elements:**
- Deviation bar visualization with center line
- Color-coded tendency badges (Rates Higher/Neutral/Rates Lower)
- Sortable columns (Candidates Rated, Avg Total, Deviation from Mean)
- Per-domain deviation (EQ, PQ, IQ) displayed alongside averages

### Score Normalization (Z-Score Transformation)

**Methodology:**
The system uses Z-score transformation to normalize scores, accounting for individual interviewer rating styles.

**Step 1: Calculate Z-Score**
$$ z = \frac{x - \mu_{interviewer}}{\sigma_{interviewer}} $$

Where:
- $x$ = the raw score (e.g., EQ=75)
- $\mu_{interviewer}$ = that interviewer's personal mean score
- $\sigma_{interviewer}$ = that interviewer's personal standard deviation

**Step 2: Transform to Normalized Scale**
$$ \text{normalized} = 50 + (z \times 15) $$

This uses:
- Mean of 50 (center of the scale)
- Standard deviation of 15 (similar to IQ scale scaling)

**Why This Works:**
- A z-score of 0 = interviewer's average → normalized to 50
- A z-score of +1 = one standard deviation above their average → normalized to 65
- A z-score of -1 = one standard deviation below their average → normalized to 35

This adjusts for each interviewer's personal distribution, putting all scores on a comparable scale regardless of whether they tend to rate higher or lower.

**Implementation:**
- Location: `lib/interview/normalization.ts`
- Toggle available on Season Overview page (`/interview/season`)
- Additional toggle to exclude Resident ratings from calculations
- Shows raw and normalized scores side-by-side
- Displays rank change impact (e.g., "+3" or "-2")

### Season Overview / Rank List (`/interview/season`)

**Features:**
- Comprehensive candidate ranking across entire interview season
- Sortable columns (Rank, Candidate, Medical School, Date, EQ, PQ, IQ, Total, # Ratings)
- Expandable rows showing individual interviewer breakdowns
- Score normalization toggle with rank change indicators
- Export to CSV functionality
- Filtering by interview day and medical school
- Search by candidate name or school

**Summary Statistics:**
- Total interview days
- Total candidates
- Average score
- Score distribution (Exceptional, Strong, Good, Average, Below Average)

### Interview Day Review (`/interview/session/[sessionId]/review`)

**Dashboard Components:**
- Session summary cards (Candidates Rated, Average Scores, Completion Status)
- Interviewer calibration table showing averages per interviewer
- Candidate ratings matrix with expandable detail rows
- Displays full interviewer names and roles (PD, Core Faculty, Teaching Faculty, APD, Faculty)
- Export to CSV functionality

**Interviewer Roles:**
- Program Director (PD)
- Core Faculty
- Teaching Faculty
- Associate Program Director (APD)
- Faculty (generic)
- Resident (excluded from normalization calculations)

### Dashboard Enhancements

**Group Averages Display:**
- Reorganized layout with Total Ratings prominently displayed
- EQ, PQ, IQ grouped together with icon indicators
- Avg Total highlighted in separate card

**Score Normalization Tile:**
- Updated terminology: "interviewer styles" instead of "interviewer bias"
- Links to Season Overview page with normalization enabled
- Badge indicator: "On Rank List"

**Learn More Section:**
- Expandable section explaining Z-score normalization methodology
- Mathematical formulas with clear notation
- Step-by-step process explanation
- Examples demonstrating how z-scores translate to normalized values

### Technical Implementation

**Key Files:**
- `lib/interview/normalization.ts` - Z-score normalization utilities
- `context/InterviewUserContext.tsx` - User state management with localStorage persistence
- `app/api/interview/stats/route.ts` - Interviewer statistics API endpoint
- `app/api/interview/season/route.ts` - Season overview data aggregation
- `components/interview/InterviewDashboard.tsx` - Role-based dashboard component

**Database Schema:**
- `interview_ratings` - Individual EQ/PQ/IQ scores
- `interview_session_interviewers` - Interviewer assignments with role information
- `interview_candidates` - Candidate information
- `interview_sessions` - Session metadata

**Key Technical Concepts:**
- **Arithmetic Mean:** Used for calculating group and interviewer averages
- **Standard Deviation:** Population standard deviation (division by N, not N-1) for consistency
- **Z-Score Transformation:** Statistical standardization method
- **Linear Rescaling:** Transform z-scores to 0-100 scale with mean=50, stddev=15
