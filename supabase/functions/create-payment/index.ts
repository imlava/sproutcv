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

// Bulletproof product catalog
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
    console.log("=== BULLETPROOF DODO PAYMENT CREATION START ===");
    
    // STEP 1: Parse request with comprehensive error handling
    let body;
    try {
      const rawBody = await req.text();
      console.log("✓ Raw body received, length:", rawBody?.length || 0);
      
      if (!rawBody?.trim()) {
        return createErrorResponse("Empty request body", "EMPTY_BODY", 400);
      }
      
      body = JSON.parse(rawBody);
      console.log("✓ JSON parsed successfully");
    } catch (parseError) {
      console.error("✗ Parse error:", parseError);
      return createErrorResponse("Invalid JSON format", "INVALID_JSON", 400);
    }

    const { credits, amount, planType, test_mode } = body;

    // STEP 2: Enhanced input validation
    if (!credits || !amount) {
      console.error("✗ Missing required fields:", { credits: !!credits, amount: !!amount });
      return createErrorResponse("Missing required fields: credits or amount", "MISSING_FIELDS", 400);
    }

    if (credits <= 0 || amount <= 0) {
      console.error("✗ Invalid values:", { credits, amount });
      return createErrorResponse("Invalid values: credits and amount must be positive", "INVALID_VALUES", 400);
    }

    console.log("✓ Input validation passed:", { credits, amount, planType });

    // STEP 3: Validate against product catalog
    const validPlan = Object.values(PRODUCT_CATALOG.resume_credits.plans)
      .find(plan => plan.credits === credits && plan.price === amount);
    
    if (!validPlan) {
      console.warn("⚠️ Plan validation failed - proceeding with custom amount", { credits, amount });
    } else {
      console.log("✓ Plan validated:", validPlan);
    }

    // STEP 4: Environment validation with detailed checking
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const dodoApiKey = Deno.env.get("DODO_PAYMENTS_API_KEY");
    
    if (!supabaseUrl || !serviceKey || !dodoApiKey) {
      console.error("✗ Missing environment variables:", {
        supabaseUrl: !!supabaseUrl,
        serviceKey: !!serviceKey,
        dodoApiKey: !!dodoApiKey
      });
      return createErrorResponse("Server configuration error - missing environment variables", "CONFIG_ERROR", 500);
    }
    
    console.log("✓ Environment variables validated");

    // STEP 5: Initialize Supabase with error handling
    let supabaseAdmin;
    try {
      supabaseAdmin = createClient(supabaseUrl, serviceKey);
      console.log("✓ Supabase client initialized");
    } catch (clientError) {
      console.error("✗ Supabase client error:", clientError);
      return createErrorResponse("Database connection failed", "DB_ERROR", 500);
    }

    // STEP 6: Enhanced authentication with comprehensive validation
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("✗ Invalid authorization header format");
      return createErrorResponse("Invalid authorization header format", "AUTH_INVALID", 401);
    }

    const token = authHeader.replace("Bearer ", "");
    console.log("✓ Token extracted");

    let user;
    try {
      const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
      
      if (userError || !userData.user) {
        console.error("✗ Authentication failed:", userError);
        throw new Error(userError?.message || 'User authentication failed');
      }

      user = userData.user;
      console.log("✓ User authenticated:", user.id);
    } catch (authError) {
      console.error("✗ Authentication error:", authError);
      return createErrorResponse("User authentication failed", "AUTH_FAILED", 401);
    }

    // STEP 7: Get or create user profile with enhanced error handling
    let profile = null;
    try {
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.warn("⚠️ Profile fetch error:", profileError);
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
          console.error("✗ Failed to create profile:", createError);
          // Continue with user data as fallback
        } else {
          profile = newProfile;
          console.log("✓ Profile created");
        }
      } else {
        profile = profileData;
        console.log("✓ Profile loaded");
      }
    } catch (profileException) {
      console.error("⚠️ Profile handling exception:", profileException);
      // Continue with user data as fallback
    }

    // STEP 8: Enhanced Dodo Payments API integration
    const domain = getDomain();
    const dodoBaseUrl = test_mode 
      ? "https://api.sandbox.dodopayments.com" 
      : "https://api.dodopayments.com";

    console.log("✓ Dodo API configuration:", { baseUrl: dodoBaseUrl, testMode: !!test_mode, domain });

    // STEP 9: Prepare enhanced payment data
    const paymentData = {
      amount: amount, // Amount in cents
      currency: PRODUCT_CATALOG.resume_credits.currency,
      product_id: "resume_credits",
      quantity: 1,
      
      // Enhanced customer data
      customer: {
        email: profile?.email || user.email,
        name: profile?.full_name || user.email?.split('@')[0] || "Customer",
        id: user.id
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

    // STEP 10: Enhanced API call with bulletproof retry logic
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
              "User-Agent": "SproutCV/2.0"
            },
            body: JSON.stringify(paymentData)
          });

          console.log("✓ API response received:", response.status, response.statusText);

          if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            
            try {
              errorData = JSON.parse(errorText);
            } catch {
              errorData = { message: errorText };
            }

            console.error("✗ Dodo API error:", {
              status: response.status,
              statusText: response.statusText,
              headers: Object.fromEntries(response.headers.entries()),
              body: errorData,
              attempt
            });

            // Retry on server errors
            if (response.status >= 500 && attempt < retries) {
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
          console.error(`✗ Attempt ${attempt} failed:`, error);
          
          if (attempt === retries) {
            throw error;
          }
          
          // Network error - retry
          if (error.name === "TypeError" && attempt < retries) {
            const delay = Math.pow(2, attempt) * 1000;
            console.log(`Network error, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          throw error;
        }
      }
    };

    let payment;
    try {
      payment = await makeApiCall();
    } catch (apiError) {
      console.error("✗ All API attempts failed:", apiError);
      return createErrorResponse("Payment creation failed", "API_ERROR", 500, apiError.message);
    }

    // STEP 11: Enhanced payment response processing
    const paymentId = payment.payment_id || payment.id || payment.checkout_session_id || payment.session_id;
    const paymentUrl = payment.payment_url || payment.url || payment.checkout_url || payment.redirect_url;

    if (!paymentId || !paymentUrl) {
      console.error("✗ Invalid Dodo response:", payment);
      return createErrorResponse("Invalid response from Dodo Payments - missing payment ID or URL", "INVALID_RESPONSE", 500);
    }

    console.log("✓ Payment created:", { paymentId, hasUrl: !!paymentUrl });

    // STEP 12: Enhanced database record with comprehensive data
    let paymentRecord;
    try {
      const { data: saveData, error: paymentError } = await supabaseAdmin
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
            api_version: "v2",
            environment: test_mode ? "test" : "production"
          }
        })
        .select()
        .single();

      if (paymentError) {
        console.error("✗ Database error:", paymentError);
        throw paymentError;
      }

      paymentRecord = saveData;
      console.log("✓ Payment record saved:", paymentRecord.id);
    } catch (dbError) {
      console.error("✗ Failed to create payment record:", dbError);
      return createErrorResponse("Failed to create payment record", "DB_SAVE_ERROR", 500, dbError.message);
    }

    // STEP 13: Log security event (non-blocking)
    try {
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
      console.log("✓ Security event logged");
    } catch (secError) {
      console.warn("⚠️ Failed to log security event:", secError);
      // Don't fail the payment for logging issues
    }

    console.log("=== PAYMENT CREATION SUCCESS ===");

    // STEP 14: Enhanced response
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
      environment: test_mode ? "test" : "production",
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("=== CATASTROPHIC PAYMENT ERROR ===", error);
    
    return createErrorResponse(
      "Payment creation failed", 
      "CATASTROPHIC_ERROR", 
      500, 
      error.message
    );
  }
});

// Bulletproof error response creator
function createErrorResponse(message: string, code: string, status: number, details?: string) {
  console.error(`✗ Error ${status}: ${code} - ${message}`);
  return new Response(
    JSON.stringify({ 
      error: message,
      code,
      details,
      timestamp: new Date().toISOString(),
      success: false
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status,
    }
  );
}

// Product management utility functions
export async function getProductCatalog() {
  return PRODUCT_CATALOG;
}

export async function validatePlan(credits: number, amount: number) {
  return Object.values(PRODUCT_CATALOG.resume_credits.plans)
    .find(plan => plan.credits === credits && plan.price === amount);
}