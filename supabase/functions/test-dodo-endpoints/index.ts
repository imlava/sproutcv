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

    // Test multiple endpoints to find the correct one
    const baseUrl = "https://live.dodopayments.com";
    
    const endpoints = [
      "/checkout-sessions",
      "/checkout_sessions", 
      "/payments",
      "/checkouts",
      "/api/v1/checkout-sessions",
      "/api/checkout-sessions",
      "/v1/payments",
      "/v1/checkout-sessions"
    ];

    const testPayload = {
      amount: 500,
      currency: "USD",
      customer: {
        email: "test@sproutcv.app",
        name: "Test Customer"
      },
      return_url: "https://sproutcv.app/payments?status=success",
      metadata: {
        test: true,
        source: "endpoint_discovery"
      }
    };

    const results = [];

    for (const endpoint of endpoints) {
      try {
        console.log(`Testing endpoint: ${baseUrl}${endpoint}`);
        
        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${dodoApiKey}`,
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(testPayload)
        });

        const responseText = await response.text();
        let responseData;
        
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = responseText;
        }

        results.push({
          endpoint,
          status: response.status,
          ok: response.ok,
          statusText: response.statusText,
          response: responseData,
          timestamp: new Date().toISOString()
        });

        console.log(`✓ ${endpoint}: ${response.status} ${response.statusText}`);
        
        // If we get a successful response, log extra details
        if (response.ok) {
          console.log(`🎉 SUCCESS at ${endpoint}:`, responseData);
        }

      } catch (error) {
        results.push({
          endpoint,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        console.log(`✗ ${endpoint}: ${error.message}`);
      }
    }

    // Find successful responses
    const successfulEndpoints = results.filter(r => r.ok);
    const errorEndpoints = results.filter(r => !r.ok && !r.error);
    const failedEndpoints = results.filter(r => r.error);

    return new Response(JSON.stringify({
      success: successfulEndpoints.length > 0,
      summary: {
        total_tested: endpoints.length,
        successful: successfulEndpoints.length,
        errors: errorEndpoints.length,
        failed: failedEndpoints.length
      },
      successful_endpoints: successfulEndpoints,
      error_endpoints: errorEndpoints,
      failed_endpoints: failedEndpoints,
      recommendation: successfulEndpoints.length > 0 
        ? `Use: ${successfulEndpoints[0].endpoint}` 
        : "No working endpoints found",
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });

  } catch (error) {
    console.error("Endpoint test error:", error);
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
