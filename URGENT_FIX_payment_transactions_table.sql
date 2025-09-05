-- URGENT FIX: Create payment_transactions table to resolve webhook 400 errors
-- This directly addresses the error: POST | 400 | 13.235.133.152 | https://yucdpvnmcuokemhqpnvz.supabase.co/rest/v1/payment_transactions

-- STEP 1: Check if table exists and create if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payment_transactions') THEN
    
    -- Create the payment_transactions table
    CREATE TABLE public.payment_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
        payment_provider_id TEXT, -- Dodo payment ID from webhook
        transaction_type TEXT NOT NULL DEFAULT 'webhook' CHECK (transaction_type IN ('charge', 'refund', 'partial_refund', 'webhook')),
        amount INTEGER NOT NULL DEFAULT 0,
        currency TEXT NOT NULL DEFAULT 'USD',
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'processing', 'disputed', 'refunded', 'expired')),
        provider_response JSONB DEFAULT '{}',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    RAISE NOTICE 'Created payment_transactions table';
  ELSE
    RAISE NOTICE 'payment_transactions table already exists';
  END IF;
END $$;

-- STEP 2: Enable RLS (required for webhook access)
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- STEP 3: Grant ALL permissions to service_role (CRITICAL for webhook functions)
GRANT ALL ON public.payment_transactions TO service_role;
GRANT ALL ON public.payment_transactions TO postgres;

-- STEP 4: Drop and recreate RLS policies to ensure they're correct
DROP POLICY IF EXISTS "Users can view their own payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Service role can manage payment transactions" ON public.payment_transactions;

-- Policy for authenticated users to view their own transactions
CREATE POLICY "Users can view their own payment transactions" 
ON public.payment_transactions FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.payments 
    WHERE payments.id = payment_transactions.payment_id 
    AND payments.user_id = auth.uid()
));

-- CRITICAL: Policy for service role (webhooks use service role authentication)
CREATE POLICY "Service role can manage payment transactions" 
ON public.payment_transactions FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- STEP 5: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_id ON public.payment_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider_id ON public.payment_transactions(payment_provider_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON public.payment_transactions(created_at);

-- STEP 6: Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_payment_transactions_updated_at ON public.payment_transactions;
CREATE TRIGGER update_payment_transactions_updated_at 
    BEFORE UPDATE ON public.payment_transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- STEP 7: Test the table by inserting and deleting a test record
DO $$
DECLARE
    test_id UUID;
BEGIN
    -- Insert test record using service role context
    INSERT INTO public.payment_transactions (
        payment_provider_id,
        transaction_type,
        amount,
        currency,
        status,
        provider_response,
        metadata
    ) VALUES (
        'test_webhook_fix_' || extract(epoch from now()),
        'webhook',
        100,
        'USD',
        'completed',
        '{"test": true}',
        '{"test_fix": true}'
    ) RETURNING id INTO test_id;
    
    -- Immediately delete the test record
    DELETE FROM public.payment_transactions WHERE id = test_id;
    
    RAISE NOTICE 'payment_transactions table test successful - webhook 400 errors should be resolved';
END $$;

-- STEP 8: Verify table structure
SELECT 
    'payment_transactions table ready for webhooks' as status,
    count(*) as current_row_count,
    (SELECT count(*) FROM information_schema.columns WHERE table_name = 'payment_transactions') as column_count
FROM public.payment_transactions;
