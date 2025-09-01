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
    console.log("=== LISTING DODO PRODUCTS ===");
    
    const apiKey = "8SSKFEsfH2oztWzS.pvF6gFUWVK5JGfWgNjjuRl0SLVb4X-KMUT7GSw7EfnKVzB2t";
    
    // Test both test and live environments to see products
    const environments = [
      { name: "test", url: "https://test.dodopayments.com" },
      { name: "live", url: "https://live.dodopayments.com" }
    ];
    
    const results = {};
    
    for (const env of environments) {
      console.log(`Checking ${env.name} environment...`);
      
      try {
        const headers = new Headers();
        headers.set("Authorization", `Bearer ${apiKey}`);
        headers.set("Content-Type", "application/json");
        headers.set("Accept", "application/json");
        
        // List products endpoint from documentation
        const response = await fetch(`${env.url}/products`, {
          method: "GET",
          headers: headers
        });
        
        console.log(`${env.name} response:`, response.status);
        
        let responseData;
        const responseText = await response.text();
        
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = { raw: responseText };
        }
        
        results[env.name] = {
          status: response.status,
          ok: response.ok,
          data: responseData,
          analysis: response.ok ? "SUCCESS - Products found" : `ERROR - ${response.status} ${response.statusText}`
        };
        
      } catch (error) {
        console.error(`${env.name} error:`, error);
        results[env.name] = {
          error: error.message,
          analysis: "Network/DNS error"
        };
      }
    }
    
    // Also try to create a test product
    console.log("Attempting to create test product...");
    
    try {
      const headers = new Headers();
      headers.set("Authorization", `Bearer ${apiKey}`);
      headers.set("Content-Type", "application/json");
      headers.set("Accept", "application/json");
      
      const testProduct = {
        name: "Resume Analysis Credits",
        description: "AI-powered resume analysis credits for SproutCV",
        price: 100, // $1.00 per credit
        currency: "USD",
        type: "one_time", // or "subscription"
        product_id: "resume_credits" // Custom product ID
      };
      
      const createResponse = await fetch("https://live.dodopayments.com/products", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(testProduct)
      });
      
      const createText = await createResponse.text();
      let createData;
      
      try {
        createData = JSON.parse(createText);
      } catch {
        createData = { raw: createText };
      }
      
      results["product_creation"] = {
        status: createResponse.status,
        ok: createResponse.ok,
        data: createData,
        analysis: createResponse.ok ? "SUCCESS - Product created" : `ERROR - ${createResponse.status} ${createResponse.statusText}`
      };
      
    } catch (createError) {
      results["product_creation"] = {
        error: createError.message,
        analysis: "Product creation failed"
      };
    }
    
    return new Response(JSON.stringify({
      success: true,
      environments_checked: results,
      recommendation: generateRecommendation(results),
      timestamp: new Date().toISOString()
    }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });
    
  } catch (error) {
    console.error("List products failed:", error);
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});

function generateRecommendation(results: any): string {
  if (results.live?.ok && results.live.data?.length > 0) {
    return "✅ PRODUCTS FOUND! Use existing product IDs from live environment";
  }
  
  if (results.test?.ok && results.test.data?.length > 0) {
    return "✅ PRODUCTS FOUND! Use existing product IDs from test environment";
  }
  
  if (results.product_creation?.ok) {
    return "✅ PRODUCT CREATED! Use 'resume_credits' as product_id";
  }
  
  if (results.live?.status === 401 || results.test?.status === 401) {
    return "❌ AUTHENTICATION FAILED - Check API key or regenerate it";
  }
  
  return "❌ NO PRODUCTS FOUND - Need to create products in Dodo dashboard";
}
