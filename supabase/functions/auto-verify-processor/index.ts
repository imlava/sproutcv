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
    console.log(`🔄 Starting automatic verification processing...`);

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    let processedCount = 0;
    let successCount = 0;
    let failureCount = 0;

    // Step 1: Process pending verification retries
    const { data: pendingVerifications } = await supabaseClient
      .from('verification_queue')
      .select('*')
      .lte('next_retry_at', new Date().toISOString())
      .eq('status', 'retry_scheduled')
      .limit(50); // Process in batches

    if (pendingVerifications && pendingVerifications.length > 0) {
      console.log(`📧 Processing ${pendingVerifications.length} pending verifications`);

      for (const verification of pendingVerifications) {
        try {
          processedCount++;
          
          // Call the robust verification function
          const verificationResponse = await supabaseClient.functions.invoke('robust-email-verification', {
            body: {
              email: verification.email,
              userId: verification.user_id,
              retryCount: verification.retry_count,
              forceVerify: verification.retry_count >= 2 // Auto-verify after 2 failed email attempts
            }
          });

          if (verificationResponse.error) {
            throw new Error(verificationResponse.error.message);
          }

          successCount++;
          console.log(`✅ Processed verification for: ${verification.email}`);

        } catch (error) {
          failureCount++;
          console.error(`❌ Failed to process verification for ${verification.email}:`, error);

          // Update failure count and schedule next retry if under limit
          if (verification.retry_count < 5) {
            await supabaseClient
              .from('verification_queue')
              .update({
                retry_count: verification.retry_count + 1,
                last_error: error.message,
                next_retry_at: new Date(Date.now() + Math.pow(2, verification.retry_count + 1) * 60000).toISOString(), // Exponential backoff
                updated_at: new Date().toISOString()
              })
              .eq('id', verification.id);
          } else {
            // Max retries exceeded - mark as failed and notify
            await supabaseClient
              .from('verification_queue')
              .update({
                status: 'failed',
                last_error: `Max retries exceeded: ${error.message}`,
                updated_at: new Date().toISOString()
              })
              .eq('id', verification.id);

            // Log critical failure
            await supabaseClient
              .from('security_events')
              .insert({
                user_id: verification.user_id,
                event_type: 'email_verification_failed_permanently',
                metadata: {
                  email: verification.email,
                  retry_count: verification.retry_count,
                  final_error: error.message,
                  timestamp: new Date().toISOString()
                },
                severity: 'error'
              });
          }
        }
      }
    }

    // Step 2: Auto-heal broken user states
    const { data: brokenUsers } = await supabaseClient
      .from('profiles')
      .select('id, email, email_verified, created_at')
      .eq('email_verified', false)
      .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Older than 24 hours
      .limit(20);

    if (brokenUsers && brokenUsers.length > 0) {
      console.log(`🔧 Auto-healing ${brokenUsers.length} users with unverified emails older than 24h`);

      for (const user of brokenUsers) {
        try {
          // Force verify users older than 24 hours
          const healResponse = await supabaseClient.functions.invoke('robust-email-verification', {
            body: {
              email: user.email,
              userId: user.id,
              forceVerify: true,
              retryCount: 0
            }
          });

          if (!healResponse.error) {
            successCount++;
            console.log(`🩹 Auto-healed user: ${user.email}`);
          }
        } catch (healError) {
          console.error(`❌ Failed to auto-heal user ${user.email}:`, healError);
          failureCount++;
        }
      }
    }

    // Step 3: Clean up old completed verification queue entries
    const { error: cleanupError } = await supabaseClient
      .from('verification_queue')
      .delete()
      .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Older than 7 days
      .in('status', ['completed', 'failed']);

    if (cleanupError) {
      console.warn(`⚠️ Cleanup warning:`, cleanupError);
    }

    // Step 4: Check for auth users without profiles and create them
    const { data: authUsers } = await supabaseClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });

    let orphanedUsers = 0;
    if (authUsers.users) {
      for (const authUser of authUsers.users) {
        // Skip if created in last hour (might still be processing)
        const createdAt = new Date(authUser.created_at);
        if (Date.now() - createdAt.getTime() < 60 * 60 * 1000) continue;

        const { data: existingProfile } = await supabaseClient
          .from('profiles')
          .select('id')
          .eq('id', authUser.id)
          .single();

        if (!existingProfile && authUser.email) {
          try {
            // Create missing profile
            const response = await supabaseClient.functions.invoke('robust-email-verification', {
              body: {
                email: authUser.email,
                userId: authUser.id,
                forceVerify: !authUser.email_confirmed_at,
                retryCount: 0
              }
            });

            if (!response.error) {
              orphanedUsers++;
              console.log(`🔧 Created missing profile for: ${authUser.email}`);
            }
          } catch (profileError) {
            console.error(`❌ Failed to create profile for ${authUser.email}:`, profileError);
          }
        }
      }
    }

    const summary = {
      processed: processedCount,
      successful: successCount,
      failed: failureCount,
      autoHealed: brokenUsers?.length || 0,
      orphanedProfilesCreated: orphanedUsers,
      timestamp: new Date().toISOString()
    };

    console.log(`🎉 Auto-verification processing completed:`, summary);

    // Log system health event
    await supabaseClient
      .from('security_events')
      .insert({
        event_type: 'auto_verification_batch_completed',
        metadata: summary,
        severity: failureCount > successCount ? 'warning' : 'info'
      });

    return new Response(JSON.stringify({
      success: true,
      message: "Auto-verification processing completed",
      summary: summary
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("🚨 Auto-verification processing error:", error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});