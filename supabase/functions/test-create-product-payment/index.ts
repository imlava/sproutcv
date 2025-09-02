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
    const dodoApiKey = Deno.env.get("DODO_PAYMENTS_API_KEY");
    if (!dodoApiKey) {
      return new Response(JSON.stringify({ 
        error: "API key not configured" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      });
    }

    console.log("🎯 Creating product and payment...");

    // STEP 1: Create a simple product first
    const productData = {
      name: "SproutCV Credits - 5 Pack",
      description: "5 resume analysis credits for SproutCV",
      
      // CRITICAL: Price must be an object, not integer
      price: {
        type: "one_time_price",
        price: 500,
        currency: "USD",
        tax_inclusive: false,
        discount: 0,
        purchasing_power_parity: false,
        pay_what_you_want: false,
        suggested_price: null
      },
      
      tax_category: "saas", // Software as a Service
      is_recurring: false,
      
      metadata: {
        credits: "5",
        source: "sproutcv_dynamic",
        plan_type: "starter"
      }
    };

    console.log("📦 Creating product:", JSON.stringify(productData, null, 2));

    const productResponse = await fetch("https://live.dodopayments.com/products", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${dodoApiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(productData)
    });

    const productText = await productResponse.text();
    let product;
    
    try {
      product = JSON.parse(productText);
    } catch {
      product = { raw: productText };
    }

    console.log(`📦 Product creation: ${productResponse.status} ${productResponse.statusText}`);
    console.log("📄 Product response:", product);

    if (!productResponse.ok) {
      return new Response(JSON.stringify({
        success: false,
        step: "product_creation",
        error: `Product creation failed: ${productResponse.status} ${productResponse.statusText}`,
        details: product,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      });
    }

    // Extract product ID
    const productId = product.id || product.product_id;
    if (!productId) {
      return new Response(JSON.stringify({
        success: false,
        step: "product_extraction",
        error: "No product ID in response",
        product_response: product,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      });
    }

    console.log(`✅ Product created with ID: ${productId}`);

    // STEP 2: Create payment using the product
    const paymentData = {
      customer: {
        email: "test@sproutcv.app",
        name: "Test Customer"
      },
      
      // Required billing information
      billing: {
        city: "New York",
        country: "US",
        state: "NY",
        street: "123 Main St",
        zipcode: "10001"
      },
      
      product_cart: [
        {
          product_id: productId,
          quantity: 1
        }
      ],
      
      return_url: "https://sproutcv.app/payments?status=success&source=dynamic",
      
      metadata: {
        credits: "5",
        source: "sproutcv_dynamic_test",
        plan_type: "starter"
      }
    };

    console.log("💳 Creating payment:", JSON.stringify(paymentData, null, 2));

    const paymentResponse = await fetch("https://live.dodopayments.com/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${dodoApiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(paymentData)
    });

    const paymentText = await paymentResponse.text();
    let payment;
    
    try {
      payment = JSON.parse(paymentText);
    } catch {
      payment = { raw: paymentText };
    }

    console.log(`💳 Payment creation: ${paymentResponse.status} ${paymentResponse.statusText}`);
    console.log("📄 Payment response:", payment);

    if (!paymentResponse.ok) {
      return new Response(JSON.stringify({
        success: false,
        step: "payment_creation",
        error: `Payment creation failed: ${paymentResponse.status} ${paymentResponse.statusText}`,
        details: payment,
        product_created: { id: productId, data: product },
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      });
    }

    // SUCCESS! Extract payment fields
    const paymentId = payment.payment_id || payment.id;
    const checkoutUrl = payment.checkout_url || payment.payment_url || payment.url;

    return new Response(JSON.stringify({
      success: true,
      paymentId: paymentId,
      url: checkoutUrl,
      amount: 500,
      credits: 5,
      planType: "starter",
      
      // Debug info
      product_created: {
        id: productId,
        name: product.name || "Unknown"
      },
      payment_response: payment,
      fields_found: {
        payment_id: !!payment.payment_id,
        id: !!payment.id,
        checkout_url: !!payment.checkout_url,
        payment_url: !!payment.payment_url,
        url: !!payment.url
      },
      
      timestamp: new Date().toISOString(),
      version: "create-product-payment-v1.0"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });

  } catch (error) {
    console.error("Create product payment error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
