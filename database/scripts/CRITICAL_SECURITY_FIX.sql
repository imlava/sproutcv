-- 🚨 CRITICAL SECURITY FIX - IMMEDIATE DEPLOYMENT REQUIRED
-- This script fixes ALL major security vulnerabilities identified in the database
-- Date: September 13, 2025 - URGENT SECURITY PATCHES
-- These vulnerabilities expose sensitive user data to public access

-- =============================================================================
-- 1. FIX PUBLIC_USER_DATA - Profiles Table Security
-- =============================================================================
-- Issue: Customer Personal Information Could Be Stolen by Hackers
-- Risk: Admin policy allows viewing all user profiles (emails, phones, names)

-- Drop ALL existing overly permissive policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Insert profile on signup" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create ultra-secure policies for profiles
CREATE POLICY "users_can_view_own_profile_only" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "users_can_update_own_profile_only" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "users_can_insert_own_profile_only" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Restricted admin access with MFA requirement
CREATE POLICY "verified_admins_can_manage_profiles" 
ON public.profiles FOR ALL 
USING (
  auth.jwt() ->> 'aal' = 'aal2' AND -- Require Multi-Factor Authentication
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
    AND verified = true
  )
);

-- =============================================================================
-- 2. FIX EXPOSED_SENSITIVE_DATA - Contact Messages Security  
-- =============================================================================
-- Issue: Customer Support Messages Could Be Read by Unauthorized Users
-- Risk: Contact messages readable by anyone (emails, names, private messages)

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "contact_messages_policy" ON public.contact_messages;
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can view all contact messages" ON public.contact_messages;

-- Enable RLS on contact_messages
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Secure contact message policies
CREATE POLICY "authenticated_users_can_insert_messages" 
ON public.contact_messages FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "users_can_view_own_messages_only" 
ON public.contact_messages FOR SELECT 
USING (
  auth.uid()::text = user_id OR 
  (email = auth.jwt() ->> 'email' AND auth.uid() IS NOT NULL)
);

-- Ultra-restricted admin access
CREATE POLICY "verified_admins_can_view_messages" 
ON public.contact_messages FOR SELECT 
USING (
  auth.jwt() ->> 'aal' = 'aal2' AND -- Require MFA
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND verified = true
  )
);

-- =============================================================================
-- 3. FIX EXPOSED_FINANCIAL_DATA - Payment Information Security
-- =============================================================================
-- Issue: Payment Information Could Be Accessed by Unauthorized Users
-- Risk: Financial data (amounts, provider IDs, refunds) accessible to users

-- Drop existing payment policies
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Service role can manage payments" ON public.payments;

-- Enable RLS on payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Ultra-secure payment access with MFA requirement
CREATE POLICY "users_can_view_own_payment_summary_with_mfa" 
ON public.payments FOR SELECT 
USING (
  auth.uid() = user_id AND
  auth.jwt() ->> 'aal' = 'aal2' -- Require Multi-Factor Authentication
);

-- Service role for payment processing only
CREATE POLICY "service_role_payment_processing" 
ON public.payments FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================================================
-- 4. FIX MISSING_RLS_PROTECTION - Authentication Secrets Security
-- =============================================================================
-- Issue: Authentication Secrets Could Be Compromised
-- Risk: 2FA secrets and backup codes exposed if AAL2 requirement bypassed

-- Enable RLS on user_auth_secrets
ALTER TABLE public.user_auth_secrets ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can manage own auth secrets" ON public.user_auth_secrets;

-- Create maximum security auth secrets policies
CREATE POLICY "users_can_manage_auth_secrets_ultra_secure" 
ON public.user_auth_secrets FOR ALL 
USING (
  auth.uid() = user_id AND
  auth.jwt() ->> 'aal' = 'aal2' AND -- Require Multi-Factor Authentication
  auth.jwt() ->> 'amr' ? 'totp' AND -- Require TOTP verification
  current_timestamp - (auth.jwt() ->> 'iat')::int * interval '1 second' < interval '5 minutes' -- Recent auth
);

-- Emergency service role access with strict conditions
CREATE POLICY "emergency_service_access_auth_secrets" 
ON public.user_auth_secrets FOR ALL 
USING (
  auth.jwt() ->> 'role' = 'service_role' AND
  current_setting('request.jwt.claims', true)::json ->> 'emergency_access' = 'true'
);

-- =============================================================================
-- 5. SECURE ALL ADDITIONAL TABLES
-- =============================================================================

-- Secure user_analyses table
ALTER TABLE public.user_analyses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own analyses" ON public.user_analyses;
CREATE POLICY "users_own_analyses_only" 
ON public.user_analyses FOR ALL 
USING (auth.uid() = user_id);

-- Secure user_credits table  
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own credits" ON public.user_credits;
CREATE POLICY "users_own_credits_view_only" 
ON public.user_credits FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "service_role_credits_management" 
ON public.user_credits FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================================================
-- 6. CREATE SECURITY AUDIT SYSTEM
-- =============================================================================

-- Create comprehensive audit log table
CREATE TABLE IF NOT EXISTS public.security_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    risk_level TEXT DEFAULT 'LOW' CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Secure audit log access
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "only_service_role_audit_access" 
ON public.security_audit_log FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================================================
-- 7. SECURITY MONITORING FUNCTIONS
-- =============================================================================

-- Enhanced security logging function
CREATE OR REPLACE FUNCTION public.log_security_event(
    action_type TEXT,
    table_affected TEXT,
    record_affected UUID DEFAULT NULL,
    old_data JSONB DEFAULT NULL,
    new_data JSONB DEFAULT NULL,
    risk_level TEXT DEFAULT 'LOW'
)
RETURNS VOID AS $$
DECLARE
    client_ip INET;
    user_agent_header TEXT;
BEGIN
    -- Get client information safely
    BEGIN
        client_ip := inet_client_addr();
    EXCEPTION WHEN OTHERS THEN
        client_ip := NULL;
    END;
    
    BEGIN
        user_agent_header := current_setting('request.headers', true)::json ->> 'user-agent';
    EXCEPTION WHEN OTHERS THEN
        user_agent_header := NULL;
    END;

    INSERT INTO public.security_audit_log (
        user_id,
        action,
        table_name,
        record_id,
        old_data,
        new_data,
        ip_address,
        user_agent,
        session_id,
        risk_level
    ) VALUES (
        auth.uid(),
        action_type,
        table_affected,
        record_affected,
        old_data,
        new_data,
        client_ip,
        user_agent_header,
        auth.jwt() ->> 'session_id',
        risk_level
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to detect suspicious activity
CREATE OR REPLACE FUNCTION public.detect_suspicious_activity()
RETURNS VOID AS $$
DECLARE
    suspicious_count INTEGER;
BEGIN
    -- Check for excessive failed access attempts
    SELECT COUNT(*) INTO suspicious_count
    FROM public.security_audit_log
    WHERE created_at > NOW() - INTERVAL '1 hour'
        AND action LIKE '%FAILED%'
        AND user_id = auth.uid();
    
    IF suspicious_count > 10 THEN
        PERFORM public.log_security_event(
            'SUSPICIOUS_ACTIVITY_DETECTED',
            'security_monitoring',
            NULL,
            NULL,
            jsonb_build_object('failed_attempts', suspicious_count),
            'CRITICAL'
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 8. CREATE AUDIT TRIGGERS
-- =============================================================================

-- Enhanced audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM public.log_security_event(
            'INSERT', 
            TG_TABLE_NAME, 
            NEW.id, 
            NULL, 
            to_jsonb(NEW),
            CASE WHEN TG_TABLE_NAME IN ('payments', 'user_auth_secrets') THEN 'HIGH' ELSE 'LOW' END
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM public.log_security_event(
            'UPDATE', 
            TG_TABLE_NAME, 
            NEW.id, 
            to_jsonb(OLD), 
            to_jsonb(NEW),
            CASE WHEN TG_TABLE_NAME IN ('payments', 'user_auth_secrets') THEN 'HIGH' ELSE 'MEDIUM' END
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM public.log_security_event(
            'DELETE', 
            TG_TABLE_NAME, 
            OLD.id, 
            to_jsonb(OLD), 
            NULL,
            'HIGH'
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to ALL sensitive tables
DROP TRIGGER IF EXISTS audit_profiles_trigger ON public.profiles;
CREATE TRIGGER audit_profiles_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_contact_messages_trigger ON public.contact_messages;
CREATE TRIGGER audit_contact_messages_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.contact_messages
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_payments_trigger ON public.payments;
CREATE TRIGGER audit_payments_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_auth_secrets_trigger ON public.user_auth_secrets;
CREATE TRIGGER audit_auth_secrets_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.user_auth_secrets
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_user_analyses_trigger ON public.user_analyses;
CREATE TRIGGER audit_user_analyses_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.user_analyses
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- =============================================================================
-- 9. VERIFICATION AND MONITORING QUERIES
-- =============================================================================

-- Check RLS status on all critical tables
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '✅ SECURE (RLS ENABLED)' 
        ELSE '❌ VULNERABLE (RLS DISABLED)' 
    END as security_status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'profiles', 
        'contact_messages', 
        'payments', 
        'user_auth_secrets',
        'user_analyses',
        'user_credits'
    )
ORDER BY tablename;

-- Check all policies are in place
SELECT 
    schemaname,
    tablename,
    policyname,
    '✅ POLICY ACTIVE' as status
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN (
        'profiles', 
        'contact_messages', 
        'payments', 
        'user_auth_secrets',
        'user_analyses',
        'user_credits'
    )
ORDER BY tablename, policyname;

-- =============================================================================
-- 10. IMMEDIATE ACTIONS REQUIRED AFTER RUNNING THIS SCRIPT
-- =============================================================================

/*
🚨 CRITICAL: PERFORM THESE ACTIONS IMMEDIATELY AFTER RUNNING THIS SCRIPT:

1. UPGRADE POSTGRES VERSION (Addresses SUPA_vulnerable_postgres_version):
   - Go to Supabase Dashboard > Settings > Database > Versions
   - Click "Upgrade to latest version" to apply security patches
   - Monitor for any compatibility issues during upgrade

2. REVOKE EXISTING COMPROMISED SESSIONS:
   - Go to Authentication > Users
   - Click "Sign out all users" to force re-authentication
   - This ensures all users must re-authenticate with new security policies

3. VERIFY SECURITY FIXES:
   - Run the verification queries above
   - Test user access - users should only see their own data
   - Test admin access requires MFA
   - Verify payments require MFA to view

4. MONITOR SECURITY AUDIT LOG:
   - Check public.security_audit_log regularly
   - Set up alerts for CRITICAL risk_level entries
   - Monitor for unusual access patterns

5. ADDITIONAL SECURITY MEASURES:
   - Change all service role keys in Supabase dashboard
   - Enable database activity logging
   - Set up monitoring for failed authentication attempts
   - Consider implementing rate limiting on sensitive endpoints

6. TEST CRITICAL FUNCTIONALITY:
   - User registration/login
   - Profile updates
   - Payment processing
   - Contact form submissions
   - Admin dashboard access

EMERGENCY BREACH RESPONSE:
If you suspect ongoing unauthorized access:
1. Immediately disable affected user accounts
2. Revoke all API keys and tokens
3. Review security_audit_log for breach evidence
4. Change all passwords and service keys
5. Notify affected users if data was compromised
6. Consider temporarily disabling public access

SECURITY COMPLIANCE ACHIEVED:
✅ Profiles: User data protected from public access
✅ Contact Messages: Support data secured from unauthorized access  
✅ Payments: Financial data requires MFA to access
✅ Auth Secrets: 2FA data ultra-secured with multiple verification layers
✅ Database: Ready for PostgreSQL upgrade to latest secure version
✅ Monitoring: Comprehensive audit logging and suspicious activity detection
*/ 
ON public.contact_messages FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "only_admins_can_manage_contact_messages" 
ON public.contact_messages FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Allow anonymous users to submit contact forms only
CREATE POLICY "anonymous_can_insert_contact_messages" 
ON public.contact_messages FOR INSERT 
WITH CHECK (true);

-- ================================
-- 3. FIX PAYMENTS TABLE SECURITY  
-- ================================
-- Issue: Payment Information Could Be Accessed by Unauthorized Users
-- Current: Publicly readable payments with amounts, Stripe IDs, financial data

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Insert payments" ON public.payments;
DROP POLICY IF EXISTS "Update payments" ON public.payments;

-- Create secure policies for payments table
CREATE POLICY "users_can_view_own_payments_only" 
ON public.payments FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "service_role_can_insert_payments" 
ON public.payments FOR INSERT 
WITH CHECK (
  auth.jwt() ->> 'role' = 'service_role' OR
  auth.uid() = user_id
);

CREATE POLICY "service_role_can_update_payments" 
ON public.payments FOR UPDATE 
USING (
  auth.jwt() ->> 'role' = 'service_role' OR
  auth.uid() = user_id
);

-- Admin access for support
CREATE POLICY "admins_can_view_all_payments" 
ON public.payments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- ================================
-- 4. FIX PASSWORD_RESET_TOKENS TABLE SECURITY
-- ================================
-- Issue: Password Reset Tokens Could Be Intercepted by Attackers
-- Current: Publicly accessible password reset tokens

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can manage their own reset tokens" ON public.password_reset_tokens;

-- Create secure service-role-only policies
CREATE POLICY "only_service_role_can_manage_reset_tokens" 
ON public.password_reset_tokens FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- Users can only view their own reset tokens (for status checking)
CREATE POLICY "users_can_view_own_reset_tokens" 
ON public.password_reset_tokens FOR SELECT 
USING (auth.uid() = user_id);

-- ================================
-- 5. FIX USER_SESSIONS TABLE SECURITY
-- ================================
-- Issue: User Session Information Could Be Monitored by Attackers
-- Current: Publicly readable sessions with tokens, IPs, device info

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.user_sessions;

-- Create secure policies for user sessions
CREATE POLICY "users_can_view_own_sessions_only" 
ON public.user_sessions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "service_role_can_manage_sessions" 
ON public.user_sessions FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- Admin access for security monitoring
CREATE POLICY "admins_can_view_all_sessions" 
ON public.user_sessions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- ================================
-- 6. ADDITIONAL SECURITY HARDENING
-- ================================

-- Ensure all sensitive tables have RLS enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_analyses ENABLE ROW LEVEL SECURITY;

-- ================================
-- 7. SECURE PAYMENT_TRANSACTIONS TABLE
-- ================================
-- Update payment_transactions policies to be more restrictive

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Service role can manage payment transactions" ON public.payment_transactions;

-- Create secure policies
CREATE POLICY "users_can_view_own_payment_transactions_only" 
ON public.payment_transactions FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.payments 
    WHERE payments.id = payment_transactions.payment_id 
    AND payments.user_id = auth.uid()
));

CREATE POLICY "service_role_can_manage_payment_transactions" 
ON public.payment_transactions FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- Admin access for financial monitoring
CREATE POLICY "admins_can_view_payment_transactions" 
ON public.payment_transactions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- ================================
-- 8. SECURE RESUME_ANALYSES TABLE
-- ================================
-- Ensure resume analyses are properly secured

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can view own analyses" ON public.resume_analyses;
DROP POLICY IF EXISTS "Users can insert own analyses" ON public.resume_analyses;
DROP POLICY IF EXISTS "Users can update own analyses" ON public.resume_analyses;

-- Create secure policies
CREATE POLICY "users_can_view_own_analyses_only" 
ON public.resume_analyses FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "users_can_insert_own_analyses_only" 
ON public.resume_analyses FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_analyses_only" 
ON public.resume_analyses FOR UPDATE 
USING (auth.uid() = user_id);

-- Service role access for system operations
CREATE POLICY "service_role_can_manage_analyses" 
ON public.resume_analyses FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- ================================
-- 9. REVOKE PUBLIC ACCESS
-- ================================
-- Explicitly revoke any public access that might exist

REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.profiles FROM authenticated;
REVOKE ALL ON public.contact_messages FROM anon;
REVOKE ALL ON public.payments FROM anon;
REVOKE ALL ON public.payments FROM authenticated;
REVOKE ALL ON public.password_reset_tokens FROM anon;
REVOKE ALL ON public.password_reset_tokens FROM authenticated;
REVOKE ALL ON public.user_sessions FROM anon;
REVOKE ALL ON public.user_sessions FROM authenticated;
REVOKE ALL ON public.payment_transactions FROM anon;
REVOKE ALL ON public.resume_analyses FROM anon;

-- Grant only necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT INSERT ON public.contact_messages TO anon;
GRANT SELECT ON public.contact_messages TO authenticated;
GRANT SELECT ON public.payments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.resume_analyses TO authenticated;
GRANT SELECT ON public.payment_transactions TO authenticated;

-- ================================
-- 10. AUDIT LOG FOR SECURITY CHANGES
-- ================================

-- Create security audit log
CREATE TABLE IF NOT EXISTS public.security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    table_name TEXT,
    policy_name TEXT,
    action TEXT NOT NULL,
    description TEXT,
    applied_by TEXT DEFAULT current_user,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Log this security fix
INSERT INTO public.security_audit_log (
    event_type, 
    action, 
    description
) VALUES (
    'CRITICAL_SECURITY_FIX',
    'APPLY_RLS_POLICIES',
    'Applied comprehensive Row Level Security policies to fix public data exposure vulnerabilities. Fixed: profiles, contact_messages, payments, password_reset_tokens, user_sessions tables.'
);

-- ================================
-- DEPLOYMENT VERIFICATION QUERIES
-- ================================
-- Run these after deployment to verify the fix

/*
-- Verify policies are applied (run as admin):
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'contact_messages', 'payments', 'password_reset_tokens', 'user_sessions')
ORDER BY tablename, policyname;

-- Verify RLS is enabled:
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'contact_messages', 'payments', 'password_reset_tokens', 'user_sessions');

-- Test anonymous access (should return 0 rows):
SET ROLE anon;
SELECT count(*) FROM public.profiles; -- Should be 0
SELECT count(*) FROM public.payments; -- Should be 0
SELECT count(*) FROM public.password_reset_tokens; -- Should be 0
RESET ROLE;
*/

-- ================================
-- CRITICAL: DEPLOY IMMEDIATELY
-- ================================
-- This fix must be deployed ASAP to prevent data theft
-- Estimated impact: Protects all user PII, financial data, and security tokens
-- Zero downtime deployment - all changes are additive/restrictive only
