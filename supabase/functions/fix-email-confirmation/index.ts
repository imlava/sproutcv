import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FixEmailRequest {
  email: string;
  adminPassword?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, adminPassword }: FixEmailRequest = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header to check if admin
    const authHeader = req.headers.get("authorization");
    let isAdminRequest = false;

    if (authHeader) {
      try {
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
          authHeader.replace("Bearer ", "")
        );

        if (!authError && user) {
          // Check if user is admin
          const { data: userRoles } = await supabaseClient
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .eq("role", "admin");

          isAdminRequest = !!(userRoles && userRoles.length > 0);
        }
      } catch (err) {
        console.log("Auth check failed, proceeding without admin verification");
      }
    }

    // Also check for admin password for direct access
    if (!isAdminRequest && adminPassword) {
      isAdminRequest = adminPassword === "SproutCV2024!Admin";
    }

    console.log(`Email confirmation fix requested for: ${email}`);
    console.log(`Admin request: ${isAdminRequest}`);

    // Use direct SQL to update auth.users table since RLS doesn't allow direct access
    const { data: result, error: updateError } = await supabaseClient.rpc('confirm_user_email', {
      user_email: email
    });

    if (updateError) {
      // Fallback: try to call the SQL function directly
      const { data: sqlResult, error: sqlError } = await supabaseClient
        .from('profiles')
        .select('id, email')
        .eq('email', email)
        .single();

      if (sqlError || !sqlResult) {
        throw new Error("User not found in profiles table");
      }

      // Use service role to update auth table directly via SQL
      const { error: directUpdateError } = await supabaseClient
        .rpc('admin_confirm_email_direct', {
          target_email: email
        });

      if (directUpdateError) {
        throw new Error(`Failed to confirm email: ${directUpdateError.message}`);
      }
    }

    if (updateError) {
      console.error("Error updating email confirmation:", updateError);
      throw new Error(`Failed to confirm email: ${updateError.message}`);
    }

    // Also update the profile if it exists
    const { error: profileUpdateError } = await supabaseClient
      .from("profiles")
      .update({
        email_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id);

    if (profileUpdateError) {
      console.warn("Could not update profile email verification:", profileUpdateError);
    }

    // Log the security event
    await supabaseClient
      .from("security_events")
      .insert({
        user_id: user.id,
        event_type: "email_confirmation_fixed",
        metadata: {
          email: email,
          fixed_by: isAdminRequest ? "admin" : "system",
          method: "manual_confirmation",
          original_created_at: user.created_at
        }
      });

    console.log(`✅ Email confirmed successfully for user: ${user.id}`);

    return new Response(JSON.stringify({
      success: true,
      message: "Email confirmed successfully",
      user: {
        id: user.id,
        email: user.email,
        confirmed_at: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Fix email confirmation error:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
