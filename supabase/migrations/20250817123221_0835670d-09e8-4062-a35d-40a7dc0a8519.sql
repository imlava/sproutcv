-- Fix the admin_get_user_activity function SQL UNION ORDER BY issue
DROP FUNCTION IF EXISTS public.admin_get_user_activity(uuid, integer);

CREATE OR REPLACE FUNCTION public.admin_get_user_activity(target_user_id uuid, limit_count integer DEFAULT 50)
RETURNS TABLE(activity_date timestamp with time zone, activity_type text, description text, metadata jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Check admin role
    IF NOT public.has_role(auth.uid(), 'admin') THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;
    
    RETURN QUERY
    SELECT * FROM (
        (
            SELECT 
                se.created_at as activity_date,
                se.event_type as activity_type,
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
                cl.created_at as activity_date,
                'credit_transaction' as activity_type,
                (cl.description || ' (' || cl.credits_amount || ' credits)') as description,
                jsonb_build_object(
                    'credits_amount', cl.credits_amount,
                    'balance_after', cl.balance_after,
                    'transaction_type', cl.transaction_type
                ) as metadata
            FROM public.credits_ledger cl
            WHERE cl.user_id = target_user_id
            ORDER BY cl.created_at DESC
            LIMIT limit_count
        )
    ) combined_results
    ORDER BY activity_date DESC
    LIMIT limit_count;
END;
$$;