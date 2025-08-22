-- Fix credit manipulation vulnerability
-- Remove the permissive RLS policy that allows users to insert credit transactions

-- Drop the existing vulnerable policy
DROP POLICY IF EXISTS "System can insert credits ledger entries" ON public.credits_ledger;

-- Create a secure policy that only allows system functions to insert
CREATE POLICY "Only system functions can insert credits ledger entries" 
ON public.credits_ledger 
FOR INSERT 
WITH CHECK (false);

-- Keep the existing SELECT policy for users to view their own transactions
-- (This policy already exists and is secure: "Users can view their own credits ledger")

-- Add a comment to document the security fix
COMMENT ON POLICY "Only system functions can insert credits ledger entries" ON public.credits_ledger 
IS 'Security policy: Prevents direct user manipulation of credit balances. Credits can only be modified through SECURITY DEFINER functions.';

-- Ensure the credits_ledger table has proper constraints
ALTER TABLE public.credits_ledger 
ADD CONSTRAINT credits_ledger_balance_check 
CHECK (balance_after >= 0);

-- Add constraint to prevent manipulation of credit amounts
ALTER TABLE public.credits_ledger 
ADD CONSTRAINT credits_ledger_amount_reasonable 
CHECK (credits_amount BETWEEN -1000 AND 1000);