-- COMPREHENSIVE SECURITY HARDENING MIGRATION
-- Fix 1: Secure user_sessions table with proper RLS policies
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.user_sessions;

CREATE POLICY "Users can view their own sessions" 
ON public.user_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Prevent any user manipulation of sessions - only system can manage these
CREATE POLICY "System only can insert sessions" 
ON public.user_sessions 
FOR INSERT 
WITH CHECK (false);

CREATE POLICY "System only can update sessions" 
ON public.user_sessions 
FOR UPDATE 
USING (false);

CREATE POLICY "System only can delete sessions" 
ON public.user_sessions 
FOR DELETE 
USING (false);

-- Fix 2: Secure security_events table with proper RLS policies
DROP POLICY IF EXISTS "Users can view their own security events" ON public.security_events;

CREATE POLICY "Users can view their own security events" 
ON public.security_events 
FOR SELECT 
USING (auth.uid() = user_id);

-- Prevent any user manipulation of security events - only system can manage these
CREATE POLICY "System only can insert security events" 
ON public.security_events 
FOR INSERT 
WITH CHECK (false);

CREATE POLICY "System only can update security events" 
ON public.security_events 
FOR UPDATE 
USING (false);

CREATE POLICY "System only can delete security events" 
ON public.security_events 
FOR DELETE 
USING (false);

-- Fix 3: Secure contact_messages table - restrict SELECT to admins only
CREATE POLICY "Only admins can view contact messages" 
ON public.contact_messages 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- Fix 4: Secure payments table with comprehensive RLS policies
-- Payments should only be readable by users, and only system can manipulate them
CREATE POLICY "System only can insert payments" 
ON public.payments 
FOR INSERT 
WITH CHECK (false);

CREATE POLICY "System only can update payments" 
ON public.payments 
FOR UPDATE 
USING (false);

CREATE POLICY "System only can delete payments" 
ON public.payments 
FOR DELETE 
USING (false);

-- Fix 5: Harden database functions with immutable search_path
-- Update all SECURITY DEFINER functions to use SET search_path TO ''

-- Update generate_referral_code function
CREATE OR REPLACE FUNCTION public.generate_referral_code()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  code TEXT;
  exists_check INTEGER;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text) from 1 for 8));
    SELECT COUNT(*) INTO exists_check FROM public.profiles WHERE referral_code = code;
    IF exists_check = 0 THEN
      EXIT;
    END IF;
  END LOOP;
  RETURN code;
END;
$function$;

-- Update admin_get_user_stats function
CREATE OR REPLACE FUNCTION public.admin_get_user_stats()
 RETURNS TABLE(total_users bigint, active_users bigint, total_analyses bigint, total_revenue numeric, pending_messages bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$;

-- Update admin_get_user_details function
CREATE OR REPLACE FUNCTION public.admin_get_user_details(target_user_id uuid)
 RETURNS TABLE(user_id uuid, email text, full_name text, credits integer, total_analyses bigint, total_spent numeric, referrals_made bigint, last_analysis timestamp with time zone, signup_date timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$;

-- Update process_referral_credit function
CREATE OR REPLACE FUNCTION public.process_referral_credit(referred_user_id uuid, payment_amount integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$;

-- Update update_contact_message_status function
CREATE OR REPLACE FUNCTION public.update_contact_message_status(message_id uuid, new_status text, admin_notes text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    admin_user_id UUID;
BEGIN
    admin_user_id := auth.uid();
    
    -- Check if caller is admin
    IF NOT public.has_role(admin_user_id, 'admin') THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;
    
    -- Update message
    UPDATE public.contact_messages
    SET 
        status = new_status,
        admin_notes = COALESCE(admin_notes, admin_notes),
        responded_by = CASE 
            WHEN new_status IN ('replied', 'read') THEN admin_user_id 
            ELSE responded_by 
        END,
        responded_at = CASE 
            WHEN new_status = 'replied' THEN now() 
            ELSE responded_at 
        END,
        updated_at = now()
    WHERE id = message_id;
    
    RETURN TRUE;
END;
$function$;

-- Update process_payment_refund function
CREATE OR REPLACE FUNCTION public.process_payment_refund(payment_id uuid, refund_amount integer, refund_reason text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    payment_record RECORD;
    admin_user_id UUID;
BEGIN
    admin_user_id := auth.uid();
    
    -- Check if caller is admin
    IF NOT public.has_role(admin_user_id, 'admin') THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;
    
    -- Get payment details
    SELECT * INTO payment_record 
    FROM public.payments 
    WHERE id = payment_id AND status = 'completed';
    
    IF payment_record IS NULL THEN
        RAISE EXCEPTION 'Payment not found or not completed';
    END IF;
    
    -- Update payment with refund details
    UPDATE public.payments 
    SET 
        refund_status = 'refunded',
        refund_amount = refund_amount,
        refund_reason = refund_reason,
        refunded_at = now(),
        refunded_by = admin_user_id,
        updated_at = now()
    WHERE id = payment_id;
    
    -- Deduct credits from user if partial refund or remove all if full refund
    IF refund_amount = payment_record.amount THEN
        -- Full refund - remove all credits purchased
        PERFORM public.update_user_credits(
            payment_record.user_id,
            -payment_record.credits_purchased,
            'refund',
            'Full refund for payment ID: ' || payment_id,
            payment_id
        );
    ELSE
        -- Partial refund - calculate credits to remove proportionally
        DECLARE
            credits_to_remove INTEGER;
        BEGIN
            credits_to_remove := ROUND((refund_amount::DECIMAL / payment_record.amount::DECIMAL) * payment_record.credits_purchased);
            PERFORM public.update_user_credits(
                payment_record.user_id,
                -credits_to_remove,
                'refund',
                'Partial refund for payment ID: ' || payment_id,
                payment_id
            );
        END;
    END IF;
    
    -- Log admin action
    INSERT INTO public.security_events (
        user_id, event_type, metadata, severity
    ) VALUES (
        payment_record.user_id, 'admin_action',
        jsonb_build_object(
            'action', 'payment_refund',
            'payment_id', payment_id,
            'refund_amount', refund_amount,
            'refund_reason', refund_reason,
            'admin_user_id', admin_user_id
        ),
        'warning'
    );
    
    RETURN TRUE;
END;
$function$;