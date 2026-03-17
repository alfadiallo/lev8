# Product Requirements Document: EPI Quotient — Performance Fingerprint

**Product:** EPI Quotient  
**Domain:** www.epiquotient.com  
**Platform:** Integrated into lev8 monorepo (Next.js App Router)  
**Version:** 1.4  
**Last Updated:** March 17, 2026  
**Status:** Development (local + remote DB)

---

## 1. Executive Summary

EPI Quotient is an interactive data visualization product that renders a "Performance Fingerprint" — a particle wave field where each particle represents a physician or medical student, positioned along sine waves grouped by training level, and colored by their composite EQ/PQ/IQ score. The product provides three hierarchical views — **Program**, **Class**, and **Individual** — navigated via a centered pill switcher. The Program view shows the full cohort particle field; the Class view enables side-by-side comparison of training classes; and the Individual view offers a deep-dive into a single profile's EQ/PQ/IQ breakdown, trajectory, and archetype analysis.

---

## 2. Problem Statement

Medical education programs lack an intuitive, at-a-glance visualization of their entire cohort's performance profile:

- **No cohort-level overview.** Individual scores exist, but there is no way to see 270 profiles simultaneously and understand the distribution.
- **No trajectory context.** Current snapshots don't show whether a resident is on an upward or downward trajectory.
- **No archetype recognition.** Programs cannot quickly identify which residents fit known performance patterns (Elite Performer, Late Bloomer, Continuous Decline, etc.).
- **Data is tabular, not spatial.** Spreadsheets and dashboards present numbers, not a visual fingerprint that reveals patterns intuitively.

EPI Quotient solves these by rendering the entire cohort as an animated particle field where position, color, and interaction reveal the full performance story.

---

## 3. Architecture

### 3.1 Domain Routing

EPI Quotient is served from the lev8 monorepo via Next.js middleware:

- **Production:** `www.epiquotient.com` → rewrites `/` to `/epiquotient`
- **Canonical redirect:** `epiquotient.com` (bare) → `www.epiquotient.com` (308)
- **Local development:** `http://localhost:3000/epiquotient` (direct path)
- **Local domain:** `epiquotient.localhost` (middleware rewrite)
- **Context header:** All responses set `x-lev8-context: epiquotient`

### 3.2 File Structure

```
app/
├── epiquotient/
│   ├── layout.tsx              # Dark theme layout, metadata
│   └── page.tsx                # Main visualization (client component, ~2135 lines)
├── api/epiquotient/
│   └── profiles/route.ts       # GET: fetch profiles with scores, history, archetypes, demo data
components/
└── epiquotient/
    ├── index.ts                # Barrel exports (lenses, types, section registry)
    ├── types.ts                # Profile, LensProps, ProgramMeta, RadarData, constants
    ├── IndividualView.tsx       # Individual profile deep-dive with sidebar + section groups
    ├── OverviewLens.tsx         # Program-level aggregated stats
    ├── EqPqIqLens.tsx           # 15-attribute radar chart + pillar breakdown
    ├── SwotLens.tsx             # SWOT cards from attribute analysis
    ├── TrajectoryLens.tsx       # Period trend + composite trajectory chart
    ├── ArchetypesLens.tsx       # Risk scatter plot + archetype distribution
    └── sections/
        ├── index.ts            # SectionDef interface, SECTION_REGISTRY, SECTION_GROUPS
        ├── primitives.tsx       # THEME, score utilities, HeatCell, MiniSparkline
        ├── SectionCard.tsx      # Collapsible card wrapper with accent, sparkline, score
        ├── RadarSection.tsx     # 15-attribute radar with timeline play/pause + lerp
        ├── ComparisonSection.tsx # Faculty vs self bar chart (canvas, ResizeObserver)
        ├── HeatmapSection.tsx   # Longitudinal attribute heatmap table
        ├── TrendSection.tsx     # Faculty/Self/Both line chart (canvas, ResizeObserver)
        ├── IteSection.tsx       # In-Training Exam score table
        ├── DrilldownSection.tsx # Per-pillar attribute bars (EQ/PQ/IQ)
        ├── TrajectorySection.tsx # Composite + pillar trajectory (canvas)
        ├── SwotSection.tsx      # 2×2 SWOT quadrant grid
        ├── ArchetypeSection.tsx # Archetype badges + narrative
        ├── RatingsSection.tsx   # Rating source count summary
        └── CommentsSection.tsx  # Evaluator comment list
middleware.ts                    # Domain routing for epiquotient.com

scripts/
└── migrate-graduate-classes.js  # Graduate class redistribution (Supabase JS client)

supabase/migrations/
├── 20260313000001_epiquotient_tables.sql        # Base tables + seed data
├── 20260313000002_epiquotient_update_roles.sql   # Role rename (PGY designations)
├── 20260313000003_epiq_trajectories.sql          # History table + archetype seeding
├── 20260314000001_epiq_program_context.sql       # Institution + program name columns
├── 20260316000001_epiq_redistribute_profiles.sql # Redistribute: 23 MS3, 35 MS4, 15×PGY 1-3, 167 Graduate
└── 20260317000001_epiq_graduate_classes.sql      # Graduate classes: 75 active (5×15), 92 archived
```

### 3.3 Database Schema

**`epiq_profiles`** — One row per physician/student

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | Profile identifier |
| first_name | TEXT | First name |
| last_name | TEXT | Last name |
| role | TEXT | Training level: MS3, MS4, PGY 1, PGY 2, PGY 3, Graduate |
| cohort_label | TEXT | Cohort name (default: "EM Residency 2025") |
| institution_name | TEXT | Hospital/institution name (default: "Grey Sloan Memorial Hospital") |
| program_name | TEXT | Residency program name (default: "Emergency Medicine Residency") |
| archetype_id | TEXT | Assigned archetype slug |
| archetype_confidence | NUMERIC | Confidence score (0–1) |
| narrative | TEXT | AI-generated narrative placeholder |
| is_demo | BOOLEAN | Demo data flag |

**`epiq_profile_scores`** — Attribute-level scores per profile

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | Score row identifier |
| profile_id | UUID FK | References epiq_profiles |
| pillar | TEXT | eq, pq, or iq |
| attribute_slug | TEXT | e.g., empathy, workEthic, knowledgeBase |
| attribute_label | TEXT | Human-readable attribute name |
| score | INTEGER | 0–100 |
| display_order | INTEGER | Ordering within pillar |

**`epiq_profile_history`** — Longitudinal composite scores

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | History row identifier |
| profile_id | UUID FK | References epiq_profiles |
| period | TEXT | MS3, MS4, PGY 1, PGY 2, PGY 3, Graduate |
| composite_score | INTEGER | 0–100 |
| eq_score | INTEGER | 0–100 |
| pq_score | INTEGER | 0–100 |
| iq_score | INTEGER | 0–100 |

All tables have RLS policies allowing public SELECT (no auth required for the visualization).

---

## 4. API

### GET `/api/epiquotient/profiles`

Returns all profiles with computed scores, history, archetype metadata, and demo data slices, wrapped in a meta envelope.

**Query params:** `cohort` (optional, filters by cohort_label)

**Response shape:**
```json
{
  "meta": {
    "institution": "Grey Sloan Memorial Hospital",
    "program": "Emergency Medicine Residency",
    "programLength": 3
  },
  "profiles": [
    {
      "id": "uuid",
      "name": "Dr. Jane Doe, MD",
      "role": "PGY 3",
      "graduationYear": 2024,
      "graduationClass": "Class of 2024",
      "eq": { "empathy": 78, "adaptability": 82, "stressMgmt": 75, "curiosity": 80, "communication": 77 },
      "pq": { "workEthic": 85, "teachability": 80, "integrity": 88, "documentation": 72, "leadership": 81 },
      "iq": { "knowledgeBase": 70, "learningCommit": 74, "analyticalThinking": 68, "clinicalAdapt": 72, "clinicalPerf": 71 },
      "eqScore": 79,
      "pqScore": 83,
      "iqScore": 72,
      "composite": 78,
      "history": [
        { "period": "MS3", "composite": 62, "eq": 60, "pq": 65, "iq": 58 },
        { "period": "PGY 3", "composite": 78, "eq": 79, "pq": 83, "iq": 72 }
      ],
      "archetype": {
        "id": "steady_climber",
        "name": "Steady Climber",
        "risk": "Low",
        "action": "Maintain",
        "description": "Consistent, incremental gains.",
        "confidence": 0.87
      },
      "narrative": null,
      "radar": {
        "series": [
          { "label": "Faculty", "scores": { "empathy": 80, "..." : "..." }, "color": "#2fe6de" },
          { "label": "Self", "scores": { "empathy": 75, "..." : "..." }, "color": "#6366f1" }
        ],
        "timeline": [
          { "period": "PGY 1", "series": [ "..." ] },
          { "period": "PGY 2", "series": [ "..." ] }
        ]
      },
      "comparison": {
        "faculty": { "eq": 79, "pq": 83, "iq": 72 },
        "self": { "eq": 75, "pq": 80, "iq": 70 },
        "classAverages": { "eq": 72, "pq": 76, "iq": 68 },
        "classLabel": "PGY 3",
        "facultyCount": 5,
        "selfCount": 1
      },
      "trends": [
        { "period": "PGY 1", "facultyEq": 65, "facultyPq": 70, "facultyIq": 60, "selfEq": 62, "selfPq": 68, "selfIq": 58 }
      ],
      "swot": {
        "strengths": ["Strong interpersonal skills", "..."],
        "weaknesses": ["Documentation needs improvement"],
        "opportunities": ["Leadership development"],
        "threats": ["Burnout risk under high census"],
        "periodLabel": "PGY 3"
      },
      "ite": {
        "scores": [{ "examYear": 2024, "rawScore": 245, "percentile": 62, "nationalMean": 230 }],
        "individualAvg": { "rawScore": 245, "percentile": 62 },
        "classAvg": { "rawScore": 238, "percentile": 55 },
        "programAvg": { "rawScore": 240, "percentile": 58 }
      },
      "ratings": {
        "coreFaculty": 4,
        "teachingFaculty": 2,
        "self": 1,
        "total": 7,
        "recent": [
          { "id": "uuid", "evaluatorType": "core_faculty", "evaluatorName": "Dr. Smith", "date": "2026-02-15", "eqAvg": 78, "pqAvg": 82, "iqAvg": 70, "comment": "Strong clinical skills." }
        ]
      }
    }
  ]
}
```

**Fallback behavior:** If `institution_name` / `program_name` columns do not exist (migration not yet applied), the API retries without those columns and returns hardcoded defaults in `meta`.

**Archived profile filter:** Profiles with `narrative = 'ARCHIVED'` are excluded via `or('narrative.is.null,narrative.neq.ARCHIVED')`.

**Name formatting:**
- PGY 1–3 and Graduate: `Dr. [First] [Last], MD` (63%) or `Dr. [First] [Last], DO` (37%) — assigned deterministically via UUID hash
- MS3/MS4: `[First] [Last]` (no "Dr." prefix)

**Attribute slug mapping (DB → frontend camelCase):**
`empathy`, `adaptability`, `stress_mgmt→stressMgmt`, `curiosity`, `communication`, `work_ethic→workEthic`, `teachability`, `integrity`, `documentation`, `leadership`, `knowledge_base→knowledgeBase`, `learning_commit→learningCommit`, `analytical_thinking→analyticalThinking`, `clinical_adapt→clinicalAdapt`, `clinical_perf→clinicalPerf`

### 4.1 Demo Data Generators

All demo data is generated deterministically using seeded pseudo-random functions based on the profile UUID:

| Generator | Output | Logic |
|-----------|--------|-------|
| `seededRandom(id, salt)` | 0–1 float | Hash-based PRNG from UUID + salt string |
| `generateDemoRadar` | `RadarData` | Faculty and self-assessment scores per attribute (base ± small deltas); `generateDemoRadarTimeline` builds per-period faculty/self snapshots scaled from history |
| `generateDemoComparison` | `ComparisonData` | Faculty/self pillar scores, seeded class averages, faculty count (3–8), self count 1 |
| `generateDemoTrends` | `TrendPoint[]` | Per-period faculty/self EQ/PQ/IQ with small deltas; `undefined` if < 2 history points |
| `generateDemoSwot` | `SwotData` | Picks from fixed SWOT arrays; 3 strengths if composite ≥ 70, else 2; 3 weaknesses if composite < 50, else 2 |
| `generateDemoIte` | `IteData` | One score per PGY year; individual/class/program averages; `undefined` for non-residents (MS3/MS4) |
| `generateDemoRatings` | `RatingsData` | Core faculty (2–6), teaching faculty (1–4), self (1–2); up to 6 recent entries with names from `FACULTY_NAMES`, comments from `DEMO_COMMENTS` |

---

## 5. View Architecture

EPI Quotient uses a **landing + scope** navigation model. The landing page is the immersive particle wave field. Clicking a scope pill (Program | Class | Individual) transitions into a full-screen vertical scroll-snap experience with 5 analytical lens sections.

### 5.0 Page States

| State | Pill Active | Content | Navigation |
|-------|-------------|---------|------------|
| **Landing** | None | Particle wave field (270 profiles) | Click any pill → enter scope |
| **Program** | Program | 5 scroll-snap sections (program-level analytics) | Click active pill or Esc → landing |
| **Class** | Class | 5 scroll-snap sections (class-level analytics) | Click active pill or Esc → landing |
| **Individual** | Individual | 5 scroll-snap sections (individual analytics) | Click active pill or Esc → landing |

### 5.0.1 Scope Pill Switcher

- **Position:** Fixed, centered at top of viewport (`top: 24px`, `left: 50%`, `z-index: 60`)
- **Style:** Frosted glass pill with `backdrop-filter: blur(12px)`, dark surface background (`rgba(10, 24, 38, 0.85)`), teal border, `border-radius: 28px`
- **Sections:** Three buttons — **Program** | **Class** | **Individual**
- **Landing state:** All three pills inactive (muted text `#4A7090`)
- **Active state:** Teal background glow (`rgba(47, 230, 222, 0.12)`), teal text (`#2FE6DE`), font-weight 500
- **Toggle behavior:** Clicking the active pill returns to landing; clicking a different pill switches scope
- **Escape key:** Returns to landing from any scope

### 5.0.2 Landing-to-Scope Transition

Uses a cross-dissolve with `visibility` management to prevent compositing artifacts from hidden scope containers:

- **Enter scope:** Landing fades out (`opacity: 0`, 0.7s linear). Scope container becomes `visibility: visible` instantly, fades in (`opacity: 1`, 0.7s linear). Side panel closes on entry.
- **Switch scope:** Previous scope enters `exiting` state (retains `visibility: visible` during fade-out, then hides after 0.7s). New scope fades in simultaneously.
- **Exit to landing:** Active scope enters `exiting` state. Landing fades back in.
- **Inactive scopes:** `visibility: hidden; opacity: 0; pointer-events: none` — prevents compositing artifacts.
- **State management:** `exitingScope` ref tracks the outgoing scope during transitions, cleared after the 0.7s animation completes.

### 5.0.2a Landing-to-Individual 3D Transition

The Individual view uses a distinct 3D perspective transition instead of the cross-dissolve:

- **Enter individual:** Landing rotates `rotateY(0 → -85deg)` and fades to `opacity: 0` over 1.5s. Individual view rotates `rotateY(85deg → 0)` and fades to `opacity: 1` over 1.5s. Both use `perspective(1200px)`.
- **Exit individual:** Reverse — individual rotates out `rotateY(0 → -85deg)`, landing rotates back `rotateY(85deg → 0)`.
- **State flags:** `pivoting` (entering individual), `individualExiting` (leaving individual), `landingReturning` (landing coming back from individual).
- **Panel behavior:** Side panel closes on individual entry.

### 5.0.3 Scroll-Snap Sections (Per Scope)

Each scope page is a vertically scrolling container with 5 full-viewport sections:

| Section | Lens | Content (all scopes, varying granularity) |
|---------|------|------------------------------------------|
| 1 | **Overview** | Composite scores, pillar rings, trajectory, SWOT snapshot, archetype distribution |
| 2 | **EQ/PQ/IQ** | 15-attribute radar chart, Faculty vs Self gap analysis, attribute timelines |
| 3 | **SWOT** | Strengths/Weaknesses/Opportunities/Threats cards, evidence, historical comparison |
| 4 | **ITE/Trajectory** | ITE percentile progression, slope chart, archetype badge, risk summary |
| 5 | **Archetypes** | Scatter chart, archetype distribution, risk heatmap, trajectory patterns |

- **Scroll behavior:** `scroll-snap-type: y mandatory`, each section `scroll-snap-align: start`
- **Section size:** Each section is `100vw × 100vh`
- **Section header:** Top-left of each section — icon + lens label + scope context badge

### 5.0.5 Scope Context Headers

Each section header displays contextual information next to the lens label, varying by scope:

| Scope | Context Badge | Behavior |
|-------|--------------|----------|
| **Program** | `{institution} · {program}` (e.g., "Grey Sloan Memorial Hospital · Emergency Medicine Residency") | Static text from API meta; monospace, muted, no text-transform |
| **Class** | Clickable role pills: `MS3 | MS4 | PGY 1 | PGY 2 | PGY 3 | Graduate` | Clicking a pill filters all lens data to that class; clicking again deselects (shows all). Active pill: teal text/border/bg. Unfiltered state: all pills at 50% opacity |
| **Individual** | `individual` (uppercase, static) | No interactivity |

**Class filter behavior:**
- `classFilter` state: `string | null` (null = show all classes)
- When a class is selected, `profiles` are filtered before being passed to all 5 lens components
- All lenses (Overview, EQ/PQ/IQ, SWOT, Trajectory, Archetypes) reflect the filtered dataset
- Distinct roles are derived from the full profile set (not the filtered set)
- Pills appear in every section header within the Class scope

### 5.0.4 Dot Navigation

- **Position:** Fixed, right edge, vertically centered (`right: 24px`, `top: 50%`)
- **Dots:** 5 small circles (10px), one per lens section
- **Active dot:** Teal (`#2FE6DE`) with glow, slightly scaled up
- **Inactive dots:** Muted (`#4A7090`)
- **Hover:** Dot brightens + label appears to the left (e.g. "Overview", "EQ / PQ / IQ")
- **Click:** Scrolls to that section
- **Visibility:** Only visible when in a scope (hidden on landing)
- **Tracking:** `IntersectionObserver` on each section (threshold 0.5) updates the active dot

### 5.1 Landing Page — Particle Wave Field

- 6 sine waves, one per training level (Graduate at top → MS3 at bottom)
- Each particle = one profile, positioned along its wave with slight jitter
- Particle color = composite score mapped through a teal gradient (low=dark, high=bright)
- Particle size scales slightly with composite score
- Waves animate continuously with independent frequency, speed, and phase
- **Data-driven amplitudes:** Each wave's vertical oscillation (amplitude) is computed from the min/max score spread of its cohort rather than a static constant. The amplitude dynamically recalculates when the sort mode changes (Default/A-Z use composite range, EQ/PQ/IQ use their respective score ranges). Amplitude transitions are smoothly animated via lerp in the render loop.
- **Score-driven Y offset:** Each particle's vertical distance from its wave center line encodes how far its score deviates from the cohort mean. Above the line = above mean, below = below mean. Max deflection is capped at ~10px (~2-3mm on screen). The offset recalculates when the sort filter changes (using composite for Default/A-Z, or the specific pillar score for EQ/PQ/IQ). A tiny +/-2px random jitter prevents particles with identical scores from stacking. Offset transitions are smoothly animated via lerp alongside the X-axis sort animation.

### 5.1.1 Particle Sort

A row of text links beneath the pill switcher allows rearranging particles within each wave by different criteria:

**Sort modes:** `A → Z | EQ | PQ | IQ | EPIq`

| Mode | Sort Key | Direction |
|------|----------|-----------|
| A → Z | Last name (alphabetical) | A on left, Z on right |
| EQ | Emotional Quotient score | Lowest left, highest right |
| PQ | Professional Quotient score | Lowest left, highest right |
| IQ | Intellectual Quotient score | Lowest left, highest right |
| EPIq | Composite average of EQ+PQ+IQ | Lowest left, highest right |

**Animation:** Particles transition to their new x-positions via staggered spring interpolation. Each frame, `p.x += (targetX - p.x) * (0.035 + random * 0.018)`, producing an organic "swarm" effect where particles drift at slightly different speeds. Particles retain their y-position on the wave (driven by the sine function), so they slide horizontally while bobbing vertically.

**UI:**
- **Position:** Fixed, centered beneath the pill switcher (`top: 68px`)
- **Style:** `Space Mono`, 10px, muted teal (`#4A7090`), pipe-separated
- **Active state:** Selected sort highlighted in `#2FE6DE`
- **Toggle:** Clicking the active sort deselects it (returns to default scattered positions)
- **Visibility:** Only visible on the landing page (hidden in scope views)
- **Resize:** Sort order re-applied after window resize

**State:**
- `sortMode`: React state (`'default' | 'az' | 'eq' | 'pq' | 'iq' | 'epiq'`)
- `sortModeRef`: Ref mirror for animation loop access
- Each particle stores `targetX` (destination) and `originX` (initial random position)

### 5.2 Wave Labels

- Each wave has subtle, repeating text labels that follow the sine curve
- Labels rotate with the curve's tangent angle
- Positioned 5px above the wave line at low opacity

### 5.3 Hover Tooltip

- Displays on particle hover: name, role, composite score
- Sparkline showing historical trajectory (if 2+ data points)
- Archetype name
- "Click to view full profile" CTA
- **Edge detection:** Tooltip flips to the left side when particle is near the right viewport edge; shifts upward when near the bottom edge
- **Animation:** `opacity(0 → 1)`, `translateY(4px → 0)` over 0.15s

### 5.3a Touch Mini-Sheet

On touch devices (`@media (hover: none)`), a bottom sheet replaces the hover tooltip:

- **Trigger:** Touch start on nearest particle within 36px hit area (vs 26px for mouse)
- **Content:** Name, role, composite score, "Tap to open" CTA
- **Animation:** `translateY(20px → 0)`, `opacity(0 → 1)` over 0.2s
- **Behavior:** Touch end opens the full side panel; touch cancel dismisses the sheet
- **Position:** Fixed bottom center with `safe-area-inset-bottom` padding

### 5.3b Loading Animation

- Three blinking dots with 0.2s stagger animation (`opacity: 0.2 ↔ 1`)
- Displayed centered on page while profiles load from the API
- Gate: entire page fades in (`opacity: 0 → 1` over 0.15s) once `mounted` state is true

### 5.4 Profile Side Panel

On particle click, a slide-in panel shows:
- Name, role, composite score with progress bar
- Three ring gauges (EQ/PQ/IQ) with animated fill
- Archetype badge (color-coded by risk level) with description
- Sparkline trajectory chart (larger, with period labels and gridlines)
- Narrative placeholder card
- Clickable pillar rings open drill-down panel

### 5.5 Drill-Down Panel

- Shows all 5 attributes within a pillar
- Animated progress bars with delay cascade
- Grade labels (Exceptional → Significant Concern)

### 5.6 Filtering

**Role filter pills** (bottom center, row 1):
- 6 toggle pills: MS3, MS4, PGY 1, PGY 2, PGY 3, Graduate
- Hollow dot (left) = deselect all, filled dot (right) = select all

**Score band pills** (bottom center, row 2):
- 5 toggle pills: 0–20, 21–40, 41–60, 61–80, 81–100
- Hollow dot (left) = deselect all, filled dot (right) = select all

**Gradient bar** (bottom left):
- 5 clickable segments synced with score band pills
- Hover shows tooltip with band label, title, and description
- Inactive segments dim to 20% opacity
- Filled dot (right) = select all bands

**Filter behavior:**
- Filtered-out particles fade to alpha 0.05 (ghosted, still visible)
- Filtered particles cannot be hovered or clicked
- HUD stats update: profile count shows `visible/total`, average recalculates

### 5.7 Selection Highlighting

When a profile is selected (clicked):
- Particle glows green (#3CF332) with concentric aura rings
- Matching role pill gets green border + shadow
- Matching score-band pill gets green border + shadow
- Matching gradient bar segment gets inset green outline

### 5.8 HUD

- **Top center:** View switcher pill (Program | Class | Individual)
- **Below pill (landing only):** Sort row — `A → Z | EQ | PQ | IQ | EPIq` text links
- **Top left:** "EPI Quotient" logo + "Performance Fingerprint" subtitle
- **Top right:** Profile count (visible/total when filtered) + average composite score
- **Bottom left:** Gradient bar with hoverable score scale tooltips
- **Bottom right:** Interaction hint text — "Hover a particle to identify", "Click to explore the profile", "Wave amplitude reflects score variance of the min and max for the chosen filter."

### 5.8a Responsive Breakpoints

Three breakpoints with specific layout changes:

**≤ 1024px:**
- Section padding: `90px 32px 40px`
- Side panel width: 340px (down from 390px)

**≤ 768px:**
- Header layout stacked
- View switcher: `top: 76px` (shifted down)
- Sort row: `top: 114px`
- Legend centered above filters
- Hint text hidden
- Side panel becomes full-screen overlay
- Dot nav: 12px dots
- `+60px` wave y-offset (`mobileYOffset`)

**≤ 480px:**
- Tighter header layout
- View switcher: `top: 68px`
- Sort row: `top: 104px`
- Gradient bar: `130px × 6px` (compact)
- Hover tooltip hidden
- Dot nav labels hidden
- Logo: 14px (down from 18px)

**Touch devices (`@media (hover: none)`):**
- Hover tooltip hidden (replaced by touch mini-sheet)
- Gradient segment tooltip hidden
- Hint text hidden
- Pillar card hover transform disabled
- All bottom elements use `safe-area-inset-bottom` padding

---

## 5.9 Lens Components

Reusable React components in `components/epiquotient/` provide the analytical content for each scroll-snap section. All accept `LensProps` (`scope`, `profiles`).

| Component | Content |
|-----------|---------|
| `OverviewLens` | Total profiles, composite/pillar averages, pillar bars, risk distribution, role breakdown, archetype distribution |
| `EqPqIqLens` | 15-attribute radar chart (Canvas), pillar rings, attribute breakdown bars |
| `SwotLens` | SWOT cards (Strengths/Weaknesses/Opportunities/Threats) derived from attribute analysis |
| `TrajectoryLens` | Period trend badges, composite score trajectory chart (Canvas) |
| `ArchetypesLens` | Risk summary cards, scatter plot (composite vs trajectory delta, Canvas), archetype distribution, detail cards |

### 5.9.1 Class View — Filtering

The Class scope reuses the same 5 lens components but with a **class filter** in the section headers. When a class pill is selected (e.g., "PGY 2"), only profiles with that role are passed to all lens components. This means Overview shows 35 profiles instead of 270, radar charts reflect only that class's attribute averages, trajectory charts show only that class's history, etc.

### 5.10 Individual View

Full deep-dive into a single profile via a two-column layout:

#### 5.10.1 Sidebar (260px)

- **Active role groups:** Collapsible sections for PGY 3, PGY 2, PGY 1, MS4, MS3 — each shows profile count and chevron toggle
- **Graduate group:** `GraduateSidebarGroup` groups graduates by `graduationYear` with "Class of YYYY" dividers (Class of 2022–2026)
- **Archived exclusion:** Profiles with `narrative === 'ARCHIVED'` are hidden from the sidebar
- **Profile entries:** Name, graduation class label, composite score (color-coded via `scoreColor()`)
- **Selection:** Click any profile to load it into the main content area
- **Active split:** Uses `isResidentActive()` from `lib/utils/pgy-calculator.ts` to separate active residents from graduates

#### 5.10.2 Profile Header

- Name (Sora 600), role, graduation class label
- Composite score (large monospace) with grade label (Exemplary/Strong/Acceptable/Concerning/Serious Deficit)
- EQ/PQ/IQ pillar cards with animated progress bars (`transition: width 0.8s cubic-bezier(0.16,1,0.3,1)`)
- Archetype badge (risk-colored: Low=green, Moderate=orange, High=red) with confidence percentage
- Mail icon (opens `mailto:`), Share icon (opens Share modal)

#### 5.10.3 Section Groups (3 groups, 13 sections)

Sections are rendered from `SECTION_REGISTRY` and organized by `SECTION_GROUPS`:

**Overview group:**

| # | Section | Component | Description |
|---|---------|-----------|-------------|
| 1 | Radar | `RadarSection` | 15-attribute canvas radar with Catmull-Rom smoothing. Timeline slider with play/pause (1.2s auto-play interval). Lerp interpolation between period frames (250ms ease-in-out via `requestAnimationFrame`). Legend shows EQ/PQ/IQ pillar colors and series colors. |
| 2 | Comparison | `ComparisonSection` | Canvas bar chart: Faculty (pillar color) vs Self (indigo `#6366f1`) bars for EQ/PQ/IQ. Optional class-average dashed line. `ResizeObserver` for responsive redrawing. |
| 3 | Heatmap | `HeatmapSection` | Table: rows = Composite/EQ/PQ/IQ, columns = periods (sorted MS3 → Graduate). `HeatCell` with score-based background color. `MiniSparkline` in trend column. |
| 4 | Trends | `TrendSection` | Canvas line chart with **Faculty / Self / Both** toggle. Solid lines for faculty, dashed for self. Pillar colors (EQ teal, PQ green, IQ blue). `ResizeObserver` for responsive redrawing. |
| 5 | ITE | `IteSection` | Table: PGY level, Raw Score, Percentile (color-coded badge), National Mean. Sorted newest first. Individual/Class/Program average rows. Orange accent (`#f0a060`). |

**Deep Dive group:**

| # | Section | Component | Description |
|---|---------|-----------|-------------|
| 6 | EQ Drilldown | `DrilldownSection` (pillar=eq) | 5 EQ attributes: table with Current score and Grade, plus horizontal progress bars with teal fill. Header sparkline from pillar history. |
| 7 | PQ Drilldown | `DrilldownSection` (pillar=pq) | Same for PQ (green fill). |
| 8 | IQ Drilldown | `DrilldownSection` (pillar=iq) | Same for IQ (blue fill). |
| 9 | Trajectory | `TrajectorySection` | Canvas line chart: composite (thick accent line) + EQ/PQ/IQ (thinner, 80% opacity) over periods. Score labels above composite data points. |

**Context & History group:**

| # | Section | Component | Description |
|---|---------|-----------|-------------|
| 10 | SWOT | `SwotSection` | 2×2 grid: Strengths (green), Weaknesses (red), Opportunities (blue), Threats (orange). Icon + label + bullet list per quadrant. Blue accent. |
| 11 | Archetype | `ArchetypeSection` | Archetype name badge (risk-colored), action badge, confidence %, description text, optional narrative block. |
| 12 | Ratings | `RatingsSection` | 4-column grid: Core Faculty (accent), Teaching Faculty (amber), Self (indigo), Total. Large monospace count values. |
| 13 | Comments | `CommentsSection` | Comment list with evaluator type badge, name, date, quoted comment text. Left border colored by evaluator type. Indigo accent. |

**Paired expand/collapse:** Comparison + Heatmap share a single expand state; Trends + ITE share a single expand state.

#### 5.10.4 Share Modal

- Overlay with section checklist (one checkbox per section)
- Select All / Deselect All toggles
- Share uses Web Share API with clipboard fallback
- Close via backdrop click or Escape key

#### 5.10.5 Section Component Architecture

All sections use the `SectionDef` interface from `components/epiquotient/sections/index.ts`:

```typescript
interface SectionDef {
  id: string;
  group: 'overview' | 'deep-dive' | 'context';
  component: ComponentType<{
    profile: Profile;
    pillar?: 'eq' | 'pq' | 'iq';
    expanded?: boolean;
    onToggleExpanded?: () => void;
  }>;
  pillar?: 'eq' | 'pq' | 'iq';
}
```

**SECTION_REGISTRY:** 13 entries — `radar`, `comparison`, `heatmap`, `trends`, `ite`, `eq-drilldown`, `pq-drilldown`, `iq-drilldown`, `trajectory`, `swot`, `archetype`, `ratings`, `comments`

**SECTION_GROUPS:** 3 groups — Overview, Deep Dive, Context & History

**SectionCard wrapper:** Collapsible card with left accent color bar, title/subtitle, optional `headerScore` badge, optional `sparklineValues`/`sparklineColor`, expand/collapse chevron. Supports both controlled (`expanded`/`onToggleExpanded`) and uncontrolled (`defaultExpanded`) modes.

#### 5.10.6 Primitives & Theme

Shared constants and utilities from `components/epiquotient/sections/primitives.tsx`:

**THEME constant:**
- `bg`: page (`#0a1620`), sidebar (`#0e1e2d`), card (`#162737`), deep (`#07121d`), table (`#0e1e2d`)
- `border`: subtle/light/medium/accent (rgba teal at 0.06–0.25)
- `text`: primary (`#c8e0ee`), secondary (`#7ab5cc`), muted (`#4a7090`), dim (`#3a5a72`)
- `accent`: `#2fe6de`
- `font`: body (`'Sora', system-ui, sans-serif`), mono (`'Space Mono', monospace`)

**Utilities:**
- `PERIOD_ORDER`: `['MS3', 'MS4', 'PGY 1', 'PGY 2', 'PGY 3', 'PGY 4', 'Graduate']`
- `periodSortIndex(period)`: index in PERIOD_ORDER (99 for unknown)
- `scoreToRGB(s)`: 7-stop gradient interpolation (0 = near-black navy `#0C1932`, 100 = vivid mint `#3CFFC8`)
- `scoreBg(s, alpha)`: `rgba` background string from score
- `scoreColor(s)`: hex color string from score
- `grade(s)`: returns `{ lbl, c }` — Exemplary (≥88), Strong (≥74), Acceptable (≥60), Concerning (≥46), Serious Deficit (<46)

**Reusable components:**
- `HeatCell({ value })`: Score cell with `scoreColor`/`scoreBg` background; monospace font
- `MiniSparkline({ values, color, width, height })`: Canvas sparkline with quadratic bezier curves; auto-scales to value range

> **Note:** The current demo uses a realistic EM residency distribution (15 per PGY class, 167 graduates). The architecture supports additional PGY levels (PGY 4, PGY 5) for other specialties via database/seed changes only.

---

## 6. Scoring Scale

| Range | Label | Description |
|-------|-------|-------------|
| 81–100 | Exceptional | Exceeds expectations with compelling examples |
| 61–80 | Exceeds Expectations | Solid performance with clear competence |
| 41–60 | Meets Expectations | Adequate; developmentally appropriate gaps |
| 21–40 | Below Expectations | Noticeable gaps; targeted development needed |
| 0–20 | Significant Concern | Red flags requiring intervention |

---

## 7. Archetypes

9 trajectory archetypes derived from the Memorial classifier:

| ID | Name | Risk | Action | Description |
|----|------|------|--------|-------------|
| elite_performer | Elite Performer | Low | Invest | Consistently high scores. Leadership track. |
| elite_late_struggle | Elite → Late Struggle | Moderate | Invest | Strong start with late decline. |
| breakthrough_performer | Breakthrough | Low | Reinforce | Major improvement year-over-year. |
| peak_decline | Peak & Decline | High | Investigate | Improved then dropped. Investigate. |
| sophomore_slump_recovery | Slump → Recovery | Low | Reinforce | Dipped then bounced back strongly. |
| late_bloomer | Late Bloomer | Low | Encourage | Low initial scores, positive trajectory. |
| steady_climber | Steady Climber | Low | Maintain | Consistent, incremental gains. |
| continuous_decline | Continuous Decline | High | Intervene | Declining trajectory across periods. |
| variable | Variable | Moderate | Reinforce | Inconsistent pattern. Individualized approach. |

---

## 8. EQ/PQ/IQ Attributes

### Emotional Quotient (EQ)
- Empathy & Positive Interactions
- Adaptability & Self-Awareness
- Stress Management & Resilience
- Curiosity & Growth Mindset
- Communication Effectiveness

### Professionalism Quotient (PQ)
- Work Ethic & Professional Presence
- Teachability & Receptiveness
- Integrity & Accountability
- Clear & Timely Documentation
- Leadership & Relationship Building

### Intelligence Quotient (IQ)
- Strong Knowledge Base
- Commitment to Learning
- Analytical Thinking & Problem-Solving
- Adaptability in Clinical Reasoning
- Clinical Performance for Year of Training

---

## 9. Design System

### 9.1 Color Palette

**Paletton reference:** [Tetrad palette](https://paletton.com/#uid=53h0u0kptS+e9X2keUZuYQ5LqHi)

#### Primary Colors (Tetrad)

| Swatch | Hex | RGB | Role |
|--------|-----|-----|------|
| Cyan (primary) | `#55E5DF` | 85, 229, 223 | Primary brand color, wave lines, active pill text |
| Cyan light | `#90EDE9` | 144, 237, 233 | Hover states, secondary accents |
| Cyan dark | `#5CA8A5` | 92, 168, 165 | Muted text, wave label fills |
| Blue | `#5B7FCA` | 91, 127, 202 | IQ pillar accent |
| Blue light | `#A4B8E2` | 164, 184, 226 | IQ pillar light variant |
| Blue dark | `#1E3B8A` | 30, 59, 138 | IQ pillar deep accent |
| Green/Lime | `#9BF23D` | 155, 242, 61 | Selection highlight base |
| Green light | `#C5F28C` | 197, 242, 140 | Selection highlight soft |
| Green dark | `#3E7519` | 62, 117, 25 | Selection deep accent |
| Turquoise | `#60E5D0` | 96, 229, 208 | PQ pillar accent, gradient endpoint |
| Turquoise light | `#B4E8DF` | 180, 232, 223 | Secondary surfaces |
| Turquoise dark | `#6EABA1` | 110, 171, 161 | Muted accents |

#### Application Colors (In Use)

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | `#07121D` | Page background |
| `--text-primary` | `#C8E0EE` | Primary text |
| `--text-muted` | `#4A7090` | Secondary/muted text |
| `--accent-teal` | `#2FE6DE` | Logo, active pills, score gradient bright end |
| `--accent-green` | `#18F2B2` | PQ ring, gradient endpoint |
| `--accent-blue` | `#7BC8F8` | IQ ring |
| `--selection` | `#3CF332` | Selected profile particle, pill borders, gradient segment highlight |
| `--border` | `rgba(47, 230, 222, 0.18)` | Panel borders, pill borders (inactive) |
| `--border-active` | `rgba(47, 230, 222, 0.4)` | Active pill borders |
| `--surface` | `rgba(10, 24, 38, 0.96)` | Tooltip/panel backgrounds |
| `--filter-ghost` | `alpha 0.05` | Filtered-out particle opacity |

#### Score-to-Color Gradient Stops

The composite score maps through these RGB stops for particle coloring:

| Score | R | G | B | Hex (approx) | Visual |
|-------|---|---|---|--------------|--------|
| 0 | 12 | 25 | 50 | `#0C1932` | Near-black navy |
| 35 | 16 | 60 | 82 | `#103C52` | Dark teal |
| 55 | 18 | 110 | 120 | `#126E78` | Mid teal |
| 70 | 30 | 165 | 170 | `#1EA5AA` | Teal |
| 83 | 47 | 220 | 210 | `#2FDCD2` | Bright teal |
| 95 | 24 | 242 | 178 | `#18F2B2` | Bright green |
| 100 | 60 | 255 | 200 | `#3CFFC8` | Vivid mint |

#### Pillar Colors

| Pillar | Hex | Ring Color |
|--------|-----|------------|
| EQ (Emotional) | `#2FE6DE` | Teal |
| PQ (Professional) | `#18F2B2` | Green |
| IQ (Intelligence) | `#7BC8F8` | Blue |

#### Wave Line Colors

| Wave (top→bottom) | Training Level | Color |
|-------------------|---------------|-------|
| 0 | Graduate | `rgba(18,80,100,0.28)` |
| 1 | PGY 3 | `rgba(22,130,140,0.26)` |
| 2 | PGY 2 | `rgba(34,180,170,0.24)` |
| 3 | PGY 1 | `rgba(47,220,210,0.22)` |
| 4 | MS4 | `rgba(24,242,178,0.20)` |
| 5 | MS3 | `rgba(30,200,160,0.22)` |

### 9.2 Typography

| Element | Font | Weight | Size |
|---------|------|--------|------|
| Logo | Sora | 600 | 22px |
| Logo subtitle | Space Mono | 400 | 10px |
| View switcher | Sora | 400 (inactive) / 500 (active) | 12px |
| Stat values | Space Mono | 700 | 18px |
| Stat labels | Space Mono | 400 | 9px |
| Wave labels | Sora | 500 | 9px |
| Filter pills | Space Mono | 400 | 10px |
| Tooltip name | Sora | 500 | 13px |
| Panel name | Sora | 600 | 20px |
| Body text | Sora | 300–400 | 11–13px |

**Font imports:**
- [Sora](https://fonts.google.com/specimen/Sora) (weights 300, 400, 500, 600)
- [Space Mono](https://fonts.google.com/specimen/Space+Mono) (weights 400, 700)

### 9.3 Spacing & Layout

- Full viewport canvas (100vw × 100vh)
- HUD elements positioned absolutely with `z-index: 10–50`
- View switcher pill: centered top, `z-index: 30`, 3px padding, 28px border-radius
- Side panel: 380px wide, slides in from right (Program view only)
- Drill panel: 340px wide, slides in from right (overlaps side panel)
- Filter bar: centered bottom, no background (floats directly on canvas)
- Gradient bar: bottom-left, 200px wide, 8px tall
- Scope sections: full-viewport (100vw × 100vh), scroll-snap-align start
- Dot nav: fixed right edge, 5 dots at 14px gap, vertically centered

---

## 10. Data Profile

| Metric | Value |
|--------|-------|
| Total profiles | 270 |
| MS3 | 23 |
| MS4 | 35 |
| PGY 1 | 15 (engineered low variance — flat wave) |
| PGY 2 | 15 (engineered high variance — tall wave) |
| PGY 3 | 15 (engineered moderate variance — medium wave) |
| Graduate (active) | 75 (5 classes × 15) |
| Graduate (archived) | 92 |
| Graduate classes | Class of 2022, 2023, 2024, 2025, 2026 |
| Score attributes per profile | 15 (5 per pillar) |
| History depth | 0 (MS3) to 5+ (Graduate) periods |
| Archetypes | 9 types, evenly distributed |
| MD/DO split | 63% MD / 37% DO (residents + graduates) |

### 10.1 Graduate Class Score Profiles

| Class | Mean | Range | Character |
|-------|------|-------|-----------|
| Class of 2026 | 68 | 60–76 | Tight, moderate-to-high (current) |
| Class of 2025 | 55 | 38–74 | Wide spread (recent grads) |
| Class of 2024 | 72 | 62–82 | Higher baseline (mature) |
| Class of 2023 | 78 | 72–84 | Tight high cluster (established) |
| Class of 2022 | 60 | 40–80 | Widest range (senior alumni) |

Each class has 15 graduates with scores scaled toward the class target center via `scripts/migrate-graduate-classes.js`. Scores are rescaled from the original composite using a proportional scale factor plus jitter within the class spread.

> **Note on PGY variance:** The three PGY classes are deliberately seeded with distinct score variance profiles to showcase the data-driven amplitude feature. PGY 1 scores cluster tightly (composite ~52-78), PGY 2 scores spread widely (~30-90), and PGY 3 sits in between (~45-85). This makes the amplitude differences immediately visible on the landing page.

---

## 11. Deployment

### Current (Development)
- Local: `http://localhost:3000/epiquotient`
- Database: Supabase (linked project)

### Production (Planned)
- Vercel deployment via lev8 monorepo
- Domain: `www.epiquotient.com` (DNS → Vercel)
- Middleware handles domain routing to `/epiquotient`
- No authentication required (public visualization)

---

## 12. Future Enhancements

1. ~~**Lens section buildout**~~ — ✅ Implemented: 5 lens components (Overview, EQ/PQ/IQ, SWOT, Trajectory, Archetypes) at all 3 scopes
2. **Academic year scrubber** — Bottom timeline for time-aware roster filtering using `graduation_year` and `pgy-calculator.ts`
3. ~~**Cross-view navigation**~~ — ✅ Partially implemented: Class filter pills filter all lenses; particle click opens side panel
4. **Real data integration** — Connect to live `structured_ratings` and `period_scores` tables instead of demo seed data
5. **AI narratives** — Generate Claude-powered narrative summaries per profile based on trajectory and archetype
6. **Cohort selector** — Dropdown to switch between cohorts/programs (multi-tenant support)
7. **Time animation** — Animate the particle field across periods, showing how scores evolve
8. **Export** — Screenshot or PDF export of the current view
9. **Comparison mode** — Select two profiles to overlay their trajectories
10. ~~**Mobile responsive**~~ — ✅ Implemented: Adapted layout for tablet/mobile viewports with 3 breakpoints (1024/768/480px) and touch mini-sheet
11. ~~**Individual view refinement**~~ — ✅ Implemented: 13-section registry across 3 groups (Overview, Deep Dive, Context & History), graduate class sidebar grouping (5 classes of 15), paired section expand/collapse, share modal, timeline radar with play/pause
12. **Multi-specialty support** — Additional PGY levels (PGY 4, PGY 5, etc.) for specialties beyond EM
13. **Authentication layer** — Program-specific data access with role-based visibility
14. **Graduate class year scrubber** — Time-based filtering within the Individual sidebar
15. **Sidebar search** — Text search across profile names in Individual view
16. **Section permalinks** — Deep link to a specific section of a specific profile
17. **Live data connection** — Connect Individual View sections to real `structured_ratings`, `period_scores`, `ite_scores`, `imported_comments` tables instead of demo generators
