
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
    const { token, newPassword } = await req.json();

    console.log("Password reset request received");

    if (!token || !newPassword) {
      throw new Error("Token and new password are required");
    }

    // Validate password strength
    if (newPassword.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }

    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Hash the token to find it in database (same way as forgot-password function)
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const tokenHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    console.log("Looking for token hash:", tokenHash);

    // Find valid reset token
    const { data: resetToken, error: tokenError } = await supabaseAdmin
      .from("password_reset_tokens")
      .select("user_id, expires_at, used_at")
      .eq("token_hash", tokenHash)
      .single();

    console.log("Token lookup result:", { resetToken, tokenError });

    if (!resetToken || tokenError) {
      throw new Error("Invalid or expired reset token");
    }

    if (resetToken.used_at) {
      throw new Error("Reset token has already been used");
    }

    if (new Date(resetToken.expires_at) < new Date()) {
      throw new Error("Reset token has expired");
    }

    console.log("Token validated, updating password for user:", resetToken.user_id);

    // Reset the user's password using Supabase Auth
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      resetToken.user_id,
      { password: newPassword }
    );

    if (updateError) {
      console.error("Password update error:", updateError);
      throw new Error("Failed to update password: " + updateError.message);
    }

    console.log("Password updated successfully");

    // Mark token as used
    await supabaseAdmin
      .from("password_reset_tokens")
      .update({
        used_at: new Date().toISOString()
      })
      .eq("token_hash", tokenHash);

    // Update profile
    await supabaseAdmin
      .from("profiles")
      .update({
        password_changed_at: new Date().toISOString(),
        failed_login_attempts: 0,
        locked_until: null
      })
      .eq("id", resetToken.user_id);

    // Log security event
    await supabaseAdmin
      .from("security_events")
      .insert({
        user_id: resetToken.user_id,
        event_type: "password_change",
        metadata: {
          reset_via_token: true,
          password_strength: newPassword.length >= 12 ? "strong" : "medium"
        },
        ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip")
      });

    console.log("Password reset completed successfully");

    return new Response(JSON.stringify({ 
      message: "Password has been reset successfully. You can now sign in with your new password." 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Password reset error:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "An error occurred during password reset"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
