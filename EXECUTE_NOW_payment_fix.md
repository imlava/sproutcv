# 🚨 IMMEDIATE PAYMENT SYSTEM FIX

## URGENT: SQL Script to Execute NOW

Copy this SQL and run it in Supabase SQL Editor immediately:
**https://supabase.com/dashboard/project/yucdpvnmcuokemhqpnvz/sql**

```sql
-- URGENT FIX: Create payment_transactions table
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
    payment_provider_id TEXT,
    transaction_type TEXT NOT NULL DEFAULT 'webhook' CHECK (transaction_type IN ('charge', 'refund', 'partial_refund', 'webhook')),
    amount INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'processing', 'disputed', 'refunded', 'expired')),
    provider_response JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS and permissions (CRITICAL)
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.payment_transactions TO service_role;
GRANT ALL ON public.payment_transactions TO postgres;

-- Drop existing policies first, then recreate them
DROP POLICY IF EXISTS "Users can view their own payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Service role can manage payment transactions" ON public.payment_transactions;

-- Create RLS policies (fresh)
CREATE POLICY "Users can view their own payment transactions" 
ON public.payment_transactions FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.payments 
    WHERE payments.id = payment_transactions.payment_id 
    AND payments.user_id = auth.uid()
));

CREATE POLICY "Service role can manage payment transactions" 
ON public.payment_transactions FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- Create indexes (safe with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_id ON public.payment_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider_id ON public.payment_transactions(payment_provider_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);

-- Verify the fix worked
SELECT 
    'payment_transactions table created successfully' as status,
    COUNT(*) as row_count 
FROM public.payment_transactions;
```

## This Fixes
- ❌ HTTP 400 errors from Dodo Payments webhooks
- ❌ Missing payment_transactions table
- ❌ Blocked payment processing

## After Running This
- ✅ Webhooks will return 200 success
- ✅ Payments will process normally  
- ✅ Transaction logging will work

**Execute this SQL script NOW to restore payment processing!**
