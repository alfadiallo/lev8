-- EPI·Q Profile Redistribution
-- Replaces random role distribution with realistic EM residency counts:
--   MS3: 23, MS4: 35, PGY 1: 15, PGY 2: 15, PGY 3: 15, Graduate: 167
-- Removes PGY 4 (EM is 3-year). Adds Graduate role.
-- Engineers distinct variance profiles per PGY class to showcase data-driven amplitudes.

-- ============================================================================
-- 1. CLEAR ALL DEMO DATA
-- ============================================================================

DELETE FROM public.epiq_profile_history;
DELETE FROM public.epiq_profile_scores;
DELETE FROM public.epiq_profiles;

-- ============================================================================
-- 2. UPDATE CHECK CONSTRAINTS
-- ============================================================================

ALTER TABLE public.epiq_profiles DROP CONSTRAINT IF EXISTS epiq_profiles_role_check;
ALTER TABLE public.epiq_profiles
    ADD CONSTRAINT epiq_profiles_role_check
    CHECK (role IN ('MS3', 'MS4', 'PGY 1', 'PGY 2', 'PGY 3', 'Graduate'));

ALTER TABLE public.epiq_profile_history DROP CONSTRAINT IF EXISTS epiq_profile_history_period_check;
ALTER TABLE public.epiq_profile_history
    ADD CONSTRAINT epiq_profile_history_period_check
    CHECK (period IN ('MS3', 'MS4', 'PGY 1', 'PGY 2', 'PGY 3', 'Graduate'));

-- ============================================================================
-- 3. SEED 270 PROFILES WITH DETERMINISTIC ROLE COUNTS
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

    -- Role distribution: (role, count) pairs processed in order
    role_defs TEXT[] := ARRAY['MS3','MS4','PGY 1','PGY 2','PGY 3','Graduate'];
    role_counts INTEGER[] := ARRAY[23, 35, 15, 15, 15, 167];

    r_idx INTEGER;
    i INTEGER;
    j INTEGER;
    pid UUID;
    v_role TEXT;
    base_score NUMERIC;
    spread NUMERIC;
    raw_score INTEGER;
    total_seeded INTEGER := 0;
BEGIN
    FOR r_idx IN 1..array_length(role_defs, 1) LOOP
        v_role := role_defs[r_idx];

        FOR i IN 1..role_counts[r_idx] LOOP
            pid := gen_random_uuid();

            -- Engineered variance per PGY class; others use natural randomization
            CASE v_role
                WHEN 'PGY 1' THEN
                    -- TIGHT cluster: everyone near 60-70, low variance -> flat wave
                    base_score := 60 + random() * 10;
                    spread := 3 + random() * 2;
                WHEN 'PGY 2' THEN
                    -- WIDE spread: scores all over 30-90, high variance -> tall wave
                    base_score := 40 + random() * 40;
                    spread := 14 + random() * 10;
                WHEN 'PGY 3' THEN
                    -- MODERATE: middle ground spread
                    base_score := 55 + random() * 20;
                    spread := 8 + random() * 6;
                ELSE
                    -- Natural randomization for MS3, MS4, Graduate
                    base_score := 40 + random() * 50;
                    spread := 8 + random() * 16;
            END CASE;

            INSERT INTO public.epiq_profiles (id, first_name, last_name, role, cohort_label, is_demo)
            VALUES (
                pid,
                first_names[1 + floor(random() * array_length(first_names, 1))::int],
                last_names[1 + floor(random() * array_length(last_names, 1))::int],
                v_role,
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

            total_seeded := total_seeded + 1;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Seeded % profiles with deterministic role counts', total_seeded;
END $$;

-- ============================================================================
-- 4. SEED TRAJECTORY HISTORY + ARCHETYPE CLASSIFICATION
-- ============================================================================

DO $$
DECLARE
    rec RECORD;
    profile_count INTEGER;
    archetype_index INTEGER := 0;
    assigned_archetype TEXT;
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

    all_periods TEXT[] := ARRAY['MS3', 'MS4', 'PGY 1', 'PGY 2', 'PGY 3', 'Graduate'];
    rand_val NUMERIC;
    prior_periods TEXT[];

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
    profile_count := 0;
    FOR rec IN SELECT id, role FROM public.epiq_profiles ORDER BY id LOOP
        profile_count := profile_count + 1;

        prior_periods := ARRAY[]::TEXT[];
        rand_val := random();

        CASE rec.role
            WHEN 'MS3' THEN
                NULL;
            WHEN 'MS4' THEN
                IF rand_val < 0.5 THEN
                    prior_periods := ARRAY['MS3'];
                END IF;
            WHEN 'PGY 1' THEN
                IF rand_val < 0.33 THEN
                    prior_periods := ARRAY['MS3', 'MS4'];
                ELSIF rand_val < 0.66 THEN
                    prior_periods := ARRAY['MS4'];
                END IF;
            WHEN 'PGY 2' THEN
                IF rand_val < 0.5 THEN
                    IF random() < 0.5 THEN
                        prior_periods := ARRAY['MS3', 'MS4', 'PGY 1'];
                    ELSE
                        prior_periods := ARRAY['MS4', 'PGY 1'];
                    END IF;
                ELSE
                    prior_periods := ARRAY['PGY 1'];
                END IF;
            WHEN 'PGY 3' THEN
                IF rand_val < 0.5 THEN
                    IF random() < 0.5 THEN
                        prior_periods := ARRAY['MS3', 'MS4', 'PGY 1', 'PGY 2'];
                    ELSE
                        prior_periods := ARRAY['MS4', 'PGY 1', 'PGY 2'];
                    END IF;
                ELSE
                    prior_periods := ARRAY['PGY 1', 'PGY 2'];
                END IF;
            WHEN 'Graduate' THEN
                -- Graduates have the richest history
                IF rand_val < 0.4 THEN
                    prior_periods := ARRAY['MS3', 'MS4', 'PGY 1', 'PGY 2', 'PGY 3'];
                ELSIF rand_val < 0.7 THEN
                    prior_periods := ARRAY['MS4', 'PGY 1', 'PGY 2', 'PGY 3'];
                ELSE
                    prior_periods := ARRAY['PGY 1', 'PGY 2', 'PGY 3'];
                END IF;
        END CASE;

        n_points := array_length(prior_periods, 1);
        IF n_points IS NULL THEN n_points := 0; END IF;
        n_points := n_points + 1;

        assigned_archetype := archetypes[1 + (archetype_index % num_archetypes)];
        archetype_index := archetype_index + 1;
        confidence := 0.75 + random() * 0.20;

        scores := ARRAY[]::INTEGER[];

        CASE assigned_archetype
            WHEN 'elite_performer' THEN
                base_score := 82 + floor(random() * 13)::int;
                FOR i IN 1..n_points LOOP
                    s := GREATEST(75, LEAST(100, base_score + floor((random()-0.4) * 8)::int));
                    scores := scores || s;
                END LOOP;

            WHEN 'elite_late_struggle' THEN
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
                base_score := 28 + floor(random() * 12)::int;
                FOR i IN 1..n_points LOOP
                    delta := (i - 1) * (6 + floor(random() * 5)::int);
                    s := GREATEST(22, LEAST(85, base_score + delta));
                    scores := scores || s;
                END LOOP;

            WHEN 'steady_climber' THEN
                base_score := 45 + floor(random() * 15)::int;
                FOR i IN 1..n_points LOOP
                    delta := (i - 1) * (5 + floor(random() * 6)::int);
                    s := GREATEST(40, LEAST(95, base_score + delta));
                    scores := scores || s;
                END LOOP;

            WHEN 'continuous_decline' THEN
                base_score := 65 + floor(random() * 15)::int;
                FOR i IN 1..n_points LOOP
                    delta := (i - 1) * (8 + floor(random() * 7)::int);
                    s := GREATEST(22, LEAST(90, base_score - delta));
                    scores := scores || s;
                END LOOP;

            WHEN 'variable' THEN
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

        -- Insert current period history row
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

        -- Scale attribute scores to match trajectory endpoint
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
