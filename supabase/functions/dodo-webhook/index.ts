import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, webhook-id, webhook-signature, webhook-timestamp",
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
    created_at: string;
    updated_at: string;
  };
}

// Verify webhook signature (async)
const verifyWebhookSignature = async (payload: string, signature: string, secret: string): Promise<boolean> => {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sigBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    const expected = Array.from(new Uint8Array(sigBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
    return expected === signature;
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
    console.log("Dodo webhook received");

    const webhookSecret = Deno.env.get("DODO_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("Webhook secret not configured");
      throw new Error("Webhook secret not configured");
    }

    // Get the raw body and headers
    const rawBody = await req.text();
    const signature = req.headers.get("x-dodo-signature");
    const timestamp = req.headers.get("x-dodo-timestamp");

    console.log("Webhook headers:", {
      signature: signature ? "present" : "missing",
      timestamp: timestamp ? "present" : "missing"
    });

    // Verify the webhook signature
    if (!signature) {
      throw new Error("Missing webhook signature");
    }

    const isValidSignature = await verifyWebhookSignature(rawBody, signature, webhookSecret);
    if (!isValidSignature) {
      console.error("Invalid webhook signature");
      throw new Error("Invalid webhook signature");
    }

    console.log("Webhook signature verified successfully");

    const payload = JSON.parse(rawBody) as DodoWebhookPayload;
    console.log("Webhook payload:", payload);

    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (payload.event_type === "payment.succeeded") {
      const { id: paymentId, status, metadata } = payload.data;
      
      if (status === "completed" && metadata?.user_id) {
        console.log(`Processing successful payment ${paymentId} for user ${metadata.user_id}`);

        // Find the payment record
        const { data: payment, error: paymentError } = await supabaseAdmin
          .from("payments")
          .select("*")
          .eq("payment_provider_id", paymentId)
          .eq("status", "pending")
          .single();

        if (paymentError || !payment) {
          console.error("Payment not found or already processed:", paymentError);
          throw new Error("Payment not found or already processed");
        }

        console.log("Found payment record:", payment);

        // Process the successful payment
        // Retry with backoff on transient errors
        const executeWithRetry = async (fn: () => Promise<any>, retries = 3) => {
          let attempt = 0;
          while (attempt < retries) {
            try { return await fn(); } catch (err) {
              attempt++;
              if (attempt >= retries) throw err;
              const delay = Math.pow(2, attempt) * 200; // 200ms, 400ms, 800ms
              await new Promise(r => setTimeout(r, delay));
            }
          }
        };

        const { data: success, error: processError } = await executeWithRetry(() => supabaseAdmin.rpc("process_successful_payment", {
          payment_id: payment.id,
          provider_transaction_id: paymentId
        }));

        if (processError) {
          console.error("Failed to process payment:", processError);
          throw new Error("Failed to process payment");
        }

        console.log("Payment processed successfully");

        // Send payment notification email
        try {
          await supabaseAdmin.functions.invoke('payment-notification', {
            body: {
              userId: metadata.user_id,
              paymentId: payment.id,
              credits: parseInt(metadata.credits),
              amount: payload.data.amount
            }
          });
          console.log("Payment notification email sent");
        } catch (emailError) {
          console.error("Failed to send payment notification:", emailError);
          // Don't throw error here as payment was processed successfully
        }

        // Log webhook processing
        await supabaseAdmin
          .from("security_events")
          .insert({
            user_id: metadata.user_id,
            event_type: "webhook_processed",
            metadata: {
              webhook_type: "dodo_payment_success",
              payment_id: paymentId,
              amount: payload.data.amount,
              credits: metadata.credits
            }
          });

        console.log("Webhook processed successfully");
      }
    } else if (payload.event_type === "payment.failed") {
      const { id: paymentId } = payload.data;
      
      console.log(`Processing failed payment ${paymentId}`);

      // Update payment status to failed
      const { error: updateError } = await supabaseAdmin
        .from("payments")
        .update({ 
          status: "failed",
          updated_at: new Date().toISOString()
        })
        .eq("payment_provider_id", paymentId);

      if (updateError) {
        console.error("Failed to update payment status:", updateError);
      } else {
        console.log("Failed payment recorded");
      }
    } else if (payload.event_type === "payment.cancelled") {
      const { id: paymentId } = payload.data;
      
      console.log(`Processing cancelled payment ${paymentId}`);

      // Update payment status to cancelled
      const { error: updateError } = await supabaseAdmin
        .from("payments")
        .update({ 
          status: "cancelled",
          updated_at: new Date().toISOString()
        })
        .eq("payment_provider_id", paymentId);

      if (updateError) {
        console.error("Failed to update payment status:", updateError);
      } else {
        console.log("Cancelled payment recorded");
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});