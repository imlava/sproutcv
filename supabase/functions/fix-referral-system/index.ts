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
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const { action = 'fix_all' } = await req.json().catch(() => ({}));

    let results: any = {};

    if (action === 'fix_pending' || action === 'fix_all') {
      // Fix all pending referrals that should be completed
      const { data: fixedReferrals, error: fixError } = await supabaseClient
        .rpc('fix_pending_referrals');

      if (fixError) {
        console.error('Error fixing pending referrals:', fixError);
        results.fix_pending = { error: fixError.message };
      } else {
        console.log('Fixed pending referrals:', fixedReferrals);
        results.fix_pending = { 
          success: true, 
          fixed_count: fixedReferrals?.length || 0,
          fixed_referrals: fixedReferrals 
        };
      }
    }

    if (action === 'award_credits' || action === 'fix_all') {
      // Award credits for completed referrals
      const { data: creditResults, error: creditError } = await supabaseClient
        .rpc('award_referral_credits');

      if (creditError) {
        console.error('Error awarding referral credits:', creditError);
        results.award_credits = { error: creditError.message };
      } else {
        console.log('Awarded referral credits:', creditResults);
        results.award_credits = { 
          success: true, 
          awarded_count: creditResults?.length || 0,
          awarded_referrals: creditResults 
        };
      }
    }

    if (action === 'status') {
      // Get referral system status
      const { data: stats, error: statsError } = await supabaseClient
        .from('referrals')
        .select(`
          id,
          is_signup_completed,
          is_payment_completed,
          credits_awarded,
          email_referred,
          created_at
        `);

      if (statsError) {
        results.status = { error: statsError.message };
      } else {
        const totalReferrals = stats.length;
        const completedSignups = stats.filter(r => r.is_signup_completed).length;
        const pendingSignups = stats.filter(r => !r.is_signup_completed).length;
        const creditsAwarded = stats.filter(r => r.credits_awarded).length;
        const creditsPending = stats.filter(r => r.is_signup_completed && !r.credits_awarded).length;

        results.status = {
          total_referrals: totalReferrals,
          completed_signups: completedSignups,
          pending_signups: pendingSignups,
          credits_awarded: creditsAwarded,
          credits_pending: creditsPending,
          recent_referrals: stats.slice(-5) // Last 5 referrals
        };
      }
    }

    return new Response(JSON.stringify({
      success: true,
      action: action,
      results: results,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Error in fix-referral-system:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
