
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

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

    // Initialize Supabase client with anon key for auth operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    // Get the proper domain for redirects
    const domain = getDomain(req.headers.get("origin"));
    const redirectUrl = `${domain}/reset-password`;

    console.log('Sending password reset for:', email, 'redirect to:', redirectUrl);

    // Use Supabase's built-in password reset
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });

    if (error) {
      console.error('Supabase reset password error:', error);
      // Don't reveal if user exists or not for security
      return new Response(JSON.stringify({ 
        message: "If an account with this email exists, you will receive a password reset link",
        success: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log('Password reset email sent successfully');

    return new Response(JSON.stringify({ 
      message: "If an account with this email exists, you will receive a password reset link",
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
