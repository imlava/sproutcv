import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== NUCLEAR DEBUG START ===");
    
    // Log ALL environment variables
    const envVars = {};
    for (const key of ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_ANON_KEY", "DODO_PAYMENTS_API_KEY", "OPENAI_API_KEY"]) {
      const value = Deno.env.get(key);
      envVars[key] = {
        exists: !!value,
        length: value?.length || 0,
        start: value?.substring(0, 10) || "N/A"
      };
    }
    console.log("Environment variables:", envVars);

    // Log ALL request headers
    const headers = {};
    for (const [key, value] of req.headers.entries()) {
      headers[key] = key.toLowerCase().includes('auth') || key.toLowerCase().includes('key') 
        ? value.substring(0, 20) + "..." 
        : value;
    }
    console.log("Request headers:", headers);

    // Check authorization specifically
    const authHeader = req.headers.get("Authorization");
    const authAnalysis = {
      exists: !!authHeader,
      format: authHeader?.startsWith("Bearer "),
      length: authHeader?.length || 0,
      tokenStart: authHeader?.replace("Bearer ", "").substring(0, 20) || "N/A"
    };
    console.log("Auth analysis:", authAnalysis);

    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({
        error: "Missing or invalid Authorization header",
        authAnalysis,
        headers,
        envVars,
        suggestion: "Frontend should send 'Authorization: Bearer <jwt_token>'"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Try to create Supabase clients
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    const results = [];

    // Test 1: Service Role Key approach
    if (supabaseUrl && serviceKey) {
      try {
        console.log("Testing with Service Role Key...");
        const supabaseAdmin = createClient(supabaseUrl, serviceKey);
        const { data, error } = await supabaseAdmin.auth.getUser(token);
        
        results.push({
          method: "Service Role Key",
          success: !error && !!data.user,
          error: error?.message,
          userId: data.user?.id,
          userEmail: data.user?.email
        });
        console.log("Service Role result:", results[results.length - 1]);
      } catch (err) {
        results.push({
          method: "Service Role Key",
          success: false,
          error: err.message,
          userId: null,
          userEmail: null
        });
      }
    }

    // Test 2: Anon Key approach
    if (supabaseUrl && anonKey) {
      try {
        console.log("Testing with Anon Key...");
        const supabaseAnon = createClient(supabaseUrl, anonKey);
        const { data, error } = await supabaseAnon.auth.getUser(token);
        
        results.push({
          method: "Anon Key",
          success: !error && !!data.user,
          error: error?.message,
          userId: data.user?.id,
          userEmail: data.user?.email
        });
        console.log("Anon Key result:", results[results.length - 1]);
      } catch (err) {
        results.push({
          method: "Anon Key",
          success: false,
          error: err.message,
          userId: null,
          userEmail: null
        });
      }
    }

    // Test 3: Direct JWT decode
    try {
      console.log("Testing direct JWT decode...");
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        const now = Math.floor(Date.now() / 1000);
        
        results.push({
          method: "Direct JWT Decode",
          success: payload.exp > now && !!payload.sub,
          error: payload.exp <= now ? "Token expired" : null,
          userId: payload.sub,
          userEmail: payload.email || payload.user_metadata?.email,
          exp: payload.exp,
          iat: payload.iat,
          iss: payload.iss,
          role: payload.role
        });
        console.log("JWT decode result:", results[results.length - 1]);
      } else {
        results.push({
          method: "Direct JWT Decode",
          success: false,
          error: "Invalid JWT format",
          userId: null,
          userEmail: null
        });
      }
    } catch (err) {
      results.push({
        method: "Direct JWT Decode",
        success: false,
        error: err.message,
        userId: null,
        userEmail: null
      });
    }

    // Test 4: Manual JWT verification
    try {
      console.log("Testing manual JWT verification...");
      const parts = token.split('.');
      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));
      
      results.push({
        method: "Manual JWT Analysis",
        success: true,
        error: null,
        header,
        payload: {
          ...payload,
          // Mask sensitive data
          email: payload.email?.substring(0, 3) + "***" || "N/A",
          user_metadata: payload.user_metadata ? "present" : "absent"
        }
      });
    } catch (err) {
      results.push({
        method: "Manual JWT Analysis",
        success: false,
        error: err.message
      });
    }

    const successfulMethods = results.filter(r => r.success);
    
    console.log("=== NUCLEAR DEBUG COMPLETE ===");
    console.log("Successful methods:", successfulMethods.length);

    return new Response(JSON.stringify({
      success: successfulMethods.length > 0,
      environment: envVars,
      request: {
        method: req.method,
        url: req.url,
        headers: headers
      },
      authentication: {
        header: authAnalysis,
        results: results,
        successfulMethods: successfulMethods.length,
        recommendation: successfulMethods.length > 0 
          ? `Use ${successfulMethods[0].method}` 
          : "All authentication methods failed"
      },
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("=== NUCLEAR DEBUG ERROR ===", error);
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
