-- =====================================================
-- PULSE CHECK - Frequency Configuration
-- Adds frequency settings at healthsystem and site levels
-- =====================================================

-- Add frequency configuration to healthsystems (default for all sites)
ALTER TABLE pulsecheck_healthsystems
ADD COLUMN IF NOT EXISTS default_frequency TEXT DEFAULT 'quarterly' 
    CHECK (default_frequency IN ('quarterly', 'biannually', 'annually')),
ADD COLUMN IF NOT EXISTS default_cycle_start_month INTEGER DEFAULT 1 
    CHECK (default_cycle_start_month BETWEEN 1 AND 12);

-- Add frequency override to sites (inherits from healthsystem if null)
ALTER TABLE pulsecheck_sites
ADD COLUMN IF NOT EXISTS frequency_override TEXT 
    CHECK (frequency_override IS NULL OR frequency_override IN ('quarterly', 'biannually', 'annually')),
ADD COLUMN IF NOT EXISTS cycle_start_month_override INTEGER 
    CHECK (cycle_start_month_override IS NULL OR cycle_start_month_override BETWEEN 1 AND 12);

-- Add comments for documentation
COMMENT ON COLUMN pulsecheck_healthsystems.default_frequency IS 'Default pulse check frequency for all sites in healthsystem (quarterly, biannually, annually)';
COMMENT ON COLUMN pulsecheck_healthsystems.default_cycle_start_month IS 'Month when cycles start (1=January, 12=December)';
COMMENT ON COLUMN pulsecheck_sites.frequency_override IS 'Site-specific frequency override (null = inherit from healthsystem)';
COMMENT ON COLUMN pulsecheck_sites.cycle_start_month_override IS 'Site-specific cycle start month override (null = inherit from healthsystem)';

-- Create a view to get effective frequency for each site
CREATE OR REPLACE VIEW pulsecheck_site_settings AS
SELECT 
    s.id as site_id,
    s.name as site_name,
    s.healthsystem_id,
    h.name as healthsystem_name,
    COALESCE(s.frequency_override, h.default_frequency, 'quarterly') as effective_frequency,
    COALESCE(s.cycle_start_month_override, h.default_cycle_start_month, 1) as effective_cycle_start_month,
    s.frequency_override,
    s.cycle_start_month_override,
    h.default_frequency,
    h.default_cycle_start_month
FROM pulsecheck_sites s
LEFT JOIN pulsecheck_healthsystems h ON s.healthsystem_id = h.id;
