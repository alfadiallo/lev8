-- ============================================================================
-- EVALUATION FRAMEWORKS: Dynamic, versioned, per-program pillar/attribute system
-- ============================================================================
-- Moves from hardcoded 15 columns in structured_ratings to a flexible
-- JSONB-based model. Pillars and attributes are DATA, not schema.
--
-- Tables:
--   evaluation_frameworks      - Per-program, versioned framework definitions
--   framework_pillars          - EQ, PQ, IQ (or custom) per framework
--   framework_attributes       - 5+ attributes per pillar, with tags
--   competency_frameworks      - ACGME, EPA, CanMEDS definitions
--   competency_items           - Individual competencies within a framework
--   attribute_competency_mappings - M:N linking attributes to competencies
--   framework_ratings          - Flexible scores as JSONB
--   structured_ratings_compat  - VIEW mapping framework_ratings -> old column shape
-- ============================================================================

-- ============================================================================
-- 1. EVALUATION FRAMEWORKS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.evaluation_frameworks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    version INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    score_min INT NOT NULL DEFAULT 0,
    score_max INT NOT NULL DEFAULT 100,
    score_step INT NOT NULL DEFAULT 5,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(program_id, version)
);

CREATE INDEX IF NOT EXISTS idx_evaluation_frameworks_program
ON public.evaluation_frameworks(program_id, is_active);

-- ============================================================================
-- 2. FRAMEWORK PILLARS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.framework_pillars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    framework_id UUID NOT NULL REFERENCES public.evaluation_frameworks(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    color TEXT,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(framework_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_framework_pillars_framework
ON public.framework_pillars(framework_id, display_order);

-- ============================================================================
-- 3. FRAMEWORK ATTRIBUTES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.framework_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pillar_id UUID NOT NULL REFERENCES public.framework_pillars(id) ON DELETE CASCADE,
    framework_id UUID NOT NULL REFERENCES public.evaluation_frameworks(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    display_order INT NOT NULL DEFAULT 0,

    -- Tagging & classification for cross-cutting analytics
    tags TEXT[] DEFAULT '{}',
    category TEXT,

    created_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(framework_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_framework_attributes_pillar
ON public.framework_attributes(pillar_id, display_order);

CREATE INDEX IF NOT EXISTS idx_framework_attributes_tags
ON public.framework_attributes USING GIN(tags);

-- ============================================================================
-- 4. COMPETENCY FRAMEWORKS (ACGME, EPA, CanMEDS, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.competency_frameworks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    abbreviation TEXT NOT NULL,
    version TEXT,
    description TEXT,
    source_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 5. COMPETENCY ITEMS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.competency_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    framework_id UUID NOT NULL REFERENCES public.competency_frameworks(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES public.competency_items(id) ON DELETE SET NULL,
    display_order INT NOT NULL DEFAULT 0,

    UNIQUE(framework_id, code)
);

-- ============================================================================
-- 6. ATTRIBUTE -> COMPETENCY MAPPINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.attribute_competency_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attribute_id UUID NOT NULL REFERENCES public.framework_attributes(id) ON DELETE CASCADE,
    competency_item_id UUID NOT NULL REFERENCES public.competency_items(id) ON DELETE CASCADE,
    mapping_strength TEXT NOT NULL CHECK (mapping_strength IN ('primary', 'secondary', 'related')),
    notes TEXT,

    UNIQUE(attribute_id, competency_item_id)
);

-- ============================================================================
-- 7. FRAMEWORK RATINGS (flexible JSONB scores)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.framework_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id UUID NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
    rater_type TEXT NOT NULL CHECK (rater_type IN ('core_faculty', 'teaching_faculty', 'self', 'faculty')),
    framework_id UUID NOT NULL REFERENCES public.evaluation_frameworks(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES public.faculty(id) ON DELETE SET NULL,
    evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    pgy_level TEXT,
    period TEXT,
    period_label TEXT,

    -- Flexible scores keyed by attribute slug
    -- e.g. {"eq_empathy_positive_interactions": 75, "eq_adaptability_self_awareness": 80}
    scores JSONB NOT NULL DEFAULT '{}',

    -- Computed pillar averages (trigger-maintained)
    -- e.g. {"eq": 72.5, "pq": 68.0, "iq": 80.0}
    pillar_averages JSONB DEFAULT '{}',

    comments TEXT,

    -- Link back to survey system
    survey_id UUID REFERENCES public.surveys(id) ON DELETE SET NULL,
    survey_respondent_id UUID REFERENCES public.survey_respondents(id) ON DELETE SET NULL,
    form_submission_id UUID,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_framework_ratings_resident
ON public.framework_ratings(resident_id, evaluation_date DESC);

CREATE INDEX IF NOT EXISTS idx_framework_ratings_framework
ON public.framework_ratings(framework_id);

CREATE INDEX IF NOT EXISTS idx_framework_ratings_scores
ON public.framework_ratings USING GIN(scores);

-- ============================================================================
-- 8. TRIGGER: Compute pillar_averages from scores + framework definition
-- ============================================================================

CREATE OR REPLACE FUNCTION public.compute_pillar_averages()
RETURNS TRIGGER AS $$
DECLARE
    pillar RECORD;
    attr RECORD;
    avg_val NUMERIC;
    count_val INT;
    sum_val NUMERIC;
    result JSONB := '{}';
BEGIN
    -- For each pillar in the framework
    FOR pillar IN
        SELECT fp.id, fp.slug
        FROM public.framework_pillars fp
        WHERE fp.framework_id = NEW.framework_id
        ORDER BY fp.display_order
    LOOP
        sum_val := 0;
        count_val := 0;
        -- Sum up scores for attributes in this pillar
        FOR attr IN
            SELECT fa.slug
            FROM public.framework_attributes fa
            WHERE fa.pillar_id = pillar.id
            ORDER BY fa.display_order
        LOOP
            IF NEW.scores ? attr.slug AND (NEW.scores->>attr.slug) IS NOT NULL THEN
                sum_val := sum_val + (NEW.scores->>attr.slug)::NUMERIC;
                count_val := count_val + 1;
            END IF;
        END LOOP;

        IF count_val > 0 THEN
            avg_val := ROUND(sum_val / count_val, 2);
            result := result || jsonb_build_object(pillar.slug, avg_val);
        END IF;
    END LOOP;

    NEW.pillar_averages := result;
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_compute_pillar_averages ON public.framework_ratings;
CREATE TRIGGER trg_compute_pillar_averages
    BEFORE INSERT OR UPDATE OF scores ON public.framework_ratings
    FOR EACH ROW
    EXECUTE FUNCTION public.compute_pillar_averages();

-- ============================================================================
-- 9. BACKWARD-COMPATIBLE VIEW: structured_ratings_compat
-- ============================================================================
-- Maps framework_ratings JSONB data back to the 15-column shape that
-- existing analytics queries expect. This is a bridge during the transition.

CREATE OR REPLACE VIEW public.structured_ratings_compat AS
SELECT
    fr.id,
    fr.resident_id,
    fr.rater_type,
    fr.faculty_id,
    fr.evaluation_date,
    fr.pgy_level,
    fr.period,
    fr.period_label,
    -- EQ attributes
    (fr.scores->>'eq_empathy_positive_interactions')::NUMERIC AS eq_empathy_positive_interactions,
    (fr.scores->>'eq_adaptability_self_awareness')::NUMERIC AS eq_adaptability_self_awareness,
    (fr.scores->>'eq_stress_management_resilience')::NUMERIC AS eq_stress_management_resilience,
    (fr.scores->>'eq_curiosity_growth_mindset')::NUMERIC AS eq_curiosity_growth_mindset,
    (fr.scores->>'eq_effectiveness_communication')::NUMERIC AS eq_effectiveness_communication,
    -- PQ attributes
    (fr.scores->>'pq_work_ethic_reliability')::NUMERIC AS pq_work_ethic_reliability,
    (fr.scores->>'pq_integrity_accountability')::NUMERIC AS pq_integrity_accountability,
    (fr.scores->>'pq_teachability_receptiveness')::NUMERIC AS pq_teachability_receptiveness,
    (fr.scores->>'pq_documentation')::NUMERIC AS pq_documentation,
    (fr.scores->>'pq_leadership_relationships')::NUMERIC AS pq_leadership_relationships,
    -- IQ attributes
    (fr.scores->>'iq_knowledge_base')::NUMERIC AS iq_knowledge_base,
    (fr.scores->>'iq_analytical_thinking')::NUMERIC AS iq_analytical_thinking,
    (fr.scores->>'iq_commitment_learning')::NUMERIC AS iq_commitment_learning,
    (fr.scores->>'iq_clinical_flexibility')::NUMERIC AS iq_clinical_flexibility,
    (fr.scores->>'iq_performance_for_level')::NUMERIC AS iq_performance_for_level,
    -- Pillar averages
    (fr.pillar_averages->>'eq')::NUMERIC AS eq_avg,
    (fr.pillar_averages->>'pq')::NUMERIC AS pq_avg,
    (fr.pillar_averages->>'iq')::NUMERIC AS iq_avg,
    -- Other fields
    fr.comments AS concerns_goals,
    fr.form_submission_id,
    fr.survey_id,
    fr.created_at,
    fr.updated_at
FROM public.framework_ratings fr;

-- ============================================================================
-- 10. SEED: MHS EM EQ-PQ-IQ Framework v1
-- ============================================================================

DO $$
DECLARE
    v_program_id UUID;
    v_framework_id UUID;
    v_eq_pillar_id UUID;
    v_pq_pillar_id UUID;
    v_iq_pillar_id UUID;
    v_acgme_id UUID;
BEGIN
    -- Find MHS EM program
    SELECT id INTO v_program_id
    FROM public.programs
    WHERE specialty = 'Emergency Medicine'
    LIMIT 1;

    IF v_program_id IS NULL THEN
        RAISE NOTICE 'No Emergency Medicine program found, skipping seed';
        RETURN;
    END IF;

    -- Create framework (idempotent: skip if already exists)
    IF NOT EXISTS (
        SELECT 1 FROM public.evaluation_frameworks
        WHERE program_id = v_program_id AND version = 1
    ) THEN
        INSERT INTO public.evaluation_frameworks (program_id, name, version, is_active, score_min, score_max, score_step, description)
        VALUES (
            v_program_id,
            'MHS EM EQ-PQ-IQ Framework',
            1,
            true,
            0,
            100,
            5,
            'Memorial Hospital West Emergency Medicine Residency Program evaluation framework. Three pillars (EQ, PQ, IQ) with 5 attributes each, scored 0-100.'
        )
        RETURNING id INTO v_framework_id;

        -- EQ pillar
        INSERT INTO public.framework_pillars (framework_id, name, slug, description, color, display_order)
        VALUES (v_framework_id, 'Emotional Intelligence (EQ)', 'eq', 'Interpersonal & Intrapersonal Skills', '#3B82F6', 0)
        RETURNING id INTO v_eq_pillar_id;

        -- PQ pillar
        INSERT INTO public.framework_pillars (framework_id, name, slug, description, color, display_order)
        VALUES (v_framework_id, 'Professional Intelligence (PQ)', 'pq', 'Professional Decorum & Leadership', '#22C55E', 1)
        RETURNING id INTO v_pq_pillar_id;

        -- IQ pillar
        INSERT INTO public.framework_pillars (framework_id, name, slug, description, color, display_order)
        VALUES (v_framework_id, 'Intellectual Intelligence (IQ)', 'iq', 'Clinical Acumen & Critical Thinking', '#8B5CF6', 2)
        RETURNING id INTO v_iq_pillar_id;

        -- EQ attributes
        INSERT INTO public.framework_attributes (pillar_id, framework_id, name, slug, description, display_order, tags, category) VALUES
        (v_eq_pillar_id, v_framework_id, 'Empathy & Positive Interactions', 'eq_empathy_positive_interactions',
         'Patient/family rapport, compassionate care', 0,
         ARRAY['interpersonal', 'patient-facing', 'communication'], 'communication'),
        (v_eq_pillar_id, v_framework_id, 'Adaptability & Self-Awareness', 'eq_adaptability_self_awareness',
         'Flexibility, insight into strengths/weaknesses', 1,
         ARRAY['intrapersonal', 'self-assessment', 'adaptability'], 'self-regulation'),
        (v_eq_pillar_id, v_framework_id, 'Stress Management & Resilience', 'eq_stress_management_resilience',
         'Performance under pressure, emotional regulation', 2,
         ARRAY['intrapersonal', 'resilience', 'crisis-management'], 'self-regulation'),
        (v_eq_pillar_id, v_framework_id, 'Curiosity & Growth Mindset', 'eq_curiosity_growth_mindset',
         'Learning drive, seeking improvement', 3,
         ARRAY['intrapersonal', 'learning', 'growth'], 'learning'),
        (v_eq_pillar_id, v_framework_id, 'Effective Communication', 'eq_effectiveness_communication',
         'Team communication, handoffs, presentations', 4,
         ARRAY['interpersonal', 'communication', 'teamwork'], 'communication');

        -- PQ attributes
        INSERT INTO public.framework_attributes (pillar_id, framework_id, name, slug, description, display_order, tags, category) VALUES
        (v_pq_pillar_id, v_framework_id, 'Work Ethic & Reliability', 'pq_work_ethic_reliability',
         'Dedication, punctuality, follow-through', 0,
         ARRAY['professionalism', 'reliability', 'work-ethic'], 'professionalism'),
        (v_pq_pillar_id, v_framework_id, 'Integrity & Accountability', 'pq_integrity_accountability',
         'Ethics, honesty, ownership of mistakes', 1,
         ARRAY['professionalism', 'ethics', 'accountability'], 'professionalism'),
        (v_pq_pillar_id, v_framework_id, 'Teachability & Receptiveness', 'pq_teachability_receptiveness',
         'Accepting feedback, implementing suggestions', 2,
         ARRAY['learning', 'feedback', 'receptiveness'], 'learning'),
        (v_pq_pillar_id, v_framework_id, 'Clear & Timely Documentation', 'pq_documentation',
         'Charting quality, completeness, timeliness', 3,
         ARRAY['documentation', 'clinical', 'efficiency'], 'documentation'),
        (v_pq_pillar_id, v_framework_id, 'Leadership & Relationships', 'pq_leadership_relationships',
         'Team dynamics, leadership potential', 4,
         ARRAY['leadership', 'interpersonal', 'teamwork'], 'leadership');

        -- IQ attributes
        INSERT INTO public.framework_attributes (pillar_id, framework_id, name, slug, description, display_order, tags, category) VALUES
        (v_iq_pillar_id, v_framework_id, 'Strong Knowledge Base', 'iq_knowledge_base',
         'Medical knowledge breadth and depth', 0,
         ARRAY['clinical-knowledge', 'medical-knowledge'], 'clinical-reasoning'),
        (v_iq_pillar_id, v_framework_id, 'Analytical Thinking', 'iq_analytical_thinking',
         'Clinical reasoning, differential diagnosis', 1,
         ARRAY['clinical-reasoning', 'critical-thinking', 'diagnosis'], 'clinical-reasoning'),
        (v_iq_pillar_id, v_framework_id, 'Commitment to Learning', 'iq_commitment_learning',
         'Acquiring new information, staying current', 2,
         ARRAY['learning', 'self-directed', 'growth'], 'learning'),
        (v_iq_pillar_id, v_framework_id, 'Clinical Flexibility', 'iq_clinical_flexibility',
         'Adjusting approach based on new information', 3,
         ARRAY['clinical-reasoning', 'adaptability', 'decision-making'], 'clinical-reasoning'),
        (v_iq_pillar_id, v_framework_id, 'Performance for Level', 'iq_performance_for_level',
         'Overall clinical performance relative to peers', 4,
         ARRAY['clinical-performance', 'milestone', 'overall'], 'clinical-performance');

        RAISE NOTICE 'Seeded MHS EM framework v1 with 3 pillars and 15 attributes';
    ELSE
        RAISE NOTICE 'MHS EM framework v1 already exists, skipping';
    END IF;

    -- Seed ACGME competency framework (for future mapping)
    IF NOT EXISTS (SELECT 1 FROM public.competency_frameworks WHERE abbreviation = 'ACGME') THEN
        INSERT INTO public.competency_frameworks (name, abbreviation, version, description, source_url)
        VALUES (
            'ACGME Core Competencies',
            'ACGME',
            '2022',
            'Accreditation Council for Graduate Medical Education core competency domains',
            'https://www.acgme.org/what-we-do/accreditation/milestones/'
        )
        RETURNING id INTO v_acgme_id;

        INSERT INTO public.competency_items (framework_id, code, name, description, display_order) VALUES
        (v_acgme_id, 'PC', 'Patient Care', 'Compassionate, appropriate, and effective patient care', 0),
        (v_acgme_id, 'MK', 'Medical Knowledge', 'Knowledge of biomedical, clinical, and social sciences', 1),
        (v_acgme_id, 'SBP', 'Systems-Based Practice', 'Awareness of and responsiveness to the larger context of health care', 2),
        (v_acgme_id, 'PBLI', 'Practice-Based Learning & Improvement', 'Ability to investigate and evaluate patient care practices', 3),
        (v_acgme_id, 'PROF', 'Professionalism', 'Commitment to professional responsibilities and ethical principles', 4),
        (v_acgme_id, 'ICS', 'Interpersonal & Communication Skills', 'Effective information exchange and teaming with patients and colleagues', 5);

        RAISE NOTICE 'Seeded ACGME competency framework with 6 core competencies';
    END IF;
END $$;

-- ============================================================================
-- 11. RLS POLICIES
-- ============================================================================

ALTER TABLE public.evaluation_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.framework_pillars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.framework_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competency_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competency_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attribute_competency_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.framework_ratings ENABLE ROW LEVEL SECURITY;

-- Service role bypass (for API routes)
DROP POLICY IF EXISTS "Service role full access on evaluation_frameworks" ON public.evaluation_frameworks;
CREATE POLICY "Service role full access on evaluation_frameworks"
    ON public.evaluation_frameworks FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service role full access on framework_pillars" ON public.framework_pillars;
CREATE POLICY "Service role full access on framework_pillars"
    ON public.framework_pillars FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service role full access on framework_attributes" ON public.framework_attributes;
CREATE POLICY "Service role full access on framework_attributes"
    ON public.framework_attributes FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service role full access on competency_frameworks" ON public.competency_frameworks;
CREATE POLICY "Service role full access on competency_frameworks"
    ON public.competency_frameworks FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service role full access on competency_items" ON public.competency_items;
CREATE POLICY "Service role full access on competency_items"
    ON public.competency_items FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service role full access on attribute_competency_mappings" ON public.attribute_competency_mappings;
CREATE POLICY "Service role full access on attribute_competency_mappings"
    ON public.attribute_competency_mappings FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service role full access on framework_ratings" ON public.framework_ratings;
CREATE POLICY "Service role full access on framework_ratings"
    ON public.framework_ratings FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- 12. COMMENTS
-- ============================================================================

COMMENT ON TABLE public.evaluation_frameworks IS 'Per-program, versioned evaluation framework definitions (pillars + attributes)';
COMMENT ON TABLE public.framework_pillars IS 'Pillars (e.g., EQ, PQ, IQ) within an evaluation framework';
COMMENT ON TABLE public.framework_attributes IS 'Attributes within a pillar, with tags and category for cross-cutting analytics';
COMMENT ON TABLE public.competency_frameworks IS 'External competency standards (ACGME, EPA, CanMEDS, etc.)';
COMMENT ON TABLE public.competency_items IS 'Individual competencies within a competency framework';
COMMENT ON TABLE public.attribute_competency_mappings IS 'Many-to-many: which EQ-PQ-IQ attributes map to which competencies';
COMMENT ON TABLE public.framework_ratings IS 'Flexible evaluation scores stored as JSONB, keyed by attribute slug';
COMMENT ON VIEW public.structured_ratings_compat IS 'Backward-compatible view mapping framework_ratings JSONB to the 15-column structured_ratings shape';
