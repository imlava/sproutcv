
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
    const { userId, email, fullName, credits, amount, paymentMethod, transactionType } = await req.json();

    if (!userId || !email) {
      throw new Error("User ID and email are required");
    }

    // Initialize Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    let subject = "";
    let emailContent = "";
    
    if (transactionType === "purchase") {
      subject = "Payment Confirmed - Credits Added to Your SproutCV Account";
      emailContent = `
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
          Your payment has been successfully processed! We've added <strong>${credits} credits</strong> to your SproutCV account.
        </p>
        
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <h3 style="color: #065f46; margin: 0 0 12px 0; font-size: 18px;">Payment Details:</h3>
          <ul style="color: #047857; margin: 0; padding-left: 20px;">
            <li><strong>Credits Purchased:</strong> ${credits}</li>
            <li><strong>Amount:</strong> ${amount/100} ${paymentMethod === 'razorpay' ? 'INR' : 'USD'}</li>
            <li><strong>Payment Method:</strong> ${paymentMethod === 'razorpay' ? 'Razorpay' : 'PayPal'}</li>
          </ul>
        </div>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
          You can now use these credits to analyze and optimize your resumes with our AI-powered tools.
        </p>
      `;
    } else if (transactionType === "credit_used") {
      subject = "Credit Used - Resume Analysis Complete";
      emailContent = `
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
          We've successfully analyzed your resume! <strong>1 credit</strong> has been deducted from your account.
        </p>
        
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <h3 style="color: #1e40af; margin: 0 0 12px 0; font-size: 18px;">Analysis Complete:</h3>
          <p style="color: #1d4ed8; margin: 0;">
            Your detailed resume analysis and optimization suggestions are now available in your dashboard.
          </p>
        </div>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
          Remaining credits: <strong>${credits}</strong>
        </p>
      `;
    }

    // Send notification email
    const emailResponse = await resend.emails.send({
      from: "SproutCV Notifications <notifications@sproutcv.app>",
      to: [email],
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>SproutCV Notification</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #1f2937; font-size: 28px; margin: 0; font-weight: 700;">SproutCV</h1>
                <div style="width: 60px; height: 4px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); margin: 16px auto; border-radius: 2px;"></div>
              </div>
              
              <div style="margin-bottom: 32px;">
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                  Hi ${fullName || 'there'},
                </p>
                ${emailContent}
                
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${req.headers.get("origin")}/dashboard" 
                     style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                            color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; 
                            font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                    View Dashboard
                  </a>
                </div>
              </div>
              
              <div style="text-align: center; border-top: 1px solid #e5e7eb; padding-top: 24px;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                  SproutCV - AI-Powered Resume Analysis<br>
                  Questions about your account? Contact us at <a href="mailto:support@sproutcv.app" style="color: #10b981;">support@sproutcv.app</a><br>
                  This email was sent to ${email}
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Payment notification email sent:", emailResponse);

    return new Response(JSON.stringify({ 
      message: "Payment notification email sent successfully",
      emailSent: true
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Payment notification email error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
