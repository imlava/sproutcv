import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("=== ULTRA SIMPLE TEST START ===");
  
  if (req.method === "OPTIONS") {
    console.log("OPTIONS request");
    return new Response(null, { headers: corsHeaders });
  }

  console.log("POST request received");
  
  return new Response(JSON.stringify({
    success: true,
    message: "Ultra simple test working",
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
