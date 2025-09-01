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
    console.log("=== QUICK PAYMENT TEST ===");
    
    const apiKey = "8SSKFEsfH2oztWzS.pvF6gFUWVK5JGfWgNjjuRl0SLVb4X-KMUT7GSw7EfnKVzB2t";
    
    // **OFFICIAL DODO PAYMENTS PAYLOAD STRUCTURE** (from docs.dodopayments.com)
    const testPayload = {
      // REQUIRED: Generate payment link
      payment_link: true,
      
      // REQUIRED: Billing information (exact field names from official docs)
      billing: {
        city: "New York",         // REQUIRED: String
        country: "US",           // REQUIRED: String (ISO 3166-1 alpha-2)
        state: "NY",             // REQUIRED: String  
        street: "123 Main St",   // REQUIRED: String
        zipcode: "10001"         // REQUIRED: String (from webhook example)
      },
      
      // REQUIRED: Customer information
      customer: {
        email: "test@example.com",  // REQUIRED: String
        name: "Test User"           // REQUIRED: String
      },
      
      // REQUIRED: Product cart (simplified structure from docs)
      product_cart: [
        {
          product_id: "pdt_k7wJTFUEwjV6mbLUSUl8Y",  // REQUIRED: Actual Dodo product ID
          quantity: 5                    // REQUIRED: Integer
        }
      ],
      
      // OPTIONAL: Return URL (where customer goes after payment)
      return_url: "https://sproutcv.app/payments?status=success&amount=500&credits=5&source=dodo",
      
      // OPTIONAL: Metadata field (added in v0.12.0)
      metadata: {
        user_id: "test_user_123",
        credits: "5",
        plan_type: "starter",
        source: "sproutcv_test",
        environment: "test"
      }
    };
    
    console.log("Testing with payload:", JSON.stringify(testPayload, null, 2));
    
    // Test the API call
    const headers = new Headers();
    headers.set("Authorization", `Bearer ${apiKey}`);
    headers.set("Content-Type", "application/json");
    headers.set("Accept", "application/json");
    headers.set("User-Agent", "SproutCV/2.0");
    
    console.log("Making API call to: https://live.dodopayments.com/checkouts");
    
    const response = await fetch("https://live.dodopayments.com/checkouts", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(testPayload)
    });
    
    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));
    
    let responseText = "";
    let responseData = null;
    
    try {
      responseText = await response.text();
      console.log("Raw response:", responseText);
      
      if (responseText.trim()) {
        try {
          responseData = JSON.parse(responseText);
          console.log("Parsed response:", responseData);
        } catch (parseError) {
          console.log("JSON parse failed:", parseError.message);
          responseData = { raw: responseText };
        }
      }
    } catch (readError) {
      console.log("Response read failed:", readError.message);
      responseData = { error: "Could not read response" };
    }
    
    return new Response(JSON.stringify({
      success: true,
      test: "quick-payment-test",
      api_call: {
        url: "https://live.dodopayments.com/checkouts",
        method: "POST",
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        response: responseData
      },
      payload_sent: testPayload,
      analysis: analyzeResult(response.status, responseData),
      recommendation: getRecommendation(response.status, responseData),
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
      type: error.constructor.name
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});

function analyzeResult(status: number, data: any): string {
  if (status === 200 || status === 201) {
    return "SUCCESS! Payment created successfully";
  }
  if (status === 400) {
    return "BAD REQUEST - Check payload format";
  }
  if (status === 401) {
    return "UNAUTHORIZED - API key issue";
  }
  if (status === 403) {
    return "FORBIDDEN - API key lacks permissions";
  }
  if (status === 422) {
    return "VALIDATION ERROR - Payload format issue: " + (data?.message || 'Unknown validation error');
  }
  if (status === 429) {
    return "RATE LIMITED - Too many requests";
  }
  if (status >= 500) {
    return "SERVER ERROR - Dodo Payments internal issue";
  }
  return "UNKNOWN ERROR - Check response details";
}

function getRecommendation(status: number, data: any): string {
  if (status === 200 || status === 201) {
    return "✅ PERFECT! Use this exact payload format in production";
  }
  if (status === 422 && data?.message?.includes("product_cart")) {
    return "❌ FIX: product_cart field format is still wrong";
  }
  if (status === 422) {
    return "❌ FIX: " + (data?.message || 'Check payload validation errors');
  }
  if (status === 401) {
    return "❌ FIX: API key is invalid or for wrong environment";
  }
  return "❌ FIX: Check Dodo Payments documentation for this error";
}
