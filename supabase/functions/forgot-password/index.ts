
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
    const { email } = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if user exists
    const { data: userData } = await supabaseAdmin
      .from("profiles")
      .select("id, email, failed_login_attempts, locked_until")
      .eq("email", email)
      .single();

    if (!userData) {
      // Return success even if user doesn't exist (security best practice)
      return new Response(JSON.stringify({ 
        message: "If an account with that email exists, we've sent a password reset link." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check if account is locked
    if (userData.locked_until && new Date(userData.locked_until) > new Date()) {
      const lockTimeRemaining = Math.ceil((new Date(userData.locked_until).getTime() - Date.now()) / (1000 * 60));
      throw new Error(`Account is temporarily locked. Please try again in ${lockTimeRemaining} minutes.`);
    }

    // Generate secure token
    const crypto = await import("node:crypto");
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    // Store reset token
    await supabaseAdmin
      .from("password_reset_tokens")
      .insert({
        user_id: userData.id,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip")
      });

    // Log security event
    await supabaseAdmin
      .from("security_events")
      .insert({
        user_id: userData.id,
        event_type: "password_reset",
        metadata: {
          email: email,
          reset_token_generated: true
        },
        ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip")
      });

    // In a real app, you would send this via email service
    // For now, we'll return it (remove this in production)
    const resetLink = `${req.headers.get("origin")}/reset-password?token=${token}`;
    
    console.log("Password reset link:", resetLink);

    return new Response(JSON.stringify({ 
      message: "If an account with that email exists, we've sent a password reset link.",
      // Remove this in production:
      resetLink: resetLink
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Password reset error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
