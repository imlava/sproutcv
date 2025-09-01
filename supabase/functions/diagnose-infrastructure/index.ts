import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("=== INFRASTRUCTURE DIAGNOSTIC START ===");
  
  if (req.method === "OPTIONS") {
    console.log("OPTIONS request received");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Diagnostic function starting...");
    
    // STEP 1: Basic environment check
    const envCheck = {
      supabaseUrl: !!Deno.env.get("SUPABASE_URL"),
      serviceKey: !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
      dodoApiKey: !!Deno.env.get("DODO_PAYMENTS_API_KEY"),
      openaiKey: !!Deno.env.get("OPENAI_API_KEY"),
      nodeEnv: Deno.env.get("NODE_ENV") || "unknown",
      denoVersion: Deno.version.deno
    };
    
    console.log("Environment check:", envCheck);
    
    // STEP 2: Check request details
    const requestInfo = {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries()),
      timestamp: new Date().toISOString()
    };
    
    console.log("Request info:", requestInfo);
    
    // STEP 3: Try to parse body (if any)
    let bodyInfo = { hasBody: false, parsed: null, raw: null };
    try {
      const rawBody = await req.text();
      bodyInfo.hasBody = !!rawBody;
      bodyInfo.raw = rawBody?.substring(0, 200);
      
      if (rawBody) {
        try {
          bodyInfo.parsed = JSON.parse(rawBody);
        } catch {
          bodyInfo.parsed = "Invalid JSON";
        }
      }
    } catch (bodyError) {
      console.error("Body parsing error:", bodyError);
      bodyInfo.parsed = `Error: ${bodyError.message}`;
    }
    
    console.log("Body info:", bodyInfo);
    
    // STEP 4: Test Supabase client creation
    let supabaseTest = { canCreate: false, error: null };
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      
      if (supabaseUrl && serviceKey) {
        const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.45.0");
        const supabase = createClient(supabaseUrl, serviceKey);
        supabaseTest.canCreate = true;
        console.log("Supabase client created successfully");
      } else {
        supabaseTest.error = "Missing environment variables";
      }
    } catch (error) {
      supabaseTest.error = error.message;
      console.error("Supabase client error:", error);
    }
    
    // STEP 5: Test external API connectivity
    let connectivityTest = { canFetch: false, error: null };
    try {
      const response = await fetch("https://httpbin.org/get", {
        method: "GET",
        headers: { "User-Agent": "SproutCV-Diagnostic" }
      });
      connectivityTest.canFetch = response.ok;
      console.log("External connectivity test:", response.ok);
    } catch (error) {
      connectivityTest.error = error.message;
      console.error("Connectivity test error:", error);
    }
    
    // STEP 6: Return comprehensive diagnostic
    const diagnostic = {
      success: true,
      timestamp: new Date().toISOString(),
      runtime: "edge-function",
      environment: envCheck,
      request: requestInfo,
      body: bodyInfo,
      supabase: supabaseTest,
      connectivity: connectivityTest,
      diagnosticVersion: "1.0.0"
    };
    
    console.log("=== DIAGNOSTIC COMPLETE ===");
    console.log("Diagnostic result:", JSON.stringify(diagnostic, null, 2));
    
    return new Response(JSON.stringify(diagnostic), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error) {
    console.error("=== DIAGNOSTIC ERROR ===", error);
    
    const errorDiagnostic = {
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      runtime: "edge-function-error"
    };
    
    return new Response(JSON.stringify(errorDiagnostic), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
