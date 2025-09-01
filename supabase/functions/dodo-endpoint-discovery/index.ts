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
    console.log("=== DODO ENDPOINT DISCOVERY ===");
    
    const apiKey = "8SSKFEsfH2oztWzS.pvF6gFUWVK5JGfWgNjjuRl0SLVb4X-KMUT7GSw7EfnKVzB2t";
    
    // Test different base URLs and endpoint combinations
    const testCombinations = [
      // Test environment
      { base: "https://test.dodopayments.com", path: "/v1/payments" },
      { base: "https://test.dodopayments.com", path: "/api/v1/payments" },
      { base: "https://test.dodopayments.com", path: "/payments" },
      { base: "https://test.dodopayments.com", path: "/v1/checkout_sessions" },
      { base: "https://test.dodopayments.com", path: "/api/checkout_sessions" },
      
      // Live environment
      { base: "https://live.dodopayments.com", path: "/v1/payments" },
      { base: "https://live.dodopayments.com", path: "/api/v1/payments" },
      { base: "https://live.dodopayments.com", path: "/payments" },
      
      // Alternative patterns
      { base: "https://api.dodopayments.com", path: "/v1/payments" },
      { base: "https://dashboard.dodopayments.com", path: "/api/v1/payments" },
      
      // Basic connectivity tests (GET requests)
      { base: "https://test.dodopayments.com", path: "/", method: "GET" },
      { base: "https://live.dodopayments.com", path: "/", method: "GET" },
      { base: "https://api.dodopayments.com", path: "/", method: "GET" }
    ];
    
    const results = {};
    
    for (const test of testCombinations) {
      const url = `${test.base}${test.path}`;
      const method = test.method || "POST";
      
      console.log(`Testing: ${method} ${url}`);
      
      try {
        const headers = new Headers();
        headers.set("Authorization", `Bearer ${apiKey}`);
        headers.set("Content-Type", "application/json");
        headers.set("Accept", "application/json");
        
        let requestOptions: any = {
          method: method,
          headers: headers
        };
        
        // Only add body for POST requests
        if (method === "POST") {
          const testPayload = {
            amount: 500,
            currency: "USD",
            description: "Test payment discovery"
          };
          requestOptions.body = JSON.stringify(testPayload);
        }
        
        const response = await fetch(url, requestOptions);
        
        let responseText = "";
        let responseData = null;
        
        try {
          responseText = await response.text();
          if (responseText.trim()) {
            try {
              responseData = JSON.parse(responseText);
            } catch {
              responseData = { raw: responseText.substring(0, 200) };
            }
          }
        } catch {
          responseData = { error: "Could not read response" };
        }
        
        results[url] = {
          method: method,
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries()),
          data: responseData,
          analysis: analyzeResponse(response.status, responseData, responseText)
        };
        
        console.log(`✓ ${url}: ${response.status} ${response.statusText}`);
        
        // If we get anything other than 404, log more details
        if (response.status !== 404) {
          console.log(`  Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);
          console.log(`  Body preview: ${responseText.substring(0, 100)}`);
        }
        
      } catch (error) {
        console.error(`✗ ${url}: ${error.message}`);
        results[url] = {
          method: method,
          error: error.message,
          type: error.constructor.name,
          analysis: "Network/DNS error"
        };
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Generate recommendations
    const recommendations = generateRecommendations(results);
    
    return new Response(JSON.stringify({
      success: true,
      apiKey: {
        length: apiKey.length,
        preview: `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}`
      },
      testResults: results,
      recommendations: recommendations,
      summary: generateSummary(results),
      timestamp: new Date().toISOString()
    }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });
    
  } catch (error) {
    console.error("Discovery failed:", error);
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});

function analyzeResponse(status: number, data: any, text: string): string {
  if (status === 200 || status === 201) return "SUCCESS - Endpoint exists and responds";
  if (status === 401) return "AUTHENTICATION - API key issue or wrong environment";
  if (status === 403) return "FORBIDDEN - API key lacks permissions";
  if (status === 404) return "NOT FOUND - Endpoint doesn't exist";
  if (status === 405) return "METHOD NOT ALLOWED - Wrong HTTP method";
  if (status === 422) return "VALIDATION ERROR - Payload format issue";
  if (status === 429) return "RATE LIMITED - Too many requests";
  if (status === 500) return "SERVER ERROR - Dodo Payments internal issue";
  if (status >= 400 && status < 500) return "CLIENT ERROR - Check request format";
  if (status >= 500) return "SERVER ERROR - Dodo Payments issue";
  return "UNKNOWN - Check response details";
}

function generateRecommendations(results: any): string[] {
  const recommendations = [];
  
  const successfulEndpoints = Object.entries(results)
    .filter(([url, result]: [string, any]) => result.ok || result.status === 401)
    .map(([url]) => url);
    
  if (successfulEndpoints.length > 0) {
    recommendations.push(`✅ WORKING ENDPOINTS FOUND: ${successfulEndpoints.join(', ')}`);
  }
  
  const authErrors = Object.entries(results)
    .filter(([url, result]: [string, any]) => result.status === 401)
    .map(([url]) => url);
    
  if (authErrors.length > 0) {
    recommendations.push(`🔑 AUTHENTICATION ISSUES: ${authErrors.join(', ')} - Check API key environment mode`);
  }
  
  const methodErrors = Object.entries(results)
    .filter(([url, result]: [string, any]) => result.status === 405)
    .map(([url]) => url);
    
  if (methodErrors.length > 0) {
    recommendations.push(`🔄 METHOD ERRORS: ${methodErrors.join(', ')} - Try different HTTP methods`);
  }
  
  const validationErrors = Object.entries(results)
    .filter(([url, result]: [string, any]) => result.status === 422)
    .map(([url]) => url);
    
  if (validationErrors.length > 0) {
    recommendations.push(`📋 PAYLOAD ERRORS: ${validationErrors.join(', ')} - Check request body format`);
  }
  
  if (recommendations.length === 0) {
    recommendations.push("❌ NO WORKING ENDPOINTS FOUND - Check Dodo Payments documentation or contact support");
  }
  
  return recommendations;
}

function generateSummary(results: any): any {
  const total = Object.keys(results).length;
  const statuses = Object.values(results).reduce((acc: any, result: any) => {
    const status = result.status || 'error';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  
  return {
    totalTests: total,
    statusBreakdown: statuses,
    hasWorkingEndpoints: Object.values(results).some((result: any) => result.ok),
    hasAuthenticationEndpoints: Object.values(results).some((result: any) => result.status === 401)
  };
}
