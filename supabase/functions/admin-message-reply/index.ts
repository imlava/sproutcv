import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MessageReplyRequest {
  contactMessageId: string;
  replyContent: string;
  sendEmail: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Get user from token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Invalid authentication");
    }

    // Check if user is admin
    const { data: userRoles, error: roleError } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (roleError || !userRoles || userRoles.length === 0) {
      throw new Error("Admin access required");
    }

    const { contactMessageId, replyContent, sendEmail }: MessageReplyRequest = await req.json();

    if (!contactMessageId || !replyContent) {
      throw new Error("Missing required fields");
    }

    // Get the original contact message
    const { data: contactMessage, error: messageError } = await supabaseClient
      .from("contact_messages")
      .select("*")
      .eq("id", contactMessageId)
      .single();

    if (messageError || !contactMessage) {
      throw new Error("Contact message not found");
    }

    // Create reply record
    const { data: reply, error: replyError } = await supabaseClient
      .from("message_replies")
      .insert({
        contact_message_id: contactMessageId,
        admin_user_id: user.id,
        reply_content: replyContent,
        is_email_sent: sendEmail,
        email_status: sendEmail ? "pending" : "not_sent"
      })
      .select()
      .single();

    if (replyError) {
      throw new Error(`Failed to create reply: ${replyError.message}`);
    }

    // Update contact message status
    await supabaseClient
      .from("contact_messages")
      .update({
        status: "replied",
        responded_by: user.id,
        responded_at: new Date().toISOString()
      })
      .eq("id", contactMessageId);

    let emailResult = null;

    // Send email if requested
    if (sendEmail) {
      const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
      
      try {
        emailResult = await resend.emails.send({
          from: "Support <support@sproutcv.app>",
          to: [contactMessage.email],
          subject: `Re: ${contactMessage.subject}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Response to Your Message</h2>
              <p>Hello ${contactMessage.name},</p>
              <p>Thank you for contacting us. Here's our response to your message:</p>
              
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4>Your Original Message:</h4>
                <p><strong>Subject:</strong> ${contactMessage.subject}</p>
                <p>${contactMessage.message}</p>
              </div>
              
              <div style="background-color: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4>Our Response:</h4>
                <p>${replyContent.replace(/\n/g, '<br>')}</p>
              </div>
              
              <p>If you have any further questions, feel free to contact us again.</p>
              <p>Best regards,<br>The SproutCV Support Team</p>
            </div>
          `,
        });

        // Update reply with email status
        await supabaseClient
          .from("message_replies")
          .update({
            email_status: "sent",
            is_email_sent: true
          })
          .eq("id", reply.id);

        console.log("Email sent successfully:", emailResult);
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
        
        // Update reply with email error
        await supabaseClient
          .from("message_replies")
          .update({
            email_status: "failed"
          })
          .eq("id", reply.id);
        
        emailResult = { error: emailError.message };
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        reply,
        emailResult,
        message: sendEmail 
          ? (emailResult?.error ? "Reply saved but email failed to send" : "Reply sent and email delivered")
          : "Reply saved successfully"
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in admin-message-reply function:", error);
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