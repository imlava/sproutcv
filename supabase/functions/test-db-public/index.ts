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
    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Test database schema
    console.log("Testing database schema...");

    // Check if payments table exists and get its structure
    const { data: paymentsData, error: paymentsError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .limit(1);

    console.log("Payments table test:", { data: paymentsData, error: paymentsError });

    // Check if profiles table exists
    const { data: profilesData, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .limit(1);

    console.log("Profiles table test:", { data: profilesData, error: profilesError });

    // Check if security_events table exists
    const { data: securityData, error: securityError } = await supabaseAdmin
      .from("security_events")
      .select("*")
      .limit(1);

    console.log("Security events table test:", { data: securityData, error: securityError });

    // Try to insert a test record to check column structure
    const testPayment = {
      user_id: "00000000-0000-0000-0000-000000000000", // Test UUID
      stripe_session_id: "test_session",
      amount: 100,
      credits_purchased: 1,
      status: "test"
    };

    const { data: insertData, error: insertError } = await supabaseAdmin
      .from("payments")
      .insert(testPayment)
      .select();

    console.log("Insert test:", { data: insertData, error: insertError });

    // Clean up test record
    if (insertData) {
      await supabaseAdmin
        .from("payments")
        .delete()
        .eq("stripe_session_id", "test_session");
    }

    return new Response(JSON.stringify({ 
      success: true,
      payments: { data: paymentsData, error: paymentsError },
      profiles: { data: profilesData, error: profilesError },
      security_events: { data: securityData, error: securityError },
      insert_test: { data: insertData, error: insertError },
      message: "Database schema test completed"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Database test error:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}); 