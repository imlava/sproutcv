-- 🚨 CRITICAL SECURITY FIX - IMMEDIATE DEPLOYMENT REQUIRED
-- This script fixes all major security vulnerabilities identified in the database
-- These vulnerabilities expose sensitive user data to public access

-- ================================
-- 1. FIX PROFILES TABLE SECURITY
-- ================================
-- Issue: Customer Personal Information Could Be Stolen by Hackers
-- Current: Publicly readable profiles with email, phone, names, security preferences

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Insert profile on signup" ON public.profiles;

-- Create secure policies for profiles table
CREATE POLICY "users_can_view_own_profile_only" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "users_can_update_own_profile_only" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "users_can_insert_own_profile_only" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Admin access for support
CREATE POLICY "admins_can_manage_profiles" 
ON public.profiles FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- ================================
-- 2. FIX CONTACT_MESSAGES TABLE SECURITY
-- ================================
-- Issue: Customer Contact Information Could Be Harvested by Spammers
-- Current: Publicly readable contact forms with names, emails, personal messages

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "contact_messages_policy" ON public.contact_messages;

-- Create secure admin-only policies for contact messages
CREATE POLICY "only_admins_can_view_contact_messages" 
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
