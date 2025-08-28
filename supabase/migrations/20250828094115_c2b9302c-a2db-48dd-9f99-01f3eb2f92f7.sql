-- Security Fix: Implement proper RLS policies for critical system tables
-- This addresses the security finding about system tables being manipulable by attackers

-- 1. Drop existing problematic policies and create proper ones for password_reset_tokens
DROP POLICY IF EXISTS "System access only for password reset tokens" ON public.password_reset_tokens;

CREATE POLICY "Service role only can manage password reset tokens"
ON public.password_reset_tokens
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- 2. Fix contact_rate_limits policies
DROP POLICY IF EXISTS "System only access for rate limits" ON public.contact_rate_limits;

CREATE POLICY "Service role only can manage contact rate limits"
ON public.contact_rate_limits
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- 3. Fix payments table policies - allow users to view their own payments but restrict modifications to service role
DROP POLICY IF EXISTS "System only can delete payments" ON public.payments;
DROP POLICY IF EXISTS "System only can insert payments" ON public.payments;
DROP POLICY IF EXISTS "System only can update payments" ON public.payments;

CREATE POLICY "Service role only can insert payments"
ON public.payments
FOR INSERT
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role only can update payments"
ON public.payments
FOR UPDATE
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role only can delete payments"
ON public.payments
FOR DELETE
USING (auth.jwt() ->> 'role' = 'service_role');

-- 4. Fix user_sessions policies
DROP POLICY IF EXISTS "System only can delete sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "System only can insert sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "System only can update sessions" ON public.user_sessions;

CREATE POLICY "Service role only can manage user sessions"
ON public.user_sessions
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- 5. Fix security_events policies
DROP POLICY IF EXISTS "System only can delete security events" ON public.security_events;
DROP POLICY IF EXISTS "System only can insert security events" ON public.security_events;
DROP POLICY IF EXISTS "System only can update security events" ON public.security_events;

CREATE POLICY "Service role only can insert security events"
ON public.security_events
FOR INSERT
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role only can update security events"
ON public.security_events
FOR UPDATE
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role only can delete security events"
ON public.security_events
FOR DELETE
USING (auth.jwt() ->> 'role' = 'service_role');

-- 6. Fix credits_ledger policies
DROP POLICY IF EXISTS "Only system functions can insert credits ledger entries" ON public.credits_ledger;

CREATE POLICY "Service role only can insert credits ledger entries"
ON public.credits_ledger
FOR INSERT
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Add missing policies for credits_ledger modifications
CREATE POLICY "Service role only can update credits ledger"
ON public.credits_ledger
FOR UPDATE
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role only can delete credits ledger"
ON public.credits_ledger
FOR DELETE
USING (auth.jwt() ->> 'role' = 'service_role');

-- 7. Fix admin_audit_log policies
DROP POLICY IF EXISTS "System can insert audit logs" ON public.admin_audit_log;

CREATE POLICY "Service role only can insert audit logs"
ON public.admin_audit_log
FOR INSERT
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Add missing policies for admin_audit_log
CREATE POLICY "Service role only can update audit logs"
ON public.admin_audit_log
FOR UPDATE
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role only can delete audit logs"
ON public.admin_audit_log
FOR DELETE
USING (auth.jwt() ->> 'role' = 'service_role');

-- 8. Fix profiles table to address the exposed sensitive data issue
CREATE POLICY "Prevent anonymous access to profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- 9. Strengthen user_auth_secrets policy
DROP POLICY IF EXISTS "Users can only access their own auth secrets for 2FA operations" ON public.user_auth_secrets;

CREATE POLICY "Users can manage their own auth secrets with proper authentication"
ON public.user_auth_secrets
FOR ALL
USING (
  auth.uid() = user_id 
  AND auth.uid() IS NOT NULL
  AND ((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'aal'::text) = 'aal2'::text
)
WITH CHECK (
  auth.uid() = user_id 
  AND auth.uid() IS NOT NULL
  AND ((current_setting('request.jwt.claims'::text, true))::jsonb ->> 'aal'::text) = 'aal2'::text
);

-- 10. Create a function to verify service role access for additional security
CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT auth.jwt() ->> 'role' = 'service_role';
$$;