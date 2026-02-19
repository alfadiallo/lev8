-- =====================================================
-- EQ·PQ·IQ Unified Visitor Tracking
-- =====================================================
-- Replaces the per-product tracking (pulsecheck_demo_visitors)
-- with a unified visitor system across all eqpqiq.com pages.

-- Table to store visitor profiles
CREATE TABLE IF NOT EXISTS eqpqiq_visitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    first_visit TIMESTAMPTZ DEFAULT NOW(),
    last_visit TIMESTAMPTZ DEFAULT NOW(),
    visit_count INTEGER DEFAULT 1,
    first_page TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_eqpqiq_visitors_visitor_id ON eqpqiq_visitors(visitor_id);
CREATE INDEX IF NOT EXISTS idx_eqpqiq_visitors_email ON eqpqiq_visitors(email);

-- Enable RLS
ALTER TABLE eqpqiq_visitors ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access to eqpqiq_visitors"
    ON eqpqiq_visitors
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Table to log every page view
CREATE TABLE IF NOT EXISTS eqpqiq_page_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id TEXT NOT NULL REFERENCES eqpqiq_visitors(visitor_id),
    page_path TEXT NOT NULL,
    visited_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_eqpqiq_page_visits_visitor_id ON eqpqiq_page_visits(visitor_id);
CREATE INDEX IF NOT EXISTS idx_eqpqiq_page_visits_page_path ON eqpqiq_page_visits(page_path);

-- Enable RLS
ALTER TABLE eqpqiq_page_visits ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access to eqpqiq_page_visits"
    ON eqpqiq_page_visits
    FOR ALL
    USING (true)
    WITH CHECK (true);
