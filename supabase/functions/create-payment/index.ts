
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Get the proper domain for redirects
const getDomain = (origin: string | null) => {
  if (origin && origin.includes('localhost')) {
    return 'http://localhost:5173'; // Development
  }
  return 'https://sproutcv.app'; // Production
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

    // Validate input
    if (credits <= 0 || amount <= 0) {
      throw new Error("Invalid credits or amount");
    }

    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }

    const user = userData.user;

    // Get user profile for customer details
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      throw new Error("Failed to fetch user profile");
    }

    // Initialize Dodo Payments API
    const dodoApiKey = Deno.env.get("DODO_PAYMENTS_API_KEY");
    if (!dodoApiKey) {
      throw new Error("Dodo Payments API key not configured");
    }

    const domain = getDomain(req.headers.get("origin"));

    // Create payment with Dodo Payments API
    const paymentData = {
      amount: amount, // Amount in cents
      currency: "USD",
      customer: {
        email: profile.email || user.email,
        name: profile?.full_name || user.email?.split('@')[0] || "Customer"
      },
      metadata: {
        user_id: user.id,
        credits: credits.toString(),
        source: "web_app",
        product: "resume_credits"
      },
      success_url: `${domain}/payments?payment_id={payment_id}&status=success&amount=${amount}&credits=${credits}`,
      cancel_url: `${domain}/payments?payment_id={payment_id}&status=cancelled`,
      webhook_url: `${domain}/functions/v1/payments-webhook`,
      description: `${credits} Resume Analysis Credits`,
      expires_in: 3600 // 1 hour
    };

    console.log("Creating Dodo payment with data:", paymentData);

    // Make API call to Dodo Payments
    const dodoResponse = await fetch("https://api.dodopayments.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${dodoApiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "SproutCV/1.0"
      },
      body: JSON.stringify(paymentData)
    });

    if (!dodoResponse.ok) {
      const errorData = await dodoResponse.text();
      console.error("Dodo API error:", dodoResponse.status, errorData);
      throw new Error(`Payment creation failed: ${dodoResponse.status}`);
    }

    const dodoPayment = await dodoResponse.json();
    console.log("Dodo payment created:", dodoPayment);

    const paymentId = dodoPayment.id;
    const paymentUrl = dodoPayment.payment_url;

    if (!paymentId || !paymentUrl) {
      throw new Error("Invalid response from Dodo Payments");
    }

    // Record payment in database
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
          user_email: profile.email || user.email,
          created_via: "web_app",
          ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
          dodo_payment_data: dodoPayment
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

    console.log("Payment created successfully:", paymentId);

    return new Response(JSON.stringify({ 
      url: paymentUrl,
      paymentId: paymentId,
      paymentMethod: "dodo_payments",
      expiresAt: expiresAt.toISOString(),
      status: "pending"
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
