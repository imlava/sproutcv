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

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }

    const user = userData.user;

    // Test database connection
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email, credits")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      throw new Error("Failed to fetch user profile");
    }

    // Test payments table
    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from("payments")
      .select("id, user_id, amount, credits_purchased, status")
      .eq("user_id", user.id)
      .limit(5);

    if (paymentsError) {
      console.error("Payments fetch error:", paymentsError);
      throw new Error("Failed to fetch payments");
    }

    return new Response(JSON.stringify({ 
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      profile: {
        full_name: profile.full_name,
        email: profile.email,
        credits: profile.credits
      },
      payments: payments,
      message: "Payment system is working correctly"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Test payment error:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}); 