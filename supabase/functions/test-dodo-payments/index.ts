import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import DodoPayments from "https://esm.sh/dodopayments@1.44.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Testing Dodo Payments API connection...");

    const dodoApiKey = Deno.env.get("DODO_PAYMENTS_API_KEY");
    
    if (!dodoApiKey) {
      throw new Error("DODO_PAYMENTS_API_KEY not found");
    }

    console.log("API key found, length:", dodoApiKey.length);
    console.log("API key starts with:", dodoApiKey.substring(0, 10) + "...");

    // Test both environments
    const testModeClient = new DodoPayments({
      bearerToken: dodoApiKey,
      environment: 'test_mode'
    });

    const liveModeClient = new DodoPayments({
      bearerToken: dodoApiKey,
      environment: 'live_mode'
    });

    console.log("Clients created successfully");

    // Try a simple API call - list payments
    let testResult = null;
    let liveResult = null;

    try {
      console.log("Testing test mode...");
      testResult = await testModeClient.payments.list({ limit: 1 });
      console.log("Test mode SUCCESS");
    } catch (error) {
      console.log("Test mode ERROR:", error.message);
      testResult = { error: error.message };
    }

    try {
      console.log("Testing live mode...");
      liveResult = await liveModeClient.payments.list({ limit: 1 });
      console.log("Live mode SUCCESS");
    } catch (error) {
      console.log("Live mode ERROR:", error.message);
      liveResult = { error: error.message };
    }

    return new Response(JSON.stringify({
      success: true,
      apiKeyLength: dodoApiKey.length,
      apiKeyPrefix: dodoApiKey.substring(0, 10) + "...",
      testMode: testResult,
      liveMode: liveResult
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Test error:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});