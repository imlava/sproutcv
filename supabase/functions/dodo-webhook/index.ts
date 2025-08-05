import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, webhook-id, webhook-signature, webhook-timestamp",
};

interface WebhookPayload {
  event_type: string;
  data: {
    payment_id: string;
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
    };
    created_at: string;
    updated_at: string;
  };
}

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
    const webhookHeaders = {
      "webhook-id": req.headers.get("webhook-id") || "",
      "webhook-signature": req.headers.get("webhook-signature") || "",
      "webhook-timestamp": req.headers.get("webhook-timestamp") || "",
    };

    console.log("Webhook headers:", webhookHeaders);

    // Verify the webhook
    const webhook = new Webhook(webhookSecret);
    try {
      await webhook.verify(rawBody, webhookHeaders);
      console.log("Webhook verification successful");
    } catch (error) {
      console.error("Webhook verification failed:", error);
      throw new Error("Webhook verification failed");
    }

    const payload = JSON.parse(rawBody) as WebhookPayload;
    console.log("Webhook payload:", payload);

    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (payload.event_type === "payment.succeeded") {
      const { payment_id, status, metadata } = payload.data;
      
      if (status === "completed" && metadata?.user_id) {
        console.log(`Processing successful payment ${payment_id} for user ${metadata.user_id}`);

        // Find the payment record
        const { data: payment, error: paymentError } = await supabaseAdmin
          .from("payments")
          .select("*")
          .eq("payment_provider_id", payment_id)
          .eq("status", "pending")
          .single();

        if (paymentError || !payment) {
          console.error("Payment not found or already processed:", paymentError);
          throw new Error("Payment not found or already processed");
        }

        console.log("Found payment record:", payment);

        // Process the successful payment
        const success = await supabaseAdmin.rpc("process_successful_payment", {
          payment_id: payment.id,
          provider_transaction_id: payment_id
        });

        if (success.error) {
          console.error("Failed to process payment:", success.error);
          throw new Error("Failed to process payment");
        }

        console.log("Payment processed successfully");

        // Check if this is a referral bonus eligible payment
        if (parseInt(metadata.credits) >= 5) { // Only for paid plans (5+ credits)
          const referralSuccess = await supabaseAdmin.rpc("process_referral_credit", {
            referred_user_id: metadata.user_id,
            payment_amount: payload.data.amount
          });

          if (referralSuccess.data) {
            console.log("Referral credits processed successfully");
          }
        }

        // Log webhook processing
        await supabaseAdmin
          .from("security_events")
          .insert({
            user_id: metadata.user_id,
            event_type: "webhook_processed",
            metadata: {
              webhook_type: "dodo_payment_success",
              payment_id: payment_id,
              amount: payload.data.amount,
              credits: metadata.credits
            }
          });

        console.log("Webhook processed successfully");
      }
    } else if (payload.event_type === "payment.failed") {
      const { payment_id } = payload.data;
      
      console.log(`Processing failed payment ${payment_id}`);

      // Update payment status to failed
      await supabaseAdmin
        .from("payments")
        .update({ 
          status: "failed",
          updated_at: new Date().toISOString()
        })
        .eq("payment_provider_id", payment_id);

      console.log("Failed payment recorded");
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