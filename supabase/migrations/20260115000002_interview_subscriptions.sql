-- ============================================================================
-- INTERVIEW SUBSCRIPTIONS - Stripe Payment Integration
-- ============================================================================

-- ============================================================================
-- 1. SUBSCRIPTIONS TABLE
-- Track Stripe subscriptions for interview tool access
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.interview_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User reference (may be null for non-lev8 users initially)
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    user_email VARCHAR NOT NULL,
    
    -- Stripe identifiers
    stripe_customer_id VARCHAR,
    stripe_subscription_id VARCHAR UNIQUE,
    
    -- Plan details
    plan_type VARCHAR CHECK (plan_type IN ('monthly', 'annual')),
    
    -- Status tracking
    status VARCHAR NOT NULL DEFAULT 'incomplete' 
        CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'incomplete')),
    
    -- Period tracking
    trial_ends_at TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(user_email)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_interview_subscriptions_email 
    ON public.interview_subscriptions(user_email);
CREATE INDEX IF NOT EXISTS idx_interview_subscriptions_user 
    ON public.interview_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_subscriptions_stripe_customer 
    ON public.interview_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_interview_subscriptions_status 
    ON public.interview_subscriptions(status);

-- ============================================================================
-- 2. USER PROFILES - Add source column
-- Track where user profile was created (lev8 or eqpqiq)
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'source'
    ) THEN
        ALTER TABLE public.user_profiles 
        ADD COLUMN source VARCHAR DEFAULT 'lev8' 
        CHECK (source IN ('lev8', 'eqpqiq'));
    END IF;
END $$;

-- ============================================================================
-- 3. PAYMENT HISTORY (Optional - for audit trail)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.interview_payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES public.interview_subscriptions(id) ON DELETE CASCADE,
    stripe_invoice_id VARCHAR,
    stripe_payment_intent_id VARCHAR,
    amount_paid INTEGER, -- in cents
    currency VARCHAR(3) DEFAULT 'usd',
    status VARCHAR CHECK (status IN ('succeeded', 'failed', 'pending', 'refunded')),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_history_subscription 
    ON public.interview_payment_history(subscription_id);

-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE public.interview_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_payment_history ENABLE ROW LEVEL SECURITY;

-- Subscriptions: Users can view their own subscription
CREATE POLICY "Users can view own subscription" ON public.interview_subscriptions
    FOR SELECT
    USING (
        user_id = auth.uid()
        OR user_email = (SELECT email FROM public.user_profiles WHERE id = auth.uid())
    );

-- Payment history: Users can view their own payment history
CREATE POLICY "Users can view own payment history" ON public.interview_payment_history
    FOR SELECT
    USING (
        subscription_id IN (
            SELECT id FROM public.interview_subscriptions 
            WHERE user_id = auth.uid()
            OR user_email = (SELECT email FROM public.user_profiles WHERE id = auth.uid())
        )
    );

-- ============================================================================
-- 5. FUNCTIONS
-- ============================================================================

-- Function to update subscription status
CREATE OR REPLACE FUNCTION update_subscription_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating timestamp
DROP TRIGGER IF EXISTS tr_subscription_updated ON public.interview_subscriptions;
CREATE TRIGGER tr_subscription_updated
    BEFORE UPDATE ON public.interview_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_subscription_timestamp();

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE public.interview_subscriptions IS 'Stripe subscriptions for eqpqiq.com interview tool';
COMMENT ON TABLE public.interview_payment_history IS 'Payment history audit trail for interview subscriptions';
COMMENT ON COLUMN public.user_profiles.source IS 'Where the user profile was created: lev8 or eqpqiq';
