/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

// 🛡️ DODO PAYMENTS PERFECT INTEGRATION - 100% API TRUST
// This function creates the PERFECT integration with complete Dodo API trust

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DodoPaymentData {
  payment_id: string;
  subscription_id?: string;
  amount: number;
  currency: string;
  status: string;
  customer: {
    id: string;
    email: string;
    name: string;
  };
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface DodoSubscriptionData {
  subscription_id: string;
  customer_id: string;
  product_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  amount: number;
  currency: string;
  metadata?: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestBody = await req.json();
    const { action, payment_id, subscription_id } = requestBody;

    // 🔑 DODO PAYMENTS API CONFIGURATION
    const DODO_API_KEY = Deno.env.get('DODO_PAYMENTS_API_KEY');
    const DODO_API_BASE = Deno.env.get('DODO_API_BASE_URL') || 'https://api.dodopayments.com/v1';

    if (!DODO_API_KEY) {
      throw new Error('DODO_PAYMENTS_API_KEY is not defined');
    }

    if (!DODO_API_BASE) {
      throw new Error('DODO_API_BASE is not defined');
    }

    const dodoHeaders = {
      'Authorization': `Bearer ${DODO_API_KEY}`,
      'Content-Type': 'application/json',
    };

    switch (action) {
      case 'verify_payment':
        return await verifyPaymentWithDodo(payment_id, dodoHeaders, supabase, DODO_API_BASE);
      
      case 'verify_subscription':
        return await verifySubscriptionWithDodo(subscription_id, dodoHeaders, supabase, DODO_API_BASE);
      
      case 'create_payment_link':
        return await createDodoPaymentLink(requestBody, dodoHeaders, DODO_API_BASE);
      
      case 'create_subscription_link':
        return await createDodoSubscriptionLink(requestBody, dodoHeaders, DODO_API_BASE);
      
      case 'create_customer_portal':
        return await createCustomerPortal(requestBody, dodoHeaders, DODO_API_BASE);
      
      default:
        throw new Error('Invalid action specified');
    }

  } catch (error) {
    console.error('Dodo integration error:', error);
    return new Response(
      JSON.stringify({ 
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

// 🔒 VERIFY PAYMENT WITH 100% DODO API TRUST
async function verifyPaymentWithDodo(
  payment_id: string, 
  headers: Record<string, string>,
  supabase: any,
  apiBase: string
): Promise<Response> {
  try {
    // 🎯 STEP 1: Get payment data DIRECTLY from Dodo API
    const response = await fetch(`${apiBase}/payments/${payment_id}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`Dodo API error: ${response.status} ${response.statusText}`);
    }

    const dodoPayment: DodoPaymentData = await response.json();

    // 🛡️ STEP 2: ONLY trust Dodo API data - NEVER trust frontend/URL parameters
    const trustedStatus = dodoPayment.status;
    const trustedAmount = dodoPayment.amount;
    const trustedCustomer = dodoPayment.customer;

    // 🚨 CRITICAL: Only process if Dodo confirms success
    if (trustedStatus !== 'succeeded') {
      await logSecurityIncident(supabase, {
        type: 'payment_verification_failed',
        payment_id,
        dodo_status: trustedStatus,
        reason: 'Payment not confirmed as successful by Dodo API',
        timestamp: new Date().toISOString()
      });

      return new Response(
        JSON.stringify({
          success: false,
          verified: false,
          dodo_status: trustedStatus,
          message: 'Payment not confirmed by payment provider',
          security_check: 'PASSED - Prevented processing of unconfirmed payment'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 🎯 STEP 3: Process successful payment with Dodo-verified data
    const creditAmount = calculateCreditsFromDodoAmount(trustedAmount, dodoPayment.metadata);
    
    // Update user credits using ONLY Dodo-verified data
    const { error: creditError } = await supabase
      .from('user_credits')
      .upsert({
        user_id: trustedCustomer.id,
        email: trustedCustomer.email,
        credits_added: creditAmount,
        payment_id: payment_id,
        amount_paid: trustedAmount,
        currency: dodoPayment.currency,
        verified_by_dodo: true,
        dodo_status: trustedStatus,
        created_at: new Date().toISOString()
      });

    if (creditError) {
      throw new Error(`Failed to update credits: ${creditError.message}`);
    }

    // 📝 Log successful verification
    await logSecurityIncident(supabase, {
      type: 'payment_verified_success',
      payment_id,
      user_id: trustedCustomer.id,
      amount: trustedAmount,
      credits_added: creditAmount,
      dodo_status: trustedStatus,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({
        success: true,
        verified: true,
        dodo_status: trustedStatus,
        credits_added: creditAmount,
        amount: trustedAmount,
        currency: dodoPayment.currency,
        customer: trustedCustomer,
        security_check: 'PASSED - Payment verified by Dodo API'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Payment verification error:', error);
    
    await logSecurityIncident(supabase, {
      type: 'payment_verification_error',
      payment_id,
      error: error.message,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({ 
        success: false,
        verified: false,
        error: error.message,
        security_check: 'FAILED - Could not verify with Dodo API'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

// 🔒 VERIFY SUBSCRIPTION WITH 100% DODO API TRUST
async function verifySubscriptionWithDodo(
  subscription_id: string,
  headers: Record<string, string>,
  supabase: any,
  apiBase: string
): Promise<Response> {
  try {
    // 🎯 Get subscription data DIRECTLY from Dodo API
    const response = await fetch(`${apiBase}/subscriptions/${subscription_id}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`Dodo API error: ${response.status} ${response.statusText}`);
    }

    const dodoSubscription: DodoSubscriptionData = await response.json();

    // 🛡️ ONLY trust Dodo API data
    const trustedStatus = dodoSubscription.status;
    const trustedCustomerId = dodoSubscription.customer_id;

    // Update subscription status using ONLY Dodo-verified data
    const { error: subError } = await supabase
      .from('user_subscriptions')
      .upsert({
        subscription_id: subscription_id,
        user_id: trustedCustomerId,
        product_id: dodoSubscription.product_id,
        status: trustedStatus,
        current_period_start: dodoSubscription.current_period_start,
        current_period_end: dodoSubscription.current_period_end,
        cancel_at_period_end: dodoSubscription.cancel_at_period_end,
        amount: dodoSubscription.amount,
        currency: dodoSubscription.currency,
        verified_by_dodo: true,
        last_verified: new Date().toISOString()
      });

    if (subError) {
      throw new Error(`Failed to update subscription: ${subError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        verified: true,
        subscription: dodoSubscription,
        security_check: 'PASSED - Subscription verified by Dodo API'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Subscription verification error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        verified: false,
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

// 💳 CREATE DODO PAYMENT LINK WITH PERFECT INTEGRATION
async function createDodoPaymentLink(
  requestBody: any,
  headers: Record<string, string>,
  apiBase: string
): Promise<Response> {
  const { 
    product_id, 
    customer, 
    billing, 
    quantity = 1, 
    metadata = {},
    return_url 
  } = requestBody;

  try {
    const paymentData = {
      payment_link: true,
      product_cart: [{
        product_id,
        quantity
      }],
      customer: {
        email: customer.email,
        name: customer.name,
        phone_number: customer.phone_number || undefined
      },
      billing: {
        city: billing.city,
        country: billing.country,
        state: billing.state,
        street: billing.street,
        zipcode: billing.zipcode
      },
      metadata: {
        ...metadata,
        integration_source: 'perfect_dodo_integration',
        created_by: 'dodo-perfect-integration'
      },
      return_url: return_url || `https://your-domain.com/payments/success`
    };

    const response = await fetch(`${apiBase}/payments`, {
      method: 'POST',
      headers,
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      throw new Error(`Dodo API error: ${response.status} ${response.statusText}`);
    }

    const dodoResponse = await response.json();

    return new Response(
      JSON.stringify({
        success: true,
        payment_link: dodoResponse.payment_link,
        payment_id: dodoResponse.payment_id,
        checkout_url: dodoResponse.payment_link,
        expires_at: dodoResponse.expires_at,
        security_check: 'PASSED - Created via Dodo API'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Payment link creation error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

// 🔄 CREATE DODO SUBSCRIPTION LINK
async function createDodoSubscriptionLink(
  requestBody: any,
  headers: Record<string, string>,
  apiBase: string
): Promise<Response> {
  const { 
    product_id, 
    customer, 
    billing, 
    quantity = 1, 
    metadata = {},
    return_url,
    trial_period_days
  } = requestBody;

  try {
    const subscriptionData = {
      payment_link: true,
      product_id,
      quantity,
      customer: {
        email: customer.email,
        name: customer.name,
        phone_number: customer.phone_number || undefined
      },
      billing: {
        city: billing.city,
        country: billing.country,
        state: billing.state,
        street: billing.street,
        zipcode: billing.zipcode
      },
      metadata: {
        ...metadata,
        integration_source: 'perfect_dodo_integration',
        created_by: 'dodo-perfect-integration'
      },
      return_url: return_url || `https://your-domain.com/subscriptions/success`,
      trial_period_days
    };

    const response = await fetch(`${apiBase}/subscriptions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(subscriptionData)
    });

    if (!response.ok) {
      throw new Error(`Dodo API error: ${response.status} ${response.statusText}`);
    }

    const dodoResponse = await response.json();

    return new Response(
      JSON.stringify({
        success: true,
        payment_link: dodoResponse.payment_link,
        subscription_id: dodoResponse.subscription_id,
        checkout_url: dodoResponse.payment_link,
        trial_period_days: dodoResponse.trial_period_days,
        security_check: 'PASSED - Created via Dodo API'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Subscription link creation error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

// 👥 CREATE CUSTOMER PORTAL SESSION
async function createCustomerPortal(
  requestBody: any,
  headers: Record<string, string>,
  apiBase: string
): Promise<Response> {
  const { customer_id, send_email = false } = requestBody;

  try {
    const response = await fetch(`${apiBase}/customers/${customer_id}/customer-portal/session`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        send_email,
        confirm: true
      })
    });

    if (!response.ok) {
      throw new Error(`Dodo API error: ${response.status} ${response.statusText}`);
    }

    const dodoResponse = await response.json();

    return new Response(
      JSON.stringify({
        success: true,
        portal_url: dodoResponse.portal_url,
        expires_at: dodoResponse.expires_at,
        customer_id: customer_id,
        security_check: 'PASSED - Created via Dodo API'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Customer portal creation error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

// 🧮 CALCULATE CREDITS FROM DODO AMOUNT (TRUSTED)
function calculateCreditsFromDodoAmount(
  amount: number, 
  metadata?: Record<string, any>
): number {
  // Use metadata if provided, otherwise use standard conversion
  if (metadata?.credits) {
    return parseInt(metadata.credits);
  }
  
  // Standard conversion: $1 = 1 credit (amount is in cents)
  return Math.floor(amount / 100);
}

// 🔒 LOG SECURITY INCIDENTS
async function logSecurityIncident(
  supabase: any,
  incident: Record<string, any>
): Promise<void> {
  try {
    await supabase
      .from('security_events')
      .insert({
        ...incident,
        source: 'dodo_perfect_integration',
        logged_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to log security incident:', error);
  }
}
