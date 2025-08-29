-- Fix conflicting RLS policies on profiles table for security
-- Remove duplicate and overlapping SELECT policies to prevent security gaps

-- First, drop the duplicate and conflicting policies
DROP POLICY IF EXISTS "Admins can view all profiles for management" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Keep only the clear, non-conflicting policies:
-- 1. "Admins can view all profiles" - for admin access
-- 2. "Users can only view their own profile" - for user access
-- 3. "Insert profile on signup" - for profile creation
-- 4. "Users can update own profile" - for profile updates

-- The remaining policies are:
-- ✓ "Admins can view all profiles" (SELECT): has_role(auth.uid(), 'admin'::app_role)
-- ✓ "Users can only view their own profile" (SELECT): (auth.uid() = id)
-- ✓ "Insert profile on signup" (INSERT): (auth.uid() = id)
-- ✓ "Users can update own profile" (UPDATE): (auth.uid() = id)

-- Add a comment to document the security model
COMMENT ON TABLE public.profiles IS 'User profiles with RLS: Users can only access their own data, admins can access all profiles for management purposes';

-- Ensure the table has proper RLS enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;