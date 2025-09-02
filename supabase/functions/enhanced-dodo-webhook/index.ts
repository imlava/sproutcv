import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-dodo-signature",
};

interface DodoWebhookPayload {
  event_type: string;
  payment_id: string;
  customer: {
    customer_id: string;
    email: string;
    name: string;
  };
  amount: number;
  currency: string;
  status: string;
  metadata: Record<string, string>;
  created_at: string;
  dispute?: {
    reason: string;
    amount: number;
    created_at: string;
  };
  refund?: {
    amount: number;
    reason: string;
    created_at: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== ENHANCED DODO WEBHOOK START ===");
    
    // STEP 1: Verify webhook signature
    const signature = req.headers.get("x-dodo-signature");
    const webhookSecret = Deno.env.get("DODO_WEBHOOK_SECRET");
    
    if (!signature || !webhookSecret) {
      console.error("✗ Missing signature or webhook secret");
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.text();
    
    // Verify signature (implement based on Dodo's signature method)
    const isValidSignature = await verifyDodoSignature(body, signature, webhookSecret);
    if (!isValidSignature) {
      console.error("✗ Invalid webhook signature");
      return new Response("Invalid signature", { status: 401 });
    }

    // STEP 2: Parse webhook payload
    let payload: DodoWebhookPayload;
    try {
      payload = JSON.parse(body);
      console.log("✓ Webhook payload parsed:", payload.event_type, payload.payment_id);
    } catch (error) {
      console.error("✗ Invalid JSON payload:", error);
      return new Response("Invalid JSON", { status: 400 });
    }

    // STEP 3: Initialize Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !serviceKey) {
      console.error("✗ Missing Supabase configuration");
      return new Response("Server configuration error", { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // STEP 4: Process webhook event
    let result;
    switch (payload.event_type) {
      case "payment.succeeded":
      case "payment.completed":
        result = await handlePaymentSuccess(supabase, payload);
        break;
      
      case "payment.failed":
        result = await handlePaymentFailure(supabase, payload);
        break;
      
      case "payment.disputed":
        result = await handlePaymentDispute(supabase, payload);
        break;
      
      case "payment.refunded":
        result = await handlePaymentRefund(supabase, payload);
        break;
      
      case "payment.expired":
        result = await handlePaymentExpired(supabase, payload);
        break;
      
      default:
        console.log(`⚠️ Unhandled event type: ${payload.event_type}`);
        result = { success: true, message: "Event logged but not processed" };
    }

    // STEP 5: Log webhook event
    await logWebhookEvent(supabase, payload, result);

    console.log("=== WEBHOOK PROCESSING COMPLETE ===");
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("=== WEBHOOK ERROR ===", error);
    return new Response(JSON.stringify({
      error: "Webhook processing failed",
      message: error.message
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function verifyDodoSignature(body: string, signature: string, secret: string): Promise<boolean> {
  try {
    // Implement Dodo's signature verification
    // This is a placeholder - implement according to Dodo's documentation
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signatureBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const expectedSignature = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
    
    return signature.includes(expectedSignature);
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

async function handlePaymentSuccess(supabase: any, payload: DodoWebhookPayload) {
  console.log("🎉 Processing successful payment:", payload.payment_id);
  
  try {
    // Update payment status
    const { error: updateError } = await supabase
      .from("payment_transactions")
      .update({
        status: "completed",
        metadata: {
          ...payload.metadata,
          webhook_received_at: new Date().toISOString(),
          dodo_customer_id: payload.customer.customer_id
        }
      })
      .eq("payment_provider_id", payload.payment_id);

    if (updateError) {
      console.error("✗ Failed to update payment:", updateError);
      throw updateError;
    }

    // Get user ID from metadata or payment record
    const userId = payload.metadata.user_id;
    const credits = parseInt(payload.metadata.credits || "0");
    
    if (userId && credits > 0) {
      // Add credits to user account
      await addCreditsToUser(supabase, userId, credits, payload.payment_id);
      
      // Send success email
      await sendPaymentEmail(supabase, userId, "success", {
        paymentId: payload.payment_id,
        amount: payload.amount,
        credits: credits,
        customerEmail: payload.customer.email
      });
    }

    return { 
      success: true, 
      message: "Payment processed successfully",
      creditsAdded: credits 
    };
    
  } catch (error) {
    console.error("Payment success handling error:", error);
    throw error;
  }
}

async function handlePaymentFailure(supabase: any, payload: DodoWebhookPayload) {
  console.log("❌ Processing failed payment:", payload.payment_id);
  
  try {
    // Update payment status
    const { error: updateError } = await supabase
      .from("payment_transactions")
      .update({
        status: "failed",
        metadata: {
          ...payload.metadata,
          webhook_received_at: new Date().toISOString(),
          failure_reason: payload.status
        }
      })
      .eq("payment_provider_id", payload.payment_id);

    if (updateError) throw updateError;

    // Send failure email
    const userId = payload.metadata.user_id;
    if (userId) {
      await sendPaymentEmail(supabase, userId, "failed", {
        paymentId: payload.payment_id,
        amount: payload.amount,
        customerEmail: payload.customer.email,
        reason: payload.status
      });
    }

    return { 
      success: true, 
      message: "Payment failure processed",
    };
    
  } catch (error) {
    console.error("Payment failure handling error:", error);
    throw error;
  }
}

async function handlePaymentDispute(supabase: any, payload: DodoWebhookPayload) {
  console.log("⚠️ Processing payment dispute:", payload.payment_id);
  
  try {
    // Update payment status
    const { error: updateError } = await supabase
      .from("payment_transactions")
      .update({
        status: "disputed",
        metadata: {
          ...payload.metadata,
          webhook_received_at: new Date().toISOString(),
          dispute_reason: payload.dispute?.reason,
          dispute_amount: payload.dispute?.amount
        }
      })
      .eq("payment_provider_id", payload.payment_id);

    if (updateError) throw updateError;

    // Freeze credits if they were already added
    const userId = payload.metadata.user_id;
    const credits = parseInt(payload.metadata.credits || "0");
    
    if (userId && credits > 0) {
      await freezeUserCredits(supabase, userId, credits, payload.payment_id);
      
      // Send dispute email
      await sendPaymentEmail(supabase, userId, "disputed", {
        paymentId: payload.payment_id,
        amount: payload.amount,
        customerEmail: payload.customer.email,
        disputeReason: payload.dispute?.reason
      });
    }

    return { 
      success: true, 
      message: "Payment dispute processed",
      creditsFrozen: credits 
    };
    
  } catch (error) {
    console.error("Payment dispute handling error:", error);
    throw error;
  }
}

async function handlePaymentRefund(supabase: any, payload: DodoWebhookPayload) {
  console.log("🔄 Processing payment refund:", payload.payment_id);
  
  try {
    // Update payment status
    const { error: updateError } = await supabase
      .from("payment_transactions")
      .update({
        status: "refunded",
        metadata: {
          ...payload.metadata,
          webhook_received_at: new Date().toISOString(),
          refund_amount: payload.refund?.amount,
          refund_reason: payload.refund?.reason
        }
      })
      .eq("payment_provider_id", payload.payment_id);

    if (updateError) throw updateError;

    // Remove credits from user account
    const userId = payload.metadata.user_id;
    const credits = parseInt(payload.metadata.credits || "0");
    
    if (userId && credits > 0) {
      await removeCreditsFromUser(supabase, userId, credits, payload.payment_id);
      
      // Send refund email
      await sendPaymentEmail(supabase, userId, "refunded", {
        paymentId: payload.payment_id,
        amount: payload.refund?.amount || payload.amount,
        customerEmail: payload.customer.email,
        refundReason: payload.refund?.reason
      });
    }

    return { 
      success: true, 
      message: "Payment refund processed",
      creditsRemoved: credits 
    };
    
  } catch (error) {
    console.error("Payment refund handling error:", error);
    throw error;
  }
}

async function handlePaymentExpired(supabase: any, payload: DodoWebhookPayload) {
  console.log("⏰ Processing expired payment:", payload.payment_id);
  
  try {
    const { error: updateError } = await supabase
      .from("payment_transactions")
      .update({
        status: "expired",
        metadata: {
          ...payload.metadata,
          webhook_received_at: new Date().toISOString()
        }
      })
      .eq("payment_provider_id", payload.payment_id);

    if (updateError) throw updateError;

    return { success: true, message: "Payment expiration processed" };
    
  } catch (error) {
    console.error("Payment expiration handling error:", error);
    throw error;
  }
}

async function addCreditsToUser(supabase: any, userId: string, credits: number, paymentId: string) {
  console.log(`💰 Adding ${credits} credits to user ${userId}`);
  
  // Get current credits
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("credits")
    .eq("id", userId)
    .single();

  if (profileError) throw profileError;

  const currentCredits = profile?.credits || 0;
  const newCredits = currentCredits + credits;

  // Update user credits
  const { error: updateError } = await supabase
    .from("user_profiles")
    .update({ credits: newCredits })
    .eq("id", userId);

  if (updateError) throw updateError;

  // Record in credits ledger
  const { error: ledgerError } = await supabase
    .from("credits_ledger")
    .insert({
      user_id: userId,
      credits_before: currentCredits,
      credits_after: newCredits,
      credits_changed: credits,
      transaction_type: "purchase",
      description: `Credit purchase - Payment ${paymentId}`,
      related_payment_id: paymentId
    });

  if (ledgerError) throw ledgerError;
  
  console.log(`✅ Credits updated: ${currentCredits} → ${newCredits}`);
}

async function removeCreditsFromUser(supabase: any, userId: string, credits: number, paymentId: string) {
  console.log(`🔄 Removing ${credits} credits from user ${userId}`);
  
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("credits")
    .eq("id", userId)
    .single();

  if (profileError) throw profileError;

  const currentCredits = profile?.credits || 0;
  const newCredits = Math.max(0, currentCredits - credits);

  const { error: updateError } = await supabase
    .from("user_profiles")
    .update({ credits: newCredits })
    .eq("id", userId);

  if (updateError) throw updateError;

  // Record in credits ledger
  const { error: ledgerError } = await supabase
    .from("credits_ledger")
    .insert({
      user_id: userId,
      credits_before: currentCredits,
      credits_after: newCredits,
      credits_changed: -credits,
      transaction_type: "refund",
      description: `Credit refund - Payment ${paymentId}`,
      related_payment_id: paymentId
    });

  if (ledgerError) throw ledgerError;
}

async function freezeUserCredits(supabase: any, userId: string, credits: number, paymentId: string) {
  // Mark credits as frozen due to dispute
  const { error } = await supabase
    .from("credits_ledger")
    .insert({
      user_id: userId,
      credits_before: 0,
      credits_after: 0,
      credits_changed: 0,
      transaction_type: "freeze",
      description: `Credits frozen due to payment dispute - Payment ${paymentId}`,
      related_payment_id: paymentId
    });

  if (error) throw error;
}

async function sendPaymentEmail(supabase: any, userId: string, type: string, data: any) {
  try {
    const { error } = await supabase.functions.invoke("send-payment-notification", {
      body: { userId, type, data }
    });
    
    if (error) throw error;
    console.log(`✅ ${type} email sent to user ${userId}`);
  } catch (error) {
    console.error(`Email sending error for ${type}:`, error);
  }
}

async function logWebhookEvent(supabase: any, payload: DodoWebhookPayload, result: any) {
  try {
    const { error } = await supabase
      .from("webhook_logs")
      .insert({
        provider: "dodo_payments",
        event_type: payload.event_type,
        payment_id: payload.payment_id,
        status: result.success ? "processed" : "failed",
        payload: payload,
        result: result,
        processed_at: new Date().toISOString()
      });

    if (error) {
      console.error("Webhook logging error:", error);
    }
  } catch (error) {
    console.error("Webhook logging exception:", error);
  }
}
