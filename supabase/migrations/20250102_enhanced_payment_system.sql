-- Enhanced Payment System Migration
-- Adds comprehensive payment tracking, credit management, and notification systems

-- Create enhanced credits ledger table
CREATE TABLE IF NOT EXISTS credits_ledger (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  credits_before INTEGER NOT NULL DEFAULT 0,
  credits_after INTEGER NOT NULL DEFAULT 0,
  credits_changed INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'refund', 'admin_add', 'admin_remove', 'expire', 'freeze', 'unfreeze')),
  description TEXT NOT NULL,
  source TEXT DEFAULT 'manual',
  related_payment_id TEXT,
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create webhook logs table
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payment_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('received', 'processed', 'failed', 'ignored')),
  payload JSONB NOT NULL,
  result JSONB,
  error_message TEXT,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create email notifications table
CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email_type TEXT NOT NULL,
  payment_id TEXT,
  email_provider_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced', 'delivered')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add frozen credits column to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS credits_frozen INTEGER DEFAULT 0;

-- Enhanced payment_transactions table (if not exists)
CREATE TABLE IF NOT EXISTS payment_transactions_enhanced (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  payment_provider TEXT NOT NULL DEFAULT 'dodo',
  payment_provider_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  credits INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  failure_reason TEXT,
  webhook_verified BOOLEAN DEFAULT false,
  refund_amount INTEGER DEFAULT 0,
  dispute_amount INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  CONSTRAINT unique_payment_provider_id UNIQUE (payment_provider, payment_provider_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_credits_ledger_user_id ON credits_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_credits_ledger_created_at ON credits_ledger(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credits_ledger_transaction_type ON credits_ledger(transaction_type);
CREATE INDEX IF NOT EXISTS idx_credits_ledger_related_payment ON credits_ledger(related_payment_id);
CREATE INDEX IF NOT EXISTS idx_credits_ledger_expires_at ON credits_ledger(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_webhook_logs_payment_id ON webhook_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_provider_event ON webhook_logs(provider, event_type);

CREATE INDEX IF NOT EXISTS idx_email_notifications_user_id ON email_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_payment_id ON email_notifications(payment_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON email_notifications(status);
CREATE INDEX IF NOT EXISTS idx_email_notifications_created_at ON email_notifications(created_at DESC);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_credits_ledger_updated_at 
  BEFORE UPDATE ON credits_ledger 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_enhanced_updated_at 
  BEFORE UPDATE ON payment_transactions_enhanced 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE credits_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions_enhanced ENABLE ROW LEVEL SECURITY;

-- Credits ledger policies
CREATE POLICY "Users can view their own credit transactions" ON credits_ledger
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all credit transactions" ON credits_ledger
  FOR ALL USING (auth.role() = 'service_role');

-- Email notifications policies  
CREATE POLICY "Users can view their own email notifications" ON email_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all email notifications" ON email_notifications
  FOR ALL USING (auth.role() = 'service_role');

-- Payment transactions policies
CREATE POLICY "Users can view their own payments" ON payment_transactions_enhanced
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all payments" ON payment_transactions_enhanced
  FOR ALL USING (auth.role() = 'service_role');

-- Webhook logs - service role only
CREATE POLICY "Service role can manage webhook logs" ON webhook_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Create a function to safely add credits with full audit trail
CREATE OR REPLACE FUNCTION add_credits_with_audit(
  p_user_id UUID,
  p_credits INTEGER,
  p_description TEXT,
  p_source TEXT DEFAULT 'manual',
  p_related_payment_id TEXT DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_current_credits INTEGER;
  v_new_credits INTEGER;
  v_ledger_id UUID;
BEGIN
  -- Get current credits
  SELECT credits INTO v_current_credits 
  FROM user_profiles 
  WHERE id = p_user_id;
  
  IF v_current_credits IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
  
  v_new_credits := v_current_credits + p_credits;
  
  -- Update user credits
  UPDATE user_profiles 
  SET credits = v_new_credits, updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Record in ledger
  INSERT INTO credits_ledger (
    user_id, credits_before, credits_after, credits_changed,
    transaction_type, description, source, related_payment_id, expires_at
  ) VALUES (
    p_user_id, v_current_credits, v_new_credits, p_credits,
    'purchase', p_description, p_source, p_related_payment_id, p_expires_at
  ) RETURNING id INTO v_ledger_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'ledger_id', v_ledger_id,
    'credits_before', v_current_credits,
    'credits_after', v_new_credits,
    'credits_added', p_credits
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to use credits with validation
CREATE OR REPLACE FUNCTION use_credits_with_validation(
  p_user_id UUID,
  p_credits INTEGER,
  p_description TEXT,
  p_analysis_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_current_credits INTEGER;
  v_new_credits INTEGER;
  v_ledger_id UUID;
BEGIN
  -- Get current credits
  SELECT credits INTO v_current_credits 
  FROM user_profiles 
  WHERE id = p_user_id;
  
  IF v_current_credits IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
  
  IF v_current_credits < p_credits THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient credits',
      'available', v_current_credits,
      'required', p_credits
    );
  END IF;
  
  v_new_credits := v_current_credits - p_credits;
  
  -- Update user credits
  UPDATE user_profiles 
  SET credits = v_new_credits, updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Record in ledger
  INSERT INTO credits_ledger (
    user_id, credits_before, credits_after, credits_changed,
    transaction_type, description, source,
    metadata
  ) VALUES (
    p_user_id, v_current_credits, v_new_credits, -p_credits,
    'usage', p_description, 'usage',
    CASE WHEN p_analysis_id IS NOT NULL 
         THEN jsonb_build_object('analysis_id', p_analysis_id)
         ELSE '{}'::jsonb END
  ) RETURNING id INTO v_ledger_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'ledger_id', v_ledger_id,
    'credits_before', v_current_credits,
    'credits_after', v_new_credits,
    'credits_used', p_credits
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get comprehensive credit stats
CREATE OR REPLACE FUNCTION get_user_credit_stats(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_current_credits INTEGER;
  v_frozen_credits INTEGER;
  v_total_purchased INTEGER;
  v_total_used INTEGER;
  v_total_expired INTEGER;
  v_pending_credits INTEGER;
BEGIN
  -- Get current balances
  SELECT credits, credits_frozen INTO v_current_credits, v_frozen_credits
  FROM user_profiles WHERE id = p_user_id;
  
  -- Get totals from ledger
  SELECT 
    COALESCE(SUM(CASE WHEN transaction_type IN ('purchase', 'admin_add') THEN credits_changed ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN transaction_type IN ('usage', 'admin_remove') THEN ABS(credits_changed) ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN transaction_type = 'expire' THEN ABS(credits_changed) ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'pending' THEN credits_changed ELSE 0 END), 0)
  INTO v_total_purchased, v_total_used, v_total_expired, v_pending_credits
  FROM credits_ledger 
  WHERE user_id = p_user_id;
  
  RETURN jsonb_build_object(
    'current_credits', COALESCE(v_current_credits, 0),
    'frozen_credits', COALESCE(v_frozen_credits, 0),
    'pending_credits', v_pending_credits,
    'total_purchased', v_total_purchased,
    'total_used', v_total_used,
    'total_expired', v_total_expired,
    'lifetime_value', v_total_purchased
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION add_credits_with_audit TO service_role;
GRANT EXECUTE ON FUNCTION use_credits_with_validation TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION get_user_credit_stats TO service_role, authenticated;

-- Add helpful comments
COMMENT ON TABLE credits_ledger IS 'Complete audit trail of all credit transactions';
COMMENT ON TABLE webhook_logs IS 'Log of all webhook events from payment providers';
COMMENT ON TABLE email_notifications IS 'Track all payment-related email notifications';
COMMENT ON FUNCTION add_credits_with_audit IS 'Safely add credits with full audit trail';
COMMENT ON FUNCTION use_credits_with_validation IS 'Use credits with insufficient balance validation';
COMMENT ON FUNCTION get_user_credit_stats IS 'Get comprehensive credit statistics for a user';
