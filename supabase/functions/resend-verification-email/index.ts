import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResendVerificationRequest {
  email: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: ResendVerificationRequest = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format");
    }

    console.log(`Resending verification email to: ${email}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user exists and is not already confirmed
    const { data: authUser, error: getUserError } = await supabaseClient.auth.admin.getUserByEmail(email);

    if (getUserError || !authUser.user) {
      throw new Error("No account found with this email address");
    }

    if (authUser.user.email_confirmed_at) {
      return new Response(JSON.stringify({
        success: true,
        message: "Email is already verified",
        alreadyVerified: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check rate limiting (max 3 emails per hour per email address)
    const { data: recentAttempts } = await supabaseClient
      .from('security_events')
      .select('created_at')
      .eq('event_type', 'verification_email_resent')
      .eq('metadata->email', email)
      .gt('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (recentAttempts && recentAttempts.length >= 3) {
      throw new Error("Too many verification emails sent. Please wait before requesting another.");
    }

    // Resend verification email
    const redirectUrl = `${Deno.env.get("SUPABASE_URL")?.replace('/supabase.co', '.supabase.co') || 'https://sproutcv.app'}/dashboard`;
    
    const { error: resendError } = await supabaseClient.auth.admin.generateLink({
      type: 'signup',
      email: email,
      options: {
        redirectTo: redirectUrl
      }
    });

    if (resendError) {
      console.error("Error resending verification email:", resendError);
      throw new Error(`Failed to resend verification email: ${resendError.message}`);
    }

    // Log the resend attempt
    await supabaseClient
      .from("security_events")
      .insert({
        user_id: authUser.user.id,
        event_type: "verification_email_resent",
        metadata: {
          email: email,
          resend_method: "manual_request",
          timestamp: new Date().toISOString()
        },
        severity: "info"
      });

    console.log(`✅ Verification email resent successfully to: ${email}`);

    return new Response(JSON.stringify({
      success: true,
      message: "Verification email has been resent. Please check your inbox and spam folder.",
      alreadyVerified: false
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Resend verification email error:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});