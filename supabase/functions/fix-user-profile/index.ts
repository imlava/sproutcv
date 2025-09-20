import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FixUserRequest {
  email: string;
  fullName?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, fullName }: FixUserRequest = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    console.log(`Fixing user profile for: ${email}`);

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Find the user in auth
    const { data: authUsers, error: getUserError } = await supabaseClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });

    if (getUserError) {
      throw new Error("Error checking user existence");
    }

    const authUser = authUsers.users.find(user => user.email === email);

    if (!authUser) {
      throw new Error("No account found with this email address");
    }

    console.log(`Found auth user: ${authUser.id}`);

    // Check if profile exists
    const { data: existingProfile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (existingProfile) {
      return new Response(JSON.stringify({
        success: true,
        message: "User profile already exists",
        profile: existingProfile
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Generate referral code
    const generateReferralCode = () => {
      return Math.random().toString(36).substring(2, 10).toUpperCase();
    };

    const userReferralCode = generateReferralCode();

    // Create user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .insert({
        id: authUser.id,
        email: email,
        full_name: fullName || authUser.user_metadata?.full_name || 'User',
        credits: 5, // Give 5 free credits
        email_verified: !!authUser.email_confirmed_at,
        referral_code: userReferralCode
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      throw new Error(`Failed to create user profile: ${profileError.message}`);
    }

    // Assign default user role
    const { error: roleError } = await supabaseClient
      .from('user_roles')
      .insert({
        user_id: authUser.id,
        role: 'user'
      });

    if (roleError) {
      console.error('Role assignment error:', roleError);
    }

    // Add initial credits to ledger
    const { error: ledgerError } = await supabaseClient
      .from('credits_ledger')
      .insert({
        user_id: authUser.id,
        transaction_type: 'bonus',
        credits_amount: 5,
        balance_after: 5,
        description: 'Welcome bonus credits'
      });

    if (ledgerError) {
      console.error('Ledger entry error:', ledgerError);
    }

    // Log security event
    await supabaseClient
      .from('security_events')
      .insert({
        user_id: authUser.id,
        event_type: 'user_profile_fixed',
        metadata: {
          email: email,
          full_name: fullName,
          profile_created: true,
          fixed_at: new Date().toISOString()
        }
      });

    console.log(`✅ User profile created successfully for: ${authUser.id}`);

    return new Response(JSON.stringify({
      success: true,
      message: "User profile created successfully",
      profile: profile,
      authUser: {
        id: authUser.id,
        email: authUser.email,
        emailConfirmed: !!authUser.email_confirmed_at,
        createdAt: authUser.created_at
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Fix user profile error:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});