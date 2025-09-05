import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Accept both paymentId and payment_id for compatibility
    const paymentId = (body?.paymentId || body?.payment_id || "").toString().trim();
    if (!paymentId) {
      return new Response(JSON.stringify({ error: "Payment ID is required (paymentId or payment_id)" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Create Supabase client with service role key for database access
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Missing environment variables" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    console.log(`🔍 Checking Dodo payment status for: ${paymentId}`);

    // Find the payment record - DODO PAYMENTS ONLY
    let payment: any = null;
    
    // Strategy 1: Direct Dodo payment provider ID lookup
    const { data: directPayment } = await supabaseAdmin
      .from("payments")
      .select("id, user_id, payment_provider_id, status, amount, credits_purchased, expires_at, created_at, updated_at")
      .eq("payment_provider_id", paymentId)
      .single();

    if (directPayment) {
      payment = directPayment;
      console.log(`✅ Found payment by payment_provider_id: ${paymentId}`);
    }

    // Strategy 2: Fallback ID lookup
    if (!payment) {
      const { data: fallbackPayment } = await supabaseAdmin
        .from("payments")
        .select("id, user_id, payment_provider_id, status, amount, credits_purchased, expires_at, created_at, updated_at")
        .eq("id", paymentId)
        .single();

      if (fallbackPayment) {
        payment = fallbackPayment;
        console.log(`✅ Found payment by id: ${paymentId}`);
      }
    }

    if (!payment) {
      console.log(`❌ Payment not found: ${paymentId}`);
      return new Response(JSON.stringify({
        error: "Payment not found",
        payment_id: paymentId,
        searched_fields: ["payment_provider_id", "id"],
        note: "Only Dodo Payments are supported"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    console.log(`✅ Payment found - Status: ${payment.status}, Amount: ${payment.amount}`);

    return new Response(JSON.stringify({
      success: true,
      payment: {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        credits_purchased: payment.credits_purchased,
        created_at: payment.created_at,
        payment_provider_id: payment.payment_provider_id,
        expires_at: payment.expires_at,
        user_id: payment.user_id
      },
      note: "Dodo Payments verification complete"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("❌ Enhanced payment status error:", error);
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      details: error.message,
      note: "Dodo Payments verification failed"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
