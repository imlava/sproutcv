import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== MINIMAL PAYMENT START ===");
    
    // Just parse the body and return success
    const body = await req.json();
    console.log("Body received:", body);
    
    // Return mock payment response
    return new Response(JSON.stringify({
      success: true,
      paymentId: "mock_payment_" + Date.now(),
      url: "https://checkout.dodopayments.com/mock",
      amount: body.amount || 500,
      credits: body.credits || 5,
      currency: "USD",
      paymentMethod: "dodo_payments",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      recordId: Math.random().toString(36).substr(2, 9),
      environment: "test",
      timestamp: new Date().toISOString(),
      authMethod: "minimal",
      version: "minimal-v1.0",
      message: "This is a minimal test payment function"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error) {
    console.error("=== MINIMAL PAYMENT ERROR ===", error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      version: "minimal-v1.0"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200, // Return 200 to avoid 500 error
    });
  }
});
