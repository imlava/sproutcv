-- Fix security_events event_type check constraint causing RPC 400 errors
-- Root cause: get_user_profile_safe logs event_type = 'profile_access',
-- but the table has a restrictive CHECK constraint not allowing this value.
-- Resolution: drop the constraint to allow new event types (we can later enforce via triggers if needed).

ALTER TABLE public.security_events
  DROP CONSTRAINT IF EXISTS security_events_event_type_check;