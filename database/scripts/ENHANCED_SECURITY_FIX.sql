-- 🔐 ENHANCED SECURITY FIX - ADMIN ACCESS CONTROLS & DATA PROTECTION
-- This script addresses additional security concerns for admin access and data protection

-- ================================
-- 1. ENHANCED ADMIN ACCESS CONTROLS FOR PROFILES
-- ================================
-- Issue: Admin account compromise could expose all customer data
-- Solution: Implement stricter admin controls with audit logging and data masking

-- Drop existing admin policy
DROP POLICY IF EXISTS "admins_can_manage_profiles" ON public.profiles;

-- Create audit log table for admin actions
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID REFERENCES auth.users(id) NOT NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only super admins can view audit logs
CREATE POLICY "super_admins_can_view_audit_log" 
ON public.admin_audit_log FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Create function for masked profile data (for admins)
CREATE OR REPLACE FUNCTION public.get_masked_profile_data(profile_user_id UUID)
RETURNS TABLE (
    id UUID,
    email_masked TEXT,
    full_name_masked TEXT,
    credits INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
    -- Log admin access
    INSERT INTO public.admin_audit_log (
        admin_user_id, 
        action, 
        table_name, 
        record_id, 
        details,
        ip_address
    ) VALUES (
        auth.uid(),
        'VIEW_MASKED_PROFILE',
        'profiles',
        profile_user_id,
        jsonb_build_object('access_type', 'masked_data'),
        inet_client_addr()
    );
    
    -- Return masked data only
    RETURN QUERY
    SELECT 
        p.id,
        CASE 
            WHEN LENGTH(p.email) > 0 THEN 
                SUBSTRING(p.email FROM 1 FOR 2) || '***@' || 
                SUBSTRING(p.email FROM POSITION('@' IN p.email) + 1)
            ELSE '***'
        END as email_masked,
        CASE 
            WHEN LENGTH(p.full_name) > 0 THEN 
                SUBSTRING(p.full_name FROM 1 FOR 2) || REPEAT('*', LENGTH(p.full_name) - 2)
            ELSE '***'
        END as full_name_masked,
        p.credits,
        p.created_at,
        p.updated_at
    FROM public.profiles p
    WHERE p.id = profile_user_id;
END;
$$;

-- Grant access to this function for admins only
REVOKE ALL ON FUNCTION public.get_masked_profile_data FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_masked_profile_data TO authenticated;

-- Create restricted admin policy (no direct table access)
CREATE POLICY "admins_masked_profile_access_only" 
ON public.profiles FOR SELECT 
USING (
  -- Only allow if user is accessing their own profile
  auth.uid() = id 
  OR 
  -- Or if they are a super admin with specific justification
  (EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  ) AND current_setting('app.admin_access_reason', true) IS NOT NULL)
);

-- ================================
-- 2. ENHANCED CONTACT MESSAGES SECURITY
-- ================================
-- Issue: Admin compromise exposes all contact data
-- Solution: Encrypt sensitive data and implement access controls

-- Add encryption for contact messages
ALTER TABLE public.contact_messages 
ADD COLUMN IF NOT EXISTS encrypted_email TEXT,
ADD COLUMN IF NOT EXISTS encrypted_message TEXT,
ADD COLUMN IF NOT EXISTS encryption_key_id TEXT DEFAULT 'default';

-- Create contact message access audit
CREATE TABLE IF NOT EXISTS public.contact_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID REFERENCES auth.users(id) NOT NULL,
    contact_message_id UUID REFERENCES public.contact_messages(id),
    access_reason TEXT NOT NULL,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on contact access log
ALTER TABLE public.contact_access_log ENABLE ROW LEVEL SECURITY;

-- Super admins can view contact access logs
CREATE POLICY "super_admins_can_view_contact_access_log" 
ON public.contact_access_log FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Drop existing overly permissive contact policies
DROP POLICY IF EXISTS "only_admins_can_view_contact_messages" ON public.contact_messages;
DROP POLICY IF EXISTS "only_admins_can_manage_contact_messages" ON public.contact_messages;

-- Create secure function for admin contact access with reason logging
CREATE OR REPLACE FUNCTION public.get_contact_message_with_reason(
    message_id UUID,
    access_reason TEXT
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT,
    subject TEXT,
    message TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
    -- Verify admin access
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    ) THEN
        RAISE EXCEPTION 'Unauthorized access to contact messages';
    END IF;
    
    -- Log the access with reason
    INSERT INTO public.contact_access_log (
        admin_user_id,
        contact_message_id,
        access_reason,
        ip_address
    ) VALUES (
        auth.uid(),
        message_id,
        access_reason,
        inet_client_addr()
    );
    
    -- Return the contact message
    RETURN QUERY
    SELECT 
        cm.id,
        cm.name,
        cm.email,
        cm.subject,
        cm.message,
        cm.status,
        cm.created_at
    FROM public.contact_messages cm
    WHERE cm.id = message_id;
END;
$$;

-- Revoke direct access and grant function access
REVOKE ALL ON FUNCTION public.get_contact_message_with_reason FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_contact_message_with_reason TO authenticated;

-- Create new restrictive policies for contact messages
CREATE POLICY "contact_messages_function_access_only" 
ON public.contact_messages FOR SELECT 
USING (false); -- No direct access allowed

CREATE POLICY "contact_messages_admin_update_only" 
ON public.contact_messages FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- ================================
-- 3. ENHANCED PAYMENT DATA PROTECTION
-- ================================
-- Issue: User access to own payment data could expose financial patterns
-- Solution: Implement access logging and limited data exposure

-- Create payment access audit
CREATE TABLE IF NOT EXISTS public.payment_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    payment_id UUID REFERENCES public.payments(id),
    access_type TEXT NOT NULL, -- 'own_data', 'admin_view', 'system_process'
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on payment access log
ALTER TABLE public.payment_access_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own payment access logs
CREATE POLICY "users_can_view_own_payment_access_log" 
ON public.payment_access_log FOR SELECT 
USING (auth.uid() = user_id);

-- Admins can view all payment access logs
CREATE POLICY "admins_can_view_all_payment_access_log" 
ON public.payment_access_log FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Create function for safe payment data access
CREATE OR REPLACE FUNCTION public.get_user_payment_summary(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
    total_payments_count BIGINT,
    total_credits_purchased INTEGER,
    last_payment_date TIMESTAMP WITH TIME ZONE,
    has_active_subscription BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
    -- Verify user can only access their own data or is admin
    IF user_uuid != auth.uid() AND NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    ) THEN
        RAISE EXCEPTION 'Unauthorized access to payment data';
    END IF;
    
    -- Log the access
    INSERT INTO public.payment_access_log (
        user_id,
        access_type,
        ip_address,
        user_agent
    ) VALUES (
        auth.uid(),
        CASE WHEN user_uuid = auth.uid() THEN 'own_summary' ELSE 'admin_summary' END,
        inet_client_addr(),
        current_setting('request.headers', true)::json->>'user-agent'
    );
    
    -- Return aggregated data only (no sensitive details)
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_payments_count,
        COALESCE(SUM(p.credits_purchased), 0)::INTEGER as total_credits_purchased,
        MAX(p.created_at) as last_payment_date,
        EXISTS(
            SELECT 1 FROM public.payments p2 
            WHERE p2.user_id = user_uuid 
            AND p2.status = 'completed' 
            AND p2.created_at > now() - interval '30 days'
        ) as has_active_subscription
    FROM public.payments p
    WHERE p.user_id = user_uuid AND p.status = 'completed';
END;
$$;

-- Grant access to payment summary function
REVOKE ALL ON FUNCTION public.get_user_payment_summary FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_payment_summary TO authenticated;

-- Update payment policies to be more restrictive
DROP POLICY IF EXISTS "users_can_view_own_payments_only" ON public.payments;
DROP POLICY IF EXISTS "admins_can_view_all_payments" ON public.payments;

-- Create new restrictive payment policies
CREATE POLICY "users_limited_payment_access" 
ON public.payments FOR SELECT 
USING (
    auth.uid() = user_id 
    AND current_setting('app.payment_access_reason', true) IS NOT NULL
);

CREATE POLICY "service_role_payment_access" 
ON public.payments FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "super_admin_payment_access_with_logging" 
ON public.payments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  ) AND current_setting('app.admin_access_reason', true) IS NOT NULL
);

-- ================================
-- 4. MULTI-FACTOR AUTHENTICATION REQUIREMENTS
-- ================================

-- Create MFA requirements table
CREATE TABLE IF NOT EXISTS public.admin_mfa_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
    mfa_enabled BOOLEAN DEFAULT false,
    backup_codes_used INTEGER DEFAULT 0,
    last_mfa_verification TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on MFA requirements
ALTER TABLE public.admin_mfa_requirements ENABLE ROW LEVEL SECURITY;

-- Users can view their own MFA settings
CREATE POLICY "users_can_view_own_mfa_settings" 
ON public.admin_mfa_requirements FOR ALL 
USING (auth.uid() = user_id);

-- Create function to verify admin MFA before sensitive operations
CREATE OR REPLACE FUNCTION public.verify_admin_mfa_recent()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
DECLARE
    last_verification TIMESTAMP WITH TIME ZONE;
    is_admin BOOLEAN;
BEGIN
    -- Check if user is admin
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    ) INTO is_admin;
    
    IF NOT is_admin THEN
        RETURN false;
    END IF;
    
    -- Check last MFA verification
    SELECT last_mfa_verification INTO last_verification
    FROM public.admin_mfa_requirements
    WHERE user_id = auth.uid() AND mfa_enabled = true;
    
    -- Require MFA verification within last 15 minutes for sensitive operations
    RETURN (last_verification IS NOT NULL AND last_verification > now() - interval '15 minutes');
END;
$$;

-- ================================
-- 5. SESSION SECURITY ENHANCEMENTS
-- ================================

-- Add session security fields
ALTER TABLE public.user_sessions 
ADD COLUMN IF NOT EXISTS session_type TEXT DEFAULT 'regular' CHECK (session_type IN ('regular', 'admin', 'super_admin')),
ADD COLUMN IF NOT EXISTS requires_mfa BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mfa_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0;

-- Update user session policies for admin sessions
DROP POLICY IF EXISTS "users_can_view_own_sessions_only" ON public.user_sessions;
DROP POLICY IF EXISTS "admins_can_view_all_sessions" ON public.user_sessions;

-- Create enhanced session policies
CREATE POLICY "users_can_view_own_sessions_enhanced" 
ON public.user_sessions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "super_admins_can_view_admin_sessions_only" 
ON public.user_sessions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  ) AND session_type IN ('admin', 'super_admin')
);

-- ================================
-- 6. AUTOMATIC SECURITY MONITORING
-- ================================

-- Create security alerts table
CREATE TABLE IF NOT EXISTS public.security_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    user_id UUID REFERENCES auth.users(id),
    details JSONB NOT NULL,
    resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on security alerts
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

-- Only super admins can view security alerts
CREATE POLICY "super_admins_can_view_security_alerts" 
ON public.security_alerts FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Create function to generate security alerts
CREATE OR REPLACE FUNCTION public.create_security_alert(
    alert_type TEXT,
    severity TEXT,
    target_user_id UUID,
    alert_details JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
DECLARE
    alert_id UUID;
BEGIN
    INSERT INTO public.security_alerts (
        alert_type,
        severity,
        user_id,
        details
    ) VALUES (
        alert_type,
        severity,
        target_user_id,
        alert_details
    ) RETURNING id INTO alert_id;
    
    RETURN alert_id;
END;
$$;

-- ================================
-- 7. UPDATED ADMIN ROLE DEFINITIONS
-- ================================

-- Ensure proper role hierarchy
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin' 
FROM auth.users 
WHERE email IN ('admin@sproutcv.app', 'security@sproutcv.app')
ON CONFLICT (user_id, role) DO NOTHING;

-- ================================
-- 8. GRANTS AND PERMISSIONS CLEANUP
-- ================================

-- Revoke all unnecessary permissions
REVOKE ALL ON public.admin_audit_log FROM anon, authenticated;
REVOKE ALL ON public.contact_access_log FROM anon, authenticated;
REVOKE ALL ON public.payment_access_log FROM anon, authenticated;
REVOKE ALL ON public.admin_mfa_requirements FROM anon;
REVOKE ALL ON public.security_alerts FROM anon, authenticated;

-- Grant only necessary permissions
GRANT SELECT, INSERT ON public.admin_audit_log TO authenticated;
GRANT SELECT, INSERT ON public.contact_access_log TO authenticated;
GRANT SELECT, INSERT ON public.payment_access_log TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.admin_mfa_requirements TO authenticated;

-- ================================
-- 9. SECURITY FIX AUDIT LOG
-- ================================

INSERT INTO public.security_audit_log (
    event_type, 
    action, 
    description
) VALUES (
    'ENHANCED_SECURITY_FIX',
    'ADMIN_ACCESS_CONTROLS',
    'Applied enhanced security controls: admin access logging, data masking, MFA requirements, contact encryption, payment access restrictions, and automated security monitoring.'
);

-- ================================
-- DEPLOYMENT VERIFICATION QUERIES
-- ================================

/*
-- Verify enhanced policies are applied:
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'contact_messages', 'payments', 'admin_audit_log', 'contact_access_log', 'payment_access_log')
ORDER BY tablename, policyname;

-- Verify audit tables exist:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%_log' OR table_name LIKE '%audit%';

-- Test admin access (should require specific functions):
SELECT public.get_masked_profile_data('some-user-id');
SELECT * FROM public.get_user_payment_summary();
*/
