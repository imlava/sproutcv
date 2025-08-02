
-- Update payments table to support multiple payment methods
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'stripe',
ADD COLUMN IF NOT EXISTS payment_provider_id TEXT,
ADD COLUMN IF NOT EXISTS payment_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS refund_status TEXT DEFAULT 'none' CHECK (refund_status IN ('none', 'partial', 'full')),
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Update the status column to include more payment states
ALTER TABLE public.payments 
DROP CONSTRAINT IF EXISTS payments_status_check;

ALTER TABLE public.payments 
ADD CONSTRAINT payments_status_check 
CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded', 'processing'));

-- Create payment_transactions table for detailed transaction logs
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('charge', 'refund', 'partial_refund')),
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

-- Create policy for payment_transactions
CREATE POLICY "Users can view their own payment transactions" 
ON public.payment_transactions FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.payments 
    WHERE payments.id = payment_transactions.payment_id 
    AND payments.user_id = auth.uid()
));

-- Create credits_ledger table for detailed credit tracking
CREATE TABLE IF NOT EXISTS public.credits_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'refund', 'bonus', 'expiry')),
    credits_amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    related_payment_id UUID REFERENCES public.payments(id),
    related_analysis_id UUID REFERENCES public.resume_analyses(id),
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on credits_ledger
ALTER TABLE public.credits_ledger ENABLE ROW LEVEL SECURITY;

-- Create policy for credits_ledger
CREATE POLICY "Users can view their own credits ledger" 
ON public.credits_ledger FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert credits ledger entries" 
ON public.credits_ledger FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create user_sessions table for enhanced session management
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    device_info JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on user_sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy for user_sessions
CREATE POLICY "Users can view their own sessions" 
ON public.user_sessions FOR SELECT 
USING (auth.uid() = user_id);

-- Create password_reset_tokens table for secure password resets
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on password_reset_tokens
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy for password_reset_tokens (only system access needed)
CREATE POLICY "System access only for password reset tokens" 
ON public.password_reset_tokens FOR ALL 
USING (false) WITH CHECK (false);

-- Create security_events table for audit logging
CREATE TABLE IF NOT EXISTS public.security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('login', 'logout', 'password_change', 'password_reset', 'failed_login', 'suspicious_activity')),
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on security_events
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Create policy for security_events
CREATE POLICY "Users can view their own security events" 
ON public.security_events FOR SELECT 
USING (auth.uid() = user_id);

-- Update profiles table with enhanced security fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
ADD COLUMN IF NOT EXISTS backup_codes TEXT[],
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS security_preferences JSONB DEFAULT '{"email_notifications": true, "login_alerts": true}';

-- Create function to safely update credits
CREATE OR REPLACE FUNCTION public.update_user_credits(
    target_user_id UUID,
    credit_change INTEGER,
    transaction_type TEXT,
    description TEXT DEFAULT NULL,
    related_payment_id UUID DEFAULT NULL,
    related_analysis_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_credits INTEGER;
    new_balance INTEGER;
BEGIN
    -- Get current credits with row lock
    SELECT credits INTO current_credits 
    FROM public.profiles 
    WHERE id = target_user_id 
    FOR UPDATE;
    
    IF current_credits IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Calculate new balance
    new_balance := current_credits + credit_change;
    
    -- Prevent negative balance for usage transactions
    IF transaction_type = 'usage' AND new_balance < 0 THEN
        RAISE EXCEPTION 'Insufficient credits';
    END IF;
    
    -- Update user credits
    UPDATE public.profiles 
    SET credits = new_balance, updated_at = now()
    WHERE id = target_user_id;
    
    -- Log transaction
    INSERT INTO public.credits_ledger (
        user_id, transaction_type, credits_amount, balance_after,
        related_payment_id, related_analysis_id, description
    ) VALUES (
        target_user_id, transaction_type, credit_change, new_balance,
        related_payment_id, related_analysis_id, description
    );
    
    RETURN true;
END;
$$;

-- Create function to validate payment and update credits
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
BEGIN
    -- Get payment details with lock
    SELECT * INTO payment_record 
    FROM public.payments 
    WHERE id = payment_id AND status = 'pending'
    FOR UPDATE;
    
    IF payment_record IS NULL THEN
        RAISE EXCEPTION 'Payment not found or already processed';
    END IF;
    
    -- Update payment status
    UPDATE public.payments 
    SET status = 'completed', 
        payment_provider_id = COALESCE(provider_transaction_id, payment_provider_id),
        updated_at = now()
    WHERE id = payment_id;
    
    -- Add credits to user account
    PERFORM public.update_user_credits(
        payment_record.user_id,
        payment_record.credits_purchased,
        'purchase',
        'Credits purchased via ' || payment_record.payment_method,
        payment_id
    );
    
    -- Log transaction
    INSERT INTO public.payment_transactions (
        payment_id, transaction_type, amount, 
        provider_transaction_id, status
    ) VALUES (
        payment_id, 'charge', payment_record.amount,
        provider_transaction_id, 'completed'
    );
    
    RETURN true;
END;
$$;

-- Create function to consume credits for analysis
CREATE OR REPLACE FUNCTION public.consume_analysis_credit(
    target_user_id UUID,
    analysis_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Consume 1 credit for analysis
    PERFORM public.update_user_credits(
        target_user_id,
        -1,
        'usage',
        'Credit used for resume analysis',
        NULL,
        analysis_id
    );
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_credits_ledger_user_id_created ON public.credits_ledger(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_id ON public.payment_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id_active ON public.user_sessions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id_created ON public.security_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status_created ON public.payments(status, created_at DESC);

-- Update the handle_new_user function to include enhanced security
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (
        id, email, full_name, credits, email_verified
    ) VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        5, -- Give 5 free credits to new users
        COALESCE((NEW.raw_user_meta_data->>'email_verified')::boolean, false)
    );
    
    -- Log new user registration
    INSERT INTO public.security_events (
        user_id, event_type, metadata
    ) VALUES (
        NEW.id, 'login', 
        jsonb_build_object('event', 'user_registration', 'email', NEW.email)
    );
    
    -- Add initial credits to ledger
    INSERT INTO public.credits_ledger (
        user_id, transaction_type, credits_amount, balance_after, description
    ) VALUES (
        NEW.id, 'bonus', 5, 5, 'Welcome bonus credits'
    );
    
    RETURN NEW;
END;
$$;
