-- Fix remaining security warnings (corrected version)

-- 1. Add comprehensive RLS policies for payment_transactions table
-- Missing INSERT/UPDATE/DELETE protection

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

-- 2. Additional security: Ensure no direct anonymous access to sensitive tables
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