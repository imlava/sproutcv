
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
    const { userId, paymentId, credits } = await req.json();

    if (!userId || !paymentId || !credits) {
      throw new Error("User ID, payment ID, and credits are required");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error("User profile not found");
    }

    // Get payment details
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .select('amount, status')
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      throw new Error("Payment not found");
    }

    // Initialize Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    // Get proper domain
    const domain = getDomain(req.headers.get("origin"));

    // Determine email content based on payment status
    let subject = "Payment Confirmation - SproutCV";
    let emailContent = `
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
        Thank you for your purchase! Your payment has been processed successfully.
      </p>
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <h3 style="color: #065f46; margin: 0 0 12px 0; font-size: 18px;">🎉 Credits Added!</h3>
        <p style="color: #047857; margin: 0; font-size: 14px;">
          <strong>${credits} credits</strong> have been added to your account.
        </p>
      </div>
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
        You can now use these credits to analyze and optimize your resume with our AI-powered tools.
      </p>
    `;

    if (payment.status === 'pending') {
      subject = "Payment Processing - SproutCV";
      emailContent = `
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
          Your payment is being processed. You will receive another email once it's confirmed.
        </p>
        <div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <h3 style="color: #92400e; margin: 0 0 12px 0; font-size: 18px;">⏳ Payment Processing</h3>
          <p style="color: #a16207; margin: 0; font-size: 14px;">
            Amount: $${(payment.amount / 100).toFixed(2)}<br>
            Credits: ${credits}
          </p>
        </div>
      `;
    }

    // Send notification email
    const emailResponse = await resend.emails.send({
      from: "SproutCV Notifications <notifications@sproutcv.app>",
      to: [profile.email],
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
                  Hi ${profile.full_name || 'there'},
                </p>
                ${emailContent}
                
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${domain}/dashboard" 
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
                  This email was sent to ${profile.email}
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
      success: true
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Payment notification error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
