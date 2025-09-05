-- Apply Enhanced Payment Fix via SQL
-- This will update the process_successful_payment function

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
    
    -- Get and lock user profile to prevent concurrent updates
    SELECT credits INTO current_credits
    FROM public.profiles
    WHERE id = payment_record.user_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User profile not found: %', payment_record.user_id;
    END IF;
    
    -- Handle NULL credits value (treat as 0 for calculation)
    IF current_credits IS NULL THEN
        RAISE NOTICE 'User % has NULL credits, treating as 0', payment_record.user_id;
        current_credits := 0;
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
    
    -- Calculate new credits
    new_credits := current_credits + payment_record.credits_purchased;
    
    -- Update payment status
    UPDATE public.payments
    SET 
        status = 'completed',
        payment_provider_id = COALESCE(provider_transaction_id, payment_provider_id),
        updated_at = now()
    WHERE id = payment_id;
    
    -- Update user credits (profile row is already locked from SELECT FOR UPDATE)
    UPDATE public.profiles
    SET 
        credits = new_credits,
        updated_at = now()
    WHERE id = payment_record.user_id;
    
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
                RAISE WARNING 'Failed to log payment transaction: %', SQLERRM;
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
                payment_id::text,
                'Credits purchased via ' || COALESCE(payment_record.payment_method, 'payment')
            );
            RAISE NOTICE 'Credits ledger entry logged successfully';
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to log credits ledger entry: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'credits_ledger table does not exist, skipping audit log';
    END IF;
    
    RAISE NOTICE 'Payment processed successfully. Credits: % -> %', current_credits, new_credits;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Payment processing failed: %', SQLERRM;
END;
$$;
