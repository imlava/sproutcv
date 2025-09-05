-- Fix payment_transactions table and permissions
-- This migration addresses the 400 error in enhanced-dodo-webhook function

-- 1. Ensure payment_transactions table exists with correct structure
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
    payment_provider_id TEXT, -- For Dodo payment IDs
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('charge', 'refund', 'partial_refund', 'webhook')),
    amount INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'processing')),
    provider_response JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Add missing columns if they don't exist
ALTER TABLE public.payment_transactions 
ADD COLUMN IF NOT EXISTS payment_provider_id TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 3. Update RLS policies to allow service role access
DROP POLICY IF EXISTS "Users can view their own payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Service role can access payment transactions" ON public.payment_transactions;

-- Enable RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Create policy for users
CREATE POLICY "Users can view their own payment transactions" 
ON public.payment_transactions FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.payments 
    WHERE payments.id = payment_transactions.payment_id 
    AND payments.user_id = auth.uid()
));

-- Create policy for service role (needed for webhook functions)
CREATE POLICY "Service role can manage payment transactions" 
ON public.payment_transactions FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_id ON public.payment_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider_id ON public.payment_transactions(payment_provider_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);

-- 5. Add updated_at trigger
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

-- 6. Ensure payments table has required columns for webhook processing
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'dodo',
ADD COLUMN IF NOT EXISTS payment_provider_id TEXT,
ADD COLUMN IF NOT EXISTS payment_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 7. Create index on payment_provider_id for webhook lookups
CREATE INDEX IF NOT EXISTS idx_payments_provider_id ON public.payments(payment_provider_id);

-- 8. Grant necessary permissions to service role
GRANT ALL ON public.payment_transactions TO service_role;
GRANT ALL ON public.payments TO service_role;
