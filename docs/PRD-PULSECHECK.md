# Product Requirements Document: EQ·PQ·IQ Pulse Check

**Product:** EQ·PQ·IQ Pulse Check  
**Platform:** eqpqiq.com/pulsecheck  
**Version:** 1.0  
**Last Updated:** February 2026  
**Status:** Production

---

## 1. Executive Summary

Pulse Check is a provider performance evaluation platform for health systems. Medical Directors use it to rate physicians and Advanced Practice Clinicians (APCs) across 13 attributes spanning Emotional Quotient (EQ), Professional Quotient (PQ), and Intellectual Quotient (IQ), alongside operational metrics like Length of Stay, Imaging Utilization, and Patients Per Hour. The platform supports a hierarchical organizational model (Healthsystem → Sites → Departments → Providers), configurable evaluation frequency, trend visualizations, and reporting dashboards for Regional Directors and administrative staff.

---

## 2. Problem Statement

Health systems lack a structured, longitudinal framework for evaluating provider performance:

- **No standard rubric.** Provider evaluations are often unstructured or narrowly focused on productivity metrics alone, missing behavioral and professional dimensions.
- **Siloed data.** Evaluations live in spreadsheets or paper files with no aggregation across sites or departments.
- **No trend visibility.** Medical Directors cannot see how a provider is improving or declining over time without manually reviewing past evaluations.
- **Operational metrics disconnected.** Productivity data (LOS, patient volume, imaging rates) lives in separate systems and is not correlated with behavioral assessments.
- **Administrative burden.** Tracking who has completed evaluations, sending reminders, and compiling reports is manual and time-consuming.

Pulse Check solves these by combining EQ/PQ/IQ behavioral ratings with operational metrics in a single platform, providing sparkline trends, cycle management, and role-based reporting.

---

## 3. Target Users & Roles

### 3.1 Personas

| Role | Description | Primary Actions |
|------|-------------|-----------------|
| **Medical Director** | Evaluates providers in their department | Rate providers, view own ratings, track completion |
| **Associate/Assistant Medical Director** | Same evaluation responsibilities as Medical Director | Rate providers, view own ratings |
| **Regional Director** | Oversees multiple sites, views aggregate analytics | View reports, manage cycles, export data |
| **Admin Assistant** | Manages organizational structure and operations | Manage users/sites/departments, import providers, configure settings |
| **Guest** | Unauthenticated visitor | No access (redirected to landing page) |

### 3.2 Permission Matrix

| Capability | Medical Director | Regional Director | Admin Assistant |
|------------|:----------------:|:-----------------:|:---------------:|
| View dashboard | Yes | Yes | Yes |
| Rate providers | Yes | -- | -- |
| View own ratings | Yes | -- | -- |
| View all ratings | -- | Yes | Yes |
| View reports | -- | Yes | Yes |
| Manage users | -- | -- | Yes |
| Manage cycles | -- | Yes | Yes |
| Import providers | -- | -- | Yes |
| Configure settings | -- | -- | Yes |
| Export data | Yes | Yes | Yes |

---

## 4. Core Features

### 4.1 Organizational Hierarchy

Pulse Check models a health system as a four-level hierarchy:

```
Healthsystem (e.g., Metro General Health)
  └── Site (e.g., Metro General Hospital - Main Campus)
        └── Department (e.g., Emergency Medicine)
              └── Provider (e.g., Dr. James Carter, MD)
```

Each provider has a **primary department** and a **primary Medical Director** who is responsible for their evaluation. Regional Directors see across all sites in their healthsystem.

### 4.2 Provider Evaluation (Rating)

Medical Directors rate each provider on **13 attributes** using a 1-5 scale:

#### EQ -- Emotional Quotient (5 attributes)
1. **Empathy & Rapport** -- Understanding and responding to patient/colleague emotions
2. **Communication Effectiveness** -- Clarity with patients, families, and team
3. **Stress Management** -- Composure and performance under pressure
4. **Self-Awareness** -- Recognizing limitations, receptive to feedback
5. **Adaptability & Growth Mindset** -- Adjusting approach, embracing learning

#### PQ -- Professional Quotient (5 attributes)
1. **Reliability & Work Ethic** -- Dependability, follow-through, dedication
2. **Integrity & Accountability** -- Ethical standards, ownership of mistakes
3. **Teachability & Receptiveness** -- Openness to feedback, willingness to learn
4. **Documentation Quality** -- Thoroughness and accuracy of records
5. **Leadership & Collaboration** -- Team dynamics, mentoring, initiative

#### IQ -- Intellectual Quotient (3 attributes)
1. **Clinical Management** -- Diagnostic and treatment decision-making
2. **Evidence-Based Practice** -- Application of current literature and guidelines
3. **Procedural & Technical Competence** -- Hands-on clinical skill

**Rating scale:**
| Score | Label | Color |
|-------|-------|-------|
| 5 | Exemplary | Green |
| 4 | Proficient | Green |
| 3 | Developing | Amber |
| 2 | Needs Improvement | Orange |
| 1 | Unsatisfactory | Red |

**Score calculation:**
- EQ Total = Average of 5 EQ attributes
- PQ Total = Average of 5 PQ attributes
- IQ Total = Average of 3 IQ attributes
- Overall Total = Average of all 13 attributes
- All rounded to 1 decimal place

### 4.3 Operational Metrics

Alongside EQ/PQ/IQ ratings, Medical Directors enter operational performance data:

| Metric | Type | Description |
|--------|------|-------------|
| **LOS** | Integer (minutes) | Average Length of Stay |
| **Imaging -- CT %** | Decimal (0-100) | CT utilization rate |
| **Imaging -- U/S %** | Decimal (0-100) | Ultrasound utilization rate |
| **Imaging -- MRI %** | Decimal (0-100) | MRI utilization rate |
| **Imaging -- Average** | Computed | Average of CT, U/S, MRI (auto-calculated) |
| **PPH** | Decimal | Patients Per Hour |

Department-level imaging averages are displayed for comparison so directors can contextualize individual provider metrics.

### 4.4 Additional Comments

Each evaluation includes free-text fields:
- **Strengths** -- what the provider does well
- **Areas for Improvement** -- specific development areas
- **Goals for Next Period** -- actionable targets
- **General Notes** -- other observations

### 4.5 Provider List & Status Tracking

The Medical Director's main view (`/pulsecheck/providers`) shows:

- **Provider cards** grouped by type (Physicians, APCs) with search and filters.
- **Status badges:** Not Started (gray), In Progress (amber), Completed (green).
- **Quick stats:** Total providers, physician/APC counts, pending reviews.
- **Accordion details:** Expand any provider to see:
  - EQ, PQ, IQ scores with sparkline trend charts
  - Operational metrics (LOS, PPH, imaging with department averages)
  - Last updated date

### 4.6 Sparkline Trend Visualizations

Smooth bezier-curve SVG sparklines show provider score trajectories over time:

- **Trend direction:** Green (improving), Red (declining), Purple (stable).
- **Percentage change indicator** comparing latest to previous.
- **Mini sparklines** in the provider list accordion for quick visual scanning.
- **Full sparklines** in the Provider Profile Modal history tab.

### 4.7 Reports Dashboard (Regional Director)

The reports view (`/pulsecheck/reports`) provides healthsystem-wide analytics:

- **Overall stats cards:** Sites, Departments, Directors, Providers, Completed evaluations, Completion rate.
- **Average scores card:** EQ, PQ, IQ, Overall with color coding.
- **Expandable sites table:** Click a site to see all providers across its departments with scores and status.
- **Provider Profile Modal:** Click any provider to see current scores and historical trends.
- **Share menu:** Export CSV, Send Reminders, Email Summary (some features pending).

### 4.8 Frequency Management

Evaluation frequency is configurable at two levels:

- **Healthsystem default:** Quarterly, Biannually, or Annually, with a configurable cycle start month.
- **Site-level overrides:** Individual sites can override frequency and start month; if not set, they inherit the healthsystem default.

Configured via the Admin panel Settings tab.

### 4.9 Cycle Management

Evaluations are organized into **cycles** (evaluation periods):

- **Create cycle:** Name, start date, due date, reminder cadence (daily/weekly/biweekly/none).
- **Auto-provisioning:** Creating a cycle automatically generates `pending` rating entries for all active providers.
- **Status lifecycle:** Draft → Active → Completed → Archived.
- **Reminders:** Track pending counts per director per cycle.

### 4.10 Provider Import (CSV)

Bulk onboarding via CSV upload:

- **Template download:** Pre-formatted CSV with required and optional columns.
- **Required columns:** Name, Email, Provider Type (physician/apc).
- **Optional columns:** Credential, Site, Department, Director Email.
- **Import results:** Row-by-row status (Success, Duplicate, Error) with messages.
- **Summary stats:** Total, Success, Duplicates, Errors.

### 4.11 Admin Panel

Administrative management organized into tabs:

| Tab | Features |
|-----|----------|
| **Sites** | List, add, edit sites with region and status |
| **Departments** | List, add, edit departments with site and specialty |
| **Directors** | List, add, edit directors with role and department assignment |
| **Providers** | List, add, edit providers with type, department, and director |
| **Settings** | Healthsystem frequency defaults + site-level overrides |

### 4.12 Provider Profile Modal

Accessible from the Reports page, shows:

- **Current tab:** Latest EQ/PQ/IQ scores and operational metrics.
- **History tab:** All historical ratings with scores and metrics per cycle.
- Download report button (placeholder for future PDF/presentation export).

---

## 5. EQ·PQ·IQ Framework (Pulse Check Context)

In the Pulse Check context, the EQ/PQ/IQ framework evaluates **practicing physicians and APCs** on a granular 13-attribute scale (1-5 per attribute). This is more detailed than the Interview tool's holistic 0-100 per-domain approach because:

- Evaluators (Medical Directors) know the providers well from working with them over extended periods.
- The granular attributes provide specific, actionable feedback tied to professional development.
- Longitudinal tracking at the attribute level reveals which specific competencies are improving or declining.
- The 1-5 scale with labeled anchors (Unsatisfactory through Exemplary) provides clear calibration.

The 3-attribute IQ domain (vs. 5 in EQ and PQ) reflects the Pulse Check focus: behavioral and professional dimensions are harder to observe and develop than clinical knowledge, so they receive more granular measurement.

---

## 6. Analytics & Reporting

| Feature | Access | Description |
|---------|--------|-------------|
| Provider completion tracking | Medical Director | Status badges, pending counts, completion rate |
| Sparkline trends | Medical Director | Per-provider EQ/PQ/IQ trend over time |
| Site-level rollup | Regional Director | All providers per site with scores and completion |
| Healthsystem-wide stats | Regional Director | Aggregate counts, averages, completion rates |
| Provider Profile Modal | Regional Director | Current + historical scores per provider |
| Department imaging averages | Medical Director | Compare provider imaging utilization to department norms |
| CSV export | All directors | Export ratings data |

---

## 7. Authentication & Access

### 7.1 Email-Based Authentication

Pulse Check uses lightweight email-based authentication:

1. User enters their email on the landing page or is auto-logged in via URL `?email=` parameter.
2. Server validates against `pulsecheck_directors` table in Supabase.
3. Returns: director record, role, department, site, healthsystem context.
4. Client stores session in `localStorage` (`pulsecheck_user`) and re-validates on mount.

### 7.2 Domain Routing

- On `eqpqiq.com`: accessible at `/pulsecheck` via middleware pass-through.
- On `lev8.ai`: accessible at `/pulsecheck` directly.
- The unified VisitorGate requires email collection before viewing on eqpqiq.com.

### 7.3 Demo Accounts

| Role | Email | Name |
|------|-------|------|
| Regional Director | michael.thompson@metrohealth.com | Dr. Michael Thompson |
| Medical Director | james.wilson@metrohealth.com | Dr. James Wilson |
| Admin Assistant | amanda.chen@metrohealth.com | Amanda Chen |

---

## 8. Technical Architecture

### 8.1 Key Database Tables

| Table | Purpose |
|-------|---------|
| `pulsecheck_healthsystems` | Top-level organizational entity with default frequency settings |
| `pulsecheck_sites` | Physical locations within a healthsystem, with optional frequency overrides |
| `pulsecheck_departments` | Departments within sites (unique by site + name) |
| `pulsecheck_directors` | Evaluators with role and department/healthsystem assignment |
| `pulsecheck_providers` | Physicians and APCs being evaluated |
| `pulsecheck_cycles` | Evaluation periods with due dates and reminder cadence |
| `pulsecheck_ratings` | Individual evaluations: 13 EQ/PQ/IQ attributes + operational metrics + comments |
| `pulsecheck_reminders` | Reminder tracking per director per cycle |
| `pulsecheck_imports` | CSV import audit trail |
| `pulsecheck_demo_visitors` | Legacy visitor tracking (superseded by unified eqpqiq_visitors) |

**Database views:**
- `pulsecheck_ratings_with_totals` -- joins ratings with computed EQ/PQ/IQ/Overall totals plus provider, director, and cycle names.
- `pulsecheck_site_settings` -- effective frequency per site (with healthsystem inheritance).
- `pulsecheck_dept_imaging_averages` -- department-level imaging utilization averages.

**Database functions:**
- `get_pending_pulsecheck_count(director_uuid, cycle_uuid)` -- returns pending evaluation count.
- `update_pulsecheck_updated_at()` -- trigger for automatic timestamp updates.

### 8.2 API Endpoints (18 routes)

**Authentication:** Email validation and user context.  
**Providers:** CRUD operations, soft delete.  
**Ratings:** Get (with filters), create/update (upsert), historical data for sparklines.  
**Reports:** Aggregated stats across sites, departments, providers.  
**Cycles:** CRUD operations with auto-provisioning of rating entries.  
**Reminders:** Summary and creation.  
**Admin:** Sites, departments, directors listing; settings management; CSV import.  
**Visitor tracking:** Demo visitor logging (legacy).

### 8.3 Key Components

| Component | Purpose |
|-----------|---------|
| `RatingSliders` | 1-5 sliders for all 13 EQ/PQ/IQ attributes with expandable domains |
| `Sparkline` | SVG bezier-curve trend chart with direction-based coloring |
| `MiniSparkline` | Compact version for provider list accordion |
| `ScoreSparkline` | Score-specific variant with trend percentage |
| `ProviderProfileModal` | Current scores + history tabs with trend data |
| `NavigationMenu` | Role-based navigation links |
| `UserDropdown` | User context menu with role badge |

---

## 9. Integrations

| Integration | Purpose | Status |
|-------------|---------|--------|
| **Supabase** | Database, RLS, computed views | Production |
| **Resend** | Email notifications for visitor tracking | Production |
| **Elevate (lev8.ai)** | Shared infrastructure and deployment | Production |

### Planned Integrations

| Integration | Purpose | Status |
|-------------|---------|--------|
| **Email reminders** | Automated evaluation reminders to directors | API structure built, email service pending |
| **Whisper (OpenAI)** | Voice memo transcription for evaluations | UI placeholder built |
| **PDF/Presentation export** | Generate provider profile reports | Placeholder in Provider Profile Modal |

---

## 10. Current Status (February 2026)

### What's Built
- Full evaluation workflow: provider list → rate (13 attributes + metrics + comments) → submit
- Operational metrics (LOS, Imaging CT/US/MRI, PPH) with department averages
- Sparkline trend visualizations with bezier curves
- Reports dashboard with site-level rollup and Provider Profile Modal
- Admin panel: sites, departments, directors, providers management
- CSV import for bulk provider onboarding
- Frequency management with site-level overrides
- Cycle management with auto-provisioning
- Reminder tracking (API-level; email delivery pending)
- Demo accounts with seeded historical data (Q2-Q4 2025 for Metro General)

### Seeded Demo Data (Metro General Health)
- 1 healthsystem: Metro General Health
- 2 sites: Metro General Hospital - Main Campus, Metro General Hospital - West Campus
- Multiple departments across sites
- 3 demo directors: Regional Director, Medical Director, Admin Assistant
- Providers across departments with historical rating data

---

## 11. Roadmap / Future Features

### Identified in Codebase

| Feature | Evidence | Priority |
|---------|----------|----------|
| **Voice memos** | UI modal placeholder on Reports page | High |
| **Email reminders** | API route built, email service not connected | High |
| **Provider self-evaluation** | Noted in product documentation | Medium |
| **PDF/Presentation export** | Download button placeholder in Provider Profile Modal | Medium |
| **Share profile via email** | Share menu options in Reports page | Medium |
| **Advanced add/edit modals** | Admin panel UI exists, backend integration partial | Low |

### Strategic Opportunities

1. **Provider self-assessment:** Allow physicians and APCs to rate themselves, then compare self-assessment against Medical Director evaluations (gap analysis).
2. **Multi-cycle trend analysis:** Aggregate trends across multiple evaluation cycles with statistical significance indicators.
3. **Benchmarking:** Compare provider scores against department, site, and healthsystem averages.
4. **AI-generated insights:** Summarize evaluation patterns, flag outliers, suggest development plans based on low-scoring attributes.
5. **Integration with HR systems:** Import/export provider data with existing credentialing and HR platforms.
6. **Patient satisfaction correlation:** Cross-reference EQ/PQ/IQ scores with patient satisfaction survey data.

---

## 12. Appendix

### A. Full Database Schema

**`pulsecheck_healthsystems`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| name | VARCHAR | |
| abbreviation | VARCHAR | |
| address | TEXT | |
| is_active | BOOLEAN | |
| default_frequency | VARCHAR | quarterly/biannually/annually |
| default_cycle_start_month | INTEGER | 1-12 |

**`pulsecheck_sites`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| healthsystem_id | UUID | FK to healthsystems |
| name | VARCHAR | |
| region | VARCHAR | |
| address | TEXT | |
| is_active | BOOLEAN | |
| frequency_override | VARCHAR | Nullable; inherits if null |
| cycle_start_month_override | INTEGER | Nullable; inherits if null |

**`pulsecheck_departments`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| site_id | UUID | FK to sites |
| name | VARCHAR | |
| specialty | VARCHAR | |
| is_active | BOOLEAN | |
| Unique | | (site_id, name) |

**`pulsecheck_directors`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_profile_id | UUID | FK to user_profiles (nullable) |
| department_id | UUID | FK to departments (nullable) |
| healthsystem_id | UUID | FK to healthsystems (nullable) |
| role | VARCHAR | regional_director / medical_director / associate_medical_director / assistant_medical_director / admin_assistant |
| email | VARCHAR | |
| name | VARCHAR | |
| is_active | BOOLEAN | |
| Constraint | | Must have department_id OR healthsystem_id |

**`pulsecheck_providers`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| name | VARCHAR | |
| email | VARCHAR | Unique |
| provider_type | VARCHAR | physician / apc |
| credential | VARCHAR | MD, DO, PA, NP, etc. |
| primary_department_id | UUID | FK to departments |
| primary_director_id | UUID | FK to directors |
| hire_date | DATE | |
| is_active | BOOLEAN | |

**`pulsecheck_cycles`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| name | VARCHAR | |
| description | TEXT | |
| start_date | DATE | |
| due_date | DATE | |
| reminder_cadence | VARCHAR | daily/weekly/biweekly/none |
| status | VARCHAR | draft/active/completed/archived |
| created_by | UUID | FK to directors |

**`pulsecheck_ratings`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| cycle_id | UUID | FK to cycles |
| provider_id | UUID | FK to providers |
| director_id | UUID | FK to directors |
| eq_empathy_rapport | INTEGER | 1-5 |
| eq_communication | INTEGER | 1-5 |
| eq_stress_management | INTEGER | 1-5 |
| eq_self_awareness | INTEGER | 1-5 |
| eq_adaptability | INTEGER | 1-5 |
| pq_reliability | INTEGER | 1-5 |
| pq_integrity | INTEGER | 1-5 |
| pq_teachability | INTEGER | 1-5 |
| pq_documentation | INTEGER | 1-5 |
| pq_leadership | INTEGER | 1-5 |
| iq_clinical_management | INTEGER | 1-5 |
| iq_evidence_based | INTEGER | 1-5 |
| iq_procedural | INTEGER | 1-5 |
| metric_los | INTEGER | Minutes |
| metric_imaging_util | NUMERIC(5,2) | Overall % |
| metric_imaging_ct | NUMERIC(5,2) | CT % |
| metric_imaging_us | NUMERIC(5,2) | U/S % |
| metric_imaging_mri | NUMERIC(5,2) | MRI % |
| metric_pph | NUMERIC(4,2) | Patients per hour |
| notes | TEXT | |
| strengths | TEXT | |
| areas_for_improvement | TEXT | |
| goals | TEXT | |
| status | VARCHAR | pending/in_progress/completed |
| started_at | TIMESTAMPTZ | |
| completed_at | TIMESTAMPTZ | |
| Unique | | (cycle_id, provider_id, director_id) |

### B. API Endpoint Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/pulsecheck/check-email | Validate director email |
| GET | /api/pulsecheck/providers | List providers (by director/department/site) |
| POST | /api/pulsecheck/providers | Create provider |
| GET | /api/pulsecheck/providers/[id] | Get provider + rating + history |
| PATCH | /api/pulsecheck/providers/[id] | Update provider |
| DELETE | /api/pulsecheck/providers/[id] | Soft delete provider |
| GET | /api/pulsecheck/ratings | Get ratings (with filters) |
| POST | /api/pulsecheck/ratings | Create/update rating (upsert) |
| GET | /api/pulsecheck/ratings/history | Historical scores for sparklines |
| GET | /api/pulsecheck/reports | Aggregated healthsystem-wide stats |
| GET | /api/pulsecheck/cycles | List cycles |
| POST | /api/pulsecheck/cycles | Create cycle (auto-provisions ratings) |
| PATCH | /api/pulsecheck/cycles | Update cycle |
| GET | /api/pulsecheck/reminders | Reminder summary per director |
| POST | /api/pulsecheck/reminders | Create reminders |
| GET | /api/pulsecheck/admin/sites | List sites |
| GET | /api/pulsecheck/admin/departments | List departments |
| GET | /api/pulsecheck/admin/directors | List directors |
| GET | /api/pulsecheck/admin/settings | Get frequency settings |
| POST | /api/pulsecheck/admin/settings | Update frequency settings |
| POST | /api/pulsecheck/admin/import | Bulk import providers |

### C. User Flows

**Medical Director Flow:**
1. Log in → Redirected to `/pulsecheck/providers`
2. View provider list with status badges and sparkline trends
3. Click "Start Rating" on a provider → `/pulsecheck/rate?provider=xxx`
4. Fill operational metrics (LOS, Imaging, PPH)
5. Rate all 13 EQ/PQ/IQ attributes using sliders
6. Add comments (Strengths, Areas for Improvement, Goals, Notes)
7. Save Draft or Submit Rating
8. Return to providers list → see updated status and scores

**Regional Director Flow:**
1. Log in → Redirected to `/pulsecheck/reports`
2. View overall stats (sites, providers, completion rate, average scores)
3. Expand a site → see all providers across departments with scores
4. Click provider profile icon → view current scores and historical trends
5. Use Share menu → Export CSV, Send Reminders

**Admin Assistant Flow:**
1. Log in → Access Admin panel
2. Manage Sites, Departments, Directors, Providers across tabs
3. Import Providers → Download CSV template → Upload → Review results
4. Settings → Configure healthsystem default frequency → Set site overrides

---

*This PRD reflects the current production state of the Pulse Check tool as of February 2026.*
