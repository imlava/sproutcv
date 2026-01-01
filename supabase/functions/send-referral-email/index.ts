import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReferralEmailRequest {
  referrerName: string;
  referrerEmail: string;
  recipientEmail: string;
  referralCode: string;
  referralLink: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { referrerName, referrerEmail, recipientEmail, referralCode, referralLink }: ReferralEmailRequest = await req.json();

    console.log(`Sending referral email from ${referrerEmail} to ${recipientEmail}`);

    const emailResponse = await resend.emails.send({
      from: "SproutCV <noreply@sproutcv.app>",
      to: [recipientEmail],
      subject: `${referrerName} invited you to join SproutCV - Get 3 FREE credits!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">🌱 SproutCV</h1>
            <p style="color: #666; margin: 10px 0;">AI-Powered Resume Analysis</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 12px; border-left: 4px solid #2563eb;">
            <h2 style="color: #1e293b; margin: 0 0 20px 0;">You've been invited by ${referrerName}!</h2>
            
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
              ${referrerName} (${referrerEmail}) thinks SproutCV can help you create a better resume and land your dream job.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #1e293b; font-weight: bold; margin: 0 0 10px 0;">🎁 Special Welcome Offer:</p>
              <ul style="color: #475569; margin: 0; padding-left: 20px;">
                <li>Get <strong>3 FREE credits</strong> when you sign up</li>
                <li>${referrerName} also gets <strong>3 FREE credits</strong> when you make your first purchase</li>
                <li>Use your credits for AI-powered resume analysis</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${referralLink}" 
                 style="background: #2563eb; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                Join SproutCV Now
              </a>
            </div>
            
            <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 20px;">
              Or use referral code: <strong style="background: #e2e8f0; padding: 4px 8px; border-radius: 4px;">${referralCode}</strong>
            </p>
          </div>
          
          <div style="margin-top: 30px; color: #64748b; font-size: 14px;">
            <h3 style="color: #475569;">What is SproutCV?</h3>
            <p>SproutCV uses advanced AI to analyze your resume against job descriptions, helping you:</p>
            <ul>
              <li>Match more keywords and requirements</li>
              <li>Improve your ATS compatibility score</li>
              <li>Get personalized suggestions for improvement</li>
              <li>Stand out to recruiters and hiring managers</li>
            </ul>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; margin-top: 30px; padding-top: 20px; text-align: center; color: #64748b; font-size: 12px;">
            <p>This invitation was sent by ${referrerName} through SproutCV's referral program.</p>
            <p>If you don't want to receive these emails, you can safely ignore this message.</p>
          </div>
        </div>
      `,
    });

    console.log("Referral email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-referral-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);