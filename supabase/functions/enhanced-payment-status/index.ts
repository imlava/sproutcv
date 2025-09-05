import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRecord {
  id: string;
  user_id: string;
  payment_provider_id?: string;
  stripe_session_id?: string;
  status: string;
  amount: number;
  credits_purchased: number;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paymentId } = await req.json();

    if (!paymentId) {
      throw new Error("Payment ID is required");
    }

    console.log(`🔍 Checking payment status for: ${paymentId}`);

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

    // Find the payment record with multiple strategies
    let payment: PaymentRecord | null = null;
    
    // Strategy 1: Direct provider ID lookup
    const { data: directPayment } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("payment_provider_id", paymentId)
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (directPayment) {
      payment = directPayment as PaymentRecord;
      console.log(`✅ Found payment by provider ID: ${payment.id}`);
    }
    
    // Strategy 2: Stripe session ID lookup (backward compatibility)
    if (!payment) {
      const { data: stripePayment } = await supabaseAdmin
        .from("payments")
        .select("*")
        .eq("stripe_session_id", paymentId)
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (stripePayment) {
        payment = stripePayment as PaymentRecord;
        console.log(`✅ Found payment by stripe session: ${payment.id}`);
      }
    }
    
    // Strategy 3: Direct payment ID lookup
    if (!payment) {
      const { data: idPayment } = await supabaseAdmin
        .from("payments")
        .select("*")
        .eq("id", paymentId)
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (idPayment) {
        payment = idPayment as PaymentRecord;
        console.log(`✅ Found payment by ID: ${payment.id}`);
      }
    }

    if (!payment) {
      console.error(`❌ Payment not found for ID: ${paymentId}`);
      return new Response(JSON.stringify({ 
        status: 'not_found',
        message: 'Payment not found or access denied'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    console.log(`📋 Payment found: ${payment.id}, Status: ${payment.status}`);

    // Check if payment has expired
    if (payment.expires_at && new Date(payment.expires_at) < new Date()) {
      if (payment.status === 'pending') {
        console.log(`⏰ Payment expired, updating status: ${payment.id}`);
        
        await supabaseAdmin
          .from("payments")
          .update({ 
            status: 'expired',
            updated_at: new Date().toISOString()
          })
          .eq("id", payment.id);

        return new Response(JSON.stringify({ 
          status: 'expired',
          paymentId: payment.id,
          amount: payment.amount,
          credits: payment.credits_purchased,
          message: 'Payment has expired'
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Get current user credits for context
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    const response = {
      status: payment.status,
      paymentId: payment.id,
      amount: payment.amount,
      credits: payment.credits_purchased,
      currentUserCredits: profile?.credits || 0,
      message: `Payment status: ${payment.status}`,
      expiresAt: payment.expires_at,
      createdAt: payment.created_at,
      updatedAt: payment.updated_at
    };

    console.log(`📤 Returning payment status: ${payment.status}`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("❌ Payment status check error:", error);
    return new Response(JSON.stringify({
      error: "Payment status check failed",
      message: error.message
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
