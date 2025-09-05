-- Enhanced Payment System Fix
-- Fixes the core payment processing issues in the system

-- Enhanced process_successful_payment function with better error handling and logging
CREATE OR REPLACE FUNCTION public.process_successful_payment(
    payment_id UUID,
    provider_transaction_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    payment_record RECORD;
    current_credits INTEGER;
    new_credits INTEGER;
BEGIN
    -- Log function entry
    RAISE NOTICE 'Processing payment: %', payment_id;
    
    -- Get payment details with lock
    SELECT * INTO payment_record
    FROM public.payments
    WHERE id = payment_id
    FOR UPDATE;
    
    IF payment_record IS NULL THEN
        RAISE EXCEPTION 'Payment not found: %', payment_id;
    END IF;
    
    IF payment_record.status = 'completed' THEN
        RAISE NOTICE 'Payment already completed: %', payment_id;
        RETURN TRUE;
    END IF;
    
    -- Get current user credits
    SELECT credits INTO current_credits
    FROM public.profiles
    WHERE id = payment_record.user_id;
    
    IF current_credits IS NULL THEN
        RAISE EXCEPTION 'User profile not found: %', payment_record.user_id;
    END IF;
    
    -- Calculate new credits
    new_credits := current_credits + payment_record.credits_purchased;
    
    -- Update payment status
    UPDATE public.payments
    SET 
        status = 'completed',
        payment_provider_id = COALESCE(provider_transaction_id, payment_provider_id),
        updated_at = now()
    WHERE id = payment_id;
    
    -- Update user credits
    UPDATE public.profiles
    SET 
        credits = new_credits,
        updated_at = now()
    WHERE id = payment_record.user_id;
    
    -- Log credit transaction in payment_transactions if table exists
    BEGIN
        INSERT INTO public.payment_transactions (
            payment_id, transaction_type, amount, 
            provider_transaction_id, status
        ) VALUES (
            payment_id, 'charge', payment_record.amount,
            provider_transaction_id, 'completed'
        );
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE 'payment_transactions table does not exist, skipping transaction log';
    END;
    
    -- Try to log in credits_ledger if it exists
    BEGIN
        INSERT INTO public.credits_ledger (
            user_id,
            transaction_type,
            credits_amount,
            balance_after,
            related_payment_id,
            description
        ) VALUES (
            payment_record.user_id,
            'purchase',
            payment_record.credits_purchased,
            new_credits,
            payment_id::text,
            'Credits purchased via ' || COALESCE(payment_record.payment_method, 'payment')
        );
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE 'credits_ledger table does not exist, skipping audit log';
    END;
    
    RAISE NOTICE 'Payment processed successfully. Credits: % -> %', current_credits, new_credits;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Payment processing failed: %', SQLERRM;
END;
$$;

-- Create enhanced function to check and process pending payments
CREATE OR REPLACE FUNCTION public.check_and_process_pending_payments()
RETURNS TABLE(
    payment_id UUID,
    user_id UUID,
    status TEXT,
    credits_added INTEGER,
    error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    payment_rec RECORD;
    process_result BOOLEAN;
    error_msg TEXT;
BEGIN
    -- Find pending payments older than 5 minutes that might need processing
    FOR payment_rec IN 
        SELECT p.id, p.user_id, p.credits_purchased, p.status, p.payment_provider_id
        FROM public.payments p
        WHERE p.status = 'pending' 
        AND p.created_at < NOW() - INTERVAL '5 minutes'
        AND p.created_at > NOW() - INTERVAL '24 hours'  -- Don't process very old payments
        ORDER BY p.created_at DESC
        LIMIT 10
    LOOP
        BEGIN
            -- Try to process the payment
            SELECT public.process_successful_payment(payment_rec.id) INTO process_result;
            
            IF process_result THEN
                -- Return success record
                payment_id := payment_rec.id;
                user_id := payment_rec.user_id;
                status := 'completed';
                credits_added := payment_rec.credits_purchased;
                error_message := NULL;
                RETURN NEXT;
            END IF;
            
        EXCEPTION
            WHEN OTHERS THEN
                error_msg := SQLERRM;
                -- Return error record
                payment_id := payment_rec.id;
                user_id := payment_rec.user_id;
                status := 'failed';
                credits_added := 0;
                error_message := error_msg;
                RETURN NEXT;
        END;
    END LOOP;
    
    RETURN;
END;
$$;

-- Create function to get user credit statistics
CREATE OR REPLACE FUNCTION public.get_user_credit_summary(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    profile_data RECORD;
    payment_stats RECORD;
    result JSONB;
BEGIN
    -- Get user profile
    SELECT credits INTO profile_data
    FROM public.profiles
    WHERE id = target_user_id;
    
    IF profile_data IS NULL THEN
        RETURN jsonb_build_object('error', 'User not found');
    END IF;
    
    -- Get payment statistics
    SELECT 
        COUNT(*) as total_payments,
        SUM(CASE WHEN status = 'completed' THEN credits_purchased ELSE 0 END) as total_credits_purchased,
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_spent,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments
    INTO payment_stats
    FROM public.payments
    WHERE user_id = target_user_id;
    
    -- Build result
    result := jsonb_build_object(
        'current_credits', COALESCE(profile_data.credits, 0),
        'total_payments', COALESCE(payment_stats.total_payments, 0),
        'total_credits_purchased', COALESCE(payment_stats.total_credits_purchased, 0),
        'total_spent', COALESCE(payment_stats.total_spent, 0),
        'pending_payments', COALESCE(payment_stats.pending_payments, 0)
    );
    
    RETURN result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.process_successful_payment TO service_role;
GRANT EXECUTE ON FUNCTION public.check_and_process_pending_payments TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_credit_summary TO service_role, authenticated;

-- Add helpful comments
COMMENT ON FUNCTION public.process_successful_payment IS 'Enhanced payment processing with better error handling and logging';
COMMENT ON FUNCTION public.check_and_process_pending_payments IS 'Batch process pending payments that may have been missed';
COMMENT ON FUNCTION public.get_user_credit_summary IS 'Get comprehensive credit and payment statistics for a user';
