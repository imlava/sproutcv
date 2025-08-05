-- Apply missing database migrations for payment system

-- 1. Add missing columns to payments table
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'stripe',
ADD COLUMN IF NOT EXISTS payment_provider_id TEXT,
ADD COLUMN IF NOT EXISTS payment_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS refund_status TEXT DEFAULT 'none' CHECK (refund_status IN ('none', 'partial', 'full')),
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- 2. Update the status column to include more payment states
ALTER TABLE public.payments 
DROP CONSTRAINT IF EXISTS payments_status_check;

ALTER TABLE public.payments 
ADD CONSTRAINT payments_status_check 
CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded', 'processing'));

-- 3. Create payment_transactions table if it doesn't exist
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

-- 4. Enable RLS on payment_transactions
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- 5. Create policy for payment_transactions
CREATE POLICY "Users can view their own payment transactions" 
ON public.payment_transactions FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.payments 
    WHERE payments.id = payment_transactions.payment_id 
    AND payments.user_id = auth.uid()
));

-- 6. Create credits_ledger table if it doesn't exist
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

-- 7. Enable RLS on credits_ledger
ALTER TABLE public.credits_ledger ENABLE ROW LEVEL SECURITY;

-- 8. Create policies for credits_ledger
CREATE POLICY "Users can view their own credits ledger" 
ON public.credits_ledger FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert credits ledger entries" 
ON public.credits_ledger FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 9. Create user_sessions table if it doesn't exist
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

-- 10. Enable RLS on user_sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- 11. Create policy for user_sessions
CREATE POLICY "Users can view their own sessions" 
ON public.user_sessions FOR SELECT 
USING (auth.uid() = user_id);

-- 12. Create password_reset_tokens table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 13. Enable RLS on password_reset_tokens
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- 14. Create policy for password_reset_tokens
CREATE POLICY "Users can manage their own reset tokens" 
ON public.password_reset_tokens FOR ALL 
USING (auth.uid() = user_id);

-- 15. Create security_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 16. Enable RLS on security_events
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- 17. Create policy for security_events
CREATE POLICY "Users can view their own security events" 
ON public.security_events FOR SELECT 
USING (auth.uid() = user_id);

-- 18. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_credits_ledger_user_id_created ON public.credits_ledger(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_id ON public.payment_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id_active ON public.user_sessions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id_created ON public.security_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status_created ON public.payments(status, created_at DESC);

-- 19. Update the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  INSERT INTO public.security_events (user_id, event_type, metadata)
  VALUES (NEW.id, 'user_registered', jsonb_build_object('source', 'auth_trigger'));
  
  INSERT INTO public.credits_ledger (user_id, transaction_type, credits_amount, balance_after, description)
  VALUES (NEW.id, 'bonus', 1, 1, 'Welcome bonus credit');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 20. Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, role)
);

-- 21. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 22. Create policy for user_roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles FOR SELECT 
USING (auth.uid() = user_id);

-- 23. Create has_role function
CREATE OR REPLACE FUNCTION public.has_role(user_uuid UUID, role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_uuid AND role = role_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 24. Create update_user_credits function
CREATE OR REPLACE FUNCTION public.update_user_credits(
  user_uuid UUID,
  credits_to_add INTEGER,
  reason TEXT DEFAULT 'manual_adjustment'
)
RETURNS BOOLEAN AS $$
DECLARE
  current_credits INTEGER;
  new_credits INTEGER;
BEGIN
  -- Get current credits
  SELECT credits INTO current_credits
  FROM public.profiles
  WHERE id = user_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Calculate new credits
  new_credits := current_credits + credits_to_add;
  
  -- Update user credits
  UPDATE public.profiles
  SET credits = new_credits, updated_at = now()
  WHERE id = user_uuid;
  
  -- Log the transaction
  INSERT INTO public.credits_ledger (
    user_id, transaction_type, credits_amount, balance_after, description
  ) VALUES (
    user_uuid, 'bonus', credits_to_add, new_credits, reason
  );
  
  -- Log security event
  INSERT INTO public.security_events (
    user_id, event_type, metadata
  ) VALUES (
    user_uuid, 'credits_updated', jsonb_build_object(
      'credits_added', credits_to_add,
      'old_balance', current_credits,
      'new_balance', new_credits,
      'reason', reason
    )
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 25. Create process_successful_payment function
CREATE OR REPLACE FUNCTION public.process_successful_payment(
  payment_id UUID,
  provider_transaction_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  payment_record RECORD;
  current_credits INTEGER;
  new_credits INTEGER;
BEGIN
  -- Get payment details
  SELECT * INTO payment_record
  FROM public.payments
  WHERE id = payment_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found or already processed';
  END IF;
  
  -- Get current user credits
  SELECT credits INTO current_credits
  FROM public.profiles
  WHERE id = payment_record.user_id;
  
  -- Calculate new credits
  new_credits := current_credits + payment_record.credits_purchased;
  
  -- Update payment status
  UPDATE public.payments
  SET 
    status = 'completed',
    updated_at = now(),
    payment_provider_id = COALESCE(provider_transaction_id, payment_provider_id),
    payment_data = payment_data || jsonb_build_object(
      'processed_at', now(),
      'provider_transaction_id', provider_transaction_id
    )
  WHERE id = payment_id;
  
  -- Update user credits
  UPDATE public.profiles
  SET credits = new_credits, updated_at = now()
  WHERE id = payment_record.user_id;
  
  -- Log credit transaction
  INSERT INTO public.credits_ledger (
    user_id, transaction_type, credits_amount, balance_after, related_payment_id, description
  ) VALUES (
    payment_record.user_id, 'purchase', payment_record.credits_purchased, new_credits, payment_id,
    'Credits purchased via ' || payment_record.payment_method
  );
  
  -- Log security event
  INSERT INTO public.security_events (
    user_id, event_type, metadata
  ) VALUES (
    payment_record.user_id, 'payment_completed', jsonb_build_object(
      'payment_id', payment_id,
      'amount', payment_record.amount,
      'credits_purchased', payment_record.credits_purchased,
      'provider_transaction_id', provider_transaction_id
    )
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 26. Create consume_analysis_credit function
CREATE OR REPLACE FUNCTION public.consume_analysis_credit(
  user_uuid UUID,
  analysis_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  current_credits INTEGER;
  new_credits INTEGER;
BEGIN
  -- Get current credits
  SELECT credits INTO current_credits
  FROM public.profiles
  WHERE id = user_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  IF current_credits < 1 THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
  
  -- Calculate new credits
  new_credits := current_credits - 1;
  
  -- Update user credits
  UPDATE public.profiles
  SET credits = new_credits, updated_at = now()
  WHERE id = user_uuid;
  
  -- Log the transaction
  INSERT INTO public.credits_ledger (
    user_id, transaction_type, credits_amount, balance_after, related_analysis_id, description
  ) VALUES (
    user_uuid, 'usage', -1, new_credits, analysis_id, 'Resume analysis credit consumed'
  );
  
  -- Log security event
  INSERT INTO public.security_events (
    user_id, event_type, metadata
  ) VALUES (
    user_uuid, 'credit_consumed', jsonb_build_object(
      'analysis_id', analysis_id,
      'credits_used', 1,
      'old_balance', current_credits,
      'new_balance', new_credits
    )
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 27. Add expires_at column to resume_analyses if it doesn't exist
ALTER TABLE public.resume_analyses ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days');

-- 28. Create index for resume_analyses expires_at
CREATE INDEX IF NOT EXISTS idx_resume_analyses_expires ON public.resume_analyses(expires_at);

-- 29. Create contact_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'resolved')),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 30. Enable RLS on contact_messages
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- 31. Create policy for contact_messages (admin only)
CREATE POLICY "Admins can manage all contact messages" 
ON public.contact_messages FOR ALL 
USING (auth.uid() IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
));

-- 32. Create index for contact_messages
CREATE INDEX IF NOT EXISTS idx_contact_messages_status_created ON public.contact_messages(status, created_at DESC);

-- Success message
SELECT 'All migrations applied successfully!' as status; 