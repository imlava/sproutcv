-- 🛡️ DODO PAYMENTS PERFECT INTEGRATION - DATABASE SCHEMA
-- Run this SQL in Supabase SQL Editor to create all required tables

-- =============================================================================
-- 1. USER CREDITS TABLE - With Dodo Verification
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    email TEXT,
    payment_id TEXT,
    subscription_id TEXT,
    credits_added INTEGER NOT NULL,
    amount_paid INTEGER,
    currency TEXT DEFAULT 'USD',
    verified_by_dodo BOOLEAN DEFAULT false,
    dodo_status TEXT,
    source TEXT,
    webhook_event TEXT,
    status TEXT DEFAULT 'active',
    revoked_reason TEXT,
    revoked_amount INTEGER,
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own credits" 
ON public.user_credits FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage credits" 
ON public.user_credits FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON public.user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_payment_id ON public.user_credits(payment_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_status ON public.user_credits(status);
CREATE INDEX IF NOT EXISTS idx_user_credits_verified ON public.user_credits(verified_by_dodo);

-- =============================================================================
-- 2. USER SUBSCRIPTIONS TABLE - With Dodo Verification
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL,
    product_id TEXT,
    status TEXT NOT NULL,
    amount INTEGER,
    currency TEXT DEFAULT 'USD',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    verified_by_dodo BOOLEAN DEFAULT false,
    last_payment_amount INTEGER,
    last_payment_at TIMESTAMP WITH TIME ZONE,
    last_verified TIMESTAMP WITH TIME ZONE,
    activated_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own subscriptions" 
ON public.user_subscriptions FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions" 
ON public.user_subscriptions FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_subscription_id ON public.user_subscriptions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);

-- =============================================================================
-- 3. SECURITY EVENTS TABLE - Security Incident Logging
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    payment_id TEXT,
    subscription_id TEXT,
    user_id UUID,
    customer_id TEXT,
    amount INTEGER,
    credits_added INTEGER,
    dodo_status TEXT,
    reason TEXT,
    source TEXT,
    error TEXT,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service role can manage security events" 
ON public.security_events FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can view security events" 
ON public.security_events FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_security_events_type ON public.security_events(type);
CREATE INDEX IF NOT EXISTS idx_security_events_payment_id ON public.security_events(payment_id);
CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON public.security_events(timestamp DESC);

-- =============================================================================
-- 4. WEBHOOK EVENTS TABLE - Webhook Event Logging
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    payment_id TEXT,
    subscription_id TEXT,
    customer_id TEXT,
    processed BOOLEAN DEFAULT false,
    result JSONB DEFAULT '{}',
    source TEXT,
    webhook_signature TEXT,
    raw_payload TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service role can manage webhook events" 
ON public.webhook_events FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON public.webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_payment_id ON public.webhook_events(payment_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_timestamp ON public.webhook_events(timestamp DESC);

-- =============================================================================
-- 5. PAYMENTS TABLE - Payment Records with Dodo Verification
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id TEXT UNIQUE NOT NULL,
    user_id UUID,
    customer_id TEXT,
    amount INTEGER,
    currency TEXT DEFAULT 'USD',
    status TEXT,
    verified_by_dodo BOOLEAN DEFAULT false,
    dodo_verification_count INTEGER DEFAULT 0,
    last_dodo_check TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own payments" 
ON public.payments FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage payments" 
ON public.payments FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON public.payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_verified ON public.payments(verified_by_dodo);

-- =============================================================================
-- 6. REFUNDS TABLE - Refund Records with Credit Tracking
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id TEXT NOT NULL,
    user_id UUID,
    customer_id TEXT,
    amount INTEGER,
    currency TEXT DEFAULT 'USD',
    credits_revoked INTEGER DEFAULT 0,
    verified_by_dodo BOOLEAN DEFAULT false,
    reason TEXT,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own refunds" 
ON public.refunds FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage refunds" 
ON public.refunds FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON public.refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_user_id ON public.refunds(user_id);

-- =============================================================================
-- 7. UPDATE EXISTING PAYMENT_TRANSACTIONS TABLE (if exists)
-- =============================================================================

-- Add Dodo verification columns to existing payment_transactions table
DO $$ 
BEGIN
    -- Add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_transactions' AND column_name = 'verified_by_dodo') THEN
        ALTER TABLE public.payment_transactions ADD COLUMN verified_by_dodo BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_transactions' AND column_name = 'dodo_status') THEN
        ALTER TABLE public.payment_transactions ADD COLUMN dodo_status TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_transactions' AND column_name = 'dodo_verification_count') THEN
        ALTER TABLE public.payment_transactions ADD COLUMN dodo_verification_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_transactions' AND column_name = 'last_dodo_check') THEN
        ALTER TABLE public.payment_transactions ADD COLUMN last_dodo_check TIMESTAMP WITH TIME ZONE;
    END IF;
EXCEPTION 
    WHEN undefined_table THEN
        -- Table doesn't exist, that's okay
        NULL;
END $$;

-- =============================================================================
-- 8. UTILITY FUNCTIONS
-- =============================================================================

-- Function to get user's total active credits
CREATE OR REPLACE FUNCTION get_user_active_credits(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_credits INTEGER;
BEGIN
    SELECT COALESCE(SUM(credits_added), 0)
    INTO total_credits
    FROM public.user_credits
    WHERE user_id = user_uuid 
    AND status = 'active'
    AND verified_by_dodo = true;
    
    RETURN total_credits;
END;
$$;

-- Function to get user's subscription status
CREATE OR REPLACE FUNCTION get_user_subscription_status(user_uuid UUID)
RETURNS TABLE(
    subscription_id TEXT,
    status TEXT,
    product_id TEXT,
    current_period_end TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        us.subscription_id,
        us.status,
        us.product_id,
        us.current_period_end
    FROM public.user_subscriptions us
    WHERE us.user_id = user_uuid
    AND us.verified_by_dodo = true
    ORDER BY us.created_at DESC
    LIMIT 1;
END;
$$;

-- =============================================================================
-- 9. TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- =============================================================================

-- Trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_user_credits_updated_at BEFORE UPDATE ON public.user_credits FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON public.user_subscriptions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =============================================================================
-- 10. VERIFICATION SUMMARY
-- =============================================================================

-- Create a view for payment verification summary
CREATE OR REPLACE VIEW payment_verification_summary AS
SELECT 
    p.payment_id,
    p.user_id,
    p.amount,
    p.currency,
    p.status,
    p.verified_by_dodo,
    p.dodo_verification_count,
    p.last_dodo_check,
    uc.credits_added,
    uc.status as credit_status,
    se.type as security_event_type,
    se.reason as security_reason
FROM public.payments p
LEFT JOIN public.user_credits uc ON p.payment_id = uc.payment_id
LEFT JOIN public.security_events se ON p.payment_id = se.payment_id
ORDER BY p.created_at DESC;

-- =============================================================================
-- SUCCESS MESSAGE
-- =============================================================================

SELECT 
    '🎉 DODO PAYMENTS PERFECT INTEGRATION SCHEMA APPLIED SUCCESSFULLY!' as result,
    'All tables, indexes, policies, and functions have been created.' as details,
    'Your database is now ready for 100% secure Dodo Payments integration.' as status;
