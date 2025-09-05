import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 405,
      });
    }

    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return new Response(JSON.stringify({ error: "Unsupported Media Type" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 415,
      });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

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

    console.log(`Checking payment status for ${paymentId}`);

    // Find the payment record with multiple strategies
    let payment: any = null;
    
    // Strategy 1: Direct provider ID lookup
    const { data: directPayment } = await supabaseAdmin
      .from("payments")
      .select("id, user_id, payment_provider_id, stripe_session_id, status, amount, credits_purchased, expires_at, created_at, updated_at")
      .eq("payment_provider_id", paymentId)
      .single();

    if (directPayment) {
      payment = directPayment;
    }

    // Strategy 2: Stripe session ID lookup
    if (!payment) {
      const { data: stripePayment } = await supabaseAdmin
        .from("payments")
        .select("id, user_id, payment_provider_id, stripe_session_id, status, amount, credits_purchased, expires_at, created_at, updated_at")
        .eq("stripe_session_id", paymentId)
        .single();

      if (stripePayment) {
        payment = stripePayment;
      }
    }

    // Strategy 3: Direct ID lookup
    if (!payment) {
      const { data: idPayment } = await supabaseAdmin
        .from("payments")
        .select("id, user_id, payment_provider_id, stripe_session_id, status, amount, credits_purchased, expires_at, created_at, updated_at")
        .eq("id", paymentId)
        .single();

      if (idPayment) {
        payment = idPayment;
      }
    }

    if (!payment) {
      return new Response(JSON.stringify({ 
        error: "Payment not found",
        payment_id: paymentId,
        searched_fields: ["payment_provider_id", "stripe_session_id", "id"]
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      payment: {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        credits_purchased: payment.credits_purchased,
        created_at: payment.created_at,
        payment_provider_id: payment.payment_provider_id,
        stripe_session_id: payment.stripe_session_id
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Enhanced payment status error:", error);
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      details: error.message
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
