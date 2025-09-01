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
    console.log("=== PAYMENT DIAGNOSTIC START ===");
    
    const steps = [];
    
    // STEP 1: Check request
    steps.push({ step: 1, name: "Request received", status: "success", timestamp: new Date().toISOString() });
    
    // STEP 2: Parse body
    try {
      const body = await req.json();
      steps.push({ step: 2, name: "Body parsed", status: "success", data: body });
    } catch (parseError) {
      steps.push({ step: 2, name: "Body parse failed", status: "error", error: parseError.message });
      throw parseError;
    }
    
    // STEP 3: Check environment variables
    const envVars = {
      SUPABASE_URL: !!Deno.env.get("SUPABASE_URL"),
      SUPABASE_SERVICE_ROLE_KEY: !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
      DODO_PAYMENTS_API_KEY: !!Deno.env.get("DODO_PAYMENTS_API_KEY")
    };
    steps.push({ step: 3, name: "Environment check", status: "success", data: envVars });
    
    // STEP 4: Test Supabase import
    try {
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.45.0");
      steps.push({ step: 4, name: "Supabase import", status: "success" });
      
      // STEP 5: Test Supabase client creation
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://yucdpvnmcuokemhqpnvz.supabase.co";
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        
        if (serviceKey) {
          const supabase = createClient(supabaseUrl, serviceKey);
          steps.push({ step: 5, name: "Supabase client created", status: "success" });
          
          // STEP 6: Test auth
          try {
            const authHeader = req.headers.get("Authorization");
            if (authHeader?.startsWith("Bearer ")) {
              const token = authHeader.replace("Bearer ", "");
              const { data, error } = await supabase.auth.getUser(token);
              
              if (error) {
                steps.push({ step: 6, name: "Auth test", status: "error", error: error.message });
              } else {
                steps.push({ step: 6, name: "Auth test", status: "success", data: { userId: data.user?.id } });
              }
            } else {
              steps.push({ step: 6, name: "Auth test", status: "skipped", reason: "No auth header" });
            }
          } catch (authError) {
            steps.push({ step: 6, name: "Auth test", status: "error", error: authError.message });
          }
        } else {
          steps.push({ step: 5, name: "Supabase client", status: "error", error: "No service key" });
        }
      } catch (clientError) {
        steps.push({ step: 5, name: "Supabase client creation", status: "error", error: clientError.message });
      }
    } catch (importError) {
      steps.push({ step: 4, name: "Supabase import", status: "error", error: importError.message });
    }
    
    // STEP 7: Test fetch capability
    try {
      const testResponse = await fetch("https://httpbin.org/get", { 
        method: "GET",
        headers: { "User-Agent": "SproutCV-Diagnostic" }
      });
      steps.push({ step: 7, name: "External fetch test", status: testResponse.ok ? "success" : "error" });
    } catch (fetchError) {
      steps.push({ step: 7, name: "External fetch test", status: "error", error: fetchError.message });
    }
    
    // STEP 8: Test Dodo API connectivity
    const dodoApiKey = Deno.env.get("DODO_PAYMENTS_API_KEY");
    if (dodoApiKey) {
      try {
        const dodoResponse = await fetch("https://api.sandbox.dodopayments.com/v1/ping", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${dodoApiKey}`,
            "User-Agent": "SproutCV-Diagnostic"
          }
        });
        steps.push({ 
          step: 8, 
          name: "Dodo API test", 
          status: dodoResponse.ok ? "success" : "partial",
          data: { statusCode: dodoResponse.status }
        });
      } catch (dodoError) {
        steps.push({ step: 8, name: "Dodo API test", status: "error", error: dodoError.message });
      }
    } else {
      steps.push({ step: 8, name: "Dodo API test", status: "skipped", reason: "No API key" });
    }
    
    console.log("=== DIAGNOSTIC COMPLETE ===");
    console.log("Steps completed:", steps.length);
    
    const successCount = steps.filter(s => s.status === "success").length;
    const errorCount = steps.filter(s => s.status === "error").length;
    
    return new Response(JSON.stringify({
      success: true,
      diagnostic: "complete",
      summary: {
        totalSteps: steps.length,
        successful: successCount,
        errors: errorCount,
        successRate: Math.round((successCount / steps.length) * 100)
      },
      steps,
      timestamp: new Date().toISOString(),
      recommendation: errorCount === 0 ? "All systems operational" : "Issues detected - see steps"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error) {
    console.error("=== DIAGNOSTIC ERROR ===", error);
    
    return new Response(JSON.stringify({
      success: false,
      diagnostic: "failed",
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200, // Return 200 even on error for diagnostic purposes
    });
  }
});
