-- PERMANENT FIX FOR REFERRAL SYSTEM
-- This migration fixes the referral system to properly track referral completions

-- 1. Create function to automatically fix existing broken referrals
CREATE OR REPLACE FUNCTION public.fix_pending_referrals()
RETURNS TABLE(
    referral_id UUID,
    referrer_email TEXT,
    referred_email TEXT,
    action_taken TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
    RETURN QUERY
    WITH fixed_referrals AS (
        UPDATE public.referrals r
        SET 
            referred_id = p.id,
            is_signup_completed = true,
            updated_at = NOW()
        FROM public.profiles p
        WHERE r.email_referred = p.email
          AND r.is_signup_completed = false
          AND p.id IS NOT NULL
        RETURNING r.id, r.referrer_id, p.email, 'marked_completed' as action
    ),
    referrer_info AS (
        SELECT 
            fr.id,
            pr.email as referrer_email,
            fr.email as referred_email,
            fr.action
        FROM fixed_referrals fr
        JOIN public.profiles pr ON fr.referrer_id = pr.id
    )
    SELECT 
        ri.id,
        ri.referrer_email,
        ri.referred_email,
        ri.action
    FROM referrer_info ri;
END;
$$;

-- 2. Create function to handle referral completion during signup
CREATE OR REPLACE FUNCTION public.complete_referral_signup(
    user_id UUID,
    user_email TEXT,
    referral_code TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    referral_record RECORD;
    result JSONB := '{"status": "no_referral", "message": "No referral to process"}';
BEGIN
    -- Method 1: Update by referral code (for new signups with referral code)
    IF referral_code IS NOT NULL THEN
        UPDATE public.referrals r
        SET 
            referred_id = user_id,
            is_signup_completed = true,
            updated_at = NOW()
        FROM public.profiles p
        WHERE r.referral_code = referral_code
          AND r.email_referred = user_email
          AND p.id = r.referrer_id
          AND r.is_signup_completed = false;
        
        IF FOUND THEN
            result := jsonb_build_object(
                'status', 'success',
                'message', 'Referral completed via referral code',
                'method', 'referral_code'
            );
            RETURN result;
        END IF;
    END IF;
    
    -- Method 2: Update by email (for existing referrals where user finally signed up)
    UPDATE public.referrals
    SET 
        referred_id = user_id,
        is_signup_completed = true,
        updated_at = NOW()
    WHERE email_referred = user_email
      AND is_signup_completed = false
      AND referred_id IS NULL;
    
    IF FOUND THEN
        result := jsonb_build_object(
            'status', 'success',
            'message', 'Referral completed via email match',
            'method', 'email_match'
        );
    END IF;
    
    RETURN result;
END;
$$;

-- 3. Update the handle_new_user trigger to include referral completion
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    referral_result JSONB;
BEGIN
    -- Only create profile if it doesn't exist (prevents conflicts with Edge Function)
    INSERT INTO public.profiles (
        id, email, full_name, credits, email_verified, referral_code
    ) VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        5, -- Give 5 free credits to new users
        COALESCE((NEW.raw_user_meta_data->>'email_verified')::boolean, false),
        upper(substring(md5(random()::text) from 1 for 8)) -- Generate referral code
    )
    ON CONFLICT (id) DO NOTHING; -- Ignore if profile already exists
    
    -- Only assign role if it doesn't exist
    INSERT INTO public.user_roles (
        user_id, role
    ) VALUES (
        NEW.id, 'user'
    )
    ON CONFLICT (user_id, role) DO NOTHING; -- Ignore if role already exists
    
    -- Handle referral completion (check if this user was referred)
    SELECT public.complete_referral_signup(
        NEW.id, 
        NEW.email, 
        NEW.raw_user_meta_data->>'referral_code'
    ) INTO referral_result;
    
    -- Log new user registration (always log)
    INSERT INTO public.security_events (
        user_id, event_type, metadata
    ) VALUES (
        NEW.id, 'user_registration', 
        jsonb_build_object(
            'event', 'user_registration', 
            'email', NEW.email, 
            'full_name', NEW.raw_user_meta_data->>'full_name',
            'source', 'database_trigger',
            'referral_result', referral_result
        )
    );
    
    -- Add initial credits to ledger (only if not already added)
    INSERT INTO public.credits_ledger (
        user_id, transaction_type, credits_amount, balance_after, description
    ) 
    SELECT NEW.id, 'bonus', 5, 5, 'Welcome bonus credits'
    WHERE NOT EXISTS (
        SELECT 1 FROM public.credits_ledger 
        WHERE user_id = NEW.id AND transaction_type = 'bonus' AND description = 'Welcome bonus credits'
    );
    
    RETURN NEW;
END;
$$;

-- 4. Create function to award referral credits automatically
CREATE OR REPLACE FUNCTION public.award_referral_credits()
RETURNS TABLE(
    referral_id UUID,
    referrer_id UUID,
    referred_id UUID,
    credits_awarded_to_referrer INTEGER,
    credits_awarded_to_referred INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
    RETURN QUERY
    WITH eligible_referrals AS (
        -- Find completed referrals that haven't been awarded credits yet
        SELECT r.id, r.referrer_id, r.referred_id
        FROM public.referrals r
        WHERE r.is_signup_completed = true
          AND r.credits_awarded = false
          AND r.referred_id IS NOT NULL
          AND r.referrer_id IS NOT NULL
    ),
    award_credits AS (
        -- Award credits to both referrer and referred user
        INSERT INTO public.credits_ledger (user_id, transaction_type, credits_amount, balance_after, description)
        SELECT 
            er.referrer_id,
            'referral',
            3,
            COALESCE((SELECT balance_after FROM public.credits_ledger WHERE user_id = er.referrer_id ORDER BY created_at DESC LIMIT 1), 0) + 3,
            'Referral bonus - successful referral'
        FROM eligible_referrals er
        UNION ALL
        SELECT 
            er.referred_id,
            'referral',
            3,
            COALESCE((SELECT balance_after FROM public.credits_ledger WHERE user_id = er.referred_id ORDER BY created_at DESC LIMIT 1), 0) + 3,
            'Welcome bonus - referred signup'
        FROM eligible_referrals er
        RETURNING user_id, credits_amount
    ),
    update_referrals AS (
        -- Mark referrals as credits awarded
        UPDATE public.referrals r
        SET 
            credits_awarded = true,
            is_payment_completed = true,
            updated_at = NOW()
        FROM eligible_referrals er
        WHERE r.id = er.id
        RETURNING r.id, r.referrer_id, r.referred_id
    )
    SELECT 
        ur.id,
        ur.referrer_id,
        ur.referred_id,
        3 as credits_awarded_to_referrer,
        3 as credits_awarded_to_referred
    FROM update_referrals ur;
END;
$$;

-- 5. Fix all existing pending referrals
SELECT * FROM public.fix_pending_referrals();

-- 6. Award credits for all completed referrals
SELECT * FROM public.award_referral_credits();

-- 7. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_referrals_email_referred ON public.referrals(email_referred);
CREATE INDEX IF NOT EXISTS idx_referrals_signup_status ON public.referrals(is_signup_completed, is_payment_completed);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON public.referrals(referral_code);

-- 8. Add comment for documentation
COMMENT ON FUNCTION public.fix_pending_referrals() IS 'Fixes referrals that should be marked as completed but are still pending';
COMMENT ON FUNCTION public.complete_referral_signup(UUID, TEXT, TEXT) IS 'Handles referral completion during user signup';
COMMENT ON FUNCTION public.award_referral_credits() IS 'Awards referral credits to both referrer and referred users';
