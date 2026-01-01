-- 🎯 DODO PAYMENTS ONLY - Database Schema Update
-- This migration ensures only Dodo Payments is supported

-- Add clear comments to indicate Dodo Payments only
COMMENT ON TABLE payments IS 'Payment records - DODO PAYMENTS ONLY. Stripe support deprecated.';
COMMENT ON COLUMN payments.payment_provider_id IS 'Dodo Payments payment ID - PRIMARY payment identifier';
COMMENT ON COLUMN payments.stripe_session_id IS 'DEPRECATED - Stripe not supported. Use payment_provider_id for Dodo Payments.';

-- Ensure payment_provider_id is the primary lookup field
DROP INDEX IF EXISTS idx_payments_stripe_session_id;
CREATE INDEX IF NOT EXISTS idx_payments_dodo_provider_id ON payments(payment_provider_id);

-- Add Dodo-specific payment data constraints
ALTER TABLE payments 
ADD CONSTRAINT check_dodo_payment_provider 
CHECK (payment_provider_id IS NOT NULL AND payment_provider_id LIKE 'pay_%');

-- Update payment_method to reflect Dodo Payments only
UPDATE payments 
SET payment_method = 'dodo' 
WHERE payment_method IS NULL OR payment_method = 'stripe';

-- Add default for new payments
ALTER TABLE payments 
ALTER COLUMN payment_method SET DEFAULT 'dodo';

-- Ensure all payment records have proper Dodo format
UPDATE payments 
SET payment_provider_id = COALESCE(payment_provider_id, stripe_session_id)
WHERE payment_provider_id IS NULL AND stripe_session_id IS NOT NULL;

-- Clear any Stripe references in payment_data
UPDATE payments 
SET payment_data = COALESCE(payment_data, '{}')::jsonb || '{"provider": "dodo"}'::jsonb
WHERE payment_data IS NULL OR payment_data::jsonb ->> 'provider' != 'dodo';

-- Add helpful views for Dodo-only queries
CREATE OR REPLACE VIEW dodo_payments AS 
SELECT 
    id,
    user_id,
    payment_provider_id as dodo_payment_id,
    amount,
    credits_purchased,
    status,
    payment_method,
    payment_data,
    created_at,
    updated_at
FROM payments 
WHERE payment_provider_id IS NOT NULL 
AND payment_provider_id LIKE 'pay_%';

COMMENT ON VIEW dodo_payments IS 'Clean view of Dodo Payments only - use this for all payment queries';

-- Grant access to the view
GRANT SELECT ON dodo_payments TO anon, authenticated;

-- Add RLS policy for the view
ALTER VIEW dodo_payments SET (security_invoker = on);

-- Success message
SELECT 'Database updated for Dodo Payments only. Use payment_provider_id for all payment lookups.' as status;
