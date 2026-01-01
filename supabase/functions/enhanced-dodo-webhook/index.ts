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
  console.log(`🔄 Processing payment success: ${payload.payment_id}`);
  
  try {
    // SECURITY: Only allow EXACT match by provider ID - NO fuzzy matching
    // Fuzzy matching is a critical security vulnerability
    const { data: payment, error: lookupError } = await supabase
      .from("payments")
      .select("*")
      .eq("payment_provider_id", payload.payment_id)
      .single();
    
    if (lookupError || !payment) {
      // SECURITY: Do NOT attempt fuzzy matching - this can be exploited
      console.error(`❌ Payment not found for provider ID: ${payload.payment_id}`);
      console.error("⚠️ SECURITY: Refusing fuzzy match - payment must have exact provider_id");
      
      // Log this as a potential security event
      await supabase.from("security_events").insert({
        event_type: "payment_lookup_failed",
        metadata: {
          payment_id: payload.payment_id,
          customer_email: payload.customer?.email,
          amount: payload.amount,
          timestamp: new Date().toISOString(),
          reason: "No exact match found - fuzzy matching disabled for security"
        }
      }).catch(() => {});
      
      throw new Error(`Payment not found for provider ID: ${payload.payment_id}. Ensure payment_provider_id is set when creating payment.`);
    }
    
    // SECURITY: Verify payment is in valid state for completion
    if (payment.status === 'completed') {
      console.log(`✅ Payment ${payment.id} already completed - idempotent response`);
      return { 
        success: true, 
        message: "Payment already processed (idempotent)",
        paymentId: payment.id
      };
    }
    
    if (payment.status !== 'pending' && payment.status !== 'processing') {
      console.error(`❌ Invalid payment state: ${payment.status}`);
      throw new Error(`Cannot complete payment in state: ${payment.status}`);
    }
    
    // SECURITY: Validate customer email matches (additional verification)
    if (payload.customer?.email) {
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", payment.user_id)
        .single();
      
      if (userProfile && userProfile.email !== payload.customer.email) {
        console.error(`❌ SECURITY: Email mismatch! Payment user: ${userProfile.email}, Webhook: ${payload.customer.email}`);
        
        await supabase.from("security_events").insert({
          user_id: payment.user_id,
          event_type: "payment_email_mismatch",
          metadata: {
            payment_id: payload.payment_id,
            expected_email: userProfile.email,
            webhook_email: payload.customer.email,
            amount: payload.amount
          }
        }).catch(() => {});
        
        throw new Error("Customer email mismatch - potential fraud attempt");
      }
    }
    
    console.log(`🔄 Processing payment ${payment.id} for user ${payment.user_id}`);
    
    // Get current credits before processing (for logging only)
    const { data: profileBefore } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", payment.user_id)
      .single();
    
    const creditsBefore = profileBefore?.credits || 0;
    console.log(`💰 User credits before payment: ${creditsBefore}`);
    
    // SECURITY: Process payment ONLY through the secure RPC function
    // This function has proper authorization checks and atomic updates
    const { data: success, error: processError } = await supabase.rpc(
      "process_successful_payment",
      {
        payment_id: payment.id,
        provider_transaction_id: payload.payment_id
      }
    );
    
    if (processError) {
      console.error("❌ Payment processing failed:", processError);
      
      // SECURITY: Do NOT use direct fallback - this bypasses authorization
      // Log the error and fail gracefully - webhook will be retried
      await supabase.from("security_events").insert({
        user_id: payment.user_id,
        event_type: "payment_processing_error",
        metadata: {
          payment_id: payload.payment_id,
          error: processError.message,
          timestamp: new Date().toISOString()
        }
      }).catch(() => {});
      
      throw new Error(`Payment processing failed: ${processError.message}`);
    }
    
    if (!success) {
      console.error("❌ process_successful_payment returned false");
      throw new Error("Payment processing returned unsuccessful");
    }
    
    console.log(`🎉 Payment processed successfully: ${payment.id}`);
    
    // Verify credits were actually added (for logging only - no forced updates)
    const { data: updatedProfile } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", payment.user_id)
      .single();
    
    const creditsAfter = updatedProfile?.credits || 0;
    console.log(`💰 User credits after payment: ${creditsAfter} (was: ${creditsBefore})`);
    
    // SECURITY: Log if credits weren't added but DO NOT force update
    // If the RPC succeeded but credits weren't added, there's a database issue
    if (creditsAfter <= creditsBefore) {
      console.error("⚠️ ALERT: Credits may not have been added - investigate RPC function");
      
      await supabase.from("security_events").insert({
        user_id: payment.user_id,
        event_type: "credit_mismatch_after_payment",
        metadata: {
          payment_id: payload.payment_id,
          credits_before: creditsBefore,
          credits_after: creditsAfter,
          expected_credits: payment.credits_purchased,
          timestamp: new Date().toISOString()
        }
      }).catch(() => {});
      
      // DO NOT force update - this could be exploited
      // Instead, alert and let manual review handle it
    }
    
    // Send success email notification
    await sendPaymentEmail(supabase, payment.user_id, "success", {
      paymentId: payload.payment_id,
      amount: payment.amount,
      credits: payment.credits_purchased,
      customerEmail: payload.customer?.email,
      creditsBefore,
      creditsAfter
    });

    return { 
      success: true, 
      message: "Payment processed successfully",
      creditsAdded: payment.credits_purchased,
      creditsBefore,
      creditsAfter,
      paymentId: payment.id
    };
    
  } catch (error) {
    console.error("Payment success handling error:", error);
    throw error;
  }
}

async function handlePaymentFailure(supabase: any, payload: DodoWebhookPayload) {
  console.log("❌ Processing failed payment:", payload.payment_id);
  
  try {
    // First try to find payment by provider ID
    const { data: payment, error: findError } = await supabase
      .from("payments")
      .select("*")
      .eq("payment_provider_id", payload.payment_id)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      console.error("Error finding payment:", findError);
    }

    // Update payment status in payments table
    const { error: updateError } = await supabase
      .from("payments")
      .update({
        status: "failed",
        metadata: {
          ...payment?.metadata || {},
          webhook_received_at: new Date().toISOString(),
          failure_reason: payload.status,
          dodo_payment_id: payload.payment_id
        }
      })
      .eq("payment_provider_id", payload.payment_id);

    if (updateError) {
      console.error("Error updating payment:", updateError);
      // Don't throw, continue with fallback
    }

    // Try to log transaction (optional, won't fail if table doesn't exist)
    try {
      const { error: transactionError } = await supabase
        .from("payment_transactions")
        .insert({
          payment_id: payment?.id,
          payment_provider_id: payload.payment_id,
          transaction_type: "webhook",
          amount: payload.amount || 0,
          currency: payload.currency || "USD",
          status: "failed",
          provider_response: payload,
          metadata: {
            webhook_received_at: new Date().toISOString(),
            failure_reason: payload.status
          }
        });

      if (transactionError) {
        console.log("Note: Could not log to payment_transactions (table may not exist):", transactionError.message);
      }
    } catch (transactionLogError) {
      console.log("Note: payment_transactions table not available, skipping transaction log");
    }

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
    // Update payment status in payments table
    const { error: updateError } = await supabase
      .from("payments")
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

    if (updateError) {
      console.error("Error updating payment for dispute:", updateError);
    }

    // Try to log transaction (optional)
    try {
      const { error: transactionError } = await supabase
        .from("payment_transactions")
        .insert({
          payment_provider_id: payload.payment_id,
          transaction_type: "webhook",
          amount: payload.amount || 0,
          currency: payload.currency || "USD",
          status: "disputed",
          provider_response: payload,
          metadata: {
            webhook_received_at: new Date().toISOString(),
            dispute_reason: payload.dispute?.reason,
            dispute_amount: payload.dispute?.amount
          }
        });

      if (transactionError) {
        console.log("Note: Could not log to payment_transactions:", transactionError.message);
      }
    } catch (transactionLogError) {
      console.log("Note: payment_transactions table not available, skipping transaction log");
    }

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
    // Update payment status in payments table
    const { error: updateError } = await supabase
      .from("payments")
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

    if (updateError) {
      console.error("Error updating payment for refund:", updateError);
    }

    // Try to log transaction (optional)
    try {
      const { error: transactionError } = await supabase
        .from("payment_transactions")
        .insert({
          payment_provider_id: payload.payment_id,
          transaction_type: "refund",
          amount: -(payload.refund?.amount || payload.amount || 0),
          currency: payload.currency || "USD",
          status: "refunded",
          provider_response: payload,
          metadata: {
            webhook_received_at: new Date().toISOString(),
            refund_amount: payload.refund?.amount,
            refund_reason: payload.refund?.reason
          }
        });

      if (transactionError) {
        console.log("Note: Could not log to payment_transactions:", transactionError.message);
      }
    } catch (transactionLogError) {
      console.log("Note: payment_transactions table not available, skipping transaction log");
    }

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
    // Update payment status in payments table
    const { error: updateError } = await supabase
      .from("payments")
      .update({
        status: "cancelled", // Use cancelled instead of expired for payments table
        metadata: {
          ...payload.metadata,
          webhook_received_at: new Date().toISOString(),
          expiry_reason: "Payment session expired"
        }
      })
      .eq("payment_provider_id", payload.payment_id);

    if (updateError) {
      console.error("Error updating payment for expiry:", updateError);
    }

    // Try to log transaction (optional)
    try {
      const { error: transactionError } = await supabase
        .from("payment_transactions")
        .insert({
          payment_provider_id: payload.payment_id,
          transaction_type: "webhook",
          amount: 0,
          currency: payload.currency || "USD",
          status: "expired",
          provider_response: payload,
          metadata: {
            webhook_received_at: new Date().toISOString(),
            expiry_reason: "Payment session expired"
          }
        });

      if (transactionError) {
        console.log("Note: Could not log to payment_transactions:", transactionError.message);
      }
    } catch (transactionLogError) {
      console.log("Note: payment_transactions table not available, skipping transaction log");
    }

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
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single();

  if (profileError) {
    console.error("❌ Profile fetch error:", profileError);
    throw profileError;
  }

  const currentCredits = profile?.credits || 0;
  const newCredits = currentCredits + credits;

  // Update user credits with transaction
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ 
      credits: newCredits,
      updated_at: new Date().toISOString()
    })
    .eq("id", userId);

  if (updateError) {
    console.error("❌ Credits update error:", updateError);
    throw updateError;
  }

  // Record in credits ledger (if table exists)
  try {
    const { error: ledgerError } = await supabase
      .from("credits_ledger")
      .insert({
        user_id: userId,
        transaction_type: "purchase",
        credits_amount: credits,
        balance_after: newCredits,
        related_payment_id: paymentId,
        description: `Credits purchased via payment ${paymentId}`
      });

    if (ledgerError && !ledgerError.message.includes('relation "credits_ledger" does not exist')) {
      console.error("⚠️ Ledger error (non-critical):", ledgerError);
    }
  } catch (error) {
    console.error("⚠️ Ledger insert failed (non-critical):", error);
  }
  
  console.log(`✅ Credits updated: ${currentCredits} → ${newCredits}`);
}

async function removeCreditsFromUser(supabase: any, userId: string, credits: number, paymentId: string) {
  console.log(`🔄 Removing ${credits} credits from user ${userId}`);
  
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single();

  if (profileError) throw profileError;

  const currentCredits = profile?.credits || 0;
  const newCredits = Math.max(0, currentCredits - credits);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ 
      credits: newCredits,
      updated_at: new Date().toISOString()
    })
    .eq("id", userId);

  if (updateError) throw updateError;

  // Record in credits ledger (if table exists)
  try {
    const { error: ledgerError } = await supabase
      .from("credits_ledger")
      .insert({
        user_id: userId,
        transaction_type: "refund",
        credits_amount: -credits,
        balance_after: newCredits,
        related_payment_id: paymentId,
        description: `Credit refund - Payment ${paymentId}`
      });

    if (ledgerError && !ledgerError.message.includes('relation "credits_ledger" does not exist')) {
      console.error("⚠️ Ledger error (non-critical):", ledgerError);
    }
  } catch (error) {
    console.error("⚠️ Ledger insert failed (non-critical):", error);
  }
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
