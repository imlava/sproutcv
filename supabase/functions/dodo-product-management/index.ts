import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Product catalog management
const PRODUCT_CATALOG = {
  resume_credits: {
    id: "resume_credits",
    name: "Resume Analysis Credits",
    description: "AI-powered resume analysis and optimization credits",
    type: "service",
    active: true,
    plans: {
      starter: {
        id: "starter_5_credits",
        name: "Starter Pack",
        description: "Perfect for getting started",
        credits: 5,
        price: 500, // $5.00 in cents
        originalPrice: 750, // $7.50 showing savings
        currency: "USD",
        popular: false,
        features: [
          "AI Resume Analysis",
          "ATS Optimization",
          "Detailed Feedback",
          "Export Options"
        ]
      },
      pro: {
        id: "pro_15_credits",
        name: "Pro Pack",
        description: "Most popular choice",
        credits: 15,
        price: 1500, // $15.00 in cents
        originalPrice: 2250, // $22.50 showing savings
        currency: "USD",
        popular: true,
        features: [
          "Everything in Starter",
          "Priority Support",
          "Advanced Analytics",
          "Custom Templates"
        ]
      },
      premium: {
        id: "premium_30_credits",
        name: "Premium Pack",
        description: "Best value for power users",
        credits: 30,
        price: 2500, // $25.00 in cents
        originalPrice: 4500, // $45.00 showing savings
        currency: "USD",
        popular: false,
        features: [
          "Everything in Pro",
          "Unlimited Exports",
          "Personal Branding",
          "30-Day Analysis History"
        ]
      }
    },
    metadata: {
      category: "credits",
      tax_code: "txcd_10000000", // Digital services tax code
      unit_label: "credits"
    }
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== DODO PRODUCT MANAGEMENT API ===");
    
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'list';
    const productId = url.searchParams.get('product_id');
    const planId = url.searchParams.get('plan_id');

    // Environment validation
    const dodoApiKey = Deno.env.get("DODO_PAYMENTS_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!dodoApiKey || !supabaseUrl || !serviceKey) {
      throw new Error("Missing environment variables");
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // Authentication for admin operations
    if (req.method !== "GET") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        throw new Error("Authentication required for write operations");
      }

      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
      
      if (userError || !userData.user) {
        throw new Error("Authentication failed");
      }

      // Check if user is admin (you might want to add admin role checking)
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .single();

      if (profile?.role !== "admin") {
        throw new Error("Admin access required");
      }
    }

    const dodoBaseUrl = "https://api.dodopayments.com";

    switch (action) {
      case "list":
        return await listProducts();
        
      case "get":
        if (!productId) throw new Error("product_id required");
        return await getProduct(productId, planId);
        
      case "create":
        const createData = await req.json();
        return await createProduct(dodoBaseUrl, dodoApiKey, createData);
        
      case "update":
        if (!productId) throw new Error("product_id required");
        const updateData = await req.json();
        return await updateProduct(dodoBaseUrl, dodoApiKey, productId, updateData);
        
      case "sync":
        return await syncProductsToDodo(dodoBaseUrl, dodoApiKey);
        
      case "validate":
        const { credits, amount } = await req.json();
        return await validatePurchase(credits, amount);
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error("Product management error:", error);
    return new Response(JSON.stringify({ 
      error: "Operation failed",
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// List all products and plans
async function listProducts() {
  return new Response(JSON.stringify({
    success: true,
    products: PRODUCT_CATALOG,
    timestamp: new Date().toISOString()
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

// Get specific product or plan
async function getProduct(productId: string, planId?: string | null) {
  const product = PRODUCT_CATALOG[productId as keyof typeof PRODUCT_CATALOG];
  
  if (!product) {
    throw new Error(`Product ${productId} not found`);
  }

  let result = product;
  
  if (planId && product.plans) {
    const plan = product.plans[planId as keyof typeof product.plans];
    if (!plan) {
      throw new Error(`Plan ${planId} not found in product ${productId}`);
    }
    result = { ...product, selectedPlan: plan };
  }

  return new Response(JSON.stringify({
    success: true,
    product: result,
    timestamp: new Date().toISOString()
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

// Create product in Dodo Payments
async function createProduct(dodoBaseUrl: string, apiKey: string, productData: any) {
  const response = await fetch(`${dodoBaseUrl}/v1/products`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(productData)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Dodo API error: ${error}`);
  }

  const product = await response.json();
  
  return new Response(JSON.stringify({
    success: true,
    product,
    timestamp: new Date().toISOString()
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

// Update product in Dodo Payments
async function updateProduct(dodoBaseUrl: string, apiKey: string, productId: string, productData: any) {
  const response = await fetch(`${dodoBaseUrl}/v1/products/${productId}`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(productData)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Dodo API error: ${error}`);
  }

  const product = await response.json();
  
  return new Response(JSON.stringify({
    success: true,
    product,
    timestamp: new Date().toISOString()
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

// Sync local products to Dodo Payments
async function syncProductsToDodo(dodoBaseUrl: string, apiKey: string) {
  const results = [];
  
  for (const [productKey, product] of Object.entries(PRODUCT_CATALOG)) {
    try {
      // Check if product exists in Dodo
      const checkResponse = await fetch(`${dodoBaseUrl}/v1/products/${product.id}`, {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Accept": "application/json"
        }
      });

      let productResult;
      
      if (checkResponse.ok) {
        // Update existing product
        productResult = await updateProduct(dodoBaseUrl, apiKey, product.id, {
          name: product.name,
          description: product.description,
          active: product.active,
          metadata: product.metadata
        });
      } else {
        // Create new product
        productResult = await createProduct(dodoBaseUrl, apiKey, {
          id: product.id,
          name: product.name,
          description: product.description,
          type: product.type,
          active: product.active,
          metadata: product.metadata
        });
      }

      // Sync plans if they exist
      if (product.plans) {
        for (const [planKey, plan] of Object.entries(product.plans)) {
          try {
            // Create price for this plan
            const priceResponse = await fetch(`${dodoBaseUrl}/v1/prices`, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                product: product.id,
                currency: plan.currency,
                unit_amount: plan.price,
                nickname: plan.name,
                metadata: {
                  plan_id: plan.id,
                  credits: plan.credits.toString(),
                  popular: plan.popular.toString()
                }
              })
            });

            if (priceResponse.ok) {
              console.log(`✓ Price created for ${plan.name}`);
            }
          } catch (planError) {
            console.error(`Failed to sync plan ${planKey}:`, planError);
          }
        }
      }

      results.push({
        product: productKey,
        status: "success",
        id: product.id
      });

    } catch (error) {
      console.error(`Failed to sync product ${productKey}:`, error);
      results.push({
        product: productKey,
        status: "error",
        error: error.message
      });
    }
  }

  return new Response(JSON.stringify({
    success: true,
    results,
    timestamp: new Date().toISOString()
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

// Validate purchase against product catalog
async function validatePurchase(credits: number, amount: number) {
  const product = PRODUCT_CATALOG.resume_credits;
  const validPlan = Object.values(product.plans)
    .find(plan => plan.credits === credits && plan.price === amount);

  if (!validPlan) {
    return new Response(JSON.stringify({
      success: false,
      valid: false,
      message: "Invalid credits/amount combination",
      availablePlans: Object.values(product.plans).map(plan => ({
        id: plan.id,
        name: plan.name,
        credits: plan.credits,
        price: plan.price,
        currency: plan.currency
      }))
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  return new Response(JSON.stringify({
    success: true,
    valid: true,
    plan: validPlan,
    timestamp: new Date().toISOString()
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}
