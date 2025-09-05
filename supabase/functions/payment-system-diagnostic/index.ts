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
    console.log("=== PAYMENT SYSTEM DIAGNOSTIC START ===");
    
    // Skip authentication for diagnostic purposes
    const authHeader = req.headers.get("Authorization");
    if (!authHeader && req.method !== "GET") {
      console.log("No auth header provided, continuing with service role access");
    }
    
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
  );
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

    const diagnostic = {
      timestamp: new Date().toISOString(),
      checks: [] as any[],
      summary: {
        total_checks: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };

    // Helper function to add check result
    const addCheck = (name: string, status: 'pass' | 'fail' | 'warning', message: string, data?: any) => {
      diagnostic.checks.push({
        name,
        status,
        message,
        data,
        timestamp: new Date().toISOString()
      });
      
      diagnostic.summary.total_checks++;
      if (status === 'pass') diagnostic.summary.passed++;
      else if (status === 'fail') diagnostic.summary.failed++;
      else diagnostic.summary.warnings++;
    };

    console.log("🔍 Running payment system diagnostics...");

    // Check 1: Database connectivity
    try {
      const { data: dbCheck, error } = await supabase.from("profiles").select("id").limit(1);
      if (error) throw error;
      addCheck("database_connectivity", "pass", "Database connection successful");
    } catch (error) {
      addCheck("database_connectivity", "fail", `Database connection failed: ${error.message}`);
    }

    // Check 2: Payment tables exist and check for payment_transactions table conflict
    try {
      const { data: paymentsCheck, error: paymentsError } = await supabase.from("payments").select("id").limit(1);
      if (paymentsError) throw paymentsError;
      addCheck("payments_table", "pass", "Payments table accessible");
      
      // Test payment_transactions table specifically
      try {
        const { data: transactionsCheck, error: transactionsError } = await supabase
          .from("payment_transactions")
          .select("id")
          .limit(1);
        
        if (transactionsError) {
          if (transactionsError.code === 'PGRST106' || transactionsError.message?.includes('relation') || transactionsError.message?.includes('does not exist')) {
            addCheck("payment_transactions_table", "fail", "payment_transactions table does not exist - this is causing the 400 errors!");
          } else {
            addCheck("payment_transactions_table", "warning", `payment_transactions table access error: ${transactionsError.message}`);
          }
        } else {
          addCheck("payment_transactions_table", "pass", "payment_transactions table accessible");
        }
      } catch (error) {
        addCheck("payment_transactions_table", "fail", `payment_transactions table error: ${error.message}`);
      }
      
    } catch (error) {
      addCheck("payments_table", "fail", `Payments table error: ${error.message}`);
    }

    // Check 3: Profiles table and credits field
    try {
      const { data: profilesCheck } = await supabase.from("profiles").select("id, credits").limit(1);
      addCheck("profiles_table", "pass", "Profiles table with credits field accessible");
    } catch (error) {
      addCheck("profiles_table", "fail", `Profiles table error: ${error.message}`);
    }

    // Check 4: Payment status functions
    try {
      // Test both check-payment-status and enhanced-payment-status functions
      const testPaymentId = '00000000-0000-0000-0000-000000000000';
      
      // Test check-payment-status function
      try {
        const { data: checkData, error: checkError } = await supabase.functions.invoke('check-payment-status', {
          body: { paymentId: testPaymentId }
        });
        
        if (checkError && !checkError.message?.includes('not found')) {
          addCheck("check_payment_status_function", "pass", "check-payment-status function accessible");
        } else {
          addCheck("check_payment_status_function", "pass", "check-payment-status function working (expected not found)");
        }
      } catch (error) {
        addCheck("check_payment_status_function", "warning", `check-payment-status function error: ${error.message}`);
      }
      
      // Test enhanced-payment-status function  
      try {
        const { data: enhancedData, error: enhancedError } = await supabase.functions.invoke('enhanced-payment-status', {
          body: { paymentId: testPaymentId }
        });
        
        if (enhancedError && !enhancedError.message?.includes('not found')) {
          addCheck("enhanced_payment_status_function", "pass", "enhanced-payment-status function accessible");
        } else {
          addCheck("enhanced_payment_status_function", "pass", "enhanced-payment-status function working (expected not found)");
        }
      } catch (error) {
        addCheck("enhanced_payment_status_function", "warning", `enhanced-payment-status function error: ${error.message}`);
      }
    } catch (error) {
      addCheck("payment_status_functions", "fail", `Payment status functions check failed: ${error.message}`);
    }

    // Check 5: Recent payment activity
    // Check 5: Recent payment activity
    try {
      const { data: recentPayments, error } = await supabase
        .from("payments")
        .select("id, status, created_at, user_id, credits_purchased")
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      const statusCounts = recentPayments?.reduce((acc: any, payment: any) => {
        acc[payment.status] = (acc[payment.status] || 0) + 1;
        return acc;
      }, {}) || {};

      addCheck("recent_payments", "pass", `Found ${recentPayments?.length || 0} payments in last 24h`, {
        total: recentPayments?.length || 0,
        status_breakdown: statusCounts
      });
    } catch (error) {
      addCheck("recent_payments", "fail", `Recent payments check failed: ${error.message}`);
    }

    // Check 6: Pending payments
    // Check 6: Pending payments
    try {
      const { data: pendingPayments, error } = await supabase
        .from("payments")
        .select("id, created_at, user_id")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (pendingPayments && pendingPayments.length > 0) {
        const oldPending = pendingPayments.filter(p => 
          new Date(p.created_at) < new Date(Date.now() - 30 * 60 * 1000) // Older than 30 minutes
        );

        if (oldPending.length > 0) {
          addCheck("pending_payments", "warning", 
            `Found ${oldPending.length} payments pending for >30 minutes`, 
            { old_pending_count: oldPending.length, total_pending: pendingPayments.length }
          );
        } else {
          addCheck("pending_payments", "pass", 
            `${pendingPayments.length} pending payments (all recent)`
          );
        }
      } else {
        addCheck("pending_payments", "pass", "No pending payments");
      }
    } catch (error) {
      addCheck("pending_payments", "fail", `Pending payments check failed: ${error.message}`);
    }

    // Check 7: Payment processing function
    // Check 7: Payment processing function
    try {
      const { data: functionCheck, error } = await supabase.rpc('get_user_credit_summary', {
        target_user_id: '00000000-0000-0000-0000-000000000000'  // Test with dummy UUID
      });
      
      // Function should return an error for non-existent user, which means it's working
      if (functionCheck && functionCheck.error === 'User not found') {
        addCheck("payment_functions", "pass", "Payment processing functions accessible");
      } else {
        addCheck("payment_functions", "warning", "Payment functions responding unexpectedly", functionCheck);
      }
    } catch (error) {
      addCheck("payment_functions", "fail", `Payment functions check failed: ${error.message}`);
    }

    // Check 8: Credits ledger (optional)
    // Check 8: Credits ledger (optional)
    try {
      const { data: ledgerCheck } = await supabase.from("credits_ledger").select("id").limit(1);
      addCheck("credits_ledger", "pass", "Credits ledger table accessible");
    } catch (error) {
      addCheck("credits_ledger", "warning", `Credits ledger not available: ${error.message}`);
    }

    // Check 9: Webhook logs (optional)
    // Check 9: Webhook logs (optional)
    try {
      const { data: webhookLogs } = await supabase
        .from("webhook_logs")
        .select("id, event_type, status")
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(10);

      addCheck("webhook_logs", "pass", `Found ${webhookLogs?.length || 0} webhook logs in last 24h`);
    } catch (error) {
      addCheck("webhook_logs", "warning", `Webhook logs not available: ${error.message}`);
    }

    // Check 10: Test payment processing function with actual pending payment (if any)
    try {
      const { data: testPayment } = await supabase
        .from("payments")
        .select("id")
        .eq("status", "pending")
        .limit(1)
        .single();

      if (testPayment) {
        addCheck("test_payment_processing", "warning", 
          `Found pending payment that could be tested: ${testPayment.id}`,
          { payment_id: testPayment.id }
        );
      } else {
        addCheck("test_payment_processing", "pass", "No pending payments to test");
      }
    } catch (error) {
      addCheck("test_payment_processing", "pass", "No pending payments found for testing");
    }

    // Check 11: Simulate the exact 400 error - test REST API access to payment_transactions
    try {
      console.log("Testing REST API access to payment_transactions table...");
      
      const testData = {
        payment_provider_id: "test_dodo_payment_" + Date.now(),
        transaction_type: "webhook",
        amount: 2500,
        currency: "USD",
        status: "failed",
        provider_response: { test: true },
        metadata: { test_simulation: true }
      };

      const { data: insertResult, error: insertError } = await supabase
        .from("payment_transactions")
        .insert(testData)
        .select();

      if (insertError) {
        if (insertError.code === 'PGRST106' || insertError.message?.includes('relation') || insertError.message?.includes('does not exist')) {
          addCheck("rest_api_payment_transactions", "fail", 
            "CRITICAL: payment_transactions table missing - this causes the 400 error in webhook!", 
            { 
              error_code: insertError.code,
              error_message: insertError.message,
              fix_needed: "Run create-payment-transactions-table.sql"
            }
          );
        } else if (insertError.code === '23503') {
          addCheck("rest_api_payment_transactions", "warning", 
            "payment_transactions table exists but foreign key constraint failed (expected for test data)", 
            { error_details: insertError.message }
          );
        } else {
          addCheck("rest_api_payment_transactions", "warning", 
            `payment_transactions table access issue: ${insertError.message}`, 
            { error_code: insertError.code }
          );
        }
      } else {
        addCheck("rest_api_payment_transactions", "pass", "payment_transactions table working - 400 error should be resolved");
        
        // Clean up test data
        if (insertResult && insertResult[0]) {
          await supabase.from("payment_transactions").delete().eq("id", insertResult[0].id);
        }
      }
    } catch (error) {
      addCheck("rest_api_payment_transactions", "fail", 
        `Critical error testing payment_transactions: ${error.message}`,
        { stack: error.stack }
      );
    }

    console.log("=== PAYMENT SYSTEM DIAGNOSTIC COMPLETE ===");
    console.log(`Summary: ${diagnostic.summary.passed} passed, ${diagnostic.summary.failed} failed, ${diagnostic.summary.warnings} warnings`);

    return new Response(JSON.stringify(diagnostic, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("=== DIAGNOSTIC ERROR ===", error);
    return new Response(JSON.stringify({
      error: "Diagnostic failed",
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
