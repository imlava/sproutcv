
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
    const { userId, email, fullName } = await req.json();

    if (!userId || !email) {
      throw new Error("User ID and email are required");
    }

    // Initialize Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    // Send welcome email
    const emailResponse = await resend.emails.send({
      from: "SproutCV <noreply@sproutcv.app>",
      to: [email],
      subject: "Welcome to SproutCV - Your AI-Powered Resume Assistant!",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Welcome to SproutCV</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #1f2937; font-size: 28px; margin: 0; font-weight: 700;">Welcome to SproutCV!</h1>
                <div style="width: 60px; height: 4px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); margin: 16px auto; border-radius: 2px;"></div>
              </div>
              
              <div style="margin-bottom: 32px;">
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                  Hi ${fullName || 'there'},
                </p>
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                  Welcome to SproutCV! We're excited to help you create outstanding resumes that get you noticed by employers.
                </p>
                
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0;">
                  <h3 style="color: #065f46; margin: 0 0 12px 0; font-size: 18px;">🎉 You've received 5 free credits!</h3>
                  <p style="color: #047857; margin: 0; font-size: 14px;">
                    Use these credits to analyze and optimize your resume with our AI-powered tools.
                  </p>
                </div>
                
                <h3 style="color: #1f2937; margin: 24px 0 16px 0;">What you can do with SproutCV:</h3>
                <ul style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 8px;">📊 <strong>AI Resume Analysis:</strong> Get detailed feedback on your resume's effectiveness</li>
                  <li style="margin-bottom: 8px;">🎯 <strong>Job Description Matching:</strong> Tailor your resume to specific job requirements</li>
                  <li style="margin-bottom: 8px;">⚡ <strong>ATS Optimization:</strong> Ensure your resume passes Applicant Tracking Systems</li>
                  <li style="margin-bottom: 8px;">📄 <strong>Professional Export:</strong> Download polished, job-ready resumes</li>
                </ul>
                
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${req.headers.get("origin")}/dashboard" 
                     style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                            color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; 
                            font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                    Get Started Now
                  </a>
                </div>
              </div>
              
              <div style="text-align: center; border-top: 1px solid #e5e7eb; padding-top: 24px;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                  SproutCV - AI-Powered Resume Analysis<br>
                  Need help getting started? Contact us at <a href="mailto:support@sproutcv.app" style="color: #10b981;">support@sproutcv.app</a><br>
                  This email was sent to ${email}
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Welcome email sent:", emailResponse);

    return new Response(JSON.stringify({ 
      message: "Welcome email sent successfully",
      emailSent: true
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Welcome email error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
