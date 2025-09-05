import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DodoWebhookPayload {
  event_type: string;
  data: {
    payment_id?: string;
    subscription_id?: string;
    customer_id?: string;
    amount?: number;
    currency?: string;
    status?: string;
    metadata?: Record<string, any>;
    product_id?: string;
    quantity?: number;
    [key: string]: any;
  };
  created_at: string;
  api_version: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 🔑 Get webhook secret from environment
    const webhookSecret = Deno.env.get('DODO_PAYMENTS_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('Webhook secret not configured');
    }

    // 🔒 STEP 1: Verify webhook signature (100% trust in Dodo)
    const webhook = new Webhook(webhookSecret);
    const headers = req.headers;
    const body = await req.text();

    const webhookHeaders = {
      "webhook-id": headers.get("webhook-id") || "",
      "webhook-signature": headers.get("webhook-signature") || "",
      "webhook-timestamp": headers.get("webhook-timestamp") || "",
    };

    // Verify webhook signature - if this passes, we 100% trust the data
    await webhook.verify(body, webhookHeaders);

    // 🎯 STEP 2: Parse the trusted webhook payload
    const payload: DodoWebhookPayload = JSON.parse(body);
    
    console.log(`🎯 Processing Dodo webhook: ${payload.event_type}`);

    // 🛡️ STEP 3: Process webhook events with 100% trust in Dodo data
    let result;
    switch (payload.event_type) {
      case 'payment.succeeded':
        result = await handlePaymentSucceeded(payload, supabase);
        break;
      
      case 'payment.failed':
        result = await handlePaymentFailed(payload, supabase);
        break;
      
      case 'subscription.active':
        result = await handleSubscriptionActive(payload, supabase);
        break;
      
      case 'subscription.cancelled':
        result = await handleSubscriptionCancelled(payload, supabase);
        break;
      
      case 'subscription.renewed':
        result = await handleSubscriptionRenewed(payload, supabase);
        break;
      
      case 'refund.succeeded':
        result = await handleRefundSucceeded(payload, supabase);
        break;
      
      default:
        console.log(`⚠️ Unhandled webhook event: ${payload.event_type}`);
        result = { handled: false, event_type: payload.event_type };
    }

    // 📝 Log webhook processing
    await logWebhookEvent(supabase, {
      event_type: payload.event_type,
      payment_id: payload.data.payment_id,
      subscription_id: payload.data.subscription_id,
      customer_id: payload.data.customer_id,
      processed: true,
      result: result,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({
        success: true,
        event_type: payload.event_type,
        processed: true,
        result: result,
        message: 'Webhook processed successfully'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// 💰 HANDLE PAYMENT SUCCESS - 100% trust Dodo data
async function handlePaymentSucceeded(
  payload: DodoWebhookPayload, 
  supabase: any
): Promise<any> {
  const { payment_id, customer_id, amount, currency, metadata } = payload.data;
  
  console.log(`💰 Payment succeeded: ${payment_id} for customer ${customer_id}`);

  // Calculate credits from trusted Dodo amount
  const creditAmount = calculateCreditsFromAmount(amount, metadata);

  // Update user credits with 100% trusted Dodo data
  const { error: creditError } = await supabase
    .from('user_credits')
    .upsert({
      user_id: customer_id,
      payment_id: payment_id,
      credits_added: creditAmount,
      amount_paid: amount,
      currency: currency,
      verified_by_dodo: true,
      source: 'dodo_webhook',
      webhook_event: 'payment.succeeded',
      created_at: new Date().toISOString()
    });

  if (creditError) {
    throw new Error(`Failed to add credits: ${creditError.message}`);
  }

  // Update payment record
  const { error: paymentError } = await supabase
    .from('payments')
    .upsert({
      payment_id: payment_id,
      user_id: customer_id,
      amount: amount,
      currency: currency,
      status: 'succeeded',
      verified_by_dodo: true,
      processed_at: new Date().toISOString(),
      metadata: metadata
    });

  if (paymentError) {
    console.error('Failed to update payment record:', paymentError);
  }

  return {
    action: 'credits_added',
    credits_added: creditAmount,
    payment_id: payment_id,
    customer_id: customer_id,
    amount: amount,
    currency: currency
  };
}

// ❌ HANDLE PAYMENT FAILED - 100% trust Dodo data
async function handlePaymentFailed(
  payload: DodoWebhookPayload, 
  supabase: any
): Promise<any> {
  const { payment_id, customer_id } = payload.data;
  
  console.log(`❌ Payment failed: ${payment_id} for customer ${customer_id}`);

  // Update payment record to failed
  const { error: paymentError } = await supabase
    .from('payments')
    .upsert({
      payment_id: payment_id,
      user_id: customer_id,
      status: 'failed',
      verified_by_dodo: true,
      failed_at: new Date().toISOString()
    });

  if (paymentError) {
    console.error('Failed to update payment record:', paymentError);
  }

  // 🚨 Security check: Remove any credits that might have been added incorrectly
  const { error: creditError } = await supabase
    .from('user_credits')
    .update({ 
      status: 'revoked',
      revoked_reason: 'payment_failed_webhook',
      revoked_at: new Date().toISOString()
    })
    .eq('payment_id', payment_id);

  return {
    action: 'payment_failed',
    payment_id: payment_id,
    customer_id: customer_id,
    credits_revoked: creditError ? false : true
  };
}

// 🔄 HANDLE SUBSCRIPTION ACTIVE - 100% trust Dodo data
async function handleSubscriptionActive(
  payload: DodoWebhookPayload, 
  supabase: any
): Promise<any> {
  const { subscription_id, customer_id, product_id, amount, currency } = payload.data;
  
  console.log(`🔄 Subscription activated: ${subscription_id} for customer ${customer_id}`);

  // Update subscription record with trusted Dodo data
  const { error: subError } = await supabase
    .from('user_subscriptions')
    .upsert({
      subscription_id: subscription_id,
      user_id: customer_id,
      product_id: product_id,
      status: 'active',
      amount: amount,
      currency: currency,
      verified_by_dodo: true,
      activated_at: new Date().toISOString()
    });

  if (subError) {
    throw new Error(`Failed to activate subscription: ${subError.message}`);
  }

  return {
    action: 'subscription_activated',
    subscription_id: subscription_id,
    customer_id: customer_id,
    product_id: product_id
  };
}

// 🚫 HANDLE SUBSCRIPTION CANCELLED - 100% trust Dodo data
async function handleSubscriptionCancelled(
  payload: DodoWebhookPayload, 
  supabase: any
): Promise<any> {
  const { subscription_id, customer_id } = payload.data;
  
  console.log(`🚫 Subscription cancelled: ${subscription_id} for customer ${customer_id}`);

  // Update subscription status
  const { error: subError } = await supabase
    .from('user_subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      verified_by_dodo: true
    })
    .eq('subscription_id', subscription_id);

  if (subError) {
    throw new Error(`Failed to cancel subscription: ${subError.message}`);
  }

  return {
    action: 'subscription_cancelled',
    subscription_id: subscription_id,
    customer_id: customer_id
  };
}

// 🔄 HANDLE SUBSCRIPTION RENEWED - 100% trust Dodo data
async function handleSubscriptionRenewed(
  payload: DodoWebhookPayload, 
  supabase: any
): Promise<any> {
  const { subscription_id, customer_id, amount, currency, metadata } = payload.data;
  
  console.log(`🔄 Subscription renewed: ${subscription_id} for customer ${customer_id}`);

  // Add credits for subscription renewal
  const creditAmount = calculateCreditsFromAmount(amount, metadata);

  const { error: creditError } = await supabase
    .from('user_credits')
    .insert({
      user_id: customer_id,
      subscription_id: subscription_id,
      credits_added: creditAmount,
      amount_paid: amount,
      currency: currency,
      source: 'subscription_renewal',
      verified_by_dodo: true,
      webhook_event: 'subscription.renewed',
      created_at: new Date().toISOString()
    });

  if (creditError) {
    throw new Error(`Failed to add renewal credits: ${creditError.message}`);
  }

  // Update subscription record
  const { error: subError } = await supabase
    .from('user_subscriptions')
    .update({
      last_payment_amount: amount,
      last_payment_at: new Date().toISOString(),
      verified_by_dodo: true
    })
    .eq('subscription_id', subscription_id);

  return {
    action: 'subscription_renewed',
    subscription_id: subscription_id,
    customer_id: customer_id,
    credits_added: creditAmount,
    amount: amount
  };
}

// 💸 HANDLE REFUND SUCCEEDED - 100% trust Dodo data
async function handleRefundSucceeded(
  payload: DodoWebhookPayload, 
  supabase: any
): Promise<any> {
  const { payment_id, customer_id, amount } = payload.data;
  
  console.log(`💸 Refund processed: ${payment_id} for customer ${customer_id}`);

  // Calculate credits to revoke
  const creditsToRevoke = Math.floor(amount / 100);

  // Revoke credits for refunded payment
  const { error: creditError } = await supabase
    .from('user_credits')
    .update({
      status: 'revoked',
      revoked_reason: 'refund_processed',
      revoked_at: new Date().toISOString(),
      revoked_amount: creditsToRevoke
    })
    .eq('payment_id', payment_id);

  // Record refund
  const { error: refundError } = await supabase
    .from('refunds')
    .insert({
      payment_id: payment_id,
      user_id: customer_id,
      amount: amount,
      credits_revoked: creditsToRevoke,
      verified_by_dodo: true,
      processed_at: new Date().toISOString()
    });

  return {
    action: 'refund_processed',
    payment_id: payment_id,
    customer_id: customer_id,
    amount: amount,
    credits_revoked: creditsToRevoke
  };
}

// 🧮 CALCULATE CREDITS FROM AMOUNT
function calculateCreditsFromAmount(
  amount: number, 
  metadata?: Record<string, any>
): number {
  // Use metadata if provided
  if (metadata?.credits) {
    return parseInt(metadata.credits);
  }
  
  // Standard conversion: $1 = 1 credit (amount is in cents)
  return Math.floor(amount / 100);
}

// 📝 LOG WEBHOOK EVENTS
async function logWebhookEvent(
  supabase: any,
  event: Record<string, any>
): Promise<void> {
  try {
    await supabase
      .from('webhook_events')
      .insert({
        ...event,
        source: 'dodo_webhook_handler',
        logged_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to log webhook event:', error);
  }
}
