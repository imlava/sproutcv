-- Fix signup conflicts between trigger and Edge Function
-- This migration ensures smooth user signup by handling duplicate profile creation

-- Update the handle_new_user trigger function to be more resilient
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Only create profile if it doesn't exist (prevents conflicts with Edge Function)
    INSERT INTO public.profiles (
        id, email, full_name, credits, email_verified, referral_code
    ) VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        5, -- Give 5 free credits to new users
        COALESCE((NEW.raw_user_meta_data->>'email_verified')::boolean, false),
        upper(substring(md5(random()::text) from 1 for 8)) -- Generate referral code
    )
    ON CONFLICT (id) DO NOTHING; -- Ignore if profile already exists
    
    -- Only assign role if it doesn't exist
    INSERT INTO public.user_roles (
        user_id, role
    ) VALUES (
        NEW.id, 'user'
    )
    ON CONFLICT (user_id, role) DO NOTHING; -- Ignore if role already exists
    
    -- Log new user registration (always log)
    INSERT INTO public.security_events (
        user_id, event_type, metadata
    ) VALUES (
        NEW.id, 'user_registration', 
        jsonb_build_object(
            'event', 'user_registration', 
            'email', NEW.email, 
            'full_name', NEW.raw_user_meta_data->>'full_name',
            'source', 'database_trigger'
        )
    );
    
    -- Add initial credits to ledger (only if not already added)
    INSERT INTO public.credits_ledger (
        user_id, transaction_type, credits_amount, balance_after, description
    ) 
    SELECT NEW.id, 'bonus', 5, 5, 'Welcome bonus credits'
    WHERE NOT EXISTS (
        SELECT 1 FROM public.credits_ledger 
        WHERE user_id = NEW.id AND transaction_type = 'bonus' AND description = 'Welcome bonus credits'
    );
    
    RETURN NEW;
END;
$$;

-- Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add a comment explaining the dual-mechanism approach
COMMENT ON FUNCTION public.handle_new_user() IS 'Fallback profile creation for users. Uses ON CONFLICT to avoid duplicates with create-user-profile Edge Function.';

-- Ensure profiles table has proper constraints
ALTER TABLE public.profiles ADD CONSTRAINT IF NOT EXISTS profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.user_roles ADD CONSTRAINT IF NOT EXISTS user_roles_user_role_unique UNIQUE (user_id, role);

-- Update RLS policies to ensure Edge Functions can work properly
-- Service role policy for profile creation via Edge Functions
DROP POLICY IF EXISTS "Service role can manage profiles" ON public.profiles;
CREATE POLICY "Service role can manage profiles"
ON public.profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Service role policy for user roles
DROP POLICY IF EXISTS "Service role can manage user roles" ON public.user_roles;
CREATE POLICY "Service role can manage user roles"
ON public.user_roles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Service role policy for credits ledger
DROP POLICY IF EXISTS "Service role can manage credits ledger" ON public.credits_ledger;
CREATE POLICY "Service role can manage credits ledger"
ON public.credits_ledger
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Service role policy for security events
DROP POLICY IF EXISTS "Service role can manage security events" ON public.security_events;
CREATE POLICY "Service role can manage security events"
ON public.security_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
