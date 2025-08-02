
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

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

    // Initialize Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if user exists
    const { data: userData } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, failed_login_attempts, locked_until")
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
        event_type: "password_reset_request",
        metadata: {
          email: email,
          reset_token_generated: true
        },
        ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip")
      });

    // Create reset link
    const resetLink = `${req.headers.get("origin")}/reset-password?token=${token}`;
    
    // Send email using Resend with noreply address
    const emailResponse = await resend.emails.send({
      from: "SproutCV <noreply@sproutcv.app>",
      to: [email],
      subject: "Reset Your Password - SproutCV",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Password Reset</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #1f2937; font-size: 28px; margin: 0; font-weight: 700;">Reset Your Password</h1>
              </div>
              
              <div style="margin-bottom: 32px;">
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                  Hi ${userData.full_name || 'there'},
                </p>
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                  We received a request to reset your password for your SproutCV account. Click the button below to create a new password:
                </p>
                
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${resetLink}" 
                     style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                            color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; 
                            font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                    Reset Password
                  </a>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 24px 0 0 0;">
                  This link will expire in 1 hour for security reasons. If you didn't request this password reset, you can safely ignore this email.
                </p>
                
                <div style="border-top: 1px solid #e5e7eb; margin-top: 32px; padding-top: 24px;">
                  <p style="color: #9ca3af; font-size: 12px; line-height: 1.4; margin: 0;">
                    If the button above doesn't work, copy and paste this link into your browser:<br>
                    <a href="${resetLink}" style="color: #10b981; word-break: break-all;">${resetLink}</a>
                  </p>
                </div>
              </div>
              
              <div style="text-align: center; border-top: 1px solid #e5e7eb; padding-top: 24px;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                  SproutCV - AI-Powered Resume Analysis<br>
                  This email was sent to ${email}<br>
                  Need help? Contact us at <a href="mailto:support@sproutcv.app" style="color: #10b981;">support@sproutcv.app</a>
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Password reset email sent:", emailResponse);

    return new Response(JSON.stringify({ 
      message: "If an account with that email exists, we've sent a password reset link.",
      emailSent: true
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
