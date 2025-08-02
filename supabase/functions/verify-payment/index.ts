
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
    const { payment_id, payment_method } = await req.json();

    if (!payment_id || !payment_method) {
      throw new Error("Missing payment_id or payment_method");
    }

    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    let paymentStatus = "pending";

    if (payment_method === "razorpay") {
      // Verify Razorpay payment
      const razorpayKey = Deno.env.get("RAZORPAY_KEY_SECRET");
      const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");

      if (!razorpayKey || !razorpayKeyId) {
        throw new Error("Razorpay credentials not configured");
      }

      const razorpayResponse = await fetch(`https://api.razorpay.com/v1/orders/${payment_id}`, {
        headers: {
          "Authorization": `Basic ${btoa(`${razorpayKeyId}:${razorpayKey}`)}`,
        },
      });

      if (razorpayResponse.ok) {
        const razorpayOrder = await razorpayResponse.json();
        paymentStatus = razorpayOrder.status === "paid" ? "completed" : "pending";
      }
    } else if (payment_method === "paypal") {
      // Verify PayPal payment
      const paypalClientId = Deno.env.get("PAYPAL_CLIENT_ID");
      const paypalClientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET");
      const paypalBaseUrl = Deno.env.get("PAYPAL_BASE_URL") || "https://api.sandbox.paypal.com";

      if (!paypalClientId || !paypalClientSecret) {
        throw new Error("PayPal credentials not configured");
      }

      // Get PayPal access token
      const tokenResponse = await fetch(`${paypalBaseUrl}/v1/oauth2/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${btoa(`${paypalClientId}:${paypalClientSecret}`)}`,
        },
        body: "grant_type=client_credentials",
      });

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Check PayPal order status
      const orderResponse = await fetch(`${paypalBaseUrl}/v2/checkout/orders/${payment_id}`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      });

      if (orderResponse.ok) {
        const orderData = await orderResponse.json();
        paymentStatus = orderData.status === "COMPLETED" ? "completed" : "pending";
      }
    }

    if (paymentStatus === "completed") {
      // Update payment status in database
      const { data: payment } = await supabaseAdmin
        .from("payments")
        .select("*")
        .eq("stripe_session_id", payment_id)
        .single();

      if (payment && payment.status === "pending") {
        // Update payment status
        await supabaseAdmin
          .from("payments")
          .update({ status: "completed" })
          .eq("stripe_session_id", payment_id);

        // Add credits to user profile
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("credits")
          .eq("id", payment.user_id)
          .single();

        const currentCredits = profile?.credits || 0;
        const newCredits = currentCredits + payment.credits_purchased;

        await supabaseAdmin
          .from("profiles")
          .update({ 
            credits: newCredits,
            updated_at: new Date().toISOString()
          })
          .eq("id", payment.user_id);
      }
    }

    return new Response(JSON.stringify({ 
      status: paymentStatus,
      credits_added: paymentStatus === "completed" ? payment?.credits_purchased || 0 : 0
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
