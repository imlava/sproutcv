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
    console.log("=== PAYMENT VERIFICATION START ===");
    
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
    
    if (!supabaseUrl || !serviceKey) {
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

    // Enhanced payment lookup with multiple strategies
    let payment;
    let paymentError;

    // Strategy 1: Direct lookup by provider ID and stripe session ID
    const { data: directPayment, error: directError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .or(`payment_provider_id.eq.${paymentId},stripe_session_id.eq.${paymentId}`)
      .eq("user_id", user.id)
      .single();

    if (directError && directError.code !== 'PGRST116') { // Not "not found" error
      console.error("Direct payment lookup error:", directError);
    }

    if (directPayment) {
      payment = directPayment;
      console.log("✓ Payment found via direct lookup");
    } else {
      // Strategy 2: Fuzzy lookup by amount and user (for fallback)
      if (amount) {
        const { data: fuzzyPayment, error: fuzzyError } = await supabaseAdmin
          .from("payments")
          .select("*")
          .eq("user_id", user.id)
          .eq("amount", amount)
          .in("status", ["pending", "processing"])
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (fuzzyPayment) {
          payment = fuzzyPayment;
          console.log("✓ Payment found via fuzzy lookup");
          
          // Update the payment record with the correct provider ID
          await supabaseAdmin
            .from("payments")
            .update({ payment_provider_id: paymentId })
            .eq("id", fuzzyPayment.id);
        }
      }
    }

    if (!payment) {
      console.error("Payment not found for:", { paymentId, userId: user.id, amount });
      return new Response(JSON.stringify({ 
        status: 'failed',
        message: 'Payment not found or access denied',
        paymentId,
        userId: user.id
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    console.log("Payment found:", { 
      id: payment.id, 
      status: payment.status, 
      amount: payment.amount,
      credits: payment.credits_purchased
    });

    // Optional: Verify payment with Dodo API for additional security
    if (dodoApiKey && payment.payment_method === "dodo_payments") {
      try {
        await verifyWithDodoAPI(paymentId, dodoApiKey);
        console.log("✓ Payment verified with Dodo API");
      } catch (dodoError) {
        console.warn("Dodo API verification failed:", dodoError);
        // Continue without failing - webhook is primary verification
      }
    }

    // Process based on status
    switch (status.toLowerCase()) {
      case 'success':
      case 'completed':
      case 'succeeded':
        return await handleSuccessfulPayment(supabaseAdmin, payment, user, paymentId);
        
      case 'failed':
      case 'error':
        return await handleFailedPayment(supabaseAdmin, payment, paymentId);
        
      case 'cancelled':
      case 'canceled':
        return await handleCancelledPayment(supabaseAdmin, payment, paymentId);
        
      case 'pending':
      case 'processing':
        return await handlePendingPayment(payment, paymentId);
        
      default:
        console.warn("Unknown payment status:", status);
        return createSuccessResponse(payment.status, payment, paymentId, `Payment status: ${payment.status}`);
    }

  } catch (error) {
    console.error("=== PAYMENT VERIFICATION ERROR ===", error);
    return new Response(JSON.stringify({ 
      error: "Payment verification failed",
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// Enhanced successful payment handler
async function handleSuccessfulPayment(supabaseAdmin: any, payment: any, user: any, paymentId: string) {
  console.log("Processing successful payment...");
  
  // Check if payment is already processed
  if (payment.status === 'completed') {
    console.log("Payment already completed");
    return createSuccessResponse('success', payment, paymentId, 'Payment already completed');
  }

  // Process the payment if it's still pending
  if (payment.status === 'pending' || payment.status === 'processing') {
    try {
      console.log("Processing pending payment...");
      
      const { data: success, error: processError } = await supabaseAdmin.rpc("process_successful_payment", {
        payment_id: payment.id,
        provider_transaction_id: paymentId
      });

      if (processError) {
        console.error("Failed to process payment:", processError);
        throw new Error("Payment processing failed");
      }

      console.log("✓ Payment processed successfully");

      // Send payment notification email (non-blocking)
      try {
        await supabaseAdmin.functions.invoke('payment-notification', {
          body: {
            userId: user.id,
            paymentId: payment.id,
            credits: payment.credits_purchased,
            amount: payment.amount
          }
        });
        console.log("✓ Payment notification email sent");
      } catch (emailError) {
        console.error("⚠️ Failed to send payment notification:", emailError);
      }

      // Log verification event
      await supabaseAdmin
        .from("security_events")
        .insert({
          user_id: user.id,
          event_type: "payment_verified",
          metadata: {
            payment_id: paymentId,
            verification_method: "frontend",
            amount: payment.amount,
            credits: payment.credits_purchased
          }
        });

      return createSuccessResponse('success', payment, paymentId, 'Payment processed successfully');

    } catch (error) {
      console.error("Payment processing error:", error);
      return new Response(JSON.stringify({ 
        status: 'failed',
        paymentId,
        message: 'Payment processing failed',
        error: error.message
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
  }

  // Payment in unexpected state
  console.warn("Payment in unexpected state:", payment.status);
  return createSuccessResponse(payment.status, payment, paymentId, `Payment status: ${payment.status}`);
}

// Enhanced failed payment handler
async function handleFailedPayment(supabaseAdmin: any, payment: any, paymentId: string) {
  console.log("Processing failed payment...");
  
  const { error: updateError } = await supabaseAdmin
    .from("payments")
    .update({ 
      status: "failed",
      updated_at: new Date().toISOString(),
      payment_data: {
        ...payment.payment_data,
        verification_failed_at: new Date().toISOString(),
        failure_reason: "payment_failed_verification"
      }
    })
    .eq("id", payment.id);

  if (updateError) {
    console.error("Failed to update payment status:", updateError);
  } else {
    console.log("✓ Failed payment status updated");
  }

  return createSuccessResponse('failed', payment, paymentId, 'Payment failed');
}

// Enhanced cancelled payment handler
async function handleCancelledPayment(supabaseAdmin: any, payment: any, paymentId: string) {
  console.log("Processing cancelled payment...");
  
  const { error: updateError } = await supabaseAdmin
    .from("payments")
    .update({ 
      status: "cancelled",
      updated_at: new Date().toISOString(),
      payment_data: {
        ...payment.payment_data,
        cancelled_at: new Date().toISOString(),
        cancellation_source: "user_action"
      }
    })
    .eq("id", payment.id);

  if (updateError) {
    console.error("Failed to update payment status:", updateError);
  } else {
    console.log("✓ Cancelled payment status updated");
  }

  return createSuccessResponse('cancelled', payment, paymentId, 'Payment cancelled');
}

// Pending payment handler
async function handlePendingPayment(payment: any, paymentId: string) {
  console.log("Payment still pending...");
  return createSuccessResponse('pending', payment, paymentId, 'Payment is still being processed');
}

// Verify payment with Dodo API
async function verifyWithDodoAPI(paymentId: string, apiKey: string) {
  const dodoBaseUrl = "https://api.dodopayments.com";
  
  const response = await fetch(`${dodoBaseUrl}/v1/checkout_sessions/${paymentId}`, {
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Accept": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Dodo API verification failed: ${response.status}`);
  }

  const paymentData = await response.json();
  
  if (paymentData.status !== "completed" && paymentData.status !== "succeeded") {
    throw new Error(`Payment not completed in Dodo: ${paymentData.status}`);
  }

  return paymentData;
}

// Helper function to create standardized success responses
function createSuccessResponse(status: string, payment: any, paymentId: string, message: string) {
  return new Response(JSON.stringify({ 
    status,
    paymentId,
    amount: payment.amount,
    credits: payment.credits_purchased,
    message,
    timestamp: new Date().toISOString()
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}