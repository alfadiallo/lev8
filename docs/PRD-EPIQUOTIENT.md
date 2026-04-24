# Product Requirements Document: EPI Quotient — Performance Fingerprint

**Product:** EPI Quotient
**Domain:** www.epiquotient.com
**Platform:** Integrated into lev8 monorepo (Next.js 15 App Router)
**Version:** 2.0
**Last Updated:** March 25, 2026
**Status:** Production (Vercel deployment, public access)

---

## 1. Executive Summary

EPI Quotient is an interactive data visualization product that renders a "Performance Fingerprint" — a particle wave field where each particle represents a physician or medical student, positioned along sine waves grouped by training level, and colored by their composite EQ/PQ/IQ score. The product provides four view modes — **Landing**, **Program**, **Class**, and **Individual** — navigated via a centered pill switcher with animated transitions.

The Landing page is an immersive particle canvas that supports sorting, filtering, hover tooltips, and click-to-explore interactions. Program and Class views provide five full-viewport scroll-snap analytical lens sections. The Individual view offers a deep-dive into a single profile across 13 collapsible section cards organized in three groups.

The product is publicly accessible at www.epiquotient.com with no authentication required. It currently serves 270 demo profiles representing a fictional Emergency Medicine residency program.

---

## 2. Problem Statement

Medical education programs lack an intuitive, at-a-glance visualization of their entire cohort's performance profile:

- **No cohort-level overview.** Individual scores exist, but there is no way to see 270 profiles simultaneously and understand the distribution.
- **No trajectory context.** Current snapshots don't show whether a resident is on an upward or downward trajectory.
- **No archetype recognition.** Programs cannot quickly identify which residents fit known performance patterns (Elite Performer, Late Bloomer, Continuous Decline, etc.).
- **Data is tabular, not spatial.** Spreadsheets and dashboards present numbers, not a visual fingerprint that reveals patterns intuitively.

EPI Quotient solves these by rendering the entire cohort as an animated particle field where position, color, size, and interaction reveal the full performance story.

---

## 3. Architecture

### 3.1 Domain Routing

EPI Quotient is served from the lev8 monorepo via Next.js middleware (`middleware.ts`):

- **Production:** `www.epiquotient.com` → rewrites `/` to `/epiquotient`
- **Canonical redirect:** `epiquotient.com` (bare) → `www.epiquotient.com` (308 permanent)
- **Local development:** `http://localhost:3000/epiquotient` (direct path)
- **Local domain:** `epiquotient.localhost` (middleware rewrite)
- **Context header:** All responses set `x-lev8-context: epiquotient`
- **Passthrough:** `/api`, `/_next`, `/favicon.ico`, static file extensions bypass rewrite
- **Catch-all:** Any other path on the epiquotient domain redirects to `/` (which rewrites to `/epiquotient`)

### 3.2 File Structure

```
app/
├── epiquotient/
│   ├── layout.tsx                  # Server layout — dark theme, metadata, viewport config
│   └── page.tsx                    # Client component (~2760 lines) — particle canvas, all views
├── api/epiquotient/
│   └── profiles/route.ts           # GET: profiles with scores, history, archetypes, demo data (~559 lines)

components/epiquotient/             # ~4700 lines across 22 files
├── index.ts                        # Barrel exports (lenses, types, section registry)
├── types.ts                        # Profile, LensProps, ProgramMeta, RadarData, constants (~190 lines)
├── IndividualView.tsx              # Individual profile deep-dive, sidebar, section groups (~952 lines)
├── OverviewLens.tsx                # Program/class-level aggregated stats (~317 lines)
├── EqPqIqLens.tsx                  # 15-attribute radar chart + pillar breakdown (~278 lines)
├── SwotLens.tsx                    # SWOT cards from attribute analysis (~156 lines)
├── TrajectoryLens.tsx              # Period trend + composite trajectory chart (~254 lines)
├── ArchetypesLens.tsx              # Risk scatter plot + archetype distribution (~321 lines)
└── sections/
    ├── index.ts                    # SectionDef interface, SECTION_REGISTRY (13), SECTION_GROUPS (3)
    ├── primitives.tsx              # THEME, PERIOD_ORDER, scoreToRGB, grade(), HeatCell, MiniSparkline
    ├── SectionCard.tsx             # Collapsible card wrapper with accent bar, sparkline, score
    ├── RadarSection.tsx            # 15-attribute radar with timeline play/pause + lerp (~497 lines)
    ├── ComparisonSection.tsx       # Faculty vs self bar chart (Canvas, ResizeObserver) (~185 lines)
    ├── HeatmapSection.tsx          # Longitudinal period × pillar heatmap table (~160 lines)
    ├── TrendSection.tsx            # Faculty/Self/Both line chart (Canvas) (~210 lines)
    ├── IteSection.tsx              # In-Training Exam score table (~135 lines)
    ├── DrilldownSection.tsx        # Per-pillar attribute bars (EQ/PQ/IQ) (~171 lines)
    ├── TrajectorySection.tsx       # Composite + pillar trajectory chart (Canvas) (~171 lines)
    ├── SwotSection.tsx             # 2×2 SWOT quadrant grid (~94 lines)
    ├── ArchetypeSection.tsx        # Archetype badges + narrative (~79 lines)
    ├── RatingsSection.tsx          # Rating source count summary (~70 lines)
    └── CommentsSection.tsx         # Evaluator comment list (~78 lines)

middleware.ts                       # Domain routing for epiquotient.com (lines ~65–140)

scripts/
└── migrate-graduate-classes.js     # Graduate class redistribution (Supabase JS client)

supabase/migrations/
├── 20260313000001_epiquotient_tables.sql          # Base tables + 270-profile seed data
├── 20260313000002_epiquotient_update_roles.sql    # Role rename (Intern→PGY 1, R1→PGY 2, etc.)
├── 20260313000003_epiq_trajectories.sql           # History table + archetype seeding
├── 20260314000001_epiq_program_context.sql        # institution_name + program_name columns
├── 20260316000001_epiq_redistribute_profiles.sql  # Full reseed: 23 MS3, 35 MS4, 15×PGY 1-3, graduates
└── 20260317000001_epiq_graduate_classes.sql        # Graduate class documentation (JS migration)
```

### 3.3 Component Architecture

**Rendering approach:** All charts and visualizations use HTML5 Canvas 2D — no SVG, D3, or Recharts. This is a deliberate choice for performance with 270+ animated particles.

**Styling approach:** Inline `style` objects (not Tailwind CSS) with constants from the `THEME` object in `primitives.tsx`. This ensures consistent dark theme across all components without Tailwind class conflicts.

**Fonts:** Sora (body, 300–600 weight) + Space Mono (monospace data, 400/700 weight) loaded via Google Fonts.

**State management:** React useState/useRef/useMemo/useCallback only. No external state library. Particle positions managed via `particlesRef` (mutable ref for animation loop performance).

### 3.4 Database Schema

**`epiq_profiles`** — One row per physician/student

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default gen_random_uuid() | Profile identifier |
| first_name | TEXT | NOT NULL | First name |
| last_name | TEXT | NOT NULL | Last name |
| role | TEXT | CHECK (IN 'MS3','MS4','PGY 1','PGY 2','PGY 3','Graduate') | Training level |
| cohort_label | TEXT | default 'EM Residency 2025' | Cohort name |
| institution_name | TEXT | default 'Grey Sloan Memorial Hospital' | Hospital name |
| program_name | TEXT | default 'Emergency Medicine Residency' | Program name |
| archetype_id | TEXT | nullable | Trajectory archetype slug |
| archetype_confidence | NUMERIC | nullable, 0–1 | Classification confidence |
| narrative | TEXT | nullable | AI narrative or 'ARCHIVED' for hidden graduates |
| is_demo | BOOLEAN | default true | Demo data flag |
| created_at | TIMESTAMPTZ | default now() | Row creation time |

**`epiq_profile_scores`** — 15 attribute-level scores per profile (5 EQ + 5 PQ + 5 IQ)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Score row identifier |
| profile_id | UUID | FK → epiq_profiles ON DELETE CASCADE | Parent profile |
| pillar | TEXT | CHECK (IN 'eq','pq','iq') | Which quotient pillar |
| attribute_slug | TEXT | NOT NULL | DB slug (e.g., stress_mgmt) |
| attribute_label | TEXT | NOT NULL | Display label (e.g., Stress Management) |
| score | INTEGER | CHECK (0–100) | Attribute score |
| display_order | INTEGER | NOT NULL | Sort order within pillar |
| | | UNIQUE (profile_id, pillar, attribute_slug) | |

**`epiq_profile_history`** — Longitudinal composite + pillar scores by training period

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | History row identifier |
| profile_id | UUID | FK → epiq_profiles ON DELETE CASCADE | Parent profile |
| period | TEXT | CHECK (IN 'MS3','MS4','PGY 1','PGY 2','PGY 3','Graduate') | Training period |
| composite_score | INTEGER | CHECK (0–100) | Composite average |
| eq_score | INTEGER | nullable, CHECK (0–100) | EQ pillar score |
| pq_score | INTEGER | nullable, CHECK (0–100) | PQ pillar score |
| iq_score | INTEGER | nullable, CHECK (0–100) | IQ pillar score |
| | | UNIQUE (profile_id, period) | |

**Row-Level Security:** All three tables have RLS enabled with `SELECT` policy for all (public read, no auth required). No INSERT/UPDATE/DELETE policies — data is managed via service role only.

---

## 4. API

### GET `/api/epiquotient/profiles`

Returns all non-archived profiles with computed scores, history, archetype metadata, and 7 deterministic demo data slices, wrapped in a meta envelope.

**Auth:** None (uses Supabase service role key server-side)

**Query params:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `cohort` | string | No | Filters by `cohort_label` column |

**Supabase query:**
- Select: `*, epiq_profile_scores(*), epiq_profile_history(*)`
- Filter: `or('narrative.is.null,narrative.neq.ARCHIVED')` — excludes archived graduates
- Order: `created_at` ascending
- Fallback: if `institution_name`/`program_name` columns are missing (migration not applied), retries without them

**Response shape (200):**

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
          { "period": "PGY 1", "series": ["..."] },
          { "period": "PGY 2", "series": ["..."] }
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
        "strengths": ["Strong interpersonal skills"],
        "weaknesses": ["Documentation needs improvement"],
        "opportunities": ["Leadership development"],
        "threats": ["Burnout risk under high census"],
        "periodLabel": "PGY 3",
        "generatedAt": "2026-03-15T..."
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

**Error response:** `{ "error": "message" }` with status 500.

**Name formatting:**
- PGY 1–3 and Graduate: `Dr. [First] [Last], MD` (63%) or `Dr. [First] [Last], DO` (37%) — assigned deterministically via UUID hash
- MS3/MS4: `[First] [Last]` (no "Dr." prefix)

**Graduation year calculation:** Graduate profiles use `getGraduationYearForPGY()` from `lib/utils/pgy-calculator.ts`. Graduate class label (e.g., "Class of 2024") is derived from `cohort_label` matching pattern.

**Attribute slug mapping (DB → frontend camelCase):**

| DB slug | Frontend key |
|---------|-------------|
| empathy | empathy |
| adaptability | adaptability |
| stress_mgmt | stressMgmt |
| curiosity | curiosity |
| communication | communication |
| work_ethic | workEthic |
| teachability | teachability |
| integrity | integrity |
| documentation | documentation |
| leadership | leadership |
| knowledge_base | knowledgeBase |
| learning_commit | learningCommit |
| analytical_thinking | analyticalThinking |
| clinical_adapt | clinicalAdapt |
| clinical_perf | clinicalPerf |

### 4.1 Demo Data Generators

All demo data is generated deterministically using seeded pseudo-random functions based on the profile UUID. This ensures consistent data across page reloads without database storage.

| Generator | Output Type | Logic |
|-----------|------------|-------|
| `seededRandom(id, salt)` | `number` (0–1) | Hash-based PRNG from UUID + salt string; produces same output for same inputs |
| `generateDemoRadar(profile)` | `RadarData` | Faculty and self-assessment scores per attribute (base ± small deltas) |
| `generateDemoRadarTimeline(profile)` | `RadarSnapshot[]` | Per-period faculty/self snapshots scaled from history; returns undefined if < 2 history points |
| `generateDemoComparison(profile)` | `ComparisonData` | Faculty/self pillar scores, seeded class averages, faculty count (3–8), self count 1 |
| `generateDemoTrends(profile)` | `TrendPoint[]` | Per-period faculty/self EQ/PQ/IQ with small deltas; undefined if < 2 history points |
| `generateDemoSwot(profile)` | `SwotData` | Picks from fixed SWOT arrays; 3 strengths if composite ≥ 70, else 2; 3 weaknesses if composite < 50, else 2 |
| `generateDemoIte(profile)` | `IteData` | One score per PGY year; individual/class/program averages; undefined for MS3/MS4 |
| `generateDemoRatings(profile)` | `RatingsData` | Core faculty (2–6), teaching faculty (1–4), self (1–2); up to 6 recent entries with names from `FACULTY_NAMES`, comments from `DEMO_COMMENTS` |

---

## 5. View Architecture

EPI Quotient uses a **landing + scope** navigation model. The landing page is the immersive particle wave field. Clicking a scope pill (Program | Class | Individual) transitions into a full-screen vertical scroll-snap experience with 5 analytical lens sections. Clicking a particle on the landing opens its side panel; from there, the Individual view provides the deep-dive.

### 5.0 Page States

| State | Pill Active | Content | Exit |
|-------|-------------|---------|------|
| **Landing** | None | Particle wave field (270 profiles) | — |
| **Program** | Program | 5 scroll-snap sections (program-level analytics) | Click active pill or Esc |
| **Class** | Class | 5 scroll-snap sections (class-level analytics) | Click active pill or Esc |
| **Individual** | Individual | Sidebar + profile header + 13 section cards | Click active pill or Esc |

### 5.0.1 Scope Pill Switcher

- **Position:** Fixed, centered at top of viewport (`top: 24px`, `left: 50%`, `z-index: 60`)
- **Style:** Frosted glass pill with `backdrop-filter: blur(12px)`, dark surface background (`rgba(10, 24, 38, 0.85)`), teal border, `border-radius: 28px`
- **Sections:** Three buttons — **Program** | **Class** | **Individual**
- **Landing state:** All three pills inactive (muted text `#4A7090`)
- **Active state:** Teal background glow (`rgba(47, 230, 222, 0.12)`), teal text (`#2FE6DE`), font-weight 500
- **Toggle behavior:** Clicking the active pill returns to landing; clicking a different pill switches scope
- **Escape key:** Returns to landing from any scope

### 5.0.2 Landing-to-Scope Transition (Cross-Dissolve)

Uses a cross-dissolve with `visibility` management to prevent compositing artifacts:

- **Enter scope:** Landing fades out (`opacity: 0`, 0.7s linear). Scope container becomes `visibility: visible` instantly, fades in (`opacity: 1`, 0.7s linear). Side panel closes on entry.
- **Switch scope:** Previous scope enters `exiting` state (retains `visibility: visible` during fade-out, then hides after 0.7s). New scope fades in simultaneously.
- **Exit to landing:** Active scope enters `exiting` state. Landing fades back in.
- **Inactive scopes:** `visibility: hidden; opacity: 0; pointer-events: none` — prevents compositing artifacts.
- **State management:** `exitingScope` ref tracks the outgoing scope during transitions, cleared after 0.7s.

### 5.0.2a Landing-to-Individual 3D Transition

The Individual view uses a distinct 3D perspective transition instead of the cross-dissolve:

- **Enter individual:** Landing rotates `rotateY(0 → -85deg)` and fades to `opacity: 0` over 1.5s. Individual view rotates `rotateY(85deg → 0)` and fades to `opacity: 1` over 1.5s. Both use `perspective(1200px)`.
- **Exit individual:** Reverse — individual rotates out `rotateY(0 → -85deg)`, landing rotates back `rotateY(85deg → 0)`.
- **State flags:** `pivoting` (entering individual), `individualExiting` (leaving individual), `landingReturning` (landing coming back from individual).
- **Panel behavior:** Side panel closes on individual entry.

### 5.0.3 Scroll-Snap Sections (Per Scope)

Each scope page is a vertically scrolling container with 5 full-viewport sections:

| Section | Lens | Content |
|---------|------|---------|
| 1 | **Overview** | Composite scores, pillar bars, risk distribution, role breakdown, archetype frequency |
| 2 | **EQ/PQ/IQ** | 15-attribute radar chart, 3 pillar rings, per-attribute breakdown bars |
| 3 | **SWOT** | Statistical SWOT cards derived from attribute mean/std distribution |
| 4 | **ITE/Trajectory** | Period badges, composite trajectory canvas (individuals + cohort average) |
| 5 | **Archetypes** | Scatter chart (composite vs delta), distribution bars, risk summary, detail cards |

- **Scroll behavior:** `scroll-snap-type: y mandatory`, each section `scroll-snap-align: start`
- **Section size:** Each section is `100vw × 100vh`
- **Section header:** Top-left — icon + lens label + scope context badge

### 5.0.4 Dot Navigation

- **Position:** Fixed right edge, vertically centered (`right: 24px`, `top: 50%`)
- **Dots:** 5 small circles (10px), one per lens section
- **Active dot:** Teal (`#2FE6DE`) with glow, slightly scaled up
- **Inactive dots:** Muted (`#4A7090`)
- **Hover:** Dot brightens + label appears to the left (e.g., "Overview", "EQ / PQ / IQ")
- **Click:** Scrolls to that section
- **Visibility:** Only visible when in a scope (hidden on landing)
- **Tracking:** `IntersectionObserver` on each section (threshold 0.5) updates the active dot

### 5.0.5 Scope Context Headers

| Scope | Context Badge | Behavior |
|-------|--------------|----------|
| **Program** | `{institution} · {program}` | Static text from API meta; monospace, muted |
| **Class** | Clickable role pills: `MS3 │ MS4 │ PGY 1 │ PGY 2 │ PGY 3 │ Graduate` | Clicking a pill filters all lens data to that class; clicking again deselects. Active: teal text/border/bg. Unfiltered: all pills at 50% opacity |
| **Individual** | `individual` (uppercase, static) | No interactivity |

**Class filter behavior:**
- `classFilter` state: `string | null` (null = show all)
- When selected, profiles are filtered before being passed to all 5 lens components
- All lenses reflect the filtered dataset automatically
- Distinct roles derived from full profile set (not filtered set)
- Pills appear in every section header within the Class scope

### 5.1 Landing Page — Particle Wave Field

- 6 sine waves, one per training level (Graduate at top → MS3 at bottom)
- Each particle = one profile, positioned along its wave with slight jitter
- Particle color = composite score mapped through a 7-stop teal gradient (`scoreToRGB`)
- Particle size scales slightly with composite score (higher = larger `baseRad`)
- Waves animate continuously with independent frequency, speed, and phase
- **Data-driven amplitudes:** Each wave's vertical oscillation computed from the min/max score spread of its cohort. Dynamically recalculates when sort mode changes (Default/A-Z use composite range; EQ/PQ/IQ use respective pillar). Clamped to `MIN_AMP` (20) – `MAX_AMP` (80). Transitions smoothly via lerp in the render loop.
- **Score-driven Y offset:** Each particle's vertical distance from wave center encodes deviation from cohort mean. Above line = above mean, below = below. Max deflection ±10px. Recalculates with sort filter. ±2px random jitter prevents stacking. Animated via lerp.

**Wave constants:**

| Wave | Training Level | yF | amp | freq | spd | ph |
|------|---------------|-----|-----|------|-----|----|
| 0 | Graduate | 0.22 | 55 | 1.10 | 0.22 | 0.0 |
| 1 | PGY 3 | 0.34 | 70 | 0.85 | 0.17 | 1.2 |
| 2 | PGY 2 | 0.46 | 65 | 1.00 | 0.25 | 2.5 |
| 3 | PGY 1 | 0.57 | 50 | 0.75 | 0.20 | 3.8 |
| 4 | MS4 | 0.68 | 45 | 1.15 | 0.19 | 5.1 |
| 5 | MS3 | 0.79 | 42 | 0.90 | 0.21 | 4.3 |

### 5.1.1 Particle Sort

A row of text links beneath the pill switcher rearranges particles within each wave:

**Sort modes:** `A → Z | EQ | PQ | IQ | EPIq`

| Mode | Sort Key | Direction |
|------|----------|-----------|
| A → Z | Last name (alphabetical) | A on left, Z on right |
| EQ | Emotional Quotient score | Lowest left, highest right |
| PQ | Professional Quotient score | Lowest left, highest right |
| IQ | Intellectual Quotient score | Lowest left, highest right |
| EPIq | Composite average of EQ+PQ+IQ | Lowest left, highest right |

**Animation:** Staggered spring interpolation — `p.x += (targetX - p.x) * (0.035 + random * 0.018)` per frame, producing an organic "swarm" drift. Particles retain wave Y-position while sliding horizontally.

**UI:**
- **Position:** Fixed, centered beneath pill switcher (`top: 68px`)
- **Style:** `Space Mono`, 10px, muted teal (`#4A7090`), pipe-separated
- **Active state:** Selected sort highlighted in `#2FE6DE`
- **Toggle:** Clicking active sort deselects (returns to default scattered positions)
- **Visibility:** Only visible on landing page

**State:** `sortMode: 'default' | 'az' | 'eq' | 'pq' | 'iq' | 'epiq'` + `sortModeRef` for animation loop access. Each particle stores `targetX` (destination) and `originX` (initial random position).

### 5.2 Wave Labels

- Subtle, repeating text labels follow the sine curve for each wave
- Labels rotate with the curve's tangent angle
- Positioned 5px above the wave line at low opacity
- Font: Sora 500, 9px

### 5.3 Hover Tooltip

- Displays on particle hover: name, role, composite score
- Sparkline showing historical trajectory (if 2+ data points)
- Archetype name
- "Click to view full profile" CTA
- **Edge detection:** Tooltip flips to left side when particle near right viewport edge; shifts upward near bottom
- **Animation:** `opacity(0 → 1)`, `translateY(4px → 0)` over 0.15s

### 5.3a Touch Mini-Sheet

On touch devices (`@media (hover: none)`), a bottom sheet replaces the hover tooltip:

- **Trigger:** Touch start on nearest particle within 36px hit area (vs 26px for mouse)
- **Content:** Name, role, composite score, "Tap to open" CTA
- **Animation:** `translateY(20px → 0)`, `opacity(0 → 1)` over 0.2s
- **Behavior:** Touch end opens the full side panel; touch cancel dismisses
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

**Width:** 380px (340px on ≤1024px; full-screen overlay on ≤768px)

### 5.5 Drill-Down Panel

- Shows all 5 attributes within a pillar
- Animated progress bars with delay cascade
- Grade labels (Exceptional → Significant Concern)
- **Width:** 340px, slides in from right (overlaps side panel)

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

### 5.8 HUD (Heads-Up Display)

- **Top center:** View switcher pill (Program | Class | Individual)
- **Below pill (landing only):** Sort row — `A → Z | EQ | PQ | IQ | EPIq` text links
- **Top left:** "EPI Quotient" logo + "Performance Fingerprint" subtitle
- **Top right:** Profile count (visible/total when filtered) + average composite score
- **Bottom left:** Gradient bar with hoverable score scale tooltips
- **Bottom center:** Filter pills (role row + score band row)
- **Bottom right:** Interaction hint text — "Hover a particle to identify", "Click to explore the profile", "Wave amplitude reflects score variance of the min and max for the chosen filter."

### 5.8a Responsive Breakpoints

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

Reusable React components in `components/epiquotient/` provide the analytical content for each scroll-snap section. All accept `LensProps` (`scope: ScopeType`, `profiles: Profile[]`).

| Component | File | Lines | Content |
|-----------|------|-------|---------|
| `OverviewLens` | `OverviewLens.tsx` | 317 | Profile count, composite/pillar averages (StatCard), pillar bars (PillarBar), risk distribution (RiskSummary), role badges (RoleBadge), archetype frequency (ArchetypeChip) |
| `EqPqIqLens` | `EqPqIqLens.tsx` | 278 | 15-attribute canvas radar (RadarCanvas with ResizeObserver), 3 SVG ring scores, 3 columns of per-attribute breakdown bars |
| `SwotLens` | `SwotLens.tsx` | 156 | SWOT cards from attribute mean/std: top 4 = strengths, bottom 4 = weaknesses, high variance = opportunities, conditional threats from low composite or high-risk archetypes |
| `TrajectoryLens` | `TrajectoryLens.tsx` | 254 | Period-average badges, canvas chart of faint individual composite trajectories + bold cohort average (smooth curve) |
| `ArchetypesLens` | `ArchetypesLens.tsx` | 321 | Risk summary row, scatter canvas (composite vs trajectory delta via history first/last), archetype distribution bars, per-archetype detail cards |

### 5.9.1 Class View — Filtering

The Class scope reuses the same 5 lens components but adds a **class filter** in the section headers. When a class pill is selected (e.g., "PGY 2"), only profiles with that role are passed to all 5 lens components. All analytics, averages, and charts reflect only the filtered subset.

### 5.10 Individual View

Full deep-dive into a single profile via a two-column layout (`IndividualView.tsx`, 952 lines):

#### 5.10.1 Sidebar (260px)

- **Active role groups:** Collapsible sections for PGY 3, PGY 2, PGY 1, MS4, MS3 — each shows profile count and chevron toggle
- **Graduate group:** `GraduateSidebarGroup` groups graduates by `graduationYear` with "Class of YYYY" dividers (Class of 2022–2026)
- **Archived exclusion:** Profiles with `narrative === 'ARCHIVED'` are hidden
- **Profile entries:** Name, graduation class label, composite score (color-coded via `scoreColor()`)
- **Selection:** Click any profile to load it into the main content area
- **Active split:** Uses `isResidentActive()` from `lib/utils/pgy-calculator.ts`

#### 5.10.2 Profile Header

- Name (Sora 600), role, graduation class label
- Composite score (large monospace) with grade label (Exemplary/Strong/Acceptable/Concerning/Serious Deficit)
- EQ/PQ/IQ pillar cards with animated progress bars (`transition: width 0.8s cubic-bezier(0.16,1,0.3,1)`)
- Archetype badge (risk-colored: Low=green, Moderate=orange, High=red) with confidence percentage
- Mail icon (opens `mailto:`), Share icon (opens Share modal)

#### 5.10.3 Section Groups (3 groups, 13 sections)

Sections rendered from `SECTION_REGISTRY` (`components/epiquotient/sections/index.ts`), organized by `SECTION_GROUPS`:

**Overview group:**

| # | Section | Component | Description |
|---|---------|-----------|-------------|
| 1 | Radar | `RadarSection` (497 lines) | 15-attribute canvas radar with Catmull-Rom smoothing. Timeline slider with play/pause (1.2s auto-play interval, `PLAY_INTERVAL`). Lerp interpolation between period frames (250ms, `LERP_DURATION`) via `requestAnimationFrame`. Legend: EQ/PQ/IQ pillar colors, Faculty/Self series colors. Custom `ATTR_ORDER` for visual grouping. |
| 2 | Comparison | `ComparisonSection` (185 lines) | Canvas grouped bar chart: Faculty (pillar color) vs Self (indigo `#6366f1`) bars for EQ/PQ/IQ. Optional class-average dashed line. `ResizeObserver` for responsive redrawing. Faculty/self counts in subtitle. |
| 3 | Heatmap | `HeatmapSection` (160 lines) | Table: rows = Composite/EQ/PQ/IQ, columns = periods (sorted MS3 → Graduate via `periodSortIndex`). `HeatCell` cells with score-based background color. `MiniSparkline` in trend column. Returns `null` if no history. |
| 4 | Trends | `TrendSection` (210 lines) | Canvas multi-series line chart with **Faculty / Self / Both** toggle. Solid lines for faculty, dashed for self. Pillar colors (EQ teal, PQ green, IQ blue). `ResizeObserver`. |
| 5 | ITE | `IteSection` (135 lines) | Table: PGY level, Raw Score, Percentile (color-coded badge), National Mean. Sorted newest first. Individual/Class/Program average rows at bottom. Orange accent (`#f0a060`). Returns `null` if no ITE data. |

**Deep Dive group:**

| # | Section | Component | Description |
|---|---------|-----------|-------------|
| 6 | EQ Drilldown | `DrilldownSection` (pillar=eq, 171 lines) | 5 EQ attributes: Current score + Grade columns, horizontal progress bars with teal fill. Header sparkline from pillar history. `periodSortIndex` for period ordering. |
| 7 | PQ Drilldown | `DrilldownSection` (pillar=pq) | Same layout with green fill. |
| 8 | IQ Drilldown | `DrilldownSection` (pillar=iq) | Same layout with blue fill. |
| 9 | Trajectory | `TrajectorySection` (171 lines) | Canvas line chart: composite (thick accent line) + EQ/PQ/IQ (thinner, 80% opacity) over periods. Score labels above composite data points. Legend with pillar colors. |

**Context & History group:**

| # | Section | Component | Description |
|---|---------|-----------|-------------|
| 10 | SWOT | `SwotSection` (94 lines) | 2×2 grid: Strengths (green), Weaknesses (red), Opportunities (blue), Threats (orange). Icon + label + bullet list per quadrant. `QUADRANT_META` for icons/colors. Returns `null` if empty. |
| 11 | Archetype | `ArchetypeSection` (79 lines) | Archetype name badge (risk-colored), action badge, confidence %, description text, optional narrative. Returns `null` if no archetype. |
| 12 | Ratings | `RatingsSection` (70 lines) | 4-column grid: Core Faculty (accent), Teaching Faculty (amber), Self (indigo), Total. Large monospace count values. Scrollable recent entries list. Returns `null` if no ratings. |
| 13 | Comments | `CommentsSection` (78 lines) | Comment list with evaluator type badge (`TYPE_STYLES`), name, date, quoted comment text. Left border colored by evaluator type. Returns `null` if no comments with text. |

**Paired expand/collapse:** Comparison + Heatmap share a single expand state (`comparison-heatmap`); Trends + ITE share `trends-ite`. Remaining sections render full width with independent expand.

#### 5.10.4 Share Modal

- Overlay with section checklist (one checkbox per `SECTION_REGISTRY` entry)
- Select All / Deselect All toggles
- Share uses Web Share API (`navigator.share`) with clipboard (`navigator.clipboard.writeText`) fallback
- Generates formatted text with profile name, scores, and selected section labels
- Close via backdrop click or Escape key

#### 5.10.5 Section Component Architecture

All sections use the `SectionDef` interface:

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

**SECTION_GROUPS:** 3 groups — `Overview`, `Deep Dive`, `Context & History`

**SectionCard wrapper** (`SectionCard.tsx`, 115 lines): Collapsible card with left accent color bar, title/subtitle, optional `headerScore` badge, optional `sparklineValues`/`sparklineColor`, expand/collapse chevron. Supports both controlled (`expanded`/`onToggleExpanded`) and uncontrolled (`defaultExpanded`) modes.

#### 5.10.6 Primitives & Theme

Shared constants and utilities from `components/epiquotient/sections/primitives.tsx` (166 lines):

**THEME constant:**
- `bg`: page (`#0a1620`), sidebar (`#0e1e2d`), card (`#162737`), deep (`#07121d`), table (`#0e1e2d`)
- `border`: subtle/light/medium/accent (`rgba(47,230,222,...)` at 0.06–0.25)
- `text`: primary (`#c8e0ee`), secondary (`#7ab5cc`), muted (`#4a7090`), dim (`#3a5a72`)
- `accent`: `#2fe6de`
- `font`: body (`'Sora', system-ui, sans-serif`), mono (`'Space Mono', monospace`)

**Utilities:**
- `PERIOD_ORDER`: `['MS3', 'MS4', 'PGY 1', 'PGY 2', 'PGY 3', 'PGY 4', 'Graduate']`
- `periodSortIndex(period)`: index in PERIOD_ORDER (99 for unknown)
- `scoreToRGB(s)`: 7-stop gradient interpolation (0 = `#0C1932` near-black navy, 100 = `#3CFFC8` vivid mint)
- `scoreBg(s, alpha)`: `rgba` background string from score
- `scoreColor(s)`: hex color string from score
- `grade(s)`: returns `{ lbl, c }` — Exemplary (≥88), Strong (≥74), Acceptable (≥60), Concerning (≥46), Serious Deficit (<46)

**Reusable components:**
- `HeatCell({ value })`: Score cell with `scoreColor`/`scoreBg` background; monospace font
- `MiniSparkline({ values, color, width, height })`: Canvas sparkline with quadratic bezier curves; auto-scales to value range

**Type constants** (`types.ts`, 190 lines):
- `PILLAR_COLORS`: `{ eq: '#2FE6DE', pq: '#18F2B2', iq: '#7BC8F8' }`
- `PILLAR_LABELS`: `{ eq: 'Emotional Quotient', pq: 'Professional Quotient', iq: 'Intellectual Quotient' }`
- `ATTR_LABELS`: Nested record mapping pillar → attribute_slug → display label
- `RISK_COLORS`: `{ Low: green, Moderate: orange, High: red }` with bg/text/border variants

---

## 6. Scoring Scale

| Range | Label | Description |
|-------|-------|-------------|
| 81–100 | Exceptional | Exceeds expectations with compelling examples |
| 61–80 | Exceeds Expectations | Solid performance with clear competence |
| 41–60 | Meets Expectations | Adequate; developmentally appropriate gaps |
| 21–40 | Below Expectations | Noticeable gaps; targeted development needed |
| 0–20 | Significant Concern | Red flags requiring intervention |

**Grade thresholds** (used in Individual View sections):

| Threshold | Grade Label | Color |
|-----------|------------|-------|
| ≥ 88 | Exemplary | `#3CFFC8` (vivid mint) |
| ≥ 74 | Strong | `#2FE6DE` (teal) |
| ≥ 60 | Acceptable | `#f0a060` (amber) |
| ≥ 46 | Concerning | `#f06060` (red) |
| < 46 | Serious Deficit | `#f06060` (red) |

---

## 7. Archetypes

9 trajectory archetypes derived from the Memorial classifier, assigned during database seeding:

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

**Risk distribution:** Low (5 archetypes), Moderate (2), High (2)

**Archetype assignment logic:** Database seed script evaluates each profile's history trajectory (first composite → last composite delta, variance, peak position) and assigns the most fitting archetype with a confidence score (0–1).

---

## 8. EQ/PQ/IQ Attributes

### Emotional Quotient (EQ)
- Empathy & Positive Interactions
- Adaptability & Self-Awareness
- Stress Management & Resilience
- Curiosity & Growth Mindset
- Communication Effectiveness

### Professional Quotient (PQ)
- Work Ethic & Professional Presence
- Teachability & Receptiveness
- Integrity & Accountability
- Clear & Timely Documentation
- Leadership & Relationship Building

### Intellectual Quotient (IQ)
- Strong Knowledge Base
- Commitment to Learning
- Analytical Thinking & Problem-Solving
- Adaptability in Clinical Reasoning
- Clinical Performance for Year of Training

> **Terminology note:** The product uses "Intellectual Quotient" for IQ (not "Intelligence Quotient") to align with the EQ·PQ·IQ brand language across all products.

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
| `--bg` | `#07121D` | Page background (layout.tsx) |
| `--text-primary` | `#C8E0EE` | Primary text |
| `--text-muted` | `#4A7090` | Secondary/muted text, inactive pills |
| `--accent-teal` | `#2FE6DE` | Logo, active pills, score gradient bright end, THEME.accent |
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
| IQ (Intellectual) | `#7BC8F8` | Blue |

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
| Logo | Sora | 600 | 22px (14px at ≤480px) |
| Logo subtitle | Space Mono | 400 | 10px |
| View switcher | Sora | 400 (inactive) / 500 (active) | 12px |
| Stat values | Space Mono | 700 | 18px |
| Stat labels | Space Mono | 400 | 9px |
| Wave labels | Sora | 500 | 9px |
| Filter pills | Space Mono | 400 | 10px |
| Sort row | Space Mono | 400 | 10px |
| Tooltip name | Sora | 500 | 13px |
| Panel name | Sora | 600 | 20px |
| Section card title | Sora | 500 | 14px |
| Body text | Sora | 300–400 | 11–13px |
| Monospace data | Space Mono | 400/700 | varies |

**Font imports:**
- [Sora](https://fonts.google.com/specimen/Sora) (weights 300, 400, 500, 600)
- [Space Mono](https://fonts.google.com/specimen/Space+Mono) (weights 400, 700)

### 9.3 Spacing & Layout

- Full viewport canvas (100vw × 100vh)
- HUD elements positioned absolutely with `z-index: 10–60`
- View switcher pill: centered top (`z-index: 60`), 3px padding, 28px border-radius
- Sort row: centered, below pill (`top: 68px`, `z-index: 30`)
- Side panel: 380px wide, slides in from right (landing only)
- Drill panel: 340px wide, slides in from right (overlaps side panel)
- Filter bar: centered bottom, no background (floats directly on canvas)
- Gradient bar: bottom-left, 200px wide, 8px tall (130px × 6px at ≤480px)
- Scope sections: full-viewport (100vw × 100vh), scroll-snap-align start
- Dot nav: fixed right edge, 5 dots at 14px gap, vertically centered
- Individual view sidebar: 260px, scrollable

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
| Graduate (archived) | 92 (hidden via `narrative = 'ARCHIVED'`) |
| Graduate classes | Class of 2022, 2023, 2024, 2025, 2026 |
| Score attributes per profile | 15 (5 per pillar) |
| History depth | 0 (MS3) to 5+ (Graduate) periods |
| Archetypes | 9 types, evenly distributed |
| MD/DO split | 63% MD / 37% DO (residents + graduates) |
| Institution | Grey Sloan Memorial Hospital (default) |
| Program | Emergency Medicine Residency (default) |
| Program length | 3 years (constant) |

### 10.1 Graduate Class Score Profiles

| Class | Mean | Range | Character |
|-------|------|-------|-----------|
| Class of 2026 | 68 | 60–76 | Tight, moderate-to-high (current) |
| Class of 2025 | 55 | 38–74 | Wide spread (recent grads) |
| Class of 2024 | 72 | 62–82 | Higher baseline (mature) |
| Class of 2023 | 78 | 72–84 | Tight high cluster (established) |
| Class of 2022 | 60 | 40–80 | Widest range (senior alumni) |

Each class has 15 graduates with scores scaled toward the class target center via `scripts/migrate-graduate-classes.js`. Scores are rescaled from the original composite using a proportional scale factor plus jitter within the class spread.

### 10.2 PGY Variance Design

The three PGY classes are deliberately seeded with distinct score variance profiles to showcase the data-driven amplitude feature:

| Class | Composite Range | Variance | Wave Effect |
|-------|----------------|----------|-------------|
| PGY 1 | ~52–78 | Low | Flat, calm wave |
| PGY 2 | ~30–90 | High | Tall, dramatic wave |
| PGY 3 | ~45–85 | Moderate | Medium wave |

This makes the amplitude differences immediately visible on the landing page.

### 10.3 Seed Data Pipeline

1. **Initial seed** (`20260313000001`): PL/pgSQL loop creates 270 profiles with random first/last names from curated arrays, random scores (40–95 range), and role distribution
2. **Role normalization** (`20260313000002`): Renames Intern → PGY 1, R1 → PGY 2, R2 → PGY 3
3. **History + archetypes** (`20260313000003`): Seeds `epiq_profile_history` with period-appropriate score trajectories; assigns archetypes based on trajectory shape
4. **Program context** (`20260314000001`): Adds institution/program name columns with defaults
5. **Full reseed** (`20260316000001`): Deletes all rows, recreates with engineered variance (PGY 1 low, PGY 2 high, PGY 3 moderate), regenerates scores/history/archetypes
6. **Graduate redistribution** (`scripts/migrate-graduate-classes.js`): Takes graduate rows, assigns 75 to 5 classes of 15, archives remaining 92. Rescales scores per class target profile.

---

## 11. Deployment

### Production
- **Platform:** Vercel (via lev8 monorepo)
- **Domain:** `www.epiquotient.com` (DNS → Vercel)
- **Redirect:** `epiquotient.com` → `www.epiquotient.com` (308 permanent)
- **Routing:** Middleware rewrites `/` to `/epiquotient` (URL bar stays as `/`)
- **Auth:** None required (public visualization)
- **Database:** Supabase PostgreSQL with public RLS

### Local Development
- **Direct path:** `http://localhost:3000/epiquotient`
- **Domain simulation:** `epiquotient.localhost` (requires hosts file entry)
- **Database:** Same Supabase project (linked via env vars)

### Environment Variables Required
| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Database connection |
| `SUPABASE_SERVICE_KEY` | Service role for profile API |

No other environment variables are needed — EPI Quotient has no auth, email, AI, or payment dependencies.

---

## 12. TypeScript Interfaces (Key Types)

```typescript
// Core profile (components/epiquotient/types.ts)
interface Profile {
  id: string;
  name: string;
  role: string;
  graduationClass?: string;
  graduationYear?: number;
  eq: Record<string, number>;
  pq: Record<string, number>;
  iq: Record<string, number>;
  eqScore: number;
  pqScore: number;
  iqScore: number;
  composite: number;
  history: HistoryPoint[];
  archetype: Archetype | null;
  narrative: string | null;
  radar?: RadarData;
  comparison?: ComparisonData;
  trends?: TrendPoint[];
  swot?: SwotData;
  ite?: IteData;
  ratings?: RatingsData;
}

// Lens props (shared by all 5 lenses)
interface LensProps {
  scope: 'program' | 'class' | 'individual';
  profiles: Profile[];
}

// Program metadata from API
interface ProgramMeta {
  institution: string;
  program: string;
  programLength?: number;
}

// Section definition (section registry)
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

// Particle (page.tsx — extends Profile for canvas rendering)
interface Particle extends Profile {
  wIdx: number;
  x: number;
  targetX: number;
  originX: number;
  yScatter: number;
  yScatterTarget: number;
  yJitter: number;
  baseRad: number;
}
```

---

## 13. Known Patterns & Development Notes

### Canvas Rendering
All visualization charts use HTML5 Canvas 2D for performance. The particle field renders 270 animated particles at 60fps. Canvas sections use `ResizeObserver` for responsive redrawing. No external charting library — all drawing logic is inline.

### Inline Styles
Uses inline `style` objects exclusively (not Tailwind) with dark theme constants from the `THEME` object. This avoids Tailwind class specificity issues in the deeply nested component tree and ensures pixel-perfect control over the dark theme.

### Demo Data Architecture
The 7 demo data generators in the API route produce deterministic output from profile UUIDs via `seededRandom(id, salt)`. This means:
- Same profile always gets the same radar, comparison, trends, SWOT, ITE, and ratings data
- No additional database storage needed for demo visualization data
- Data regenerates identically on every API call

### PostgREST Embedded Joins
The API uses Supabase's embedded select syntax: `epiq_profile_scores(...)` and `epiq_profile_history(...)` as foreign-key joins. Unlike the `user_profiles` FK workaround needed elsewhere in the codebase, these joins work cleanly because the FK relationships are within the public schema.

### Architecture Supports Multi-Specialty
The current demo uses a 3-year EM residency. The architecture supports additional PGY levels (PGY 4, PGY 5) for other specialties via database/seed changes only — the `PERIOD_ORDER` in `primitives.tsx` already includes `PGY 4`, and the UI components adapt dynamically to available periods.

---

## 14. Future Enhancements

### Completed
- ~~**Lens section buildout**~~ — 5 lens components at all 3 scopes
- ~~**Cross-view navigation**~~ — Class filter pills, particle click → side panel
- ~~**Mobile responsive**~~ — 3 breakpoints (1024/768/480px) + touch mini-sheet
- ~~**Individual view refinement**~~ — 13-section registry, graduate class sidebar, paired expand, share modal, timeline radar

### Planned
1. **Academic year scrubber** — Bottom timeline for time-aware roster filtering using `graduation_year` and `pgy-calculator.ts`
2. **Real data integration** — Connect to live `structured_ratings` and `period_scores` tables instead of demo seed data
3. **AI narratives** — Generate Claude-powered narrative summaries per profile based on trajectory and archetype
4. **Cohort selector** — Dropdown to switch between cohorts/programs (multi-tenant support)
5. **Time animation** — Animate the particle field across periods, showing how scores evolve
6. **Export** — Screenshot or PDF export of the current view
7. **Comparison mode** — Select two profiles to overlay their trajectories
8. **Multi-specialty support** — Additional PGY levels (PGY 4, PGY 5, etc.) for specialties beyond EM
9. **Authentication layer** — Program-specific data access with role-based visibility
10. **Graduate class year scrubber** — Time-based filtering within the Individual sidebar
11. **Sidebar search** — Text search across profile names in Individual view
12. **Section permalinks** — Deep link to a specific section of a specific profile
13. **Live data connection** — Connect Individual View sections to real `structured_ratings`, `period_scores`, `ite_scores`, `imported_comments` tables instead of demo generators
14. **Cohort comparison** — Side-by-side analytics of two different class cohorts
15. **Print-friendly view** — Optimized layout for printed reports from Individual View
16. **Accessibility** — Screen reader support, keyboard navigation for particle field, ARIA labels on canvas elements
