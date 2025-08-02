-- Fix function search path security issues by adding SET search_path = ''
CREATE OR REPLACE FUNCTION public.update_user_credits(target_user_id uuid, credit_change integer, transaction_type text, description text DEFAULT NULL::text, related_payment_id uuid DEFAULT NULL::uuid, related_analysis_id uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
    current_credits INTEGER;
    new_balance INTEGER;
BEGIN
    -- Get current credits with row lock
    SELECT credits INTO current_credits 
    FROM public.profiles 
    WHERE id = target_user_id 
    FOR UPDATE;
    
    IF current_credits IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Calculate new balance
    new_balance := current_credits + credit_change;
    
    -- Prevent negative balance for usage transactions
    IF transaction_type = 'usage' AND new_balance < 0 THEN
        RAISE EXCEPTION 'Insufficient credits';
    END IF;
    
    -- Update user credits
    UPDATE public.profiles 
    SET credits = new_balance, updated_at = now()
    WHERE id = target_user_id;
    
    -- Log transaction
    INSERT INTO public.credits_ledger (
        user_id, transaction_type, credits_amount, balance_after,
        related_payment_id, related_analysis_id, description
    ) VALUES (
        target_user_id, transaction_type, credit_change, new_balance,
        related_payment_id, related_analysis_id, description
    );
    
    RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.process_successful_payment(payment_id uuid, provider_transaction_id text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
    payment_record RECORD;
BEGIN
    -- Get payment details with lock
    SELECT * INTO payment_record 
    FROM public.payments 
    WHERE id = payment_id AND status = 'pending'
    FOR UPDATE;
    
    IF payment_record IS NULL THEN
        RAISE EXCEPTION 'Payment not found or already processed';
    END IF;
    
    -- Update payment status
    UPDATE public.payments 
    SET status = 'completed', 
        payment_provider_id = COALESCE(provider_transaction_id, payment_provider_id),
        updated_at = now()
    WHERE id = payment_id;
    
    -- Add credits to user account
    PERFORM public.update_user_credits(
        payment_record.user_id,
        payment_record.credits_purchased,
        'purchase',
        'Credits purchased via ' || payment_record.payment_method,
        payment_id
    );
    
    -- Log transaction
    INSERT INTO public.payment_transactions (
        payment_id, transaction_type, amount, 
        provider_transaction_id, status
    ) VALUES (
        payment_id, 'charge', payment_record.amount,
        provider_transaction_id, 'completed'
    );
    
    RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.consume_analysis_credit(target_user_id uuid, analysis_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
    -- Consume 1 credit for analysis
    PERFORM public.update_user_credits(
        target_user_id,
        -1,
        'usage',
        'Credit used for resume analysis',
        NULL,
        analysis_id
    );
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE 
 SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$function$;

CREATE OR REPLACE FUNCTION public.admin_add_credits(target_user_id uuid, credits_to_add integer, admin_note text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
    admin_user_id UUID;
BEGIN
    admin_user_id := auth.uid();
    
    -- Check if caller is admin
    IF NOT public.has_role(admin_user_id, 'admin') THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;
    
    -- Add credits
    PERFORM public.update_user_credits(
        target_user_id,
        credits_to_add,
        'admin_grant',
        COALESCE(admin_note, 'Admin credit grant'),
        NULL,
        NULL
    );
    
    -- Log admin action
    INSERT INTO public.security_events (
        user_id, event_type, metadata, severity
    ) VALUES (
        target_user_id, 'admin_action', 
        jsonb_build_object(
            'action', 'credits_added',
            'credits_added', credits_to_add,
            'admin_user_id', admin_user_id,
            'admin_note', admin_note
        ),
        'info'
    );
    
    RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_contact_message_status(message_id uuid, new_status text, admin_notes text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
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