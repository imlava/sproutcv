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
    console.log("=== TESTING SINGLE PRODUCT CREATION ===");
    
    const apiKey = "8SSKFEsfH2oztWzS.pvF6gFUWVK5JGfWgNjjuRl0SLVb4X-KMUT7GSw7EfnKVzB2t";
    
    // Test with the correct price structure based on existing product
    const simpleProduct = {
      name: "Test Credit",
      description: "Simple test credit",
      price: {
        type: "one_time_price",
        price: 500,
        currency: "USD",
        tax_inclusive: false,
        discount: 0,
        purchasing_power_parity: false,
        pay_what_you_want: false,
        suggested_price: null
      }
    };
    
    console.log("Testing simple product:", JSON.stringify(simpleProduct, null, 2));
    
    const headers = new Headers();
    headers.set("Authorization", `Bearer ${apiKey}`);
    headers.set("Content-Type", "application/json");
    headers.set("Accept", "application/json");
    
    const response = await fetch("https://live.dodopayments.com/products", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(simpleProduct)
    });
    
    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log("Raw response:", responseText);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }
    
    // If simple product fails, try with more fields
    let complexResult = null;
    if (!response.ok) {
      console.log("Simple product failed, trying with more fields...");
      
      const complexProduct = {
        name: "Test Credit Extended",
        description: "Extended test credit with more fields",
        price: {
          type: "one_time_price",
          price: 500,
          currency: "USD",
          tax_inclusive: false,
          discount: 0,
          purchasing_power_parity: false,
          pay_what_you_want: false,
          suggested_price: null
        },
        tax_category: "saas",
        is_recurring: false,
        metadata: {
          credits: "5",
          plan_type: "test"
        }
      };
      
      const complexResponse = await fetch("https://live.dodopayments.com/products", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(complexProduct)
      });
      
      const complexText = await complexResponse.text();
      let complexData;
      try {
        complexData = JSON.parse(complexText);
      } catch {
        complexData = { raw: complexText };
      }
      
      complexResult = {
        status: complexResponse.status,
        ok: complexResponse.ok,
        data: complexData,
        payload: complexProduct
      };
    }
    
    return new Response(JSON.stringify({
      success: true,
      simple_product: {
        payload: simpleProduct,
        status: response.status,
        ok: response.ok,
        data: responseData,
        analysis: response.ok ? "Simple product works!" : "Simple product failed"
      },
      complex_product: complexResult,
      recommendation: generateDetailedRecommendation(response, responseData, complexResult),
      timestamp: new Date().toISOString()
    }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });
    
  } catch (error) {
    console.error("Test failed:", error);
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});

function generateDetailedRecommendation(response: Response, data: any, complexResult: any): string {
  if (response.ok) {
    return "✅ SIMPLE PRODUCT CREATION WORKS! Use basic format for all products.";
  }
  
  if (complexResult?.ok) {
    return "✅ COMPLEX PRODUCT CREATION WORKS! Use extended format with metadata.";
  }
  
  if (response.status === 422) {
    if (data.message) {
      return `❌ VALIDATION ERROR: ${data.message}. Check field formats and requirements.`;
    }
    return "❌ VALIDATION ERROR: Check required fields and data types.";
  }
  
  if (response.status === 401) {
    return "❌ AUTHENTICATION ERROR: API key invalid or expired.";
  }
  
  if (response.status === 403) {
    return "❌ PERMISSION ERROR: API key lacks product creation permissions.";
  }
  
  return `❌ UNKNOWN ERROR: ${response.status} - Check Dodo Payments documentation.`;
}
