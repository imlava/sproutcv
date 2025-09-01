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
    console.log("=== TESTING REAL DODO API ===");
    
    // Use the real API key provided by user
    const realApiKey = "8SSKFEsfH2oztWzS.pvF6gFUWVK5JGfWgNjjuRl0SLVb4X-KMUT7GSw7EfnKVzB2t";
    
    console.log("Real API Key Info:");
    console.log("- Length:", realApiKey.length);
    console.log("- First 10 chars:", realApiKey.substring(0, 10));
    console.log("- Last 5 chars:", realApiKey.substring(realApiKey.length - 5));
    
    // Test different endpoints
    const endpoints = [
      "https://test.dodopayments.com/api/checkout_sessions",
      "https://live.dodopayments.com/api/checkout_sessions",
      "https://api.dodopayments.com/v1/checkout_sessions",
      "https://dashboard.dodopayments.com/api/checkout_sessions"
    ];
    
    const results = {};
    
    for (const endpoint of endpoints) {
      console.log(`Testing endpoint: ${endpoint}`);
      
      try {
        const headers = new Headers();
        headers.set("Authorization", `Bearer ${realApiKey}`);
        headers.set("Content-Type", "application/json");
        headers.set("Accept", "application/json");
        
        const testPayload = {
          amount: 500, // $5.00 in cents
          currency: "USD",
          description: "Test payment - SproutCV",
          success_url: "https://sproutcv.app/payments?status=success",
          cancel_url: "https://sproutcv.app/payments?status=cancelled",
          webhook_url: "https://yucdpvnmcuokemhqpnvz.supabase.co/functions/v1/dodo-webhook",
          line_items: [{
            name: "Resume Analysis Credits",
            description: "Test payment",
            amount: 500,
            quantity: 1
          }]
        };
        
        const response = await fetch(endpoint, {
          method: "POST",
          headers: headers,
          body: JSON.stringify(testPayload)
        });
        
        const responseText = await response.text();
        let responseData;
        
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = { raw: responseText };
        }
        
        results[endpoint] = {
          status: response.status,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries()),
          data: responseData
        };
        
        console.log(`✓ ${endpoint}: ${response.status} ${response.ok ? 'SUCCESS' : 'FAILED'}`);
        
      } catch (error) {
        console.error(`✗ ${endpoint}: ${error.message}`);
        results[endpoint] = {
          error: error.message,
          type: error.constructor.name
        };
      }
    }
    
    // Test webhook connectivity
    console.log("Testing webhook connectivity...");
    try {
      const webhookTest = await fetch("https://yucdpvnmcuokemhqpnvz.supabase.co/functions/v1/dodo-webhook", {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });
      
      results["webhook_test"] = {
        status: webhookTest.status,
        ok: webhookTest.ok,
        accessible: true
      };
    } catch (webhookError) {
      results["webhook_test"] = {
        error: webhookError.message,
        accessible: false
      };
    }
    
    return new Response(JSON.stringify({
      success: true,
      apiKey: {
        length: realApiKey.length,
        format: "valid",
        preview: `${realApiKey.substring(0, 10)}...${realApiKey.substring(realApiKey.length - 5)}`
      },
      endpointTests: results,
      recommendation: getRecommendation(results),
      timestamp: new Date().toISOString()
    }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });
    
  } catch (error) {
    console.error("Test failed:", error);
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});

function getRecommendation(results: any): string {
  const workingEndpoints = Object.entries(results)
    .filter(([key, value]: [string, any]) => key !== "webhook_test" && value.ok)
    .map(([key]) => key);
    
  if (workingEndpoints.length > 0) {
    return `SUCCESS! Use this endpoint: ${workingEndpoints[0]}`;
  }
  
  const hasAuthErrors = Object.values(results).some((result: any) => 
    result.status === 401 || result.status === 403
  );
  
  if (hasAuthErrors) {
    return "Authentication failed - check API key or regenerate it";
  }
  
  const hasDnsErrors = Object.values(results).some((result: any) => 
    result.error?.includes("dns") || result.error?.includes("hostname")
  );
  
  if (hasDnsErrors) {
    return "DNS/Network issue - verify Dodo Payments endpoints";
  }
  
  return "All endpoints failed - check Dodo Payments documentation";
}
