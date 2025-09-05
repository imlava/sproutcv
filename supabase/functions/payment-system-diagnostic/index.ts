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
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
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

    // Check 2: Payment tables exist
    try {
      const { data: paymentsCheck } = await supabase.from("payments").select("id").limit(1);
      addCheck("payments_table", "pass", "Payments table accessible");
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

    // Check 4: Recent payment activity
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

    // Check 5: Pending payments
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

    // Check 6: Payment processing function
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

    // Check 7: Credits ledger (optional)
    try {
      const { data: ledgerCheck } = await supabase.from("credits_ledger").select("id").limit(1);
      addCheck("credits_ledger", "pass", "Credits ledger table accessible");
    } catch (error) {
      addCheck("credits_ledger", "warning", `Credits ledger not available: ${error.message}`);
    }

    // Check 8: Webhook logs (optional)
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

    // Check 9: Test payment processing function with actual pending payment (if any)
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
