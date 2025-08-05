
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
    const { paymentId, status, amount, credits } = await req.json();

    if (!paymentId || !status) {
      throw new Error("Payment ID and status are required");
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

    console.log(`Verifying payment ${paymentId} with status ${status} for user ${user.id}`);

    // Find the payment record
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("payment_provider_id", paymentId)
      .eq("user_id", user.id)
      .single();

    if (paymentError || !payment) {
      console.error("Payment not found:", paymentError);
      return new Response(JSON.stringify({ 
        status: 'failed',
        message: 'Payment not found or access denied'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    console.log("Found payment record:", payment);

    // Handle different status types
    if (status === 'success' || status === 'completed') {
      // Check if payment is already processed
      if (payment.status === 'completed') {
        return new Response(JSON.stringify({ 
          status: 'success',
          paymentId,
          amount: payment.amount,
          credits: payment.credits_purchased,
          message: 'Payment already completed'
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Process the payment if it's still pending
      if (payment.status === 'pending') {
        try {
          const { data: success, error: processError } = await supabaseAdmin.rpc("process_successful_payment", {
            payment_id: payment.id,
            provider_transaction_id: paymentId
          });

          if (processError) {
            console.error("Failed to process payment:", processError);
            throw new Error("Failed to process payment");
          }

          console.log("Payment processed successfully");

          // Send payment notification email
          try {
            await supabaseAdmin.functions.invoke('payment-notification', {
              body: {
                userId: user.id,
                paymentId: payment.id,
                credits: payment.credits_purchased,
                amount: payment.amount
              }
            });
            console.log("Payment notification email sent");
          } catch (emailError) {
            console.error("Failed to send payment notification:", emailError);
          }

          return new Response(JSON.stringify({ 
            status: 'success',
            paymentId,
            amount: payment.amount,
            credits: payment.credits_purchased,
            message: 'Payment processed successfully'
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        } catch (error) {
          console.error("Payment processing error:", error);
          return new Response(JSON.stringify({ 
            status: 'failed',
            paymentId,
            message: 'Payment processing failed'
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          });
        }
      }
    } else if (status === 'failed' || status === 'cancelled') {
      // Update payment status to failed/cancelled
      const { error: updateError } = await supabaseAdmin
        .from("payments")
        .update({ 
          status: status === 'cancelled' ? 'cancelled' : 'failed',
          updated_at: new Date().toISOString()
        })
        .eq("id", payment.id);

      if (updateError) {
        console.error("Failed to update payment status:", updateError);
      }

      return new Response(JSON.stringify({ 
        status: status === 'cancelled' ? 'cancelled' : 'failed',
        paymentId,
        amount: payment.amount,
        credits: payment.credits_purchased,
        message: `Payment ${status}`
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Return current payment status
    return new Response(JSON.stringify({ 
      status: payment.status,
      paymentId,
      amount: payment.amount,
      credits: payment.credits_purchased,
      message: `Payment status: ${payment.status}`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Payment verification error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
