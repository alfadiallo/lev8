# Elevate Design Standard Rubric

## Executive Summary

This design rubric establishes clear guidelines for the Elevate product suite. Parts 1–6 cover the core Elevate platform design system (transparency, color strategy, gradients, accessibility). The **EPI-QUOTIENT** section at the end documents the distinct dark-theme design system for www.epiquotient.com.

The methodology emphasizes **restraint and purposefulness**—modern UI design achieves sophistication through transparency, subtle gradients, and strategic color usage rather than heavy shadows or borders.

---

## Part 1: Visual Hierarchy & Transparency

### Core Principle
Layered transparency creates depth and information hierarchy without explicit visual borders, reducing cognitive load while maintaining clear content structure.

### Key Observations from Reference Design
- Frosted glass/glassmorphism is used sparingly for secondary panels
- Device cards employ subtle translucency to suggest nesting
- Transparency hierarchy creates visual depth relationships
- Background layers remain legible despite overlays

### Transparency Guidelines

#### Opacity Levels by Component Type

| Component | Opacity | Purpose |
|-----------|---------|---------|
| Primary Background | 100% | Solid foundation |
| Secondary Cards | 90-95% | Nested content containers |
| Tertiary Elements | 85-90% | Accented information |
| Interactive Elements | 100% | Full legibility and affordance |
| Hover/Focus States | 95% | Subtle feedback without distraction |

#### Implementation Rules

1. **Never apply transparency to primary typography**
   - Text should always be at 100% opacity for accessibility
   - Minimum 4.5:1 contrast ratio must be maintained regardless of background transparency

2. **Transparency as depth cue**
   - Semi-transparent cards appear "nested" within their parent
   - Progressive transparency = progressive visual hierarchy
   - Use to replace or supplement traditional border treatments

3. **Performance consideration**
   - Limit simultaneous transparency layers to 3-4 maximum
   - Test on mid-range devices to ensure smooth rendering

---

## Part 2: Color Strategy

### Palette Architecture

#### Color Temperature Framework

The reference design employs **warm-to-cool tonal progression** to organize information zones:

- **Warm neutrals**: Peachy/cream backgrounds (primary content areas)
- **Cool accents**: Soft teals, mints, and blue-grays (interactive controls)
- **True neutrals**: Whites and light grays (typography and dividers)

#### Semantic Color Assignment

| Function | Color Family | Temperature | Example Use Cases |
|----------|--------------|-------------|-------------------|
| Content Zones | Warm (peach, cream, tan) | Warm | Home screens, summary views, status displays |
| Interactive Controls | Cool (teal, mint, soft blue) | Cool | Buttons, toggles, adjustment sliders |
| Information Alerts | Warm accent (coral, warm orange) | Warm | Notifications, warnings, status indicators |
| Disabled States | Neutral gray | Neutral | Inactive controls, locked features |

### Color Application Methodology

#### 1. Dominant Color (Primary Brand)
- Select one warm tone as primary identity
- Represents core brand personality
- Used in headers, key CTAs, and branding elements
- Should maintain 4.5:1 contrast against primary backgrounds

#### 2. Secondary Color (Interaction)
- Select one cool tone for interactive elements
- Creates visual distinction between content and controls
- Buttons, toggles, progress indicators, focus states
- Must contrast against both light and dark backgrounds in your system

#### 3. Tertiary Color (Support & Accents)
- Neutral gray palette for secondary interactions
- Dividers, subtle borders, disabled states
- Should not compete with primary/secondary colors

#### 4. Supporting Palette
- Semantic colors for status (success, error, warning, info)
- Should follow temperature framework (warm for alerts, cool for data)
- Must pass WCAG AA contrast requirements

### Color Accessibility Standards

- **Normal text**: Minimum 4.5:1 contrast ratio (WCAG AA)
- **Large text** (18px+): Minimum 3:1 contrast ratio
- **Interactive elements**: Minimum 3:1 contrast on focus states
- **Maintain contrast through transparency layers** using blending mode calculations

### Color Consistency Rules

1. **Color should not be the only differentiator** between interactive states
   - Combine with opacity, scale, or position changes
   - Ensures accessibility for colorblind users

2. **Test color combinations against backgrounds**
   - Verify in both light and dark theme variants
   - Check against common forms of colorblindness (use tools like Coblis)

3. **Limit palette saturation**
   - Keep colors at 60-80% saturation maximum
   - Highly saturated colors create visual tension and eye strain
   - Reference design uses muted, sophisticated color palette

---

## Part 3: Gradient Application

### Observed Gradient Technique

The reference design demonstrates sophisticated gradient usage:

- **Direction**: Vertical gradients from warm (top) → cool (bottom) guide eye movement
- **Intensity**: Subtle, appearing as tonal transitions rather than bold color shifts
- **Application**: Overlays and accents rather than primary color blocks
- **Restraint**: Gradients enhance, not dominate, the visual composition

### Gradient Methodology

#### Directional Guidelines

| Direction | Use Case | Frequency |
|-----------|----------|-----------|
| Vertical (top → bottom) | Primary page flow, container backgrounds | Frequent |
| Horizontal (left → right) | Accent elements, data visualization | Occasional |
| Diagonal | Minimal/only as decorative accent on secondary elements | Rare |
| Radial | Focus emphasis, spotlight effects | Very rare |

#### Technical Specifications

**Color Stop Limitations:**
- Maximum 2 color stops for primary gradients (start and end)
- Maximum 3 color stops for complex visualization gradients
- More stops create visual complexity without proportional benefit

**Opacity Application:**
- Apply gradients at 20-40% opacity as overlays
- Rather than pure color gradients, layer semi-transparent gradients over solid backgrounds
- This maintains color system consistency while adding depth

**Transition Smoothness:**
- Gradients should transition across minimum 200-300px (not abrupt changes)
- Use easing functions in animation (ease-in-out rather than linear)
- Mobile: Test on devices with lower color depths

#### Gradient Application Patterns

1. **Background Gradients**
   ```
   Start: Warm primary color @ 5% opacity
   End: Cool secondary color @ 10% opacity
   Direction: Vertical (top to bottom)
   Purpose: Reinforce information zone hierarchy
   ```

2. **Accent Gradients**
   ```
   Start: Primary brand color @ 100% opacity
   End: Secondary brand color @ 100% opacity
   Direction: Vertical or subtle diagonal
   Purpose: Draw attention to key interactive elements
   ```

3. **Hover/Focus Gradients**
   ```
   Start: Primary color @ 90% opacity
   End: Primary color @ 70% opacity
   Direction: Vertical
   Purpose: Subtle interaction feedback
   ```

### When NOT to Use Gradients

- Never use gradients on text (readability impact)
- Avoid on elements smaller than 48x48px
- Don't layer multiple gradients on same element
- Skip gradients on high-motion interactions (animation can amplify discomfort)
- Avoid gradients in components that need to support dark/light mode switching

---

## Part 4: Design Rubric Table

### Comprehensive Standards

| Dimension | Principle | Application Details | Success Criteria |
|-----------|-----------|---------------------|-----------------|
| **Transparency** | Layered depth without borders | Background: 100%; Cards: 90-95%; Interactive: 100% | Clear hierarchy, no legibility loss |
| **Color Contrast** | Semantic & accessible | Warm sections (content) / Cool sections (actions) | WCAG AA minimum; no-color-only differentiation |
| **Gradient Direction** | Purposeful flow | Vertical primary, horizontal accents only | Guides visual flow top-to-bottom |
| **Gradient Intensity** | Subtle refinement | 20-40% opacity overlays, max 2 color stops | Enhances without dominating |
| **Typography Over Glass** | Readability priority | Always maintain 4.5:1 contrast minimum | All text fully legible; no compromises |
| **Spacing** | Visual breathing room | Use negative space to reduce reliance on borders | Reduces cognitive load; clear zones |
| **Interactive States** | Clear affordance | Opacity + color shift (not just opacity) | Accessible to colorblind users; obvious state change |
| **Component Consistency** | Unified system | All components follow same transparency/color rules | Predictable user experience |
| **Motion & Animation** | Enhanced feedback | Gradual opacity/color transitions (200-300ms) | Smooth, not jarring; accessible |
| **Dark Mode Support** | Theme flexibility | All colors tested and contrast verified for both themes | Equal accessibility across themes |

---

## Part 5: Implementation Guide

### Phase 1: Establish Core Palette

1. **Select primary warm color** (brand identity)
   - Should feel approachable and human-centered
   - Test: Can it serve as a header background with white text?

2. **Select primary cool color** (interactions)
   - Should feel trustworthy and calming
   - Test: Does it create sufficient contrast against warm background?

3. **Define neutral grays** (support)
   - Minimum 5 levels: lightest to darkest
   - Test: Is contrast maintained at every level?

### Phase 2: Document Transparency Strategy

1. Create a "transparency scale" showing 5-7 key opacity levels
2. Assign each level to specific component types
3. Document exceptions and special cases
4. Include performance guidelines for your target platforms

### Phase 3: Build Gradient Library

1. Document 3-5 foundational gradient combinations
2. Create templates for new gradients following the same rules
3. Test on actual hardware (not just designer mockups)
4. Archive approved gradients in your design system

### Phase 4: Accessibility Testing

1. Run all color combinations through contrast checkers
2. Test designs with colorblindness simulators (Coblis, Color Oracle)
3. Verify transparency renders correctly on target devices
4. Conduct user testing with accessibility-focused participants

### Phase 5: Documentation & Handoff

1. Create component library showcasing all guidelines
2. Provide code snippets for developers (CSS, React, etc.)
3. Include do's and don'ts with visual examples
4. Build living documentation that evolves with design iterations

---

## Part 6: Design Principles Summary

### The Modern Minimalist Approach

This rubric is built on the understanding that **contemporary UI design achieves sophistication through restraint**:

- **Transparency replaces borders** → Cleaner, lighter interfaces
- **Strategic color replaces visual complexity** → Information clarity
- **Subtle gradients replace flat design** → Depth without heaviness
- **Spacing replaces ornamentation** → Breathing room and focus

### Consistency Across Elevate

Every design decision should return to these core values:

1. **Purposefulness**: Every transparency, color, and gradient serves a function
2. **Accessibility**: No design choice compromises legibility or inclusivity
3. **Restraint**: Less is more; let the content speak
4. **Coherence**: Design choices create a unified, predictable system
5. **Adaptability**: Guidelines work across devices, themes, and use cases

---

## Appendix: Quick Reference

### Transparency Cheat Sheet
- Content backgrounds: 100%
- Secondary cards: 90-95%
- Interactive elements: 100%
- Hover feedback: 95%

### Color Temperature
- Warm = content, approachability, primary information
- Cool = interaction, trust, secondary controls
- Neutral = support, disabled states, dividers

### Gradient Rules
- Max 2 color stops
- 20-40% opacity overlays
- Vertical primary direction
- Minimum 200px transition distance

### Accessibility Checklist
- [ ] Text contrast minimum 4.5:1
- [ ] Interactive elements 3:1 minimum
- [ ] Tested with colorblindness simulator
- [ ] Works on light and dark themes
- [ ] No color-only differentiation

---

**Version**: 2.0  
**Last Updated**: March 2026  
**Status**: Active

---

## EPI-QUOTIENT

### Product Context

**Domain:** www.epiquotient.com  
**Theme:** Full dark theme — immersive data visualization  
**Rendering:** HTML5 Canvas 2D + inline `style` objects (no Tailwind, no SVG/D3)  
**Fonts:** [Sora](https://fonts.google.com/specimen/Sora) (body) + [Space Mono](https://fonts.google.com/specimen/Space+Mono) (data/monospace)

EPI Quotient is a standalone visualization product with a design language intentionally distinct from the warm Elevate platform. It uses a deep navy-to-teal dark theme with bioluminescent color coding to evoke a scientific instrument aesthetic — particles, waves, and data fields rendered in a dark ocean of information.

---

### EQ-1. Theme System (THEME Object)

All EPI Quotient components consume a shared `THEME` constant (`components/epiquotient/sections/primitives.tsx`). No Tailwind utility classes — every style is applied via inline `style` objects for pixel-perfect dark-theme control.

#### Background Layers

| Token | Hex | Usage |
|-------|-----|-------|
| `bg.deep` | `#07121D` | Layout shell, viewport background, deepest layer |
| `bg.page` | `#0A1620` | Page-level content background |
| `bg.sidebar` | `#0E1E2D` | Sidebar, table backgrounds |
| `bg.card` | `#162737` | Card surfaces, section cards, elevated content |
| `bg.table` | `#0E1E2D` | Table row backgrounds (matches sidebar) |

**Hierarchy rule:** Each layer is visually distinguishable against its parent without borders — depth is communicated through luminance progression alone: `deep` (darkest) → `page` → `sidebar/table` → `card` (lightest).

#### Border Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `border.subtle` | `rgba(47,230,222,0.06)` | Table cell dividers, faintest separators |
| `border.light` | `rgba(47,230,222,0.08)` | Card edges, section dividers |
| `border.medium` | `rgba(47,230,222,0.12)` | Active card borders, sidebar group dividers |
| `border.accent` | `rgba(47,230,222,0.25)` | Focused/active element borders, pill switcher border |

**Border rule:** All borders derive from the accent teal (`47,230,222`) at varying alpha. No solid-color borders. The eye perceives structure without hard lines.

#### Text Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `text.primary` | `#C8E0EE` | Primary headings, names, labels |
| `text.secondary` | `#7AB5CC` | Subheadings, secondary info, lens labels |
| `text.muted` | `#4A7090` | Inactive pills, hint text, tertiary labels |
| `text.dim` | `#3A5A72` | Placeholder values, disabled states, empty data dashes |

**Text hierarchy rule:** Four levels of text luminance. Primary for content the user needs to read. Secondary for context. Muted for navigation chrome. Dim for absent/null data indicators. Never use opacity on text — always explicit color tokens.

#### Accent

| Token | Hex | Usage |
|-------|-----|-------|
| `accent` | `#2FE6DE` | Logo, active pills, active dots, teal highlights, score gradient bright stop |

---

### EQ-2. Color Palette

#### Pillar Colors

The three EQ/PQ/IQ pillars each have a dedicated hue that persists across all views and components:

| Pillar | Hex | Role |
|--------|-----|------|
| EQ (Emotional Quotient) | `#2FE6DE` | Teal — ring gauge, radar fill, drilldown bars, attribute highlights |
| PQ (Professional Quotient) | `#18F2B2` | Green — ring gauge, radar fill, drilldown bars |
| IQ (Intellectual Quotient) | `#7BC8F8` | Blue — ring gauge, radar fill, drilldown bars |

**Rule:** Pillar colors are never used for non-pillar purposes. If something is teal, it means EQ. Green means PQ. Blue means IQ. This semantic binding must be preserved everywhere.

#### Functional Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Selection green | `#3CF332` | Selected particle glow, active filter pill borders, gradient bar highlight |
| Faculty series | `#2FE6DE` | Faculty data in radar/comparison/trends (matches EQ teal — shared by convention) |
| Self series | `#6366F1` | Self-assessment data in radar/comparison/trends (indigo) |
| Warning / Concerning | `#F0A060` | Concerning grade label, ITE section accent, moderate-risk badges |
| Danger / High Risk | `#F06060` | Serious deficit grade label, high-risk archetype badges |

#### Risk Badge Colors

| Risk Level | Background | Text | Border |
|------------|-----------|------|--------|
| Low | `rgba(24,242,178,0.12)` | `#18F2B2` | `rgba(24,242,178,0.3)` |
| Moderate | `rgba(240,160,96,0.12)` | `#F0A060` | `rgba(240,160,96,0.3)` |
| High | `rgba(240,96,96,0.12)` | `#F06060` | `rgba(240,96,96,0.3)` |

**Pattern:** Risk badges use `12%` alpha background + full-color text + `30%` alpha border. The text color is always readable against the badge background without additional contrast adjustment.

#### Score-to-Color Gradient (Particle Coloring)

A 7-stop piecewise RGB interpolation maps the 0–100 composite score to particle color:

| Score | Hex (approx) | Visual Description |
|-------|--------------|-------------------|
| 0 | `#0C1932` | Near-black navy — virtually invisible against background |
| 35 | `#103C52` | Dark teal — barely distinguishable |
| 55 | `#126E78` | Mid teal — emerging from background |
| 70 | `#1EA5AA` | Teal — clearly visible, average range |
| 83 | `#2FDCD2` | Bright teal — high performers stand out |
| 95 | `#18F2B2` | Bright green — exceptional, bioluminescent |
| 100 | `#3CFFC8` | Vivid mint — peak performance, maximum luminance |

**Design intent:** Low scores naturally recede into the dark background. High scores glow. The eye is drawn to strong performers without any labels — the color alone communicates. This is the core visual metaphor of EPI Quotient.

#### Grade Labels & Colors

| Threshold | Label | Color |
|-----------|-------|-------|
| ≥ 88 | Exemplary | `#18F2B2` (green) |
| ≥ 74 | Strong | `#2FE6DE` (teal) |
| ≥ 60 | Acceptable | `#7BC8F8` (blue) |
| ≥ 46 | Concerning | `#F0A060` (amber) |
| < 46 | Serious Deficit | `#F06060` (red) |

#### Wave Line Colors

Each training-level wave has a distinct RGBA color at low alpha so the sine curve is visible but doesn't compete with particle colors:

| Wave | Training Level | Color |
|------|---------------|-------|
| 0 (top) | Graduate | `rgba(18,80,100,0.28)` |
| 1 | PGY 3 | `rgba(22,130,140,0.26)` |
| 2 | PGY 2 | `rgba(34,180,170,0.24)` |
| 3 | PGY 1 | `rgba(47,220,210,0.22)` |
| 4 | MS4 | `rgba(24,242,178,0.20)` |
| 5 (bottom) | MS3 | `rgba(30,200,160,0.22)` |

**Progression:** Top waves (senior) are slightly more opaque and cooler; bottom waves (junior) are lighter and greener. This creates a subtle atmospheric perspective.

---

### EQ-3. Typography

| Element | Font | Weight | Size | Tracking |
|---------|------|--------|------|----------|
| Logo "EPI Quotient" | Sora | 600 | 22px (14px ≤480px) | Normal |
| Subtitle "Performance Fingerprint" | Space Mono | 400 | 10px | Normal |
| Scope pill labels | Sora | 400/500 | 12px | Normal |
| Sort mode links | Space Mono | 400 | 10px | Normal |
| Stat values (HUD, cards) | Space Mono | 700 | 18px | Normal |
| Stat labels | Space Mono | 400 | 9px | Uppercase |
| Wave curve labels | Sora | 500 | 9px | Normal |
| Filter pills | Space Mono | 400 | 10px | Normal |
| Tooltip name | Sora | 500 | 13px | Normal |
| Panel profile name | Sora | 600 | 20px | Normal |
| Section card title | Sora | 500 | 14px | Normal |
| Section card subtitle | Sora | 300 | 11px | Normal |
| Body text | Sora | 300–400 | 11–13px | Normal |
| Table data cells | Space Mono | 400–600 | 11–12px | Normal |
| Composite score (large) | Space Mono | 700 | 28px+ | Normal |

**Font pairing rule:** Sora for all human-readable text (names, labels, descriptions). Space Mono for all numerical/data content (scores, counts, stats, table cells). Never mix — if a string is a number or score, it must be Space Mono.

**Loading:** Both fonts imported via Google Fonts. Sora at weights 300, 400, 500, 600. Space Mono at weights 400, 700.

---

### EQ-4. Transparency & Glassmorphism

EPI Quotient uses transparency differently from the warm Elevate theme — here, transparency creates a layered cockpit/instrument feel:

#### Frosted Glass Surfaces

| Surface | Background | Blur | Usage |
|---------|-----------|------|-------|
| Scope pill switcher | `rgba(10, 24, 38, 0.85)` | `blur(12px)` | Top-center navigation pill |
| Side panel | `rgba(10, 24, 38, 0.96)` | `blur(12px)` | Profile detail slide-in panel |
| Tooltip | `rgba(10, 24, 38, 0.96)` | none | Hover tooltip on particles |

**Rule:** Only two levels of frosted glass: `0.85` for floating navigation (needs to feel like a HUD overlay) and `0.96` for content panels (nearly opaque but with subtle page bleed-through). Blur is always `12px` when applied.

#### Particle Ghost States

| State | Alpha | Usage |
|-------|-------|-------|
| Normal particle | 1.0 | Default visible state |
| Filtered-out particle | 0.05 | Ghosted — still visible as faint trace but non-interactive |
| Selected particle glow | Multiple rings at decreasing alpha | Concentric green aura (#3CF332) |

**Design intent:** Filtered-out particles don't disappear — they remain as spectral traces so the user maintains spatial context of the full cohort. This is critical: the visualization's power comes from seeing all 270 at once, even when filtering.

---

### EQ-5. Spacing & Layout

#### Z-Index Stack

| z-index | Element |
|---------|---------|
| 60 | Scope pill switcher (topmost interactive) |
| 50 | Side panel, tooltip |
| 40 | Filter pills, gradient bar |
| 30 | Sort row, HUD stats |
| 20 | Dot navigation |
| 10 | Wave labels, hint text |
| 0 | Canvas (particle field) |

**Rule:** The canvas is always the base layer. HUD elements float above via z-index. No element below the pill switcher (z-60) should ever occlude it.

#### Panel Widths

| Panel | Desktop | ≤1024px | ≤768px |
|-------|---------|---------|--------|
| Side panel | 380px | 340px | Full-screen overlay |
| Drill-down panel | 340px | 340px | Full-screen overlay |
| Individual sidebar | 260px | 260px | Hidden (sheet) |

#### Canvas Sizing

- Full viewport: `100vw × 100vh`
- Scroll-snap sections: `100vw × 100vh` each
- Gradient bar: 200px × 8px desktop, 130px × 6px mobile
- Dot nav: 10px dots, 14px vertical gap

---

### EQ-6. Motion & Animation

#### Transitions

| Transition | Duration | Easing | Description |
|------------|----------|--------|-------------|
| Landing ↔ Program/Class | 0.7s | linear | Cross-dissolve (opacity 0→1 / 1→0) |
| Landing ↔ Individual | 1.5s | ease-in-out | 3D rotateY ±85° with `perspective(1200px)` |
| Tooltip appear | 0.15s | ease | `opacity(0→1)` + `translateY(4px→0)` |
| Touch mini-sheet | 0.2s | ease | `translateY(20px→0)` + `opacity(0→1)` |
| Pillar card progress bar | 0.8s | `cubic-bezier(0.16,1,0.3,1)` | Width animation on mount |
| Particle sort swarm | per-frame | spring | `p.x += (target - p.x) * (0.035 + jitter)` |
| Radar timeline lerp | 250ms | RAF | Catmull-Rom interpolation between period frames |
| Radar auto-play interval | 1.2s | — | Time between auto-advancing radar timeline periods |
| Loading dots blink | 0.6s cycle | ease | 3 dots with 0.2s stagger, `opacity: 0.2 ↔ 1` |
| Page mount fade | 0.15s | ease | Entire page `opacity: 0→1` on data load |

#### Particle Animation

- Waves animate continuously via `requestAnimationFrame`
- Each wave has independent `frequency`, `speed`, and `phase`
- Particles drift to sort positions via staggered spring interpolation (organic swarm)
- Data-driven amplitudes and Y-offsets transition via per-frame `lerp` — never snap
- No CSS transitions on the canvas — all animation is imperative via the render loop

**Performance:** 270 particles rendered at 60fps on Canvas 2D. DPR-aware (`window.devicePixelRatio`). No offscreen canvas or Web Workers — single RAF loop handles all drawing.

---

### EQ-7. Interactive States

#### Pill Switcher

| State | Background | Text | Border |
|-------|-----------|------|--------|
| Inactive | transparent | `#4A7090` (muted) | none |
| Hover | `rgba(47,230,222,0.06)` | `#7AB5CC` (secondary) | none |
| Active | `rgba(47,230,222,0.12)` | `#2FE6DE` (accent) | none |

#### Filter Pills (Role / Score Band)

| State | Background | Text | Border |
|-------|-----------|------|--------|
| Inactive | transparent | `#4A7090` | `rgba(47,230,222,0.12)` |
| Active | `rgba(47,230,222,0.08)` | `#2FE6DE` | `rgba(47,230,222,0.25)` |
| Selected profile match | — | — | `1px solid #3CF332` + green shadow |

#### Section Cards

| State | Visual |
|-------|--------|
| Collapsed | Left accent bar (4px, pillar/section color) + title + chevron down |
| Expanded | Full content revealed + chevron up |
| Hover | Subtle background lightening (card bg → slightly brighter) |

#### Score Data

| State | Visual |
|-------|--------|
| Present | Score value in `scoreColor(value)` text on `scoreBg(value, 0.12)` background |
| Absent | "—" dash in `text.dim` color |

---

### EQ-8. Responsive Design

#### Breakpoints

| Breakpoint | Changes |
|------------|---------|
| **≤ 1024px** | Section padding `90px 32px 40px`; side panel 340px; reduced spacing |
| **≤ 768px** | Stacked header; pill switcher `top: 76px`; sort row `top: 114px`; full-screen panel overlay; dot nav 12px; +60px wave y-offset; hint text hidden; legend centered above filters |
| **≤ 480px** | Compact gradient bar `130px × 6px`; pill at `top: 68px`; sort at `top: 104px`; logo 14px; hover tooltip hidden; dot nav labels hidden |

#### Touch Adaptations (`@media (hover: none)`)

- Hover tooltip → replaced by bottom mini-sheet (36px hit area)
- Gradient segment tooltip → hidden
- Hint text → hidden
- Pillar card hover transform → disabled
- All bottom elements → `safe-area-inset-bottom` padding

---

### EQ-9. Rendering Approach

EPI Quotient deliberately does **not** use:
- Tailwind CSS (inline styles via THEME for dark-theme precision)
- SVG charts (Canvas 2D for particle performance)
- D3.js or Recharts (all drawing is hand-rolled for full control)
- CSS animations on the canvas (imperative RAF loop)

**Rationale:** The particle field requires per-frame control over 270+ animated elements. Canvas 2D provides the necessary performance ceiling. Inline styles prevent Tailwind specificity conflicts in the deep component tree. The THEME object ensures every component references the same design tokens.

#### Canvas Conventions

- All canvas elements are DPR-aware: `canvas.width = w * dpr; ctx.scale(dpr, dpr)`
- ResizeObserver for responsive redrawing on container changes
- Quadratic bezier curves for sparklines (smooth, not angular)
- Catmull-Rom splines for radar polygon smoothing

---

### EQ-10. Design Principles

1. **Dark-first, luminance-coded.** Information value is encoded in brightness. High scores glow; low scores recede. The eye finds what matters without labels.

2. **Scientific instrument aesthetic.** The interface should feel like a sophisticated analytical tool — not a dashboard. Frosted glass HUD elements float over a living data field.

3. **Semantic color binding.** Teal = EQ, Green = PQ, Blue = IQ. This mapping is absolute and never violated. Users learn it once and rely on it everywhere.

4. **Canvas over DOM.** The particle field is the product. It occupies the full viewport and is never occluded by overlapping DOM elements (side panels slide in; they don't cover the field).

5. **Ghost, don't hide.** Filtered-out particles fade to 5% alpha rather than disappearing. The user always sees the full cohort shape. Context is never lost.

6. **Motion as metaphor.** Particle swarm drift during sort transitions, wave amplitude driven by score variance, timeline lerp on radar — motion communicates data relationships, not decoration.

7. **Monospace for data, humanist for names.** Space Mono for every number. Sora for every word. This split reinforces the analytical vs. personal dimensions of the visualization.

8. **Progressive disclosure.** Landing → hover tooltip → side panel → drill-down → Individual view → 13 sections. Each click reveals deeper data without overwhelming the initial experience.
