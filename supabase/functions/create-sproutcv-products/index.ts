import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== CREATING SPROUTCV PRODUCTS ===");
    
    const apiKey = "8SSKFEsfH2oztWzS.pvF6gFUWVK5JGfWgNjjuRl0SLVb4X-KMUT7GSw7EfnKVzB2t";
    
    // SproutCV Product Catalog (from the app)
    const sproutcvProducts = [
      {
        name: "Starter Pack - 5 Credits",
        description: "Perfect for getting started with AI Resume Analysis, ATS Optimization, Detailed Feedback, and Export Options",
        price: 500, // $5.00 in cents
        currency: "USD",
        credits: 5,
        plan_type: "starter",
        features: ["AI Resume Analysis", "ATS Optimization", "Detailed Feedback", "Export Options"],
        original_price: 750 // $7.50 in cents
      },
      {
        name: "Pro Pack - 15 Credits", 
        description: "Most popular choice with everything in Starter plus Priority Support, Advanced Analytics, and Custom Templates",
        price: 1500, // $15.00 in cents
        currency: "USD",
        credits: 15,
        plan_type: "pro",
        features: ["Everything in Starter", "Priority Support", "Advanced Analytics", "Custom Templates"],
        original_price: 2250, // $22.50 in cents
        popular: true
      },
      {
        name: "Premium Pack - 30 Credits",
        description: "Best value for power users with everything in Pro plus Unlimited Exports, Personal Branding, and 30-Day Analysis History",
        price: 2500, // $25.00 in cents
        currency: "USD",
        credits: 30,
        plan_type: "premium", 
        features: ["Everything in Pro", "Unlimited Exports", "Personal Branding", "30-Day Analysis History"],
        original_price: 4500 // $45.00 in cents
      },
      {
        name: "Single Credit",
        description: "Individual resume analysis credit for one-time use",
        price: 150, // $1.50 in cents
        currency: "USD",
        credits: 1,
        plan_type: "single",
        features: ["AI Resume Analysis", "Basic Feedback", "Export Options"]
      },
      {
        name: "Enterprise Pack - 100 Credits",
        description: "For teams and enterprises with bulk credit needs",
        price: 7500, // $75.00 in cents  
        currency: "USD",
        credits: 100,
        plan_type: "enterprise",
        features: ["Everything in Premium", "Team Management", "Bulk Processing", "Priority Support", "Custom Integrations"],
        original_price: 15000 // $150.00 in cents
      }
    ];
    
    const results = [];
    
    for (const product of sproutcvProducts) {
      console.log(`Creating product: ${product.name}`);
      
      try {
        const headers = new Headers();
        headers.set("Authorization", `Bearer ${apiKey}`);
        headers.set("Content-Type", "application/json");
        headers.set("Accept", "application/json");
        
        // Dodo Payments product creation payload (FIXED: Correct price structure)
        const dodoProduct = {
          name: product.name,
          description: product.description,
          
          // CRITICAL: Price must be an object, not integer
          price: {
            type: "one_time_price",
            price: product.price,
            currency: product.currency,
            tax_inclusive: false,
            discount: 0,
            purchasing_power_parity: false,
            pay_what_you_want: false,
            suggested_price: null
          },
          
          tax_category: "saas", // Software as a Service
          is_recurring: false,
          
          // Metadata to store SproutCV-specific information
          metadata: {
            credits: product.credits.toString(),
            plan_type: product.plan_type,
            features: product.features.join(", "),
            original_price: product.original_price?.toString(),
            popular: product.popular?.toString() || "false",
            sproutcv_product: "true"
          }
        };
        
        const response = await fetch("https://live.dodopayments.com/products", {
          method: "POST",
          headers: headers,
          body: JSON.stringify(dodoProduct)
        });
        
        const responseText = await response.text();
        let responseData;
        
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = { raw: responseText };
        }
        
        results.push({
          product: product.name,
          credits: product.credits,
          price: `$${(product.price / 100).toFixed(2)}`,
          plan_type: product.plan_type,
          status: response.status,
          success: response.ok,
          product_id: responseData.product_id || null,
          response: responseData,
          error_message: responseData.message || responseData.error || null,
          error_code: responseData.code || null,
          analysis: response.ok ? "✅ CREATED SUCCESSFULLY" : `❌ FAILED - ${response.status} ${response.statusText}`,
          payload_sent: dodoProduct
        });
        
        console.log(`✓ ${product.name}: ${response.status} ${response.ok ? 'SUCCESS' : 'FAILED'}`);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`✗ ${product.name} error:`, error);
        results.push({
          product: product.name,
          credits: product.credits,
          price: `$${(product.price / 100).toFixed(2)}`,
          plan_type: product.plan_type,
          error: error.message,
          analysis: "❌ NETWORK ERROR"
        });
      }
    }
    
    // Generate summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    return new Response(JSON.stringify({
      success: true,
      summary: {
        total_products: sproutcvProducts.length,
        successful_creations: successful,
        failed_creations: failed,
        success_rate: `${Math.round((successful / sproutcvProducts.length) * 100)}%`
      },
      products_created: results,
      recommendation: generateRecommendation(results),
      next_steps: generateNextSteps(results),
      timestamp: new Date().toISOString()
    }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });
    
  } catch (error) {
    console.error("Product creation failed:", error);
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});

function generateRecommendation(results: any[]): string {
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  if (successful.length === results.length) {
    return "🎉 ALL PRODUCTS CREATED SUCCESSFULLY! Update your frontend to use the new product IDs.";
  }
  
  if (successful.length > 0) {
    return `✅ ${successful.length}/${results.length} products created successfully. Check failed products and retry if needed.`;
  }
  
  if (failed.length === results.length) {
    const authErrors = failed.filter(r => r.status === 401);
    if (authErrors.length > 0) {
      return "❌ ALL FAILED - Authentication issue. Check API key.";
    }
    return "❌ ALL FAILED - Check product data format and API connectivity.";
  }
  
  return "⚠️ MIXED RESULTS - Review individual product creation results.";
}

function generateNextSteps(results: any[]): string[] {
  const successful = results.filter(r => r.success);
  const steps = [];
  
  if (successful.length > 0) {
    steps.push("1. Update frontend components with new product IDs");
    steps.push("2. Test payment creation with each product");
    steps.push("3. Update product mappings in payment functions");
  }
  
  const failed = results.filter(r => !r.success);
  if (failed.length > 0) {
    steps.push("4. Retry failed product creations");
    steps.push("5. Check Dodo dashboard for created products");
  }
  
  steps.push("6. Test end-to-end payment flow");
  steps.push("7. Update product selection UI");
  
  return steps;
}
