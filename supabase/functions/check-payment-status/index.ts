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
    const { paymentId } = await req.json();

    if (!paymentId) {
      throw new Error("Payment ID is required");
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

    console.log(`Checking payment status for ${paymentId} for user ${user.id}`);

    // Find the payment record
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .or(`payment_provider_id.eq.${paymentId},stripe_session_id.eq.${paymentId}`)
      .eq("user_id", user.id)
      .single();

    if (paymentError || !payment) {
      console.error("Payment not found:", paymentError);
      return new Response(JSON.stringify({ 
        status: 'not_found',
        message: 'Payment not found or access denied'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    console.log("Payment status:", payment.status);

    // Check if payment has expired
    if (payment.expires_at && new Date(payment.expires_at) < new Date()) {
      if (payment.status === 'pending') {
        // Update expired payment status
        await supabaseAdmin
          .from("payments")
          .update({ 
            status: 'expired',
            updated_at: new Date().toISOString()
          })
          .eq("id", payment.id);

        return new Response(JSON.stringify({ 
          status: 'expired',
          paymentId,
          amount: payment.amount,
          credits: payment.credits_purchased,
          message: 'Payment has expired'
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    // Return current payment status
    return new Response(JSON.stringify({ 
      status: payment.status,
      paymentId,
      amount: payment.amount,
      credits: payment.credits_purchased,
      message: `Payment status: ${payment.status}`,
      expiresAt: payment.expires_at
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Payment status check error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}); 