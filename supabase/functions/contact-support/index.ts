
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const { name, email, subject, message, type } = await req.json();

    if (!name || !email || !message) {
      throw new Error("Name, email, and message are required");
    }

    // Initialize Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    // Determine the support email based on type
    const supportEmail = type === 'general' ? 'hello@sproutcv.app' : 'support@sproutcv.app';
    const emailSubject = subject || `${type === 'general' ? 'General Inquiry' : 'Support Request'} from ${name}`;

    // Send email to support team
    const supportEmailResponse = await resend.emails.send({
      from: "SproutCV Contact Form <noreply@sproutcv.app>",
      to: [supportEmail],
      subject: emailSubject,
      replyTo: [email],
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Contact Form Submission</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <h1 style="color: #1f2937; font-size: 24px; margin: 0 0 24px 0;">New Contact Form Submission</h1>
              
              <div style="margin-bottom: 24px;">
                <p style="color: #374151; font-size: 16px; margin: 0 0 8px 0;"><strong>Name:</strong> ${name}</p>
                <p style="color: #374151; font-size: 16px; margin: 0 0 8px 0;"><strong>Email:</strong> ${email}</p>
                <p style="color: #374151; font-size: 16px; margin: 0 0 8px 0;"><strong>Type:</strong> ${type === 'general' ? 'General Inquiry' : 'Support Request'}</p>
                <p style="color: #374151; font-size: 16px; margin: 0 0 16px 0;"><strong>Subject:</strong> ${emailSubject}</p>
              </div>
              
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
                <p style="color: #374151; font-size: 16px; margin: 0; white-space: pre-wrap;">${message}</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    // Send confirmation email to user
    const confirmationEmailResponse = await resend.emails.send({
      from: "SproutCV Support <support@sproutcv.app>",
      to: [email],
      subject: "We received your message - SproutCV Support",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Message Received</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #1f2937; font-size: 28px; margin: 0; font-weight: 700;">Thank you for contacting us!</h1>
                <div style="width: 60px; height: 4px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); margin: 16px auto; border-radius: 2px;"></div>
              </div>
              
              <div style="margin-bottom: 32px;">
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                  Hi ${name},
                </p>
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                  We've received your ${type === 'general' ? 'inquiry' : 'support request'} and our team will get back to you within 24 hours.
                </p>
                
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0;">
                  <h3 style="color: #065f46; margin: 0 0 12px 0; font-size: 18px;">Your Message:</h3>
                  <p style="color: #047857; margin: 0; white-space: pre-wrap;">${message}</p>
                </div>
                
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                  In the meantime, you can check out our <a href="${req.headers.get("origin")}/how-it-works" style="color: #10b981;">how it works</a> page or continue optimizing your resume in your <a href="${req.headers.get("origin")}/dashboard" style="color: #10b981;">dashboard</a>.
                </p>
              </div>
              
              <div style="text-align: center; border-top: 1px solid #e5e7eb; padding-top: 24px;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                  SproutCV - AI-Powered Resume Analysis<br>
                  This email was sent to ${email}<br>
                  For urgent matters, email us directly at <a href="mailto:support@sproutcv.app" style="color: #10b981;">support@sproutcv.app</a>
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Support emails sent:", { supportEmailResponse, confirmationEmailResponse });

    return new Response(JSON.stringify({ 
      message: "Your message has been sent successfully. We'll get back to you within 24 hours.",
      emailSent: true
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Contact support email error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
