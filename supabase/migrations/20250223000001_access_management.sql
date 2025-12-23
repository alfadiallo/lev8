-- ============================================================================
-- ACCESS MANAGEMENT SYSTEM
-- Adds dual email support, access requests, and user account management
-- ============================================================================

-- ============================================================================
-- 1. UPDATE USER_PROFILES - Add dual email support and account status
-- ============================================================================

-- Add personal_email column
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS personal_email VARCHAR(255);

-- Add institutional_email column
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS institutional_email VARCHAR(255);

-- Add account_status column (active, suspended, pending)
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active'
CHECK (account_status IN ('active', 'suspended', 'pending'));

-- Add invited_by column (who created/invited this user)
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES public.user_profiles(id);

-- Add invited_at timestamp
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ;

-- Add display_name if not exists
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS display_name VARCHAR(255);

-- Add is_active if not exists
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Migrate existing email to personal_email for existing users
UPDATE public.user_profiles
SET personal_email = email
WHERE personal_email IS NULL AND email IS NOT NULL;

-- Create indexes for email lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_personal_email 
ON public.user_profiles(personal_email);

CREATE INDEX IF NOT EXISTS idx_user_profiles_institutional_email 
ON public.user_profiles(institutional_email);

CREATE INDEX IF NOT EXISTS idx_user_profiles_account_status 
ON public.user_profiles(account_status);

-- Comments
COMMENT ON COLUMN public.user_profiles.personal_email IS 'Personal email - primary login, portable across institutions';
COMMENT ON COLUMN public.user_profiles.institutional_email IS 'Institutional/work email - for admin tracking and official communications';
COMMENT ON COLUMN public.user_profiles.account_status IS 'Account status: active, suspended, or pending approval';
COMMENT ON COLUMN public.user_profiles.invited_by IS 'UUID of admin who created/invited this user';
COMMENT ON COLUMN public.user_profiles.invited_at IS 'Timestamp when user was invited';

-- ============================================================================
-- 2. CREATE ACCESS_REQUESTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Contact information
    personal_email VARCHAR(255) NOT NULL,
    institutional_email VARCHAR(255),
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    
    -- Role and program info
    requested_role VARCHAR(50) DEFAULT 'resident'
        CHECK (requested_role IN ('resident', 'faculty', 'program_director')),
    program_id UUID REFERENCES public.programs(id),
    medical_school VARCHAR(255),
    specialty VARCHAR(255),
    
    -- Request details
    reason TEXT,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    
    -- Admin review
    reviewed_by UUID REFERENCES public.user_profiles(id),
    reviewed_at TIMESTAMPTZ,
    admin_notes TEXT,
    
    -- If approved, link to created user
    created_user_id UUID REFERENCES public.user_profiles(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for access_requests
CREATE INDEX IF NOT EXISTS idx_access_requests_status 
ON public.access_requests(status);

CREATE INDEX IF NOT EXISTS idx_access_requests_personal_email 
ON public.access_requests(personal_email);

CREATE INDEX IF NOT EXISTS idx_access_requests_created_at 
ON public.access_requests(created_at DESC);

-- Comments
COMMENT ON TABLE public.access_requests IS 'Pending access requests from users wanting to join the platform';
COMMENT ON COLUMN public.access_requests.status IS 'Request status: pending, approved, rejected, or expired';
COMMENT ON COLUMN public.access_requests.created_user_id IS 'Links to user_profiles if request was approved and account created';

-- ============================================================================
-- 3. CREATE ADMIN_ACTIVITY_LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Who performed the action
    admin_id UUID NOT NULL REFERENCES public.user_profiles(id),
    
    -- What action was performed
    action VARCHAR(100) NOT NULL,
    action_type VARCHAR(50) NOT NULL
        CHECK (action_type IN ('user_created', 'user_updated', 'user_suspended', 'user_reactivated', 
                               'request_approved', 'request_rejected', 'password_reset', 'role_changed')),
    
    -- Target of the action
    target_user_id UUID REFERENCES public.user_profiles(id),
    target_request_id UUID REFERENCES public.access_requests(id),
    
    -- Additional details
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for admin_activity_log
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_id 
ON public.admin_activity_log(admin_id);

CREATE INDEX IF NOT EXISTS idx_admin_activity_log_action_type 
ON public.admin_activity_log(action_type);

CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at 
ON public.admin_activity_log(created_at DESC);

-- Comments
COMMENT ON TABLE public.admin_activity_log IS 'Audit log of all admin actions for security and compliance';

-- ============================================================================
-- 4. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Access Requests: Public can insert (anyone can request access)
CREATE POLICY access_requests_insert_public ON public.access_requests
    FOR INSERT
    WITH CHECK (true);

-- Access Requests: Only admins can view/update
CREATE POLICY access_requests_select_admin ON public.access_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND role IN ('super_admin', 'program_director')
        )
    );

CREATE POLICY access_requests_update_admin ON public.access_requests
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND role IN ('super_admin', 'program_director')
        )
    );

-- Admin Activity Log: Only super_admins can view
CREATE POLICY admin_activity_log_select ON public.admin_activity_log
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND role = 'super_admin'
        )
    );

-- Admin Activity Log: Admins can insert
CREATE POLICY admin_activity_log_insert ON public.admin_activity_log
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND role IN ('super_admin', 'program_director')
        )
    );

-- ============================================================================
-- 5. HELPER FUNCTION: Get pending request count
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_pending_request_count()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT COUNT(*)::INTEGER
    FROM public.access_requests
    WHERE status = 'pending';
$$;

-- Grant execute to authenticated users (admins will check in app)
GRANT EXECUTE ON FUNCTION public.get_pending_request_count() TO authenticated;

-- ============================================================================
-- 6. TRIGGER: Update updated_at on access_requests
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_access_request_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS access_requests_updated_at ON public.access_requests;
CREATE TRIGGER access_requests_updated_at
    BEFORE UPDATE ON public.access_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_access_request_updated_at();

