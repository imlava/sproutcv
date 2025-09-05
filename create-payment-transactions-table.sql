-- Create payment_transactions table and fix webhook processing
-- This addresses the 400 error from the enhanced-dodo-webhook function

-- Step 1: Create the payment_transactions table
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
    payment_provider_id TEXT, -- Dodo payment ID
    transaction_type TEXT NOT NULL DEFAULT 'webhook' CHECK (transaction_type IN ('charge', 'refund', 'partial_refund', 'webhook')),
    amount INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'processing', 'disputed', 'refunded', 'expired')),
    provider_response JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Step 2: Enable RLS (Row Level Security)
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Step 3: Grant permissions to service role (needed for webhook functions)
GRANT ALL ON public.payment_transactions TO service_role;
GRANT ALL ON public.payment_transactions TO postgres;

-- Step 4: Create RLS policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Service role can manage payment transactions" ON public.payment_transactions;

-- Policy for users to view their own transactions
CREATE POLICY "Users can view their own payment transactions" 
ON public.payment_transactions FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.payments 
    WHERE payments.id = payment_transactions.payment_id 
    AND payments.user_id = auth.uid()
));

-- Policy for service role (webhook functions need this)
CREATE POLICY "Service role can manage payment transactions" 
ON public.payment_transactions FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- Step 5: Add missing columns to payments table if needed
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS payment_provider_id TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_id ON public.payment_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider_id ON public.payment_transactions(payment_provider_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payments_provider_id ON public.payments(payment_provider_id);

-- Step 7: Create trigger for updated_at
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

-- Step 8: Verify table was created
SELECT 
    'payment_transactions table created successfully' as status,
    COUNT(*) as row_count 
FROM public.payment_transactions;
