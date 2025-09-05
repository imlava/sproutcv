import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Payment type for minimal required fields
interface Payment {
  id: string;
  user_id: string;
  status: string;
  expires_at?: string;
  amount: number;
  credits_purchased: number;
}

// Minimal columns to select for performance
const PAYMENT_COLS = "id,user_id,status,expires_at,amount,credits_purchased";

// UUID validation helper
function isValidUuid(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
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

    // Find the payment record with multiple strategies
    let payment: Payment | null = null;
    
    // Strategy 1: Direct provider ID lookup
    const { data: directPayment, error: directError } = await supabaseAdmin
      .from("payments")
      .select(PAYMENT_COLS)
      .eq("payment_provider_id", paymentId)
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (directError) {
      console.error("Direct payment lookup error:", directError);
      throw new Error(`Database error during provider ID lookup: ${directError.message}`);
    }
    
    if (directPayment) {
      payment = directPayment as Payment;
      console.log(`✅ Found payment by provider ID: ${payment.id}`);
    } else {
      // Strategy 2: Stripe session ID lookup (for backward compatibility)
      const { data: stripePayment, error: stripeError } = await supabaseAdmin
        .from("payments")
        .select(PAYMENT_COLS)
        .eq("stripe_session_id", paymentId)
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (stripeError) {
        console.error("Stripe payment lookup error:", stripeError);
        throw new Error(`Database error during stripe session lookup: ${stripeError.message}`);
      }
      
      if (stripePayment) {
        payment = stripePayment as Payment;
        console.log(`✅ Found payment by stripe session: ${payment.id}`);
      } else if (isValidUuid(paymentId)) {
        // Strategy 3: Payment ID lookup (only if valid UUID)
        const { data: idPayment, error: idError } = await supabaseAdmin
          .from("payments")
          .select(PAYMENT_COLS)
          .eq("id", paymentId)
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (idError) {
          console.error("Payment ID lookup error:", idError);
          throw new Error(`Database error during payment ID lookup: ${idError.message}`);
        }
        
        if (idPayment) {
          payment = idPayment as Payment;
          console.log(`✅ Found payment by ID: ${payment.id}`);
        }
      } else {
        console.log(`⚠️ Skipping UUID lookup - invalid format: ${paymentId}`);
      }
    }

    if (!payment) {
      console.error("Payment not found for ID:", paymentId);
      return new Response(JSON.stringify({ 
        status: 'not_found',
        message: 'Payment not found or access denied'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    console.log("Payment found:", payment.id, "Status:", payment.status);

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

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Payment status check error:", err);
    return new Response(JSON.stringify({ 
      error: "Payment status check failed",
      message: message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}); 