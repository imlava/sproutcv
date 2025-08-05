
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import DodoPayments from "https://esm.sh/dodopayments@1.44.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { credits, amount } = await req.json();

    if (!credits || !amount) {
      throw new Error("Missing credits or amount");
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

    // Initialize Dodo Payments client
    const dodoApiKey = Deno.env.get("DODO_PAYMENTS_API_KEY");
    if (!dodoApiKey) {
      throw new Error("Dodo Payments API key not configured");
    }

    const dodoClient = new DodoPayments({
      bearerToken: dodoApiKey,
    });

    // Get user profile for customer details
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    // Create payment link with Dodo Payments
    const payment = await dodoClient.payments.create({
      payment_link: true,
      customer: {
        email: user.email,
        name: profile?.full_name || user.email.split('@')[0],
      },
      product_cart: [{
        product_id: "resume_credits", // You'll need to create this product in Dodo dashboard
        quantity: 1,
        unit_amount: amount, // Amount in cents
      }],
      metadata: {
        user_id: user.id,
        credits: credits.toString(),
        source: "web_app",
      },
      success_url: `${req.headers.get("origin")}/dashboard?payment=success`,
      cancel_url: `${req.headers.get("origin")}/dashboard?payment=cancelled`,
    });

    const paymentId = payment.payment_id;
    const paymentUrl = payment.payment_link;

    // Record payment in database with enhanced data
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    const { data: paymentRecord, error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: user.id,
        stripe_session_id: paymentId, // Reusing this field for payment ID
        amount: amount,
        credits_purchased: credits,
        status: "pending",
        payment_method: "dodo_payments",
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
          payment_method: "dodo_payments",
          amount: amount,
          credits: credits,
          payment_id: paymentId
        },
        ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip")
      });

    return new Response(JSON.stringify({ 
      url: paymentUrl,
      paymentId: paymentId,
      paymentMethod: "dodo_payments",
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
