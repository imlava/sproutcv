import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// SECURITY: Use environment variables
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

// Test all SproutCV products
const TEST_PRODUCTS = [
  { credits: 1, amount: 150, planType: 'single', name: 'Single Credit' },
  { credits: 5, amount: 500, planType: 'starter', name: 'Starter Pack' },
  { credits: 15, amount: 1500, planType: 'pro', name: 'Pro Pack' },
  { credits: 30, amount: 2500, planType: 'premium', name: 'Premium Pack' },
  { credits: 100, amount: 7500, planType: 'enterprise', name: 'Enterprise Pack' }
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== PAYMENT SYSTEM TEST START ===");
    
    const results = [];
    const errors = [];
    let successCount = 0;
    let fallbackCount = 0;

    for (const product of TEST_PRODUCTS) {
      console.log(`\n🧪 Testing ${product.name} (${product.credits} credits, $${(product.amount/100).toFixed(2)})...`);
      
      try {
        // Call the payment function directly
        const paymentResponse = await fetch(`${SUPABASE_URL}/functions/v1/create-payment-dynamic`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            credits: product.credits,
            amount: product.amount,
            planType: product.planType,
            test_mode: false
          })
        });

        const paymentData = await paymentResponse.json();
        
        const testResult = {
          product: product.name,
          credits: product.credits,
          amount: product.amount,
          planType: product.planType,
          status: paymentResponse.status,
          success: paymentData.success || false,
          fallback: paymentData.fallback || false,
          paymentId: paymentData.paymentId || 'none',
          url: paymentData.url || 'none',
          productUsed: paymentData.productUsed || 'none',
          productId: paymentData.productId || 'none',
          environment: paymentData.environment || 'unknown',
          error: paymentData.error || null
        };

        results.push(testResult);

        if (paymentData.success && !paymentData.fallback) {
          successCount++;
          console.log(`✅ ${product.name}: SUCCESS - Real payment created`);
        } else if (paymentData.fallback) {
          fallbackCount++;
          console.log(`⚠️ ${product.name}: FALLBACK - ${paymentData.reason || 'Unknown reason'}`);
        } else {
          errors.push(`❌ ${product.name}: FAILED - ${paymentData.error || 'Unknown error'}`);
          console.log(`❌ ${product.name}: FAILED - ${paymentData.error || 'Unknown error'}`);
        }

      } catch (testError) {
        const errorResult = {
          product: product.name,
          credits: product.credits,
          amount: product.amount,
          planType: product.planType,
          status: 'ERROR',
          success: false,
          fallback: false,
          error: testError.message
        };
        
        results.push(errorResult);
        errors.push(`💥 ${product.name}: EXCEPTION - ${testError.message}`);
        console.log(`💥 ${product.name}: EXCEPTION - ${testError.message}`);
      }
    }

    // Generate comprehensive report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total_products: TEST_PRODUCTS.length,
        successful_payments: successCount,
        fallback_payments: fallbackCount,
        failed_payments: errors.length,
        success_rate: `${Math.round((successCount / TEST_PRODUCTS.length) * 100)}%`
      },
      results: results,
      errors: errors,
      recommendations: generateRecommendations(successCount, fallbackCount, errors.length)
    };

    console.log("=== PAYMENT SYSTEM TEST COMPLETE ===");
    console.log(`✅ Successful: ${successCount}`);
    console.log(`⚠️ Fallback: ${fallbackCount}`);
    console.log(`❌ Failed: ${errors.length}`);

    return new Response(JSON.stringify(report, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (systemError) {
    console.error("=== SYSTEM TEST FAILURE ===", systemError);
    
    return new Response(JSON.stringify({
      error: "Payment system test failed",
      message: systemError.message,
      timestamp: new Date().toISOString(),
      success: false
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

function generateRecommendations(successCount: number, fallbackCount: number, errorCount: number): string[] {
  const recommendations = [];

  if (successCount === 5) {
    recommendations.push("🎉 EXCELLENT: All products are working perfectly!");
    recommendations.push("✅ Your payment system is production-ready");
  } else if (successCount >= 3) {
    recommendations.push("👍 GOOD: Most products are working");
    if (fallbackCount > 0) {
      recommendations.push("⚠️ CHECK: Some payments are using fallback mode - verify Dodo API configuration");
    }
    if (errorCount > 0) {
      recommendations.push("🔧 FIX: Some products failed - check individual error messages");
    }
  } else if (successCount >= 1) {
    recommendations.push("⚠️ PARTIAL: Only some products are working");
    recommendations.push("🔍 INVESTIGATE: Check Dodo API key and product configurations");
    recommendations.push("📋 VERIFY: Ensure all product IDs exist in your Dodo account");
  } else {
    recommendations.push("❌ CRITICAL: No products are working");
    recommendations.push("🚨 URGENT: Check Dodo API key and base URL configuration");
    recommendations.push("🔧 DEBUG: Verify environment variables in Supabase dashboard");
    recommendations.push("📞 SUPPORT: Consider contacting Dodo Payments support");
  }

  return recommendations;
}
