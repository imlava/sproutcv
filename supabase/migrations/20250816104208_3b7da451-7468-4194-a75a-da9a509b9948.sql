-- Add foreign key relationship between payments and profiles tables
-- This fixes the admin dashboard query that joins payments with profiles

-- First, add the foreign key constraint from payments.user_id to profiles.id
ALTER TABLE public.payments 
ADD CONSTRAINT fk_payments_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);

-- Add foreign key constraint for referrals.referrer_id to profiles.id
ALTER TABLE public.referrals 
ADD CONSTRAINT fk_referrals_referrer_id 
FOREIGN KEY (referrer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key constraint for referrals.referred_id to profiles.id  
ALTER TABLE public.referrals 
ADD CONSTRAINT fk_referrals_referred_id 
FOREIGN KEY (referred_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add indexes for better query performance on referrals
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON public.referrals(referred_id);

-- Add foreign key constraint for credits_ledger.user_id to profiles.id
ALTER TABLE public.credits_ledger 
ADD CONSTRAINT fk_credits_ledger_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add index for better query performance on credits_ledger
CREATE INDEX IF NOT EXISTS idx_credits_ledger_user_id ON public.credits_ledger(user_id);