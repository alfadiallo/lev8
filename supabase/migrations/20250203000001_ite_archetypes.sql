-- ITE Archetype System Tables
-- Migration: 20250203000001_ite_archetypes.sql

-- 1. Archetype Definitions
CREATE TABLE IF NOT EXISTS public.archetype_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL UNIQUE,
    description TEXT,
    risk_level VARCHAR CHECK (risk_level IN ('Low', 'Moderate', 'High')),
    
    -- Ranges (stored as JSONB ranges or simple min/max columns)
    -- Using simple columns for easier querying
    pgy1_min NUMERIC(5,2),
    pgy1_max NUMERIC(5,2),
    pgy2_min NUMERIC(5,2),
    pgy2_max NUMERIC(5,2),
    delta_min NUMERIC(5,2),
    delta_max NUMERIC(5,2),
    
    -- Metadata
    color_hex VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Resident Archetypes (The Classification Result)
CREATE TABLE IF NOT EXISTS public.resident_archetypes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id UUID NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
    archetype_id UUID REFERENCES public.archetype_definitions(id) ON DELETE RESTRICT,
    
    -- Classification Details
    confidence NUMERIC(5,2), -- 0.00 to 1.00 or 0-100
    fit_details JSONB, -- Stores why it fit (e.g. { pgy1_match: 0.9, delta_match: 0.8 })
    
    -- Review Status
    needs_review BOOLEAN DEFAULT false,
    review_status VARCHAR DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'overridden', 'dismissed')),
    reviewed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewer_notes TEXT,
    
    -- Similar Residents Cache (Snapshot at time of classification)
    similar_residents JSONB DEFAULT '[]', 
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Only one active classification per resident? 
    -- Or one per analysis run? Let's say one active current one.
    UNIQUE(resident_id)
);

-- RLS
ALTER TABLE public.archetype_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resident_archetypes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for authenticated users" ON public.archetype_definitions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read access for authenticated users" ON public.resident_archetypes
    FOR SELECT USING (auth.role() = 'authenticated');
    
CREATE POLICY "Allow insert/update for authenticated users" ON public.resident_archetypes
    FOR ALL USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_resident_archetypes_resident ON public.resident_archetypes(resident_id);
CREATE INDEX IF NOT EXISTS idx_resident_archetypes_status ON public.resident_archetypes(review_status);

-- Seed Initial Archetypes
INSERT INTO public.archetype_definitions (name, description, risk_level, pgy1_min, pgy1_max, delta_min, delta_max, color_hex)
VALUES 
('Steady Climber', 'Consistent improvement across years', 'Low', 20, 60, 5, 25, '#10B981'),
('Early Surge', 'Significant PGY2 jump, sustains', 'Low', 10, 70, 20, 60, '#3B82F6'),
('Late Bloomer', 'Slow start, accelerates PGY3', 'Low', 0, 40, 0, 20, '#8B5CF6'),
('Sophomore Slump → Recovery', 'PGY2 drop, PGY3 rebound', 'Moderate', null, null, -50, -15, '#F59E0B'),
('High Performer', 'Consistently high scores', 'Low', 70, 100, -10, 10, '#059669'),
('Plateau', 'Minimal change across years', 'Moderate', null, null, -10, 10, '#6B7280'),
('Declining', 'Downward trend', 'High', null, null, -40, -10, '#EF4444'),
('At-Risk', 'Persistently low scores', 'High', 0, 35, null, null, '#DC2626')
ON CONFLICT (name) DO NOTHING;


