-- ============================================================================
-- SECURITY AUDIT FIXES - January 2026
-- Fixes critical security vulnerabilities identified in security scan
-- ============================================================================

-- ============================================================================
-- 1. FIX PROFILES TABLE RLS - Block Public Access to Sensitive Data
-- ============================================================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public read access" ON public.profiles;

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can only view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (for signup)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Service role bypass for admin operations (NOT using true for regular users)
DROP POLICY IF EXISTS "Service role has full access" ON public.profiles;

-- ============================================================================
-- 2. FIX CONTACT_MESSAGES TABLE RLS - Prevent Public Leakage
-- ============================================================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Anyone can read messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Public can view messages" ON public.contact_messages;

-- Ensure RLS is enabled
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Only allow anonymous users to INSERT (submit contact forms)
DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_messages;
CREATE POLICY "Anyone can submit contact form"
ON public.contact_messages FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only authenticated admin users can read messages
DROP POLICY IF EXISTS "Admins can read messages" ON public.contact_messages;
CREATE POLICY "Admins can read messages"
ON public.contact_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Only admins can update message status
DROP POLICY IF EXISTS "Admins can update messages" ON public.contact_messages;
CREATE POLICY "Admins can update messages"
ON public.contact_messages FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ============================================================================
-- 3. FIX PAYMENT_TRANSACTIONS TABLE RLS
-- ============================================================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Service role can manage payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Allow all operations" ON public.payment_transactions;

-- Ensure RLS is enabled
ALTER TABLE IF EXISTS public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Block all anonymous access
DROP POLICY IF EXISTS "Block anonymous access" ON public.payment_transactions;
CREATE POLICY "Block anonymous access"
ON public.payment_transactions FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Users can only view their own payment transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.payment_transactions;
CREATE POLICY "Users can view own transactions"
ON public.payment_transactions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Only Edge Functions (service role) can insert/update transactions
-- This is handled automatically by service role key in Edge Functions

-- ============================================================================
-- 4. FIX PAYMENTS TABLE RLS
-- ============================================================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Allow all" ON public.payments;
DROP POLICY IF EXISTS "Service role full access" ON public.payments;

-- Ensure RLS is enabled
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;

-- Block anonymous access
DROP POLICY IF EXISTS "Block anonymous payments access" ON public.payments;
CREATE POLICY "Block anonymous payments access"
ON public.payments FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Users can view their own payments
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments"
ON public.payments FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins can view all payments
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
CREATE POLICY "Admins can view all payments"
ON public.payments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ============================================================================
-- 5. FIX REFERRALS TABLE RLS
-- ============================================================================

-- Ensure RLS is enabled
ALTER TABLE IF EXISTS public.referrals ENABLE ROW LEVEL SECURITY;

-- Users can view referrals where they are the referrer
DROP POLICY IF EXISTS "Users can view own referrals" ON public.referrals;
CREATE POLICY "Users can view own referrals"
ON public.referrals FOR SELECT
TO authenticated
USING (referrer_id = auth.uid());

-- Users can create referrals as the referrer
DROP POLICY IF EXISTS "Users can create referrals" ON public.referrals;
CREATE POLICY "Users can create referrals"
ON public.referrals FOR INSERT
TO authenticated
WITH CHECK (referrer_id = auth.uid());

-- Admins can view all referrals
DROP POLICY IF EXISTS "Admins can view all referrals" ON public.referrals;
CREATE POLICY "Admins can view all referrals"
ON public.referrals FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ============================================================================
-- 6. FIX CREDITS_LEDGER TABLE RLS
-- ============================================================================

-- Ensure RLS is enabled
ALTER TABLE IF EXISTS public.credits_ledger ENABLE ROW LEVEL SECURITY;

-- Users can view their own credit history
DROP POLICY IF EXISTS "Users can view own credits" ON public.credits_ledger;
CREATE POLICY "Users can view own credits"
ON public.credits_ledger FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Block direct inserts from users (only Edge Functions should add)
DROP POLICY IF EXISTS "Block direct credit inserts" ON public.credits_ledger;
CREATE POLICY "Block direct credit inserts"
ON public.credits_ledger FOR INSERT
TO authenticated
WITH CHECK (false);

-- ============================================================================
-- 7. FIX RESUME_ANALYSES TABLE RLS
-- ============================================================================

-- Ensure RLS is enabled
ALTER TABLE IF EXISTS public.resume_analyses ENABLE ROW LEVEL SECURITY;

-- Users can only view their own analyses
DROP POLICY IF EXISTS "Users can view own analyses" ON public.resume_analyses;
CREATE POLICY "Users can view own analyses"
ON public.resume_analyses FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can create their own analyses
DROP POLICY IF EXISTS "Users can create analyses" ON public.resume_analyses;
CREATE POLICY "Users can create analyses"
ON public.resume_analyses FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own analyses
DROP POLICY IF EXISTS "Users can update own analyses" ON public.resume_analyses;
CREATE POLICY "Users can update own analyses"
ON public.resume_analyses FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can delete their own analyses
DROP POLICY IF EXISTS "Users can delete own analyses" ON public.resume_analyses;
CREATE POLICY "Users can delete own analyses"
ON public.resume_analyses FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================================================
-- 8. FIX SECURITY_EVENTS TABLE RLS - Admin Only
-- ============================================================================

-- Ensure RLS is enabled
ALTER TABLE IF EXISTS public.security_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view security events
DROP POLICY IF EXISTS "Admins can view security events" ON public.security_events;
CREATE POLICY "Admins can view security events"
ON public.security_events FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Block all other access
DROP POLICY IF EXISTS "Block non-admin security access" ON public.security_events;
CREATE POLICY "Block non-admin security access"
ON public.security_events FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- ============================================================================
-- 9. CREATE SECURE ADMIN CHECK FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ============================================================================
-- 10. REVOKE PUBLIC ACCESS FROM SENSITIVE TABLES
-- ============================================================================

-- Revoke all public access
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.payments FROM anon;
REVOKE ALL ON public.payment_transactions FROM anon;
REVOKE ALL ON public.credits_ledger FROM anon;
REVOKE ALL ON public.security_events FROM anon;
REVOKE ALL ON public.user_roles FROM anon;

-- Grant minimal access to authenticated users (RLS will further restrict)
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.payments TO authenticated;
GRANT SELECT ON public.credits_ledger TO authenticated;
GRANT SELECT, INSERT ON public.referrals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resume_analyses TO authenticated;
GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT SELECT, UPDATE ON public.contact_messages TO authenticated;

-- ============================================================================
-- VERIFICATION COMMENTS
-- ============================================================================

COMMENT ON TABLE public.profiles IS 'User profiles - RLS enforced, users can only access own data';
COMMENT ON TABLE public.contact_messages IS 'Contact form submissions - Insert allowed, Read restricted to admins';
COMMENT ON TABLE public.payments IS 'Payment records - Users see own, Admins see all, Anon blocked';
COMMENT ON TABLE public.payment_transactions IS 'Payment transaction details - Users see own only, Anon blocked';
COMMENT ON TABLE public.security_events IS 'Security audit logs - Admin only access';
