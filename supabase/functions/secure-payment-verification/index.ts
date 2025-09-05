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
    console.log("=== SECURE PAYMENT VERIFICATION START ===");
    
    const { paymentId, status, amount, credits } = await req.json();

    // Enhanced input validation
    if (!paymentId || !status) {
      throw new Error("Payment ID and status are required");
    }

    console.log("Verification request:", { paymentId, status, amount, credits });

    // Environment validation
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const dodoApiKey = Deno.env.get("DODO_PAYMENTS_API_KEY");
    
    if (!supabaseUrl || !serviceKey || !dodoApiKey) {
      throw new Error("Missing environment variables");
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // Enhanced authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Error("Invalid authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !userData.user) {
      console.error("Auth error:", userError);
      throw new Error("User authentication failed");
    }

    const user = userData.user;
    console.log("✓ User authenticated:", user.id);

    // CRITICAL SECURITY FIX: Always verify with Dodo Payments API first
    console.log("🔒 Verifying payment with Dodo Payments API...");
    
    try {
      const dodoResponse = await fetch(`https://api.dodopayments.com/api/v1/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${dodoApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!dodoResponse.ok) {
        console.error("Dodo API verification failed:", dodoResponse.status, dodoResponse.statusText);
        throw new Error(`Payment verification failed: ${dodoResponse.status}`);
      }

      const dodoData = await dodoResponse.json();
      console.log("Dodo API response:", dodoData);

      // SECURITY CHECK: Only trust Dodo's actual payment status
      const actualPaymentStatus = dodoData.status || dodoData.payment_status;
      const actualAmount = dodoData.amount;

      console.log("🔒 Dodo API verified status:", actualPaymentStatus);

      // CRITICAL: Reject if payment is not actually successful
      if (actualPaymentStatus !== 'succeeded' && actualPaymentStatus !== 'completed' && actualPaymentStatus !== 'paid') {
        console.error("🚨 SECURITY ALERT: Payment not successful in Dodo API");
        console.error("Frontend status:", status);
        console.error("Actual Dodo status:", actualPaymentStatus);
        
        // Log security incident
        await supabaseAdmin
          .from("security_events")
          .insert({
            user_id: user.id,
            event_type: "payment_verification_mismatch",
            metadata: {
              payment_id: paymentId,
              frontend_status: status,
              actual_dodo_status: actualPaymentStatus,
              severity: "HIGH",
              potential_fraud: true
            }
          });

        return new Response(JSON.stringify({ 
          status: 'failed',
          message: 'Payment verification failed - Payment not successful',
          actualStatus: actualPaymentStatus,
          securityCheck: 'FAILED'
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      // Verify amount matches (if provided)
      if (amount && actualAmount !== parseInt(amount)) {
        console.error("🚨 SECURITY ALERT: Amount mismatch");
        console.error("Frontend amount:", amount);
        console.error("Actual Dodo amount:", actualAmount);
        
        await supabaseAdmin
          .from("security_events")
          .insert({
            user_id: user.id,
            event_type: "payment_amount_mismatch",
            metadata: {
              payment_id: paymentId,
              frontend_amount: amount,
              actual_amount: actualAmount,
              severity: "HIGH"
            }
          });

        return new Response(JSON.stringify({ 
          status: 'failed',
          message: 'Payment verification failed - Amount mismatch',
          securityCheck: 'FAILED'
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      console.log("✅ Payment verified with Dodo API - proceeding with processing");

    } catch (dodoError) {
      console.error("🚨 CRITICAL: Cannot verify payment with Dodo API:", dodoError);
      
      // Log critical security event
      await supabaseAdmin
        .from("security_events")
        .insert({
          user_id: user.id,
          event_type: "payment_verification_failed",
          metadata: {
            payment_id: paymentId,
            error: dodoError.message,
            severity: "CRITICAL"
          }
        });

      return new Response(JSON.stringify({ 
        status: 'failed',
        message: 'Payment verification failed - Cannot verify with payment provider',
        securityCheck: 'FAILED'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Find payment in database
    let payment;
    const { data: directPayment, error: directError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .or(`payment_provider_id.eq.${paymentId},stripe_session_id.eq.${paymentId}`)
      .eq("user_id", user.id)
      .single();

    if (directPayment) {
      payment = directPayment;
      console.log("✓ Payment found in database");
    }

    if (!payment) {
      console.error("Payment not found in database:", { paymentId, userId: user.id });
      return new Response(JSON.stringify({ 
        status: 'failed',
        message: 'Payment not found in database',
        paymentId,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Process successful payment (only after API verification)
    if (payment.status === 'completed') {
      console.log("Payment already completed");
      return new Response(JSON.stringify({
        status: 'success',
        paymentId,
        amount: payment.amount,
        credits: payment.credits_purchased,
        message: 'Payment already completed',
        securityCheck: 'PASSED'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Process the payment
    console.log("Processing verified payment...");
    
    const { data: success, error: processError } = await supabaseAdmin.rpc("process_successful_payment", {
      payment_id: payment.id,
      provider_transaction_id: paymentId
    });

    if (processError) {
      console.error("Failed to process payment:", processError);
      throw new Error("Payment processing failed");
    }

    console.log("✅ Payment processed successfully with full verification");

    // Log successful verification
    await supabaseAdmin
      .from("security_events")
      .insert({
        user_id: user.id,
        event_type: "payment_verified_secure",
        metadata: {
          payment_id: paymentId,
          verification_method: "dodo_api_verified",
          amount: payment.amount,
          credits: payment.credits_purchased,
          security_level: "HIGH"
        }
      });

    return new Response(JSON.stringify({
      status: 'success',
      paymentId,
      amount: payment.amount,
      credits: payment.credits_purchased,
      message: 'Payment verified and processed successfully',
      securityCheck: 'PASSED'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("=== SECURE PAYMENT VERIFICATION ERROR ===", error);
    return new Response(JSON.stringify({ 
      error: "Payment verification failed",
      message: error.message,
      securityCheck: 'FAILED',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
