# Changelog

All notable deployments and changes to this project.

---

## Latest

<!-- Cursor: Always add new entries directly below this line -->

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
