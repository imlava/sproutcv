import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Enhanced domain detection with environment awareness
const getDomain = () => {
  const deploymentUrl = Deno.env.get("DEPLOYMENT_URL");
  if (deploymentUrl) return deploymentUrl;
  
  return 'https://sproutcv.app'; // Production default
};

// Product management configuration
const PRODUCT_CATALOG = {
  resume_credits: {
    plans: {
      starter: { credits: 5, price: 500, popular: false },    // $5.00
      pro: { credits: 15, price: 1500, popular: true },      // $15.00
      premium: { credits: 30, price: 2500, popular: false }   // $25.00
    },
    currency: "USD",
    description: "Resume Analysis Credits"
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== DODO PAYMENT CREATION START ===");
    
    const { credits, amount, planType, test_mode } = await req.json();

    // Enhanced input validation
    if (!credits || !amount) {
      throw new Error("Missing required fields: credits or amount");
    }

    if (credits <= 0 || amount <= 0) {
      throw new Error("Invalid values: credits and amount must be positive");
    }

    // Validate against product catalog
    const validPlan = Object.values(PRODUCT_CATALOG.resume_credits.plans)
      .find(plan => plan.credits === credits && plan.price === amount);
    
    if (!validPlan) {
      console.warn("Plan validation failed - proceeding with custom amount", { credits, amount });
    }

    // Environment validation
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const dodoApiKey = Deno.env.get("DODO_PAYMENTS_API_KEY");
    
    if (!supabaseUrl || !serviceKey || !dodoApiKey) {
      console.error("Missing environment variables:", {
        supabaseUrl: !!supabaseUrl,
        serviceKey: !!serviceKey,
        dodoApiKey: !!dodoApiKey
      });
      throw new Error("Server configuration error - missing environment variables");
    }

    // Initialize Supabase client
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // Enhanced authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Error("Invalid authorization header format");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !userData.user) {
      console.error("Authentication error:", userError);
      throw new Error("User authentication failed");
    }

    const user = userData.user;
    console.log("✓ User authenticated:", user.id);

    // Get or create user profile with enhanced error handling
    let profile: { full_name: string | null; email: string | null } | null = null;
    try {
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.warn("Profile fetch error:", profileError);
      }

      if (!profileData) {
        console.log("Creating minimal profile for user");
        const { data: newProfile, error: createError } = await supabaseAdmin
          .from("profiles")
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || "Customer"
          })
          .select("full_name, email")
          .single();

        if (createError) {
          console.error("Failed to create profile:", createError);
          // Continue with user data as fallback
        } else {
          profile = newProfile;
        }
      } else {
        profile = profileData;
      }
    } catch (profileException) {
      console.error("Profile handling exception:", profileException);
      // Continue with user data as fallback
    }

    console.log("✓ Profile processed");

    // Enhanced Dodo Payments API integration
    const domain = getDomain();
    const dodoBaseUrl = test_mode 
      ? "https://api.sandbox.dodopayments.com" 
      : "https://api.dodopayments.com";

    console.log("Using Dodo API:", { baseUrl: dodoBaseUrl, testMode: !!test_mode });

    // Enhanced payment data with product management
    const paymentData = {
      amount: amount, // Amount in cents
      currency: PRODUCT_CATALOG.resume_credits.currency,
      product_id: "resume_credits", // Product ID for Dodo
      quantity: 1,
      
      // Enhanced customer data
      customer: {
        email: profile?.email || user.email,
        name: profile?.full_name || user.email?.split('@')[0] || "Customer",
        id: user.id // Include user ID for reference
      },
      
      // Enhanced metadata for tracking
      metadata: {
        user_id: user.id,
        credits: credits.toString(),
        source: "web_app",
        product: "resume_credits",
        plan_type: planType || "custom",
        environment: test_mode ? "test" : "production",
        timestamp: new Date().toISOString()
      },
      
      // Enhanced URLs with better tracking
      success_url: `${domain}/payments?payment_id={payment_id}&status=success&amount=${amount}&credits=${credits}&source=dodo`,
      cancel_url: `${domain}/payments?payment_id={payment_id}&status=cancelled&source=dodo`,
      
      // Enhanced webhook configuration
      webhook_url: `${domain}/functions/v1/dodo-webhook`,
      webhook_events: ["payment.succeeded", "payment.failed", "payment.cancelled", "payment.pending"],
      
      // Product details
      description: `${credits} ${PRODUCT_CATALOG.resume_credits.description}`,
      line_items: [{
        name: `Resume Analysis Credits (${credits})`,
        description: `AI-powered resume analysis and optimization - ${credits} credits`,
        amount: amount,
        quantity: 1,
        product_id: "resume_credits"
      }],
      
      // Payment settings
      expires_in: 3600, // 1 hour
      payment_methods: ["card", "bank_transfer", "digital_wallet"],
      
      // Enhanced options
      options: {
        collect_billing_address: false,
        collect_shipping_address: false,
        allow_promotion_codes: true,
        billing_address_collection: "auto",
        phone_number_collection: {
          enabled: false
        }
      }
    };

    console.log("✓ Payment data prepared");
    console.log("Payment payload:", JSON.stringify(paymentData, null, 2));

    // Enhanced API call with retry logic
    const makeApiCall = async (retries = 3) => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          console.log(`API call attempt ${attempt}/${retries}`);
          
          const response = await fetch(`${dodoBaseUrl}/v1/checkout_sessions`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${dodoApiKey}`,
              "Content-Type": "application/json",
              "Accept": "application/json",
              "User-Agent": "SproutCV/1.0"
            },
            body: JSON.stringify(paymentData)
          });

          if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            
            try {
              errorData = JSON.parse(errorText);
            } catch {
              errorData = { message: errorText };
            }

            console.error("Dodo API error:", {
              status: response.status,
              statusText: response.statusText,
              headers: Object.fromEntries(response.headers.entries()),
              body: errorData,
              attempt
            });

            if (response.status >= 500 && attempt < retries) {
              // Retry on server errors
              const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
              console.log(`Retrying in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }

            throw new Error(`Dodo API error ${response.status}: ${errorData.message || errorText}`);
          }

          const payment = await response.json();
          console.log("✓ Dodo payment created successfully");
          return payment;

        } catch (error) {
          console.error(`Attempt ${attempt} failed:`, error);
          
          if (attempt === retries) {
            throw error;
          }
          
          if (error.name === "TypeError" && attempt < retries) {
            // Network error - retry
            const delay = Math.pow(2, attempt) * 1000;
            console.log(`Network error, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          throw error;
        }
      }
    };

    const payment = await makeApiCall();

    // Enhanced payment response processing
    const paymentId = payment.payment_id || payment.id || payment.checkout_session_id || payment.session_id;
    const paymentUrl = payment.payment_url || payment.url || payment.checkout_url || payment.redirect_url;

    if (!paymentId || !paymentUrl) {
      console.error("Invalid Dodo response:", payment);
      throw new Error("Invalid response from Dodo Payments - missing payment ID or URL");
    }

    console.log("Payment created:", { paymentId, hasUrl: !!paymentUrl });

    // Enhanced database record with comprehensive data
    const { data: paymentRecord, error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: user.id,
        // Dual field population for compatibility
        stripe_session_id: paymentId, // Legacy compatibility
        payment_provider_id: paymentId, // Primary reference
        amount: amount,
        credits_purchased: credits,
        status: "pending",
        payment_method: "dodo_payments",
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
        payment_data: {
          ...payment,
          plan_type: planType,
          created_via: "api",
          api_version: "v1",
          environment: test_mode ? "test" : "production"
        }
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Database error:", paymentError);
      throw new Error("Failed to create payment record");
    }

    console.log("✓ Payment record saved:", paymentRecord.id);

    // Log security event
    await supabaseAdmin
      .from("security_events")
      .insert({
        user_id: user.id,
        event_type: "payment_initiated",
        metadata: {
          payment_id: paymentId,
          amount: amount,
          credits: credits,
          payment_method: "dodo_payments",
          plan_type: planType
        }
      });

    console.log("=== PAYMENT CREATION SUCCESS ===");

    // Enhanced response
    return new Response(JSON.stringify({
      success: true,
      paymentId: paymentId,
      url: paymentUrl,
      amount: amount,
      credits: credits,
      currency: PRODUCT_CATALOG.resume_credits.currency,
      paymentMethod: "dodo_payments",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      recordId: paymentRecord.id,
      environment: test_mode ? "test" : "production"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("=== PAYMENT CREATION ERROR ===", error);
    
    return new Response(JSON.stringify({ 
      error: "Payment creation failed",
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// Product management API endpoints (could be separate function)
export async function getProductCatalog() {
  return PRODUCT_CATALOG;
}

export async function validatePlan(credits: number, amount: number) {
  return Object.values(PRODUCT_CATALOG.resume_credits.plans)
    .find(plan => plan.credits === credits && plan.price === amount);
}