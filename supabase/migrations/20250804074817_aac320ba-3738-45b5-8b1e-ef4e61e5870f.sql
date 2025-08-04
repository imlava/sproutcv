-- Add referral system tables and enhanced analysis
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL UNIQUE,
  email_referred TEXT,
  is_signup_completed BOOLEAN DEFAULT FALSE,
  is_payment_completed BOOLEAN DEFAULT FALSE,
  credits_awarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on referrals
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS policies for referrals
CREATE POLICY "Users can view their own referrals" ON public.referrals
FOR SELECT USING (auth.uid() = referrer_id);

CREATE POLICY "Users can insert their own referrals" ON public.referrals
FOR INSERT WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "System can update referrals" ON public.referrals
FOR UPDATE USING (true);

-- Add referral_code to profiles
ALTER TABLE public.profiles ADD COLUMN referral_code TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN referred_by UUID REFERENCES auth.users(id);

-- Create function to generate unique referral codes
CREATE OR REPLACE FUNCTION generate_referral_code() 
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_check INTEGER;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text) from 1 for 8));
    SELECT COUNT(*) INTO exists_check FROM profiles WHERE referral_code = code;
    IF exists_check = 0 THEN
      EXIT;
    END IF;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Update existing profiles with referral codes
UPDATE public.profiles SET referral_code = generate_referral_code() WHERE referral_code IS NULL;

-- Add analysis expiry and enhanced details
ALTER TABLE public.resume_analyses ADD COLUMN expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days');
ALTER TABLE public.resume_analyses ADD COLUMN detailed_feedback JSONB DEFAULT '{}';
ALTER TABLE public.resume_analyses ADD COLUMN keywords_found TEXT[];
ALTER TABLE public.resume_analyses ADD COLUMN missing_keywords TEXT[];
ALTER TABLE public.resume_analyses ADD COLUMN improvement_areas TEXT[];

-- Create function to handle referral credits
CREATE OR REPLACE FUNCTION public.process_referral_credit(referred_user_id UUID, payment_amount INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    referrer_user_id UUID;
    referral_record RECORD;
BEGIN
    -- Get referral record
    SELECT * INTO referral_record 
    FROM public.referrals 
    WHERE referred_id = referred_user_id 
    AND is_payment_completed = FALSE 
    AND credits_awarded = FALSE;
    
    IF referral_record IS NULL THEN
        RETURN FALSE;
    END IF;
    
    referrer_user_id := referral_record.referrer_id;
    
    -- Mark referral as payment completed
    UPDATE public.referrals 
    SET is_payment_completed = TRUE, 
        credits_awarded = TRUE,
        updated_at = now()
    WHERE id = referral_record.id;
    
    -- Give 3 credits to referrer
    PERFORM public.update_user_credits(
        referrer_user_id,
        3,
        'referral',
        'Referral bonus for successful referral'
    );
    
    -- Give 3 credits to referred user
    PERFORM public.update_user_credits(
        referred_user_id,
        3,
        'referral',
        'Welcome bonus for being referred'
    );
    
    RETURN TRUE;
END;
$$;

-- Enhanced admin functions
CREATE OR REPLACE FUNCTION public.admin_get_user_stats()
RETURNS TABLE(
    total_users BIGINT,
    active_users BIGINT,
    total_analyses BIGINT,
    total_revenue NUMERIC,
    pending_messages BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
    -- Check admin role
    IF NOT public.has_role(auth.uid(), 'admin') THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;
    
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM public.profiles)::BIGINT,
        (SELECT COUNT(*) FROM public.profiles WHERE last_login > now() - interval '30 days')::BIGINT,
        (SELECT COUNT(*) FROM public.resume_analyses)::BIGINT,
        (SELECT COALESCE(SUM(amount), 0) FROM public.payments WHERE status = 'completed')::NUMERIC / 100,
        (SELECT COUNT(*) FROM public.contact_messages WHERE status = 'unread')::BIGINT;
END;
$$;

-- Function to get detailed user analytics
CREATE OR REPLACE FUNCTION public.admin_get_user_details(target_user_id UUID)
RETURNS TABLE(
    user_id UUID,
    email TEXT,
    full_name TEXT,
    credits INTEGER,
    total_analyses BIGINT,
    total_spent NUMERIC,
    referrals_made BIGINT,
    last_analysis TIMESTAMPTZ,
    signup_date TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
    -- Check admin role
    IF NOT public.has_role(auth.uid(), 'admin') THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;
    
    RETURN QUERY
    SELECT 
        p.id,
        p.email,
        p.full_name,
        p.credits,
        (SELECT COUNT(*) FROM public.resume_analyses WHERE user_id = p.id)::BIGINT,
        (SELECT COALESCE(SUM(amount), 0) FROM public.payments WHERE user_id = p.id AND status = 'completed')::NUMERIC / 100,
        (SELECT COUNT(*) FROM public.referrals WHERE referrer_id = p.id)::BIGINT,
        (SELECT MAX(created_at) FROM public.resume_analyses WHERE user_id = p.id),
        p.created_at
    FROM public.profiles p
    WHERE p.id = target_user_id;
END;
$$;

-- Enable realtime for new tables
ALTER TABLE public.referrals REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.referrals;

-- Create indexes for performance
CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX idx_resume_analyses_expires ON public.resume_analyses(expires_at);
CREATE INDEX idx_resume_analyses_user_created ON public.resume_analyses(user_id, created_at DESC);