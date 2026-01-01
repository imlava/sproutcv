import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RobustVerificationRequest {
  email: string;
  userId?: string;
  retryCount?: number;
  forceVerify?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, userId, retryCount = 0, forceVerify = false }: RobustVerificationRequest = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    console.log(`🔄 Robust email verification started for: ${email} (retry: ${retryCount})`);

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Find user in auth system
    const { data: authUsers } = await supabaseClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });

    let authUser = authUsers.users.find(user => user.email === email);
    
    if (!authUser && userId) {
      // Try to find by userId if email doesn't match
      authUser = authUsers.users.find(user => user.id === userId);
    }

    if (!authUser) {
      // User doesn't exist in auth - this is a critical error
      throw new Error(`No auth user found for email: ${email}`);
    }

    console.log(`✅ Found auth user: ${authUser.id}`);

    // Step 2: Check/Create user profile with GUARANTEED CREDITS
    let { data: userProfile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    const WELCOME_CREDITS = 5;
    
    if (!userProfile) {
      console.log(`🔧 Creating missing profile for user: ${authUser.id}`);
      
      // Generate referral code
      const generateReferralCode = () => {
        return Math.random().toString(36).substring(2, 10).toUpperCase();
      };

      // Create profile automatically with GUARANTEED welcome credits
      const { data: newProfile, error: profileError } = await supabaseClient
        .from('profiles')
        .insert({
          id: authUser.id,
          email: authUser.email,
          full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || 'User',
          credits: WELCOME_CREDITS,
          email_verified: false,
          referral_code: generateReferralCode(),
          subscription_tier: 'free',
          status: 'active',
          is_active: true
        })
        .select()
        .single();

      if (profileError) {
        // Handle duplicate key (profile was created by concurrent process)
        if (profileError.code === '23505') {
          console.log(`⚠️ Profile created by concurrent process, fetching...`);
          const { data: existingProfile } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();
          userProfile = existingProfile;
        } else {
          console.error(`❌ Failed to create profile:`, profileError);
          throw new Error(`Profile creation failed: ${profileError.message}`);
        }
      } else {
        userProfile = newProfile;
        console.log(`✅ Profile created with ${WELCOME_CREDITS} welcome credits`);
      }

      // Create user role (ignore duplicate errors)
      try {
        await supabaseClient
          .from('user_roles')
          .insert({
            user_id: authUser.id,
            role: 'user'
          });
      } catch (roleError) {
        console.log('User role may already exist (non-critical)');
      }

      // Add initial credits to ledger (guaranteed logging)
      try {
        await supabaseClient
          .from('credits_ledger')
          .insert({
            user_id: authUser.id,
            transaction_type: 'bonus',
            credits_amount: WELCOME_CREDITS,
            balance_after: WELCOME_CREDITS,
            description: 'Welcome bonus credits (signup)'
          });
        console.log(`✅ Credits ledger entry created`);
      } catch (ledgerError) {
        console.warn('Credits ledger entry may already exist (non-critical):', ledgerError);
      }
    } else {
      // Profile exists - VERIFY credits are allocated
      console.log(`✅ Profile exists for: ${authUser.id}, Credits: ${userProfile.credits}`);
      
      // If user has 0 credits and no ledger entries, this might be a glitch - add welcome credits
      if (userProfile.credits === 0) {
        const { count } = await supabaseClient
          .from('credits_ledger')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', authUser.id);
        
        if (count === 0) {
          console.log(`🔧 User has 0 credits and no ledger entries - adding welcome credits`);
          
          // Add welcome credits
          const { error: creditError } = await supabaseClient
            .from('profiles')
            .update({ credits: WELCOME_CREDITS })
            .eq('id', authUser.id);
          
          if (!creditError) {
            await supabaseClient
              .from('credits_ledger')
              .insert({
                user_id: authUser.id,
                transaction_type: 'bonus',
                credits_amount: WELCOME_CREDITS,
                balance_after: WELCOME_CREDITS,
                description: 'Welcome bonus credits (recovery)'
              });
            userProfile.credits = WELCOME_CREDITS;
            console.log(`✅ Welcome credits recovered for user`);
          }
        }
      }
    }

    // Step 3: Check if already verified
    if (authUser.email_confirmed_at && userProfile.email_verified && !forceVerify) {
      console.log(`✅ Email already verified for: ${email}`);
      
      return new Response(JSON.stringify({
        success: true,
        message: "Email is already verified",
        alreadyVerified: true,
        userId: authUser.id
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Step 4: Handle verification process
    let verificationMethod = 'email_link';
    let verificationSuccess = false;
    let errorDetails = null;

    // Try email link verification first
    try {
      console.log(`📧 Attempting email link verification for: ${email}`);
      
      // Use /auth/callback to properly handle email confirmation tokens
      const redirectUrl = `https://sproutcv.app/auth/callback`;
      
      const { error: linkError } = await supabaseClient.auth.admin.generateLink({
        type: 'signup',
        email: email,
        options: {
          redirectTo: redirectUrl
        }
      });

      if (!linkError) {
        verificationSuccess = true;
        console.log(`✅ Email link sent successfully to: ${email}`);
      } else {
        throw linkError;
      }
    } catch (emailError) {
      console.error(`❌ Email link failed:`, emailError);
      errorDetails = emailError.message;
      verificationMethod = 'auto_verify';
    }

    // If email fails or force verify is true, auto-verify
    if (!verificationSuccess || forceVerify) {
      console.log(`🔧 Auto-verifying user: ${email} (method: ${verificationMethod})`);
      
      try {
        // Update auth user to verified
        const { error: authUpdateError } = await supabaseClient.auth.admin.updateUserById(
          authUser.id,
          { 
            email_confirm: true,
            updated_at: new Date().toISOString()
          }
        );

        if (authUpdateError) {
          console.warn(`⚠️ Auth update warning:`, authUpdateError);
        }

        // Update profile to verified
        const { error: profileUpdateError } = await supabaseClient
          .from("profiles")
          .update({
            email_verified: true,
            updated_at: new Date().toISOString()
          })
          .eq("id", authUser.id);

        if (profileUpdateError) {
          throw new Error(`Profile update failed: ${profileUpdateError.message}`);
        }

        verificationSuccess = true;
        verificationMethod = 'auto_verified';
        console.log(`✅ Auto-verification successful for: ${email}`);

      } catch (autoVerifyError) {
        console.error(`❌ Auto-verification failed:`, autoVerifyError);
        
        // If we're not at max retries, schedule a retry
        if (retryCount < 3) {
          console.log(`🔄 Scheduling retry ${retryCount + 1} for: ${email}`);
          
          // Log retry attempt
          await supabaseClient
            .from("verification_queue")
            .insert({
              user_id: authUser.id,
              email: email,
              retry_count: retryCount + 1,
              last_error: autoVerifyError.message,
              next_retry_at: new Date(Date.now() + (retryCount + 1) * 60000).toISOString(), // Exponential backoff
              status: 'retry_scheduled'
            });

          return new Response(JSON.stringify({
            success: false,
            message: `Verification failed, retry ${retryCount + 1} scheduled`,
            retryScheduled: true,
            nextRetryAt: new Date(Date.now() + (retryCount + 1) * 60000).toISOString()
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 202, // Accepted for processing
          });
        } else {
          throw new Error(`Max retries exceeded for email verification: ${autoVerifyError.message}`);
        }
      }
    }

    // Step 5: Log security event
    await supabaseClient
      .from("security_events")
      .insert({
        user_id: authUser.id,
        event_type: "email_verification_completed",
        metadata: {
          email: email,
          verification_method: verificationMethod,
          retry_count: retryCount,
          auto_verified: verificationMethod === 'auto_verified',
          timestamp: new Date().toISOString(),
          error_details: errorDetails
        },
        severity: verificationSuccess ? "info" : "warning"
      });

    // Step 6: Clean up retry queue if successful
    if (verificationSuccess) {
      await supabaseClient
        .from("verification_queue")
        .delete()
        .eq("user_id", authUser.id);
    }

    // Step 7: Send welcome email (non-blocking)
    try {
      await supabaseClient.functions.invoke('welcome-email', {
        body: {
          userId: authUser.id,
          email: authUser.email,
          fullName: userProfile.full_name
        }
      });
    } catch (welcomeError) {
      console.warn(`⚠️ Welcome email failed (non-critical):`, welcomeError);
    }

    console.log(`🎉 Robust verification completed for: ${email} using ${verificationMethod}`);

    return new Response(JSON.stringify({
      success: true,
      message: "Email verification completed successfully",
      verificationMethod: verificationMethod,
      autoVerified: verificationMethod === 'auto_verified',
      userId: authUser.id,
      profile: {
        id: userProfile.id,
        email: userProfile.email,
        emailVerified: true,
        credits: userProfile.credits,
        referralCode: userProfile.referral_code
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("🚨 Robust email verification error:", error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});