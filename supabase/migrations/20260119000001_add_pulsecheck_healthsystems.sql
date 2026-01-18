-- =====================================================
-- ADD HEALTHSYSTEM LEVEL TO PULSE CHECK
-- Adds healthsystem as organizational level above sites
-- =====================================================

-- Healthsystems (parent organization level)
CREATE TABLE IF NOT EXISTS pulsecheck_healthsystems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    abbreviation TEXT,
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add healthsystem_id to sites
ALTER TABLE pulsecheck_sites
ADD COLUMN IF NOT EXISTS healthsystem_id UUID REFERENCES pulsecheck_healthsystems(id) ON DELETE SET NULL;

-- Create index for healthsystem lookups
CREATE INDEX IF NOT EXISTS idx_pulsecheck_sites_healthsystem ON pulsecheck_sites(healthsystem_id);

-- Add healthsystem_id to directors for healthsystem-level roles (e.g., regional directors)
ALTER TABLE pulsecheck_directors
ADD COLUMN IF NOT EXISTS healthsystem_id UUID REFERENCES pulsecheck_healthsystems(id) ON DELETE SET NULL;

-- Create index for healthsystem director lookups
CREATE INDEX IF NOT EXISTS idx_pulsecheck_directors_healthsystem ON pulsecheck_directors(healthsystem_id);

-- Make department_id nullable for healthsystem-level directors
-- Regional directors can be associated with a healthsystem instead of a specific department
-- First, we need to handle existing NOT NULL constraint
DO $$ 
BEGIN
    -- Check if column has NOT NULL constraint and drop it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pulsecheck_directors' 
        AND column_name = 'department_id' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE pulsecheck_directors ALTER COLUMN department_id DROP NOT NULL;
    END IF;
END $$;

-- Add constraint: directors must have at least one organizational association
-- Allow both to be set (for flexibility) or one or the other
ALTER TABLE pulsecheck_directors
DROP CONSTRAINT IF EXISTS pulsecheck_directors_org_check;

ALTER TABLE pulsecheck_directors
ADD CONSTRAINT pulsecheck_directors_org_check 
CHECK (
    department_id IS NOT NULL OR healthsystem_id IS NOT NULL
);

-- Enable RLS on healthsystems
ALTER TABLE pulsecheck_healthsystems ENABLE ROW LEVEL SECURITY;

-- Service role has full access to healthsystems
CREATE POLICY "Service role has full access to pulsecheck_healthsystems"
    ON pulsecheck_healthsystems FOR ALL
    USING (true)
    WITH CHECK (true);

-- Add update trigger for healthsystems
CREATE TRIGGER update_pulsecheck_healthsystems_updated_at
    BEFORE UPDATE ON pulsecheck_healthsystems
    FOR EACH ROW EXECUTE FUNCTION update_pulsecheck_updated_at();
