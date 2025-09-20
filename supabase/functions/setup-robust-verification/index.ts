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
    console.log(`🔧 Setting up robust email verification system...`);

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Create verification queue table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS verification_queue (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID,
          email TEXT NOT NULL,
          retry_count INTEGER DEFAULT 0,
          last_error TEXT,
          next_retry_at TIMESTAMPTZ,
          status TEXT DEFAULT 'retry_scheduled',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // Execute the SQL
    const { error: createTableError } = await supabaseClient.rpc('exec_sql', { sql: createTableSQL });
    
    if (createTableError) {
      console.warn('Table creation warning (may already exist):', createTableError);
    }

    // Test the robust verification system
    const testResponse = await supabaseClient.functions.invoke('robust-email-verification', {
      body: {
        email: 'test@example.com',
        retryCount: 0,
        forceVerify: true
      }
    });

    return new Response(JSON.stringify({
      success: true,
      message: "Robust email verification system setup completed",
      tableCreated: !createTableError,
      systemTest: testResponse.error ? 'failed' : 'passed',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("🚨 Setup error:", error);
    
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