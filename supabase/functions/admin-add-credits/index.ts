import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { target_user_id, credits_to_add, admin_note } = await req.json();

    // Validate input
    if (!target_user_id || !credits_to_add || credits_to_add <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid input parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get current user credits
    const { data: userData, error: userError } = await supabaseClient
      .from('profiles')
      .select('credits')
      .eq('id', target_user_id)
      .single();

    if (userError || !userData) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const currentCredits = userData.credits || 0;
    const newCredits = currentCredits + credits_to_add;

    // Update user credits
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({ credits: newCredits })
      .eq('id', target_user_id);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update credits' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Record transaction in credits ledger
    const { error: ledgerError } = await supabaseClient
      .from('credits_ledger')
      .insert({
        user_id: target_user_id,
        transaction_type: 'admin_grant',
        credits_amount: credits_to_add,
        balance_after: newCredits,
        description: admin_note || 'Credits added by admin'
      });

    if (ledgerError) {
      return new Response(
        JSON.stringify({ error: 'Failed to record transaction' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${credits_to_add} credits added successfully`,
        new_balance: newCredits
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}); 