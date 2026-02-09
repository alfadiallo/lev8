# Lev8 Learn Module

**Comprehensive reference: Clinical Cases, Difficult Conversations, EKG & ACLS, Running the Board**

**Last Updated:** February 2026  
**Status:** Production

---

## Table of Contents

1. [Overview](#overview)
2. [Routes and Navigation](#routes-and-navigation)
3. [Clinical Cases](#clinical-cases)
4. [Difficult Conversations](#difficult-conversations)
5. [EKG & ACLS](#ekg--acls)
6. [Running the Board](#running-the-board)
7. [API Reference](#api-reference)
8. [Database Schema](#database-schema)
9. [Component Map](#component-map)
10. [Difficult Conversations Deep Dive](#difficult-conversations-deep-dive)
11. [Running the Board Flow](#running-the-board-flow)
12. [Content Creation and Seeding](#content-creation-and-seeding)
13. [Known Limitations and TODOs](#known-limitations-and-todos)
14. [Related Documentation](#related-documentation)

---

## Overview

The Learn module provides interactive clinical learning for residents and faculty: case-based practice, AI-driven difficult-conversation simulations, EKG/ACLS scenarios, and multi-patient ED board simulation. All submodules are available to residents, faculty, program directors, and related roles.

**Access control:** Wrapped in `ModuleGuard` with `availableToRoles`: `resident`, `faculty`, `program_director`, `assistant_program_director`, `clerkship_director`, `super_admin`, `admin`. Entry points are the dashboard and sidebar; the hub is at `/modules/learn` and renders four tiles (Clinical Cases, Difficult Conversations, EKG & ACLS, Running the Board). Educators can create content via APIs and, where applicable, Studio.

**Submodule summary:**

- **Clinical Cases** — Browse and work through clinical scenarios with patient presentation, questions, and progress tracking. Attempts and scores are stored per user.
- **Difficult Conversations** — Practice challenging patient/family conversations with AI (Claude or Gemini). Vignettes support v1 (context + avatar) or v2 (phase-based engine with emotional state and assessment).
- **EKG & ACLS** — List and run ACLS scenarios with EKG interpretation; session state is saved.
- **Running the Board** — Multi-patient ED simulation: educator selects learner and preset or custom cases, runs a timed session with checklist actions, then debrief with optional auto-generated summary and leaderboard.

---

## Routes and Navigation

| Route | Description |
|-------|--------------|
| `/modules/learn` | Hub page with four module tiles |
| `/modules/learn/clinical-cases` | Clinical cases list |
| `/modules/learn/clinical-cases/[id]` | Single case play-through |
| `/modules/learn/difficult-conversations` | Vignette list by category |
| `/modules/learn/difficult-conversations/[id]` | Single vignette conversation |
| `/modules/learn/ekg-acls` | ACLS scenario list |
| `/modules/learn/ekg-acls/[scenarioId]` | Single ACLS scenario |
| `/modules/learn/running-board` | Setup: learner, educator, preset/cases |
| `/modules/learn/running-board/simulation/[sessionId]` | Active simulation |
| `/modules/learn/running-board/simulation/[sessionId]/debrief` | Post-session debrief |

**Tenant routes:** Under `[org]/[dept]/modules/learn/` the same paths are used with `buildUrl()` (e.g. tenant dashboard links to `buildUrl('/modules/learn')`).

**Page files:**

- Hub: `app/(dashboard)/modules/learn/page.tsx`
- Clinical cases: `app/(dashboard)/modules/learn/clinical-cases/page.tsx`, `app/(dashboard)/modules/learn/clinical-cases/[id]/page.tsx`
- Difficult conversations: `app/(dashboard)/modules/learn/difficult-conversations/page.tsx`, `app/(dashboard)/modules/learn/difficult-conversations/[id]/page.tsx`
- EKG & ACLS: `app/(dashboard)/modules/learn/ekg-acls/page.tsx`, `app/(dashboard)/modules/learn/ekg-acls/[scenarioId]/page.tsx`
- Running board: `app/(dashboard)/modules/learn/running-board/page.tsx`, `app/(dashboard)/modules/learn/running-board/simulation/[sessionId]/page.tsx`, `app/(dashboard)/modules/learn/running-board/simulation/[sessionId]/debrief/page.tsx`

---

## Clinical Cases

**Purpose and flow:** Residents (and other roles) browse active clinical cases, filter by difficulty, and open a case to work through presentation and questions. Progress and completion are stored as attempts; educators can create cases via API.

**Pages and components:** List page uses `CaseCard`; case detail page uses `CaseInterface` for the interactive case (presentation, questions, answers). Layout uses `ModuleLayout` and `ModuleGuard`.

**API endpoints:**

- `GET /api/clinical-cases` — List active cases
- `POST /api/clinical-cases` — Create case (educators)
- `GET /api/clinical-cases/[id]` — Case details
- `PUT /api/clinical-cases/[id]` — Update case (educators)
- `DELETE /api/clinical-cases/[id]` — Delete case (educators)
- `GET /api/clinical-cases/[id]/attempts` — Current user’s attempts for the case
- `POST /api/clinical-cases/[id]/attempts` — Create or update attempt (progress, score, completed)

**Database:** `clinical_cases` (institution_id, title, description, difficulty, specialty, estimated_duration_minutes, case_data JSONB, is_public, is_active); `case_attempts` (case_id, user_id, progress_data, score, completed, started_at, completed_at). RLS is institution- and role-aware.

**Types:** `ClinicalCase`, `CaseAttempt`, `Difficulty` in `lib/types/modules.ts`. Case content shape is in `case_data` (e.g. patient, presentation, learning_objectives, questions with id/question/options/answer). `CaseInterface` uses a local `CaseQuestion` shape for the UI.

**Notable behavior:** Scoring in the UI is not fully implemented (see Known Limitations). Attempts are keyed by user and case.

---

## Difficult Conversations

**Purpose and flow:** Users select a vignette by category (or “all”), choose difficulty, and start a conversation with an AI avatar. The backend supports v1 (single context + avatar personality) or v2 (phase-based conversation with emotional state and end-of-session assessment). Sessions can be saved to `training_sessions`.

**Pages and components:** List page uses `VignetteCard` and category filter; conversation page uses `ConversationInterface`, `PhaseIndicator`, `EmotionalStateIndicator`, `BranchingHint`, and `AssessmentResults`. Educators can access content-creation actions via `EducatorActions`.

**API endpoints:**

- `GET /api/vignettes` — List active vignettes (global + institution)
- `POST /api/vignettes` — Create vignette (educators)
- `GET /api/vignettes/[id]` — Vignette by id
- `PUT /api/vignettes/[id]` — Update vignette (educators)
- `DELETE /api/vignettes/[id]` — Delete vignette (educators)
- `POST /api/vignettes/v2/import` — Import a v2 vignette (e.g. from file/Studio)
- `GET /api/conversations/sessions` — Current user’s training sessions
- `POST /api/conversations/sessions` — Create training session
- `POST /api/conversations/chat` — v1 conversation turn (message + history + vignette context + avatar)
- `POST /api/conversations/v2/chat` — v2 conversation turn (vignetteId, message, difficulty, optional sessionState)

**Database:** `vignettes` (institution_id nullable for global, title, description, category, subcategory, difficulty array, vignette_data JSONB, is_active); `training_sessions` (user_id, vignette_id, vignette_title, module_type, difficulty, messages, metrics, session_data, completed, ai_provider, session_duration_seconds); `session_analytics` for post-session metrics. RLS restricts by institution and user.

**Types:** `Vignette`, `isVignetteV2()` in `lib/types/modules.ts`. V2 and conversation types (e.g. `VignetteV2`, `ClinicalScenario`, `ConversationPhase`, `Message`, `AssessmentResult`) in `lib/types/difficult-conversations.ts`.

**Notable behavior:** Front end chooses v1 vs v2 by `isVignetteV2(vignette)` (vignette_data.version === '2.0' or 2). v2 uses ConversationEngine with PhaseManager, EmotionalStateTracker, PromptBuilder, AssessmentEngine; responses are not streamed (see Known Limitations).

---

## EKG & ACLS

**Purpose and flow:** Users list ACLS scenarios and launch one to practice EKG interpretation and ACLS protocols. Session data is stored per user and scenario.

**Pages and components:** List page fetches scenarios and links to `ekg-acls/[scenarioId]`; scenario page uses `ACLSInterface` and `EKGCanvas`.

**API endpoints:**

- `GET /api/acls/scenarios` — List active scenarios
- `POST /api/acls/scenarios` — Create scenario (educators)
- `GET /api/acls/scenarios/[id]` — Scenario details
- `GET /api/acls/sessions` — Current user’s ACLS sessions
- `POST /api/acls/sessions` — Create or update ACLS session

**Database:** `acls_scenarios` (institution_id, title, description, scenario_data JSONB, is_active); `acls_sessions` (user_id, scenario_id, session_data). RLS is institution- and user-scoped.

**Types:** Scenario and session shapes are used in the ACLS UI and API; scenario content lives in `scenario_data`.

**Notable behavior:** Scenarios are institution-scoped; global scenarios can be represented with shared or null institution depending on migration design.

---

## Running the Board

**Purpose and flow:** An educator (faculty or resident) selects a learner and either a preset shift or a custom set of running-board cases, then starts a session. During the simulation, the learner sees a board with patients, timers, and checklist actions; the educator can track and facilitate. When the session ends, a debrief page shows an optional auto-generated summary and allows saving. A leaderboard shows top users by sessions completed and/or time.

**Pages and components:** Setup page uses selection for learners, educators (resident/faculty/custom), presets, and custom cases, plus `Leaderboard`. Simulation page uses `BoardView`, `SimulationGrid`, `PatientCard`, `TimerControls`. Debrief page loads session and debrief data and supports save.

**API endpoints:**

- `GET /api/running-board/learners` — Residents available as learners
- `GET /api/running-board/educators` — Residents + faculty as educators
- `GET /api/running-board/presets` — Preset shift configurations
- `GET /api/running-board/cases` — Clinical cases for the board
- `GET /api/running-board/configs` — Board configs (educators: list/create)
- `POST /api/running-board/configs` — Create config (educators)
- `GET /api/running-board/sessions` — List sessions (with filters)
- `POST /api/running-board/sessions` — Create session
- `GET /api/running-board/sessions/[id]` — Session details (cases, actions)
- `PATCH /api/running-board/sessions/[id]` — Update session (e.g. status)
- `GET /api/running-board/sessions/[id]/actions` — Actions for session
- `POST /api/running-board/sessions/[id]/actions` — Record checkbox action
- `GET /api/running-board/sessions/[id]/debrief` — Debrief (with auto summary)
- `POST /api/running-board/sessions/[id]/debrief` — Save debrief
- `GET /api/running-board/leaderboard` — Top users (e.g. by sessions, time)

**Database:** `running_board_cases` (institution_id, title, category, acuity_level, tags, patient_profile, timeline, debrief_points, is_global, is_active); `running_board_presets` (institution_id, name, description, case_ids, difficulty, is_global, is_active); `running_board_sessions` (institution_id, facilitator_id, learner_id, learner_pgy_level, educator_id, educator_type, educator_name, preset_id, status, started_at, ended_at, total_duration_seconds, etc.); `running_board_session_cases` (session_id, case_id, column_position); `running_board_actions` (session_id, case_id, checklist_item_id, phase_id, is_critical, checked, checked_at, elapsed_time_seconds); `running_board_debriefs` (session_id, total_actions, completed_actions, critical_actions_total, critical_actions_missed, summary, etc.). RLS policies restrict by institution and facilitator/learner as applicable. See `supabase/migrations/20250202000001_running_board.sql` and `20250221000001_running_board_educator.sql`.

**Types:** `ClinicalCase`, `PresetShift`, `Learner`, `Educator`, acuity/category helpers in `lib/types/running-board.ts`. Session and debrief shapes align with API responses.

**Notable behavior:** Educator can be a resident, faculty, or custom name. Sessions move through statuses (e.g. setup → in_progress → completed). Debrief can be auto-generated and then saved.

---

## API Reference

Consolidated list of Learn-related API routes.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/clinical-cases` | List clinical cases |
| POST | `/api/clinical-cases` | Create clinical case (educators) |
| GET | `/api/clinical-cases/[id]` | Get case |
| PUT | `/api/clinical-cases/[id]` | Update case (educators) |
| DELETE | `/api/clinical-cases/[id]` | Delete case (educators) |
| GET | `/api/clinical-cases/[id]/attempts` | Get user attempts for case |
| POST | `/api/clinical-cases/[id]/attempts` | Create/update attempt |
| GET | `/api/vignettes` | List vignettes |
| POST | `/api/vignettes` | Create vignette (educators) |
| GET | `/api/vignettes/[id]` | Get vignette |
| PUT | `/api/vignettes/[id]` | Update vignette (educators) |
| DELETE | `/api/vignettes/[id]` | Delete vignette (educators) |
| POST | `/api/vignettes/v2/import` | Import v2 vignette |
| GET | `/api/conversations/sessions` | List training sessions |
| POST | `/api/conversations/sessions` | Create training session |
| POST | `/api/conversations/chat` | v1 conversation turn |
| POST | `/api/conversations/v2/chat` | v2 conversation turn |
| GET | `/api/acls/scenarios` | List ACLS scenarios |
| POST | `/api/acls/scenarios` | Create scenario (educators) |
| GET | `/api/acls/scenarios/[id]` | Get scenario |
| GET | `/api/acls/sessions` | List ACLS sessions |
| POST | `/api/acls/sessions` | Create/update ACLS session |
| GET | `/api/running-board/learners` | List learners |
| GET | `/api/running-board/educators` | List educators |
| GET | `/api/running-board/presets` | List presets |
| GET | `/api/running-board/cases` | List running-board cases |
| GET | `/api/running-board/configs` | List configs |
| POST | `/api/running-board/configs` | Create config (educators) |
| GET | `/api/running-board/sessions` | List sessions |
| POST | `/api/running-board/sessions` | Create session |
| GET | `/api/running-board/sessions/[id]` | Get session |
| PATCH | `/api/running-board/sessions/[id]` | Update session |
| GET | `/api/running-board/sessions/[id]/actions` | Get session actions |
| POST | `/api/running-board/sessions/[id]/actions` | Record action |
| GET | `/api/running-board/sessions/[id]/debrief` | Get debrief |
| POST | `/api/running-board/sessions/[id]/debrief` | Save debrief |
| GET | `/api/running-board/leaderboard` | Leaderboard |

---

## Database Schema

Learn-specific tables (concise). RLS is enabled on all; access is institution- and/or user-scoped as noted.

| Table | Key columns | Notes |
|------|-------------|--------|
| `clinical_cases` | id, institution_id, title, description, difficulty, specialty, estimated_duration_minutes, case_data (JSONB), is_public, is_active, created_at, updated_at | Institution-scoped |
| `case_attempts` | id, case_id, user_id, progress_data (JSONB), score, completed, started_at, completed_at | User + case |
| `vignettes` | id, institution_id (nullable), title, description, category, subcategory, difficulty[], vignette_data (JSONB), is_active | Global when institution_id IS NULL |
| `training_sessions` | id, user_id, vignette_id, vignette_title, module_type (vignette \| clinical_case \| acls \| running_board), difficulty, messages (JSONB), metrics (JSONB), session_data (JSONB), completed, ai_provider, session_duration_seconds | User-scoped |
| `session_analytics` | id, session_id, empathy_score, clarity_score, de_escalation_score, total_messages, user_messages, avatar_messages, escalation_triggers_hit, keywords_matched, personality_alignment_score, emotional_tone, module_specific_metrics (JSONB) | Per training session |
| `acls_scenarios` | id, institution_id, title, description, scenario_data (JSONB), is_active | Institution-scoped |
| `acls_sessions` | id, user_id, scenario_id, session_data (JSONB) | User-scoped |
| `running_board_cases` | id, institution_id, title, category, acuity_level, tags, patient_profile (JSONB), timeline (JSONB), debrief_points, is_global, is_active | Institution or global |
| `running_board_presets` | id, institution_id, name, description, case_ids (UUID[]), difficulty, is_global, is_active | Institution or global |
| `running_board_sessions` | id, institution_id, facilitator_id, learner_id, learner_pgy_level, educator_id, educator_type, educator_name, preset_id, status, started_at, ended_at, total_duration_seconds, final_phase_reached, dark_mode_used | Facilitator/learner access |
| `running_board_session_cases` | id, session_id, case_id, column_position | Join session ↔ cases |
| `running_board_actions` | id, session_id, case_id, checklist_item_id, phase_id, is_critical, checked, checked_at, unchecked_at, elapsed_time_seconds | Checklist state |
| `running_board_debriefs` | id, session_id (unique), total_actions, completed_actions, critical_actions_total, critical_actions_missed, summary (JSONB/text), etc. | One per session |

---

## Component Map

**Shared (all Learn submodules):**

- `components/modules/ModuleLayout.tsx` — Layout wrapper (title, description, back link)
- `components/modules/ModuleGuard.tsx` — Role-based access wrapper
- `components/modules/EducatorActions.tsx` — Educator content-creation links (e.g. Studio)

**Clinical cases:**

- `components/modules/clinical-cases/CaseCard.tsx` — Case card on list
- `components/modules/clinical-cases/CaseInterface.tsx` — Case play-through UI (presentation, questions, answers)

**Difficult conversations:**

- `components/modules/difficult-conversations/VignetteCard.tsx` — Vignette card on list
- `components/modules/difficult-conversations/ConversationInterface.tsx` — Chat UI, calls v1 or v2 chat API
- `components/modules/difficult-conversations/AssessmentResults.tsx` — End-of-session assessment
- `components/modules/difficult-conversations/PhaseIndicator.tsx` — Current phase
- `components/modules/difficult-conversations/EmotionalStateIndicator.tsx` — Avatar emotional state
- `components/modules/difficult-conversations/BranchingHint.tsx` — Branching hints

**EKG & ACLS:**

- `components/modules/ekg-acls/ACLSInterface.tsx` — Scenario UI
- `components/modules/ekg-acls/EKGCanvas.tsx` — EKG display

**Running board:**

- `components/modules/running-board/Leaderboard.tsx` — Top users
- `components/modules/running-board/BoardView.tsx` — Board container
- `components/modules/running-board/SimulationGrid.tsx` — Grid of patients/columns
- `components/modules/running-board/PatientCard.tsx` — Single patient card
- `components/modules/running-board/TimerControls.tsx` — Timer UI

---

## Difficult Conversations Deep Dive

**V1 vs V2:** v1 uses a single system prompt built from vignette context and avatar personality; the client sends `message`, `conversationHistory`, `vignetteContext`, `avatarPersonality`, and `difficulty` to `POST /api/conversations/chat`. The route uses `lib/modules/conversationAI.ts` (or equivalent) and Claude (Haiku/Sonnet by difficulty). v2 uses the phase-based engine in `lib/conversations/v2/`: `ConversationEngine` orchestrates `PhaseManager`, `EmotionalStateTracker`, `PromptBuilder`, and `AssessmentEngine`. The client sends `vignetteId`, `message`, `difficulty`, and optional `sessionState` to `POST /api/conversations/v2/chat`. The front end chooses v1 vs v2 via `isVignetteV2(vignette)` (vignette_data.version === '2.0' or 2).

**V2 flow:** Load vignette from DB → validate v2 → build `VignetteV2` from vignette_data → instantiate ConversationEngine with Claude or Gemini provider → process user message (phase transitions, emotional state, pattern matching) → return assistant message and updated session state; at end, assessment can be run and returned. No streaming (responses are full-turn).

**Vignette data:** Types in `lib/types/difficult-conversations.ts`: e.g. `ClinicalScenario`, `PatientDemographics`, `VitalSigns`, `ClinicalEvents`, `AvatarProfile`, `VignetteV2`, `ConversationPhase`, `PhaseState`, `Message`, `AssessmentResult`, `Difficulty`, `AIModel`. Vignette content (clinical scenario, avatar, conversation design) lives in `vignette_data` and optionally in educator guide/index structures.

**Categories (Difficult Conversations list page):** medical-error-disclosure, serious-diagnosis-delivery, treatment-refusal-withdrawal, end-of-life-care, informed-consent-capacity, inter-collegial-issues, quality-of-care-concerns, unexpected-outcome-discussion. Display names and descriptions are in `CONVERSATION_CATEGORIES` in `app/(dashboard)/modules/learn/difficult-conversations/page.tsx`.

---

## Running the Board Flow

1. **Setup:** Educator opens `/modules/learn/running-board`, selects learner (resident), educator (resident/faculty or custom name), then either a preset or custom case list. On start, front end calls `POST /api/running-board/sessions` with learner_id, educator info, preset_id or case list; backend creates session and session_cases, then redirects to simulation.
2. **Simulation:** User is on `/modules/learn/running-board/simulation/[sessionId]`. Timer runs; patient cards show per case; checklist actions are recorded via `POST /api/running-board/sessions/[id]/actions`. Session status is updated with `PATCH /api/running-board/sessions/[id]` (e.g. in_progress → completed).
3. **Debrief:** User navigates to `/modules/learn/running-board/simulation/[sessionId]/debrief`. Page loads session and `GET /api/running-board/sessions/[id]/debrief` (which can return or generate summary). User can save with `POST /api/running-board/sessions/[id]/debrief`.
4. **Leaderboard:** `Leaderboard` component calls `GET /api/running-board/leaderboard?limit=10` and displays top users by sessions completed and/or time.

---

## Content Creation and Seeding

- **Clinical cases:** Educators create via `POST /api/clinical-cases` (title, description, difficulty, specialty, estimated_duration_minutes, case_data, is_public). Seed script: `scripts/seed-clinical-cases.sql`. See `docs/SEED-CLINICAL-CASES.md` for case list and verification.
- **Vignettes:** Educators create via `POST /api/vignettes`; v2 vignettes can be imported via `POST /api/vignettes/v2/import` (e.g. from Studio or file).
- **ACLS:** Educators create via `POST /api/acls/scenarios` with scenario_data.
- **Running board:** Cases and presets are created by educators (APIs above). Configs via `POST /api/running-board/configs`. Seed data can be added via `scripts/seed-running-board.sql` or equivalent.

---

## Known Limitations and TODOs

- **CaseInterface scoring:** Scoring logic based on questions and answers is not yet implemented (`CaseInterface.tsx`).
- **Conversations streaming:** Streaming responses are not implemented for v1 or v2; responses are returned in full per turn.
- **Self-assessment PGY:** Some self-assessment or learner context still uses hardcoded PGY where graduation-based calculation is intended.
- **Program-wide / class aggregation:** Not specific to Learn but noted in project: some analytics (e.g. program-wide SWOT) are placeholders.

Content vs infrastructure: Learn infrastructure (APIs, DB, roles, routes) is in scope and production; additional content (more cases, vignettes, scenarios) is ongoing. See `docs/prd.md` “Out of Scope” for post-MVP items.

---

## Related Documentation

- `docs/SEED-CLINICAL-CASES.md` — Clinical cases seed and case data structure
- `docs/ANALYTICS.md` — Understand module (analytics engine)
- `docs/EQ-PQ-IQ.md` — Evaluation framework
- `docs/prd.md` — Product scope and data model
- `CLAUDE.md` — Tech stack, module list, and key documentation index
