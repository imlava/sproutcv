-- Fix security_events check constraint to include admin_action
ALTER TABLE public.security_events 
DROP CONSTRAINT security_events_event_type_check;

ALTER TABLE public.security_events 
ADD CONSTRAINT security_events_event_type_check 
CHECK (event_type = ANY (ARRAY[
    'login'::text, 
    'logout'::text, 
    'password_change'::text, 
    'password_reset'::text, 
    'failed_login'::text, 
    'suspicious_activity'::text,
    'admin_action'::text
]));