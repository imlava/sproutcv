import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, email, fullName, referralCode } = await req.json();

    if (!userId || !email) {
      throw new Error("User ID and email are required");
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Generate referral code
    const generateReferralCode = () => {
      return Math.random().toString(36).substring(2, 10).toUpperCase();
    };

    const userReferralCode = generateReferralCode();

    // Check if user was referred
    let referrerUserId = null;
    if (referralCode) {
      console.log('Processing referral code:', referralCode);
      const { data: referrer } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('referral_code', referralCode)
        .single();
      
      if (referrer) {
        referrerUserId = referrer.id;
        console.log('Found referrer:', referrerUserId);
      }
    }

    // Create user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .insert({
        id: userId,
        email: email,
        full_name: fullName,
        credits: 5, // Give 5 free credits
        email_verified: false,
        referral_code: userReferralCode,
        referred_by: referrerUserId
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
        user_id: userId,
        role: 'user'
      });

    if (roleError) {
      console.error('Role assignment error:', roleError);
      // Don't throw here as profile was created successfully
    }

    // Add initial credits to ledger
    const { error: ledgerError } = await supabaseClient
      .from('credits_ledger')
      .insert({
        user_id: userId,
        transaction_type: 'bonus',
        credits_amount: 5,
        balance_after: 5,
        description: 'Welcome bonus credits'
      });

    if (ledgerError) {
      console.error('Ledger entry error:', ledgerError);
      // Don't throw here as profile was created successfully
    }

    // Log security event
    await supabaseClient
      .from('security_events')
      .insert({
        user_id: userId,
        event_type: 'user_registration',
        metadata: {
          email: email,
          full_name: fullName,
          profile_created: true
        }
      });

    // If user was referred, update the referral record
    if (referrerUserId && referralCode) {
      try {
        const { error: referralError } = await supabaseClient
          .from('referrals')
          .update({
            referred_id: userId,
            is_signup_completed: true,
            updated_at: new Date().toISOString()
          })
          .eq('referral_code', referralCode)
          .eq('email_referred', email);

        if (referralError) {
          console.error('Error updating referral record:', referralError);
        } else {
          console.log('Referral record updated successfully');
        }
      } catch (refError) {
        console.error('Exception updating referral:', refError);
      }
    }

    console.log('User profile created successfully:', userId);

    return new Response(JSON.stringify({ 
      message: "User profile created successfully",
      profile: profile,
      success: true,
      referral_processed: !!referrerUserId
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Create user profile error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
}); 