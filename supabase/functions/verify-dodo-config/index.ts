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
        error: "Dodo Payments API key not configured",
        configured: false
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log("Testing Dodo Payments configuration...");

    // Test API connectivity - Use the same endpoint as our working functions
    const response = await fetch("https://live.dodopayments.com/products", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${dodoApiKey}`,
        "Content-Type": "application/json"
      }
    });

    const responseData = await response.json();
    
    console.log("Dodo API response:", {
      status: response.status,
      ok: response.ok,
      data: responseData
    });

    // Check for products
    const products = responseData.data || responseData.products || [];
    const productIds = products.map((p: any) => p.id || p.product_id);

    // Check for configured product secrets
    const secrets = {
      "5_credits": Deno.env.get("DODO_PRODUCT_ID_5_CREDITS"),
      "15_credits": Deno.env.get("DODO_PRODUCT_ID_15_CREDITS"), 
      "30_credits": Deno.env.get("DODO_PRODUCT_ID_30_CREDITS")
    };

    return new Response(JSON.stringify({
      configured: true,
      api_key_prefix: dodoApiKey.substring(0, 8) + "...",
      api_status: response.ok ? "connected" : "failed",
      api_response_status: response.status,
      products_found: products.length,
      product_ids: productIds,
      configured_secrets: secrets,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Dodo config verification error:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      configured: false,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});