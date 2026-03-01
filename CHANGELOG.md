# Changelog

All notable deployments and changes to this project.

---

## Latest

<!-- Cursor: Always add new entries directly below this line -->

## 2026-02-17

### Added
- **Multi-resident survey flow** — Core Faculty and Teaching Faculty now share a unified evaluation UI with welcome screen, dot/pill stepper, sticky header & footer with resident class info (PGY-X | Class of YYYY), and a "Review All" summary page with expandable attribute breakdowns per resident
- **Score heatmap circles** — Summary page shows each resident's average score (0–100) with red-to-green gradient instead of a plain index number
- **Summary sort modes** — A-Z, Z-A, by score (high→low), and original survey order on the Review All page
- **Smart submit button** — Greyed-out "Submitted" when no changes; active "Update Your Submission" when scores are modified after initial submission
- **Teaching Faculty welcome screen** — Intro screen before choosing which residents to evaluate
- **Select All / Deselect All** buttons on the Recipients tab of the survey detail page
- **Login button** on the EQ·PQ·IQ landing page header (top-right, next to Contact Us)
- **Campaign Wizard redesign** — Single-page form: select class, period (radio buttons: Orientation / Fall / Spring / Custom), survey type checkboxes (Self-Assessment, Core Faculty Eval, Teaching Faculty Eval), form settings, and deadline. Creates surveys as **draft** only; deploy from the surveys list page
- Database migration: `20260221000001_faculty_type_and_site.sql` — adds `faculty_type` and `site` columns to `faculty` table
- Database migration: `20260222000001_unique_form_submission_resident.sql` — unique constraint on `(form_submission_id, resident_id)` in `structured_ratings`

### Changed
- **Email invitations** — Button color changed from blue to green (#40916C); expanded "EQ, PQ, IQ" to full names; added recommendation and thank-you text per rater type
- **Campaign Wizard** no longer deploys surveys — it only creates drafts; distribution happens from the survey detail page
- Removed old Teaching Faculty roster code; unified under Core Faculty multi-resident UI
- Progress text updated to "Resident X of Y · Z submitted" in survey header and footer
- Form Settings labels reworded for clarity (e.g., "Respondents must rate every attribute (no skipping)")
- Campaign populate API now reads `faculty_type` from `faculty` table instead of `user_profiles`

### Fixed
- **Password reset on eqpqiq.com** — `redirect_to` URL now dynamically matches the requesting domain (eqpqiq.com, lev8.ai, or localhost)
- **Middleware** — `/update-password` added to eqpqiq allow-list so Supabase recovery redirects reach the reset form instead of the landing page
- **Middleware** — Canonical 308 redirect from `eqpqiq.com` to `www.eqpqiq.com`
- **Middleware** — Auth routes (`/login`, `/register`, `/forgot-password`, `/request-access`) now pass through on eqpqiq.com domain
- Comments textarea no longer obscured by sticky bottom bar (increased padding + `onFocus` scroll)
- Review All page now correctly shows scores only for submitted residents, with "Draft saved (not submitted)" for in-progress items
- Respondent status preserved as `completed` when editing an already-submitted Core/Teaching Faculty evaluation
- Vercel build fixes: removed unused imports (`Calendar`, `ChevronRight`), unused variables, and mismatched component props

---

## 2026-02-14

### Added
- **EQ·PQ·IQ brand landing page** at eqpqiq.com root — philosophy, use cases, AI analytics, archetyping, longitudinal value, individual vs group sections
- New route: `app/eqpqiq-landing/` (layout, client layout, page)
- Middleware rewrite: eqpqiq.com `/` → `/eqpqiq-landing` (URL stays as `/`)
- "Contact Us" header link → mailto:hello@eqpqiq.com
- Google Workspace email: hello@eqpqiq.com

### Removed
- `performance-budget.yml` GitHub Actions workflow (relying on Vercel for builds)

---

## 2026-02-09

### Changed
- **Warning noise cleanup pass:** Reduced ESLint/TypeScript noise in high-traffic files for easier spotting of real issues.
  - **lib/types/modules.ts** – Replaced `Record<string, any>` and `any[]` with `Record<string, unknown>` and `unknown[]`; `SessionMetrics` index signature now `[key: string]: unknown`.
  - **lib/archetypes/evolution-manager.ts** – Added typed helpers (`getResidentFullName`, `getGraduationYear`, `getClassificationArchetypeId`) and types (`VariableCaseRow`, `MethodologyVersionRow`, etc.); removed all `as any` casts.
  - **ConversationInterface.tsx** – Added `V1VignetteData` for v1 fallbacks; `vignette_data as unknown as VignetteV2`; fixed effect/useMemo deps; prefixed unused `user` as `_user`.
  - **ModuleGuard.tsx** – useMemo deps set to `[hasModuleAccess, availableToRoles, userRole]`; removed unnecessary eslint-disable.
  - **app/(dashboard)/truths/scores/page.tsx** – Typed API rows (`ApiResidentRow`, `ApiIteRow`, `ApiExamRow`); typed `getEditValue` and ITE `updateData`.
  - **Compatibility:** `difficult-conversations/[id]/page.tsx` and `CaseInterface.tsx` updated for `Record<string, unknown>` on `vignette_data` / `case_data`.

### Fixed
- Build requires Supabase env at build time: set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_KEY` in `.env.local` (local) and in Vercel project Environment Variables for successful deploy.

---

## 2025-02-08

### Added
- SWOT analysis for Learn and Understand modules

---

## 2025-02-06

### Added
- Multi-tenant RBAC infrastructure
- Class Cohort archetype scatter visualization
- Progress Check session editing
- SWOT analysis for Interview Assessment Tool

### Changed
- Enhanced Interview Rank List with normalization features

### Fixed
- Interview permission check to include session-level roles
- Interview session access for assigned interviewers

---

## 2025-02-04

### Added
- Pulse Check imaging utilization breakdown (CT/U/S/MRI) with department averages
- Pulse Check frequency settings, sparklines, accordion view

### Fixed
- TypeScript type errors
- ESLint technical debt cleanup

---

## 2025-02-02

### Added
- Demo role tiles to Interview landing page with visitor tracking
- eqpqiq.com email support
- Rating colors applied to survey buttons

### Changed
- Updated Interview module favicon, title, footer
- Enhanced interview tool navigation, stats, and normalization features

### Fixed
- Stripe API version compatibility (v20)
- Webhook TypeScript errors

---

## 2025-01-30

### Added
- eqpqiq.com domain support
- Interview questions module
- Coming Soon placeholder pages for Studio content sections
- studio.lev8.ai subdomain launch

### Fixed
- Studio subdomain routing and auth redirect loops

---

## 2025-01-28

### Added
- Multi-tenant architecture
- Studio with 18-month EM curriculum

### Fixed
- TypeScript errors in debrief route
- React hydration error #418 on dashboard
- Running Board API routes to use cookie-based auth
