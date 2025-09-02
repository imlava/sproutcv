import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailData {
  userId: string;
  type: 'success' | 'failed' | 'disputed' | 'refunded' | 'expired';
  data: {
    paymentId: string;
    amount: number;
    credits?: number;
    customerEmail: string;
    reason?: string;
    disputeReason?: string;
    refundReason?: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== PAYMENT NOTIFICATION EMAIL START ===");
    
    const { userId, type, data }: EmailData = await req.json();
    
    // Initialize Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!supabaseUrl || !serviceKey) {
      throw new Error("Missing Supabase configuration");
    }
    
    if (!resendApiKey) {
      console.warn("No Resend API key configured, skipping email");
      return new Response(JSON.stringify({ success: true, message: "Email skipped" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Get user details
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("email, first_name, last_name")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      console.error("User profile not found:", profileError);
      throw new Error("User profile not found");
    }

    const userEmail = profile.email || data.customerEmail;
    const userName = profile.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : 'Customer';

    // Generate email content based on type
    const emailContent = generateEmailContent(type, data, userName);
    
    // Send email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "SproutCV <payments@sproutcv.app>",
        to: [userEmail],
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Email sending failed:", errorText);
      throw new Error(`Email sending failed: ${errorText}`);
    }

    const emailResult = await emailResponse.json();
    console.log("✅ Email sent successfully:", emailResult.id);

    // Log email in database
    await logEmailNotification(supabase, userId, type, data, emailResult.id);

    return new Response(JSON.stringify({
      success: true,
      emailId: emailResult.id,
      type: type
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Payment notification error:", error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

function generateEmailContent(type: string, data: any, userName: string) {
  const baseUrl = "https://sproutcv.app";
  const amount = (data.amount / 100).toFixed(2);
  
  switch (type) {
    case 'success':
      return {
        subject: "🎉 Payment Successful - Credits Added to Your Account",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">🎉 Payment Successful!</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your credits have been added to your account</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="margin: 0 0 20px 0; font-size: 16px;">Hi ${userName},</p>
              
              <p style="margin: 0 0 20px 0; color: #333;">Great news! Your payment has been processed successfully and your credits are ready to use.</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; color: #28a745;">Payment Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 5px 0; font-weight: bold;">Amount Paid:</td><td style="padding: 5px 0;">$${amount}</td></tr>
                  <tr><td style="padding: 5px 0; font-weight: bold;">Credits Added:</td><td style="padding: 5px 0; color: #28a745; font-weight: bold;">${data.credits} credits</td></tr>
                  <tr><td style="padding: 5px 0; font-weight: bold;">Payment ID:</td><td style="padding: 5px 0; font-family: monospace; font-size: 12px;">${data.paymentId}</td></tr>
                  <tr><td style="padding: 5px 0; font-weight: bold;">Date:</td><td style="padding: 5px 0;">${new Date().toLocaleDateString()}</td></tr>
                </table>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${baseUrl}/dashboard" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Start Analyzing Resumes</a>
              </div>
              
              <p style="margin: 20px 0 0 0; color: #666; font-size: 14px;">You can view your payment history and download receipts anytime from your <a href="${baseUrl}/payments" style="color: #667eea;">payment center</a>.</p>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
              <p style="margin: 0; color: #999; font-size: 12px; text-align: center;">Thank you for choosing SproutCV! If you have any questions, please contact our support team.</p>
            </div>
          </div>
        `,
        text: `Payment Successful!\n\nHi ${userName},\n\nYour payment of $${amount} has been processed successfully and ${data.credits} credits have been added to your account.\n\nPayment ID: ${data.paymentId}\nDate: ${new Date().toLocaleDateString()}\n\nStart analyzing your resumes at ${baseUrl}/dashboard\n\nThank you for choosing SproutCV!`
      };

    case 'failed':
      return {
        subject: "❌ Payment Failed - Please Try Again",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">❌ Payment Failed</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">We couldn't process your payment</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="margin: 0 0 20px 0; font-size: 16px;">Hi ${userName},</p>
              
              <p style="margin: 0 0 20px 0; color: #333;">Unfortunately, we couldn't process your payment. This can happen for various reasons, such as insufficient funds, card restrictions, or temporary issues with the payment processor.</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #dc3545; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; color: #dc3545;">Payment Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 5px 0; font-weight: bold;">Amount:</td><td style="padding: 5px 0;">$${amount}</td></tr>
                  <tr><td style="padding: 5px 0; font-weight: bold;">Payment ID:</td><td style="padding: 5px 0; font-family: monospace; font-size: 12px;">${data.paymentId}</td></tr>
                  ${data.reason ? `<tr><td style="padding: 5px 0; font-weight: bold;">Reason:</td><td style="padding: 5px 0; color: #dc3545;">${data.reason}</td></tr>` : ''}
                </table>
              </div>
              
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
                <h4 style="margin: 0 0 10px 0; color: #856404;">💡 What to try next:</h4>
                <ul style="margin: 0; padding-left: 20px; color: #856404;">
                  <li>Check that your card details are correct</li>
                  <li>Ensure you have sufficient funds</li>
                  <li>Try a different payment method</li>
                  <li>Contact your bank if the issue persists</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${baseUrl}/dashboard" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Try Payment Again</a>
              </div>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
              <p style="margin: 0; color: #999; font-size: 12px; text-align: center;">Need help? Contact our support team at support@sproutcv.app</p>
            </div>
          </div>
        `,
        text: `Payment Failed\n\nHi ${userName},\n\nWe couldn't process your payment of $${amount}.\n\nPayment ID: ${data.paymentId}\n${data.reason ? `Reason: ${data.reason}\n` : ''}\nPlease try again with a different payment method or contact your bank.\n\nTry again at ${baseUrl}/dashboard\n\nNeed help? Contact support@sproutcv.app`
      };

    case 'disputed':
      return {
        subject: "⚠️ Payment Under Review - Dispute Received",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #ffc107 0%, #ff8f00 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">⚠️ Payment Under Review</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">We've received a dispute for your payment</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="margin: 0 0 20px 0; font-size: 16px;">Hi ${userName},</p>
              
              <p style="margin: 0 0 20px 0; color: #333;">We've received a dispute regarding your recent payment. Our team is reviewing this matter and will contact you shortly with more information.</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; color: #ff8f00;">Dispute Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 5px 0; font-weight: bold;">Amount:</td><td style="padding: 5px 0;">$${amount}</td></tr>
                  <tr><td style="padding: 5px 0; font-weight: bold;">Payment ID:</td><td style="padding: 5px 0; font-family: monospace; font-size: 12px;">${data.paymentId}</td></tr>
                  ${data.disputeReason ? `<tr><td style="padding: 5px 0; font-weight: bold;">Reason:</td><td style="padding: 5px 0;">${data.disputeReason}</td></tr>` : ''}
                </table>
              </div>
              
              <p style="margin: 20px 0; color: #333;">During this review period, any credits associated with this payment may be temporarily frozen. We'll resolve this as quickly as possible.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${baseUrl}/payments" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Payment Status</a>
              </div>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
              <p style="margin: 0; color: #999; font-size: 12px; text-align: center;">If you have questions about this dispute, please contact support@sproutcv.app</p>
            </div>
          </div>
        `,
        text: `Payment Under Review\n\nHi ${userName},\n\nWe've received a dispute for your payment of $${amount}.\n\nPayment ID: ${data.paymentId}\n${data.disputeReason ? `Reason: ${data.disputeReason}\n` : ''}\nOur team is reviewing this matter and will contact you shortly.\n\nView status at ${baseUrl}/payments\n\nQuestions? Contact support@sproutcv.app`
      };

    case 'refunded':
      return {
        subject: "🔄 Payment Refunded - Credits Adjusted",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">🔄 Payment Refunded</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your payment has been refunded</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="margin: 0 0 20px 0; font-size: 16px;">Hi ${userName},</p>
              
              <p style="margin: 0 0 20px 0; color: #333;">Your payment has been successfully refunded. The refunded amount will appear in your original payment method within 5-10 business days.</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #6f42c1; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; color: #6f42c1;">Refund Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 5px 0; font-weight: bold;">Refund Amount:</td><td style="padding: 5px 0; color: #28a745; font-weight: bold;">$${amount}</td></tr>
                  <tr><td style="padding: 5px 0; font-weight: bold;">Original Payment ID:</td><td style="padding: 5px 0; font-family: monospace; font-size: 12px;">${data.paymentId}</td></tr>
                  ${data.refundReason ? `<tr><td style="padding: 5px 0; font-weight: bold;">Reason:</td><td style="padding: 5px 0;">${data.refundReason}</td></tr>` : ''}
                </table>
              </div>
              
              <p style="margin: 20px 0; color: #333;">Any credits associated with this payment have been removed from your account balance.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${baseUrl}/payments" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Payment History</a>
              </div>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
              <p style="margin: 0; color: #999; font-size: 12px; text-align: center;">Questions about this refund? Contact support@sproutcv.app</p>
            </div>
          </div>
        `,
        text: `Payment Refunded\n\nHi ${userName},\n\nYour payment of $${amount} has been refunded.\n\nPayment ID: ${data.paymentId}\n${data.refundReason ? `Reason: ${data.refundReason}\n` : ''}\nThe refund will appear in your original payment method within 5-10 business days.\n\nView history at ${baseUrl}/payments\n\nQuestions? Contact support@sproutcv.app`
      };

    default:
      return {
        subject: "🔔 Payment Update - SproutCV",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Payment Update</h2>
            <p>Hi ${userName},</p>
            <p>We have an update regarding your payment (ID: ${data.paymentId}).</p>
            <p>Please visit your <a href="${baseUrl}/payments">payment center</a> for more details.</p>
          </div>
        `,
        text: `Payment Update\n\nHi ${userName},\n\nWe have an update regarding your payment (ID: ${data.paymentId}).\n\nVisit ${baseUrl}/payments for details.`
      };
  }
}

async function logEmailNotification(supabase: any, userId: string, type: string, data: any, emailId: string) {
  try {
    await supabase.from("email_notifications").insert({
      user_id: userId,
      email_type: `payment_${type}`,
      payment_id: data.paymentId,
      email_provider_id: emailId,
      status: "sent",
      sent_at: new Date().toISOString()
    });
  } catch (error) {
    console.error("Email logging error:", error);
  }
}
