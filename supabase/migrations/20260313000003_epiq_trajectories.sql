-- EPI·Q Trajectory History + Archetype Classification
-- Adds historical composite scores per period and assigns archetypes.

-- ============================================================================
-- 1. HISTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.epiq_profile_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.epiq_profiles(id) ON DELETE CASCADE,
    period TEXT NOT NULL CHECK (period IN ('MS3', 'MS4', 'PGY 1', 'PGY 2', 'PGY 3', 'PGY 4')),
    composite_score INTEGER NOT NULL CHECK (composite_score BETWEEN 0 AND 100),
    eq_score INTEGER CHECK (eq_score BETWEEN 0 AND 100),
    pq_score INTEGER CHECK (pq_score BETWEEN 0 AND 100),
    iq_score INTEGER CHECK (iq_score BETWEEN 0 AND 100),
    UNIQUE(profile_id, period)
);

CREATE INDEX idx_epiq_history_profile ON public.epiq_profile_history(profile_id);

ALTER TABLE public.epiq_profile_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "epiq_history_public_read" ON public.epiq_profile_history
    FOR SELECT USING (true);

-- ============================================================================
-- 2. ARCHETYPE COLUMNS ON PROFILES
-- ============================================================================

ALTER TABLE public.epiq_profiles ADD COLUMN IF NOT EXISTS archetype_id TEXT;
ALTER TABLE public.epiq_profiles ADD COLUMN IF NOT EXISTS archetype_confidence NUMERIC DEFAULT 0;
ALTER TABLE public.epiq_profiles ADD COLUMN IF NOT EXISTS narrative TEXT;

-- ============================================================================
-- 3. SEED TRAJECTORY DATA
-- ============================================================================

DO $$
DECLARE
    rec RECORD;
    profile_count INTEGER;
    archetype_index INTEGER := 0;
    assigned_archetype TEXT;
    -- 9 archetypes cycled roughly equally
    archetypes TEXT[] := ARRAY[
        'elite_performer',
        'breakthrough_performer',
        'late_bloomer',
        'steady_climber',
        'elite_late_struggle',
        'variable',
        'peak_decline',
        'continuous_decline',
        'sophomore_slump_recovery'
    ];
    num_archetypes INTEGER := 9;

    -- Period ordering
    all_periods TEXT[] := ARRAY['MS3', 'MS4', 'PGY 1', 'PGY 2', 'PGY 3', 'PGY 4'];
    current_period_idx INTEGER;
    has_ms3 BOOLEAN;
    has_ms4 BOOLEAN;
    rand_val NUMERIC;
    prior_periods TEXT[];

    -- Score generation
    scores INTEGER[];
    n_points INTEGER;
    base_score INTEGER;
    s INTEGER;
    i INTEGER;
    delta INTEGER;
    confidence NUMERIC;
    old_composite INTEGER;
    scale_factor NUMERIC;
BEGIN
    -- Process each profile
    profile_count := 0;
    FOR rec IN SELECT id, role FROM public.epiq_profiles ORDER BY id LOOP
        profile_count := profile_count + 1;

        -- Determine current period index (0-based)
        current_period_idx := array_position(all_periods, rec.role) - 1;

        -- Determine which prior periods this profile has
        prior_periods := ARRAY[]::TEXT[];
        has_ms3 := false;
        has_ms4 := false;
        rand_val := random();

        CASE rec.role
            WHEN 'MS3' THEN
                -- No prior data
                NULL;
            WHEN 'MS4' THEN
                -- 50% have MS3
                IF rand_val < 0.5 THEN
                    has_ms3 := true;
                    prior_periods := array_append(prior_periods, 'MS3');
                END IF;
            WHEN 'PGY 1' THEN
                -- 33% MS3+MS4, 33% MS4 only, 33% none
                IF rand_val < 0.33 THEN
                    has_ms3 := true; has_ms4 := true;
                    prior_periods := ARRAY['MS3', 'MS4'];
                ELSIF rand_val < 0.66 THEN
                    has_ms4 := true;
                    prior_periods := ARRAY['MS4'];
                END IF;
            WHEN 'PGY 2' THEN
                -- 100% PGY 1; 50% MS4 (and if MS4, 50% chance of MS3)
                IF rand_val < 0.5 THEN
                    has_ms4 := true;
                    IF random() < 0.5 THEN
                        has_ms3 := true;
                        prior_periods := ARRAY['MS3', 'MS4', 'PGY 1'];
                    ELSE
                        prior_periods := ARRAY['MS4', 'PGY 1'];
                    END IF;
                ELSE
                    prior_periods := ARRAY['PGY 1'];
                END IF;
            WHEN 'PGY 3' THEN
                -- 100% PGY 1+2; MS data same rules
                IF rand_val < 0.5 THEN
                    has_ms4 := true;
                    IF random() < 0.5 THEN
                        has_ms3 := true;
                        prior_periods := ARRAY['MS3', 'MS4', 'PGY 1', 'PGY 2'];
                    ELSE
                        prior_periods := ARRAY['MS4', 'PGY 1', 'PGY 2'];
                    END IF;
                ELSE
                    prior_periods := ARRAY['PGY 1', 'PGY 2'];
                END IF;
            WHEN 'PGY 4' THEN
                -- 100% PGY 1+2+3; MS data same rules
                IF rand_val < 0.5 THEN
                    has_ms4 := true;
                    IF random() < 0.5 THEN
                        has_ms3 := true;
                        prior_periods := ARRAY['MS3', 'MS4', 'PGY 1', 'PGY 2', 'PGY 3'];
                    ELSE
                        prior_periods := ARRAY['MS4', 'PGY 1', 'PGY 2', 'PGY 3'];
                    END IF;
                ELSE
                    prior_periods := ARRAY['PGY 1', 'PGY 2', 'PGY 3'];
                END IF;
        END CASE;

        -- Total data points = prior periods + current period
        n_points := array_length(prior_periods, 1);
        IF n_points IS NULL THEN n_points := 0; END IF;
        n_points := n_points + 1;  -- include current

        -- Assign archetype (cycle through equally)
        assigned_archetype := archetypes[1 + (archetype_index % num_archetypes)];
        archetype_index := archetype_index + 1;
        confidence := 0.75 + random() * 0.20;  -- 0.75-0.95

        -- Generate score trajectory based on archetype
        -- We generate n_points scores, last one = current period
        scores := ARRAY[]::INTEGER[];

        CASE assigned_archetype
            WHEN 'elite_performer' THEN
                -- High throughout: 80-95, minor fluctuations
                base_score := 82 + floor(random() * 13)::int;
                FOR i IN 1..n_points LOOP
                    s := GREATEST(75, LEAST(100, base_score + floor((random()-0.4) * 8)::int));
                    scores := scores || s;
                END LOOP;

            WHEN 'elite_late_struggle' THEN
                -- High then drop at end
                base_score := 82 + floor(random() * 10)::int;
                FOR i IN 1..n_points LOOP
                    IF i = n_points THEN
                        s := GREATEST(30, LEAST(55, base_score - 25 - floor(random() * 15)::int));
                    ELSE
                        s := GREATEST(75, LEAST(100, base_score + floor((random()-0.4) * 6)::int));
                    END IF;
                    scores := scores || s;
                END LOOP;

            WHEN 'breakthrough_performer' THEN
                -- Start moderate, big jump, sustain high
                base_score := 42 + floor(random() * 13)::int;
                FOR i IN 1..n_points LOOP
                    IF i <= n_points / 2 THEN
                        s := GREATEST(35, LEAST(60, base_score + floor((random()-0.5) * 8)::int));
                    ELSE
                        s := GREATEST(70, LEAST(95, base_score + 28 + floor(random() * 10)::int));
                    END IF;
                    scores := scores || s;
                END LOOP;

            WHEN 'peak_decline' THEN
                -- Rise then significant fall
                base_score := 50 + floor(random() * 10)::int;
                FOR i IN 1..n_points LOOP
                    IF i <= GREATEST(1, n_points - 1) THEN
                        s := GREATEST(45, LEAST(85, base_score + (i - 1) * (10 + floor(random() * 5)::int)));
                    ELSE
                        s := GREATEST(30, LEAST(55, base_score - floor(random() * 10)::int));
                    END IF;
                    scores := scores || s;
                END LOOP;

            WHEN 'sophomore_slump_recovery' THEN
                -- Decent start, drop, strong recovery
                base_score := 58 + floor(random() * 12)::int;
                FOR i IN 1..n_points LOOP
                    IF i = 1 THEN
                        s := base_score;
                    ELSIF i <= GREATEST(2, n_points / 2 + 1) THEN
                        s := GREATEST(30, LEAST(50, base_score - 18 - floor(random() * 10)::int));
                    ELSE
                        s := GREATEST(70, LEAST(95, base_score + 20 + floor(random() * 12)::int));
                    END IF;
                    scores := scores || s;
                END LOOP;

            WHEN 'late_bloomer' THEN
                -- Low start, gradual improvement
                base_score := 28 + floor(random() * 12)::int;
                FOR i IN 1..n_points LOOP
                    delta := (i - 1) * (6 + floor(random() * 5)::int);
                    s := GREATEST(22, LEAST(85, base_score + delta));
                    scores := scores || s;
                END LOOP;

            WHEN 'steady_climber' THEN
                -- Moderate start, consistent +5-10 each period
                base_score := 45 + floor(random() * 15)::int;
                FOR i IN 1..n_points LOOP
                    delta := (i - 1) * (5 + floor(random() * 6)::int);
                    s := GREATEST(40, LEAST(95, base_score + delta));
                    scores := scores || s;
                END LOOP;

            WHEN 'continuous_decline' THEN
                -- Start moderate-high, lose each period
                base_score := 65 + floor(random() * 15)::int;
                FOR i IN 1..n_points LOOP
                    delta := (i - 1) * (8 + floor(random() * 7)::int);
                    s := GREATEST(22, LEAST(90, base_score - delta));
                    scores := scores || s;
                END LOOP;

            WHEN 'variable' THEN
                -- Oscillating pattern
                base_score := 50 + floor(random() * 15)::int;
                FOR i IN 1..n_points LOOP
                    IF i % 2 = 1 THEN
                        s := GREATEST(35, LEAST(85, base_score + floor(random() * 20)::int));
                    ELSE
                        s := GREATEST(30, LEAST(70, base_score - floor(random() * 20)::int));
                    END IF;
                    scores := scores || s;
                END LOOP;

            ELSE
                -- Fallback: flat
                FOR i IN 1..n_points LOOP
                    scores := scores || (50 + floor(random() * 20)::int);
                END LOOP;
        END CASE;

        -- Insert prior period history rows
        IF array_length(prior_periods, 1) IS NOT NULL THEN
            FOR i IN 1..array_length(prior_periods, 1) LOOP
                INSERT INTO public.epiq_profile_history
                    (profile_id, period, composite_score, eq_score, pq_score, iq_score)
                VALUES (
                    rec.id,
                    prior_periods[i],
                    scores[i],
                    GREATEST(22, LEAST(100, scores[i] + floor((random()-0.5) * 10)::int)),
                    GREATEST(22, LEAST(100, scores[i] + floor((random()-0.5) * 10)::int)),
                    GREATEST(22, LEAST(100, scores[i] + floor((random()-0.5) * 10)::int))
                );
            END LOOP;
        END IF;

        -- Insert current period history row (last score)
        INSERT INTO public.epiq_profile_history
            (profile_id, period, composite_score, eq_score, pq_score, iq_score)
        VALUES (
            rec.id,
            rec.role,
            scores[n_points],
            GREATEST(22, LEAST(100, scores[n_points] + floor((random()-0.5) * 10)::int)),
            GREATEST(22, LEAST(100, scores[n_points] + floor((random()-0.5) * 10)::int)),
            GREATEST(22, LEAST(100, scores[n_points] + floor((random()-0.5) * 10)::int))
        );

        -- Update the profile's current composite to match trajectory endpoint
        -- Scale all 15 attribute scores proportionally
        SELECT ROUND((
            (SELECT COALESCE(AVG(score), 50) FROM public.epiq_profile_scores WHERE profile_id = rec.id AND pillar = 'eq') +
            (SELECT COALESCE(AVG(score), 50) FROM public.epiq_profile_scores WHERE profile_id = rec.id AND pillar = 'pq') +
            (SELECT COALESCE(AVG(score), 50) FROM public.epiq_profile_scores WHERE profile_id = rec.id AND pillar = 'iq')
        ) / 3) INTO old_composite;

        IF old_composite > 0 THEN
            scale_factor := scores[n_points]::numeric / old_composite::numeric;
            UPDATE public.epiq_profile_scores
            SET score = GREATEST(22, LEAST(100, ROUND(score * scale_factor)::int))
            WHERE profile_id = rec.id;
        END IF;

        -- Set archetype on profile
        UPDATE public.epiq_profiles
        SET archetype_id = assigned_archetype,
            archetype_confidence = ROUND(confidence::numeric, 2),
            narrative = NULL
        WHERE id = rec.id;

    END LOOP;

    RAISE NOTICE 'Seeded trajectory data for % profiles', profile_count;
END $$;
