# ROSH Completion Tracking System

## Overview

ROSH (Review of Systems) completion tracking is a **time-series monitoring system** distinct from ITE scores. While ITE is an annual milestone exam, ROSH completion is tracked continuously throughout the academic year to monitor resident study progress.

## Key Differences: ITE vs ROSH

| Feature | ITE Scores | ROSH Completion |
|---------|-----------|-----------------|
| **Frequency** | Annual (once per year) | Dynamic (multiple snapshots throughout year) |
| **Data Type** | Fixed milestone | Time-series progression |
| **Purpose** | Performance assessment | Study habit monitoring |
| **Entry Pattern** | Bulk entry after exam | Periodic snapshots (monthly/quarterly) |
| **Tracking** | Single date per year | Multiple timestamps over time |

## Use Cases

1. **Progress Monitoring**: Track how residents' study completion progresses over time
2. **Early Intervention**: Identify residents falling behind before ITE exam
3. **Cohort Comparison**: Compare different class years at same PGY stage
4. **Correlation Analysis**: Analyze relationship between ROSH completion and ITE performance
5. **Predictive Modeling**: Predict ITE scores based on ROSH completion trends

## Database Schema

### Table: `rosh_completion_snapshots`

```sql
CREATE TABLE rosh_completion_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Who and when
  learner_id UUID REFERENCES residents(id) NOT NULL,
  snapshot_date DATE NOT NULL,
  
  -- Completion data
  completion_percentage NUMERIC(5,2) NOT NULL CHECK (completion_percentage BETWEEN 0 AND 100),
  
  -- Context
  pgy_level TEXT NOT NULL,  -- PGY level at time of snapshot
  class_year INTEGER NOT NULL,
  
  -- Optional metadata
  notes TEXT,
  entered_by UUID REFERENCES user_profiles(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate entries for same learner on same date
  UNIQUE(learner_id, snapshot_date)
);

-- Indexes for efficient queries
CREATE INDEX idx_rosh_snapshots_date ON rosh_completion_snapshots(snapshot_date);
CREATE INDEX idx_rosh_snapshots_learner ON rosh_completion_snapshots(learner_id, snapshot_date DESC);
CREATE INDEX idx_rosh_snapshots_class ON rosh_completion_snapshots(class_year, snapshot_date);
CREATE INDEX idx_rosh_snapshots_pgy ON rosh_completion_snapshots(pgy_level, snapshot_date);
```

### View: Latest Snapshot Per Resident

```sql
CREATE VIEW rosh_completion_latest AS
SELECT DISTINCT ON (learner_id) 
  rs.*,
  r.first_name,
  r.last_name,
  r.email
FROM rosh_completion_snapshots rs
JOIN residents r ON rs.learner_id = r.id
ORDER BY rs.learner_id, rs.snapshot_date DESC;
```

### View: Class Averages by Snapshot Date

```sql
CREATE VIEW rosh_class_averages AS
SELECT 
  snapshot_date,
  class_year,
  pgy_level,
  AVG(completion_percentage) as avg_completion,
  STDDEV(completion_percentage) as stddev_completion,
  COUNT(*) as n_residents,
  MIN(completion_percentage) as min_completion,
  MAX(completion_percentage) as max_completion,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY completion_percentage) as median_completion
FROM rosh_completion_snapshots
GROUP BY snapshot_date, class_year, pgy_level
ORDER BY snapshot_date DESC, class_year;
```

## UI Components

### 1. Snapshot Entry Interface

**Route**: `/admin/rosh-completion`

**Features**:
- Date picker for snapshot date
- Class year selector (e.g., Class of 2026)
- Spreadsheet-style table showing all residents in selected class
- Previous snapshot values displayed for reference
- Real-time class average calculation
- Color-coded cells based on completion percentage:
  - 🔴 Red (0-20%): Critical - at risk
  - 🟡 Yellow (21-50%): Warning - needs attention  
  - 🟢 Green (51-100%): Good - on track
- Bulk save functionality

**Example Layout** (matching your screenshot):

| Resident Name      | ROSH Completion (%) | Date Recorded | Class |
|--------------------|---------------------|---------------|-------|
| **Class Average**  | **73.2**           | 11/13/25      | 2026  |
| Morgan Reel        | 16                 | 11/13/25      | 2026  |
| Andrew Gonedes     | 54                 | 11/13/25      | 2026  |
| Noy Lutwak         | 20                 | 11/13/25      | 2026  |
| Kenneth Holton     | 3                  | 11/13/25      | 2026  |
| Simon Londono      | 0                  | 11/13/25      | 2026  |
| Mariam Attia       | 73                 | 11/13/25      | 2026  |
| Anastasia Alpizar  | 24                 | 11/13/25      | 2026  |
| Andrei Simon       | 9                  | 11/13/25      | 2026  |
| Alyse Nelsen       | 8                  | 11/13/25      | 2026  |
| Richard Halpern    | 41                 | 11/13/25      | 2026  |

### 2. Historical Progression View

**Route**: `/admin/rosh-completion/history`

**Visualizations**:

#### A. Individual Resident Timeline
- Line chart showing completion % over time for selected resident
- Markers at each snapshot date
- Trend line showing trajectory
- Comparison to class average (dotted line)

#### B. Class Progression Chart
- Multiple lines, one per resident
- X-axis: Time (snapshot dates)
- Y-axis: Completion percentage (0-100%)
- Legend showing resident names
- Highlight residents below threshold

#### C. Cohort Comparison
- Compare multiple class years at same PGY stage
- Example: Compare Class of 2026 PGY-2 vs Class of 2027 PGY-2
- Overlay multiple class averages
- Identify trends across cohorts

#### D. Correlation Analysis
- Scatter plot: ROSH completion (X) vs ITE percentile (Y)
- Each dot represents a resident
- Trendline showing correlation
- R² value displayed
- Filter by class year or PGY level

### 3. Integration with Overview Dashboard

**Location**: Overview Dashboard → Resident View → EQ+PQ+IQ Tab

**Display Elements**:
- Latest ROSH completion % badge next to ITE score
- Mini progression chart (sparkline) showing last 6 months
- Alert icon if completion below threshold
- Click to see detailed progression

## API Endpoints

### POST `/api/admin/rosh-completion/snapshot`

Save a new snapshot for an entire class.

**Request Body**:
```json
{
  "snapshot_date": "2025-11-13",
  "class_year": 2026,
  "completions": [
    {
      "learner_id": "uuid-1",
      "percentage": 73,
      "notes": "Excellent progress"
    },
    {
      "learner_id": "uuid-2",
      "percentage": 16,
      "notes": "Needs intervention"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "snapshot_id": "uuid",
  "snapshot_date": "2025-11-13",
  "class_average": 73.2,
  "saved_count": 10,
  "class_year": 2026
}
```

### GET `/api/admin/rosh-completion/history`

Get all snapshots for a class over time.

**Query Parameters**:
- `class_year` (required): e.g., 2026
- `start_date` (optional): Filter from date
- `end_date` (optional): Filter to date

**Response**:
```json
{
  "snapshots": [
    {
      "date": "2025-11-13",
      "class_average": 73.2,
      "residents": [
        {
          "learner_id": "uuid",
          "name": "Morgan Reel",
          "completion": 16,
          "pgy_level": "PGY-2"
        }
      ]
    }
  ]
}
```

### GET `/api/admin/rosh-completion/resident/[id]`

Get progression for a single resident.

**Response**:
```json
{
  "learner_id": "uuid",
  "name": "Morgan Reel",
  "class_year": 2026,
  "snapshots": [
    {
      "date": "2025-11-13",
      "completion": 16,
      "pgy_level": "PGY-2",
      "class_average": 73.2
    },
    {
      "date": "2025-10-15",
      "completion": 8,
      "pgy_level": "PGY-2",
      "class_average": 45.1
    }
  ],
  "trend": "improving", // or "declining" or "stable"
  "velocity": 8.0 // percentage points per month
}
```

### GET `/api/admin/rosh-completion/latest`

Get the most recent snapshot for all residents.

**Response**:
```json
{
  "snapshot_date": "2025-11-13",
  "residents": [
    {
      "learner_id": "uuid",
      "name": "Morgan Reel",
      "class_year": 2026,
      "completion": 16,
      "pgy_level": "PGY-2"
    }
  ]
}
```

### GET `/api/admin/rosh-completion/compare`

Compare classes at same PGY level.

**Query Parameters**:
- `pgy_level` (required): e.g., "PGY-2"
- `class_years` (optional): Comma-separated list, e.g., "2025,2026,2027"

**Response**:
```json
{
  "pgy_level": "PGY-2",
  "classes": [
    {
      "class_year": 2026,
      "snapshots": [
        {
          "date": "2025-11-13",
          "avg_completion": 73.2
        }
      ]
    }
  ]
}
```

## Alert System

### Thresholds
- **Critical (0-20%)**: Immediate intervention needed
- **Warning (21-50%)**: Monitor closely
- **On Track (51-100%)**: Good progress

### Alert Rules
1. **Low Completion Alert**: Trigger when resident below 25% and ITE is < 8 weeks away
2. **Declining Trend Alert**: Trigger when completion decreases by >15% between snapshots
3. **Class Outlier Alert**: Trigger when resident is >2 standard deviations below class average
4. **Stagnation Alert**: Trigger when no progress for 2+ consecutive snapshots

### Alert Actions
- Email to program director
- Badge notification in dashboard
- Highlight in red on entry interface
- Include in weekly summary report

## Insights & Analytics

### 1. Predictive Modeling
Use historical data to predict ITE performance:

```
Predicted ITE Percentile = α + β₁(ROSH Completion) + β₂(Previous ITE) + β₃(PGY Level)
```

Display prediction with confidence interval on resident profile.

### 2. Intervention Effectiveness
Track residents who received intervention:
- Before intervention completion rate
- After intervention completion rate
- Change in trajectory
- ITE outcome

### 3. Optimal Completion Targets
Analyze historical data to determine:
- What ROSH completion % correlates with top ITE performance?
- When should residents reach 50% completion to maximize ITE score?
- How does completion velocity impact outcomes?

## Implementation Files

### Database
- `supabase/migrations/[timestamp]_add_rosh_completion.sql`

### Backend API
- `app/api/admin/rosh-completion/snapshot/route.ts`
- `app/api/admin/rosh-completion/history/route.ts`
- `app/api/admin/rosh-completion/resident/[id]/route.ts`
- `app/api/admin/rosh-completion/latest/route.ts`
- `app/api/admin/rosh-completion/compare/route.ts`

### Frontend Pages
- `app/(dashboard)/admin/rosh-completion/page.tsx` - Entry interface
- `app/(dashboard)/admin/rosh-completion/history/page.tsx` - Historical view

### Components
- `components/admin/rosh/SnapshotEntryTable.tsx` - Bulk entry table
- `components/admin/rosh/ProgressionChart.tsx` - Individual timeline
- `components/admin/rosh/ComparisonChart.tsx` - Class comparison
- `components/admin/rosh/CorrelationChart.tsx` - ROSH vs ITE scatter
- `components/admin/rosh/CompletionBadge.tsx` - Color-coded badge
- `components/admin/rosh/AlertIndicator.tsx` - Warning/critical indicators

### TypeScript Types
```typescript
// lib/types/rosh.ts

export interface ROSHSnapshot {
  id: string;
  learner_id: string;
  snapshot_date: string;
  completion_percentage: number;
  pgy_level: string;
  class_year: number;
  notes?: string;
  entered_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ROSHClassAverage {
  snapshot_date: string;
  class_year: number;
  pgy_level: string;
  avg_completion: number;
  stddev_completion: number;
  n_residents: number;
  min_completion: number;
  max_completion: number;
  median_completion: number;
}

export interface ROSHProgression {
  learner_id: string;
  name: string;
  class_year: number;
  snapshots: ROSHSnapshot[];
  trend: 'improving' | 'declining' | 'stable';
  velocity: number; // percentage points per month
}

export interface ROSHBulkEntry {
  snapshot_date: string;
  class_year: number;
  completions: Array<{
    learner_id: string;
    percentage: number;
    notes?: string;
  }>;
}
```

## Testing Scenarios

### Unit Tests
1. Calculate class average correctly
2. Detect trend (improving/declining/stable)
3. Calculate velocity (rate of change)
4. Trigger alerts at correct thresholds

### Integration Tests
1. Save snapshot and verify data integrity
2. Query historical data with date filters
3. Compare multiple classes at same PGY level
4. Generate correlation analysis with ITE scores

### UI Tests
1. Enter completion data for entire class
2. View progression chart for single resident
3. Compare multiple class cohorts
4. Receive alert notifications

## Migration Path

### From Current ITE Table
If ROSH completion is currently stored in `ite_scores` table:

```sql
-- Extract ROSH completion data
INSERT INTO rosh_completion_snapshots (
  learner_id,
  snapshot_date,
  completion_percentage,
  pgy_level,
  class_year
)
SELECT 
  learner_id,
  test_date as snapshot_date,
  rosh_completion_percent as completion_percentage,
  pgy_level,
  (SELECT class_year FROM residents WHERE id = learner_id) as class_year
FROM ite_scores
WHERE rosh_completion_percent IS NOT NULL;

-- Remove ROSH column from ITE table (optional)
ALTER TABLE ite_scores DROP COLUMN IF EXISTS rosh_completion_percent;
```

## Summary

ROSH completion tracking is a **time-series monitoring system** that provides:
- ✅ Multiple snapshots over time (not just annual)
- ✅ Class-wide entry interface (like ITE but more frequent)
- ✅ Progression visualization for individuals and cohorts
- ✅ Early warning system for struggling residents
- ✅ Correlation analysis with ITE performance
- ✅ Predictive modeling for interventions
- ✅ Cross-cohort comparison capabilities

This system enables proactive monitoring of resident study habits and early intervention before high-stakes exams.



