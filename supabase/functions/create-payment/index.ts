
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
    const { credits, amount, paymentMethod } = await req.json();

    if (!credits || !amount || !paymentMethod) {
      throw new Error("Missing credits, amount, or paymentMethod");
    }

    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseAdmin.auth.getUser(token);
    const user = data.user;

    if (!user?.email) {
      throw new Error("User not authenticated");
    }

    let paymentUrl = "";
    let paymentId = "";

    if (paymentMethod === "razorpay") {
      // Razorpay integration
      const razorpayKey = Deno.env.get("RAZORPAY_KEY_SECRET");
      const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
      
      if (!razorpayKey || !razorpayKeyId) {
        throw new Error("Razorpay credentials not configured");
      }

      const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${btoa(`${razorpayKeyId}:${razorpayKey}`)}`,
        },
        body: JSON.stringify({
          amount: amount, // Amount in paise
          currency: "INR",
          receipt: `receipt_${Date.now()}`,
          notes: {
            user_id: user.id,
            credits: credits.toString(),
          },
        }),
      });

      if (!razorpayResponse.ok) {
        const errorData = await razorpayResponse.text();
        console.error("Razorpay API error:", errorData);
        throw new Error("Failed to create Razorpay order");
      }

      const razorpayOrder = await razorpayResponse.json();
      paymentId = razorpayOrder.id;
      paymentUrl = `razorpay://${razorpayOrder.id}`;
    } else if (paymentMethod === "paypal") {
      // PayPal integration
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

      // Create PayPal order
      const orderResponse = await fetch(`${paypalBaseUrl}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [{
            amount: {
              currency_code: "USD",
              value: (amount / 100).toString(),
            },
            description: `${credits} Resume Analysis Credits`,
          }],
          application_context: {
            return_url: `${req.headers.get("origin")}/dashboard?payment=success`,
            cancel_url: `${req.headers.get("origin")}/dashboard?payment=cancelled`,
          },
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.text();
        console.error("PayPal API error:", errorData);
        throw new Error("Failed to create PayPal order");
      }

      const orderData = await orderResponse.json();
      paymentId = orderData.id;
      paymentUrl = orderData.links.find((link: any) => link.rel === "approve")?.href || "";
    }

    // Record payment in database with enhanced data
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: user.id,
        stripe_session_id: paymentId, // Reusing this field for payment ID
        amount: amount,
        credits_purchased: credits,
        status: "pending",
        payment_method: paymentMethod,
        payment_provider_id: paymentId,
        payment_data: {
          user_email: user.email,
          created_via: "web_app",
          ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip")
        },
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Database error:", paymentError);
      throw new Error("Failed to record payment");
    }

    // Log security event
    await supabaseAdmin
      .from("security_events")
      .insert({
        user_id: user.id,
        event_type: "payment_initiated",
        metadata: {
          payment_method: paymentMethod,
          amount: amount,
          credits: credits,
          payment_id: paymentId
        },
        ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip")
      });

    return new Response(JSON.stringify({ 
      url: paymentUrl,
      paymentId: paymentId,
      paymentMethod: paymentMethod,
      expiresAt: expiresAt.toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Payment creation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
