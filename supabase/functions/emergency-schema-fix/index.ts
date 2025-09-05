import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Missing environment variables" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Apply the critical schema fixes
    const schemaSQL = `
      -- Create payment_transactions table if it doesn't exist
      CREATE TABLE IF NOT EXISTS public.payment_transactions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
          transaction_type TEXT NOT NULL DEFAULT 'payment',
          amount INTEGER NOT NULL,
          currency TEXT NOT NULL DEFAULT 'USD',
          provider_transaction_id TEXT,
          provider_response JSONB DEFAULT '{}',
          status TEXT NOT NULL DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );

      -- Enable RLS on payment_transactions
      ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies to avoid conflicts
      DROP POLICY IF EXISTS "Service role can manage payment transactions" ON public.payment_transactions;
      DROP POLICY IF EXISTS "Users can view their own payment transactions" ON public.payment_transactions;

      -- Create policy for service role access (needed for webhooks)
      CREATE POLICY "Service role can manage payment transactions" 
      ON public.payment_transactions FOR ALL 
      TO service_role
      USING (true)
      WITH CHECK (true);

      -- Create policy for users to view their own transactions
      CREATE POLICY "Users can view their own payment transactions" 
      ON public.payment_transactions FOR SELECT 
      TO authenticated
      USING (EXISTS (
          SELECT 1 FROM public.payments 
          WHERE payments.id = payment_transactions.payment_id 
          AND payments.user_id = auth.uid()
      ));

      -- Add missing columns to payments table
      ALTER TABLE public.payments 
      ADD COLUMN IF NOT EXISTS payment_provider_id TEXT,
      ADD COLUMN IF NOT EXISTS payment_data JSONB DEFAULT '{}';

      -- Add indexes for performance
      CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_id ON public.payment_transactions(payment_id);
      CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider_id ON public.payment_transactions(provider_transaction_id);
      CREATE INDEX IF NOT EXISTS idx_payments_provider_id ON public.payments(payment_provider_id);
    `;

    // Execute the schema using raw SQL
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql: schemaSQL });

    if (error) {
      console.error("Schema application error:", error);
      return new Response(JSON.stringify({ 
        success: false,
        error: error.message,
        details: error
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: "✅ Schema fix applied successfully!",
      details: [
        "✅ payment_transactions table created",
        "✅ RLS policies configured", 
        "✅ Missing columns added to payments table",
        "✅ Performance indexes created",
        "✅ Webhook 400 errors should now be fixed!"
      ]
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Emergency schema fix error:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: "Internal server error",
      details: error.message
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
