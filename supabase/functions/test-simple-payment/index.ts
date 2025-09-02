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
    const dodoApiKey = Deno.env.get("DODO_PAYMENTS_API_KEY");
    if (!dodoApiKey) {
      return new Response(JSON.stringify({ 
        error: "API key not configured" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      });
    }

    console.log("🎯 Creating simple Dodo payment...");

    // **MINIMAL WORKING PAYLOAD** (based on endpoint test results)
    const paymentData = {
      amount: 500,
      currency: "USD",
      customer: {
        email: "test@sproutcv.app",
        name: "Test Customer"
      },
      return_url: "https://sproutcv.app/payments?status=success",
      metadata: {
        test: "true",              // String, not boolean
        source: "sproutcv_simple",
        amount: "500",
        credits: "5"
      }
    };

    console.log("📦 Payload:", JSON.stringify(paymentData, null, 2));

    const response = await fetch("https://live.dodopayments.com/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${dodoApiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(paymentData)
    });

    console.log(`📡 Response: ${response.status} ${response.statusText}`);

    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    console.log("📄 Response data:", responseData);

    if (!response.ok) {
      return new Response(JSON.stringify({
        success: false,
        error: `Dodo API ${response.status}: ${response.statusText}`,
        details: responseData,
        request_payload: paymentData,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      });
    }

    // Success! Extract payment fields
    const paymentId = responseData.payment_id || responseData.id;
    const checkoutUrl = responseData.checkout_url || responseData.payment_url || responseData.url;

    return new Response(JSON.stringify({
      success: true,
      paymentId: paymentId,
      url: checkoutUrl,
      amount: 500,
      credits: 5,
      planType: "starter",
      dodo_response: responseData,
      fields_found: {
        payment_id: !!responseData.payment_id,
        id: !!responseData.id,
        checkout_url: !!responseData.checkout_url,
        payment_url: !!responseData.payment_url,
        url: !!responseData.url
      },
      timestamp: new Date().toISOString(),
      version: "simple-test-v1.0"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });

  } catch (error) {
    console.error("Simple payment test error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
