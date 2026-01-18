-- =====================================================
-- Pulse Check Demo Visitors Tracking
-- =====================================================

-- Table to track demo visitors
CREATE TABLE IF NOT EXISTS pulsecheck_demo_visitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id TEXT UNIQUE NOT NULL,
    email TEXT,
    ip_address TEXT,
    user_agent TEXT,
    first_visit TIMESTAMPTZ DEFAULT NOW(),
    last_visit TIMESTAMPTZ DEFAULT NOW(),
    visit_count INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_demo_visitors_visitor_id ON pulsecheck_demo_visitors(visitor_id);
CREATE INDEX IF NOT EXISTS idx_demo_visitors_email ON pulsecheck_demo_visitors(email);

-- Enable RLS
ALTER TABLE pulsecheck_demo_visitors ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access to demo_visitors"
    ON pulsecheck_demo_visitors
    FOR ALL
    USING (true)
    WITH CHECK (true);
