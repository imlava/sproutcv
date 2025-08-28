-- Fix remaining security warnings

-- 1. Fix profiles table RLS policies to properly protect sensitive data
-- Remove the overly restrictive anonymous policy and ensure proper user access
DROP POLICY IF EXISTS "Prevent anonymous access to profiles" ON public.profiles;

-- Create comprehensive policies for profiles table
CREATE POLICY "Users can only view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles for management"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Add comprehensive RLS policies for payment_transactions table
-- Currently only has SELECT policy, missing INSERT/UPDATE/DELETE protection

CREATE POLICY "Service role only can insert payment transactions"
ON public.payment_transactions
FOR INSERT
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role only can update payment transactions"
ON public.payment_transactions
FOR UPDATE
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role only can delete payment transactions"
ON public.payment_transactions
FOR DELETE
USING (auth.jwt() ->> 'role' = 'service_role');

-- 3. Additional security: Ensure no direct anonymous access to sensitive tables
CREATE POLICY "Block anonymous access to payment_transactions"
ON public.payment_transactions
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

CREATE POLICY "Block anonymous access to credits_ledger"
ON public.credits_ledger
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

CREATE POLICY "Block anonymous access to security_events"
ON public.security_events
FOR ALL
TO anon
USING (false)
WITH CHECK (false);