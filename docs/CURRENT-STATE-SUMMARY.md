# Lev8 Current State Summary
**Complete Platform Overview**

**Created:** January 2025  
**Last Updated:** February 17, 2026  
**Status:** ✅ All Modules + EQ·PQ·IQ Product Suite Operational  
**Purpose:** Comprehensive overview of the Lev8 platform architecture and current capabilities

---

## Recent Updates (February 2026)

### EQ·PQ·IQ Product Suite (eqpqiq.com)
- ✅ **Interview Assessment Tool** — Full session lifecycle, z-score normalization, season rank lists, Stripe billing
- ✅ **Pulse Check** — Provider evaluation with 13 attributes, sparkline trends, cycle management, CSV import
- ✅ **Progress Check** — Survey-based resident evaluation replacing CCC workflow:
  - Survey creation with audience targeting (class year, faculty type)
  - Token-based email distribution via Resend (passwordless, 48-char hex tokens)
  - Public survey form (`/survey/[token]`) with compact slider design and auto-save
  - Respondent status tracking (pending/started/completed)
  - Add respondents to active surveys after initial distribution
  - View respondent results inline (EQ/PQ/IQ averages with expandable score cards)
- ✅ **Brand Landing Page** — Philosophy, use cases, AI analytics at eqpqiq.com root
- ✅ **Demo Accounts** — PD, Faculty, and Resident roles for all three tools

### Naming & Terminology
- ✅ **CCC → Progress Check** — Renamed across database, API routes, and UI
- ✅ **"Intelligence" → "Quotient"** — Framework pillar names updated (Emotional/Professional/Intellectual Quotient)
- ✅ **0-100 Scale** — Structured ratings migrated from 1.0-5.0 to 0-100 scale
- ✅ **Rater Types** — Refined to `core_faculty`, `teaching_faculty`, `self`

### Code Quality (January-February 2026)
- ✅ **ESLint Cleanup** — ~300 warnings resolved across 64 files
- ✅ **Warning Noise Cleanup** — Targeted pass on top-noise files for cleaner build output
- ✅ **TypeScript Strict Mode** — Improved type safety across API routes and components

### Previous Updates (December 2025)

#### Performance Improvements
- ✅ **Enabled Turbopack** for faster development builds (~70% faster page compilation)

#### UI/UX Fixes
- ✅ **Sidebar Navigation**: Sections stay expanded when navigating to child pages
- ✅ **Voice Journal**: Updated button and title styling

#### Authentication Fixes
- ✅ **Admin Dashboard Access**: Fixed redirect loop
- ✅ **Login Redirect**: Users redirected to intended destination after login

---

## 1. Executive Summary

### What is Lev8?
Lev8 is a production medical education platform comprising two product suites:

**Elevate (www.lev8.ai)** — Resident learning and analytics:
- **Learn Module**: Difficult Conversations, Clinical Cases, ACLS Simulations, Running Board
- **Grow Module**: Voice Journal with AI transcription and summarization
- **Understand Module**: Analytics Engine with AI SWOT, EQ+PQ+IQ tracking, Progress Check sessions

**EQ·PQ·IQ (www.eqpqiq.com)** — Evaluation tools:
- **Interview Assessment**: Candidate evaluation with z-score normalization for residency interviews
- **Pulse Check**: Provider performance evaluation for health systems
- **Progress Check**: Survey-based resident evaluation replacing CCC workflow

### Current Status
✅ **All Modules + EQ·PQ·IQ Product Suite Operational**:
- Complete database schema with 50+ tables
- ~200 API endpoints across 28+ route groups
- User authentication: Supabase Auth (Elevate) + email-based context (eqpqiq.com) + token-based (surveys)
- Comprehensive Row Level Security (RLS) policies
- Difficult Conversations v2 with multi-model AI (Claude + Gemini)
- Voice Journal with Whisper transcription + Claude summarization
- **Analytics Engine with real data:**
  - 50 residents (Memorial Healthcare System EM program)
  - 13 faculty members
  - 5,860 MedHub evaluation comments imported
  - 415+ structured ratings (354 core faculty + 61 self-assessments)
  - AI SWOT analysis with supporting citations
  - 15-point radar charts for competency visualization
  - ITE score tracking with historical trends
  - **ITE Archetype Classification System v3:**
    - 9 complete archetypes (3-year data)
    - 4 provisional archetypes (2-year data)
    - 3 provisional archetypes (1-year data)
    - Methodology versioning and evolution tracking
    - Similar historical profile matching
    - Archetype-specific recommendations
- **Progress Check Survey System:**
  - Survey lifecycle (create → distribute → respond → review)
  - Token-based passwordless access for respondents
  - Inline respondent results viewing

### Tech Stack
- **Frontend**: Next.js 15.5.9 (App Router, Turbopack), React 19.1.0, TypeScript 5, Tailwind CSS 4, Recharts 3.4.1, D3 7.9.0
- **Backend**: Supabase (PostgreSQL with RLS), Next.js API Routes (~200 endpoints)
- **AI Services**: 
  - Anthropic Claude v0.68.0 (conversations, SWOT analysis, summarization)
  - Google Generative AI v0.24.1 (alternative conversation provider)
  - OpenAI Whisper (voice transcription)
- **Payments**: Stripe v20.1.2 (Interview Assessment subscriptions)
- **Email**: Resend (survey distribution, notifications)
- **Deployment**: Vercel (frontend + backend) + Supabase Cloud (database)
- **Domains**: www.lev8.ai + www.eqpqiq.com

---

## 2. Complete Database Schema

### Core Institution & Program Tables

#### `health_systems` (Institutions)
```sql
CREATE TABLE public.health_systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    abbreviation VARCHAR,
    location VARCHAR,
    contact_email VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```
**Notes**: 
- Root of data hierarchy
- Example: "Memorial Healthcare System" (MHS)
- All institution-specific data links here via `institution_id`

---

#### `programs` (Residency Programs)
```sql
CREATE TABLE public.programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    health_system_id UUID NOT NULL REFERENCES health_systems(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    specialty VARCHAR,
    pgm_director_id UUID, -- References user_profiles.id
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(health_system_id, name)
);
```
**Notes**: 
- Each health system can have multiple programs
- Example: "Emergency Medicine Residency" within MHS
- Faculty and residents belong to programs

---

#### `academic_classes` (Resident Cohorts)
```sql
CREATE TABLE public.academic_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    class_year VARCHAR(10) NOT NULL, -- 'PGY-1', 'PGY-2', 'PGY-3', etc.
    start_date DATE,
    graduation_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```
**Notes**: 
- Tracks cohorts (PGY-1, PGY-2, PGY-3)
- Used for class comparisons in Analytics
- `class_year` is VARCHAR(10) to support formats like "PGY-1"

---

### User Tables

#### `user_profiles` (All Users - Linked to Supabase Auth)
```sql
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY, -- Matches Supabase Auth user ID
    email VARCHAR NOT NULL,
    full_name VARCHAR,
    phone VARCHAR,
    role VARCHAR NOT NULL CHECK (role IN ('resident', 'faculty', 'program_director', 'super_admin')),
    institution_id UUID NOT NULL REFERENCES health_systems(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(email, institution_id)
);
```
**Notes**: 
- Central user table, links to Supabase Auth via `id`
- **Roles**: `resident`, `faculty`, `program_director`, `super_admin`
- All users must belong to an institution
- Email is unique per institution (same email can exist in different institutions)

---

#### `residents` (Resident-Specific Data)
```sql
CREATE TABLE public.residents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE RESTRICT,
    class_id UUID NOT NULL REFERENCES academic_classes(id) ON DELETE RESTRICT,
    medical_school VARCHAR,
    specialty VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```
**Notes**: 
- One-to-one with user_profiles (for residents only)
- **Key for Analytics**: Links resident to program and class
- This is where evaluation data should link

---

#### `faculty` (Faculty-Specific Data)
```sql
CREATE TABLE public.faculty (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE RESTRICT,
    title VARCHAR,
    department VARCHAR,
    is_evaluator BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```
**Notes**: 
- One-to-one with user_profiles (for faculty only)
- `is_evaluator`: Can this faculty member submit evaluations?
- Faculty belongs to a program (can only see residents in their program)

---

### Module & Content Tables

#### `module_buckets` (Top-Level Categories)
```sql
CREATE TABLE public.module_buckets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES health_systems(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL, -- 'Learn', 'Grow', 'Understand'
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(institution_id, name)
);
```
**Notes**: 
- Three buckets: **Learn**, **Grow**, **Understand**
- Institution-specific (each institution has its own set)
- Analytics module should go in "Understand" bucket

---

#### `modules` (Specific Features)
```sql
CREATE TABLE public.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES health_systems(id) ON DELETE CASCADE, -- NULLABLE
    bucket_id UUID NOT NULL REFERENCES module_buckets(id) ON DELETE CASCADE,
    slug VARCHAR NOT NULL, -- 'difficult-conversations', 'voice-journal', 'analytics'
    name VARCHAR NOT NULL,
    description TEXT,
    available_to_roles VARCHAR[] DEFAULT '{}', -- ['resident', 'faculty']
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(institution_id, slug)
);
```
**Notes**: 
- **institution_id is NULLABLE**: Supports global modules (shared across all institutions)
- `slug` is URL-friendly identifier (e.g., 'difficult-conversations')
- `available_to_roles`: Array of roles that can access this module
- **Pattern**: Global modules (NULL institution_id) + institution-specific modules

---

#### `vignettes` (Conversation Scenarios)
```sql
CREATE TABLE public.vignettes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES health_systems(id) ON DELETE CASCADE, -- NULLABLE
    title VARCHAR NOT NULL,
    description TEXT,
    category VARCHAR NOT NULL, -- 'medical-error-disclosure', etc.
    subcategory VARCHAR,
    difficulty VARCHAR[] DEFAULT '{}',
    estimated_duration_minutes INTEGER,
    vignette_data JSONB NOT NULL DEFAULT '{}', -- Full v2 vignette structure
    created_by_user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```
**Notes**: 
- **institution_id is NULLABLE**: Global vignettes (like MED-001) available to all
- `vignette_data`: JSONB contains full conversation structure (phases, prompts, assessment)
- Example: MED-001 is global (`institution_id = NULL`)

---

#### `training_sessions` (User Activity Sessions)
```sql
CREATE TABLE public.training_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vignette_id UUID NOT NULL REFERENCES vignettes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    conversation_history JSONB DEFAULT '[]',
    current_phase VARCHAR,
    emotional_state JSONB,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```
**Notes**: 
- Tracks conversation sessions (Difficult Conversations module)
- Stores full conversation history and state
- Links user to vignette

---

#### `session_analytics` (Session Assessments)
```sql
CREATE TABLE public.session_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
    assessment_scores JSONB, -- EQ, PQ, IQ-like scoring for conversations
    phase_timings JSONB,
    emotional_trajectory JSONB,
    strengths TEXT[],
    areas_for_growth TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```
**Notes**: 
- Stores assessment results for conversation sessions
- Similar pattern could be used for evaluation analytics
- JSONB allows flexible scoring structures

---

#### `grow_voice_journal` (Voice Journal Entries)
```sql
CREATE TABLE public.grow_voice_journal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    audio_url VARCHAR NOT NULL,
    transcription TEXT,
    summary TEXT,
    reflection_prompt TEXT,
    recording_duration_seconds INTEGER,
    is_private BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```
**Notes**: 
- Voice journal entries (Grow module)
- Private by default (only resident can see)

---

### Analytics Engine Tables (Understand Module)

#### `imported_comments` (MedHub Evaluation Comments)
```sql
CREATE TABLE public.imported_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id UUID REFERENCES residents(id) ON DELETE CASCADE,
    date_completed DATE,
    evaluatee TEXT,
    evaluation_type TEXT,
    question_type TEXT,
    question TEXT,
    comment_text TEXT,
    pgy_level TEXT,
    period TEXT,
    period_label TEXT,
    import_batch_id UUID,
    imported_at TIMESTAMPTZ DEFAULT NOW()
);
```
**Notes**: 
- Stores raw evaluation comments from MedHub CSV imports
- 5,860 comments currently imported
- Links to residents via `resident_id`
- `period_label` format: "PGY-1 Fall", "PGY-2 Spring", etc.

---

#### `structured_ratings` (EQ+PQ+IQ Ratings)
```sql
CREATE TABLE public.structured_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
    rater_type TEXT NOT NULL CHECK (rater_type IN ('faculty', 'self')),
    period_label TEXT NOT NULL,
    -- EQ attributes (5)
    eq_empathy_positive_interactions DECIMAL(3,2),
    eq_adaptability_self_awareness DECIMAL(3,2),
    eq_stress_management_resilience DECIMAL(3,2),
    eq_curiosity_growth_mindset DECIMAL(3,2),
    eq_effectiveness_communication DECIMAL(3,2),
    eq_avg DECIMAL(3,2),
    -- PQ attributes (5)
    pq_work_ethic_reliability DECIMAL(3,2),
    pq_integrity_accountability DECIMAL(3,2),
    pq_teachability_receptiveness DECIMAL(3,2),
    pq_documentation DECIMAL(3,2),
    pq_leadership_relationships DECIMAL(3,2),
    pq_avg DECIMAL(3,2),
    -- IQ attributes (5)
    iq_knowledge_base DECIMAL(3,2),
    iq_analytical_thinking DECIMAL(3,2),
    iq_commitment_learning DECIMAL(3,2),
    iq_clinical_flexibility DECIMAL(3,2),
    iq_performance_for_level DECIMAL(3,2),
    iq_avg DECIMAL(3,2),
    concerns_goals TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```
**Notes**: 
- Stores detailed EQ+PQ+IQ ratings (15 attributes total)
- 319 ratings currently imported (267 faculty + 52 self-assessments)
- Each attribute scored 1.0-5.0 with 0.5 increments
- Used to generate radar charts and gap analysis

---

#### `period_scores` (Aggregated Period Scores)
```sql
CREATE TABLE public.period_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    period_label TEXT NOT NULL,
    faculty_eq_avg DECIMAL(3,2),
    faculty_pq_avg DECIMAL(3,2),
    faculty_iq_avg DECIMAL(3,2),
    faculty_n_raters INTEGER,
    faculty_ratings_detail JSONB,
    self_eq_avg DECIMAL(3,2),
    self_pq_avg DECIMAL(3,2),
    self_iq_avg DECIMAL(3,2),
    self_ratings_detail JSONB,
    self_faculty_gap_eq DECIMAL(3,2),
    self_faculty_gap_pq DECIMAL(3,2),
    self_faculty_gap_iq DECIMAL(3,2),
    is_current BOOLEAN DEFAULT TRUE,
    analysis_version TEXT DEFAULT 'v1.0',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(resident_id, period_label, analysis_version)
);
```
**Notes**: 
- Aggregates `structured_ratings` by resident and period
- `faculty_ratings_detail` and `self_ratings_detail` are JSONB containing all 15 attributes
- Gap analysis shows difference between self and faculty perception
- Powers the 15-point radar charts

---

#### `swot_summaries` (AI-Generated SWOT Analysis)
```sql
CREATE TABLE public.swot_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    period_label TEXT NOT NULL,
    strengths JSONB,
    weaknesses JSONB,
    opportunities JSONB,
    threats JSONB,
    analysis_version TEXT DEFAULT 'v1.0',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(resident_id, period_label, analysis_version)
);
```
**Notes**: 
- AI-generated SWOT analysis using Claude API
- Each JSONB field contains array of elements with `description`, `frequency`, and `supporting_quotes`
- Supporting quotes include direct citations from evaluation comments
- "Brutally honest" tone for actionable feedback

---

#### `ite_scores` (In-Training Exam Scores)
```sql
CREATE TABLE public.ite_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    test_date DATE NOT NULL,
    academic_year TEXT NOT NULL,
    pgy_level TEXT NOT NULL,
    percentile DECIMAL(5,2),
    raw_score INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(resident_id, test_date)
);
```
**Notes**: 
- Tracks ITE performance over time
- Percentile and raw scores for trend analysis
- Links to academic year and PGY level

---

#### `archetype_methodology_versions` (Archetype Versioning)
```sql
CREATE TABLE public.archetype_methodology_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    is_current BOOLEAN DEFAULT FALSE,
    archetype_definitions JSONB NOT NULL,
    thresholds JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT
);
```
**Notes**: 
- Semantic versioning for archetype methodology
- Stores complete archetype definitions per version
- Enables methodology evolution and A/B testing

---

#### `resident_classifications` (ITE Archetype Classifications)
```sql
CREATE TABLE public.resident_classifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id UUID NOT NULL UNIQUE REFERENCES residents(id),
    pgy1_percentile INTEGER,
    pgy2_percentile INTEGER,
    pgy3_percentile INTEGER,
    delta_12 INTEGER,
    delta_23 INTEGER,
    delta_total INTEGER,
    data_years INTEGER NOT NULL,
    original_archetype_id TEXT NOT NULL,
    original_archetype_name TEXT NOT NULL,
    original_confidence DECIMAL(3,2),
    original_risk_level TEXT,
    original_is_provisional BOOLEAN DEFAULT FALSE,
    original_methodology_version TEXT NOT NULL,
    original_classified_at TIMESTAMPTZ DEFAULT NOW(),
    current_archetype_id TEXT NOT NULL,
    current_archetype_name TEXT NOT NULL,
    current_confidence DECIMAL(3,2),
    current_risk_level TEXT,
    current_is_provisional BOOLEAN DEFAULT FALSE,
    current_methodology_version TEXT NOT NULL,
    current_last_updated TIMESTAMPTZ DEFAULT NOW(),
    has_version_drift BOOLEAN DEFAULT FALSE,
    similar_residents JSONB,
    recommendations JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```
**Notes**: 
- Stores both original (immutable) and current (mutable) classifications
- Tracks methodology version for each classification
- Similar residents stored as JSONB for flexible matching
- Powers the ITE Scores tab in resident analytics

---

#### `classification_history` (Classification Audit Trail)
```sql
CREATE TABLE public.classification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id UUID NOT NULL REFERENCES residents(id),
    archetype_id TEXT NOT NULL,
    archetype_name TEXT NOT NULL,
    confidence DECIMAL(3,2),
    risk_level TEXT,
    is_provisional BOOLEAN DEFAULT FALSE,
    methodology_version TEXT NOT NULL,
    pgy1_percentile INTEGER,
    pgy2_percentile INTEGER,
    pgy3_percentile INTEGER,
    data_years INTEGER,
    trigger TEXT NOT NULL,
    triggered_by TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```
**Notes**: 
- Complete audit trail of all classification changes
- Tracks what triggered each classification (initial, version_update, manual_review)
- Enables rollback and comparison across versions

---

### Survey & Progress Check Tables (February 2026)

#### `surveys` (Survey Campaigns)
- Scoped to a program. Types: `educator_assessment` or `learner_self_assessment`.
- Tracks status (draft/active/closed), deadline, reminder settings, audience filter.

#### `survey_respondents` (Survey Recipients)
- 48-character hex tokens for passwordless access.
- Tracks status (pending/started/completed), reminder count, auto-saved progress (JSONB).

#### `survey_resident_assignments` (Educator → Resident Mapping)
- For educator surveys: maps each faculty respondent to assigned residents.
- Tracks per-assignment completion status.

#### `progress_check_sessions` (Meeting Records)
- Session date, facilitator, attendees, status, notes. Supabase Realtime enabled.

#### `progress_check_notes` (Session Notes)
- Types: general, strength, weakness, opportunity, threat, action_item. Supports confidential notes.

#### `eqpqiq_user_roles` (Cross-Tool Role Assignments)
- Keyed on `(user_email, tool, program_id)`. Tools: `progress_check`, `ccc` (legacy).

#### `eqpqiq_visitors` (Visitor Tracking)
- Unified visitor tracking across all eqpqiq.com products.

---

## 3. Row Level Security (RLS) Patterns

### Core RLS Principles
1. **All tables have RLS enabled**
2. **Users can only see data they have permission to access**
3. **Institution-based isolation** (users only see data from their institution)
4. **Role-based access** (faculty, residents, program_directors have different permissions)

### Key RLS Patterns

#### Pattern 1: User Can See Own Data
```sql
-- Example: user_profiles (users can always see their own profile)
CREATE POLICY user_profiles_select ON public.user_profiles
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        (
            id = auth.uid() -- Can see own profile
            OR
            -- Can see other profiles from same institution
            EXISTS (
                SELECT 1 FROM public.user_profiles up
                WHERE up.id = auth.uid()
                AND up.institution_id = user_profiles.institution_id
            )
        )
    );
```

#### Pattern 2: Global + Institution-Specific Data
```sql
-- Example: vignettes (global or institution-specific)
CREATE POLICY vignettes_access ON public.vignettes
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        is_active = true AND
        (
            vignettes.institution_id IS NULL -- Global vignettes: available to everyone
            OR
            EXISTS (
                SELECT 1 FROM public.user_profiles
                WHERE user_profiles.id = auth.uid()
                AND user_profiles.institution_id = vignettes.institution_id
            )
            OR
            is_public = true -- Public vignettes: available to everyone
        )
    );
```

#### Pattern 3: Role-Based Management
```sql
-- Example: vignettes management (educators only)
CREATE POLICY vignettes_manage ON public.vignettes
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid()
            AND up.role IN ('faculty', 'program_director', 'super_admin')
            AND (
                vignettes.institution_id IS NULL -- Global: any educator can manage
                OR up.institution_id = vignettes.institution_id -- Institution-specific only
            )
        )
    );
```

#### Pattern 4: Program-Based Access (For Analytics!)
```sql
-- Example: Faculty can only see residents in their program
CREATE POLICY residents_faculty_access ON public.residents
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        (
            user_id = auth.uid() -- Residents can see own record
            OR
            EXISTS (
                SELECT 1 FROM public.faculty f
                INNER JOIN public.user_profiles up ON up.id = f.user_id
                WHERE up.id = auth.uid()
                AND f.program_id = residents.program_id
            )
        )
    );
```

### RLS Recommendations for Analytics

**For evaluation feedback tables**, use this pattern:
1. **Residents**: Can only see their own aggregated scores (NOT raw comments)
2. **Faculty**: Can see residents in their program only
3. **Program Directors**: Can see all residents in their program
4. **Super Admins**: Can see everything in their institution

**Example policy for a hypothetical `resident_evaluations` table**:
```sql
CREATE POLICY evaluations_access ON public.resident_evaluations
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        (
            -- Resident can see own evaluations (if allowed)
            resident_id IN (
                SELECT r.id FROM public.residents r
                WHERE r.user_id = auth.uid()
            )
            OR
            -- Faculty can see evaluations for residents in their program
            EXISTS (
                SELECT 1 FROM public.residents r
                INNER JOIN public.faculty f ON f.program_id = r.program_id
                INNER JOIN public.user_profiles up ON up.id = f.user_id
                WHERE up.id = auth.uid()
                AND r.id = resident_evaluations.resident_id
                AND up.role IN ('faculty', 'program_director', 'super_admin')
            )
        )
    );
```

---

## 4. Design Patterns & Best Practices

### Pattern 1: Global vs Institution-Specific Data

**When to use NULLABLE `institution_id`**:
- Content that should be shared across all institutions (e.g., MED-001 vignette)
- Modules available to everyone (e.g., "Difficult Conversations")

**When to use NON-NULL `institution_id`**:
- User data (profiles, residents, faculty)
- User-generated content (voice journal entries)
- **Evaluation feedback** (likely institution-specific)
- **Analytics results** (institution-specific for privacy)

### Pattern 2: JSONB for Flexible Data

Use JSONB columns for:
- Complex nested structures (e.g., `vignette_data`, `conversation_history`)
- Assessment scores with variable attributes (e.g., `assessment_scores`)
- Data that may evolve over time

**Example**: 
```json
{
  "eq_scores": {"empathy": 85, "adaptability": 78, ...},
  "pq_scores": {"work_ethic": 92, "integrity": 88, ...},
  "iq_scores": {"knowledge_base": 80, "clinical_reasoning": 75, ...}
}
```

### Pattern 3: Timestamps & Soft Deletes

All tables include:
- `created_at TIMESTAMP WITH TIME ZONE DEFAULT now()`
- `updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()`

Most tables use soft deletes via:
- `is_active BOOLEAN DEFAULT true`

### Pattern 4: UUID Primary Keys

All tables use `UUID` primary keys:
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

Benefits: 
- No auto-increment conflicts across institutions
- Can be generated client-side
- Hard to enumerate/guess

---

## 5. Current Module Structure

### Elevate Module Buckets (lev8.ai)
| Bucket | Description | Current Modules |
|--------|-------------|-----------------|
| **Learn** | Educational content and clinical learning | Difficult Conversations, Clinical Cases, ACLS Simulations, Running the Board |
| **Grow** | Personal development and reflection | Voice Journal |
| **Understand** | Analytics and evaluation | Analytics Engine, Progress Check Sessions |

### Module Access by Role (Elevate)
| Module | Residents | Faculty | Program Directors | Super Admins |
|--------|-----------|---------|-------------------|--------------|
| Difficult Conversations | ✅ | ✅ | ✅ | ✅ |
| Clinical Cases | ✅ | ✅ | ✅ | ✅ |
| ACLS Simulations | ✅ | ✅ | ✅ | ✅ |
| Running the Board | ✅ | ✅ | ✅ | ✅ |
| Voice Journal | ✅ | ❌ | ❌ | ❌ |
| Analytics (Own data) | ✅ | ❌ | ❌ | ❌ |
| Analytics (Program) | ❌ | ✅ | ✅ | ✅ |
| Truths | ❌ | ✅ | ✅ | ✅ |
| Expectations | ❌ | ✅ | ✅ | ✅ |
| Admin Portal | ❌ | ❌ | ❌ | ✅ |

### EQ·PQ·IQ Products (eqpqiq.com)
| Product | Roles | Authentication |
|---------|-------|---------------|
| **Interview Assessment** | Program Director, Faculty, Guest | Email-based context |
| **Pulse Check** | Regional Director, Medical Director, Admin Assistant | Email-based context |
| **Progress Check** | Program Director, Faculty, Resident | Email-based context + token-based (surveys) |

---

## 6. User Roles & Permissions

### Role Hierarchy
```
super_admin (institution-wide access)
    ↓
program_director (program-wide access)
    ↓
faculty (program-specific, can evaluate)
    ↓
resident (own data only)
```

### Role Definitions

#### `resident`
- Can access: Own profile, own sessions, own voice journal
- Can see: Own aggregated analytics (if implemented)
- **Cannot see**: Raw evaluation comments (for developmental safety)

#### `faculty`
- Can access: Residents in their program, create evaluations
- Can see: Resident analytics for their program
- Can manage: Vignettes (if `is_evaluator = true`)

#### `program_director`
- Can access: All residents in program, all faculty
- Can see: All program analytics, Progress Check reports
- Can manage: Program settings, academic classes

#### `super_admin`
- Can access: Everything in their institution
- Can see: All data across all programs in institution
- Can manage: Institution settings, users, all modules

### Permissions for Analytics Module

| Action | Resident | Faculty | Program Director | Super Admin |
|--------|----------|---------|------------------|-------------|
| View own EQ/PQ/IQ scores | ✅ | ❌ | ❌ | ❌ |
| View own trend charts | ✅ | ❌ | ❌ | ❌ |
| View own SWOT analysis | ✅ | ❌ | ❌ | ❌ |
| View raw evaluation comments | ❌ | ✅ (own program) | ✅ (own program) | ✅ (institution) |
| View resident dashboards | ❌ | ✅ (own program) | ✅ (own program) | ✅ (institution) |
| Generate Progress Check reports | ❌ | ❌ | ✅ | ✅ |
| Upload evaluation CSV | ❌ | ✅ | ✅ | ✅ |
| Configure risk thresholds | ❌ | ❌ | ✅ | ✅ |

---

## 7. Key Integration Points for Analytics

### Where to Connect

#### Evaluations → Residents
```sql
-- Evaluation feedback should link to residents table
CREATE TABLE public.resident_evaluations (
    id UUID PRIMARY KEY,
    resident_id UUID NOT NULL REFERENCES residents(id), -- KEY CONNECTION
    evaluator_id UUID REFERENCES user_profiles(id),
    rotation_name VARCHAR,
    evaluation_date DATE,
    comments TEXT, -- Raw feedback text
    -- ...
);
```

#### Processed Analytics → Residents
```sql
-- Aggregated scores should also link to residents
CREATE TABLE public.resident_analytics (
    id UUID PRIMARY KEY,
    resident_id UUID NOT NULL REFERENCES residents(id), -- KEY CONNECTION
    training_period VARCHAR, -- 'PGY-1 Fall', 'PGY-2 Spring'
    eq_scores JSONB,
    pq_scores JSONB,
    iq_scores JSONB,
    swot_analysis JSONB,
    -- ...
);
```

#### Class Comparisons
```sql
-- For class comparisons, join through academic_classes
SELECT 
    ac.class_year,
    AVG((ra.eq_scores->>'empathy')::numeric) as avg_empathy
FROM resident_analytics ra
INNER JOIN residents r ON r.id = ra.resident_id
INNER JOIN academic_classes ac ON ac.id = r.class_id
WHERE ac.program_id = 'program-uuid'
GROUP BY ac.class_year;
```

### API Route Patterns

Current routes follow this pattern:
- `/api/vignettes` - List vignettes
- `/api/conversations/v2/chat` - Chat endpoint
- `/api/users/me` - Current user profile

**Suggested Analytics routes**:
- `/api/analytics/residents/:residentId` - Resident analytics
- `/api/analytics/program/:programId/dashboard` - Program dashboard
- `/api/analytics/upload` - Upload evaluation CSV
- `/api/analytics/progress-check-reports` - Generate Progress Check reports

---

## 8. Critical Constraints & Considerations

### Must Follow These Rules

1. **All tables MUST have RLS enabled**
   ```sql
   ALTER TABLE your_new_table ENABLE ROW LEVEL SECURITY;
   ```

2. **Evaluation data is institution-specific**
   - Always include `institution_id` (non-nullable) or link through `resident_id`
   - Never make evaluations "global"

3. **Residents cannot see raw comments**
   - Only show aggregated scores and sanitized insights
   - Raw comments only visible to faculty/program directors

4. **Faculty can only see their program**
   - Use program_id joins in RLS policies
   - Never expose cross-program data

5. **No PHI (Protected Health Information)**
   - Do NOT store patient names, MRNs, etc.
   - Only evaluation comments about resident performance

6. **JSONB for complex scores**
   - Use JSONB for EQ/PQ/IQ scores (15 attributes each)
   - Allows flexible querying and evolution

7. **Timestamps are critical**
   - Always include `created_at` and `updated_at`
   - Enables longitudinal trend analysis

8. **Training periods must align**
   - PGY-1: Fall (6/1-11/30), Spring (12/1-5/31)
   - PGY-2: Fall (5/1-10/31), Spring (11/1-4/30)
   - PGY-3: Fall (4/1-9/30), Spring (10/1-3/31)

---

## 9. Migration Strategy Recommendations

### Step 1: Create Analytics Tables
Create new tables in a separate migration file:
- `resident_evaluations` (raw CSV data)
- `resident_analytics` (processed AI results)
- `swot_analyses`
- `risk_assessments`
- `progress_check_reports`

### Step 2: Enable RLS
Immediately enable RLS on all new tables:
```sql
ALTER TABLE resident_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE resident_analytics ENABLE ROW LEVEL SECURITY;
-- ... etc
```

### Step 3: Create RLS Policies
Follow existing patterns:
- Residents see own data only
- Faculty see program residents only
- Use EXISTS subqueries for complex joins

### Step 4: Seed Analytics Module
Add to `modules` table:
```sql
INSERT INTO modules (institution_id, bucket_id, slug, name, available_to_roles)
VALUES (
    NULL, -- or institution_id for institution-specific
    (SELECT id FROM module_buckets WHERE name = 'Understand' LIMIT 1),
    'analytics',
    'Analytics Engine',
    ARRAY['resident', 'faculty', 'program_director', 'super_admin']
);
```

### Step 5: Test RLS Policies
Before production:
1. Test as resident: Can only see own data?
2. Test as faculty: Can only see program residents?
3. Test as program_director: Can see all program data?
4. Test cross-institution: Cannot see other institutions?

---

## 10. Example Queries for Analytics

### Get Resident with Program Info
```sql
SELECT 
    up.id,
    up.email,
    up.full_name,
    up.role,
    r.id as resident_id,
    r.medical_school,
    p.name as program_name,
    ac.class_year,
    hs.name as institution_name
FROM user_profiles up
INNER JOIN residents r ON r.user_id = up.id
INNER JOIN programs p ON p.id = r.program_id
INNER JOIN academic_classes ac ON ac.id = r.class_id
INNER JOIN health_systems hs ON hs.id = up.institution_id
WHERE up.role = 'resident'
AND up.institution_id = 'your-institution-id';
```

### Get All Residents in a Program (Faculty View)
```sql
SELECT 
    r.id,
    up.full_name,
    up.email,
    ac.class_year
FROM residents r
INNER JOIN user_profiles up ON up.id = r.user_id
INNER JOIN academic_classes ac ON ac.id = r.class_id
WHERE r.program_id = 'your-program-id'
AND up.is_active = true
ORDER BY ac.class_year, up.full_name;
```

### Class Comparison Data
```sql
-- Example: Compare average scores across classes
SELECT 
    ac.class_year,
    COUNT(DISTINCT r.id) as resident_count,
    AVG((analytics.eq_scores->>'empathy')::numeric) as avg_empathy_score,
    AVG((analytics.eq_scores->>'adaptability')::numeric) as avg_adaptability_score
FROM residents r
INNER JOIN academic_classes ac ON ac.id = r.class_id
LEFT JOIN resident_analytics analytics ON analytics.resident_id = r.id
WHERE ac.program_id = 'program-id'
AND analytics.training_period = 'PGY-1 Fall'
GROUP BY ac.class_year;
```

---

## 11. Next Steps for Analytics Integration

### Immediate Actions

1. **Review this document** with your Analytics documentation
2. **Identify schema gaps**: What tables are missing?
3. **Design evaluation tables**: Based on your CSV format
4. **Create RLS policies**: Using patterns from this document
5. **Plan API routes**: Follow `/api/analytics/*` pattern

### Questions to Answer

- [ ] Should analytics data be global or institution-specific? **→ Likely institution-specific**
- [ ] Can residents see raw evaluation comments? **→ Likely NO (only aggregated)**
- [ ] Should faculty see cross-program data? **→ Likely NO (program-only)**
- [ ] How to handle historical data (2021-2024)? **→ Bulk import with timestamps**
- [ ] What training periods to support? **→ Use standard PGY-1/2/3 Fall/Spring**

### Schema Design Checklist

- [ ] All tables link to `residents` table via `resident_id`
- [ ] All tables have RLS enabled
- [ ] All tables have `created_at` and `updated_at`
- [ ] JSONB used for EQ/PQ/IQ scores
- [ ] Training periods follow standard format
- [ ] No PHI in any tables
- [ ] Indexes on foreign keys for performance

---

## 12. Contact & Support

### Key Files for Reference
- **Full Schema**: `scripts/02-setup-base-schema.sql`
- **RLS Policies**: `scripts/03-setup-rls-policies.sql`
- **Global Design**: `docs/GLOBAL-VIGNETTES-DESIGN.md`
- **Accomplishments**: `docs/ACCOMPLISHMENTS.md`
- **Planning**: `docs/planning.md`

### Documentation Updates
When you add Analytics tables:
1. Update this document with new table definitions
2. Add RLS policies to `scripts/03-setup-rls-policies.sql`
3. Document API routes in `docs/planning.md`
4. Update `docs/ACCOMPLISHMENTS.md` when features are complete

---

**End of Current State Summary**

This document provides a comprehensive overview of the Lev8 + EQ·PQ·IQ platform architecture. All new tables should follow these patterns, all RLS policies should match these security models, and all API routes should align with the existing structure.

See also:
- `docs/PRD-PROGRESS-CHECK.md` — Progress Check product requirements
- `docs/PRD-INTERVIEW.md` — Interview Assessment product requirements
- `docs/PRD-PULSECHECK.md` — Pulse Check product requirements
- `docs/OPS-SURVEY-RUNBOOK.md` — Survey operational runbook


