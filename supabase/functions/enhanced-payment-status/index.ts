import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

interface PaymentRecord {
  id: string;
  user_id: string;
  payment_provider_id?: string;
  stripe_session_id?: string;
  status: string;
  amount: number;
  credits_purchased: number;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

const PAYMENT_COLS = "id, user_id, payment_provider_id, stripe_session_id, status, amount, credits_purchased, expires_at, created_at, updated_at";

function isValidUuid(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 405,
      });
    }

    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return new Response(JSON.stringify({ error: "Unsupported Media Type" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 415,
      });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const paymentId = (body?.paymentId ?? "").toString().trim();
    if (!paymentId) {
      return new Response(JSON.stringify({ error: "Payment ID is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Create Supabase client with service role key
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Missing environment variables" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Get authenticated user
    const authHeader = req.headers.get("Authorization") ?? "";
    const parts = authHeader.split(" ");
    const token = parts.length === 2 && /^Bearer$/i.test(parts[0]) ? parts[1] : "";

    if (!token) {
      return new Response(JSON.stringify({ error: "Missing or invalid Authorization header" }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "WWW-Authenticate": 'Bearer realm="supabase", error="invalid_request"',
        },
        status: 401,
      });
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "WWW-Authenticate": 'Bearer realm="supabase", error="invalid_token"',
        },
        status: 401,
      });
    }

    const user = userData.user;
    console.log(`Checking payment status for ${paymentId} for user ${user.id}`);

    // Find the payment record with multiple strategies
    let payment: PaymentRecord | null = null;
    
    // Strategy 1: Direct provider ID lookup
    const { data: directPayment } = await supabaseAdmin
      .from("payments")
      .select(PAYMENT_COLS)
      .eq("payment_provider_id", paymentId)
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (directPayment) {
      payment = directPayment as PaymentRecord;
      console.log(`✅ Found payment by provider ID: ${payment.id}`);
    } else {
      // Strategy 2: Stripe session ID lookup (backward compatibility)
      const { data: stripePayment } = await supabaseAdmin
        .from("payments")
        .select(PAYMENT_COLS)
        .eq("stripe_session_id", paymentId)
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (stripePayment) {
        payment = stripePayment as PaymentRecord;
        console.log(`✅ Found payment by stripe session: ${payment.id}`);
      } else if (isValidUuid(paymentId)) {
        // Strategy 3: Payment ID lookup (only if valid UUID)
        const { data: idPayment } = await supabaseAdmin
          .from("payments")
          .select(PAYMENT_COLS)
          .eq("id", paymentId)
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (idPayment) {
          payment = idPayment as PaymentRecord;
          console.log(`✅ Found payment by ID: ${payment.id}`);
        }
      } else {
        console.log(`⚠️ Skipping UUID lookup - invalid format: ${paymentId}`);
      }
    }

    if (!payment) {
      console.error("Payment not found for ID:", paymentId);
      return new Response(JSON.stringify({ 
        status: 'not_found',
        message: 'Payment not found or access denied'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    console.log("Payment found:", payment.id, "Status:", payment.status);

    // Check if payment has expired
    if (payment.expires_at && new Date(payment.expires_at) < new Date()) {
      if (payment.status === 'pending') {
        console.log(`⏰ Payment expired, updating status: ${payment.id}`);
        
        const { error: updErr } = await supabaseAdmin
          .from("payments")
          .update({
            status: 'expired',
            updated_at: new Date().toISOString()
          })
          .eq("id", payment.id)
          .eq("status", "pending"); // guard against races
        
        if (updErr) {
          console.error("payments update error:", updErr);
        }
        
        return new Response(JSON.stringify({ 
          status: 'expired',
          paymentId,
          amount: payment.amount,
          credits: payment.credits_purchased,
          message: 'Payment has expired'
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    // Return current payment status
    return new Response(JSON.stringify({ 
      status: payment.status,
      paymentId,
      amount: payment.amount,
      credits: payment.credits_purchased,
      message: `Payment status: ${payment.status}`,
      expiresAt: payment.expires_at
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Payment status check error:", err);
    return new Response(JSON.stringify({ 
      error: "Payment status check failed",
      message: message,
      details: typeof err === 'object' && err !== null ? JSON.stringify(err) : String(err)
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
