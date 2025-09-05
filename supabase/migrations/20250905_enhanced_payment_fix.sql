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
SET search_path = 'public', 'pg_temp'
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
    
    -- Authorization check: Verify caller is authorized for this payment
    -- Check if current user matches the payment owner or has admin role
    IF payment_record.user_id != auth.uid() AND NOT (
        SELECT EXISTS(
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    ) THEN
        RAISE EXCEPTION 'Unauthorized: User % cannot process payment % owned by %', 
            auth.uid(), payment_id, payment_record.user_id;
    END IF;
    
    -- State transition validation: Only allow completion from valid pre-states
    IF payment_record.status NOT IN ('pending', 'processing') THEN
        RAISE EXCEPTION 'Invalid state transition: Cannot complete payment with status "%". Only "pending" or "processing" payments can be completed.', 
            payment_record.status;
    END IF;
    
    IF payment_record.status = 'completed' THEN
        RAISE NOTICE 'Payment already completed: %', payment_id;
        RETURN TRUE;
    END IF;
    
    -- Atomically update user credits and get new balance using FOR UPDATE lock
    UPDATE public.profiles
    SET 
        credits = COALESCE(credits, 0) + payment_record.credits_purchased,
        updated_at = now()
    WHERE id = payment_record.user_id
    RETURNING COALESCE(credits, 0) - payment_record.credits_purchased, credits
    INTO current_credits, new_credits;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User profile not found: %', payment_record.user_id;
    END IF;
    
    -- Additional authorization check: Ensure profile belongs to authorized user
    -- (This is redundant with payment check above but adds defense in depth)
    IF payment_record.user_id != auth.uid() AND NOT (
        SELECT EXISTS(
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Cannot modify credits for user %', payment_record.user_id;
    END IF;
    
    -- Update payment status (within same transaction)
    UPDATE public.payments
    SET 
        status = 'completed',
        payment_provider_id = COALESCE(provider_transaction_id, payment_provider_id),
        updated_at = now()
    WHERE id = payment_id;
    
    -- Log credit transaction in payment_transactions if table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'payment_transactions'
    ) THEN
        BEGIN
            INSERT INTO public.payment_transactions (
                payment_id, transaction_type, amount, 
                provider_transaction_id, status
            ) VALUES (
                payment_id, 'charge', payment_record.amount,
                provider_transaction_id, 'completed'
            );
            RAISE NOTICE 'Payment transaction logged successfully';
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to log payment transaction: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
        END;
    ELSE
        RAISE NOTICE 'payment_transactions table does not exist, skipping transaction log';
    END IF;
    
    -- Try to log in credits_ledger if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'credits_ledger'
    ) THEN
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
                payment_id,  -- Direct UUID insertion, no casting needed
                'Credits purchased via ' || COALESCE(payment_record.payment_method, 'payment')
            );
            RAISE NOTICE 'Credits ledger entry logged successfully';
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to log credits ledger entry: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
        END;
    ELSE
        RAISE NOTICE 'credits_ledger table does not exist, skipping audit log';
    END IF;
    
    RAISE NOTICE 'Payment processed successfully. Credits: % -> %', current_credits, new_credits;
    
    RETURN TRUE;
EXCEPTION
    WHEN check_violation OR foreign_key_violation OR unique_violation THEN
        -- Re-raise constraint violations with context
        RAISE EXCEPTION 'Payment processing constraint violation: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    WHEN insufficient_privilege OR invalid_authorization_specification THEN
        -- Re-raise authorization errors with context
        RAISE EXCEPTION 'Payment processing authorization error: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    WHEN OTHERS THEN
        -- Re-raise unexpected errors with full context
        RAISE EXCEPTION 'Payment processing unexpected error: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;

-- Create enhanced function to check and process pending payments
CREATE OR REPLACE FUNCTION public.check_and_process_pending_payments()
RETURNS TABLE(
    payment_id UUID,
    user_id UUID,
    status TEXT,
    credits_added INTEGER,
    attempts INTEGER,
    failure_count INTEGER,
    last_error TEXT,
    error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
DECLARE
    payment_rec RECORD;
    process_result BOOLEAN;
    error_msg TEXT;
    MAX_ATTEMPTS CONSTANT INTEGER := 3;
    records_processed INTEGER := 0;
    MAX_RECORDS CONSTANT INTEGER := 5;  -- Reduced for safety
BEGIN
    -- Find pending payments ready for processing with locking
    FOR payment_rec IN 
        SELECT p.id, p.user_id, p.credits_purchased, p.status, p.payment_provider_id,
               COALESCE(p.processing_attempts, 0) as attempts,
               COALESCE(p.failure_count, 0) as failures,
               p.last_error
        FROM public.payments p
        WHERE p.status = 'pending' 
        AND p.created_at < NOW() - INTERVAL '5 minutes'
        AND p.created_at > NOW() - INTERVAL '24 hours'  -- Don't process very old payments
        AND COALESCE(p.processing_attempts, 0) < MAX_ATTEMPTS  -- Haven't exceeded max attempts
        AND (p.external_confirmation IS NULL OR p.external_confirmation = true)  -- Ready for processing
        ORDER BY p.created_at DESC
        LIMIT MAX_RECORDS
        FOR UPDATE SKIP LOCKED  -- Prevent concurrent processing
    LOOP
        -- Set statement timeout for this payment processing
        SET LOCAL statement_timeout = '30s';
        
        BEGIN
            -- Increment processing attempts atomically
            UPDATE public.payments 
            SET processing_attempts = COALESCE(processing_attempts, 0) + 1,
                updated_at = now()
            WHERE id = payment_rec.id;
            
            -- Try to process the payment
            SELECT public.process_successful_payment(payment_rec.id) INTO process_result;
            
            IF process_result THEN
                -- Payment processed successfully
                payment_id := payment_rec.id;
                user_id := payment_rec.user_id;
                status := 'completed';
                credits_added := payment_rec.credits_purchased;
                attempts := payment_rec.attempts + 1;
                failure_count := payment_rec.failures;
                last_error := NULL;
                error_message := NULL;
                RETURN NEXT;
                
                records_processed := records_processed + 1;
            ELSE
                -- Unexpected: process_successful_payment returned false
                error_msg := 'process_successful_payment returned false';
                
                -- Update failure tracking
                UPDATE public.payments 
                SET failure_count = COALESCE(failure_count, 0) + 1,
                    last_error = error_msg,
                    updated_at = now()
                WHERE id = payment_rec.id;
                
                -- Return failure record
                payment_id := payment_rec.id;
                user_id := payment_rec.user_id;
                status := 'pending';
                credits_added := 0;
                attempts := payment_rec.attempts + 1;
                failure_count := payment_rec.failures + 1;
                last_error := error_msg;
                error_message := error_msg;
                RETURN NEXT;
            END IF;
            
        EXCEPTION
            WHEN OTHERS THEN
                error_msg := SQLERRM || ' (SQLSTATE: ' || SQLSTATE || ')';
                
                -- Update failure tracking atomically
                UPDATE public.payments 
                SET failure_count = COALESCE(failure_count, 0) + 1,
                    last_error = error_msg,
                    updated_at = now()
                WHERE id = payment_rec.id;
                
                -- Check if we should mark as permanently failed
                IF (payment_rec.attempts + 1) >= MAX_ATTEMPTS THEN
                    UPDATE public.payments 
                    SET status = 'failed',
                        error_reason = 'Max processing attempts exceeded: ' || error_msg,
                        updated_at = now()
                    WHERE id = payment_rec.id;
                    
                    -- Return permanent failure record
                    payment_id := payment_rec.id;
                    user_id := payment_rec.user_id;
                    status := 'failed';
                    credits_added := 0;
                    attempts := payment_rec.attempts + 1;
                    failure_count := payment_rec.failures + 1;
                    last_error := error_msg;
                    error_message := 'PERMANENT FAILURE: ' || error_msg;
                    RETURN NEXT;
                ELSE
                    -- Return temporary failure record
                    payment_id := payment_rec.id;
                    user_id := payment_rec.user_id;
                    status := 'pending';
                    credits_added := 0;
                    attempts := payment_rec.attempts + 1;
                    failure_count := payment_rec.failures + 1;
                    last_error := error_msg;
                    error_message := 'RETRY AVAILABLE: ' || error_msg;
                    RETURN NEXT;
                END IF;
        END;
        
        -- Brief pause between payments to avoid overwhelming the system
        PERFORM pg_sleep(0.1);
        
        -- Reset statement timeout
        SET LOCAL statement_timeout = DEFAULT;
    END LOOP;
    
    -- Log summary
    RAISE NOTICE 'Batch payment processing completed. Records processed: %', records_processed;
    
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
