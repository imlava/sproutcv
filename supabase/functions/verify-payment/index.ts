
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
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
    const { session_id } = await req.json();

    if (!session_id) {
      throw new Error("Missing session_id");
    }

    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === "paid") {
      // Update payment status in database
      const { data: payment } = await supabaseAdmin
        .from("payments")
        .select("*")
        .eq("stripe_session_id", session_id)
        .single();

      if (payment && payment.status === "pending") {
        // Update payment status
        await supabaseAdmin
          .from("payments")
          .update({ status: "completed" })
          .eq("stripe_session_id", session_id);

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
      status: session.payment_status,
      credits_added: session.payment_status === "paid" ? parseInt(session.metadata?.credits || "0") : 0
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
