-- Security Enhancement Phase 1: Admin Role Security & Input Validation

-- 1. Add constraint to prevent multiple admin role assignments per user
-- This prevents privilege escalation by ensuring each user can only have one admin role
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_single_admin_per_user 
UNIQUE (user_id, role) 
DEFERRABLE INITIALLY DEFERRED;

-- 2. Add audit logging for admin actions
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL,
    target_user_id UUID,
    action_type TEXT NOT NULL,
    action_details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical'))
);

-- Enable RLS on admin audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" 
ON public.admin_audit_log 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- System functions can insert audit logs
CREATE POLICY "System can insert audit logs" 
ON public.admin_audit_log 
FOR INSERT 
WITH CHECK (false);

-- 3. Add constraints for contact message security
ALTER TABLE public.contact_messages 
ADD CONSTRAINT contact_message_name_length 
CHECK (length(name) <= 100);

ALTER TABLE public.contact_messages 
ADD CONSTRAINT contact_message_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE public.contact_messages 
ADD CONSTRAINT contact_message_subject_length 
CHECK (length(subject) <= 200);

ALTER TABLE public.contact_messages 
ADD CONSTRAINT contact_message_content_length 
CHECK (length(message) <= 5000);

-- 4. Add rate limiting table for contact form submissions
CREATE TABLE IF NOT EXISTS public.contact_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address INET NOT NULL,
    submission_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_submission TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_blocked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on rate limits table
ALTER TABLE public.contact_rate_limits ENABLE ROW LEVEL SECURITY;

-- System only access for rate limits
CREATE POLICY "System only access for rate limits" 
ON public.contact_rate_limits 
FOR ALL 
USING (false) 
WITH CHECK (false);

-- 5. Enhanced admin role validation function
CREATE OR REPLACE FUNCTION public.validate_admin_action(
    action_type TEXT,
    target_user_id UUID DEFAULT NULL,
    action_details JSONB DEFAULT '{}'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    admin_user_id UUID;
    target_role TEXT;
BEGIN
    admin_user_id := auth.uid();
    
    -- Check if caller is admin
    IF NOT public.has_role(admin_user_id, 'admin') THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;
    
    -- Prevent admins from modifying their own roles (except by super admin)
    IF action_type = 'role_modification' AND target_user_id = admin_user_id THEN
        RAISE EXCEPTION 'Admins cannot modify their own roles.';
    END IF;
    
    -- Log admin action
    INSERT INTO public.admin_audit_log (
        admin_user_id, target_user_id, action_type, action_details, severity
    ) VALUES (
        admin_user_id, target_user_id, action_type, action_details, 'info'
    );
    
    RETURN TRUE;
END;
$$;

-- 6. Enhanced contact form rate limiting function
CREATE OR REPLACE FUNCTION public.check_contact_rate_limit(
    client_ip INET
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    rate_record RECORD;
    current_time TIMESTAMP WITH TIME ZONE := now();
    rate_limit_window INTERVAL := '1 hour';
    max_submissions INTEGER := 5;
BEGIN
    -- Get or create rate limit record
    SELECT * INTO rate_record 
    FROM public.contact_rate_limits 
    WHERE ip_address = client_ip;
    
    IF rate_record IS NULL THEN
        -- First submission from this IP
        INSERT INTO public.contact_rate_limits (
            ip_address, submission_count, window_start, last_submission
        ) VALUES (
            client_ip, 1, current_time, current_time
        );
        RETURN TRUE;
    END IF;
    
    -- Check if we're in a new window
    IF current_time - rate_record.window_start > rate_limit_window THEN
        -- Reset the window
        UPDATE public.contact_rate_limits 
        SET 
            submission_count = 1,
            window_start = current_time,
            last_submission = current_time,
            is_blocked = false,
            updated_at = current_time
        WHERE ip_address = client_ip;
        RETURN TRUE;
    END IF;
    
    -- Check if already blocked
    IF rate_record.is_blocked THEN
        RETURN FALSE;
    END IF;
    
    -- Check rate limit
    IF rate_record.submission_count >= max_submissions THEN
        -- Block the IP
        UPDATE public.contact_rate_limits 
        SET 
            is_blocked = true,
            updated_at = current_time
        WHERE ip_address = client_ip;
        RETURN FALSE;
    END IF;
    
    -- Increment counter
    UPDATE public.contact_rate_limits 
    SET 
        submission_count = submission_count + 1,
        last_submission = current_time,
        updated_at = current_time
    WHERE ip_address = client_ip;
    
    RETURN TRUE;
END;
$$;