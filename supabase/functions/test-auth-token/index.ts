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
    console.log("=== AUTH TOKEN TESTING START ===");
    
    // Step 1: Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !serviceKey) {
      throw new Error("Missing environment variables");
    }
    
    console.log("✓ Environment variables present");
    
    // Step 2: Check authorization header
    const authHeader = req.headers.get("Authorization");
    console.log("Auth header exists:", !!authHeader);
    console.log("Auth header format:", authHeader?.substring(0, 20) + "...");
    
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({
        error: "Missing or invalid Authorization header",
        hasHeader: !!authHeader,
        headerStart: authHeader?.substring(0, 10),
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    
    // Step 3: Extract token
    const token = authHeader.replace("Bearer ", "");
    console.log("Token length:", token.length);
    console.log("Token start:", token.substring(0, 20));
    
    // Step 4: Try to create Supabase client and validate token
    const supabase = createClient(supabaseUrl, serviceKey);
    console.log("✓ Supabase client created");
    
    // Step 5: Try to get user with different methods
    const results = [];
    
    // Method 1: Direct auth.getUser()
    try {
      const { data, error } = await supabase.auth.getUser(token);
      results.push({
        method: "supabase.auth.getUser(token)",
        success: !error && !!data.user,
        error: error?.message,
        userId: data.user?.id,
        userEmail: data.user?.email
      });
      console.log("Method 1 result:", results[0]);
    } catch (err) {
      results.push({
        method: "supabase.auth.getUser(token)",
        success: false,
        error: err.message,
        userId: null,
        userEmail: null
      });
    }
    
    // Method 2: Try with Authorization header set
    try {
      const supabaseWithAuth = createClient(supabaseUrl, serviceKey, {
        global: {
          headers: {
            Authorization: authHeader
          }
        }
      });
      
      const { data, error } = await supabaseWithAuth.auth.getUser();
      results.push({
        method: "supabaseWithAuth.auth.getUser()",
        success: !error && !!data.user,
        error: error?.message,
        userId: data.user?.id,
        userEmail: data.user?.email
      });
      console.log("Method 2 result:", results[1]);
    } catch (err) {
      results.push({
        method: "supabaseWithAuth.auth.getUser()",
        success: false,
        error: err.message,
        userId: null,
        userEmail: null
      });
    }
    
    // Method 3: Try JWT decode
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      results.push({
        method: "JWT decode",
        success: true,
        error: null,
        userId: payload.sub,
        userEmail: payload.email,
        exp: payload.exp,
        iat: payload.iat,
        role: payload.role
      });
      console.log("Method 3 result:", results[2]);
    } catch (err) {
      results.push({
        method: "JWT decode",
        success: false,
        error: err.message,
        userId: null,
        userEmail: null
      });
    }
    
    const successfulMethod = results.find(r => r.success);
    
    return new Response(JSON.stringify({
      success: !!successfulMethod,
      authHeader: {
        present: !!authHeader,
        format: authHeader?.startsWith("Bearer "),
        length: authHeader?.length
      },
      token: {
        length: token.length,
        parts: token.split('.').length,
        validJWT: token.split('.').length === 3
      },
      results,
      recommendation: successfulMethod ? 
        `Use ${successfulMethod.method}` : 
        "Token appears to be invalid or expired",
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error) {
    console.error("=== AUTH TEST ERROR ===", error);
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
