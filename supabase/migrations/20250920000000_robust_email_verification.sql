-- Create verification queue table for automatic retry processing
CREATE TABLE IF NOT EXISTS verification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    retry_count INTEGER DEFAULT 0,
    last_error TEXT,
    next_retry_at TIMESTAMPTZ,
    status TEXT DEFAULT 'retry_scheduled' CHECK (status IN ('retry_scheduled', 'processing', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_verification_queue_retry ON verification_queue(next_retry_at, status);
CREATE INDEX IF NOT EXISTS idx_verification_queue_user ON verification_queue(user_id);

-- Create function to automatically clean old entries
CREATE OR REPLACE FUNCTION cleanup_verification_queue()
RETURNS void AS $$
BEGIN
    DELETE FROM verification_queue 
    WHERE created_at < NOW() - INTERVAL '7 days' 
    AND status IN ('completed', 'failed');
END;
$$ LANGUAGE plpgsql;

-- Create automated profile creation trigger
CREATE OR REPLACE FUNCTION auto_create_user_profile()
RETURNS trigger AS $$
DECLARE
    referral_code TEXT;
BEGIN
    -- Generate random referral code
    referral_code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Create profile automatically when user is created in auth
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        credits,
        email_verified,
        referral_code,
        subscription_tier,
        status,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
        5, -- Welcome credits
        CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END,
        referral_code,
        'free',
        'active',
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        email_verified = CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE profiles.email_verified END,
        updated_at = NOW();
    
    -- Create user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Add initial credits to ledger if profile was just created
    INSERT INTO public.credits_ledger (
        user_id,
        transaction_type,
        credits_amount,
        balance_after,
        description
    ) 
    SELECT 
        NEW.id,
        'bonus',
        5,
        5,
        'Welcome bonus credits'
    WHERE NOT EXISTS (
        SELECT 1 FROM public.credits_ledger WHERE user_id = NEW.id
    );
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    INSERT INTO public.security_events (
        user_id,
        event_type,
        metadata,
        severity
    ) VALUES (
        NEW.id,
        'auto_profile_creation_error',
        jsonb_build_object(
            'error', SQLERRM,
            'email', NEW.email,
            'timestamp', NOW()
        ),
        'error'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_user_profile();

-- Create function to auto-verify users after 24 hours
CREATE OR REPLACE FUNCTION auto_verify_old_users()
RETURNS void AS $$
BEGIN
    -- Auto-verify users older than 24 hours who aren't verified
    UPDATE public.profiles 
    SET 
        email_verified = true,
        updated_at = NOW()
    WHERE 
        email_verified = false 
        AND created_at < NOW() - INTERVAL '24 hours'
        AND status = 'active';
    
    -- Log the auto-verification
    INSERT INTO public.security_events (
        event_type,
        metadata,
        severity
    ) VALUES (
        'auto_verification_24h_cleanup',
        jsonb_build_object(
            'verified_count', (
                SELECT COUNT(*) 
                FROM public.profiles 
                WHERE email_verified = true 
                AND updated_at > NOW() - INTERVAL '1 minute'
                AND created_at < NOW() - INTERVAL '24 hours'
            ),
            'timestamp', NOW()
        ),
        'info'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle email confirmation updates
CREATE OR REPLACE FUNCTION sync_email_verification()
RETURNS trigger AS $$
BEGIN
    -- When auth.users email is confirmed, update the profile
    IF NEW.email_confirmed_at IS NOT NULL AND (OLD.email_confirmed_at IS NULL OR OLD.email_confirmed_at != NEW.email_confirmed_at) THEN
        UPDATE public.profiles 
        SET 
            email_verified = true,
            updated_at = NOW()
        WHERE id = NEW.id;
        
        -- Remove from verification queue if exists
        DELETE FROM public.verification_queue WHERE user_id = NEW.id;
        
        -- Log successful verification
        INSERT INTO public.security_events (
            user_id,
            event_type,
            metadata,
            severity
        ) VALUES (
            NEW.id,
            'email_verification_auto_synced',
            jsonb_build_object(
                'email', NEW.email,
                'timestamp', NOW()
            ),
            'info'
        );
    END IF;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Don't fail the auth update if profile sync fails
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync email verification status
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION sync_email_verification();

-- Enable RLS on verification_queue
ALTER TABLE verification_queue ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for verification queue (service role only)
CREATE POLICY "verification_queue_service_role_all" ON verification_queue
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

COMMENT ON TABLE verification_queue IS 'Queue for automatic email verification retries';
COMMENT ON FUNCTION auto_create_user_profile() IS 'Automatically creates user profiles when auth users are created';
COMMENT ON FUNCTION sync_email_verification() IS 'Syncs email verification status between auth and profiles';
COMMENT ON FUNCTION auto_verify_old_users() IS 'Auto-verifies users older than 24 hours';
COMMENT ON FUNCTION cleanup_verification_queue() IS 'Cleans up old verification queue entries';