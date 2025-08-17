-- Fix transaction type constraints and enhance user management CRUD

-- First, let's see what transaction types are currently being used
-- Then update the check constraint to include 'admin_grant'

-- Drop existing constraint if it exists
ALTER TABLE public.credits_ledger 
DROP CONSTRAINT IF EXISTS credits_ledger_transaction_type_check;

-- Add proper check constraint for transaction types
ALTER TABLE public.credits_ledger 
ADD CONSTRAINT credits_ledger_transaction_type_check 
CHECK (transaction_type IN ('purchase', 'usage', 'bonus', 'refund', 'admin_grant', 'referral'));

-- Add constraint for credits_amount to ensure it's not zero
ALTER TABLE public.credits_ledger 
ADD CONSTRAINT credits_ledger_credits_amount_not_zero 
CHECK (credits_amount != 0);

-- Enhance profiles table for better user management
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'premium', 'enterprise'));

-- Add user status tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned', 'pending'));

-- Create comprehensive admin functions for enhanced CRUD operations

-- Function to get detailed user information
CREATE OR REPLACE FUNCTION public.admin_get_detailed_user_info(target_user_id uuid)
RETURNS TABLE(
    user_id uuid, 
    email text, 
    full_name text, 
    phone text,
    credits integer, 
    status text,
    subscription_tier text,
    total_analyses bigint, 
    total_spent numeric, 
    referrals_made bigint, 
    last_analysis timestamp with time zone, 
    signup_date timestamp with time zone,
    last_login timestamp with time zone,
    failed_login_attempts integer,
    notes text,
    avatar_url text,
    timezone text,
    language text,
    is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    -- Check admin role
    IF NOT public.has_role(auth.uid(), 'admin') THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;
    
    RETURN QUERY
    SELECT 
        p.id,
        p.email,
        p.full_name,
        p.phone,
        p.credits,
        p.status,
        p.subscription_tier,
        (SELECT COUNT(*) FROM public.resume_analyses WHERE user_id = p.id)::BIGINT,
        (SELECT COALESCE(SUM(amount), 0) FROM public.payments WHERE user_id = p.id AND status = 'completed')::NUMERIC / 100,
        (SELECT COUNT(*) FROM public.referrals WHERE referrer_id = p.id)::BIGINT,
        (SELECT MAX(created_at) FROM public.resume_analyses WHERE user_id = p.id),
        p.created_at,
        p.last_login,
        p.failed_login_attempts,
        p.notes,
        p.avatar_url,
        p.timezone,
        p.language,
        p.is_active
    FROM public.profiles p
    WHERE p.id = target_user_id;
END;
$function$;

-- Function to update user profile by admin
CREATE OR REPLACE FUNCTION public.admin_update_user_profile(
    target_user_id uuid,
    new_full_name text DEFAULT NULL,
    new_phone text DEFAULT NULL,
    new_status text DEFAULT NULL,
    new_subscription_tier text DEFAULT NULL,
    new_notes text DEFAULT NULL,
    new_timezone text DEFAULT NULL,
    new_language text DEFAULT NULL,
    new_is_active boolean DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    admin_user_id UUID;
    update_data jsonb := '{}'::jsonb;
BEGIN
    admin_user_id := auth.uid();
    
    -- Check admin role
    IF NOT public.has_role(admin_user_id, 'admin') THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;
    
    -- Build update data
    IF new_full_name IS NOT NULL THEN
        update_data := update_data || jsonb_build_object('full_name', new_full_name);
    END IF;
    IF new_phone IS NOT NULL THEN
        update_data := update_data || jsonb_build_object('phone', new_phone);
    END IF;
    IF new_status IS NOT NULL THEN
        update_data := update_data || jsonb_build_object('status', new_status);
    END IF;
    IF new_subscription_tier IS NOT NULL THEN
        update_data := update_data || jsonb_build_object('subscription_tier', new_subscription_tier);
    END IF;
    IF new_notes IS NOT NULL THEN
        update_data := update_data || jsonb_build_object('notes', new_notes);
    END IF;
    IF new_timezone IS NOT NULL THEN
        update_data := update_data || jsonb_build_object('timezone', new_timezone);
    END IF;
    IF new_language IS NOT NULL THEN
        update_data := update_data || jsonb_build_object('language', new_language);
    END IF;
    IF new_is_active IS NOT NULL THEN
        update_data := update_data || jsonb_build_object('is_active', new_is_active);
    END IF;
    
    -- Update the profile
    UPDATE public.profiles 
    SET 
        full_name = COALESCE((update_data->>'full_name')::text, full_name),
        phone = COALESCE((update_data->>'phone')::text, phone),
        status = COALESCE((update_data->>'status')::text, status),
        subscription_tier = COALESCE((update_data->>'subscription_tier')::text, subscription_tier),
        notes = COALESCE((update_data->>'notes')::text, notes),
        timezone = COALESCE((update_data->>'timezone')::text, timezone),
        language = COALESCE((update_data->>'language')::text, language),
        is_active = COALESCE((update_data->>'is_active')::boolean, is_active),
        updated_at = now()
    WHERE id = target_user_id;
    
    -- Log admin action
    INSERT INTO public.security_events (
        user_id, event_type, metadata, severity
    ) VALUES (
        target_user_id, 'admin_action',
        jsonb_build_object(
            'action', 'profile_updated',
            'admin_user_id', admin_user_id,
            'updated_fields', update_data
        ),
        'info'
    );
    
    RETURN TRUE;
END;
$function$;

-- Function to suspend/unsuspend user
CREATE OR REPLACE FUNCTION public.admin_suspend_user(
    target_user_id uuid,
    suspend boolean,
    reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    admin_user_id UUID;
    new_status text;
BEGIN
    admin_user_id := auth.uid();
    
    -- Check admin role
    IF NOT public.has_role(admin_user_id, 'admin') THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;
    
    new_status := CASE WHEN suspend THEN 'suspended' ELSE 'active' END;
    
    -- Update user status
    UPDATE public.profiles 
    SET 
        status = new_status,
        is_active = NOT suspend,
        notes = COALESCE(notes || E'\n', '') || 
               CASE WHEN suspend 
                    THEN 'Suspended: ' || COALESCE(reason, 'No reason provided') 
                    ELSE 'Unsuspended by admin' 
               END || ' (' || now()::text || ')',
        updated_at = now()
    WHERE id = target_user_id;
    
    -- Log admin action
    INSERT INTO public.security_events (
        user_id, event_type, metadata, severity
    ) VALUES (
        target_user_id, 'admin_action',
        jsonb_build_object(
            'action', CASE WHEN suspend THEN 'user_suspended' ELSE 'user_unsuspended' END,
            'admin_user_id', admin_user_id,
            'reason', reason
        ),
        CASE WHEN suspend THEN 'warning' ELSE 'info' END
    );
    
    RETURN TRUE;
END;
$function$;

-- Function to delete user account (soft delete)
CREATE OR REPLACE FUNCTION public.admin_delete_user_account(
    target_user_id uuid,
    permanent boolean DEFAULT false,
    reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    admin_user_id UUID;
BEGIN
    admin_user_id := auth.uid();
    
    -- Check admin role
    IF NOT public.has_role(admin_user_id, 'admin') THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;
    
    IF permanent THEN
        -- Hard delete - remove from auth.users (cascades to profiles)
        DELETE FROM auth.users WHERE id = target_user_id;
    ELSE
        -- Soft delete - mark as inactive and banned
        UPDATE public.profiles 
        SET 
            status = 'banned',
            is_active = false,
            notes = COALESCE(notes || E'\n', '') || 'Account deleted: ' || COALESCE(reason, 'No reason provided') || ' (' || now()::text || ')',
            updated_at = now()
        WHERE id = target_user_id;
    END IF;
    
    -- Log admin action
    INSERT INTO public.security_events (
        user_id, event_type, metadata, severity
    ) VALUES (
        target_user_id, 'admin_action',
        jsonb_build_object(
            'action', CASE WHEN permanent THEN 'user_deleted_permanent' ELSE 'user_deleted_soft' END,
            'admin_user_id', admin_user_id,
            'reason', reason
        ),
        'critical'
    );
    
    RETURN TRUE;
END;
$function$;

-- Function to get user activity history
CREATE OR REPLACE FUNCTION public.admin_get_user_activity(
    target_user_id uuid,
    limit_count integer DEFAULT 50
)
RETURNS TABLE(
    activity_date timestamp with time zone,
    activity_type text,
    description text,
    metadata jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    -- Check admin role
    IF NOT public.has_role(auth.uid(), 'admin') THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;
    
    RETURN QUERY
    (
        SELECT 
            se.created_at,
            se.event_type,
            COALESCE(se.metadata->>'description', se.event_type) as description,
            se.metadata
        FROM public.security_events se
        WHERE se.user_id = target_user_id
        ORDER BY se.created_at DESC
        LIMIT limit_count
    )
    UNION ALL
    (
        SELECT 
            cl.created_at,
            'credit_transaction' as event_type,
            cl.description || ' (' || cl.credits_amount || ' credits)',
            jsonb_build_object(
                'credits_amount', cl.credits_amount,
                'balance_after', cl.balance_after,
                'transaction_type', cl.transaction_type
            )
        FROM public.credits_ledger cl
        WHERE cl.user_id = target_user_id
        ORDER BY cl.created_at DESC
        LIMIT limit_count
    )
    ORDER BY activity_date DESC
    LIMIT limit_count;
END;
$function$;