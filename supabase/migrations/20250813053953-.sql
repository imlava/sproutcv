-- Lock down referrals UPDATE to prevent fraudulent credit awards
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Drop overly permissive UPDATE policy
DROP POLICY IF EXISTS "System can update referrals" ON public.referrals;

-- Optional documentation for maintainers
COMMENT ON TABLE public.referrals IS 'Users may INSERT their own referrals and SELECT their own. Updates must be performed by service-role edge functions or SECURITY DEFINER RPCs only.';