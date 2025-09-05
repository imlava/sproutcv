-- Apply Enhanced Payment Fix via SQL
-- This will update the process_successful_payment function

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
