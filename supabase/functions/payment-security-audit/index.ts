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
    console.log("=== PAYMENT SECURITY AUDIT START ===");

    // Environment validation
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const dodoApiKey = Deno.env.get("DODO_PAYMENTS_API_KEY");
    
    if (!supabaseUrl || !serviceKey || !dodoApiKey) {
      throw new Error("Missing environment variables");
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // Get all completed payments for audit
    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("status", "completed")
      .eq("payment_method", "dodo_payments")
      .not("payment_provider_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(50); // Audit last 50 payments

    if (paymentsError) {
      throw new Error(`Failed to fetch payments: ${paymentsError.message}`);
    }

    console.log(`Auditing ${payments.length} completed payments...`);

    const auditResults = {
      totalPayments: payments.length,
      verifiedPayments: 0,
      suspiciousPayments: 0,
      failedVerifications: 0,
      suspiciousDetails: [],
      summary: ""
    };

    for (const payment of payments) {
      try {
        console.log(`Auditing payment: ${payment.payment_provider_id}`);

        // Verify each payment with Dodo API
        const dodoResponse = await fetch(`https://api.dodopayments.com/api/v1/payments/${payment.payment_provider_id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${dodoApiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (!dodoResponse.ok) {
          console.error(`Dodo API error for ${payment.payment_provider_id}:`, dodoResponse.status);
          auditResults.failedVerifications++;
          continue;
        }

        const dodoData = await dodoResponse.json();
        const actualStatus = dodoData.status || dodoData.payment_status;
        const actualAmount = dodoData.amount;

        console.log(`Payment ${payment.payment_provider_id}: DB status=${payment.status}, Dodo status=${actualStatus}`);

        // Check for discrepancies
        if (actualStatus !== 'succeeded' && actualStatus !== 'completed' && actualStatus !== 'paid') {
          // SUSPICIOUS: Payment marked as completed in DB but failed/pending in Dodo
          auditResults.suspiciousPayments++;
          
          const suspiciousDetail = {
            paymentId: payment.payment_provider_id,
            userId: payment.user_id,
            dbStatus: payment.status,
            dodoStatus: actualStatus,
            amount: payment.amount,
            credits: payment.credits_purchased,
            createdAt: payment.created_at,
            severity: "HIGH",
            issue: "Payment completed in DB but not successful in Dodo API"
          };

          auditResults.suspiciousDetails.push(suspiciousDetail);

          // Log security incident
          await supabaseAdmin
            .from("security_events")
            .insert({
              user_id: payment.user_id,
              event_type: "payment_audit_suspicious",
              metadata: suspiciousDetail
            });

          console.error(`🚨 SUSPICIOUS PAYMENT FOUND: ${payment.payment_provider_id}`);
          
          // Consider reversing the payment/credits
          console.log(`Consider reversing credits for user ${payment.user_id}`);

        } else if (actualAmount && actualAmount !== payment.amount) {
          // Amount mismatch
          auditResults.suspiciousPayments++;
          
          const suspiciousDetail = {
            paymentId: payment.payment_provider_id,
            userId: payment.user_id,
            dbAmount: payment.amount,
            dodoAmount: actualAmount,
            credits: payment.credits_purchased,
            severity: "MEDIUM",
            issue: "Amount mismatch between DB and Dodo API"
          };

          auditResults.suspiciousDetails.push(suspiciousDetail);

        } else {
          // Payment verified successfully
          auditResults.verifiedPayments++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error auditing payment ${payment.payment_provider_id}:`, error);
        auditResults.failedVerifications++;
      }
    }

    // Generate summary
    auditResults.summary = `
    PAYMENT SECURITY AUDIT COMPLETE
    
    Total Payments Audited: ${auditResults.totalPayments}
    ✅ Verified Payments: ${auditResults.verifiedPayments}
    🚨 Suspicious Payments: ${auditResults.suspiciousPayments}
    ❌ Failed Verifications: ${auditResults.failedVerifications}
    
    Security Status: ${auditResults.suspiciousPayments > 0 ? 'COMPROMISED' : 'SECURE'}
    `;

    console.log(auditResults.summary);

    // Log audit completion
    await supabaseAdmin
      .from("security_events")
      .insert({
        event_type: "payment_audit_completed",
        metadata: {
          audit_results: auditResults,
          audit_timestamp: new Date().toISOString()
        }
      });

    return new Response(JSON.stringify(auditResults), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("=== PAYMENT AUDIT ERROR ===", error);
    return new Response(JSON.stringify({ 
      error: "Payment audit failed",
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
