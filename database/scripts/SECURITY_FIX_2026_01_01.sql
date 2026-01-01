-- =============================================================================
-- SECURITY FIX - January 1, 2026
-- Addresses detected security issues:
-- 1. PUBLIC_USER_DATA - profiles table publicly readable
-- 2. EXPOSED_SENSITIVE_DATA - contact_messages SELECT restrictions
-- 3. MISSING_RLS_PROTECTION - payment_transactions table
-- =============================================================================

-- First, let's verify current RLS status and fix issues
BEGIN;

-- =============================================================================
-- 1. FIX: profiles table - Block anonymous access completely
-- =============================================================================

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner too (critical for security)
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Insert profile on signup" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "users_can_view_own_profile_only" ON public.profiles;
DROP POLICY IF EXISTS "users_can_update_own_profile_only" ON public.profiles;
DROP POLICY IF EXISTS "users_can_insert_own_profile_only" ON public.profiles;
DROP POLICY IF EXISTS "verified_admins_can_manage_profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role full access" ON public.profiles;
DROP POLICY IF EXISTS "Allow all access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;

-- Create secure policies: Users can ONLY access their own profile
CREATE POLICY "profiles_select_own"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_delete_own"
ON public.profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- Admin access via service role (Edge Functions)
CREATE POLICY "profiles_service_role_access"
ON public.profiles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =============================================================================
-- 2. FIX: contact_messages - Block anonymous SELECT, allow anonymous INSERT
-- =============================================================================

-- Ensure RLS is enabled
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages FORCE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "contact_messages_policy" ON public.contact_messages;
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can view all contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "authenticated_users_can_insert_messages" ON public.contact_messages;
DROP POLICY IF EXISTS "users_can_view_own_messages_only" ON public.contact_messages;
DROP POLICY IF EXISTS "verified_admins_can_view_messages" ON public.contact_messages;
DROP POLICY IF EXISTS "only_admins_can_manage_contact_messages" ON public.contact_messages;
DROP POLICY IF EXISTS "anonymous_can_insert_contact_messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Only admins can view contact messages" ON public.contact_messages;

-- Allow anonymous users to INSERT (submit contact form)
CREATE POLICY "contact_messages_anon_insert"
ON public.contact_messages FOR INSERT
TO anon
WITH CHECK (true);

-- Allow authenticated users to INSERT
CREATE POLICY "contact_messages_auth_insert"
ON public.contact_messages FOR INSERT
TO authenticated
WITH CHECK (true);

-- Users can view ONLY their own messages (by email match)
CREATE POLICY "contact_messages_view_own"
ON public.contact_messages FOR SELECT
TO authenticated
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- BLOCK anonymous SELECT completely
-- (No policy = no access for anon)

-- Service role for admin dashboard access
CREATE POLICY "contact_messages_service_role"
ON public.contact_messages FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =============================================================================
-- 3. FIX: payment_transactions - Add direct user_id check
-- =============================================================================

-- Check if table exists first
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_transactions') THEN
        -- Enable RLS
        ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.payment_transactions FORCE ROW LEVEL SECURITY;
        
        -- Drop existing policies
        DROP POLICY IF EXISTS "Block anonymous access" ON public.payment_transactions;
        DROP POLICY IF EXISTS "Users can view own transactions" ON public.payment_transactions;
        DROP POLICY IF EXISTS "payment_transactions_user_access" ON public.payment_transactions;
        
        -- Create secure policy with direct user_id check
        CREATE POLICY "payment_transactions_select_own"
        ON public.payment_transactions FOR SELECT
        TO authenticated
        USING (
            -- Direct user_id check (if column exists)
            user_id = auth.uid()
            OR
            -- Fallback to payment table join
            EXISTS (
                SELECT 1 FROM public.payments p
                WHERE p.id = payment_transactions.payment_id
                AND p.user_id = auth.uid()
            )
        );
        
        -- Service role access
        CREATE POLICY "payment_transactions_service_role"
        ON public.payment_transactions FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);
        
        RAISE NOTICE 'payment_transactions policies updated';
    ELSE
        RAISE NOTICE 'payment_transactions table does not exist, skipping';
    END IF;
END $$;

-- =============================================================================
-- 4. FIX: payments table - Strengthen RLS
-- =============================================================================

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments FORCE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Service role can manage payments" ON public.payments;
DROP POLICY IF EXISTS "users_can_view_own_payment_summary_with_mfa" ON public.payments;
DROP POLICY IF EXISTS "service_role_payment_processing" ON public.payments;
DROP POLICY IF EXISTS "users_can_view_own_payments_only" ON public.payments;
DROP POLICY IF EXISTS "service_role_can_insert_payments" ON public.payments;

-- Users can ONLY view their own payments
CREATE POLICY "payments_select_own"
ON public.payments FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Service role for payment processing
CREATE POLICY "payments_service_role"
ON public.payments FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =============================================================================
-- 5. FIX: message_replies table (related to contact_messages)
-- =============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'message_replies') THEN
        ALTER TABLE public.message_replies ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.message_replies FORCE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "message_replies_access" ON public.message_replies;
        DROP POLICY IF EXISTS "admin_message_replies" ON public.message_replies;
        
        -- Only service role can manage replies (admin functions)
        CREATE POLICY "message_replies_service_role"
        ON public.message_replies FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);
        
        -- Users can view replies to their own messages
        CREATE POLICY "message_replies_view_own"
        ON public.message_replies FOR SELECT
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.contact_messages cm
                WHERE cm.id = message_replies.contact_message_id
                AND cm.email = (SELECT email FROM auth.users WHERE id = auth.uid())
            )
        );
        
        RAISE NOTICE 'message_replies policies updated';
    END IF;
END $$;

-- =============================================================================
-- 6. Additional security: credits_ledger table
-- =============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'credits_ledger') THEN
        ALTER TABLE public.credits_ledger ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.credits_ledger FORCE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "credits_ledger_policy" ON public.credits_ledger;
        
        CREATE POLICY "credits_ledger_select_own"
        ON public.credits_ledger FOR SELECT
        TO authenticated
        USING (user_id = auth.uid());
        
        CREATE POLICY "credits_ledger_service_role"
        ON public.credits_ledger FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);
        
        RAISE NOTICE 'credits_ledger policies updated';
    END IF;
END $$;

-- =============================================================================
-- 7. Verify RLS status on all critical tables
-- =============================================================================

DO $$
DECLARE
    tbl RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== RLS STATUS CHECK ===';
    FOR tbl IN 
        SELECT tablename, rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('profiles', 'contact_messages', 'payments', 'payment_transactions', 'message_replies', 'credits_ledger', 'user_roles')
    LOOP
        IF tbl.rowsecurity THEN
            RAISE NOTICE '✅ % - RLS ENABLED', tbl.tablename;
        ELSE
            RAISE NOTICE '❌ % - RLS DISABLED (VULNERABLE)', tbl.tablename;
        END IF;
    END LOOP;
END $$;

-- =============================================================================
-- 8. Create helper function for admin access verification
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES (run these after applying the fix)
-- =============================================================================

-- Check policies on profiles
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Check policies on contact_messages  
-- SELECT * FROM pg_policies WHERE tablename = 'contact_messages';

-- Check policies on payments
-- SELECT * FROM pg_policies WHERE tablename = 'payments';

-- Test anonymous access (should fail)
-- SET ROLE anon;
-- SELECT * FROM profiles LIMIT 1; -- Should return nothing
-- SELECT * FROM contact_messages LIMIT 1; -- Should return nothing
-- RESET ROLE;
