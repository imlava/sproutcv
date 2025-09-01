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
    console.log("=== ENVIRONMENT CHECK START ===");
    
    // Check all environment variables that our functions need
    const envCheck = {
      SUPABASE_URL: {
        exists: !!Deno.env.get("SUPABASE_URL"),
        value: Deno.env.get("SUPABASE_URL")?.substring(0, 30) + "..." || "missing"
      },
      SUPABASE_SERVICE_ROLE_KEY: {
        exists: !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
        length: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.length || 0,
        starts: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.substring(0, 10) || "missing"
      },
      SUPABASE_ANON_KEY: {
        exists: !!Deno.env.get("SUPABASE_ANON_KEY"),
        length: Deno.env.get("SUPABASE_ANON_KEY")?.length || 0,
        starts: Deno.env.get("SUPABASE_ANON_KEY")?.substring(0, 10) || "missing"
      },
      DODO_PAYMENTS_API_KEY: {
        exists: !!Deno.env.get("DODO_PAYMENTS_API_KEY"),
        length: Deno.env.get("DODO_PAYMENTS_API_KEY")?.length || 0,
        starts: Deno.env.get("DODO_PAYMENTS_API_KEY")?.substring(0, 10) || "missing"
      },
      OPENAI_API_KEY: {
        exists: !!Deno.env.get("OPENAI_API_KEY"),
        length: Deno.env.get("OPENAI_API_KEY")?.length || 0,
        starts: Deno.env.get("OPENAI_API_KEY")?.substring(0, 10) || "missing"
      }
    };
    
    // Check other environment info
    const runtimeInfo = {
      deno_version: Deno.version.deno,
      v8_version: Deno.version.v8,
      typescript_version: Deno.version.typescript,
      timestamp: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
    
    // Count missing critical variables
    const criticalVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
    const missingCritical = criticalVars.filter(key => !envCheck[key as keyof typeof envCheck].exists);
    
    const paymentVars = ['DODO_PAYMENTS_API_KEY'];
    const missingPayment = paymentVars.filter(key => !envCheck[key as keyof typeof envCheck].exists);
    
    const aiVars = ['OPENAI_API_KEY'];
    const missingAI = aiVars.filter(key => !envCheck[key as keyof typeof envCheck].exists);
    
    console.log("Environment check complete");
    console.log("Missing critical:", missingCritical);
    console.log("Missing payment:", missingPayment);
    console.log("Missing AI:", missingAI);
    
    return new Response(JSON.stringify({
      success: missingCritical.length === 0,
      environment_variables: envCheck,
      runtime_info: runtimeInfo,
      issues: {
        missing_critical: missingCritical,
        missing_payment: missingPayment,
        missing_ai: missingAI
      },
      recommendations: [
        ...(missingCritical.length > 0 ? [`Set missing critical variables: ${missingCritical.join(', ')}`] : []),
        ...(missingPayment.length > 0 ? [`Set missing payment variables: ${missingPayment.join(', ')}`] : []),
        ...(missingAI.length > 0 ? [`Set missing AI variables: ${missingAI.join(', ')}`] : [])
      ]
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error) {
    console.error("=== ENV CHECK ERROR ===", error);
    return new Response(JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
