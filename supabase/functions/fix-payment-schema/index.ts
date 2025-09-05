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
    console.log("=== PAYMENT TRANSACTIONS SCHEMA FIX START ===");
    
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const result = {
      timestamp: new Date().toISOString(),
      steps: [] as any[],
      success: true
    };

    // Step 1: Create payment_transactions table
    console.log("📋 Step 1: Creating payment_transactions table...");
    try {
      // First, check if table exists
      const { data: tableExists } = await supabase
        .from("payment_transactions")
        .select("id")
        .limit(1);

      if (tableExists !== null) {
        result.steps.push({
          step: 1,
          description: "payment_transactions table already exists",
          status: "skipped"
        });
        console.log("✅ Table already exists");
      } else {
        result.steps.push({
          step: 1,
          description: "payment_transactions table does not exist, needs manual creation",
          status: "needs_manual_creation",
          sql: `
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID,
    payment_provider_id TEXT,
    transaction_type TEXT NOT NULL DEFAULT 'webhook',
    amount INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'pending',
    provider_response JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
          `
        });
      }
    } catch (error) {
      console.log("❌ Table doesn't exist or access denied:", error.message);
      result.steps.push({
        step: 1,
        description: "Table creation needed",
        status: "manual_required",
        error: error.message,
        sql: `
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID,
    payment_provider_id TEXT,
    transaction_type TEXT NOT NULL DEFAULT 'webhook',
    amount INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'pending',
    provider_response JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Grant permissions to service role
GRANT ALL ON public.payment_transactions TO service_role;

-- Create policy for service role access
CREATE POLICY "Service role can manage payment transactions" 
ON public.payment_transactions FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');
        `
      });
    }

    // Step 2: Check payments table structure
    console.log("📋 Step 2: Checking payments table...");
    try {
      const { data: paymentsData } = await supabase
        .from("payments")
        .select("id, payment_provider_id, metadata")
        .limit(1);

      if (paymentsData !== null) {
        result.steps.push({
          step: 2,
          description: "payments table accessible",
          status: "success"
        });
      }
    } catch (error) {
      result.steps.push({
        step: 2,
        description: "payments table needs columns",
        status: "manual_required",
        error: error.message,
        sql: `
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS payment_provider_id TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
        `
      });
    }

    // Step 3: Test webhook function access
    console.log("📋 Step 3: Testing webhook function configuration...");
    try {
      // Try to access the enhanced-dodo-webhook function
      const testPayload = {
        event_type: "payment.succeeded",
        payment_id: "test_payment_id",
        status: "succeeded",
        customer: { email: "test@example.com" },
        amount: 1000
      };

      const { data: webhookResponse, error: webhookError } = await supabase.functions.invoke('enhanced-dodo-webhook', {
        body: testPayload
      });

      if (webhookError) {
        result.steps.push({
          step: 3,
          description: "Webhook function test",
          status: "error",
          error: webhookError.message
        });
      } else {
        result.steps.push({
          step: 3,
          description: "Webhook function accessible",
          status: "success"
        });
      }
    } catch (error) {
      result.steps.push({
        step: 3,
        description: "Webhook function test failed",
        status: "error",
        error: error.message
      });
    }

    // Step 4: Provide Dodo Payments webhook configuration
    console.log("📋 Step 4: Dodo Payments webhook configuration...");
    result.steps.push({
      step: 4,
      description: "Dodo Payments webhook configuration",
      status: "info",
      webhook_url: `${SUPABASE_URL}/functions/v1/enhanced-dodo-webhook`,
      required_headers: {
        "webhook-signature": "Required for verification",
        "webhook-id": "Webhook ID from Dodo",
        "webhook-timestamp": "Unix timestamp"
      },
      dodo_setup: {
        dashboard_url: "https://app.dodopayments.com/",
        webhook_section: "Developer > Webhooks",
        events_to_enable: [
          "payment.succeeded",
          "payment.failed", 
          "payment.processing",
          "subscription.active",
          "subscription.cancelled"
        ]
      }
    });

    console.log("=== PAYMENT TRANSACTIONS SCHEMA FIX COMPLETE ===");

    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("=== SCHEMA FIX ERROR ===", error);
    return new Response(JSON.stringify({
      error: "Schema fix failed",
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
