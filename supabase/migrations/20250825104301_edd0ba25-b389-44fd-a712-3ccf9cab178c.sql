-- Security enhancements for profiles table - Fixed version

-- 1. Create a separate table for highly sensitive auth data
CREATE TABLE public.user_auth_secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    two_factor_secret_encrypted TEXT,
    backup_codes_encrypted TEXT[],
    encryption_key_id TEXT DEFAULT 'default',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on user_auth_secrets
ALTER TABLE public.user_auth_secrets ENABLE ROW LEVEL SECURITY;

-- Create very restrictive policies for auth secrets
CREATE POLICY "Users can only access their own auth secrets for 2FA operations"
ON public.user_auth_secrets
FOR ALL
USING (auth.uid() = user_id AND current_setting('request.jwt.claims', true)::jsonb->>'aal' = 'aal2')
WITH CHECK (auth.uid() = user_id AND current_setting('request.jwt.claims', true)::jsonb->>'aal' = 'aal2');

-- 2. Create function to securely access sensitive profile data
CREATE OR REPLACE FUNCTION public.get_user_profile_safe(target_user_id UUID DEFAULT NULL)
RETURNS TABLE(
    id UUID,
    email TEXT,
    full_name TEXT,
    phone TEXT,
    credits INTEGER,
    status TEXT,
    subscription_tier TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    two_factor_enabled BOOLEAN,
    email_verified BOOLEAN,
    is_active BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    requesting_user_id UUID;
    is_admin BOOLEAN;
BEGIN
    requesting_user_id := auth.uid();
    
    -- Check if requesting user is admin
    is_admin := public.has_role(requesting_user_id, 'admin');
    
    -- If no target specified, return own profile
    IF target_user_id IS NULL THEN
        target_user_id := requesting_user_id;
    END IF;
    
    -- Security check: can only access own profile unless admin
    IF target_user_id != requesting_user_id AND NOT is_admin THEN
        RAISE EXCEPTION 'Access denied. Can only access own profile.';
    END IF;
    
    -- Log sensitive data access
    INSERT INTO public.security_events (
        user_id, event_type, metadata, severity
    ) VALUES (
        target_user_id, 'profile_access',
        jsonb_build_object(
            'accessed_by', requesting_user_id,
            'is_admin', is_admin,
            'access_time', now()
        ),
        CASE WHEN is_admin THEN 'info' ELSE 'warning' END
    );
    
    -- Return safe profile data (excludes sensitive auth fields)
    RETURN QUERY
    SELECT 
        p.id,
        p.email,
        p.full_name,
        p.phone,
        p.credits,
        p.status,
        p.subscription_tier,
        p.created_at,
        p.last_login,
        p.two_factor_enabled,
        p.email_verified,
        p.is_active
    FROM public.profiles p
    WHERE p.id = target_user_id;
END;
$$;

-- 3. Create function to update sensitive fields with additional validation
CREATE OR REPLACE FUNCTION public.update_user_security_preferences(
    new_preferences JSONB,
    verification_token TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_id UUID;
    current_preferences JSONB;
BEGIN
    user_id := auth.uid();
    
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    -- Get current preferences
    SELECT security_preferences INTO current_preferences
    FROM public.profiles
    WHERE id = user_id;
    
    -- Validate new preferences structure
    IF NOT (new_preferences ? 'login_alerts' AND new_preferences ? 'email_notifications') THEN
        RAISE EXCEPTION 'Invalid security preferences structure';
    END IF;
    
    -- Update preferences
    UPDATE public.profiles
    SET 
        security_preferences = new_preferences,
        updated_at = now()
    WHERE id = user_id;
    
    -- Log security preference change
    INSERT INTO public.security_events (
        user_id, event_type, metadata, severity
    ) VALUES (
        user_id, 'security_preferences_updated',
        jsonb_build_object(
            'old_preferences', current_preferences,
            'new_preferences', new_preferences,
            'verification_provided', verification_token IS NOT NULL
        ),
        'info'
    );
    
    RETURN TRUE;
END;
$$;

-- 4. Create function for secure phone number updates
CREATE OR REPLACE FUNCTION public.update_phone_number(
    new_phone TEXT,
    verification_code TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_id UUID;
BEGIN
    user_id := auth.uid();
    
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    -- Basic phone number validation
    IF new_phone !~ '^\+?[1-9]\d{1,14}$' THEN
        RAISE EXCEPTION 'Invalid phone number format';
    END IF;
    
    -- In a real implementation, you'd verify the verification_code here
    -- For now, we'll just require it to be provided
    IF verification_code IS NULL OR length(verification_code) < 4 THEN
        RAISE EXCEPTION 'Valid verification code required';
    END IF;
    
    -- Update phone number
    UPDATE public.profiles
    SET 
        phone = new_phone,
        updated_at = now()
    WHERE id = user_id;
    
    -- Log phone number update
    INSERT INTO public.security_events (
        user_id, event_type, metadata, severity
    ) VALUES (
        user_id, 'phone_number_updated',
        jsonb_build_object(
            'new_phone_hash', encode(sha256(new_phone::bytea), 'hex'),
            'verification_provided', true
        ),
        'info'
    );
    
    RETURN TRUE;
END;
$$;

-- 5. Add indexes for security event monitoring
CREATE INDEX idx_security_events_sensitive_access 
ON public.security_events (user_id, event_type, created_at) 
WHERE event_type IN ('profile_access', 'phone_number_updated', 'security_preferences_updated');

-- 6. Create function to monitor suspicious profile access patterns
CREATE OR REPLACE FUNCTION public.detect_suspicious_profile_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    access_count INTEGER;
    admin_access_count INTEGER;
BEGIN
    -- Count recent profile access attempts by this user
    SELECT COUNT(*) INTO access_count
    FROM public.security_events
    WHERE user_id = NEW.user_id 
    AND event_type = 'profile_access'
    AND created_at > now() - interval '1 hour';
    
    -- Count admin access attempts
    SELECT COUNT(*) INTO admin_access_count
    FROM public.security_events
    WHERE metadata->>'accessed_by' != NEW.user_id::text
    AND event_type = 'profile_access'
    AND metadata->>'is_admin' = 'true'
    AND created_at > now() - interval '1 hour';
    
    -- Alert on suspicious patterns
    IF access_count > 20 OR admin_access_count > 10 THEN
        INSERT INTO public.security_events (
            user_id, event_type, metadata, severity
        ) VALUES (
            NEW.user_id, 'suspicious_activity_detected',
            jsonb_build_object(
                'access_count_last_hour', access_count,
                'admin_access_count_last_hour', admin_access_count,
                'detection_time', now()
            ),
            'critical'
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for suspicious activity detection
CREATE TRIGGER detect_suspicious_access_trigger
    AFTER INSERT ON public.security_events
    FOR EACH ROW
    WHEN (NEW.event_type = 'profile_access')
    EXECUTE FUNCTION public.detect_suspicious_profile_access();