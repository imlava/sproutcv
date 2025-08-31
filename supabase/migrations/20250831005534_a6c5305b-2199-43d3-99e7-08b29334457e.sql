-- Fix missing RLS protection on referrals table
-- Add UPDATE and DELETE policies to prevent referral fraud

-- Add UPDATE policy - users can only update their own referrals
CREATE POLICY "Users can update their own referrals"
ON public.referrals
FOR UPDATE
USING (auth.uid() = referrer_id)
WITH CHECK (auth.uid() = referrer_id);

-- Add DELETE policy - users can only delete their own referrals  
CREATE POLICY "Users can delete their own referrals"
ON public.referrals
FOR DELETE
USING (auth.uid() = referrer_id);

-- Add service role policies for system operations
CREATE POLICY "Service role can manage all referrals"
ON public.referrals
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add admin policies for management
CREATE POLICY "Admins can manage all referrals"
ON public.referrals
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add comment to document the security model
COMMENT ON TABLE public.referrals IS 'Referral system with RLS: Users can only modify their own referral records to prevent fraud';

-- Ensure RLS is enabled
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;