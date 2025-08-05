import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Applying database migrations...");

    const results = {};

    // 1. Add missing columns to payments table
    try {
      const { data: alter1, error: error1 } = await supabaseAdmin.rpc('exec_sql', {
        sql: "ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'stripe';"
      });
      results.alter1 = { data: alter1, error: error1 };
    } catch (error) {
      results.alter1 = { data: null, error: error.message };
    }

    // 2. Add payment_provider_id column
    try {
      const { data: alter2, error: error2 } = await supabaseAdmin.rpc('exec_sql', {
        sql: "ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_provider_id TEXT;"
      });
      results.alter2 = { data: alter2, error: error2 };
    } catch (error) {
      results.alter2 = { data: null, error: error.message };
    }

    // 3. Add payment_data column
    try {
      const { data: alter3, error: error3 } = await supabaseAdmin.rpc('exec_sql', {
        sql: "ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_data JSONB DEFAULT '{}';"
      });
      results.alter3 = { data: alter3, error: error3 };
    } catch (error) {
      results.alter3 = { data: null, error: error.message };
    }

    // 4. Add expires_at column
    try {
      const { data: alter4, error: error4 } = await supabaseAdmin.rpc('exec_sql', {
        sql: "ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;"
      });
      results.alter4 = { data: alter4, error: error4 };
    } catch (error) {
      results.alter4 = { data: null, error: error.message };
    }

    // 5. Create credits_ledger table
    try {
      const { data: create1, error: error5 } = await supabaseAdmin.rpc('exec_sql', {
        sql: `CREATE TABLE IF NOT EXISTS public.credits_ledger (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'refund', 'bonus', 'expiry')),
          credits_amount INTEGER NOT NULL,
          balance_after INTEGER NOT NULL,
          related_payment_id UUID REFERENCES public.payments(id),
          related_analysis_id UUID REFERENCES public.resume_analyses(id),
          description TEXT,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );`
      });
      results.create1 = { data: create1, error: error5 };
    } catch (error) {
      results.create1 = { data: null, error: error.message };
    }

    // 6. Create security_events table
    try {
      const { data: create2, error: error6 } = await supabaseAdmin.rpc('exec_sql', {
        sql: `CREATE TABLE IF NOT EXISTS public.security_events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          event_type TEXT NOT NULL,
          metadata JSONB DEFAULT '{}',
          ip_address INET,
          user_agent TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );`
      });
      results.create2 = { data: create2, error: error6 };
    } catch (error) {
      results.create2 = { data: null, error: error.message };
    }

    // 7. Create user_roles table
    try {
      const { data: create3, error: error7 } = await supabaseAdmin.rpc('exec_sql', {
        sql: `CREATE TABLE IF NOT EXISTS public.user_roles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
          role TEXT NOT NULL DEFAULT 'user',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          UNIQUE(user_id, role)
        );`
      });
      results.create3 = { data: create3, error: error7 };
    } catch (error) {
      results.create3 = { data: null, error: error.message };
    }

    // 8. Create contact_messages table
    try {
      const { data: create4, error: error8 } = await supabaseAdmin.rpc('exec_sql', {
        sql: `CREATE TABLE IF NOT EXISTS public.contact_messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          subject TEXT NOT NULL,
          message TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'resolved')),
          ip_address INET,
          user_agent TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );`
      });
      results.create4 = { data: create4, error: error8 };
    } catch (error) {
      results.create4 = { data: null, error: error.message };
    }

    // 9. Enable RLS on all tables
    try {
      const { data: rls1, error: error9 } = await supabaseAdmin.rpc('exec_sql', {
        sql: "ALTER TABLE public.credits_ledger ENABLE ROW LEVEL SECURITY;"
      });
      results.rls1 = { data: rls1, error: error9 };
    } catch (error) {
      results.rls1 = { data: null, error: error.message };
    }

    try {
      const { data: rls2, error: error10 } = await supabaseAdmin.rpc('exec_sql', {
        sql: "ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;"
      });
      results.rls2 = { data: rls2, error: error10 };
    } catch (error) {
      results.rls2 = { data: null, error: error.message };
    }

    try {
      const { data: rls3, error: error11 } = await supabaseAdmin.rpc('exec_sql', {
        sql: "ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;"
      });
      results.rls3 = { data: rls3, error: error11 };
    } catch (error) {
      results.rls3 = { data: null, error: error.message };
    }

    try {
      const { data: rls4, error: error12 } = await supabaseAdmin.rpc('exec_sql', {
        sql: "ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;"
      });
      results.rls4 = { data: rls4, error: error12 };
    } catch (error) {
      results.rls4 = { data: null, error: error.message };
    }

    // 10. Create policies
    try {
      const { data: policy1, error: error13 } = await supabaseAdmin.rpc('exec_sql', {
        sql: `CREATE POLICY "Users can view their own credits ledger" 
        ON public.credits_ledger FOR SELECT 
        USING (auth.uid() = user_id);`
      });
      results.policy1 = { data: policy1, error: error13 };
    } catch (error) {
      results.policy1 = { data: null, error: error.message };
    }

    try {
      const { data: policy2, error: error14 } = await supabaseAdmin.rpc('exec_sql', {
        sql: `CREATE POLICY "Users can view their own security events" 
        ON public.security_events FOR SELECT 
        USING (auth.uid() = user_id);`
      });
      results.policy2 = { data: policy2, error: error14 };
    } catch (error) {
      results.policy2 = { data: null, error: error.message };
    }

    try {
      const { data: policy3, error: error15 } = await supabaseAdmin.rpc('exec_sql', {
        sql: `CREATE POLICY "Users can view their own roles" 
        ON public.user_roles FOR SELECT 
        USING (auth.uid() = user_id);`
      });
      results.policy3 = { data: policy3, error: error15 };
    } catch (error) {
      results.policy3 = { data: null, error: error.message };
    }

    try {
      const { data: policy4, error: error16 } = await supabaseAdmin.rpc('exec_sql', {
        sql: `CREATE POLICY "Admins can manage all contact messages" 
        ON public.contact_messages FOR ALL 
        USING (auth.uid() IN (
          SELECT user_id FROM public.user_roles WHERE role = 'admin'
        ));`
      });
      results.policy4 = { data: policy4, error: error16 };
    } catch (error) {
      results.policy4 = { data: null, error: error.message };
    }

    // 11. Create functions
    try {
      const { data: func1, error: error17 } = await supabaseAdmin.rpc('exec_sql', {
        sql: `CREATE OR REPLACE FUNCTION public.has_role(user_uuid UUID, role_name TEXT)
        RETURNS BOOLEAN AS $$
        BEGIN
          RETURN EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = user_uuid AND role = role_name
          );
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;`
      });
      results.func1 = { data: func1, error: error17 };
    } catch (error) {
      results.func1 = { data: null, error: error.message };
    }

    try {
      const { data: func2, error: error18 } = await supabaseAdmin.rpc('exec_sql', {
        sql: `CREATE OR REPLACE FUNCTION public.update_user_credits(
          user_uuid UUID,
          credits_to_add INTEGER,
          reason TEXT DEFAULT 'manual_adjustment'
        )
        RETURNS BOOLEAN AS $$
        DECLARE
          current_credits INTEGER;
          new_credits INTEGER;
        BEGIN
          SELECT credits INTO current_credits
          FROM public.profiles
          WHERE id = user_uuid;
          
          IF NOT FOUND THEN
            RAISE EXCEPTION 'User not found';
          END IF;
          
          new_credits := current_credits + credits_to_add;
          
          UPDATE public.profiles
          SET credits = new_credits, updated_at = now()
          WHERE id = user_uuid;
          
          INSERT INTO public.credits_ledger (
            user_id, transaction_type, credits_amount, balance_after, description
          ) VALUES (
            user_uuid, 'bonus', credits_to_add, new_credits, reason
          );
          
          INSERT INTO public.security_events (
            user_id, event_type, metadata
          ) VALUES (
            user_uuid, 'credits_updated', jsonb_build_object(
              'credits_added', credits_to_add,
              'old_balance', current_credits,
              'new_balance', new_credits,
              'reason', reason
            )
          );
          
          RETURN TRUE;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;`
      });
      results.func2 = { data: func2, error: error18 };
    } catch (error) {
      results.func2 = { data: null, error: error.message };
    }

    try {
      const { data: func3, error: error19 } = await supabaseAdmin.rpc('exec_sql', {
        sql: `CREATE OR REPLACE FUNCTION public.process_successful_payment(
          payment_id UUID,
          provider_transaction_id TEXT DEFAULT NULL
        )
        RETURNS BOOLEAN AS $$
        DECLARE
          payment_record RECORD;
          current_credits INTEGER;
          new_credits INTEGER;
        BEGIN
          SELECT * INTO payment_record
          FROM public.payments
          WHERE id = payment_id AND status = 'pending';
          
          IF NOT FOUND THEN
            RAISE EXCEPTION 'Payment not found or already processed';
          END IF;
          
          SELECT credits INTO current_credits
          FROM public.profiles
          WHERE id = payment_record.user_id;
          
          new_credits := current_credits + payment_record.credits_purchased;
          
          UPDATE public.payments
          SET 
            status = 'completed',
            updated_at = now(),
            payment_provider_id = COALESCE(provider_transaction_id, payment_provider_id),
            payment_data = payment_data || jsonb_build_object(
              'processed_at', now(),
              'provider_transaction_id', provider_transaction_id
            )
          WHERE id = payment_id;
          
          UPDATE public.profiles
          SET credits = new_credits, updated_at = now()
          WHERE id = payment_record.user_id;
          
          INSERT INTO public.credits_ledger (
            user_id, transaction_type, credits_amount, balance_after, related_payment_id, description
          ) VALUES (
            payment_record.user_id, 'purchase', payment_record.credits_purchased, new_credits, payment_id,
            'Credits purchased via ' || payment_record.payment_method
          );
          
          INSERT INTO public.security_events (
            user_id, event_type, metadata
          ) VALUES (
            payment_record.user_id, 'payment_completed', jsonb_build_object(
              'payment_id', payment_id,
              'amount', payment_record.amount,
              'credits_purchased', payment_record.credits_purchased,
              'provider_transaction_id', provider_transaction_id
            )
          );
          
          RETURN TRUE;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;`
      });
      results.func3 = { data: func3, error: error19 };
    } catch (error) {
      results.func3 = { data: null, error: error.message };
    }

    // 12. Create indexes
    try {
      const { data: index1, error: error20 } = await supabaseAdmin.rpc('exec_sql', {
        sql: "CREATE INDEX IF NOT EXISTS idx_credits_ledger_user_id_created ON public.credits_ledger(user_id, created_at DESC);"
      });
      results.index1 = { data: index1, error: error20 };
    } catch (error) {
      results.index1 = { data: null, error: error.message };
    }

    try {
      const { data: index2, error: error21 } = await supabaseAdmin.rpc('exec_sql', {
        sql: "CREATE INDEX IF NOT EXISTS idx_security_events_user_id_created ON public.security_events(user_id, created_at DESC);"
      });
      results.index2 = { data: index2, error: error21 };
    } catch (error) {
      results.index2 = { data: null, error: error.message };
    }

    try {
      const { data: index3, error: error22 } = await supabaseAdmin.rpc('exec_sql', {
        sql: "CREATE INDEX IF NOT EXISTS idx_payments_status_created ON public.payments(status, created_at DESC);"
      });
      results.index3 = { data: index3, error: error22 };
    } catch (error) {
      results.index3 = { data: null, error: error.message };
    }

    return new Response(JSON.stringify({ 
      success: true,
      results,
      message: "Database migrations applied successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Migration error:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}); 