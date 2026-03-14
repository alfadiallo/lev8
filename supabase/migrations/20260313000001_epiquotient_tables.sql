-- EPI·Q Performance Fingerprint tables for epiquotient.com
-- Dedicated tables for the particle wave visualization, isolated from production data.

-- ============================================================================
-- TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.epiq_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('MS3', 'MS4', 'Intern', 'R1', 'R2', 'R3')),
    cohort_label TEXT DEFAULT 'EM Residency 2025',
    is_demo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.epiq_profile_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.epiq_profiles(id) ON DELETE CASCADE,
    pillar TEXT NOT NULL CHECK (pillar IN ('eq', 'pq', 'iq')),
    attribute_slug TEXT NOT NULL,
    attribute_label TEXT NOT NULL,
    score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
    display_order INTEGER NOT NULL DEFAULT 0,
    UNIQUE(profile_id, pillar, attribute_slug)
);

CREATE INDEX idx_epiq_profile_scores_profile ON public.epiq_profile_scores(profile_id);
CREATE INDEX idx_epiq_profile_scores_pillar ON public.epiq_profile_scores(pillar);

-- ============================================================================
-- RLS (public read, no write from client)
-- ============================================================================

ALTER TABLE public.epiq_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epiq_profile_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "epiq_profiles_public_read" ON public.epiq_profiles
    FOR SELECT USING (true);

CREATE POLICY "epiq_profile_scores_public_read" ON public.epiq_profile_scores
    FOR SELECT USING (true);

-- ============================================================================
-- SEED 270 DEMO PROFILES
-- Uses plpgsql to generate randomized data matching the PRD distribution.
-- ============================================================================

DO $$
DECLARE
    first_names TEXT[] := ARRAY[
        'Amara','James','Sofia','Marcus','Priya','Elena','Tyler','Fatima',
        'Alex','Jordan','Maya','Darius','Zoe','Nathan','Aisha','Luca','Mia','David',
        'Nia','Ethan','Chloe','Omar','Leila','Ryan','Kenji','Ana','Samuel','Nadia',
        'Derek','Yuki','Caleb','Sasha','Tobias','Ingrid','Rafael','Lena','Emmanuel',
        'Clara','Idris','Vera','Jin','Ayasha','Callum','Freya','Tariq','Simone',
        'Brendan','Kofi','Mei','Lucas'
    ];
    last_names TEXT[] := ARRAY[
        'Chen','Johnson','Patel','Williams','Rodriguez','Kim','Thompson',
        'Okafor','Martinez','Singh','Jackson','Nguyen','Brown','Lee','Wilson','Garcia',
        'Anderson','Thomas','White','Harris','Taylor','Martin','Moore','Davis','Clark',
        'Walker','Hall','Allen','Young','Hernandez','King','Wright','Scott','Green',
        'Adams','Baker','Diaz','Reyes','Cruz','Mitchell','Carter','Phillips','Evans',
        'Turner','Torres','Parker','Collins','Edwards','Stewart','Morris'
    ];
    roles TEXT[] := ARRAY['MS3','MS4','Intern','R1','R2','R3'];

    eq_slugs TEXT[] := ARRAY['empathy','adaptability','stress_mgmt','curiosity','communication'];
    eq_labels TEXT[] := ARRAY[
        'Empathy & Positive Interactions',
        'Adaptability & Self-Awareness',
        'Stress Management & Resilience',
        'Curiosity & Growth Mindset',
        'Communication Effectiveness'
    ];

    pq_slugs TEXT[] := ARRAY['work_ethic','teachability','integrity','documentation','leadership'];
    pq_labels TEXT[] := ARRAY[
        'Work Ethic & Professional Presence',
        'Teachability & Receptiveness',
        'Integrity & Accountability',
        'Clear & Timely Documentation',
        'Leadership & Relationship Building'
    ];

    iq_slugs TEXT[] := ARRAY['knowledge_base','learning_commit','analytical_thinking','clinical_adapt','clinical_perf'];
    iq_labels TEXT[] := ARRAY[
        'Strong Knowledge Base',
        'Commitment to Learning',
        'Analytical Thinking & Problem-Solving',
        'Adaptability in Clinical Reasoning',
        'Clinical Performance for Year of Training'
    ];

    i INTEGER;
    pid UUID;
    base_score NUMERIC;
    spread NUMERIC;
    raw_score INTEGER;
    j INTEGER;
BEGIN
    FOR i IN 1..270 LOOP
        pid := gen_random_uuid();
        base_score := 40 + random() * 50;  -- 40-90 center
        spread := 8 + random() * 16;       -- 8-24 spread

        INSERT INTO public.epiq_profiles (id, first_name, last_name, role, cohort_label, is_demo)
        VALUES (
            pid,
            first_names[1 + floor(random() * array_length(first_names, 1))::int],
            last_names[1 + floor(random() * array_length(last_names, 1))::int],
            roles[1 + floor(random() * array_length(roles, 1))::int],
            'EM Residency 2025',
            true
        );

        -- EQ attributes
        FOR j IN 1..5 LOOP
            raw_score := GREATEST(22, LEAST(100,
                round(base_score + (random() - 0.5) * spread * 2)::int
            ));
            INSERT INTO public.epiq_profile_scores (profile_id, pillar, attribute_slug, attribute_label, score, display_order)
            VALUES (pid, 'eq', eq_slugs[j], eq_labels[j], raw_score, j);
        END LOOP;

        -- PQ attributes
        FOR j IN 1..5 LOOP
            raw_score := GREATEST(22, LEAST(100,
                round(base_score + (random() - 0.5) * spread * 2)::int
            ));
            INSERT INTO public.epiq_profile_scores (profile_id, pillar, attribute_slug, attribute_label, score, display_order)
            VALUES (pid, 'pq', pq_slugs[j], pq_labels[j], raw_score, j);
        END LOOP;

        -- IQ attributes
        FOR j IN 1..5 LOOP
            raw_score := GREATEST(22, LEAST(100,
                round(base_score + (random() - 0.5) * spread * 2)::int
            ));
            INSERT INTO public.epiq_profile_scores (profile_id, pillar, attribute_slug, attribute_label, score, display_order)
            VALUES (pid, 'iq', iq_slugs[j], iq_labels[j], raw_score, j);
        END LOOP;
    END LOOP;
END $$;
