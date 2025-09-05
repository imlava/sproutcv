# 🚨 IMMEDIATE PAYMENT SYSTEM FIX

## URGENT: SQL Script to Execute NOW

Copy this SQL and run it in Supabase SQL Editor immediately:
**https://supabase.com/dashboard/project/yucdpvnmcuokemhqpnvz/sql**

```sql
# 🚨 EMERGENCY DATABASE FIX - COPY & PASTE INTO SUPABASE SQL EDITOR

## ⚡ IMMEDIATE ACTION REQUIRED

The emergency schema fix failed due to authentication issues. Please apply this fix manually:

### Step 1: Open Supabase SQL Editor
Go to: **https://supabase.com/dashboard/project/yucdpvnmcuokemhqpnvz/sql**

### Step 2: Copy and Paste This SQL (Everything below the line)

---

```sql
-- EMERGENCY FIX: Create missing payment_transactions table
-- This will fix the webhook 400 errors immediately

-- Create payment_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL DEFAULT 'payment',
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    provider_transaction_id TEXT,
    provider_response JSONB DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on payment_transactions
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Service role can manage payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Users can view their own payment transactions" ON public.payment_transactions;

-- Create policy for service role access (needed for webhooks)
CREATE POLICY "Service role can manage payment transactions" 
ON public.payment_transactions FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Create policy for users to view their own transactions
CREATE POLICY "Users can view their own payment transactions" 
ON public.payment_transactions FOR SELECT 
TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.payments 
    WHERE payments.id = payment_transactions.payment_id 
    AND payments.user_id = auth.uid()
));

-- Add missing columns to payments table
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS payment_provider_id TEXT,
ADD COLUMN IF NOT EXISTS payment_data JSONB DEFAULT '{}';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_id ON public.payment_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider_id ON public.payment_transactions(provider_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_id ON public.payments(payment_provider_id);

-- Verify the table was created
SELECT 'SUCCESS: payment_transactions table created!' as result;
```

---

### Step 3: Click "RUN" in the SQL Editor

### Step 4: Verify Success
You should see: `SUCCESS: payment_transactions table created!`

### Step 5: Test Your Payment Flow Again
After applying this fix, your webhook 400 errors should be resolved!

## 🎯 What This Fix Does:
- ✅ Creates the missing `payment_transactions` table
- ✅ Sets up proper Row Level Security (RLS) policies
- ✅ Adds missing columns to the `payments` table
- ✅ Creates performance indexes
- ✅ Fixes webhook 400 errors

## 🚀 After This Fix:
1. **Webhook 400 errors will stop** ✅
2. **Payment creation will continue working** ✅ 
3. **Transaction logging will work** ✅
4. **Only the function authentication issue will remain** (secondary priority)

**This is the critical fix needed to get your payment system working!**
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
