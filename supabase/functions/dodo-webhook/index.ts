import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-dodo-signature, x-dodo-timestamp",
};

interface DodoWebhookPayload {
  event_type: string;
  data: {
    id: string;
    status: string;
    amount: number;
    currency: string;
    customer: {
      email: string;
      name: string;
    };
    metadata: {
      user_id: string;
      credits: string;
      source: string;
      product: string;
    };
    payment_method: string;
    created_at: string;
    updated_at: string;
  };
  timestamp: number;
}

// Enhanced webhook signature verification with multiple formats
const verifyWebhookSignature = async (payload: string, signature: string, secret: string, timestamp?: string): Promise<boolean> => {
  try {
    const encoder = new TextEncoder();
    
    // Try different signature formats that Dodo might use
    const signaturesToTry = [
      signature, // Raw signature
      signature.replace('sha256=', ''), // Remove sha256= prefix if present
      signature.replace('v1=', ''), // Remove v1= prefix if present
    ];
    
    for (const sig of signaturesToTry) {
      try {
        // Method 1: Direct payload signing
        const key1 = await crypto.subtle.importKey(
          "raw",
          encoder.encode(secret),
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"]
        );
        const sigBuffer1 = await crypto.subtle.sign("HMAC", key1, encoder.encode(payload));
        const expected1 = Array.from(new Uint8Array(sigBuffer1))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        
        if (expected1 === sig || expected1 === sig.toLowerCase()) {
          console.log("Signature verified with method 1");
          return true;
        }
        
        // Method 2: Timestamp + payload signing (if timestamp provided)
        if (timestamp) {
          const timestampedPayload = timestamp + "." + payload;
          const key2 = await crypto.subtle.importKey(
            "raw",
            encoder.encode(secret),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
          );
          const sigBuffer2 = await crypto.subtle.sign("HMAC", key2, encoder.encode(timestampedPayload));
          const expected2 = Array.from(new Uint8Array(sigBuffer2))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
          
          if (expected2 === sig || expected2 === sig.toLowerCase()) {
            console.log("Signature verified with method 2 (timestamped)");
            return true;
          }
        }
      } catch (innerError) {
        console.warn("Signature verification attempt failed:", innerError);
        continue;
      }
    }
    
    return false;
  } catch (error) {
    console.error("Webhook signature verification error:", error);
    return false;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== DODO PAYMENTS WEBHOOK RECEIVED ===");
    
    // Environment validation
    const webhookSecret = Deno.env.get("DODO_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!webhookSecret || !supabaseUrl || !serviceKey) {
      console.error("Missing environment variables:", {
        webhookSecret: !!webhookSecret,
        supabaseUrl: !!supabaseUrl,
        serviceKey: !!serviceKey
      });
      throw new Error("Server configuration error - missing environment variables");
    }

    // Get the raw body and headers
    const rawBody = await req.text();
    const signature = req.headers.get("x-dodo-signature") || req.headers.get("signature");
    const timestamp = req.headers.get("x-dodo-timestamp") || req.headers.get("timestamp");
    
    console.log("Webhook headers:", {
      signature: signature ? "present" : "missing",
      timestamp: timestamp ? "present" : "missing",
      userAgent: req.headers.get("user-agent"),
      contentType: req.headers.get("content-type")
    });

    // Enhanced signature verification (optional for development)
    if (signature) {
      const isValidSignature = await verifyWebhookSignature(rawBody, signature, webhookSecret, timestamp);
      if (!isValidSignature) {
        console.error("Invalid webhook signature");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        });
      }
      console.log("✓ Webhook signature verified successfully");
    } else {
      console.warn("⚠️ No signature provided - proceeding without verification (development mode)");
    }

    // Parse payload
    let payload: DodoWebhookPayload;
    try {
      payload = JSON.parse(rawBody) as DodoWebhookPayload;
    } catch (parseError) {
      console.error("Failed to parse webhook payload:", parseError);
      throw new Error("Invalid JSON payload");
    }

    console.log("Webhook payload received:", { 
      event_type: payload.event_type, 
      payment_id: payload.data?.id,
      status: payload.data?.status,
      amount: payload.data?.amount,
      user_id: payload.data?.metadata?.user_id
    });

    // Initialize Supabase client
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // Process webhook based on event type
    switch (payload.event_type) {
      case "payment.succeeded":
      case "payment.completed":
        await handlePaymentSuccess(supabaseAdmin, payload);
        break;
        
      case "payment.failed":
        await handlePaymentFailure(supabaseAdmin, payload);
        break;
        
      case "payment.cancelled":
      case "payment.canceled": // Handle both spellings
        await handlePaymentCancellation(supabaseAdmin, payload);
        break;
        
      case "payment.pending":
        await handlePaymentPending(supabaseAdmin, payload);
        break;
        
      default:
        console.log(`Unhandled webhook event type: ${payload.event_type}`);
    }

    console.log("=== WEBHOOK PROCESSED SUCCESSFULLY ===");
    return new Response(JSON.stringify({ 
      received: true, 
      processed: true,
      event_type: payload.event_type,
      payment_id: payload.data?.id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("=== WEBHOOK PROCESSING ERROR ===", error);
    return new Response(JSON.stringify({ 
      error: "Webhook processing failed",
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// Enhanced payment success handler
async function handlePaymentSuccess(supabaseAdmin: any, payload: DodoWebhookPayload) {
  const { id: paymentId, status, metadata } = payload.data;
  
  if (!metadata?.user_id) {
    throw new Error("Missing user_id in payment metadata");
  }

  console.log(`Processing successful payment ${paymentId} for user ${metadata.user_id}`);

  // Find the payment record with multiple fallback strategies
  const { data: payment, error: paymentError } = await supabaseAdmin
    .from("payments")
    .select("*")
    .or(`payment_provider_id.eq.${paymentId},stripe_session_id.eq.${paymentId}`)
    .eq("user_id", metadata.user_id)
    .in("status", ["pending", "processing"])
    .single();

  if (paymentError || !payment) {
    console.error("Payment not found or already processed:", paymentError);
    
    // Try to find any payment for this user with this amount (fallback)
    const { data: fallbackPayment } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("user_id", metadata.user_id)
      .eq("amount", payload.data.amount)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    
    if (fallbackPayment) {
      console.log("Found payment via fallback strategy");
      // Update the payment record with the correct provider ID
      await supabaseAdmin
        .from("payments")
        .update({ payment_provider_id: paymentId })
        .eq("id", fallbackPayment.id);
    } else {
      throw new Error("Payment not found or already processed");
    }
  }

  const targetPayment = payment || fallbackPayment;
  console.log("Payment record located:", { 
    id: targetPayment.id, 
    user_id: targetPayment.user_id, 
    status: targetPayment.status,
    credits: targetPayment.credits_purchased
  });

  // Process the successful payment with retry logic
  const processWithRetry = async (retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const { data: success, error: processError } = await supabaseAdmin.rpc("process_successful_payment", {
          payment_id: targetPayment.id,
          provider_transaction_id: paymentId
        });

        if (processError) {
          throw processError;
        }

        console.log("✓ Payment processed successfully");
        return true;
      } catch (error) {
        console.error(`Payment processing attempt ${attempt} failed:`, error);
        
        if (attempt === retries) {
          throw error;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  };

  await processWithRetry();

  // Send payment notification email (non-blocking)
  try {
    await supabaseAdmin.functions.invoke('payment-notification', {
      body: {
        userId: metadata.user_id,
        paymentId: targetPayment.id,
        credits: parseInt(metadata.credits),
        amount: payload.data.amount
      }
    });
    console.log("✓ Payment notification email sent");
  } catch (emailError) {
    console.error("⚠️ Failed to send payment notification:", emailError);
    // Don't fail the webhook for email issues
  }

  // Log security event
  await supabaseAdmin
    .from("security_events")
    .insert({
      user_id: metadata.user_id,
      event_type: "webhook_processed",
      metadata: {
        webhook_type: "dodo_payment_success",
        payment_id: paymentId,
        amount: payload.data.amount,
        credits: metadata.credits,
        payment_method: payload.data.payment_method || "dodo_payments"
      }
    });

  console.log("✓ Payment success fully processed");
}

// Enhanced payment failure handler
async function handlePaymentFailure(supabaseAdmin: any, payload: DodoWebhookPayload) {
  const { id: paymentId } = payload.data;
  
  console.log(`Processing failed payment ${paymentId}`);

  const { error: updateError } = await supabaseAdmin
    .from("payments")
    .update({ 
      status: "failed",
      updated_at: new Date().toISOString(),
      payment_data: {
        ...payload.data,
        failure_reason: payload.data.status || "payment_failed",
        webhook_processed_at: new Date().toISOString()
      }
    })
    .or(`payment_provider_id.eq.${paymentId},stripe_session_id.eq.${paymentId}`);

  if (updateError) {
    console.error("Failed to update payment status:", updateError);
    throw updateError;
  } else {
    console.log("✓ Failed payment recorded");
  }
}

// Enhanced payment cancellation handler
async function handlePaymentCancellation(supabaseAdmin: any, payload: DodoWebhookPayload) {
  const { id: paymentId } = payload.data;
  
  console.log(`Processing cancelled payment ${paymentId}`);

  const { error: updateError } = await supabaseAdmin
    .from("payments")
    .update({ 
      status: "cancelled",
      updated_at: new Date().toISOString(),
      payment_data: {
        ...payload.data,
        cancellation_reason: "user_cancelled",
        webhook_processed_at: new Date().toISOString()
      }
    })
    .or(`payment_provider_id.eq.${paymentId},stripe_session_id.eq.${paymentId}`);

  if (updateError) {
    console.error("Failed to update payment status:", updateError);
    throw updateError;
  } else {
    console.log("✓ Cancelled payment recorded");
  }
}

// Payment pending handler
async function handlePaymentPending(supabaseAdmin: any, payload: DodoWebhookPayload) {
  const { id: paymentId } = payload.data;
  
  console.log(`Processing pending payment ${paymentId}`);

  const { error: updateError } = await supabaseAdmin
    .from("payments")
    .update({ 
      status: "processing",
      updated_at: new Date().toISOString(),
      payment_data: {
        ...payload.data,
        webhook_processed_at: new Date().toISOString()
      }
    })
    .or(`payment_provider_id.eq.${paymentId},stripe_session_id.eq.${paymentId}`);

  if (updateError) {
    console.error("Failed to update payment status:", updateError);
    throw updateError;
  } else {
    console.log("✓ Pending payment status updated");
  }
}