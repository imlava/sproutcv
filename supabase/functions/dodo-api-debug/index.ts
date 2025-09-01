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
    console.log("=== DODO API DEBUG START ===");
    
    // Step 1: Check environment variables
    const dodoApiKey = Deno.env.get("DODO_PAYMENTS_API_KEY");
    const dodoWebhookUrl = Deno.env.get("DODO_WEBHOOK_URL");
    
    console.log("Environment Check:");
    console.log("- DODO_PAYMENTS_API_KEY exists:", !!dodoApiKey);
    console.log("- DODO_PAYMENTS_API_KEY length:", dodoApiKey?.length || 0);
    console.log("- DODO_PAYMENTS_API_KEY first 10 chars:", dodoApiKey?.substring(0, 10) || 'MISSING');
    console.log("- DODO_WEBHOOK_URL:", dodoWebhookUrl || 'MISSING');
    
    if (!dodoApiKey) {
      return new Response(JSON.stringify({
        error: "DODO_PAYMENTS_API_KEY not found",
        debug: "Environment variable missing"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      });
    }
    
    // Step 2: Test raw API key
    console.log("\nRaw API Key Analysis:");
    const rawBytes = new TextEncoder().encode(dodoApiKey);
    console.log("- Raw bytes length:", rawBytes.length);
    console.log("- Contains non-ASCII:", rawBytes.some(b => b > 127));
    console.log("- Contains null bytes:", rawBytes.includes(0));
    
    // Step 3: Test different sanitization methods
    const methods = {
      original: dodoApiKey,
      trimmed: dodoApiKey.trim(),
      alphanumeric: dodoApiKey.trim().replace(/[^\w\-\.]/g, ''),
      base64safe: dodoApiKey.trim().replace(/[^A-Za-z0-9\-_]/g, ''),
      minimal: dodoApiKey.trim().replace(/[^\x20-\x7E]/g, ''),
    };
    
    console.log("\nSanitization Methods:");
    for (const [name, value] of Object.entries(methods)) {
      console.log(`- ${name}: "${value}" (length: ${value.length})`);
    }
    
    // Step 4: Test header construction with different methods
    const headerTests = {};
    
    for (const [methodName, apiKey] of Object.entries(methods)) {
      try {
        // Method 1: Direct object
        const directHeaders = {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        };
        
        // Method 2: New Headers()
        const newHeaders = new Headers();
        newHeaders.set("Authorization", `Bearer ${apiKey}`);
        newHeaders.set("Content-Type", "application/json");
        
        // Method 3: Headers constructor with object
        const constructorHeaders = new Headers({
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        });
        
        headerTests[methodName] = {
          direct: "✅ SUCCESS",
          newHeaders: "✅ SUCCESS",
          constructor: "✅ SUCCESS"
        };
        
      } catch (error) {
        headerTests[methodName] = {
          error: error.message
        };
      }
    }
    
    console.log("\nHeader Construction Tests:");
    console.log(JSON.stringify(headerTests, null, 2));
    
    // Step 5: Test actual Dodo API call with best method
    const bestApiKey = methods.base64safe; // Most restrictive
    
    console.log("\nTesting Dodo API call with best method...");
    
    try {
      const headers = new Headers();
      headers.set("Authorization", `Bearer ${bestApiKey}`);
      headers.set("Content-Type", "application/json");
      
      const testPayload = {
        amount: 100,
        currency: "USD",
        description: "Test payment debug",
        success_url: "https://sproutcv.com/success",
        cancel_url: "https://sproutcv.com/cancel",
        webhook_url: dodoWebhookUrl || "https://yucdpvnmcuokemhqpnvz.supabase.co/functions/v1/dodo-webhook"
      };
      
      console.log("Calling Dodo API...");
      const response = await fetch("https://api.dodopayments.com/v1/payments", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(testPayload)
      });
      
      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log("Response body:", responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { raw: responseText };
      }
      
      return new Response(JSON.stringify({
        success: true,
        environment: {
          hasApiKey: !!dodoApiKey,
          apiKeyLength: dodoApiKey?.length,
          webhookUrl: dodoWebhookUrl
        },
        sanitization: methods,
        headerTests,
        dodoApiCall: {
          status: response.status,
          success: response.ok,
          data: responseData
        },
        recommendation: response.ok ? "API call successful!" : "API call failed - check API key or endpoint"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      });
      
    } catch (apiError) {
      console.error("Dodo API call failed:", apiError);
      
      return new Response(JSON.stringify({
        success: false,
        environment: {
          hasApiKey: !!dodoApiKey,
          apiKeyLength: dodoApiKey?.length,
          webhookUrl: dodoWebhookUrl
        },
        sanitization: methods,
        headerTests,
        dodoApiCall: {
          error: apiError.message,
          stack: apiError.stack
        },
        recommendation: "Fix API key format or check Dodo API endpoint"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      });
    }
    
  } catch (error) {
    console.error("Debug function error:", error);
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
