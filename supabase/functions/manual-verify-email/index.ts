import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyEmailRequest {
  email: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: VerifyEmailRequest = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    console.log(`Manually verifying email for: ${email}`);

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Find the user in auth
    const { data: authUsers, error: getUserError } = await supabaseClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });

    if (getUserError) {
      throw new Error("Error checking user existence");
    }

    const authUser = authUsers.users.find(user => user.email === email);

    if (!authUser) {
      throw new Error("No account found with this email address");
    }

    // Update auth user to be confirmed
    const { error: authUpdateError } = await supabaseClient.auth.admin.updateUserById(
      authUser.id,
      { 
        email_confirm: true,
        updated_at: new Date().toISOString()
      }
    );

    if (authUpdateError) {
      console.error("Error updating auth user:", authUpdateError);
    }

    // Update user profile to mark email as verified
    const { error: profileUpdateError } = await supabaseClient
      .from("profiles")
      .update({
        email_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq("id", authUser.id);

    if (profileUpdateError) {
      console.error("Error updating profile:", profileUpdateError);
      throw new Error(`Failed to update user profile: ${profileUpdateError.message}`);
    }

    // Log the security event
    await supabaseClient
      .from("security_events")
      .insert({
        user_id: authUser.id,
        event_type: "email_manually_verified",
        metadata: {
          email: email,
          verified_at: new Date().toISOString(),
          method: "admin_verification"
        },
        severity: "info"
      });

    console.log(`✅ Email verified successfully for user: ${authUser.id}`);

    return new Response(JSON.stringify({
      success: true,
      message: "Email verified successfully",
      user: {
        id: authUser.id,
        email: authUser.email,
        verified_at: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Email verification error:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});