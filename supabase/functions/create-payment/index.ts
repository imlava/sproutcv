
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
    const { credits, amount, test_mode } = await req.json();

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

// Get user profile for customer details (create minimal if missing)
let profile: { full_name: string | null; email: string | null } | null = null;
const { data: profileData, error: profileError } = await supabaseAdmin
  .from("profiles")
  .select("full_name, email")
  .eq("id", user.id)
  .maybeSingle();

if (profileError) {
  console.warn("Profile fetch error, attempting to create minimal profile:", profileError);
}

if (!profileData) {
  const minimalProfile = {
    id: user.id,
    email: user.email,
    full_name: (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) || (user.email ? user.email.split("@")[0] : null),
  } as { id: string; email: string | null; full_name: string | null };

  const { error: createProfileError } = await supabaseAdmin
    .from("profiles")
    .insert(minimalProfile);

  if (createProfileError) {
    console.error("Failed to auto-create profile:", createProfileError);
  } else {
    console.log("Auto-created minimal profile for user:", user.id);
  }
  profile = { full_name: minimalProfile.full_name, email: minimalProfile.email };
} else {
  profile = profileData as { full_name: string | null; email: string | null };
}

    const domain = getDomain(req.headers.get("origin"));
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const functionsBaseUrl = `${supabaseUrl}/functions/v1`;

    // Check if Dodo Payments API key is configured
    const dodoApiKey = Deno.env.get("DODO_PAYMENTS_API_KEY");
    
    if (!dodoApiKey) {
      console.error("Dodo Payments API key not configured");
      throw new Error("Payment service not configured. Please contact support.");
    }

    console.log("Dodo Payments API key found, proceeding with payment creation");

    try {
      // Use the correct Dodo Payments API base URL
      const dodoBaseUrl = test_mode ? 'https://api.dodopayments.com' : 'https://api.dodopayments.com';

      // Get product ID from secrets based on credits
      let productId = 'resume_credits'; // fallback
      try {
        if (credits === 5) {
          productId = Deno.env.get("DODO_PRODUCT_ID_5_CREDITS") || 'resume_credits_5';
        } else if (credits === 15) {
          productId = Deno.env.get("DODO_PRODUCT_ID_15_CREDITS") || 'resume_credits_15';
        } else if (credits === 30) {
          productId = Deno.env.get("DODO_PRODUCT_ID_30_CREDITS") || 'resume_credits_30';
        }
      } catch (error) {
        console.warn("Could not get product ID from secrets, using fallback:", error);
      }

      console.log("Creating payment with params:", {
        credits,
        amount,
        productId,
        customer: profile.email || user.email,
        name: profile?.full_name || user.email?.split('@')[0] || "Customer",
        baseUrl: dodoBaseUrl
      });

      // Create payment data matching Dodo API spec
      const paymentData = {
        product_cart: [
          {
            product_id: productId,
            quantity: 1
          }
        ],
        customer: {
          email: profile.email || user.email,
          name: profile?.full_name || user.email?.split('@')[0] || "Customer"
        },
        success_url: `${domain}/payments?payment_id={payment_id}&status=success&amount=${amount}&credits=${credits}`,
        cancel_url: `${domain}/payments?payment_id={payment_id}&status=cancelled`,
        webhook_url: `${functionsBaseUrl}/payments-webhook`,
        metadata: {
          user_id: user.id,
          credits: credits.toString(),
          source: "web_app",
          amount: amount.toString()
        }
      };

      console.log("Making API call to:", `${dodoBaseUrl}/v1/checkout_sessions`);
      console.log("Payload:", JSON.stringify(paymentData, null, 2));

      // Make API call with properly stringified headers
      const response = await fetch(`${dodoBaseUrl}/v1/checkout_sessions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${dodoApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Dodo API response error:", {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: errorText,
          requestBody: JSON.stringify(paymentData, null, 2)
        });
        throw new Error(`Dodo API error ${response.status}: ${errorText}`);
      }

      const payment = await response.json();
      console.log("Dodo payment created successfully:", payment);

      const paymentId = payment.payment_id || payment.id || payment.checkout_session_id;
      const paymentUrl = payment.payment_url || payment.url || payment.checkout_url;

      if (!paymentId || !paymentUrl) {
        throw new Error("Invalid response from Dodo Payments - missing payment ID or URL");
      }

      // Record payment in database (align field names used across the system)
      const { data: paymentRecord, error: paymentError } = await supabaseAdmin
        .from("payments")
        .insert({
          user_id: user.id,
          // Keep legacy field populated for backward compatibility
          stripe_session_id: paymentId,
          // Primary provider reference used by verify/check/webhook flows
          payment_provider_id: paymentId,
          amount: amount,
          credits_purchased: credits,
          status: "pending",
          payment_method: "dodo_payments",
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          payment_data: payment
        })
        .select()
        .single();

      if (paymentError) {
        console.error("Database error:", paymentError);
        throw new Error("Failed to record payment");
      }

      console.log("Payment created successfully:", paymentId);

      return new Response(JSON.stringify({ 
        url: paymentUrl,
        paymentId: paymentId,
        paymentMethod: "dodo_payments",
        status: "pending"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } catch (error) {
      console.error("Dodo Payments API error:", error);
      // Return more specific error message
      if (error.message.includes('401')) {
        throw new Error('Payment service authentication failed. Please check API configuration.');
      } else if (error.message.includes('400')) {
        throw new Error('Invalid payment request. Please check product configuration.');
      } else if (error.message.includes('404')) {
        throw new Error('Payment endpoint not found. Please check API configuration.');
      } else {
        throw new Error(`Payment creation failed: ${error.message}`);
      }
    }
  } catch (error) {
    console.error("Payment creation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
