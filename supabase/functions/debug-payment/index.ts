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
    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify user authentication
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }

    const user = userData.user;
    console.log("User authenticated:", user.id);

    // Test database operations step by step
    const results = {};

    // 1. Test profiles table
    try {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("full_name, email, credits")
        .eq("id", user.id)
        .single();
      
      results.profile = { data: profile, error: profileError };
      console.log("Profile test:", { data: profile, error: profileError });
    } catch (error) {
      results.profile = { data: null, error: error.message };
      console.log("Profile test error:", error.message);
    }

    // 2. Test payments table structure
    try {
      const { data: payments, error: paymentsError } = await supabaseAdmin
        .from("payments")
        .select("*")
        .limit(1);
      
      results.payments = { data: payments, error: paymentsError };
      console.log("Payments test:", { data: payments, error: paymentsError });
    } catch (error) {
      results.payments = { data: null, error: error.message };
      console.log("Payments test error:", error.message);
    }

    // 3. Test inserting a payment record
    try {
      const testPayment = {
        user_id: user.id,
        stripe_session_id: `debug_${Date.now()}`,
        amount: 100,
        credits_purchased: 1,
        status: "debug"
      };

      const { data: insertData, error: insertError } = await supabaseAdmin
        .from("payments")
        .insert(testPayment)
        .select();

      results.insert = { data: insertData, error: insertError };
      console.log("Insert test:", { data: insertData, error: insertError });

      // Clean up
      if (insertData) {
        await supabaseAdmin
          .from("payments")
          .delete()
          .eq("stripe_session_id", testPayment.stripe_session_id);
      }
    } catch (error) {
      results.insert = { data: null, error: error.message };
      console.log("Insert test error:", error.message);
    }

    // 4. Test security_events table
    try {
      const { data: security, error: securityError } = await supabaseAdmin
        .from("security_events")
        .select("*")
        .limit(1);
      
      results.security = { data: security, error: securityError };
      console.log("Security test:", { data: security, error: securityError });
    } catch (error) {
      results.security = { data: null, error: error.message };
      console.log("Security test error:", error.message);
    }

    return new Response(JSON.stringify({ 
      success: true,
      user: { id: user.id, email: user.email },
      results,
      message: "Debug completed"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Debug error:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}); 