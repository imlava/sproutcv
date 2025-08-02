-- Enable realtime for tables
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.user_roles REPLICA IDENTITY FULL;
ALTER TABLE public.contact_messages REPLICA IDENTITY FULL;
ALTER TABLE public.payments REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;

-- Create admin policies to view all users
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create table for message replies
CREATE TABLE public.message_replies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_message_id UUID NOT NULL REFERENCES public.contact_messages(id) ON DELETE CASCADE,
    admin_user_id UUID NOT NULL,
    reply_content TEXT NOT NULL,
    is_email_sent BOOLEAN DEFAULT false,
    email_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on message replies
ALTER TABLE public.message_replies ENABLE ROW LEVEL SECURITY;

-- Create policies for message replies
CREATE POLICY "Admins can manage message replies"
ON public.message_replies
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Add refund functionality to payments table
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS refund_amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS refund_reason TEXT,
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS refunded_by UUID;

-- Create function for processing refunds
CREATE OR REPLACE FUNCTION public.process_payment_refund(
    payment_id UUID,
    refund_amount INTEGER,
    refund_reason TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    payment_record RECORD;
    admin_user_id UUID;
BEGIN
    admin_user_id := auth.uid();
    
    -- Check if caller is admin
    IF NOT public.has_role(admin_user_id, 'admin') THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;
    
    -- Get payment details
    SELECT * INTO payment_record 
    FROM public.payments 
    WHERE id = payment_id AND status = 'completed';
    
    IF payment_record IS NULL THEN
        RAISE EXCEPTION 'Payment not found or not completed';
    END IF;
    
    -- Update payment with refund details
    UPDATE public.payments 
    SET 
        refund_status = 'refunded',
        refund_amount = refund_amount,
        refund_reason = refund_reason,
        refunded_at = now(),
        refunded_by = admin_user_id,
        updated_at = now()
    WHERE id = payment_id;
    
    -- Deduct credits from user if partial refund or remove all if full refund
    IF refund_amount = payment_record.amount THEN
        -- Full refund - remove all credits purchased
        PERFORM public.update_user_credits(
            payment_record.user_id,
            -payment_record.credits_purchased,
            'refund',
            'Full refund for payment ID: ' || payment_id,
            payment_id
        );
    ELSE
        -- Partial refund - calculate credits to remove proportionally
        DECLARE
            credits_to_remove INTEGER;
        BEGIN
            credits_to_remove := ROUND((refund_amount::DECIMAL / payment_record.amount::DECIMAL) * payment_record.credits_purchased);
            PERFORM public.update_user_credits(
                payment_record.user_id,
                -credits_to_remove,
                'refund',
                'Partial refund for payment ID: ' || payment_id,
                payment_id
            );
        END;
    END IF;
    
    -- Log admin action
    INSERT INTO public.security_events (
        user_id, event_type, metadata, severity
    ) VALUES (
        payment_record.user_id, 'admin_action',
        jsonb_build_object(
            'action', 'payment_refund',
            'payment_id', payment_id,
            'refund_amount', refund_amount,
            'refund_reason', refund_reason,
            'admin_user_id', admin_user_id
        ),
        'warning'
    );
    
    RETURN TRUE;
END;
$$;