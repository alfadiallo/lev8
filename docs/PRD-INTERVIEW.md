# Product Requirements Document: EQ·PQ·IQ Interview Assessment Tool

**Product:** EQ·PQ·IQ Interview Assessment  
**Platform:** eqpqiq.com/interview  
**Version:** 1.0  
**Last Updated:** February 2026  
**Status:** Production

---

## 1. Executive Summary

The EQ·PQ·IQ Interview Assessment Tool is a structured evaluation platform for residency program interviews. It enables faculty interviewers to assess candidates across three domains -- Emotional Quotient (EQ), Professional Quotient (PQ), and Intellectual Quotient (IQ) -- then aggregates, normalizes, and ranks those assessments across an entire interview season. The tool replaces ad-hoc spreadsheet workflows with a real-time, multi-interviewer platform that surfaces scoring bias, produces exportable rank lists, and includes a built-in interview question guide.

---

## 2. Problem Statement

Residency interview programs face several challenges with candidate evaluation:

- **Inconsistent scoring.** Different interviewers have different baselines -- some rate leniently, others harshly. Raw averages obscure this.
- **No structured framework.** Many programs lack a standard rubric, leading to subjective "gut feel" rankings that are hard to defend or replicate.
- **Operational friction.** Paper forms, emailed spreadsheets, and manual aggregation waste time on interview days and during rank-list creation.
- **No bias detection.** Programs have no visibility into which interviewers are outliers or how scoring patterns shift over the season.
- **Faculty preparation burden.** Interviewers must independently find or create questions, leading to uneven interview quality.

The Interview Assessment Tool solves these by providing a unified digital platform with a standard EQ/PQ/IQ framework, real-time collaboration, z-score normalization, and a built-in interview guide.

---

## 3. Target Users & Roles

### 3.1 Personas

| Role | Description | Primary Actions |
|------|-------------|-----------------|
| **Program Director** | Oversees all interview sessions, builds rank list | Create sessions, review all ratings, view analytics, export rank list |
| **Faculty Interviewer** | Rates candidates during interview days | Join sessions, rate candidates, view own ratings |
| **Guest Interviewer** | External or one-time interviewer (email-only) | Create individual sessions, rate candidates |
| **Admin** | System administrator (super admin from Elevate) | Full access to all features |

### 3.2 Permission Matrix

| Capability | Guest | Faculty | Program Director | Admin |
|------------|:-----:|:-------:|:----------------:|:-----:|
| Create individual session | Yes | Yes | Yes | Yes |
| Join group session | -- | Yes | Yes | Yes |
| Rate candidates | Yes | Yes | Yes | Yes |
| View own ratings | Yes | Yes | Yes | Yes |
| View all ratings | -- | -- | Yes | Yes |
| View analytics & stats | -- | -- | Yes | Yes |
| Manage sessions | -- | -- | Yes | Yes |
| Export data (CSV) | -- | Yes | Yes | Yes |
| Invite interviewers | -- | -- | Yes | Yes |
| Finalize rankings | -- | -- | Yes | Yes |

---

## 4. Core Features

### 4.1 Session Management

A **session** represents a single interview day or event. The Program Director creates a session and adds candidates. Faculty join via a share link or by navigating to the session list.

- **Create session:** Name, date, creator email. Individual sessions are free; group sessions require a subscription.
- **Share tokens:** Each session gets a unique shareable link so faculty can join without accounts.
- **Status lifecycle:** Active → Review → Submitted → Archived.
- **Candidate management:** Add candidates by name, email, and medical school. Reorder or remove as needed.

### 4.2 Candidate Rating

Each interviewer independently rates each candidate on three 0-100 sliders:

| Domain | Score Range | Description |
|--------|-----------|-------------|
| **EQ** | 0-100 | Emotional intelligence, empathy, communication |
| **PQ** | 0-100 | Professionalism, work ethic, integrity |
| **IQ** | 0-100 | Clinical knowledge, reasoning, decision-making |

Additional per-rating fields:
- **Notes:** Free-text observations
- **Questions used:** Which interview guide questions were asked (tracked per sub-attribute)

The interface includes a progress bar, previous/next candidate navigation, and auto-save with a 1.5-second debounce.

### 4.3 Interview Question Guide

A comprehensive built-in guide organized by domain and sub-attribute:

**EQ Sub-Attributes (5):**
1. Empathy & Positive Interactions
2. Adaptability & Self-Awareness
3. Stress Management & Resilience
4. Curiosity & Growth Mindset
5. Communication Effectiveness

**PQ Sub-Attributes (5):**
1. Work Ethic & Reliability
2. Integrity & Accountability
3. Teamwork & Collaboration
4. Professionalism Under Pressure
5. Initiative & Leadership

**IQ Sub-Attributes (5):**
1. Medical Knowledge Application
2. Clinical Reasoning & Differential
3. Systems-Based Thinking
4. Evidence-Based Practice
5. Procedural & Technical Aptitude

Each sub-attribute includes:
- A detailed description
- 4-5 behavioral cues for the interviewer to observe
- 4-5 primary questions with follow-up prompts

Total: 15 sub-attributes, 50+ interview questions with follow-ups.

### 4.4 Score Normalization (Z-Score)

The normalization engine accounts for interviewer rating tendencies. A "harsh" grader's 70 might be equivalent to a "lenient" grader's 85.

**Algorithm:**
1. Calculate each interviewer's mean and standard deviation across all their ratings.
2. Convert each raw score to a z-score: `z = (raw - interviewer_mean) / interviewer_stddev`
3. Transform to normalized scale: `normalized = 50 + (z * 15)`

**Controls:**
- Toggle normalization on/off on the Season Overview page.
- Option to exclude resident interviewer ratings from normalization calculations.
- Rank-change indicators show how candidates move when normalization is applied.

### 4.5 Season Overview & Rank List

Aggregates all sessions in a season into a single ranked candidate list.

- **Sortable columns:** Rank, Name, Medical School, EQ, PQ, IQ, Total, Session Count.
- **Filters:** Search by name, filter by session, filter by medical school.
- **Decile distribution:** Visual chart showing how candidates cluster, with color-coded tiers (green = top, yellow = middle, red = bottom) and hover tooltips showing candidate names.
- **CSV export:** Includes both raw and normalized scores when normalization is active.

### 4.6 Interviewer Statistics

Dashboard for Program Directors to understand interviewer behavior:

- **Group averages:** Overall EQ, PQ, IQ, and Total means.
- **Per-interviewer metrics:** Average score, standard deviation, candidate count, deviation from group mean.
- **Rating tendency:** Labeled as Lenient, Neutral, or Strict based on deviation.
- **Visual deviation bars:** Color-coded bars showing how each interviewer compares to the group.

### 4.7 Session Review (Program Director)

All-ratings matrix for a single session:

- **Candidates x Interviewers grid:** See all scores at a glance.
- **Expandable rows:** Click a candidate to see EQ/PQ/IQ breakdown and each interviewer's individual ratings.
- **Interviewer summary table:** Average scores, deviation, patterns.
- **Color-coded scores:** Visual differentiation of score ranges.
- **CSV export.**

### 4.8 Session Summary

Session-level overview with:

- Summary cards: Total candidates, average score, high score, interviewer count.
- Score distribution chart.
- Ranked candidate list with expandable details.
- Per-candidate breakdown of individual interviewer ratings.

---

## 5. EQ·PQ·IQ Framework (Interview Context)

In the interview context, the EQ/PQ/IQ framework is used to evaluate **residency candidates** on a 0-100 scale per domain. This is deliberately broader than the 15-point (1-5 per attribute) scale used in the Elevate resident evaluation and Pulse Check systems -- interviewers get a single holistic slider per domain rather than rating 15 individual attributes.

**Why 0-100 per domain instead of granular attributes:**
- Interview time is limited (15-20 minutes per candidate).
- Granular 15-attribute scoring would overwhelm interviewers during a fast-paced interview day.
- The holistic score captures an overall impression informed by the sub-attribute question guide.
- Z-score normalization works better with broader scales that produce meaningful variance.

The built-in question guide provides the sub-attribute structure for interviewers to draw from, even though scoring is at the domain level.

---

## 6. Analytics & Reporting

| Feature | Access | Description |
|---------|--------|-------------|
| Session Review | Program Director | All-ratings matrix for a single session |
| Session Summary | All | Ranked candidate list with score distribution |
| Season Rank List | Program Director | Cross-session aggregated rankings with normalization |
| Interviewer Stats | Program Director | Scoring patterns, bias detection, group comparisons |
| CSV Export | Faculty+ | Export from Review, Summary, and Season pages |

---

## 7. Authentication & Access

### 7.1 Email-Based Authentication

The Interview tool uses lightweight email-based authentication (no password required):

1. User enters their email on the landing page.
2. Server validates against the `user_profiles` table in Supabase.
3. If found: returns user context with role-mapped permissions (Elevate role → Interview permission).
4. If not found: defaults to Guest permission.
5. Client stores session in `localStorage` and re-validates on each page load.

### 7.2 Domain Routing

- On `eqpqiq.com`: accessible at `/interview` via middleware rewrite.
- On `lev8.ai`: accessible at `/interview` directly.
- Demo access: demo role tiles on the landing page for Program Director and Core Faculty.

### 7.3 Share Tokens

Each session generates a unique share token. Faculty can join a session by navigating to `/interview/join/[token]` without needing prior authentication -- the token validates and redirects to the session.

---

## 8. Technical Architecture

### 8.1 Key Database Tables

| Table | Purpose |
|-------|---------|
| `interview_sessions` | Session metadata (name, date, status, share token, creator) |
| `interview_candidates` | Candidate profiles and calculated score totals |
| `interview_ratings` | Individual interviewer ratings per candidate (EQ, PQ, IQ, notes, questions) |
| `interview_session_interviewers` | Tracks which interviewers are in which sessions |
| `interview_subscriptions` | Stripe subscription state for group session access |
| `interview_payment_history` | Stripe payment audit trail |

**Database functions:**
- `recalculate_candidate_totals()` -- trigger that auto-updates candidate aggregate scores when ratings change.
- `generate_share_token()` -- creates unique session share tokens.

### 8.2 API Endpoints (28 routes)

**Sessions:** Create, list, get, update, join via token.  
**Candidates:** Add, list, delete per session.  
**Ratings:** Get (filter by candidate/interviewer), create/update (upsert).  
**Review & Summary:** Full review matrix, ranked summary.  
**Season & Analytics:** Cross-session rankings, interviewer statistics.  
**Auth:** Email validation, registration.  
**Subscription:** Stripe checkout, portal, webhook, status check.

### 8.3 Key Components

| Component | Purpose |
|-----------|---------|
| `InterviewDashboard` | Main hub with quick stats, recent sessions |
| `RatingSliders` | EQ/PQ/IQ 0-100 slider interface |
| `DomainGuidePanel` | Expandable interview question guide |
| `TotalScoreBar` | Visual score display |
| `NavigationMenu` | Role-based top navigation |
| `SubscriptionGate` | Checks subscription status before group features |

### 8.4 Score Normalization Logic

Located in `lib/interview/normalization.ts`:
- `calculateInterviewerStats()` -- per-interviewer mean and standard deviation.
- `normalizeRating()` -- z-score transformation for a single rating.
- `normalizeAllRatings()` -- batch normalization across all ratings.
- `calculateCandidateScores()` -- aggregate normalized scores with rank computation.

---

## 9. Integrations

| Integration | Purpose | Status |
|-------------|---------|--------|
| **Stripe** | Subscription billing for group session access | Production |
| **Supabase** | Database, RLS, authentication foundation | Production |
| **Resend** | Email notifications for visitor tracking | Production |
| **Elevate (lev8.ai)** | User profiles and role mapping | Production |

---

## 10. Current Status (February 2026)

### What's Built
- Full session lifecycle (create → rate → review → export)
- 0-100 EQ/PQ/IQ rating with auto-save
- Z-score normalization with toggle
- Season-wide rank list with decile distribution
- Interviewer statistics dashboard
- CSV export (raw + normalized)
- Built-in interview question guide (15 sub-attributes, 50+ questions)
- Stripe subscription integration
- Share token collaboration
- Demo accounts with seeded data

### Demo Data
- Program Director and Core Faculty demo roles
- Seeded sessions, candidates, and ratings for demonstration

---

## 11. Roadmap / Future Features

### Identified in Codebase

| Feature | Evidence | Priority |
|---------|----------|----------|
| **Season management** | `season_id` FK exists in `interview_sessions` but unused | Medium |
| **AI scoring** | `ai_eq_score`, `ai_pq_score`, `ai_iq_score` columns exist in candidates table | High |
| **Interview recording** | `interview_recording_url` field exists in candidates table | Medium |
| **Touchpoint scores** | `rotation_total`, `social_total` fields exist | Low |
| **Guest interviewer role** | Marked "Coming Soon" in UI | Medium |
| **Coordinator role** | Marked "Coming Soon" in UI | Low |
| **ERAS/NRMP integration** | Identified in SWOT analysis | High |

### Strategic Opportunities (from SWOT Analysis)

1. **Outcome tracking:** Link interview scores to milestone achievements and ITE performance to validate the framework.
2. **Multi-program expansion:** Consortium model for specialty-wide benchmarking with anonymized aggregate data.
3. **AI-powered features:** Automated red flag detection, suggested rank lists, natural language candidate summaries.
4. **Holistic review support:** Customizable domain weights, integration with application review scores.
5. **Faculty development:** Interviewer training modules, calibration exercises, certification tracking.

---

## 12. Appendix

### A. Full Database Schema

**`interview_sessions`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| session_type | VARCHAR | 'group' or 'individual' |
| season_id | UUID | FK (future use) |
| program_id | UUID | FK to programs |
| created_by_user_id | UUID | FK to user_profiles |
| creator_email | VARCHAR | |
| session_name | VARCHAR | |
| session_date | DATE | |
| status | VARCHAR | active/review/submitted/archived |
| share_token | VARCHAR | Unique |
| is_public | BOOLEAN | |
| notes | TEXT | |
| is_demo | BOOLEAN | |

**`interview_candidates`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| session_id | UUID | FK to sessions |
| candidate_name | VARCHAR | |
| candidate_email | VARCHAR | |
| medical_school | VARCHAR | |
| graduation_year | INTEGER | |
| usmle_step1_score | INTEGER | |
| usmle_step2_score | INTEGER | |
| step_2_score | NUMERIC | |
| sloe_a_score, sloe_b_score | NUMERIC | |
| candidate_data | JSONB | Extensible metadata |
| eq_total, pq_total, iq_total | NUMERIC | Calculated averages |
| interview_total | NUMERIC | Sum of domain totals |
| composite_score | INTEGER | Future use |
| sort_order | INTEGER | |
| is_demo | BOOLEAN | |

**`interview_ratings`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| candidate_id | UUID | FK to candidates |
| interviewer_user_id | UUID | FK to user_profiles (nullable) |
| interviewer_email | VARCHAR | |
| interviewer_name | VARCHAR | |
| eq_score | INTEGER | 0-100 |
| pq_score | INTEGER | 0-100 |
| iq_score | INTEGER | 0-100 |
| notes | TEXT | |
| questions_asked | TEXT[] | |
| question_notes | JSONB | |
| questions_used | JSONB | Tracks which guide questions were used |
| is_revised | BOOLEAN | |
| revised_at | TIMESTAMPTZ | |
| Unique | | (candidate_id, interviewer_email) |

### B. API Endpoint Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/interview/sessions | List sessions by creator |
| POST | /api/interview/sessions | Create session |
| GET | /api/interview/sessions/list | List all accessible sessions |
| GET | /api/interview/sessions/[id] | Get session + candidates |
| POST | /api/interview/sessions/[id] | Update session |
| GET | /api/interview/sessions/join | Join via share token |
| POST | /api/interview/sessions/[id]/candidates | Add candidate |
| GET | /api/interview/sessions/[id]/candidates | List candidates |
| DELETE | /api/interview/sessions/[id]/candidates/[cid] | Delete candidate |
| GET | /api/interview/sessions/[id]/ratings | Get ratings |
| POST | /api/interview/sessions/[id]/ratings | Create/update rating |
| GET | /api/interview/sessions/[id]/review | Full review matrix |
| GET | /api/interview/sessions/[id]/summary | Ranked summary |
| GET | /api/interview/season | Season-wide rankings |
| GET | /api/interview/stats | Interviewer statistics |
| POST | /api/interview/check-email | Validate user email |
| POST | /api/interview/register | Register new user |
| GET | /api/interview/subscription/check | Subscription status |
| POST | /api/interview/stripe/checkout | Create Stripe checkout |
| GET | /api/interview/stripe/portal | Stripe customer portal |
| POST | /api/interview/stripe/webhook | Stripe webhook handler |

---

*This PRD reflects the current production state of the Interview Assessment Tool as of February 2026.*
