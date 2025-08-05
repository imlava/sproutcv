
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Get the proper domain for links
const getDomain = (origin: string | null) => {
  if (origin && origin.includes('localhost')) {
    return 'http://localhost:5173'; // Development
  }
  return 'https://sproutcv.app'; // Production
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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user exists
    const { data: user, error: userError } = await supabaseClient.auth.admin.getUserByEmail(email);
    
    if (userError || !user.user) {
      // Don't reveal if user exists or not for security
      return new Response(JSON.stringify({ 
        message: "If an account with this email exists, you will receive a password reset link",
        success: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Generate password reset link
    const domain = getDomain(req.headers.get("origin"));
    const resetLink = `${domain}/reset-password?token=RESET_TOKEN&email=${encodeURIComponent(email)}`;

    // Initialize Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    // Send password reset email
    const emailResponse = await resend.emails.send({
      from: "SproutCV <noreply@sproutcv.app>",
      to: [email],
      subject: "Reset Your SproutCV Password",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Reset Your Password</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #1f2937; font-size: 28px; margin: 0; font-weight: 700;">Reset Your Password</h1>
                <div style="width: 60px; height: 4px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); margin: 16px auto; border-radius: 2px;"></div>
              </div>
              
              <div style="margin-bottom: 32px;">
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                  Hi there,
                </p>
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                  We received a request to reset your password for your SproutCV account. Click the button below to create a new password.
                </p>
                
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${resetLink}" 
                     style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                            color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; 
                            font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                    Reset Password
                  </a>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                  If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
                </p>
                
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 16px 0 0 0;">
                  This link will expire in 24 hours for security reasons.
                </p>
              </div>
              
              <div style="text-align: center; border-top: 1px solid #e5e7eb; padding-top: 24px;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                  SproutCV - AI-Powered Resume Analysis<br>
                  Need help? Contact us at <a href="mailto:support@sproutcv.app" style="color: #10b981;">support@sproutcv.app</a><br>
                  This email was sent to ${email}
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
      message: "Password reset email sent successfully",
      success: true
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
