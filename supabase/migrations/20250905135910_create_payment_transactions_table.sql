-- URGENT FIX: Create payment_transactions table to resolve webhook 400 errors
-- This directly addresses the error: POST | 400 | 13.235.133.152 | /rest/v1/payment_transactions

-- STEP 1: Create the payment_transactions table
CREATE TABLE IF NOT EXISTS public.payment_transactions (
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

-- STEP 2: Enable RLS (required for webhook access)
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- STEP 3: Grant ALL permissions to service_role (CRITICAL for webhook functions)
GRANT ALL ON public.payment_transactions TO service_role;
GRANT ALL ON public.payment_transactions TO postgres;

-- STEP 4: Create RLS policies
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